"""Parsed telemetry record — one row of the on-buoy / shore CSV (data-schema.md)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

# The expected sampling cadence (data-schema.md / EDD): one record every 30 minutes.
EXPECTED_INTERVAL_S = 1800


# A clock that has never been set reads far in the past: the firmware stamps
# 1970-01-01T00:00:00Z when the PCF8523 is unreadable (main.cpp), and an unset PCF8523
# itself powers up at 2000-01-01. Anything before this cutoff is an unset clock, not a
# real measurement time — S.C.O.U.T. did not exist before 2026.
CLOCK_VALID_FROM = datetime(2020, 1, 1, tzinfo=timezone.utc)

# The firmware's own signal that it could not trust the clock (data-schema.md flags).
RTC_LOST_FLAG = "RTC_LOST"


@dataclass(frozen=True)
class TelemetryRecord:
    """One sample. Numeric fields are ``None`` when the source cell was blank (not measured)."""

    timestamp: datetime  # timezone-aware, UTC
    buoy_id: str
    record_seq: int
    temp_c: float | None
    turbidity_adc: int | None
    turbidity_v: float | None
    turbidity_ntu: float | None
    battery_v: float | None
    uptime_s: int | None
    audio_file: str
    flags: frozenset[str] = field(default_factory=frozenset)
    soh: frozenset[str] = field(default_factory=frozenset)  # device State-of-Health bits
    schema_version: int = 1
    fw_version: str = ""


def has_valid_clock(record: TelemetryRecord) -> bool:
    """True when this row's timestamp can be trusted for time-based analysis.

    Two independent signals, either of which condemns the row:

    - The firmware set ``RTC_LOST``, i.e. it told us outright that the clock was unreadable.
    - The timestamp predates :data:`CLOCK_VALID_FROM`, which catches an unset clock even if
      the flag is missing — an older CSV, a dropped flag, or a hand-edited file.

    The *readings* on such a row are still real; only the time is not. Callers should keep
    counting the row and exclude it from anything computed against timestamps.
    """
    if RTC_LOST_FLAG in record.flags:
        return False
    return record.timestamp >= CLOCK_VALID_FROM
