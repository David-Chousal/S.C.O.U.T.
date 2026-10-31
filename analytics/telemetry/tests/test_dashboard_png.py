"""The matplotlib PNG export: NOAA alert bands, design-token palette, calendar-true series."""

import unittest
from datetime import date, timedelta

from telemetry import dashboard

_D0 = date(2026, 9, 1)


class Bands(unittest.TestCase):
    def test_bands_follow_noaa_boundaries(self):
        spans = [(b.lo, b.hi, b.level) for b in dashboard.DHW_BANDS]
        self.assertEqual(spans, [(4.0, 8.0, "alert1"), (8.0, 12.0, "alert2"),
                                 (12.0, 16.0, "alert3"), (16.0, 20.0, "alert4"),
                                 (20.0, None, "alert5")])


class MatplotlibExport(unittest.TestCase):
    """The PNG export draws from the design tokens and the calendar."""

    def test_png_shades_only_the_bands_the_data_reached(self):
        self.assertEqual(dashboard.dhw_band_spans(13.0),
                         [(4.0, 8.0, "alert1"), (8.0, 12.0, "alert2"), (12.0, 13.0, "alert3")])
        self.assertEqual(dashboard.dhw_band_spans(3.0), [])

    def test_palette_comes_from_the_design_tokens(self):
        from telemetry.site.theme import tokens
        self.assertEqual(dashboard.PALETTE["temp"], tokens.DATA["data-temp"])
        self.assertEqual(dashboard.PALETTE["turb"], tokens.DATA["data-turb"])
        self.assertNotIn("#e74c3c", dashboard.PALETTE.values())

    def test_missing_days_are_nan_so_lines_break(self):
        import math
        days, values = dashboard.calendar_series([(_D0, 26.0), (_D0 + timedelta(days=2), 26.4)])
        self.assertEqual(len(days), 3)
        self.assertTrue(math.isnan(values[1]))
