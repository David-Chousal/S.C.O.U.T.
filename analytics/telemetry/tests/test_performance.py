"""Tideline step 7: the performance budget (docs/engineering/design-system.md#performance-budget)."""

import unittest
import zlib
from pathlib import Path

from telemetry.site import assets, theme
from telemetry.site.layout import document

_STATIC = Path(__file__).resolve().parents[1] / "site" / "static"
_SITE = Path(__file__).resolve().parents[1] / "site"


class NoLottie(unittest.TestCase):
    def test_pages_load_no_animation_runtime(self):
        page = document(title="t", description="d", active="home", body="", base="")
        self.assertNotIn("lottie", page.lower())

    def test_the_runtime_and_animations_are_gone_from_the_bundle(self):
        self.assertFalse((_STATIC / "lottie").exists())

    def test_no_builder_still_asks_for_an_animation(self):
        for path in [*_SITE.glob("*.py"), *(_SITE / "pages").glob("*.py")]:
            with self.subTest(file=path.name):
                self.assertNotIn("data-lottie", path.read_text())


class InlineCss(unittest.TestCase):
    def setUp(self):
        self.css = theme.styles(base="", fonts_present=True)

    def test_ships_without_comments(self):
        self.assertNotIn("/*", self.css)

    def test_minifying_keeps_the_spaces_calc_needs(self):
        self.assertIn("calc(var(--nav-h) * -1)", self.css)

    def test_minifying_keeps_descendant_combinators(self):
        self.assertIn("main :where(p,li,dd,td) a:not([class])", self.css)

    def test_each_page_type_transfers_within_the_budget(self):
        # The budget that crosses the network: ≤ 9 KB gzip (GitHub Pages serves gzip). The raw
        # ceiling only catches regressions; raw size is parse cost, which is negligible here.
        for bundle in ("site", "dashboard"):
            with self.subTest(bundle=bundle):
                css = theme.styles(base="", fonts_present=True, bundle=bundle).encode()
                self.assertLessEqual(len(zlib.compress(css, 9)), 9 * 1024)
                self.assertLessEqual(len(css), 40 * 1024)

    def test_dashboard_pages_skip_the_hero_and_content_rules(self):
        css = theme.styles(bundle="dashboard")
        self.assertNotIn(".hero-scrim", css)
        self.assertNotIn(".carousel-track", css)
        self.assertIn(".chart-plot", css)

    def test_authored_pages_skip_the_chart_rules(self):
        css = theme.styles(bundle="site")
        self.assertNotIn(".chart-plot", css)
        self.assertIn(".hero-scrim", css)

    def test_dashboard_only_tokens_ship_with_the_dashboard(self):
        # No authored page references these, so they stay out of the site budget.
        site, dash = theme.styles(bundle="site"), theme.styles(bundle="dashboard")
        names = ("data-turb", "data-instrument", *(f"cat-{i}" for i in range(1, 6)), "z-base",
                 "z-raised", "z-sticky", "dur-instant", "ease-exit", "space-section-sm")
        for name in names:
            with self.subTest(token=name):
                self.assertIn(f"--{name}:", dash)
                self.assertNotIn(f"--{name}:", site)

    def test_authored_pages_size_and_colour_the_status_glyph(self):
        # Home's hero strip renders web.status_line() once real packets exist.
        css = theme.styles(bundle="site")
        self.assertRegex(css, r"\.status svg\{[^}]*width:11px;height:11px")
        for status, token in (("live", "live"), ("stale", "stale"), ("offline", "offline"),
                              ("fault", "warning")):
            with self.subTest(status=status):
                self.assertIn(f".status-{status} svg{{fill:var(--status-{token})}}", css)


class Images(unittest.TestCase):
    def test_every_photograph_has_an_avif(self):
        for photo in [*_STATIC.glob("img/*.jpg"), *_STATIC.glob("img/team/*.jpg")]:
            with self.subTest(photo=photo.name):
                self.assertTrue(photo.with_suffix(".avif").exists())

    def test_picture_offers_avif_before_webp(self):
        html = assets.picture('<img src="assets/img/hero.jpg" alt="">')
        self.assertLess(html.index('type="image/avif"'), html.index('type="image/webp"'))

    def test_the_hero_avif_is_within_budget(self):
        self.assertLessEqual((_STATIC / "img" / "hero.avif").stat().st_size, 120 * 1024)


if __name__ == "__main__":
    unittest.main()
