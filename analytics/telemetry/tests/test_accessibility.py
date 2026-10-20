"""WCAG 2.2 AA on the site's light ground (Tideline step 4), checked from the emitted CSS and markup.

Text colours are resolved through the custom-property chain in the ``:root`` blocks, so a token
that drifts below 4.5:1 fails here rather than in an audit. Rules that paint on a dark or
photographic ground (the hero, the ink card, image captions, the chat glass) are excluded: their
contrast is measured against the photograph or the night tokens elsewhere.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

from telemetry.site import theme
from telemetry.site.components import carousel
from telemetry.site.layout import header
from telemetry.site.theme import colour, tokens

_JS = Path(__file__).resolve().parents[1] / "site" / "static" / "js"
_DARK_GROUND = re.compile(
    r"\.hero|card-ink|\.chat|\.pill|at-top|::selection|\.skip|btn-primary|figcaption|"
    r"carousel-arrow|\.drawing")
_GROUNDS = (tokens.hex_of("color-canvas"), tokens.hex_of("color-surface"))


def _rules(css: str):
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        yield sel.strip().split("\n")[-1].strip(), body


def _root_properties(css: str) -> dict:
    props = {}
    for sel, body in _rules(css):
        if sel == ":root":
            props.update(re.findall(r"--([\w-]+):([^;]+);?", body))
    return props


def _resolve(value: str, props: dict) -> str | None:
    """A ``var(--x)`` chain to an opaque hex, or None if it is not a plain opaque colour."""
    for _ in range(10):
        value = value.strip()
        m = re.fullmatch(r"var\(--([\w-]+)\)", value)
        if not m:
            break
        value = props.get(m.group(1), "")
    return value if re.fullmatch(r"#[0-9a-fA-F]{6}", value) else None


class TextContrastOnTheLightGround(unittest.TestCase):
    def test_every_text_colour_passes_aa_on_canvas_and_surface(self):
        css = theme.styles()
        props = _root_properties(css)
        for sel, body in _rules(css):
            if _DARK_GROUND.search(sel):
                continue
            # Text that sits on its own opaque fill (a filled badge) is checked against that fill.
            own = re.search(r"(?<![-\w])background:([^;}]+)", body)
            own_ground = _resolve(own.group(1), props) if own else None
            grounds = (own_ground,) if own_ground else _GROUNDS
            for value in re.findall(r"(?<![-\w])color:([^;}]+)", body):
                hexval = _resolve(value, props)
                if hexval is None:
                    continue
                for ground in grounds:
                    with self.subTest(selector=sel, colour=value.strip(), ground=ground):
                        self.assertGreaterEqual(colour.wcag(hexval, ground), 4.5)

    def test_faint_is_retired(self):
        self.assertNotIn("--faint", theme.styles())

    def test_alert_text_on_its_badge_tint_passes_aa(self):
        surface = tokens.hex_of("color-surface")
        for level, text in tokens.ALERT_TEXT.items():
            with self.subTest(level=level):
                tint = colour.mix(text, 0.12, surface)
                self.assertGreaterEqual(colour.wcag(text, tint), 4.5)


class Edges(unittest.TestCase):
    def test_buttons_and_inputs_are_edged_at_three_to_one(self):
        css = theme.styles()
        self.assertRegex(css, r"\.btn\{[^}]*border:1px solid var\(--color-line-strong\)")
        self.assertRegex(css, r"\.chat-field\{[^}]*border:1px solid var\(--color-line-strong\)")


class Links(unittest.TestCase):
    def test_links_in_running_text_are_underlined(self):
        self.assertRegex(theme.styles(),
                         r"main :where\(p,li,dd,td\) a:not\(\[class\]\)\{text-decoration:underline")


class MinimumTextSize(unittest.TestCase):
    # SVG chart axis labels scale with the chart's viewBox, so CSS cannot floor them; the
    # chart rebuild (migration step 6) sets them in screen pixels.
    _DEFERRED = {".chart .ax"}

    def test_no_text_below_twelve_pixels(self):
        for sel, body in _rules(theme.styles()):
            if sel in self._DEFERRED:
                continue
            for size in re.findall(r"font-size:([\d.]+)(rem|px)\b", body):
                with self.subTest(selector=sel, size="".join(size)):
                    px = float(size[0]) * (16 if size[1] == "rem" else 1)
                    self.assertGreaterEqual(px, 12)


class HeaderOverHero(unittest.TestCase):
    def test_scrim_top_stop_and_nav_text_carry_the_measured_values(self):
        css = theme.styles()
        self.assertIn("linear-gradient(180deg,rgba(8,16,21,0.62) 0%", css)
        self.assertIn("color:rgba(251,248,244,0.92)", css)

    def test_header_floats_over_the_hero_only_on_wide_screens(self):
        # On a phone the header stays the default sand bar over the hero, so the open menu's
        # links keep their dark type instead of inheriting the over-photo white.
        css = theme.styles()
        start = css.index("@media(min-width:721px){.page-home .site-header{")
        depth, end = 0, start
        for i in range(css.index("{", start), len(css)):
            depth += {"{": 1, "}": -1}.get(css[i], 0)
            if depth == 0:
                end = i
                break
        outside = css[:start] + css[end:]
        self.assertNotIn("html.at-top", outside)
        self.assertIn("html.at-top .page-home .site-header{background:transparent", css[start:end])

    def test_mobile_menu_toggle_is_named_and_points_at_the_menu(self):
        nav = header("", "home")
        self.assertRegex(nav, r'<input[^>]*id="nav-toggle"[^>]*aria-label="Menu"')
        self.assertRegex(nav, r'<input[^>]*aria-controls="primary-menu"')
        self.assertIn('<ul class="nav-links" id="primary-menu">', nav)


class Carousel(unittest.TestCase):
    def test_dots_are_a_plain_group_not_a_tablist(self):
        self.assertNotIn('role="tablist"', carousel("<div></div>", label="Reefs"))

    def test_dot_script_marks_the_current_slide_without_tab_roles(self):
        js = (_JS / "carousel.js").read_text()
        self.assertNotIn("'tab'", js)
        self.assertNotIn("aria-selected", js)
        self.assertIn("aria-current", js)
        self.assertIn("' of '", js)

    def test_dot_targets_are_twenty_four_pixels(self):
        self.assertRegex(theme.styles(), r"\.carousel-dot\{[^}]*width:24px;height:24px")


class DocNav(unittest.TestCase):
    def test_current_section_is_exposed_to_assistive_tech(self):
        self.assertIn("aria-current", (_JS / "doc-nav.js").read_text())


if __name__ == "__main__":
    unittest.main()
