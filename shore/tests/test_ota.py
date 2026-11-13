"""Over-the-air update frames and bundles (scout_shore.ota, SCO-197).

The byte-level contract with the firmware is held by scripts/check_packet_contract.py against the
goldens in firmware/test/test_ota; these tests cover the shore-only parts: bundles, the USB lines
the S3 reads, and the window arithmetic the S3 mirrors.
"""

from __future__ import annotations

import hashlib
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scout_shore import ota  # noqa: E402

IMAGE = bytes((7 * i + 3) & 0xFF for i in range(300))
SIGNATURE = bytes(range(64))  # structure only: the S3 and the buoy check the real signature


def make_bundle(image: bytes = IMAGE, target: int = 1) -> ota.Bundle:
    manifest = ota.manifest_for(image, target_buoy=target, version=ota.version_number(0, 2, 0),
                                build_time=1803859200)
    return ota.Bundle(manifest.encode(), SIGNATURE, image)


class ManifestTest(unittest.TestCase):
    def test_round_trips_and_derives_session_from_the_hash(self) -> None:
        bundle = make_bundle()
        manifest = ota.decode_manifest(bundle.manifest_raw)
        self.assertEqual(manifest.image_len, 300)
        self.assertEqual(manifest.chunk_count, 3)
        digest = hashlib.sha256(IMAGE).digest()
        self.assertEqual(manifest.session, digest[0] | digest[1] << 8)

    def test_rejects_bad_magic_and_geometry(self) -> None:
        raw = bytearray(make_bundle().manifest_raw)
        raw[0] ^= 1
        with self.assertRaises(ota.OtaError):
            ota.decode_manifest(bytes(raw))
        raw = bytearray(make_bundle().manifest_raw)
        raw[6] = 64  # chunk size
        with self.assertRaises(ota.OtaError):
            ota.decode_manifest(bytes(raw))

    def test_refuses_an_image_larger_than_application_flash(self) -> None:
        with self.assertRaises(ota.OtaError):
            ota.manifest_for(bytes(ota.MAX_IMAGE + 1), target_buoy=1, version=1, build_time=0)

    def test_version_text_matches_the_packet_format(self) -> None:
        self.assertEqual(ota.version_text(ota.version_number(0, 2, 10)), "v0.2.10")


class BundleTest(unittest.TestCase):
    def test_reads_back_what_it_wrote(self) -> None:
        bundle = make_bundle()
        self.assertEqual(ota.read_bundle(bundle.encode()), bundle)

    def test_rejects_a_damaged_image(self) -> None:
        data = bytearray(make_bundle().encode())
        data[-1] ^= 0xFF
        with self.assertRaisesRegex(ota.OtaError, "SHA-256"):
            ota.read_bundle(bytes(data))

    def test_rejects_a_truncated_image(self) -> None:
        with self.assertRaisesRegex(ota.OtaError, "manifest says"):
            ota.read_bundle(make_bundle().encode()[:-10])


class UsbLinesTest(unittest.TestCase):
    def test_lines_carry_the_whole_image_then_the_manifest(self) -> None:
        bundle = make_bundle()
        lines = ota.usb_lines(bundle, 1)
        self.assertEqual(lines[0], "FB1:300")
        data = b"".join(bytes.fromhex(line.split(":", 1)[1]) for line in lines[1:-1])
        self.assertEqual(data, IMAGE)
        self.assertEqual(lines[-1], "FM" + (bundle.manifest_raw + SIGNATURE).hex())

    def test_every_line_fits_the_s3_line_buffer(self) -> None:
        lines = ota.usb_lines(make_bundle(bytes(5000)), 1)
        self.assertLess(max(len(line) for line in lines), 255)

    def test_refuses_a_bundle_signed_for_another_buoy(self) -> None:
        with self.assertRaisesRegex(ota.OtaError, "signed for buoy 2"):
            ota.usb_lines(make_bundle(target=2), 1)

    def test_a_bundle_for_any_buoy_loads_for_each(self) -> None:
        self.assertEqual(ota.usb_lines(make_bundle(target=0), 7)[0], "FB7:300")


class FrameTest(unittest.TestCase):
    def test_ack_round_trips_and_rejects_corruption(self) -> None:
        ack = ota.Ack(1, 0x7704, 16, 0x00FF, 0)
        frame = ota.encode_ack(ack)
        self.assertEqual(ota.decode_ack(frame), ack)
        with self.assertRaises(ota.OtaError):
            ota.decode_ack(frame[:-1] + bytes([frame[-1] ^ 1]))

    def test_missing_lists_only_unheld_chunks_inside_the_image(self) -> None:
        self.assertEqual(ota.missing(32, 0xFF00, 40), [32, 33, 34, 35, 36, 37, 38, 39])
        self.assertEqual(ota.missing(16, 0xFFFD, 40), [17])
        self.assertEqual(ota.missing(ota.ALL_HELD, 0, 40), [])

    def test_every_frame_fits_the_payload_ceiling(self) -> None:
        chunk = ota.encode_chunk(1, 0, bytes(ota.CHUNK_BYTES), last=True)
        self.assertLessEqual(len(chunk), 140)
        self.assertLessEqual(ota.OFFER_SIZE, 140)
        self.assertEqual(len(ota.encode_confirm(1, 1, 1, bytes(32))), ota.CONFIRM_SIZE)


if __name__ == "__main__":
    unittest.main()
