"""CSV schema — turns a decoded :class:`~scout_shore.packet.Reading` into a row that
conforms to ``docs/engineering/data-schema.md``, and validates rows/files against it.

The on-buoy log and the shore-decoded log share this one schema, so both feed the same
analytics.
"""

from __future__ import annotations

import csv
from collections.abc import Iterable
from pathlib import Path

from .packet import ACOUSTIC_FIELDS, Reading

# Canonical column order — matches docs/engineering/data-schema.md exactly.
COLUMNS: tuple[str, ...] = (
    "schema_version",
    "buoy_id",
    "timestamp_utc",
    "record_seq",
    "temp_c",
    "turbidity_adc",
    "turbidity_v",
    "turbidity_fau",
    "battery_v",
    "uptime_s",
    "audio_file",
    "flags",
    "soh",
    "fw_version",
    # Housing humidity sensor (SCO-205, schema v2). On the SD card only: the radio packet
    # carries just the HUMIDITY_HIGH / HUMIDITY_FAIL flags, so live rows leave these blank.
    "internal_temp_c",
    "internal_humidity_pct",
    # Acoustic summary of the cycle's recording (ADR-0010, schema v3), the same seven fields as
    # the packet. Blank when there was no recording; the packet carries zeros instead.
    *ACOUSTIC_FIELDS,
)

# Column sets of earlier schema versions. Their files stay readable and importable; a row is
# valid if its columns are exactly one of these prefixes of COLUMNS.
COLUMNS_V1 = COLUMNS[:14]  # before the internal humidity sensor (SCO-205)
COLUMNS_V2 = COLUMNS[:16]  # before the acoustic summary (ADR-0010)
ACCEPTED_COLUMN_SETS = (COLUMNS, COLUMNS_V2, COLUMNS_V1)

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
    """Reconstruct the audio path for a cycle, relative to /AUDIO/, as the buoy names it.

    One folder per UTC day keeps the names FAT 8.3-safe (data-schema.md, SCO-202).
    """
    return reading.timestamp.strftime("%Y%m%d/%H%M%SZ.WAV")


def turbidity_volts(adc: int) -> float:
    """Convert raw ADC counts to sensor volts (provisional — see constants above)."""
    return round(adc / ADC_FULL_SCALE * ADC_VREF_V, 3)


def reading_to_row(reading: Reading) -> dict[str, str]:
    """Render a :class:`Reading` as a schema-conformant CSV row (all values as strings).

    ``turbidity_fau`` is left empty by design: the buoy ships raw ADC only (SCO-13), and
    formazin attenuation units are computed downstream once a calibration curve exists (SCO-12).
    """
    return {
        "schema_version": str(reading.schema_version),
        "buoy_id": buoy_label(reading.buoy_id),
        "timestamp_utc": reading.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "record_seq": str(reading.record_seq),
        "temp_c": f"{reading.temp_c:.2f}",
        "turbidity_adc": str(reading.turbidity_adc),
        "turbidity_v": f"{turbidity_volts(reading.turbidity_adc):.3f}",
        "turbidity_fau": "",  # uncalibrated — intentionally blank
        "battery_v": f"{reading.battery_v:.2f}",
        "uptime_s": str(reading.uptime_s),
        "audio_file": audio_filename(reading) if reading.audio_present else "",
        "flags": "|".join(sorted(reading.flags)),
        "soh": "|".join(sorted(reading.soh)),
        "fw_version": reading.fw_version,
        "internal_temp_c": "",  # SD card only — not in the packet
        "internal_humidity_pct": "",
        **acoustic_cells(reading),
    }


def acoustic_cells(reading: Reading) -> dict[str, str]:
    """The seven acoustic cells: the summary when the cycle had a recording, else blank."""
    if not reading.audio_present:
        return {name: "" for name in ACOUSTIC_FIELDS}
    return {name: str(value) for name, value in zip(ACOUSTIC_FIELDS, reading.acoustic())}


def validate_row(row: dict[str, str]) -> None:
    """Check one row against the schema. Raises :class:`SchemaError` on any violation."""
    keys = tuple(row.keys())
    if keys not in ACCEPTED_COLUMN_SETS:
        raise SchemaError(f"columns/order mismatch: {keys} != {COLUMNS} (or a v1/v2 prefix)")

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

    # Optional acoustic cells (v3): blank, or an integer in the packet field's range.
    for name in ACOUSTIC_FIELDS:
        value = row.get(name, "")
        if value == "":
            continue
        try:
            number = int(value)
        except ValueError as exc:
            raise SchemaError(f"{name}={value!r} is not a valid int") from exc
        low, high = (0, 65535) if name in ("snap_count", "clip_count") else (-32768, 32767)
        if not low <= number <= high:
            raise SchemaError(f"{name}={number} outside {low}..{high}")


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
