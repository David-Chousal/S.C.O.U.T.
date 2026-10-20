"""Self-hosted fonts: DM Sans for prose, JetBrains Mono for measured values (Tideline step 3)."""

import re
import unittest
from pathlib import Path

from telemetry.site import theme
from telemetry.site.layout import document
from telemetry.site.theme import fonts

_FONTS_DIR = Path(__file__).resolve().parents[1] / "site" / "static" / "fonts"
_SUBSET_SCRIPT = Path(__file__).resolve().parents[3] / "scripts" / "subset_site_fonts.py"


def _faces(css: str) -> list[str]:
    return re.findall(r"@font-face\{[^}]*\}", css)


class FontFaces(unittest.TestCase):
    def setUp(self):
        self.css = theme.styles(base="../", fonts_present=True)

    def test_each_web_font_file_has_a_swapping_face_with_a_unicode_range(self):
        for file in ("dmsans-latin.woff2", "dmsans-latin-ext.woff2", "jetbrainsmono-latin.woff2"):
            with self.subTest(file=file):
                face = next(f for f in _faces(self.css) if file in f)
                self.assertIn("font-display:swap", face)
                self.assertIn("unicode-range:", face)
                self.assertIn(f"url('../assets/fonts/{file}')", face)

    def test_no_synthetic_fallback_faces(self):
        # Measured 2026-10-20 (macOS Chrome): Arial scaled to DM Sans' metrics shifted layout
        # (Technology mobile CLS 0.051, About desktop 0.016); the system UI font shifted nothing.
        self.assertNotIn("Fallback", self.css)

    def test_stacks_put_the_web_font_first_then_the_system_font(self):
        self.assertRegex(self.css, r"--font:'DM Sans',ui-sans-serif,system-ui,")
        self.assertRegex(self.css, r"--font-mono:'JetBrains Mono',ui-monospace,")

    def test_optical_sizing_is_on(self):
        self.assertIn("font-optical-sizing:auto", self.css)

    def test_no_web_font_face_without_the_files(self):
        self.assertEqual(_faces(theme.styles()), [])


class Preload(unittest.TestCase):
    # Measured 2026-10-20 on mobile 4G: preloading the core subset took Home's LCP (the hero
    # title) from 3.46 to 3.01 s, but on Science pushed first paint 524 -> 788 ms and LCP
    # 1.22 -> 2.46 s. So only Home preloads.
    def _doc(self, active: str, present: bool = True) -> str:
        return document(title="t", description="d", active=active, body="", base="",
                        fonts_present=present)

    def test_home_preloads_the_core_sans(self):
        self.assertIn('<link rel="preload" href="assets/fonts/dmsans-latin.woff2" as="font" '
                      'type="font/woff2" crossorigin>', self._doc("home"))

    def test_other_pages_do_not_preload(self):
        for active in ("technology", "science", "about", "analytics", "fleet"):
            with self.subTest(active=active):
                self.assertNotIn('rel="preload"', self._doc(active))

    def test_nothing_is_preloaded_without_the_files(self):
        self.assertNotIn('rel="preload"', self._doc("home", present=False))


class FontFiles(unittest.TestCase):
    def test_the_shipped_files_are_exactly_the_three_subsets(self):
        self.assertEqual(sorted(p.name for p in _FONTS_DIR.glob("*.woff2")), [
            "dmsans-latin-ext.woff2", "dmsans-latin.woff2", "jetbrainsmono-latin.woff2"])

    def test_a_page_without_extended_latin_stays_within_the_60_kb_font_budget(self):
        core = sum((_FONTS_DIR / f).stat().st_size
                   for f in ("dmsans-latin.woff2", "jetbrainsmono-latin.woff2"))
        self.assertLessEqual(core, 60 * 1024)

    def test_both_licences_ship_with_the_fonts(self):
        self.assertIn("DM Sans", (_FONTS_DIR / "OFL.txt").read_text())
        self.assertIn("JetBrains Mono", (_FONTS_DIR / "ofl-jetbrains-mono.txt").read_text())

    def test_css_unicode_ranges_match_the_subsetting_script(self):
        script = _SUBSET_SCRIPT.read_text()
        for name in ("SANS_LATIN", "SANS_LATIN_EXT", "MONO_LATIN"):
            with self.subTest(name=name):
                block = script.split(f"{name} = ", 1)[1].split("\n\n", 1)[0].split("\n#", 1)[0]
                ranges = "".join(re.findall(r'"([^"]+)"', block))
                self.assertEqual(getattr(fonts, name), ranges)


if __name__ == "__main__":
    unittest.main()
