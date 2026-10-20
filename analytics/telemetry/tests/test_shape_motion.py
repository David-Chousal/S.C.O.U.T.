"""Tideline step 5: one token vocabulary, the shape rule, the spacing scale, and motion timing.

Spec: docs/engineering/design-system.md (Radii, Elevation, Space, Breakpoints, Motion).
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

from telemetry.site import theme

_TELEMETRY = Path(__file__).resolve().parents[1]
_BUILDERS = [*sorted((_TELEMETRY / "site").glob("*.py")),
             *sorted((_TELEMETRY / "site" / "pages").glob("*.py")),
             _TELEMETRY / "web.py", _TELEMETRY / "fleet_web.py"]

# Retired in this step. The chart and alert colours (--c-*, --a-*, --coral) move in step 6.
_LEGACY = ("sand", "bg", "bg-2", "surface", "surface-2", "ink", "text", "muted", "line", "line-2",
           "accent", "accent-soft", "on-accent", "ring", "radius", "radius-lg", "track", "ease",
           "dur", "font", "gutter", "section")
# Inline styles a builder may still write: data-driven colours and measured aspect ratios.
_ALLOWED_INLINE = re.compile(r"^(background:var\(--((c|a)-[\w{}-]+|coral)\)|aspect-ratio:\{\w+\})$")
# Colour changes are quick; everything else (movement, and opacity fades, which are arrivals)
# settles within --dur-settle.
_QUICK_PROPS = {"color", "background", "background-color", "border-color", "filter", "fill",
                "stroke"}


def _rules(css: str):
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        yield sel.strip().split("\n")[-1].strip(), body


def _ms(value: str) -> float | None:
    m = re.fullmatch(r"([\d.]+)(ms|s)", value)
    if m:
        return float(m.group(1)) * (1 if m.group(2) == "ms" else 1000)
    return {"var(--dur-instant)": 100, "var(--dur-quick)": 180, "var(--dur-base)": 280,
            "var(--dur-settle)": 420}.get(value)


class OneVocabulary(unittest.TestCase):
    def test_legacy_token_names_are_gone_from_the_css(self):
        css = theme.styles()
        for name in _LEGACY:
            with self.subTest(name=name):
                self.assertNotRegex(css, rf"--{re.escape(name)}:")
                self.assertNotRegex(css, rf"var\(--{re.escape(name)}\)")

    def test_every_variable_the_builders_write_is_declared(self):
        css = theme.styles()
        declared = set(re.findall(r"--([\w-]+):", css))
        for path in _BUILDERS:
            for name in re.findall(r"var\(--([\w-]+)\)", path.read_text()):
                if "{" in name:
                    continue
                with self.subTest(file=path.name, name=name):
                    self.assertIn(name, declared)

    def test_builders_write_no_static_inline_styles(self):
        for path in _BUILDERS:
            for style in re.findall(r'style="([^"]*)"', path.read_text()):
                with self.subTest(file=path.name, style=style):
                    self.assertRegex(style, _ALLOWED_INLINE)


class Shape(unittest.TestCase):
    def setUp(self):
        self.rules = dict(_rules(theme.styles()))

    def test_buttons_are_pills_whose_labels_never_wrap(self):
        body = self.rules[".btn"]
        self.assertIn("border-radius:var(--radius-pill)", body)
        self.assertIn("white-space:nowrap", body)

    def test_surfaces_are_square(self):
        for sel in (".card", ".panel", ".stat", ".drawing", ".banner", ".table-scroll", ".member",
                    ".pill", ".render-slot", ".figure-card", ".spark-empty"):
            with self.subTest(selector=sel):
                radius = re.search(r"border-radius:([^;]+)", self.rules[sel])
                if radius:
                    self.assertIn(radius.group(1), ("var(--radius-none)", "0"))

    def test_instrument_plates_sit_flat_on_a_hairline(self):
        for sel in (".stat", ".panel", ".table-scroll"):
            with self.subTest(selector=sel):
                self.assertIn("border:var(--border-hairline)", self.rules[sel])
                self.assertIn("box-shadow:var(--shadow-0)", self.rules[sel])

    def test_plates_respond_to_their_container(self):
        for sel in (".stat", ".panel"):
            with self.subTest(selector=sel):
                self.assertIn("container-type:inline-size", self.rules[sel])


class TypeTokens(unittest.TestCase):
    def test_three_weights_except_the_wordmark(self):
        for sel, body in _rules(theme.styles()):
            if sel == ".brand-txt b":
                continue
            for weight in re.findall(r"font-weight:(\d+)", body):
                with self.subTest(selector=sel, weight=weight):
                    self.assertIn(weight, ("400", "500", "600"))

    def test_micro_label_tracking_and_small_size_follow_the_scale(self):
        css = theme.styles()
        self.assertIn("--track-micro:0.14em", css)
        self.assertIn("--text-small:0.875rem", css)


class Motion(unittest.TestCase):
    def test_colour_changes_are_quick_and_movement_settles(self):
        for sel, body in _rules(theme.styles()):
            for decl in re.findall(r"transition:([^;}]+)", body):
                for part in decl.split(","):
                    bits = part.split()
                    if len(bits) < 2 or _ms(bits[1]) is None:
                        continue
                    with self.subTest(selector=sel, transition=part.strip()):
                        limit = 180 if bits[0] in _QUICK_PROPS else 420
                        self.assertLessEqual(_ms(bits[1]), limit)

    def test_inner_page_header_arrival_finishes_inside_the_page_transition(self):
        css = theme.styles()
        self.assertIn("html.js-reveal .page-head .wrap>*{animation:hero-rise var(--dur-settle)", css)
        delays = [float(d) for d in re.findall(
            r"\.page-head \.wrap>\*:nth-child\([^)]*\)\{animation-delay:(\d+)ms", css)]
        self.assertTrue(delays)
        self.assertLessEqual(max(delays), 210)


class LayoutTokens(unittest.TestCase):
    def test_media_queries_use_only_the_four_breakpoints(self):
        allowed = {"560", "561", "720", "721", "1000", "1439", "1440"}
        for width in re.findall(r"@media\s*\((?:min|max)-width:(\d+)px\)", theme.styles()):
            with self.subTest(width=width):
                self.assertIn(width, allowed)

    def test_global_layers_use_the_z_index_scale(self):
        rules = dict(_rules(theme.styles()))
        self.assertIn("z-index:var(--z-header)", rules[".site-header"])
        self.assertIn("z-index:var(--z-skip)", rules[".skip"])
        self.assertIn("z-index:var(--z-overlay)", rules[".chat"])

    def test_focused_targets_scroll_clear_of_the_mobile_chat_button(self):
        self.assertRegex(theme.styles(),
                         r"@media\(max-width:720px\)\{html\{scroll-padding-bottom:")


if __name__ == "__main__":
    unittest.main()
