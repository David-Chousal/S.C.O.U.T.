"""The radio interface both backends are written against.

The receiver used to be typed against ``MockLoRaLink`` — the concrete mock — so there was
nothing for a real backend to implement against and no check that a swap would work. These
tests pin the contract instead.

``Rfm9xLink`` cannot be exercised here: it needs an SX1276 on a Raspberry Pi. What *is*
testable without hardware is that it satisfies the interface, that importing it does not
require the radio packages, and that its modem constants match the buoy's firmware exactly —
which is the failure that would otherwise present as a silent, total inability to receive.
"""

import unittest

from scout_shore import radio
from scout_shore.link import LoRaLink
from scout_shore.receiver import MockLoRaLink, Receiver
from scout_shore.store import CsvStore


class LinkProtocolTest(unittest.TestCase):
    def test_the_mock_satisfies_the_protocol(self):
        self.assertIsInstance(MockLoRaLink(), LoRaLink)

    def test_the_real_backend_exposes_the_same_interface(self):
        # Cannot instantiate without a radio; check the class surface instead.
        for member in ("transmit", "receive", "pending"):
            self.assertTrue(hasattr(radio.Rfm9xLink, member), member)

    def test_receiver_accepts_anything_satisfying_the_protocol(self):
        class Silent:
            def transmit(self, payload): raise NotImplementedError
            def receive(self): return None
            @property
            def pending(self): return 0

        import tempfile
        with tempfile.TemporaryDirectory() as d:
            r = Receiver(Silent(), CsvStore(d))
            self.assertIsNone(r.poll_once())
            self.assertEqual(r.stats.received, 0)


class RadioConfigTest(unittest.TestCase):
    """The receiver must match the buoy bit for bit. LoRa is not self-describing — a mismatch
    does not degrade the link, it silences it."""

    def test_modem_config_matches_firmware(self):
        # firmware/src/config.h: 915.0 MHz, BW 500 kHz, SF12, CR 4/8.
        self.assertEqual(radio.FREQUENCY_MHZ, 915.0)
        self.assertEqual(radio.SIGNAL_BANDWIDTH_HZ, 500_000)
        self.assertEqual(radio.SPREADING_FACTOR, 12)
        self.assertEqual(radio.CODING_RATE, 8)

    def test_the_500khz_errata_values_are_the_documented_ones(self):
        # SX1276 errata 2.1 — without these the receiver misses rated sensitivity, which
        # looks exactly like a bad antenna.
        self.assertEqual(radio._REG_HIGH_BW_OPTIMIZE_1, 0x36)
        self.assertEqual(radio._HIGH_BW_OPTIMIZE_1_AT_500K, 0x02)
        self.assertEqual(radio._REG_HIGH_BW_OPTIMIZE_2, 0x3A)
        self.assertEqual(radio._HIGH_BW_OPTIMIZE_2_AT_500K, 0x64)

    def test_importing_the_real_backend_needs_no_radio_packages(self):
        # The shore station is stdlib-only so its suite runs on a bare Pi. Importing this
        # module must not break that; only constructing Rfm9xLink needs the packages.
        self.assertTrue(radio.FREQUENCY_MHZ)

    def test_constructing_without_the_packages_explains_itself(self):
        with self.assertRaises(RuntimeError) as ctx:
            radio.Rfm9xLink()
        self.assertIn("adafruit-circuitpython-rfm9x", str(ctx.exception))

    def test_transmit_is_refused_rather_than_faked(self):
        link = radio.Rfm9xLink.__new__(radio.Rfm9xLink)   # skip __init__; no hardware
        with self.assertRaises(NotImplementedError):
            link.transmit(b"x")


if __name__ == "__main__":
    unittest.main()
