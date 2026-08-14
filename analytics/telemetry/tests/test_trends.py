"""Mann-Kendall + Sen's slope correctness (pure-Python path)."""

import unittest
from datetime import date, timedelta

from telemetry.trends import mann_kendall


def _series(values):
    start = date(2026, 8, 1)
    return [(start + timedelta(days=i), float(v)) for i, v in enumerate(values)]


class MannKendallTest(unittest.TestCase):
    def test_strictly_increasing_is_significant(self):
        r = mann_kendall(_series(range(1, 13)))
        self.assertEqual(r.label, "increasing")
        self.assertLess(r.p_value, 0.05)
        self.assertAlmostEqual(r.tau, 1.0, places=6)
        self.assertAlmostEqual(r.slope_per_day, 1.0, places=6)

    def test_strictly_decreasing_is_significant(self):
        r = mann_kendall(_series(range(12, 0, -1)))
        self.assertEqual(r.label, "decreasing")
        self.assertLess(r.p_value, 0.05)
        self.assertAlmostEqual(r.tau, -1.0, places=6)

    def test_flat_series_has_no_trend(self):
        r = mann_kendall(_series([5.0] * 12))
        self.assertEqual(r.label, "no trend")
        self.assertEqual(r.tau, 0.0)

    def test_too_few_points_is_insufficient(self):
        r = mann_kendall(_series([1, 2, 3]))
        self.assertEqual(r.label, "insufficient data")
        self.assertIsNone(r.p_value)

    def test_slope_per_year_scales_from_per_day(self):
        # +0.01 °C/day → ~3.65 °C/yr.
        r = mann_kendall(_series([20 + 0.01 * i for i in range(30)]))
        self.assertAlmostEqual(r.slope_per_day, 0.01, places=4)
        self.assertAlmostEqual(r.slope_per_year, 0.01 * 365.25, places=2)


if __name__ == "__main__":
    unittest.main()
