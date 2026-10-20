"""Tideline tokens: every colour pairing the design system relies on, computed, not eyeballed.

Thresholds come from docs/engineering/design-system.md (WCAG 2.2 AA: 4.5:1 for text, 3:1 for
control edges and chart marks) and design-system-data-viz.md (colour-vision separation).
"""

import re
import unittest

from telemetry.site import theme
from telemetry.site.theme import colour, tokens


class ColourMaths(unittest.TestCase):
    def test_black_on_white_is_21_to_1(self):
        self.assertAlmostEqual(colour.wcag("#000000", "#ffffff"), 21.0, places=2)

    def test_oklch_white_is_white(self):
        self.assertEqual(colour.oklch_to_hex(1.0, 0.0, 0), "#ffffff")

    def test_mix_at_full_strength_is_the_foreground(self):
        self.assertEqual(colour.mix("#2b2520", 1.0, "#ffffff"), "#2b2520")


class PrimitivesMatchTheirFallbacks(unittest.TestCase):
    def test_every_primitive_hex_is_its_oklch_value(self):
        for name, (lch, hexval) in tokens.PRIMITIVES.items():
            with self.subTest(name=name):
                self.assertEqual(colour.oklch_to_hex(*lch), hexval)


class TextContrast(unittest.TestCase):
    def test_every_text_role_passes_aa_on_every_ground_it_may_sit_on(self):
        for fg, bg in tokens.TEXT_PAIRS:
            with self.subTest(fg=fg, bg=bg):
                ratio = colour.wcag(tokens.hex_of(fg), tokens.hex_of(bg))
                self.assertGreaterEqual(ratio, 4.5)

    def test_control_edges_reach_three_to_one(self):
        for ground in ("color-canvas", "color-surface", "color-canvas-sunken"):
            with self.subTest(ground=ground):
                ratio = colour.wcag(tokens.hex_of("color-line-strong"), tokens.hex_of(ground))
                self.assertGreaterEqual(ratio, 3.0)

    def test_night_text_passes_aa_on_the_night_ground(self):
        night = tokens.hex_of("night-canvas")
        for alpha in (1.0, 0.80, 0.74):
            with self.subTest(alpha=alpha):
                text = colour.mix(tokens.hex_of("night-text"), alpha, night)
                self.assertGreaterEqual(colour.wcag(text, night), 4.5)


class StatusAndAlerts(unittest.TestCase):
    def test_status_glyphs_clear_three_to_one_on_every_ground(self):
        for status in tokens.STATUS:
            for ground in ("color-canvas", "color-surface", "color-canvas-sunken"):
                with self.subTest(status=status, ground=ground):
                    ratio = colour.wcag(tokens.STATUS[status], tokens.hex_of(ground))
                    self.assertGreaterEqual(ratio, 3.0)

    def test_noaa_scale_has_all_eight_levels_in_order(self):
        self.assertEqual(list(tokens.ALERTS), [
            "nostress", "watch", "warning", "alert1", "alert2", "alert3", "alert4", "alert5"])

    def test_every_alert_badge_label_passes_aa_on_its_fill(self):
        for level, (fill, on) in tokens.ALERTS.items():
            with self.subTest(level=level):
                self.assertGreaterEqual(colour.wcag(on, fill), 4.5)

    def test_alert_lightness_falls_from_watch_to_level_five(self):
        order = list(tokens.ALERTS)[1:]
        lightness = [tokens.ALERT_LIGHTNESS[level] for level in order]
        self.assertEqual(lightness, sorted(lightness, reverse=True))


class DataColour(unittest.TestCase):
    def test_categorical_marks_clear_three_to_one_on_the_canvas(self):
        for hexval in tokens.CATEGORICAL:
            with self.subTest(colour=hexval):
                self.assertGreaterEqual(colour.wcag(hexval, tokens.hex_of("color-canvas")), 3.0)

    def test_categorical_set_stays_separable_under_colour_vision_deficiency(self):
        for kind in ("normal", "protan", "deutan", "tritan"):
            with self.subTest(kind=kind):
                self.assertGreaterEqual(colour.min_separation(tokens.CATEGORICAL, kind), 4.5)

    def test_variable_lines_clear_three_to_one_on_the_canvas(self):
        for name, hexval in tokens.DATA.items():
            with self.subTest(name=name):
                self.assertGreaterEqual(colour.wcag(hexval, tokens.hex_of("color-canvas")), 3.0)


class EmittedCss(unittest.TestCase):
    def setUp(self):
        self.css = theme.styles()

    def test_every_primitive_and_role_is_declared(self):
        for name in list(tokens.PRIMITIVES) + list(tokens.SEMANTIC):
            with self.subTest(name=name):
                self.assertRegex(self.css, rf"--{re.escape(name)}:")

    def test_oklch_values_are_gated_behind_supports(self):
        self.assertIn("@supports (color:oklch(0 0 0))", self.css)

    def test_the_night_ground_re_points_roles_not_primitives(self):
        block = self.css.split('[data-ground="night"]{', 1)[1].split("}", 1)[0]
        self.assertIn("--color-text:", block)
        self.assertNotIn("--p-", block.split(":", 1)[0])


if __name__ == "__main__":
    unittest.main()
