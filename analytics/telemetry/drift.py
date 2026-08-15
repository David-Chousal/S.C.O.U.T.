"""Biofouling drift screening for the optical (turbidity) channel.

Biofilm micrometers thick on an optical window is enough to bias a moored turbidity sensor,
and the bias grows over weeks as colonization advances (Manov, Chang & Dickey 2004). The
danger for S.C.O.U.T. is that this drift is **monotonic**, so it looks exactly like a real
creeping-turbidity trend to the Mann-Kendall test in :mod:`telemetry.trends` — and every
individual reading passes the gross-range, flat-line, and rate-of-change tests in
:mod:`telemetry.qc`. Nothing else in the pipeline would catch it.

The discriminator used here is the **daily clean-water reading**: a high percentile of each
day's samples, which approximates the clearest water the sensor saw that day. A *high*
percentile because a lower ADC count is dirtier water — the SEN0189's output falls as
turbidity rises (see :mod:`telemetry.turbidity` for the datasheet wording), so the clearest
water of a day is its largest reading.

Genuine turbidity is *episodic*: runoff and resuspension pull readings down and they settle
back, leaving the day's clearest reading where it was. Fouling instead moves that clearest
reading itself, because a coated window can no longer transmit clean water as clean — the
sensor loses its ceiling. A monotonic march in the clean-water reading is therefore the
fouling signature, and it is tested with the same Mann-Kendall machinery as everything else.

Manov et al.'s method is cross-comparison against a complementary measurement, so the daily
temperature series acts as the independent, non-optical reference: the DS18B20 is a sealed
digital probe that does not suffer optical-window fouling. If temperature is *also* trending,
a genuine environmental regime change may explain the turbidity floor and the two causes
cannot be separated from one buoy — so the verdict is downgraded rather than asserted.

**Detection stays direction-agnostic even though the polarity is now settled.** Fouling should
drive the clean-water reading *down* (less light through a coated window). The screen still
flags a march in either direction, because the analog front end between the sensor and the ADC
is not designed yet (ADR-0002) — an inverting stage there would flip the sign, and a screen
that only looked one way would then see nothing. A rising clean-water reading is reported as
*inconsistent with fouling*, which is itself worth knowing: it points at a cleaned or replaced
sensor, a wiring change, or an inverting front end.

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

# A high percentile, not the maximum — the maximum is one sample and rides on sensor noise.
# High rather than low because a larger ADC count is *clearer* water on the SEN0189.
CLEAN_WATER_PERCENTILE = 0.90
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
    clean_water_trend: TrendResult  # Mann-Kendall on the daily clearest-water reading
    reference_trend: TrendResult  # the independent, non-optical channel (temperature)
    clean_water_slope_per_year: float | None  # signed; falling is the fouling direction
    n_days: int
    rationale: str
    note: str = _NOTE


def daily_clean_water_reading(
    records: list[TelemetryRecord],
    *,
    percentile: float = CLEAN_WATER_PERCENTILE,
    min_samples: int = MIN_SAMPLES_PER_DAY,
) -> list[tuple[date, float]]:
    """Per-day high-percentile turbidity — the day's clearest water, robust to events."""
    by_day: dict[date, list[float]] = defaultdict(list)
    for record in records:
        if record.turbidity_adc is not None:
            by_day[record.timestamp.date()].append(float(record.turbidity_adc))

    clean: list[tuple[date, float]] = []
    for day in sorted(by_day):
        values = sorted(by_day[day])
        if len(values) < min_samples:
            continue
        clean.append((day, values[int(percentile * (len(values) - 1))]))
    return clean


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
    clean_water = daily_clean_water_reading(records)
    reference = _daily_mean_temp(records) if reference_series is None else reference_series
    reference_trend = mann_kendall(reference)

    if len(clean_water) < MIN_DRIFT_DAYS:
        return DriftAssessment(
            verdict=DRIFT_INSUFFICIENT,
            clean_water_trend=mann_kendall(clean_water),
            reference_trend=reference_trend,
            clean_water_slope_per_year=None,
            n_days=len(clean_water),
            rationale=(
                f"{len(clean_water)} usable day(s) of turbidity; fouling drift is a weeks-scale "
                f"process needing at least {MIN_DRIFT_DAYS}."
            ),
        )

    clean_water_trend = mann_kendall(clean_water)
    moving = clean_water_trend.label in ("increasing", "decreasing")
    marginal = clean_water_trend.label.startswith("marginal")
    reference_moving = reference_trend.label in ("increasing", "decreasing")
    # Fouling attenuates light, so it drives the clearest-water reading DOWN. A rise is a
    # real finding too, just not this one — see the module docstring.
    direction = (
        "consistent with fouling"
        if clean_water_trend.label.endswith("decreasing")
        else "rising, which is inconsistent with fouling — check for a cleaned or swapped "
        "sensor, a wiring change, or an inverting analog front end"
    )

    if moving and not reference_moving:
        verdict = DRIFT_LIKELY
        rationale = (
            f"The clean-water reading is {clean_water_trend.label} "
            f"(p={clean_water_trend.p_value}) while the independent temperature channel is "
            f"stationary, so the shift has no environmental correlate — {direction}."
        )
    elif moving:
        verdict = DRIFT_SUSPECT
        rationale = (
            f"The clean-water reading is {clean_water_trend.label} "
            f"(p={clean_water_trend.p_value}) and {direction}, but temperature is also "
            f"{reference_trend.label}, so a genuine environmental change may explain it. "
            "One buoy cannot separate the two."
        )
    elif marginal:
        verdict = DRIFT_SUSPECT
        rationale = (
            f"The clean-water reading is {clean_water_trend.label} "
            f"(p={clean_water_trend.p_value}) — worth watching, not yet conclusive."
        )
    else:
        verdict = DRIFT_NONE
        rationale = (
            "The clean-water reading is stationary; turbidity variation is episodic, which is "
            "what real runoff and resuspension look like."
        )

    return DriftAssessment(
        verdict=verdict,
        clean_water_trend=clean_water_trend,
        reference_trend=reference_trend,
        clean_water_slope_per_year=clean_water_trend.slope_per_year,
        n_days=len(clean_water),
        rationale=rationale,
    )


def _daily_mean_temp(records: list[TelemetryRecord]) -> list[tuple[date, float]]:
    by_day: dict[date, list[float]] = defaultdict(list)
    for record in records:
        if record.temp_c is not None:
            by_day[record.timestamp.date()].append(record.temp_c)
    return [(day, statistics.fmean(by_day[day])) for day in sorted(by_day)]
