"""The OTA release tool (firmware/tools/ota_release.py, SCO-197).

Signing needs the ``cryptography`` package, which CI's plain Python does not have; those tests
skip without it. Reading the version and stripping the boot stub need only the standard library.
"""

from __future__ import annotations

import importlib.util
import pathlib
import sys
import tempfile
import unittest

_ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(_ROOT / "shore"))
_spec = importlib.util.spec_from_file_location("ota_release", _ROOT / "firmware" / "tools" / "ota_release.py")
ota_release = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ota_release)

from scout_shore import ota  # noqa: E402

try:
    from cryptography.hazmat.primitives.asymmetric import ed25519
except ImportError:  # pragma: no cover - environment dependent
    ed25519 = None


class VersionAndImageTest(unittest.TestCase):
    def test_reads_the_version_from_config_h(self) -> None:
        text = "#define FW_MAJOR 0\n#define FW_MINOR 2\n#define FW_PATCH 1\n"
        self.assertEqual(ota_release.config_version(text), 0x000201)

    def test_real_config_h_has_a_version(self) -> None:
        self.assertGreaterEqual(ota_release.config_version(ota_release.CONFIG_H.read_text()), 0)

    def test_strips_the_boot_stub(self) -> None:
        binary = bytes(ota.STUB_BYTES) + b"app"
        self.assertEqual(ota_release.image_from_bin(binary), b"app")

    def test_refuses_a_bin_without_the_stub(self) -> None:
        with self.assertRaises(SystemExit):
            ota_release.image_from_bin(bytes(1000))


@unittest.skipIf(ed25519 is None, "cryptography not installed")
class SigningTest(unittest.TestCase):
    def test_signature_verifies_and_matches_the_firmware_test_key(self) -> None:
        key = ed25519.Ed25519PrivateKey.from_private_bytes(bytes(range(32)))
        image = bytes((7 * i + 3) & 0xFF for i in range(300))
        bundle = ota_release.sign_bundle(key, image, buoy=1, version=0x000200, build_time=1803859200)
        key.public_key().verify(bundle.signature, bundle.manifest_raw)  # raises if wrong
        golden = (_ROOT / "firmware" / "src" / "ota_pubkey_example.h").read_text()
        public = key.public_key().public_bytes_raw()
        self.assertIn(", ".join(f"0x{b:02x}" for b in public[:16]), golden)
        self.assertEqual(ota.read_bundle(bundle.encode()), bundle)

    def test_keygen_refuses_to_overwrite_a_key(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            key = pathlib.Path(tmp, "k.key")
            header = pathlib.Path(tmp, "pub.h")
            ota_release.main(["keygen", "--key", str(key), "--header", str(header)])
            self.assertIn("SCOUT_OTA_PUBKEY[32]", header.read_text())
            self.assertEqual(oct(key.stat().st_mode & 0o777), "0o600")
            with self.assertRaises(SystemExit):
                ota_release.main(["keygen", "--key", str(key), "--header", str(header)])


if __name__ == "__main__":
    unittest.main()
