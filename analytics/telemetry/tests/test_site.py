"""The static site build: self-contained, and honest about sample versus live data."""

import re
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from telemetry import analyze
from telemetry.model import TelemetryRecord
from telemetry.site import theme
from telemetry.site.layout import CHAT_ENDPOINT, CONSOLE_URL
from telemetry.site import build_site

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
                turbidity_v=None, turbidity_fau=None, battery_v=3.3, uptime_s=seq * 1800,
                audio_file="", flags=frozenset(),
            ))
    return out


class SelfContainedTest(unittest.TestCase):
    def test_loads_nothing_cross_origin(self):
        """No page loads a cross-origin resource: no CDN, no remote fonts/images/scripts, no
        external stylesheet. Every *loaded* resource — ``src=``, ``<link href>``, CSS ``url()`` —
        is same-origin/relative. External *hyperlinks* (``<a href>``, e.g. the header GitHub
        icon) are user navigations, not loaded resources, and are allowed: the only external URLs
        in the document must all sit inside anchor tags."""
        with tempfile.TemporaryDirectory() as tmp:
            build_site(analyze(_records(), mmm=28.0), Path(tmp))
            pages = {str(f.relative_to(tmp)): f.read_text() for f in Path(tmp).rglob("*.html")
                     if f.parent.name not in ("analytics", "fleet")}  # forwards: tested below
        for name, html in pages.items():
            with self.subTest(page=name):
                self._assert_self_contained(html)

    def _assert_self_contained(self, html):
        self.assertTrue(html.lstrip().startswith("<!doctype html>"))

        def is_external(url: str) -> bool:
            return url.startswith(("http://", "https://", "//"))

        # No known CDN / third-party hosts, and no remote stylesheet import, anywhere.
        for needle in ("//unpkg", "lottie.host", "cdn.", "@import"):
            self.assertNotIn(needle, html, f"page must not reference {needle!r}")

        # Every resource-loading context must be same-origin.
        for src in re.findall(r'\bsrc="([^"]*)"', html):
            self.assertFalse(is_external(src), f"src must be same-origin, got {src!r}")
        for href in re.findall(r'<link\b[^>]*\bhref="([^"]*)"', html):
            self.assertFalse(is_external(href), f"<link> href must be same-origin, got {href!r}")
        for url in re.findall(r'url\(\s*["\']?([^"\')]+)', html):
            self.assertFalse(is_external(url), f"CSS url() must be same-origin, got {url!r}")

        # Any external URL that does appear must be a hyperlink, never a loaded resource — with
        # one sanctioned exception: the chat proxy endpoint (the widget POSTs to it from chat.js).
        anchor_hrefs = set(re.findall(r'<a\b[^>]*\bhref="([^"]*)"', html))
        allowed = anchor_hrefs | {CHAT_ENDPOINT}
        # XML namespace names (inline SVG's xmlns) are identifiers, never fetched. The URL match
        # stops at "(", so a DOI with parentheses is checked as a prefix of its anchor's href.
        for url in re.findall(r'(?:https?:)?//[^\s"\'<>()]+', html):
            if url.startswith("http://www.w3.org/"):
                continue
            self.assertTrue(any(a.startswith(url) for a in allowed),
                            f"external URL {url!r} must be a hyperlink or the chat endpoint, "
                            "not a loaded resource")

    def test_layout_margin_invariants(self):
        """Guard the layout-margin rules whose absence caused visible bugs (folded into this one
        check so CI stays a single test): content figures (the pill cards, hero) are ``<figure>``
        elements carrying the UA default ``margin:1em 40px`` — it must be reset, and the reset
        must stay scoped to ``main`` so it never touches the header/footer; the pill cards must
        keep ``width:100%`` so each fills its grid track (otherwise they mis-align); and the
        nearshore carousel-track gap is pinned to the value we set."""
        css = re.sub(r"\s+", " ", theme.styles())          # keep single spaces: `main figure`
        tight = css.replace(" ", "")

        # 1. content-figure UA margin is reset, scoped to main.
        self.assertRegex(
            css, r"main figure\s*\{\s*margin:\s*0\s*\}",
            "content figures need `main figure{margin:0}` (else they inherit margin:1em 40px "
            "and mis-align)")
        # 2. …and never as a global `figure{...margin...}` that would reach header/footer.
        for selector, decls in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
            if "margin" in decls:
                self.assertNotIn(
                    "figure", {s.strip() for s in selector.split(",")},
                    "the figure margin reset must stay scoped to `main figure`, never a global "
                    "`figure{}` rule")
        # 3. pill cards fill their grid track (keeps them centred).
        pill = re.search(r"\.pill\s*\{([^{}]*)\}", css)
        self.assertIsNotNone(pill, ".pill rule not found in the design-system CSS")
        self.assertIn(
            "width:100%", pill.group(1).replace(" ", ""),
            ".pill must keep width:100% so it fills its grid track and stays centred")
        # 4. the nearshore carousel track gap stays as set this session.
        self.assertRegex(
            tight, r"\.carousel-track\{[^{}]*gap:12px",
            ".carousel-track gap must stay 12px")


class SampleVsLivePresentationTests(unittest.TestCase):
    """The banner is not decoration — `build.py` sets `is_sample=bool(banner)`, and that flag
    is what makes the home page say "Sample data, simulated until the buoy is deployed" rather
    than "Latest publish."

    That makes the banner load-bearing across the whole site, and it is chosen upstream by
    ``shore/scout_shore/publish.py``. If a change there ever passed a banner alongside real
    telemetry, a live reef deployment would present itself as a demo on every page. These pin
    the coupling from both ends.
    """

    def _home(self, banner):
        records = _records(days=10)
        report = analyze(records, mmm=28.0)
        with tempfile.TemporaryDirectory() as tmp:
            build_site(report, Path(tmp), banner=banner)
            return (Path(tmp) / "index.html").read_text()

    def test_real_data_presents_as_a_live_publish(self):
        home = self._home(None)
        self.assertIn("Latest publish.", home)
        self.assertNotIn("simulated until the buoy is deployed", home)

    def test_sample_data_says_so_on_the_home_page(self):
        home = self._home("Sample data: simulated telemetry for demonstration.")
        self.assertIn("simulated until the buoy is deployed", home)
        self.assertNotIn("Latest publish.", home)


class ConsoleHandoverTests(unittest.TestCase):
    """The data moved to the team console on 2026-10-30: the site links there instead of
    publishing its own Analytics and Fleet pages, and their old addresses forward."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.out = Path(self._tmp.name)
        build_site(analyze(_records(days=3), mmm=28.0), self.out)

    def tearDown(self):
        self._tmp.cleanup()

    def test_the_nav_links_the_console_and_no_analytics_page(self):
        home = (self.out / "index.html").read_text()
        self.assertIn(f'href="{CONSOLE_URL}"', home)
        self.assertNotIn('href="analytics/"', home)

    def test_old_data_addresses_forward_to_the_console(self):
        for old in ("analytics", "fleet"):
            page = (self.out / old / "index.html").read_text()
            self.assertIn(f'url={CONSOLE_URL}', page, old)


if __name__ == "__main__":
    unittest.main()
