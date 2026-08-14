"""Load telemetry CSVs (data-schema.md) into :class:`TelemetryRecord` objects.

Standard library only — the shore CSV is small and plainly structured, so stdlib ``csv`` is
enough and keeps this runnable on a bare Raspberry Pi with no scientific stack installed.
"""

from __future__ import annotations

import csv
from datetime import datetime, timezone
from pathlib import Path

from .model import TelemetryRecord

# Columns that must be present (subset of data-schema.md needed for analysis).
REQUIRED_COLUMNS = (
    "timestamp_utc",
    "buoy_id",
    "record_seq",
    "temp_c",
    "battery_v",
)


class TelemetryFormatError(ValueError):
    """Raised when a CSV is missing required columns or a row cannot be parsed."""


def _parse_timestamp(value: str) -> datetime:
    text = value.strip()
    if text.endswith("Z"):  # canonical UTC form from data-schema.md
        text = text[:-1] + "+00:00"
    dt = datetime.fromisoformat(text)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _opt_float(value: str) -> float | None:
    value = value.strip()
    return float(value) if value else None


def _opt_int(value: str) -> int | None:
    value = value.strip()
    return int(value) if value else None


def _parse_row(row: dict[str, str], line: int, source: Path) -> TelemetryRecord:
    try:
        return TelemetryRecord(
            timestamp=_parse_timestamp(row["timestamp_utc"]),
            buoy_id=row["buoy_id"].strip(),
            record_seq=int(row["record_seq"]),
            temp_c=_opt_float(row.get("temp_c", "")),
            turbidity_adc=_opt_int(row.get("turbidity_adc", "")),
            turbidity_v=_opt_float(row.get("turbidity_v", "")),
            turbidity_ntu=_opt_float(row.get("turbidity_ntu", "")),
            battery_v=_opt_float(row.get("battery_v", "")),
            uptime_s=_opt_int(row.get("uptime_s", "")),
            audio_file=row.get("audio_file", "").strip(),
            flags=frozenset(f for f in row.get("flags", "").split("|") if f),
            soh=frozenset(s for s in row.get("soh", "").split("|") if s),
            schema_version=int(row.get("schema_version", "1") or "1"),
            fw_version=row.get("fw_version", "").strip(),
        )
    except (KeyError, ValueError) as exc:
        raise TelemetryFormatError(f"{source}:{line}: {exc}") from exc


def load_csv(path: str | Path) -> list[TelemetryRecord]:
    """Load one CSV file into records, sorted by timestamp."""
    path = Path(path)
    with path.open(newline="") as handle:
        reader = csv.DictReader(handle)
        missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            raise TelemetryFormatError(f"{path}: missing required columns {missing}")
        records = [_parse_row(row, i, path) for i, row in enumerate(reader, start=2)]
    return sorted(records, key=lambda r: r.timestamp)


def load_dir(directory: str | Path, pattern: str = "*.csv") -> list[TelemetryRecord]:
    """Load and merge every matching CSV in a directory (e.g. many daily files)."""
    directory = Path(directory)
    files = sorted(directory.glob(pattern))
    if not files:
        raise TelemetryFormatError(f"{directory}: no files matching {pattern!r}")
    records: list[TelemetryRecord] = []
    for file in files:
        records.extend(load_csv(file))
    return sorted(records, key=lambda r: r.timestamp)
