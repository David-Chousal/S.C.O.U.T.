"""Static dashboard generator: self-contained, correct, and data-bearing."""

import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from telemetry import analyze
from telemetry.model import TelemetryRecord
from telemetry.web import render_html, write_site

_T0 = datetime(2027, 3, 1, tzinfo=timezone.utc)


def _records(days=10, temp=30.0):
    out = []
    seq = 0
    for d in range(days):
        for s in range(48):
            seq += 1
            out.append(TelemetryRecord(
                timestamp=_T0 + timedelta(days=d, minutes=30 * s),
                buoy_id="SCOUT-01", record_seq=seq, temp_c=temp, turbidity_adc=520,
                turbidity_v=None, turbidity_ntu=None, battery_v=3.3, uptime_s=seq * 1800,
                audio_file="", flags=frozenset(),
            ))
    return out


_FIXED = datetime(2027, 3, 11, 12, 0, tzinfo=timezone.utc)


class WebDashboardTest(unittest.TestCase):
    def test_no_external_or_cross_origin_references(self):
        """The page loads the shared self-hosted ambient animations, so it now carries
        same-origin scripts, but it references no external/CDN host: no absolute URLs, and every
        ``src`` is a same-origin relative path. It still needs no third party and no network
        beyond its own origin."""
        import re

        html = render_html(analyze(_records(), mmm=28.0), generated_at=_FIXED)
        self.assertTrue(html.lstrip().startswith("<!doctype html>"))
        for needle in ("http://", "https://", "//unpkg", "lottie.host", "cdn."):
            self.assertNotIn(needle, html, f"page must not reference external host {needle!r}")
        for src in re.findall(r'src="([^"]*)"', html):
            self.assertFalse(
                src.startswith("http") or src.startswith("//"),
                f"every src must be same-origin/relative, got {src!r}",
            )

    def test_shows_thermal_status_when_mmm_given(self):
        html = render_html(analyze(_records(days=14), mmm=28.0), generated_at=_FIXED)
        self.assertIn("Degree Heating Weeks", html)
        self.assertIn("Peak alert", html)
        self.assertIn("2027-03-11 12:00 UTC", html)  # generated timestamp

    def test_gracefully_omits_dhw_without_mmm(self):
        html = render_html(analyze(_records(days=5), mmm=None), generated_at=_FIXED)
        self.assertIn("no MMM set", html)
        self.assertNotIn("<h2>Degree Heating Weeks", html)  # DHW panel skipped (footer mention is fine)

    def test_banner_is_rendered_when_provided(self):
        html = render_html(analyze(_records(days=5), mmm=28.0), generated_at=_FIXED,
                           banner="SAMPLE DATA — simulated")
        self.assertIn('class="banner"', html)
        self.assertIn("SAMPLE DATA — simulated", html)

    def test_no_banner_by_default(self):
        html = render_html(analyze(_records(days=5), mmm=28.0), generated_at=_FIXED)
        self.assertNotIn('class="banner"', html)

    def test_write_site_emits_index_and_raw_data(self):
        report = analyze(_records(days=7), mmm=28.0)
        with tempfile.TemporaryDirectory() as tmp:
            index = write_site(report, tmp, generated_at=_FIXED)
            self.assertTrue(index.exists())
            self.assertTrue((Path(tmp) / "telemetry_daily.csv").exists())
            self.assertTrue((Path(tmp) / "telemetry_summary.json").exists())
            body = index.read_text()
            self.assertIn('href="telemetry_daily.csv"', body)
            self.assertIn("<svg", body)  # charts rendered inline


if __name__ == "__main__":
    unittest.main()
