#!/usr/bin/env python3
"""CI guard for the firmware ↔ shore packet contract.

The firmware Unity test (`firmware/test/test_packet/test_packet.cpp`) hardcodes a GOLDEN byte
vector; the shore decoder is `shore/scout_shore/packet.py`. Each test alone only checks its own
side — so this script encodes the **canonical reading** with the Python encoder and asserts it
equals the firmware's GOLDEN bytes. If either side's layout drifts, CI fails here.

Keep CANONICAL identical to `golden_reading()` in the firmware test.

Standard library only. Exit 0 on match, non-zero on drift.
"""

from __future__ import annotations

import pathlib
import re
import sys
from datetime import datetime, timezone

_ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT / "shore"))

from scout_shore.packet import Reading, encode  # noqa: E402

CANONICAL = Reading(
    buoy_id=1,
    timestamp=datetime(2027, 3, 1, 0, 0, 0, tzinfo=timezone.utc),
    record_seq=42,
    temp_c=26.44,
    turbidity_adc=514,
    battery_v=3.28,
    uptime_s=75600,
    flags=frozenset({"SD_RETRY", "BATT_LOW_SKIP_TX"}),
    soh=frozenset({"WATCHDOG_RESET", "SD_INIT_FAIL"}),
    audio_present=True,
    fw_version="v0.1.0",
)

_TEST_CPP = _ROOT / "firmware" / "test" / "test_packet" / "test_packet.cpp"


def firmware_golden_hex() -> str:
    text = _TEST_CPP.read_text()
    match = re.search(r"GOLDEN\[[^\]]*\]\s*=\s*\{([^}]*)\}", text)
    if not match:
        sys.exit(f"could not find GOLDEN[] array in {_TEST_CPP}")
    byte_values = [int(b, 16) for b in re.findall(r"0x([0-9a-fA-F]{2})", match.group(1))]
    return bytes(byte_values).hex()


def main() -> None:
    python_hex = encode(CANONICAL).hex()
    fw_hex = firmware_golden_hex()
    if python_hex != fw_hex:
        sys.exit(
            "PACKET CONTRACT DRIFT — firmware and shore disagree on the wire format:\n"
            f"  shore (packet.py) : {python_hex}\n"
            f"  firmware GOLDEN   : {fw_hex}\n"
            "Update both sides in lockstep (and the golden vector)."
        )
    print(f"packet contract OK — {len(fw_hex) // 2} bytes: {python_hex}")


if __name__ == "__main__":
    main()
