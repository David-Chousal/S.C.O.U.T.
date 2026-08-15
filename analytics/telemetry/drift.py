"""Biofouling drift screening for the optical (turbidity) channel.

Biofilm micrometers thick on an optical window is enough to bias a moored turbidity sensor,
and the bias grows over weeks as colonization advances (Manov, Chang & Dickey 2004). The
danger for S.C.O.U.T. is that this drift is **monotonic**, so it looks exactly like a real
creeping-turbidity trend to the Mann-Kendall test in :mod:`telemetry.trends` — and every
individual reading passes the gross-range, flat-line, and rate-of-change tests in
:mod:`telemetry.qc`. Nothing else in the pipeline would catch it.

The discriminator used here is the **daily clean-water floor**: a low percentile of each
day's samples, which approximates the clearest water that day. Genuine turbidity is
*episodic* — runoff and resuspension spike the upper tail and then settle back, leaving the
floor where it was. Fouling instead lifts (or lowers) the floor itself, because a coated
sensor can no longer read clean water as clean. A monotonic march in the floor is therefore
the fouling signature, and it is tested with the same Mann-Kendall machinery as everything
else.

Manov et al.'s method is cross-comparison against a complementary measurement, so the daily
temperature series acts as the independent, non-optical reference: the DS18B20 is a sealed
digital probe that does not suffer optical-window fouling. If temperature is *also* trending,
a genuine environmental regime change may explain the turbidity floor and the two causes
cannot be separated from one buoy — so the verdict is downgraded rather than asserted.

**Direction is deliberately not assumed.** Whether fouling pushes ``turbidity_adc`` up or
down depends on the SEN0189's ADC→turbidity polarity, which is not yet settled in the repo
(see the open question raised alongside this module). A persistent monotonic march is the
signal either way, so this screen flags both signs and reports which one it saw.

This screen reports; it never corrects. And it is a *screen*, not proof: a lone buoy has no
clean reference, which is exactly the gap tracked by SCO-20.

Standard library only.

References:
    Manov, D., Chang, G. & Dickey, T. (2004). Methods for reducing biofouling of moored
        optical sensors. *J. Atmos. Oceanic Technol.* 21(6), 958-968.
    U.S. IOOS (2017). Real-time QC for optical observations. doi:10.25923/v9p8-ft24
"""

from __future__ import annotations

import statistics
from collections import defaultdict
from dataclasses import dataclass
from datetime import date

from .model import TelemetryRecord
from .trends import TrendResult, mann_kendall

# A low percentile, not the minimum — the minimum is one sample and rides on sensor noise.
CLEAN_WATER_PERCENTILE = 0.10
MIN_SAMPLES_PER_DAY = 6  # below this a daily percentile is not a baseline, it is a guess
MIN_DRIFT_DAYS = 14  # fouling is a weeks-scale process; less cannot support a verdict

DRIFT_INSUFFICIENT = "insufficient data"
DRIFT_NONE = "no drift detected"
DRIFT_SUSPECT = "suspect"
DRIFT_LIKELY = "likely"

_NOTE = (
    "Screen, not proof — a lone buoy carries no clean reference sensor, so a genuine "
    "long-term turbidity change cannot be fully separated from instrument drift (SCO-20)."
)


@dataclass(frozen=True)
class DriftAssessment:
    """Whether the turbidity channel's baseline is marching the way fouling would."""

    verdict: str
    floor_trend: TrendResult  # Mann-Kendall on the daily clean-water floor
    reference_trend: TrendResult  # the independent, non-optical channel (temperature)
    floor_slope_per_year: float | None  # signed — direction depends on sensor polarity
    n_days: int
    rationale: str
    note: str = _NOTE


def daily_clean_water_floor(
    records: list[TelemetryRecord],
    *,
    percentile: float = CLEAN_WATER_PERCENTILE,
    min_samples: int = MIN_SAMPLES_PER_DAY,
) -> list[tuple[date, float]]:
    """Per-day low-percentile turbidity — the day's clearest water, robust to events."""
    by_day: dict[date, list[float]] = defaultdict(list)
    for record in records:
        if record.turbidity_adc is not None:
            by_day[record.timestamp.date()].append(float(record.turbidity_adc))

    floor: list[tuple[date, float]] = []
    for day in sorted(by_day):
        values = sorted(by_day[day])
        if len(values) < min_samples:
            continue
        floor.append((day, values[int(percentile * (len(values) - 1))]))
    return floor


def assess_drift(
    records: list[TelemetryRecord],
    *,
    reference_series: list[tuple[date, float]] | None = None,
) -> DriftAssessment:
    """Screen the turbidity channel for the monotonic baseline march fouling produces.

    ``reference_series`` is the independent daily comparator (temperature); it defaults to a
    daily mean computed here, so the function stands alone for direct callers while the
    pipeline can hand in the aggregate it already built.
    """
    floor = daily_clean_water_floor(records)
    reference = _daily_mean_temp(records) if reference_series is None else reference_series
    reference_trend = mann_kendall(reference)

    if len(floor) < MIN_DRIFT_DAYS:
        return DriftAssessment(
            verdict=DRIFT_INSUFFICIENT,
            floor_trend=mann_kendall(floor),
            reference_trend=reference_trend,
            floor_slope_per_year=None,
            n_days=len(floor),
            rationale=(
                f"{len(floor)} usable day(s) of turbidity; fouling drift is a weeks-scale "
                f"process needing at least {MIN_DRIFT_DAYS}."
            ),
        )

    floor_trend = mann_kendall(floor)
    floor_moving = floor_trend.label in ("increasing", "decreasing")
    floor_marginal = floor_trend.label.startswith("marginal")
    reference_moving = reference_trend.label in ("increasing", "decreasing")

    if floor_moving and not reference_moving:
        verdict = DRIFT_LIKELY
        rationale = (
            f"The clean-water floor is {floor_trend.label} (p={floor_trend.p_value}) while "
            "the independent temperature channel is stationary, so the baseline shift has no "
            "environmental correlate — the signature of a fouling sensor."
        )
    elif floor_moving:
        verdict = DRIFT_SUSPECT
        rationale = (
            f"The clean-water floor is {floor_trend.label} (p={floor_trend.p_value}), but "
            f"temperature is also {reference_trend.label}, so a genuine environmental change "
            "may explain it. One buoy cannot separate the two."
        )
    elif floor_marginal:
        verdict = DRIFT_SUSPECT
        rationale = (
            f"The clean-water floor is {floor_trend.label} (p={floor_trend.p_value}) — worth "
            "watching, not yet conclusive."
        )
    else:
        verdict = DRIFT_NONE
        rationale = (
            "The clean-water floor is stationary; turbidity variation is episodic, which is "
            "what real runoff and resuspension look like."
        )

    return DriftAssessment(
        verdict=verdict,
        floor_trend=floor_trend,
        reference_trend=reference_trend,
        floor_slope_per_year=floor_trend.slope_per_year,
        n_days=len(floor),
        rationale=rationale,
    )


def _daily_mean_temp(records: list[TelemetryRecord]) -> list[tuple[date, float]]:
    by_day: dict[date, list[float]] = defaultdict(list)
    for record in records:
        if record.temp_c is not None:
            by_day[record.timestamp.date()].append(record.temp_c)
    return [(day, statistics.fmean(by_day[day])) for day in sorted(by_day)]
