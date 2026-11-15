"""The shared heat-stress fixture still matches bleaching.py.

console/test/heat-stress-test.js checks the console Worker's JavaScript port against
fixtures/heat-stress-cases.json. This test recomputes every expected value from the Python
reference, so a change to bleaching.py or aggregate.py fails here until the fixture is
regenerated (make_heat_stress_cases.py) and the port is brought back in line.
"""

import json
import unittest
from datetime import date, datetime
from pathlib import Path

from telemetry import bleaching
from telemetry.aggregate import aggregate_daily, daily_temperature_series
from telemetry.model import TelemetryRecord, has_valid_clock

FIXTURE = json.loads((Path(__file__).parent / "fixtures" / "heat-stress-cases.json").read_text(encoding="utf-8"))


def _thermal_rows(series):
    return [{"day": t.day.isoformat(), "sst": t.sst, "hotspot": t.hotspot, "dhw": t.dhw, "alert": t.alert,
             "window_coverage": t.window_coverage} for t in series]


def _record(row):
    stamp = datetime.fromisoformat(row["timestamp_utc"].replace("Z", "+00:00"))
    flags = frozenset(f for f in row["flags"].split("|") if f)
    return TelemetryRecord(timestamp=stamp, buoy_id="SCOUT-01", record_seq=0, temp_c=row["temp_c"],
                           turbidity_adc=None, turbidity_v=None, turbidity_fau=None, battery_v=None,
                           uptime_s=None, audio_file="", flags=flags)


class HeatStressFixtureTest(unittest.TestCase):
    def test_alert_scale_matches(self):
        self.assertEqual(FIXTURE["alert_levels"], list(bleaching.ALERT_LEVELS))
        for hs, dhw, expected in FIXTURE["alert_cases"]:
            with self.subTest(hs=hs, dhw=dhw):
                self.assertEqual(bleaching.alert_level(hs, dhw), expected)

    def test_series_cases_match(self):
        for case in FIXTURE["series_cases"]:
            with self.subTest(case=case["name"]):
                daily = [(date.fromisoformat(d), t) for d, t in case["daily"]]
                series = bleaching.assess_thermal_stress(daily, case["mmm"])
                self.assertEqual(_thermal_rows(series), case["expected"])
                summary = bleaching.summarize(series, case["mmm"])
                self.assertEqual(summary.peak_alert, case["expected_summary"]["peak_alert"])
                self.assertEqual(summary.peak_dhw, case["expected_summary"]["peak_dhw"])

    def test_pipeline_case_matches(self):
        case = FIXTURE["pipeline_case"]
        timed = [r for r in map(_record, case["rows"]) if has_valid_clock(r)]
        daily = aggregate_daily(timed, samples_per_day=case["samples_per_day"])
        got = [{"day": a.day.isoformat(), "temp_mean": a.temp_mean, "temp_n": a.temp_n, "coverage": a.coverage}
               for a in daily]
        self.assertEqual(got, case["expected_daily"])
        series = bleaching.assess_thermal_stress(daily_temperature_series(daily), case["mmm"])
        self.assertEqual(_thermal_rows(series), case["expected_thermal"])


if __name__ == "__main__":
    unittest.main()
