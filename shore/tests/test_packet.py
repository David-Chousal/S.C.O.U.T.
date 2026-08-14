"""Packet codec tests — round-trip fidelity and decode-error handling."""

import unittest
from dataclasses import replace
from datetime import datetime, timezone

from scout_shore import PACKET_SIZE, PacketError, Reading, decode, encode
from scout_shore.packet import LORA_PAYLOAD_BUDGET_BYTES


def _sample_reading() -> Reading:
    return Reading(
        buoy_id=1,
        timestamp=datetime(2026, 8, 14, 6, 30, 0, tzinfo=timezone.utc),
        record_seq=13,
        temp_c=26.44,
        turbidity_adc=514,
        battery_v=3.28,
        uptime_s=21600,
        flags=frozenset({"BATT_LOW_SKIP_TX", "SD_RETRY"}),
        audio_present=True,
        fw_version="v0.1.0",
    )


class PacketCodecTest(unittest.TestCase):
    def test_round_trip_preserves_all_fields(self):
        # Arrange
        original = _sample_reading()
        # Act
        decoded = decode(encode(original))
        # Assert
        self.assertEqual(decoded, original)

    def test_packet_fits_within_the_lora_budget(self):
        self.assertLessEqual(PACKET_SIZE, LORA_PAYLOAD_BUDGET_BYTES)

    def test_temperature_survives_negative_and_fraction(self):
        cold = replace(_sample_reading(), temp_c=-1.25)
        self.assertAlmostEqual(decode(encode(cold)).temp_c, -1.25, places=2)

    def test_corrupt_payload_raises_on_crc(self):
        payload = bytearray(encode(_sample_reading()))
        payload[5] ^= 0xFF  # flip a body byte, CRC no longer matches
        with self.assertRaises(PacketError):
            decode(bytes(payload))

    def test_wrong_length_raises(self):
        with self.assertRaises(PacketError):
            decode(b"\x00\x01\x02")

    def test_unknown_flag_rejected_at_construction(self):
        with self.assertRaises(ValueError):
            Reading(
                buoy_id=1,
                timestamp=datetime(2026, 8, 14, tzinfo=timezone.utc),
                record_seq=1,
                temp_c=26.0,
                turbidity_adc=500,
                battery_v=3.3,
                uptime_s=0,
                flags=frozenset({"NOT_A_REAL_FLAG"}),
            )

    def test_naive_timestamp_rejected(self):
        with self.assertRaises(ValueError):
            Reading(
                buoy_id=1,
                timestamp=datetime(2026, 8, 14),  # no tzinfo
                record_seq=1,
                temp_c=26.0,
                turbidity_adc=500,
                battery_v=3.3,
                uptime_s=0,
            )


if __name__ == "__main__":
    unittest.main()
