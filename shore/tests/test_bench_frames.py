"""Parsing the bench receiver's serial lines (firmware env feather_m0_rx, SCO-155).

The receiver prints one line per LoRa frame. These lines are the only record of the first real
radio tests, so a line that cannot be parsed must be reported, never silently dropped.
"""

from __future__ import annotations

import unittest
from datetime import datetime, timezone

from scout_shore.bench_frames import RxLine, parse_rx_line
from scout_shore.packet import Reading, encode


def _payload() -> bytes:
    return encode(Reading(
        buoy_id=1, timestamp=datetime(2026, 10, 19, 0, 10, tzinfo=timezone.utc), record_seq=7,
        temp_c=21.5, turbidity_adc=3100, battery_v=3.6, uptime_s=600,
    ))


class ParseRxLineTests(unittest.TestCase):
    def test_a_frame_line_yields_payload_rssi_and_snr(self) -> None:
        payload = _payload()
        line = f"RX len={len(payload)} rssi=-41 snr=9.50 n=3 hex={payload.hex().upper()}"
        self.assertEqual(parse_rx_line(line), RxLine(payload=payload, rssi=-41, snr=9.5))

    def test_lines_that_are_not_frames_are_ignored(self) -> None:
        for line in ("bench_rx: radio=ok freq=915.00", "", "RX bad frame (CRC or header)"):
            self.assertIsNone(parse_rx_line(line))

    def test_a_frame_line_with_broken_hex_is_an_error(self) -> None:
        with self.assertRaises(ValueError):
            parse_rx_line("RX len=2 rssi=-41 snr=9.50 n=1 hex=0G")

    def test_length_must_match_the_hex(self) -> None:
        with self.assertRaises(ValueError):
            parse_rx_line("RX len=3 rssi=-41 snr=9.50 n=1 hex=0102")


if __name__ == "__main__":
    unittest.main()
