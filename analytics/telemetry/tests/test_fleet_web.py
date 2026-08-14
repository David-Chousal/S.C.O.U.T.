"""Fleet overview page: self-contained, data-bearing, and correctly per-buoy."""

import re
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from telemetry.fleet import analyze_fleet
from telemetry.fleet_web import render_overview, write_fleet_site
from telemetry.model import TelemetryRecord

_T0 = datetime(2027, 3, 1, tzinfo=timezone.utc)
_FIXED = datetime(2027, 3, 11, 12, 0, tzinfo=timezone.utc)


def _records(buoy_id, days=10, temp=30.0):
    out = []
    seq = 0
    for d in range(days):
        for s in range(48):
            seq += 1
            out.append(TelemetryRecord(
                timestamp=_T0 + timedelta(days=d, minutes=30 * s),
                buoy_id=buoy_id, record_seq=seq, temp_c=temp, turbidity_adc=520,
                turbidity_v=None, turbidity_ntu=None, battery_v=3.3, uptime_s=seq * 1800,
                audio_file="", flags=frozenset(),
            ))
    return out


def _two_buoy_fleet():
    # SCOUT-01 warm reef → stress; SCOUT-02 cool reef → no stress. Distinct MMMs.
    records = _records("SCOUT-01", days=14, temp=30.0) + _records("SCOUT-02", days=14, temp=24.0)
    return analyze_fleet(records, mmm_by_buoy={"SCOUT-01": 27.5, "SCOUT-02": 25.0})


class FleetOverviewTest(unittest.TestCase):
    def test_loads_no_external_scripts_or_assets(self):
        """The overview is a normal site hub page (it may link out in the footer, like Home),
        but it must load no external script or asset: every ``src`` is same-origin/relative and
        no third-party CDN host is referenced."""
        html = render_overview(_two_buoy_fleet(), generated_at=_FIXED)
        self.assertTrue(html.lstrip().startswith("<!doctype html>"))
        for needle in ("//unpkg", "lottie.host", "cdn.", "googleapis", "jsdelivr"):
            self.assertNotIn(needle, html, f"page must not reference CDN host {needle!r}")
        for src in re.findall(r'src="([^"]*)"', html):
            self.assertFalse(src.startswith("http") or src.startswith("//"),
                             f"every src must be same-origin/relative, got {src!r}")

    def test_lists_every_buoy_with_a_dashboard_link(self):
        html = render_overview(_two_buoy_fleet(), generated_at=_FIXED)
        self.assertIn("SCOUT-01", html)
        self.assertIn("SCOUT-02", html)
        self.assertIn('href="SCOUT-01/"', html)
        self.assertIn('href="SCOUT-02/"', html)
        self.assertIn("<svg", html)  # sparklines rendered inline

    def test_worst_alert_sorts_first(self):
        html = render_overview(_two_buoy_fleet(), generated_at=_FIXED)
        # The stressed buoy (SCOUT-01) must appear before the calm one in the grid.
        self.assertLess(html.index('href="SCOUT-01/"'), html.index('href="SCOUT-02/"'))

    def test_single_buoy_reads_as_one_buoy(self):
        fleet = analyze_fleet(_records("SCOUT-01", days=5), mmm_by_buoy={"SCOUT-01": 28.0})
        html = render_overview(fleet, generated_at=_FIXED)
        self.assertIn("1 buoy reporting", html)

    def test_banner_is_rendered_when_provided(self):
        html = render_overview(_two_buoy_fleet(), generated_at=_FIXED, banner="SAMPLE DATA")
        self.assertIn('class="banner"', html)
        self.assertIn("SAMPLE DATA", html)

    def test_write_fleet_site_emits_overview_dashboards_and_rollup(self):
        fleet = _two_buoy_fleet()
        with tempfile.TemporaryDirectory() as tmp:
            index = write_fleet_site(fleet, tmp, generated_at=_FIXED)
            self.assertTrue(index.exists())
            self.assertTrue((Path(tmp) / "fleet_summary.json").exists())
            for buoy_id in ("SCOUT-01", "SCOUT-02"):
                self.assertTrue((Path(tmp) / buoy_id / "index.html").exists())
                self.assertTrue((Path(tmp) / buoy_id / "telemetry_daily.csv").exists())
                self.assertTrue((Path(tmp) / buoy_id / "telemetry_summary.json").exists())


if __name__ == "__main__":
    unittest.main()
