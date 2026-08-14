"""Parsed telemetry record — one row of the on-buoy / shore CSV (data-schema.md)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

# The expected sampling cadence (data-schema.md / EDD): one record every 30 minutes.
EXPECTED_INTERVAL_S = 1800


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
    schema_version: int = 1
    fw_version: str = ""
