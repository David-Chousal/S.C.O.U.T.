"""Multi-buoy (fleet) orchestration — grouping, per-buoy isolation, per-site MMM, outputs."""

import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from telemetry import analyze_fleet, group_by_buoy
from telemetry.bleaching import ALERT_NO_STRESS
from telemetry.fleet import write_fleet
from telemetry.model import TelemetryRecord

_T0 = datetime(2027, 3, 1, tzinfo=timezone.utc)


def _records(buoy_id, temp, days=14, per_day=48):
    out = []
    seq = 0
    for d in range(days):
        for s in range(per_day):
            seq += 1
            out.append(TelemetryRecord(
                timestamp=_T0 + timedelta(days=d, minutes=30 * s),
                buoy_id=buoy_id, record_seq=seq, temp_c=temp, turbidity_adc=520,
                turbidity_v=None, turbidity_ntu=None, battery_v=3.3, uptime_s=seq * 1800,
                audio_file="",
            ))
    return out


class FleetTest(unittest.TestCase):
    def test_group_by_buoy_splits_the_stream(self):
        mixed = _records("SCOUT-01", 30.0, days=1) + _records("SCOUT-02", 26.0, days=1)
        groups = group_by_buoy(mixed)
        self.assertEqual(set(groups), {"SCOUT-01", "SCOUT-02"})
        self.assertEqual(len(groups["SCOUT-01"]), 48)

    def test_each_buoy_analysed_independently_with_its_own_mmm(self):
        # SCOUT-01 warm (30 °C, MMM 28 → stress); SCOUT-02 cool (26 °C, MMM 28 → none).
        mixed = _records("SCOUT-01", 30.0) + _records("SCOUT-02", 26.0)
        fleet = analyze_fleet(mixed, mmm_by_buoy={"SCOUT-01": 28.0, "SCOUT-02": 28.0})
        self.assertEqual(set(fleet.reports), {"SCOUT-01", "SCOUT-02"})
        hot = fleet.reports["SCOUT-01"].thermal_summary
        cool = fleet.reports["SCOUT-02"].thermal_summary
        self.assertGreater(hot.peak_dhw, 0.0)          # accumulated heat
        self.assertEqual(cool.peak_dhw, 0.0)           # below MMM → nothing
        self.assertEqual(cool.peak_alert, ALERT_NO_STRESS)

    def test_missing_mmm_falls_back_to_default_then_none(self):
        mixed = _records("SCOUT-01", 30.0, days=2) + _records("SCOUT-09", 30.0, days=2)
        fleet = analyze_fleet(mixed, mmm_by_buoy={"SCOUT-01": 28.0}, default_mmm=None)
        self.assertEqual(fleet.mmm_by_buoy["SCOUT-01"], 28.0)
        self.assertIsNone(fleet.mmm_by_buoy["SCOUT-09"])          # no config, no default
        self.assertIsNone(fleet.reports["SCOUT-09"].thermal_summary)  # DHW skipped

    def test_write_fleet_emits_per_buoy_dirs_and_summary(self):
        mixed = _records("SCOUT-01", 30.0, days=5) + _records("SCOUT-02", 26.0, days=5)
        fleet = analyze_fleet(mixed, mmm_by_buoy={"SCOUT-01": 28.0, "SCOUT-02": 28.0})
        with tempfile.TemporaryDirectory() as tmp:
            summary_path = write_fleet(fleet, tmp)
            self.assertTrue((Path(tmp) / "SCOUT-01" / "telemetry_daily.csv").exists())
            self.assertTrue((Path(tmp) / "SCOUT-02" / "telemetry_summary.json").exists())
            summary = json.loads(summary_path.read_text())
            self.assertEqual(summary["n_buoys"], 2)
            self.assertIn("SCOUT-01", summary["buoys"])
            self.assertEqual(summary["buoys"]["SCOUT-01"]["mmm_c"], 28.0)


if __name__ == "__main__":
    unittest.main()
