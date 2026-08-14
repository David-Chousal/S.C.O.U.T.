"""Aggregate 30-minute records into daily values for DHW and trend analysis.

A day is only given a temperature mean if enough of its samples are present — a half-empty
day would otherwise contribute a biased daily SST straight into Degree Heating Weeks. Days
below the coverage floor keep their slot on the calendar (so gaps stay visible) but carry
``temp_mean = None``.

Standard library only.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass
from datetime import date

from .model import EXPECTED_INTERVAL_S, TelemetryRecord
from .qc import TEMP_PLAUSIBLE_C, _in_range

SAMPLES_PER_DAY = 86_400 // EXPECTED_INTERVAL_S  # 48 at a 30-min cadence
# Minimum fraction of a day's samples required to trust its daily mean.
DEFAULT_MIN_COVERAGE = 0.5


@dataclass(frozen=True)
class DailyAggregate:
    day: date
    temp_mean: float | None  # None if the day fell below the coverage floor
    temp_n: int  # valid, in-range temperature samples used
    coverage: float  # temp_n / SAMPLES_PER_DAY, capped at 1.0
    turbidity_median_adc: float | None
    battery_min_v: float | None
    n_samples: int  # all records on the day, regardless of validity


def aggregate_daily(
    records: list[TelemetryRecord],
    *,
    min_coverage: float = DEFAULT_MIN_COVERAGE,
    samples_per_day: int = SAMPLES_PER_DAY,
) -> list[DailyAggregate]:
    """Group records by UTC calendar day and reduce each to a :class:`DailyAggregate`."""
    by_day: dict[date, list[TelemetryRecord]] = {}
    for rec in records:
        by_day.setdefault(rec.timestamp.date(), []).append(rec)

    out: list[DailyAggregate] = []
    for day in sorted(by_day):
        day_records = by_day[day]
        temps = [
            r.temp_c
            for r in day_records
            if r.temp_c is not None and _in_range(r.temp_c, TEMP_PLAUSIBLE_C)
        ]
        coverage = min(len(temps) / samples_per_day, 1.0)
        temp_mean = (
            round(statistics.fmean(temps), 3)
            if temps and coverage >= min_coverage
            else None
        )

        turbidities = [r.turbidity_adc for r in day_records if r.turbidity_adc is not None]
        batteries = [r.battery_v for r in day_records if r.battery_v is not None]

        out.append(
            DailyAggregate(
                day=day,
                temp_mean=temp_mean,
                temp_n=len(temps),
                coverage=round(coverage, 3),
                turbidity_median_adc=(
                    round(statistics.median(turbidities), 1) if turbidities else None
                ),
                battery_min_v=round(min(batteries), 3) if batteries else None,
                n_samples=len(day_records),
            )
        )
    return out


def daily_temperature_series(daily: list[DailyAggregate]) -> list[tuple[date, float]]:
    """Extract ``(day, temp_mean)`` for days that met the coverage floor — DHW/trend input."""
    return [(d.day, d.temp_mean) for d in daily if d.temp_mean is not None]
