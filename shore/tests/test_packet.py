"""Packet codec tests — round-trip fidelity and decode-error handling."""

import struct
import unittest
from dataclasses import replace
from datetime import datetime, timezone

from scout_shore import PACKET_SIZE, PacketError, Reading, decode, encode
from scout_shore.packet import LEGACY_PACKET_SIZE, LORA_PAYLOAD_BUDGET_BYTES, crc16_ccitt

# The firmware's v2 golden vector (firmware/test/test_packet GOLDEN_V2): a 30-byte frame from
# before the acoustic summary. Frames like it, and logs of them, must keep decoding.
_V2_GOLDEN = bytes.fromhex("02010000b5846b2a000000540a0202d00c5027010009000501000100b172")


def _with_version(frame: bytes, version: int) -> bytes:
    body = bytes([version]) + frame[1:-2]
    return body + struct.pack("<H", crc16_ccitt(body))


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
        lvl_anthro_cdb=-3972,
        lvl_mixed_cdb=-3006,
        lvl_bio_cdb=-1068,
        lvl_broad_cdb=-995,
        ndsi_e4=9975,
        snap_count=10,
        clip_count=24,
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

    def test_v3_packet_is_44_bytes(self):
        self.assertEqual(PACKET_SIZE, 44)
        self.assertEqual(len(encode(_sample_reading())), 44)

    def test_acoustic_extremes_round_trip(self):
        loud = replace(_sample_reading(), lvl_broad_cdb=-32768, ndsi_e4=-10000,
                       snap_count=65535, clip_count=65535)
        self.assertEqual(decode(encode(loud)), loud)

    def test_acoustic_field_out_of_range_rejected(self):
        with self.assertRaises(ValueError):
            replace(_sample_reading(), snap_count=70000)

    def test_legacy_v2_frame_decodes_with_zero_acoustic_fields(self):
        reading = decode(_V2_GOLDEN)
        self.assertEqual(LEGACY_PACKET_SIZE, len(_V2_GOLDEN))
        self.assertEqual(reading.schema_version, 2)
        self.assertEqual(reading.record_seq, 42)
        self.assertTrue(reading.audio_present)
        self.assertEqual(reading.acoustic(), (0,) * 7)

    def test_legacy_v1_frame_decodes(self):
        self.assertEqual(decode(_with_version(_V2_GOLDEN, 1)).schema_version, 1)

    def test_v3_version_in_a_legacy_length_frame_is_rejected(self):
        with self.assertRaises(PacketError):
            decode(_with_version(_V2_GOLDEN, 3))

    def test_legacy_version_in_a_v3_length_frame_is_rejected(self):
        with self.assertRaises(PacketError):
            decode(_with_version(encode(_sample_reading()), 2))

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
