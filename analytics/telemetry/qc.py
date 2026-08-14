"""Quality control for a telemetry record stream.

QC is not cosmetic here: Degree Heating Weeks and Mann-Kendall trends are both biased by
undetected gaps and out-of-range readings, so this stage quantifies data completeness and
flags suspect values *before* any science runs. It only measures and reports — it never
silently drops or "repairs" data.

Standard library only.
"""

from __future__ import annotations

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
    for r in ordered:
        flag_counts.update(r.flags)

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
    )


def _in_range(value: float, bounds: tuple[float, float]) -> bool:
    lo, hi = bounds
    return lo <= value <= hi
