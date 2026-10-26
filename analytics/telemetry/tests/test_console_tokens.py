"""The console's colour tokens (SCO-238) come from Tideline and stay readable in both themes.

The console adopts the COR design system, but every colour is computed from the site's Tideline
tokens by scripts/export_console_tokens.py. These tests fail if the committed tokens.json drifts
from that script, or if a text or mark pair drops below WCAG AA in the day or night theme.
"""

import importlib.util
import json
import unittest
from pathlib import Path

from telemetry.site.theme.colour import wcag
from telemetry.site.theme.tokens import PRIMITIVES

REPO = Path(__file__).resolve().parents[3]


def _export():
    spec = importlib.util.spec_from_file_location(
        "export_console_tokens", REPO / "scripts" / "export_console_tokens.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


EXPORT = _export()
COLOURS = {t["name"]: t["value"] for t in json.loads(EXPORT.OUT.read_text())["color"]["tokens"]}


def _value(name: str, theme: str) -> str:
    value = COLOURS[name][theme]
    while value.startswith("{"):
        value = COLOURS[value[1:-1]][theme]
    return value


TEXT = [(fg, bg) for fg in ("ink", "ink-muted") for bg in ("bg", "surface", "surface-sunken")] + [
    ("accent", "bg"), ("accent", "surface"), ("on-accent", "accent"), ("accent", "accent-soft"),
    ("ink", "accent-soft"), ("positive", "bg"), ("negative", "bg"), ("caution", "bg"),
    ("positive", "positive-soft"), ("negative", "negative-soft"), ("caution", "caution-soft"),
]
MARKS = [("line-strong", "surface"), ("focus", "bg"), ("focus", "surface"),
         *((f"series-{i}", "bg") for i in range(1, 6)), ("series-temp", "bg"), ("series-turb", "bg")]


class Drift(unittest.TestCase):
    def test_committed_tokens_match_the_generator(self):
        self.assertEqual(EXPORT.OUT.read_text(), EXPORT.render())

    def test_the_accent_is_tideline_lagoon(self):
        self.assertEqual(COLOURS["accent"]["light"], PRIMITIVES["p-lagoon-600"][1])

    def test_the_ground_is_tideline_stone_by_day_and_abyss_by_night(self):
        self.assertEqual(COLOURS["bg"]["light"], PRIMITIVES["p-stone-100"][1])
        self.assertEqual(COLOURS["bg"]["dark"], PRIMITIVES["p-abyss-900"][1])


class Contrast(unittest.TestCase):
    def test_text_pairs_clear_aa_in_both_themes(self):
        for theme in ("light", "dark"):
            for fg, bg in TEXT:
                with self.subTest(theme=theme, fg=fg, bg=bg):
                    self.assertGreaterEqual(wcag(_value(fg, theme), _value(bg, theme)), 4.5)

    def test_marks_and_controls_clear_three_to_one_in_both_themes(self):
        for theme in ("light", "dark"):
            for fg, bg in MARKS:
                with self.subTest(theme=theme, fg=fg, bg=bg):
                    self.assertGreaterEqual(wcag(_value(fg, theme), _value(bg, theme)), 3.0)


if __name__ == "__main__":
    unittest.main()
