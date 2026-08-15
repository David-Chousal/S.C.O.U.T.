"""Quality control for a telemetry record stream.

QC is not cosmetic here: Degree Heating Weeks and Mann-Kendall trends are both biased by
undetected gaps and out-of-range readings, so this stage quantifies data completeness and
flags suspect values *before* any science runs. It only measures and reports — it never
silently drops or "repairs" data.

Alongside completeness and gross-range screening, each sensor channel gets the two QARTOD
tests that catch a failing sensor rather than bad water: **flat-line** (a stuck channel
repeating one value) and **rate-of-change** (a step no real process could produce). Both come
from the IOOS QARTOD manuals, which name biofouling and calibration drift as the central
data-quality threats these tests exist to surface. Slow fouling *drift* — which passes both
of these because every individual reading looks fine — is screened separately in
:mod:`telemetry.drift`.

Standard library only.

Reference:
    U.S. IOOS (2017). *Manual for Real-Time Quality Control of In-Situ Surface Wave Data* /
        optical observations QC manual. doi:10.25923/v9p8-ft24
"""

from __future__ import annotations

import statistics
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from .model import EXPECTED_INTERVAL_S, TelemetryRecord

# Physical-plausibility bounds (sensor sanity, NOT science thresholds). A reading outside
# these is almost certainly a fault, air exposure, or wiring issue, not real water.
TEMP_PLAUSIBLE_C = (-5.0, 45.0)
TURBIDITY_ADC_RANGE = (0, 4095)  # 12-bit SAMD21 ADC
# A gap is any gap longer than 1.5 duty cycles — tolerant of small scheduling jitter.
GAP_FACTOR = 1.5


@dataclass(frozen=True)
class ChannelQCConfig:
    """Per-channel QARTOD thresholds.

    QARTOD deliberately leaves these to the operator — they are deployment- and
    sensor-specific. The defaults below are set for S.C.O.U.T.'s 30-minute cadence:
    a channel repeating one value for 3 h is suspect, 6 h is a fault. Real reef water at
    the DS18B20's 0.0625 °C resolution can hold steady for an hour or two overnight, so
    shorter counts would flag calm water as a broken sensor.
    """

    flat_line_suspect: int = 6  # consecutive equal samples ≈ 3 h at the 30-min cadence
    flat_line_fail: int = 12  # ≈ 6 h — no longer credible as real water
    flat_line_eps: float = 0.0  # "unchanged" at the sensor's own quantization
    roc_enabled: bool = True
    roc_deviations: float = 3.0  # QARTOD n-sigma against the rolling window
    roc_window_h: float = 25.0  # QARTOD's recommended rolling window
    roc_min_window: int = 10  # below this the window SD is not a usable yardstick


# Rate-of-change is a *smooth-channel* test: it asks whether a step is too large to be
# physical. Water temperature qualifies. Turbidity does not — runoff and resuspension are
# genuinely abrupt, so an n-sigma rule fires on weather rather than on sensor faults (on the
# 30-day shore sample it flagged ~12% of turbidity samples and 0% of temperature). Turbidity's
# excursions are already detected in :mod:`telemetry.turbidity` with a purpose-built robust
# (median/MAD) statistic, so running both would double-report the same events with weaker math.
# What the turbidity channel still gets here is the flat-line test, which catches a stuck or
# saturated sensor, plus the slow-drift screen in :mod:`telemetry.drift` — the two failure
# modes that actually indicate fouling.
CHANNEL_CONFIGS: dict[str, ChannelQCConfig] = {
    "temp_c": ChannelQCConfig(),
    "turbidity_adc": ChannelQCConfig(roc_enabled=False),
}


@dataclass(frozen=True)
class ChannelQC:
    """QARTOD flat-line and rate-of-change outcome for one sensor channel."""

    channel: str
    n_samples: int
    flat_line_suspect_runs: int
    flat_line_fail_runs: int
    longest_flat_run: int
    rate_of_change_suspect: int
    not_evaluated: int  # samples the rate-of-change test could not judge (gap, cold start)


@dataclass(frozen=True)
class Gap:
    start: datetime  # last good sample before the gap
    end: datetime  # first sample after the gap
    missing: int  # estimated number of missed samples

    @property
    def duration(self) -> timedelta:
        return self.end - self.start


@dataclass
class QCReport:
    n_records: int = 0
    first: datetime | None = None
    last: datetime | None = None
    expected_records: int = 0
    completeness_pct: float = 0.0
    duplicate_timestamps: int = 0
    gaps: list[Gap] = field(default_factory=list)
    temp_missing: int = 0
    temp_out_of_range: int = 0
    turbidity_out_of_range: int = 0
    battery_missing: int = 0
    flag_counts: dict[str, int] = field(default_factory=dict)
    soh_counts: dict[str, int] = field(default_factory=dict)
    channels: dict[str, ChannelQC] = field(default_factory=dict)

    @property
    def total_missing(self) -> int:
        return sum(g.missing for g in self.gaps)


def run_qc(
    records: list[TelemetryRecord],
    *,
    interval_s: int = EXPECTED_INTERVAL_S,
) -> QCReport:
    """Assess a (any-order) list of records; returns a :class:`QCReport`."""
    if not records:
        return QCReport()

    ordered = sorted(records, key=lambda r: r.timestamp)
    first, last = ordered[0].timestamp, ordered[-1].timestamp
    interval = timedelta(seconds=interval_s)

    # Expected count if the buoy had sampled on cadence for the whole span.
    span_s = (last - first).total_seconds()
    expected = int(round(span_s / interval_s)) + 1

    duplicates = 0
    gaps: list[Gap] = []
    prev: datetime | None = None
    for rec in ordered:
        if prev is not None:
            delta = (rec.timestamp - prev).total_seconds()
            if delta == 0:
                duplicates += 1
            elif delta > interval_s * GAP_FACTOR:
                missing = int(round(delta / interval_s)) - 1
                gaps.append(Gap(start=prev, end=rec.timestamp, missing=max(missing, 1)))
        prev = rec.timestamp

    temp_missing = sum(1 for r in ordered if r.temp_c is None)
    temp_oor = sum(
        1 for r in ordered if r.temp_c is not None and not _in_range(r.temp_c, TEMP_PLAUSIBLE_C)
    )
    turb_oor = sum(
        1
        for r in ordered
        if r.turbidity_adc is not None and not _in_range(r.turbidity_adc, TURBIDITY_ADC_RANGE)
    )
    battery_missing = sum(1 for r in ordered if r.battery_v is None)

    flag_counts: Counter[str] = Counter()
    soh_counts: Counter[str] = Counter()
    for r in ordered:
        flag_counts.update(r.flags)
        soh_counts.update(r.soh)

    channels = {
        "temp_c": evaluate_channel(
            [(r.timestamp, float(r.temp_c)) for r in ordered if r.temp_c is not None],
            channel="temp_c",
            interval_s=interval_s,
        ),
        "turbidity_adc": evaluate_channel(
            [
                (r.timestamp, float(r.turbidity_adc))
                for r in ordered
                if r.turbidity_adc is not None
            ],
            channel="turbidity_adc",
            interval_s=interval_s,
        ),
    }

    completeness = 100.0 * len(ordered) / expected if expected else 0.0
    return QCReport(
        n_records=len(ordered),
        first=first,
        last=last,
        expected_records=expected,
        completeness_pct=round(min(completeness, 100.0), 2),
        duplicate_timestamps=duplicates,
        gaps=gaps,
        temp_missing=temp_missing,
        temp_out_of_range=temp_oor,
        turbidity_out_of_range=turb_oor,
        battery_missing=battery_missing,
        flag_counts=dict(flag_counts),
        soh_counts=dict(soh_counts),
        channels=channels,
    )


def evaluate_channel(
    samples: list[tuple[datetime, float]],
    *,
    channel: str,
    config: ChannelQCConfig | None = None,
    interval_s: int = EXPECTED_INTERVAL_S,
) -> ChannelQC:
    """Run the QARTOD flat-line and rate-of-change tests over one channel's samples."""
    config = config or CHANNEL_CONFIGS.get(channel, ChannelQCConfig())
    ordered = sorted(samples, key=lambda s: s[0])
    suspect_runs, fail_runs, longest = _flat_line_runs([v for _, v in ordered], config)
    if config.roc_enabled:
        roc_suspect, not_evaluated = _rate_of_change(ordered, config, interval_s)
    else:  # not run for this channel — every sample is honestly "not evaluated"
        roc_suspect, not_evaluated = 0, len(ordered)
    return ChannelQC(
        channel=channel,
        n_samples=len(ordered),
        flat_line_suspect_runs=suspect_runs,
        flat_line_fail_runs=fail_runs,
        longest_flat_run=longest,
        rate_of_change_suspect=roc_suspect,
        not_evaluated=not_evaluated,
    )


def _flat_line_runs(values: list[float], config: ChannelQCConfig) -> tuple[int, int, int]:
    """Return (suspect runs, fail runs, longest run) of consecutive unchanging values.

    A run is counted once, at its highest severity — a 12-sample stuck run is one failure,
    not one failure plus a suspect.
    """
    if not values:
        return 0, 0, 0

    suspect = fail = 0
    longest = run = 1

    def close(run_length: int) -> None:
        nonlocal suspect, fail
        if run_length >= config.flat_line_fail:
            fail += 1
        elif run_length >= config.flat_line_suspect:
            suspect += 1

    for prev, curr in zip(values, values[1:]):
        if abs(curr - prev) <= config.flat_line_eps:
            run += 1
        else:
            close(run)
            longest = max(longest, run)
            run = 1
    close(run)
    return suspect, fail, max(longest, run)


def _rate_of_change(
    samples: list[tuple[datetime, float]],
    config: ChannelQCConfig,
    interval_s: int,
) -> tuple[int, int]:
    """Return (suspect count, not-evaluated count) for step changes against a rolling SD.

    A sample is only judged when the preceding window is populated enough to yield a
    meaningful spread *and* the previous sample is one cadence back — a jump across a data
    gap is a legitimately larger change, not a fault.
    """
    window = timedelta(hours=config.roc_window_h)
    max_step_s = interval_s * GAP_FACTOR
    suspect = not_evaluated = 0
    start = 0

    for i, (timestamp, value) in enumerate(samples):
        if i == 0:
            not_evaluated += 1
            continue
        while start < i and timestamp - samples[start][0] > window:
            start += 1

        prev_timestamp, prev_value = samples[i - 1]
        delta_s = (timestamp - prev_timestamp).total_seconds()
        prior = [v for _, v in samples[start:i]]
        if delta_s <= 0 or delta_s > max_step_s or len(prior) < config.roc_min_window:
            not_evaluated += 1
            continue

        spread = statistics.stdev(prior)
        if spread <= 0:  # a perfectly flat window — the flat-line test owns this case
            not_evaluated += 1
            continue
        if abs(value - prev_value) > config.roc_deviations * spread:
            suspect += 1

    return suspect, not_evaluated


def _in_range(value: float, bounds: tuple[float, float]) -> bool:
    lo, hi = bounds
    return lo <= value <= hi
