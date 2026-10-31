"""Housing humidity (SCO-205): the CSV columns load."""

import csv
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from telemetry import analyze, load_csv
from telemetry.model import TelemetryRecord

_T0 = datetime(2026, 10, 23, tzinfo=timezone.utc)


def _record(i: int, *, flags: frozenset[str] = frozenset(), version: int = 2) -> TelemetryRecord:
    return TelemetryRecord(
        timestamp=_T0 + timedelta(minutes=30 * i), buoy_id="SCOUT-01", record_seq=i,
        temp_c=26.0, turbidity_adc=3100, turbidity_v=None, turbidity_fau=None,
        battery_v=3.6, uptime_s=i * 1800, audio_file="", flags=flags, schema_version=version,
    )


class HousingColumns(unittest.TestCase):
    def test_loads_internal_temp_and_humidity(self):
        row = {
            "schema_version": "2", "buoy_id": "SCOUT-01", "timestamp_utc": "2026-10-23T00:00:00Z",
            "record_seq": "1", "temp_c": "26.00", "turbidity_adc": "3100", "turbidity_v": "",
            "turbidity_fau": "", "battery_v": "3.60", "uptime_s": "0", "audio_file": "",
            "flags": "", "soh": "", "fw_version": "v0.1.0", "internal_temp_c": "24.50",
            "internal_humidity_pct": "41.2",
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "SCOUT-01_20261023.csv"
            with path.open("w", newline="") as fh:
                writer = csv.DictWriter(fh, fieldnames=list(row))
                writer.writeheader()
                writer.writerow(row)
            record = load_csv(path)[0]
        self.assertEqual((record.internal_temp_c, record.internal_humidity_pct), (24.5, 41.2))


if __name__ == "__main__":
    unittest.main()
