"""End-to-end tests: simulate → encode → mock link → receive → validated CSV."""

import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from scout_shore import CsvStore, MockLoRaLink, Receiver, encode, generate_series
from scout_shore.schema import validate_csv

_START = datetime(2026, 8, 14, 0, 0, 0, tzinfo=timezone.utc)


class LoopbackTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.out = Path(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def _run(self, count, **link_kwargs):
        link = MockLoRaLink(**link_kwargs)
        receiver = Receiver(link, CsvStore(self.out))
        for reading in generate_series(_START, count, seed=0):
            link.transmit(encode(reading))
        receiver.drain()
        return link, receiver

    def test_clean_link_stores_every_reading(self):
        count = 48
        link, receiver = self._run(count)
        self.assertEqual(link.dropped, 0)
        self.assertEqual(receiver.stats.received, count)
        self.assertEqual(receiver.stats.stored, count)
        self.assertEqual(receiver.stats.decode_errors, 0)

    def test_written_csv_conforms_to_schema(self):
        self._run(48)
        csv_files = list(self.out.glob("*.csv"))
        self.assertTrue(csv_files, "expected at least one daily CSV")
        total = sum(validate_csv(p) for p in csv_files)
        self.assertEqual(total, 48)

    def test_lossy_link_drops_are_accounted_for(self):
        count = 200
        link, receiver = self._run(count, loss_rate=0.2, seed=7)
        # Everything that arrived was either stored or counted as an error — nothing vanished.
        self.assertEqual(link.dropped + receiver.stats.received, count)
        self.assertEqual(
            receiver.stats.received,
            receiver.stats.stored + receiver.stats.decode_errors + receiver.stats.schema_errors,
        )
        self.assertGreater(link.dropped, 0)

    def test_corruption_is_caught_by_crc(self):
        count = 200
        _, receiver = self._run(count, corrupt_rate=0.3, seed=3)
        self.assertGreater(receiver.stats.decode_errors, 0)
        # No corrupt frame should have been stored.
        self.assertEqual(
            receiver.stats.stored,
            receiver.stats.received - receiver.stats.decode_errors - receiver.stats.schema_errors,
        )


if __name__ == "__main__":
    unittest.main()
