"""Turbidity anomaly detection (robust, uncalibrated)."""

import unittest
from datetime import date, timedelta

from telemetry.turbidity import detect_events


def _series(values):
    start = date(2026, 8, 1)
    return [(start + timedelta(days=i), float(v)) for i, v in enumerate(values)]


class TurbidityTest(unittest.TestCase):
    def test_single_spike_is_flagged(self):
        result = detect_events(_series([500] * 20 + [5000]))
        self.assertEqual(len(result.events), 1)
        self.assertEqual(result.events[0].value, 5000)
        self.assertGreater(result.events[0].modified_z, 3.5)

    def test_constant_series_has_no_events(self):
        result = detect_events(_series([500] * 15))
        self.assertEqual(result.events, [])

    def test_only_positive_excursions_flagged(self):
        # A clean-water dip should not be flagged as an event (we care about dirtier water).
        result = detect_events(_series([500] * 20 + [1]))
        self.assertEqual(result.events, [])

    def test_reports_uncalibrated_note(self):
        result = detect_events(_series([500] * 10))
        self.assertIn("Uncalibrated", result.note)


if __name__ == "__main__":
    unittest.main()
