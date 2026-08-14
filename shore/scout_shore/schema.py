"""CSV schema — turns a decoded :class:`~scout_shore.packet.Reading` into a row that
conforms to ``docs/engineering/data-schema.md``, and validates rows/files against it.

The on-buoy log and the shore-decoded log share this one schema, so both feed the same
analytics.
"""

from __future__ import annotations

import csv
from collections.abc import Iterable
from pathlib import Path

from .packet import Reading

# Canonical column order — matches docs/engineering/data-schema.md exactly.
COLUMNS: tuple[str, ...] = (
    "schema_version",
    "buoy_id",
    "timestamp_utc",
    "record_seq",
    "temp_c",
    "turbidity_adc",
    "turbidity_v",
    "turbidity_ntu",
    "battery_v",
    "uptime_s",
    "audio_file",
    "flags",
    "fw_version",
)

# Provisional analog front-end constants — SAMD21 12-bit ADC at 3.3 V Vref.
# ⚠️ Pending the turbidity front-end design (hardware/README.md open item, ADR-0002 area).
ADC_FULL_SCALE = 4095
ADC_VREF_V = 3.3


class SchemaError(ValueError):
    """Raised when a row does not conform to the schema."""


def buoy_label(buoy_id: int) -> str:
    """Numeric buoy id → CSV label, e.g. ``1`` → ``SCOUT-01``."""
    return f"SCOUT-{buoy_id:02d}"


def audio_filename(reading: Reading) -> str:
    """Reconstruct the audio filename for a cycle, matching data-schema.md's /AUDIO/ naming."""
    stamp = reading.timestamp.strftime("%Y%m%dT%H%M%SZ")
    return f"{buoy_label(reading.buoy_id)}_{stamp}.wav"


def turbidity_volts(adc: int) -> float:
    """Convert raw ADC counts to sensor volts (provisional — see constants above)."""
    return round(adc / ADC_FULL_SCALE * ADC_VREF_V, 3)


def reading_to_row(reading: Reading) -> dict[str, str]:
    """Render a :class:`Reading` as a schema-conformant CSV row (all values as strings).

    ``turbidity_ntu`` is left empty (no calibration yet — data-schema.md open question).
    """
    return {
        "schema_version": str(reading.schema_version),
        "buoy_id": buoy_label(reading.buoy_id),
        "timestamp_utc": reading.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "record_seq": str(reading.record_seq),
        "temp_c": f"{reading.temp_c:.2f}",
        "turbidity_adc": str(reading.turbidity_adc),
        "turbidity_v": f"{turbidity_volts(reading.turbidity_adc):.3f}",
        "turbidity_ntu": "",  # uncalibrated — intentionally blank
        "battery_v": f"{reading.battery_v:.2f}",
        "uptime_s": str(reading.uptime_s),
        "audio_file": audio_filename(reading) if reading.audio_present else "",
        "flags": "|".join(sorted(reading.flags)),
        "fw_version": reading.fw_version,
    }


def validate_row(row: dict[str, str]) -> None:
    """Check one row against the schema. Raises :class:`SchemaError` on any violation."""
    keys = tuple(row.keys())
    if keys != COLUMNS:
        raise SchemaError(f"columns/order mismatch: {keys} != {COLUMNS}")

    # Required (never-empty) fields and their parsers.
    required_numeric = {
        "schema_version": int,
        "record_seq": int,
        "temp_c": float,
        "turbidity_adc": int,
        "turbidity_v": float,
        "battery_v": float,
        "uptime_s": int,
    }
    for name, parse in required_numeric.items():
        value = row[name]
        if value == "":
            raise SchemaError(f"{name} is required but empty")
        try:
            parse(value)
        except ValueError as exc:
            raise SchemaError(f"{name}={value!r} is not a valid {parse.__name__}") from exc

    if not row["timestamp_utc"].endswith("Z"):
        raise SchemaError(f"timestamp_utc must be UTC ISO-8601 ('...Z'): {row['timestamp_utc']!r}")
    if not row["buoy_id"]:
        raise SchemaError("buoy_id is required but empty")


def validate_csv(path: str | Path) -> int:
    """Validate every row of a CSV file. Returns the row count; raises on the first bad row."""
    path = Path(path)
    with path.open(newline="") as handle:
        reader = csv.DictReader(handle)
        count = 0
        for index, row in enumerate(reader, start=1):
            try:
                validate_row(row)
            except SchemaError as exc:
                raise SchemaError(f"{path}:{index}: {exc}") from exc
            count += 1
    return count


def rows_from_readings(readings: Iterable[Reading]) -> list[dict[str, str]]:
    """Convenience: map many readings to rows."""
    return [reading_to_row(r) for r in readings]
