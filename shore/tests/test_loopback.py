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

    def _run(self, count, *, copies=1, **link_kwargs):
        link = MockLoRaLink(**link_kwargs)
        receiver = Receiver(link, CsvStore(self.out))
        for reading in generate_series(_START, count, seed=0):
            for _ in range(copies):  # blind repetition, firmware/lib/scout_link
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
        self.assertEqual(receiver.stats.received, receiver.stats.accounted)
        self.assertGreater(link.dropped, 0)

    def test_repeated_packets_collapse_to_one_row_each(self):
        count = 48
        link, receiver = self._run(count, copies=3)
        self.assertEqual(receiver.stats.received, count * 3)
        self.assertEqual(receiver.stats.stored, count)  # not 144
        self.assertEqual(receiver.stats.duplicates, count * 2)
        self.assertEqual(receiver.stats.received, receiver.stats.accounted)
        # The CSV on disk must carry one row per reading, or QC completeness is inflated.
        self.assertEqual(sum(validate_csv(p) for p in self.out.glob("*.csv")), count)

    def test_repetition_recovers_readings_a_lossy_link_would_lose(self):
        # The whole point of blind repetition: at 40% loss, one shot loses many readings;
        # three shots lose only those whose every copy was dropped.
        single = self._run(200, loss_rate=0.4, seed=11)[1].stats.stored
        self.tearDown()
        self.setUp()
        repeated = self._run(200, copies=3, loss_rate=0.4, seed=11)[1].stats.stored
        self.assertGreater(repeated, single)

    def test_duplicates_are_rejected_across_a_restart(self):
        # A restarted shore station re-reads the daily file, so copies arriving after the
        # restart must not be appended a second time.
        count = 12
        self._run(count, copies=1)
        link = MockLoRaLink()
        receiver = Receiver(link, CsvStore(self.out))  # fresh store, same directory
        for reading in generate_series(_START, count, seed=0):
            link.transmit(encode(reading))
        receiver.drain()
        self.assertEqual(receiver.stats.stored, 0)
        self.assertEqual(receiver.stats.duplicates, count)
        self.assertEqual(sum(validate_csv(p) for p in self.out.glob("*.csv")), count)

    def test_corruption_is_caught_by_crc(self):
        count = 200
        _, receiver = self._run(count, corrupt_rate=0.3, seed=3)
        self.assertGreater(receiver.stats.decode_errors, 0)
        # No corrupt frame should have been stored.
        self.assertEqual(
            receiver.stats.stored,
            receiver.stats.received
            - receiver.stats.decode_errors
            - receiver.stats.schema_errors
            - receiver.stats.duplicates,
        )


if __name__ == "__main__":
    unittest.main()
