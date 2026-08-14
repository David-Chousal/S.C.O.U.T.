"""End-to-end pipeline: records → analysis → written outputs, and CSV round-trip via io."""

import csv
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from telemetry import analyze, load_csv, run
from telemetry.bleaching import ALERT_LEVELS, ALERT_NO_STRESS
from telemetry.model import TelemetryRecord
from telemetry.pipeline import write_daily_csv, write_summary_json

_T0 = datetime(2026, 3, 1, 0, 0, tzinfo=timezone.utc)
_SCHEMA_COLUMNS = (
    "schema_version,buoy_id,timestamp_utc,record_seq,temp_c,turbidity_adc,turbidity_v,"
    "turbidity_ntu,battery_v,uptime_s,audio_file,flags,fw_version"
).split(",")


def _warm_records(days=14, per_day=48, temp=30.0):
    records = []
    seq = 0
    for d in range(days):
        for s in range(per_day):
            seq += 1
            ts = _T0 + timedelta(days=d, minutes=s * 30)
            records.append(
                TelemetryRecord(
                    timestamp=ts,
                    buoy_id="SCOUT-01",
                    record_seq=seq,
                    temp_c=temp,
                    turbidity_adc=500,
                    turbidity_v=None,
                    turbidity_ntu=None,
                    battery_v=3.3,
                    uptime_s=seq * 1800,
                    audio_file="",
                    flags=frozenset(),
                )
            )
    return records


class PipelineTest(unittest.TestCase):
    def test_warm_deployment_accumulates_thermal_stress(self):
        # 14 days at 30 °C, MMM 28 → HotSpot 2, DHW reaches 4.0 by day 14 → at least Alert Level 1.
        report = analyze(_warm_records(days=14), mmm=28.0)
        self.assertIsNotNone(report.thermal_summary)
        self.assertGreaterEqual(report.thermal_summary.peak_dhw, 4.0)
        self.assertGreaterEqual(
            ALERT_LEVELS.index(report.thermal_summary.peak_alert),
            ALERT_LEVELS.index("Alert Level 1"),
        )

    def test_no_mmm_skips_thermal_but_still_runs(self):
        report = analyze(_warm_records(days=5), mmm=None)
        self.assertIsNone(report.thermal_summary)
        self.assertEqual(report.thermal, [])
        self.assertGreater(report.qc.n_records, 0)

    def test_writes_daily_csv_and_summary(self):
        report = analyze(_warm_records(days=7), mmm=28.0)
        with tempfile.TemporaryDirectory() as tmp:
            daily_path = write_daily_csv(report, Path(tmp) / "daily.csv")
            summary_path = write_summary_json(report, Path(tmp) / "summary.json")

            with daily_path.open() as fh:
                rows = list(csv.DictReader(fh))
            self.assertEqual(len(rows), 7)  # one row per day
            self.assertIn("dhw_c_weeks", rows[0])

            summary = json.loads(summary_path.read_text())
            self.assertIsNotNone(summary["thermal_stress"])
            self.assertEqual(summary["thermal_stress"]["mmm_c"], 28.0)

    def test_full_run_from_csv_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            csv_path = Path(tmp) / "SCOUT-01_20260301.csv"
            self._write_csv(csv_path, _warm_records(days=3))
            loaded = load_csv(csv_path)
            self.assertEqual(len(loaded), 3 * 48)

            report = run(csv_path, mmm=28.0, out_dir=Path(tmp) / "out")
            self.assertTrue((Path(tmp) / "out" / "telemetry_daily.csv").exists())
            self.assertTrue((Path(tmp) / "out" / "telemetry_summary.json").exists())
            self.assertNotEqual(report.temp_trend.label, ALERT_NO_STRESS)  # sanity: it ran

    @staticmethod
    def _write_csv(path, records):
        with path.open("w", newline="") as fh:
            writer = csv.writer(fh)
            writer.writerow(_SCHEMA_COLUMNS)
            for r in records:
                writer.writerow([
                    r.schema_version, r.buoy_id,
                    r.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"), r.record_seq,
                    f"{r.temp_c:.2f}", r.turbidity_adc, "", "",
                    f"{r.battery_v:.2f}", r.uptime_s, r.audio_file,
                    "|".join(sorted(r.flags)), r.fw_version,
                ])


if __name__ == "__main__":
    unittest.main()
