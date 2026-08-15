"""Turbidity anomaly detection (robust, uncalibrated)."""

import unittest
from datetime import date, timedelta

from telemetry.turbidity import detect_events


def _series(values):
    start = date(2026, 8, 1)
    return [(start + timedelta(days=i), float(v)) for i, v in enumerate(values)]


class TurbidityTest(unittest.TestCase):
    def test_a_drop_in_adc_is_flagged_as_dirtier_water(self):
        # The SEN0189's output falls as turbidity rises, so a sediment plume is a DIP.
        result = detect_events(_series([500] * 20 + [1]))
        self.assertEqual(len(result.events), 1)
        self.assertEqual(result.events[0].value, 1)
        self.assertLess(result.events[0].modified_z, -3.5)

    def test_constant_series_has_no_events(self):
        result = detect_events(_series([500] * 15))
        self.assertEqual(result.events, [])

    def test_a_rise_in_adc_is_clearer_water_and_not_an_event(self):
        # Regression guard for the inverted-polarity bug fixed 2026-08-15: this series used
        # to be reported as a sediment plume when it is the clearest water in the record.
        result = detect_events(_series([500] * 20 + [5000]))
        self.assertEqual(result.events, [])

    def test_note_states_the_polarity(self):
        result = detect_events(_series([500] * 10))
        self.assertIn("lower ADC count is dirtier", result.note)

    def test_reports_uncalibrated_note(self):
        result = detect_events(_series([500] * 10))
        self.assertIn("Uncalibrated", result.note)


if __name__ == "__main__":
    unittest.main()
