"""The daily transmit count (SCO-198): read from v4 rows, and the newest reported count wins."""

import csv
import tempfile
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from pathlib import Path

from telemetry import analyze, load_csv
from telemetry.model import TelemetryRecord

_T0 = datetime(2027, 3, 1, tzinfo=timezone.utc)


def _records(tx_count=None, days=2):
    out = []
    for i in range(days * 48):
        out.append(TelemetryRecord(
            timestamp=_T0 + timedelta(minutes=30 * i), buoy_id="SCOUT-01", record_seq=i + 1,
            temp_c=27.0, turbidity_adc=520, turbidity_v=None, turbidity_fau=None, battery_v=3.3,
            uptime_s=i * 1800, audio_file="", tx_count=tx_count))
    return out


class Loading(unittest.TestCase):
    def test_v4_rows_carry_the_count_and_older_rows_read_none(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "SCOUT-01_20270301.csv"
            with path.open("w", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=[
                    "schema_version", "timestamp_utc", "buoy_id", "record_seq", "temp_c",
                    "battery_v", "tx_count"])
                writer.writeheader()
                writer.writerow({"schema_version": "4", "timestamp_utc": "2027-03-01T00:00:00Z",
                                 "buoy_id": "SCOUT-01", "record_seq": "1", "temp_c": "27",
                                 "battery_v": "3.3", "tx_count": "2"})
                writer.writerow({"schema_version": "3", "timestamp_utc": "2027-03-01T00:30:00Z",
                                 "buoy_id": "SCOUT-01", "record_seq": "2", "temp_c": "27",
                                 "battery_v": "3.3", "tx_count": ""})
            records = load_csv(path)
        self.assertEqual([r.tx_count for r in records], [2, None])


class Report(unittest.TestCase):
    def test_the_newest_reported_count_wins(self):
        records = _records(tx_count=3)
        records[-1] = replace(records[-1], tx_count=1)
        self.assertEqual(analyze(records).tx_count, 1)

    def test_no_reported_count_is_none(self):
        self.assertIsNone(analyze(_records()).tx_count)


if __name__ == "__main__":
    unittest.main()
