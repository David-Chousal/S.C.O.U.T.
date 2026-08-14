"""NOAA Coral Reef Watch DHW / HotSpot / alert-level correctness."""

import unittest
from datetime import date, timedelta

from telemetry.bleaching import (
    ALERT_LEVEL_1,
    ALERT_LEVEL_2,
    ALERT_NO_STRESS,
    ALERT_WARNING,
    ALERT_WATCH,
    alert_level,
    assess_thermal_stress,
    bleaching_threshold,
    hotspot,
    summarize,
)

MMM = 28.0  # threshold = 29.0


def _run(daily_sst, mmm=MMM):
    start = date(2027, 3, 1)
    daily = [(start + timedelta(days=i), t) for i, t in enumerate(daily_sst)]
    return assess_thermal_stress(daily, mmm)


class HotspotTest(unittest.TestCase):
    def test_positive_anomaly(self):
        self.assertEqual(hotspot(30.0, 28.0), 2.0)

    def test_below_mmm_clips_to_zero(self):
        self.assertEqual(hotspot(27.0, 28.0), 0.0)

    def test_threshold_is_mmm_plus_one(self):
        self.assertEqual(bleaching_threshold(28.0), 29.0)


class AlertLevelTest(unittest.TestCase):
    def test_no_stress_when_at_or_below_mmm(self):
        self.assertEqual(alert_level(0.0, 0.0), ALERT_NO_STRESS)

    def test_watch_between_mmm_and_threshold(self):
        self.assertEqual(alert_level(0.5, 0.0), ALERT_WATCH)

    def test_warning_above_threshold_low_dhw(self):
        self.assertEqual(alert_level(1.5, 2.0), ALERT_WARNING)

    def test_alert_1_at_dhw_4(self):
        self.assertEqual(alert_level(1.5, 4.0), ALERT_LEVEL_1)

    def test_alert_2_at_dhw_8(self):
        self.assertEqual(alert_level(2.0, 8.0), ALERT_LEVEL_2)

    def test_cooling_drops_to_watch_despite_high_dhw(self):
        # HotSpot below 1 °C: heat is receding, so it cannot be Warning/Alert regardless of DHW.
        self.assertEqual(alert_level(0.5, 10.0), ALERT_WATCH)


class DHWAccumulationTest(unittest.TestCase):
    def test_dhw_matches_hand_computation(self):
        # 14 days at +2 °C HotSpot → Σ = 28 °C-days → DHW = 28/7 = 4.0 on the 14th day.
        series = _run([30.0] * 14)
        self.assertAlmostEqual(series[-1].dhw, 4.0, places=6)
        self.assertEqual(series[-1].alert, ALERT_LEVEL_1)

    def test_partial_accumulation(self):
        # 6 days at +2 °C → Σ = 12 → DHW = 12/7 ≈ 1.714; still just a Warning.
        series = _run([30.0] * 6)
        self.assertAlmostEqual(series[-1].dhw, 12 / 7, places=3)
        self.assertEqual(series[-1].alert, ALERT_WARNING)

    def test_subthreshold_heat_does_not_accumulate(self):
        # +0.5 °C anomalies never reach the 1 °C HotSpot floor, so DHW stays 0.
        series = _run([28.5] * 30)
        self.assertEqual(series[-1].dhw, 0.0)
        self.assertEqual(series[-1].alert, ALERT_WATCH)

    def test_window_only_looks_back_84_days(self):
        # A hot fortnight followed by 90 cool days: the hot days age out of the window → DHW 0.
        series = _run([30.0] * 14 + [27.0] * 90)
        self.assertEqual(series[-1].dhw, 0.0)
        self.assertEqual(series[-1].alert, ALERT_NO_STRESS)


class GapHandlingTest(unittest.TestCase):
    def test_missing_days_are_filled_and_coverage_reported(self):
        # Two hot days, a 5-day gap, then one more hot day.
        start = date(2027, 3, 1)
        daily = [
            (start, 30.0),
            (start + timedelta(days=1), 30.0),
            (start + timedelta(days=7), 30.0),
        ]
        series = assess_thermal_stress(daily, MMM)
        self.assertEqual(len(series), 8)  # calendar filled Mar 1..Mar 8
        self.assertIsNone(series[3].sst)  # a gap day
        # DHW on the last day counts only the 3 present hot days: 3*2/7.
        self.assertAlmostEqual(series[-1].dhw, 6 / 7, places=3)
        self.assertLess(series[-1].window_coverage, 1.0)


class SummaryTest(unittest.TestCase):
    def test_summary_captures_peak(self):
        series = _run([30.0] * 30)  # DHW climbs past 8 → Alert Level 2
        summ = summarize(series, MMM)
        self.assertEqual(summ.threshold, 29.0)
        self.assertEqual(summ.peak_alert, ALERT_LEVEL_2)
        self.assertEqual(summ.days_at_or_above_threshold, 30)
        self.assertGreaterEqual(summ.peak_dhw, 8.0)


if __name__ == "__main__":
    unittest.main()
