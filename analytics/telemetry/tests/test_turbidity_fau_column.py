"""The calibrated-turbidity column is `turbidity_fau`, not `turbidity_ntu` (SCO-12).

The Grove sensor measures light transmitted straight through the water, so a formazin
calibration gives formazin attenuation units (FAU), not nephelometric NTU (ISO 7027-1:2016).
CSVs written before the rename still carry `turbidity_ntu`; the reader accepts either so they
keep loading.
"""

import csv
import tempfile
import unittest
from pathlib import Path

from telemetry import load_csv

_BASE = {
    "schema_version": "1", "buoy_id": "SCOUT-01", "timestamp_utc": "2026-10-23T00:00:00Z",
    "record_seq": "1", "temp_c": "26.00", "turbidity_adc": "3100", "turbidity_v": "",
    "battery_v": "3.60", "uptime_s": "0", "audio_file": "", "flags": "", "soh": "",
    "fw_version": "v0.1.0",
}


def _load(column: str, value: str):
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "SCOUT-01_20261023.csv"
        row = {**_BASE, column: value}
        with path.open("w", newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=list(row))
            writer.writeheader()
            writer.writerow(row)
        return load_csv(path)[0]


class TurbidityFauColumnTest(unittest.TestCase):
    def test_reads_the_fau_column(self):
        self.assertEqual(_load("turbidity_fau", "12.5").turbidity_fau, 12.5)

    def test_still_reads_the_legacy_ntu_column(self):
        self.assertEqual(_load("turbidity_ntu", "7.0").turbidity_fau, 7.0)

    def test_empty_means_uncalibrated(self):
        self.assertIsNone(_load("turbidity_fau", "").turbidity_fau)


if __name__ == "__main__":
    unittest.main()
