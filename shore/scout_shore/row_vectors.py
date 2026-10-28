"""Test vectors that hold the shore station's C row builder to :func:`schema.reading_to_row`.

The ESP32-S3 shore station decodes each packet and pushes a schema row to the console itself
(SCO-237). The console keeps each row as sent, and the computer bridge and SD-card import build
the same rows in Python, so the two must agree to the character. Python's number formatting is
the hard part: ``f"{3125 / 1000:.2f}"`` is ``3.12`` (an exact tie, rounded to even) while
``f"{3605 / 1000:.2f}"`` is ``3.60`` (the double sits just below the tie). These vectors pin every
case, and ``firmware/test/test_console/row_vectors.h`` is regenerated from them::

    cd shore && python -m scout_shore.row_vectors --write

``tests/test_row_vectors.py`` fails if the committed header drifts from this module.
"""

from __future__ import annotations

import argparse
import json
import struct
from datetime import datetime, timezone
from pathlib import Path

from .packet import _LEGACY_BODY_FORMAT, Reading, crc16_ccitt, encode
from .schema import ADC_FULL_SCALE, reading_to_row
from .simulator import generate_series

HEADER = Path(__file__).resolve().parents[2] / "firmware" / "test" / "test_console" / "row_vectors.h"

# Sweeps checked value by value: every battery reading a LiFePO4 pack can report, every 12-bit
# turbidity count, and water temperatures from -30 to +45 C in 0.07 C steps.
BATTERY_MV = range(2000, 4401)
TEMP_CENTI = range(-3000, 4501, 7)


def _t(*args: int) -> datetime:
    return datetime(*args, tzinfo=timezone.utc)


def _legacy(version: int, reading: Reading) -> bytes:
    """A 30-byte v1/v2 packet, as buoys sent before the acoustic summary (packet.py)."""
    major, minor, patch = (int(p) for p in reading.fw_version[1:].split("."))
    body = struct.pack(
        _LEGACY_BODY_FORMAT, version, reading.buoy_id, int(reading.timestamp.timestamp()),
        reading.record_seq, round(reading.temp_c * 100), reading.turbidity_adc,
        round(reading.battery_v * 1000), reading.uptime_s, 0, 0, 0, major, minor, patch,
    )
    return body + struct.pack("<H", crc16_ccitt(body))


def packets() -> list[tuple[str, bytes]]:
    """(name, packet) pairs covering every column and rounding rule."""
    base = dict(buoy_id=1, timestamp=_t(2026, 10, 28, 16, 10), record_seq=42, temp_c=26.44,
                turbidity_adc=3100, battery_v=3.28, uptime_s=86400)
    cases: list[tuple[str, Reading | bytes]] = [
        ("plain", Reading(**base)),
        ("battery_exact_tie_rounds_even", Reading(**{**base, "battery_v": 3.125})),
        ("battery_just_below_tie", Reading(**{**base, "battery_v": 3.605})),
        ("battery_just_above_tie", Reading(**{**base, "battery_v": 3.615})),
        ("negative_temp", Reading(**{**base, "temp_c": -1.05})),
        ("small_negative_temp", Reading(**{**base, "temp_c": -0.01})),
        ("zero_temp", Reading(**{**base, "temp_c": 0.0})),
        ("turbidity_zero", Reading(**{**base, "turbidity_adc": 0})),
        ("turbidity_full_scale", Reading(**{**base, "turbidity_adc": ADC_FULL_SCALE})),
        ("every_flag_and_soh", Reading(**{**base, "flags": frozenset({
            "SD_RETRY", "TEMP_TIMEOUT", "TURBIDITY_RANGE", "BATT_LOW_SKIP_TX", "RTC_LOST",
            "POWER_CONSERVE", "HUMIDITY_HIGH", "HUMIDITY_FAIL", "CMD_REJECTED"}),
            "soh": frozenset({"WATCHDOG_RESET", "RTC_UNSET", "SD_INIT_FAIL", "LORA_INIT_FAIL"})})),
        ("tx_count_1", Reading(**{**base, "tx_count": 1})),
        ("tx_count_3_with_rejection", Reading(**{**base, "tx_count": 3,
                                                 "flags": frozenset({"CMD_REJECTED"})})),
        ("audio_with_summary", Reading(**{**base, "audio_present": True, "lvl_anthro_cdb": -4210,
                                          "lvl_mixed_cdb": -3988, "lvl_bio_cdb": 1, "lvl_broad_cdb": 0,
                                          "ndsi_e4": -10000, "snap_count": 65535, "clip_count": 7})),
        ("max_ids_and_counters", Reading(**{**base, "buoy_id": 65535, "record_seq": 0xFFFFFFFF,
                                            "uptime_s": 0xFFFFFFFF, "fw_version": "v255.255.255",
                                            "temp_c": 327.67, "battery_v": 65.535})),
        ("min_temp", Reading(**{**base, "temp_c": -327.68})),
        ("leap_day_midnight", Reading(**{**base, "timestamp": _t(2028, 2, 29, 0, 0)})),
        ("year_end", Reading(**{**base, "timestamp": _t(2026, 12, 31, 23, 59, 59),
                                "audio_present": True})),
        ("legacy_v2", _legacy(2, Reading(**base))),
        ("legacy_v1", _legacy(1, Reading(**{**base, "battery_v": 3.125}))),
    ]
    cases += [(f"simulated_{r.record_seq}", r)
              for r in generate_series(_t(2026, 10, 28), 6, buoy_id=2, seed=7)]
    return [(name, case if isinstance(case, bytes) else encode(case)) for name, case in cases]


def _row_json(packet: bytes) -> str:
    from .packet import decode  # noqa: PLC0415 — kept beside its one use

    return json.dumps(reading_to_row(decode(packet)), separators=(",", ":"))


def _c_string(text: str) -> str:
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'


def _fixed(value: float, decimals: int) -> str:
    return f"{value:.{decimals}f}"


def render() -> str:
    """Text of firmware/test/test_console/row_vectors.h."""
    lines = [
        "/* GENERATED by shore/scout_shore/row_vectors.py --write. Do not edit.",
        " * Expected rows come from shore/scout_shore/schema.py reading_to_row, which the S3 must",
        " * match to the character (SCO-237). */",
        "#ifndef SCOUT_ROW_VECTORS_H",
        "#define SCOUT_ROW_VECTORS_H",
        "",
        "#include <stdint.h>",
        "",
        "typedef struct {",
        "    const char *name;",
        "    const char *packet_hex;",
        "    const char *row_json;",
        "} ScoutRowVector;",
        "",
        "static const ScoutRowVector SCOUT_ROW_VECTORS[] = {",
    ]
    for name, packet in packets():
        lines.append(f"    {{{_c_string(name)}, {_c_string(packet.hex())},")
        lines.append(f"     {_c_string(_row_json(packet))}}},")
    lines += ["};", ""]

    def sweep(name: str, first: int, values: list[str]) -> None:
        lines.append(f"static const int32_t {name}_FIRST = {first};")
        lines.append(f"static const char *const {name}[] = {{")
        for i in range(0, len(values), 12):
            lines.append("    " + ", ".join(_c_string(v) for v in values[i:i + 12]) + ",")
        lines.append("};")
        lines.append("")

    sweep("SCOUT_BATTERY_V", BATTERY_MV.start, [_fixed(mv / 1000, 2) for mv in BATTERY_MV])
    sweep("SCOUT_TURBIDITY_V", 0, [_fixed(round(adc / ADC_FULL_SCALE * 3.3, 3), 3)
                                    for adc in range(ADC_FULL_SCALE + 1)])
    sweep("SCOUT_TEMP_C", TEMP_CENTI.start, [_fixed(c / 100, 2) for c in TEMP_CENTI])
    lines.append(f"static const int32_t SCOUT_TEMP_C_STEP = {TEMP_CENTI.step};")
    lines.append("")
    lines.append("#endif")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--write", action="store_true", help=f"write {HEADER}")
    args = parser.parse_args()
    if args.write:
        HEADER.parent.mkdir(parents=True, exist_ok=True)
        HEADER.write_text(render())
    else:
        print(render(), end="")  # noqa: T201 — the header is this command's output
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
