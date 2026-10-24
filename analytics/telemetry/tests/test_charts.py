"""Honest telemetry charts (Tideline step 6, docs/engineering/design-system-data-viz.md).

Calendar-true x-axis, a point on every measured day, lines broken at gaps, hatched gap bands,
a dashed "estimated" bridge across a single missing day only, real-pixel axis text, and an
accessible summary plus the values as a table.
"""

import re
import unittest
from datetime import date, timedelta

from telemetry import charts
from telemetry.site import theme

_D0 = date(2026, 9, 1)


def _days(values):
    return [(_D0 + timedelta(days=i), v) for i, v in enumerate(values)]


def _chart(points, **kw):
    return charts.chart(points, series="temp", title="Water temperature", unit="°C", **kw)


class Geometry(unittest.TestCase):
    def test_a_missing_calendar_day_keeps_its_place_on_the_axis(self):
        points = [(_D0, 26.0), (_D0 + timedelta(days=1), 26.1), (_D0 + timedelta(days=4), 26.4)]
        html = _chart(points)
        self.assertEqual(html.count('class="line s-temp"'), 1)  # day 2 is alone after the gap
        self.assertEqual(len(re.findall(r'class="gap"', html)), 1)
        self.assertIn("5 days", html)  # the summary counts calendar days, not rows

    def test_every_measured_day_gets_a_point(self):
        html = _chart(_days([26.0, 26.1, None, 26.3, 26.2]))
        self.assertEqual(html.count('class="pt s-temp"'), 4)

    def test_lines_break_at_gaps(self):
        html = _chart(_days([26.0, 26.1, None, None, 26.3, 26.2]))
        self.assertEqual(html.count('class="line s-temp"'), 2)


class Estimates(unittest.TestCase):
    def test_a_single_missing_day_between_measured_days_is_bridged_as_an_estimate(self):
        html = _chart(_days([26.0, 26.1, None, 26.3]))
        self.assertEqual(html.count('class="est s-temp"'), 1)

    def test_two_or_more_missing_days_are_never_bridged(self):
        html = _chart(_days([26.0, None, None, 26.3]))
        self.assertNotIn('class="est', html)

    def test_a_gap_at_the_edge_is_never_bridged(self):
        self.assertNotIn('class="est', _chart(_days([None, 26.1, 26.2])))

    def test_the_estimate_is_named_in_the_legend(self):
        self.assertIn("Estimated", _chart(_days([26.0, None, 26.3])))


class Layering(unittest.TestCase):
    def test_gap_bands_sit_beneath_the_plot_so_an_estimate_stays_visible(self):
        html = _chart(_days([26.0, 26.1, None, 26.3]))
        self.assertLess(html.index('class="gap"'), html.index("<svg"))

    def test_a_narrow_gap_carries_no_clipped_label(self):
        html = _chart(_days([26.0 + i / 10 for i in range(5)] + [None] + [26.5] * 24))
        self.assertNotIn("<b>no data</b>", html)

    def test_a_wide_gap_is_labelled(self):
        html = _chart(_days([26.0] * 5 + [None] * 6 + [26.5] * 5))
        self.assertIn("<b>no data</b>", html)


class ViewData(unittest.TestCase):
    def setUp(self):
        self.css = theme.styles(bundle="dashboard")

    def test_an_open_table_cannot_widen_the_chart(self):
        # The frame is a one-column grid; an auto column grew to the table's 520 px minimum.
        self.assertIn(".chart-frame{display:grid;grid-template-columns:minmax(0,1fr)", self.css)

    def test_the_three_column_table_fits_without_scrolling_sideways(self):
        self.assertIn(".viewdata table.data{min-width:0;", self.css)

    def test_dates_never_break_across_lines(self):
        self.assertRegex(self.css, r"\.viewdata table\.data td,\.viewdata table\.data th\{[^}]*white-space:nowrap")

    def test_the_toggle_looks_like_a_control(self):
        self.assertRegex(self.css, r"\.viewdata summary\{[^}]*border:var\(--border-control\)")
        self.assertIn(".viewdata summary::-webkit-details-marker{display:none}", self.css)

    def test_the_chevron_turns_when_open(self):
        self.assertIn(".viewdata summary::after{", self.css)
        self.assertRegex(self.css, r"\.viewdata\[open\] summary::after\{[^}]*transform:")


class AxisText(unittest.TestCase):
    def test_a_flat_series_prints_one_y_label_not_two_on_top_of_each_other(self):
        html = _chart(_days([26.0, 26.0, 26.0]))
        self.assertEqual(html.count('class="ax ax-y"'), 1)


    def test_axis_labels_are_html_not_scaled_svg_text(self):
        html = _chart(_days([26.0, 26.4]))
        self.assertNotIn("<text", html)
        self.assertIn('class="ax', html)

    def test_dates_are_iso(self):
        html = _chart(_days([26.0, 26.4]))
        self.assertIn("2026-09-01", html)
        self.assertIn("2026-09-02", html)


class Accessibility(unittest.TestCase):
    def test_the_plot_is_an_image_with_a_summary_naming_the_gaps(self):
        html = _chart(_days([26.0, None, None, 26.3]))
        label = re.search(r'role="img" aria-label="([^"]+)"', html).group(1)
        self.assertIn("2 days without data", label)

    def test_the_values_are_available_as_a_table(self):
        html = _chart(_days([26.0, None, 26.3]))
        table = html.split("<details", 1)[1]
        self.assertEqual(table.count("<tr>"), 4)  # header + three calendar days
        self.assertIn("no value", table)  # a day that had rows but no usable reading

    def test_a_day_with_no_rows_reads_as_no_packets(self):
        points = [(_D0, 26.0), (_D0 + timedelta(days=2), 26.3)]
        self.assertIn("no packets", _chart(points).split("<details", 1)[1])

    def test_the_reason_for_a_low_coverage_day_is_shown(self):
        html = _chart(_days([26.0, None, 26.3]),
                      missing_reasons={_D0 + timedelta(days=1): "too few samples (12)"})
        self.assertIn("too few samples (12)", html)


class Bands(unittest.TestCase):
    def test_every_alert_level_gets_its_own_band_once_reached(self):
        html = charts.chart(_days([0.0, 6.0, 13.0, 21.0]), series="dhw",
                            title="Degree Heating Weeks", unit="°C-weeks", bands=charts.DHW_BANDS)
        for level in ("alert1", "alert2", "alert3", "alert4", "alert5"):
            with self.subTest(level=level):
                self.assertIn(f"band-{level}", html)

    def test_bands_follow_noaa_boundaries(self):
        spans = [(b.lo, b.hi, b.level) for b in charts.DHW_BANDS]
        self.assertEqual(spans, [(4.0, 8.0, "alert1"), (8.0, 12.0, "alert2"),
                                 (12.0, 16.0, "alert3"), (16.0, 20.0, "alert4"),
                                 (20.0, None, "alert5")])

    def test_a_peak_of_thirteen_draws_level_3_but_not_level_4(self):
        html = charts.chart(_days([0.0, 9.0, 13.0]), series="dhw", title="Degree Heating Weeks",
                            unit="°C-weeks", bands=charts.DHW_BANDS)
        self.assertIn("band-alert3", html)
        self.assertNotIn("band-alert4", html)


    def test_no_band_is_drawn_until_the_data_reaches_it(self):
        html = charts.chart(_days([0.0, 2.0, 3.8]), series="dhw", title="Degree Heating Weeks",
                            unit="°C-weeks", bands=charts.DHW_BANDS)
        self.assertNotIn("band-alert1", html)


class Sparkline(unittest.TestCase):
    def test_sparkline_breaks_at_gaps_and_marks_the_latest_reading(self):
        html = charts.sparkline(_days([26.0, 26.1, None, None, 26.3, 26.2]), mmm=27.0)
        self.assertEqual(html.count('class="line s-temp"'), 2)
        self.assertEqual(html.count('class="pt-last'), 1)

    def test_empty_sparkline_says_so(self):
        self.assertIn("spark-empty", charts.sparkline([], mmm=None))


if __name__ == "__main__":
    unittest.main()


class DashboardIntegration(unittest.TestCase):
    """The Analytics and Fleet pages use the honest charts and say how fresh the data is."""

    @classmethod
    def setUpClass(cls):
        from datetime import datetime, timezone
        from telemetry import analyze
        from telemetry.fleet import FleetReport
        from telemetry.fleet_web import render_overview
        from telemetry.model import TelemetryRecord
        from telemetry.web import render_html
        t0 = datetime(2027, 3, 1, tzinfo=timezone.utc)
        records, seq = [], 0
        for d in (0, 1, 2, 4, 5):          # day 3 sends nothing
            for s in range(48):
                seq += 1
                records.append(TelemetryRecord(
                    timestamp=t0 + timedelta(days=d, minutes=30 * s), buoy_id="SCOUT-01",
                    record_seq=seq, temp_c=27.0, turbidity_adc=520, turbidity_v=None,
                    turbidity_fau=None, battery_v=3.6, uptime_s=seq * 1800, audio_file="",
                    flags=frozenset()))
        report = analyze(records, mmm=27.6)
        published = t0 + timedelta(days=5, hours=23, minutes=55)
        cls.analytics = render_html(report, generated_at=published)
        fleet = FleetReport({"SCOUT-01": report}, {"SCOUT-01": 27.6})
        cls.fleet = render_overview(fleet, generated_at=published)

    def test_the_missing_day_is_a_gap_not_a_join(self):
        self.assertIn('class="gap"', self.analytics)
        self.assertIn("1 day without data", self.analytics)

    def test_the_page_says_how_fresh_the_data_is_against_the_slots(self):
        self.assertIn("status status-live", self.analytics)
        self.assertIn("Latest reading 23:30 UTC", self.analytics)  # its 00:10 slot is still ahead
        self.assertIn("Published", self.analytics)

    def test_the_slot_rule_shows_packet_history(self):
        self.assertIn('class="slot-rule"', self.analytics)
        self.assertIn("transmit slots received", self.analytics)

    def test_fleet_tiles_carry_status_a_filled_alert_badge_and_an_honest_sparkline(self):
        self.assertIn("status status-live", self.fleet)
        self.assertIn("alert-badge lvl-", self.fleet)
        self.assertIn('class="pt-last s-temp"', self.fleet)

    def test_no_legacy_chart_colours_remain(self):
        for page in (self.analytics, self.fleet):
            self.assertNotIn("var(--c-", page)
            self.assertNotIn("var(--a-", page)


class MatplotlibExport(unittest.TestCase):
    """The PNG export draws from the same tokens and the same calendar as the web charts."""

    def test_png_shades_the_same_bands_as_the_web_chart(self):
        from telemetry import dashboard
        self.assertEqual(dashboard.dhw_band_spans(13.0),
                         [(4.0, 8.0, "alert1"), (8.0, 12.0, "alert2"), (12.0, 13.0, "alert3")])
        self.assertEqual(dashboard.dhw_band_spans(3.0), [])

    def test_palette_comes_from_the_design_tokens(self):
        from telemetry import dashboard
        from telemetry.site.theme import tokens
        self.assertEqual(dashboard.PALETTE["temp"], tokens.DATA["data-temp"])
        self.assertEqual(dashboard.PALETTE["turb"], tokens.DATA["data-turb"])
        self.assertNotIn("#e74c3c", dashboard.PALETTE.values())

    def test_missing_days_are_nan_so_lines_break(self):
        import math
        from telemetry import dashboard
        days, values = dashboard.calendar_series([(_D0, 26.0), (_D0 + timedelta(days=2), 26.4)])
        self.assertEqual(len(days), 3)
        self.assertTrue(math.isnan(values[1]))
