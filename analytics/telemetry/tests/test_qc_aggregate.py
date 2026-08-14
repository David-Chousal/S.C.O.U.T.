"""QC and daily-aggregation behavior."""

import unittest
from datetime import datetime, timedelta, timezone

from telemetry.aggregate import aggregate_daily, daily_temperature_series
from telemetry.model import TelemetryRecord
from telemetry.qc import run_qc

_T0 = datetime(2026, 8, 14, 0, 0, tzinfo=timezone.utc)


def _rec(minutes, temp=26.0, turb=500, batt=3.3, seq=0, flags=frozenset()):
    return TelemetryRecord(
        timestamp=_T0 + timedelta(minutes=minutes),
        buoy_id="SCOUT-01",
        record_seq=seq,
        temp_c=temp,
        turbidity_adc=turb,
        turbidity_v=None,
        turbidity_ntu=None,
        battery_v=batt,
        uptime_s=seq * 1800,
        audio_file="",
        flags=flags,
    )


class QCTest(unittest.TestCase):
    def test_detects_gap_and_counts_missing(self):
        # 0, 30 min, then jump to 180 min (a 2.5 h gap → ~4 missing samples).
        records = [_rec(0), _rec(30), _rec(180)]
        report = run_qc(records)
        self.assertEqual(len(report.gaps), 1)
        self.assertEqual(report.gaps[0].missing, 4)
        self.assertLess(report.completeness_pct, 100.0)

    def test_detects_duplicate_timestamps(self):
        report = run_qc([_rec(0), _rec(0), _rec(30)])
        self.assertEqual(report.duplicate_timestamps, 1)

    def test_flags_out_of_range_temperature(self):
        report = run_qc([_rec(0, temp=26.0), _rec(30, temp=999.0)])
        self.assertEqual(report.temp_out_of_range, 1)

    def test_tallies_flags(self):
        report = run_qc([_rec(0, flags=frozenset({"BATT_LOW_SKIP_TX"})), _rec(30)])
        self.assertEqual(report.flag_counts.get("BATT_LOW_SKIP_TX"), 1)


class AggregateTest(unittest.TestCase):
    def test_full_day_gets_a_mean_sparse_day_does_not(self):
        # Day 1: 30 samples (>50% of 48) → mean present. Day 2: 5 samples → below floor → None.
        day1 = [_rec(i * 30, temp=26.0 + 0.01 * i) for i in range(30)]
        day2_start = 24 * 60
        day2 = [_rec(day2_start + i * 30, temp=30.0) for i in range(5)]
        daily = aggregate_daily(day1 + day2)
        self.assertEqual(len(daily), 2)
        self.assertIsNotNone(daily[0].temp_mean)
        self.assertGreaterEqual(daily[0].coverage, 0.5)
        self.assertIsNone(daily[1].temp_mean)  # sparse day excluded from the mean
        # Only the trustworthy day feeds the temperature series.
        series = daily_temperature_series(daily)
        self.assertEqual(len(series), 1)

    def test_out_of_range_temps_excluded_from_mean(self):
        good = [_rec(i * 30, temp=26.0) for i in range(30)]
        bad = _rec(30 * 30, temp=500.0)  # spike excluded
        daily = aggregate_daily(good + [bad])
        self.assertAlmostEqual(daily[0].temp_mean, 26.0, places=3)


if __name__ == "__main__":
    unittest.main()
