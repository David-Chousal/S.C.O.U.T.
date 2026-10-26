#!/usr/bin/env python3
"""Write console/web/design/tokens.json: the COR token structure, valued from Tideline (SCO-238).

The team console adopts COR's design system (rails and bays, keys, signal meters) but speaks
S.C.O.U.T.'s colour: every colour below is computed from the public site's Tideline tokens
(analytics/telemetry/site/theme/tokens.py), so the console and the site cannot drift apart. The
non-colour families (spacing, radius, size, z-index) are COR's, which suit an operator console.

    python3 scripts/export_console_tokens.py           # then: cd console/web && npm run tokens

analytics/telemetry/tests/test_console_tokens.py fails if the committed file drifts from this
script or a text pair drops below WCAG AA.
"""

from __future__ import annotations

import json
import pathlib
import sys

_ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT / "analytics"))

from telemetry.site.theme.colour import mix, oklch_to_hex  # noqa: E402
from telemetry.site.theme.tokens import CATEGORICAL, DATA, PRIMITIVES, STATUS  # noqa: E402

OUT = _ROOT / "console" / "web" / "design" / "tokens.json"

P = {name: hexval for name, (_, hexval) in PRIMITIVES.items()}

# Status hues lifted for the night ground (same hue and chroma as Tideline's STATUS, lighter).
_NIGHT_STATUS = {
    "live": oklch_to_hex(.78, .11, 160),
    "stale": oklch_to_hex(.80, .10, 75),
    "warning": oklch_to_hex(.74, .13, 35),
}
_NIGHT_SERIES = [oklch_to_hex(*lch) for lch in (
    (.76, .11, 245), (.78, .13, 42), (.78, .10, 165), (.76, .11, 345), (.80, .09, 225))]
_NIGHT_TEMP = oklch_to_hex(.76, .09, 350)


def _pair(light: str, dark: str, usage: str) -> dict:
    return {"light": light, "dark": dark, "usage": usage}


def colours() -> dict[str, dict]:
    day_surface, night_surface = P["p-stone-0"], P["p-abyss-800"]
    return {
        "bg": _pair(P["p-stone-100"], P["p-abyss-900"], "The page ground: Tideline's warm-stone canvas by day, the abyss by night."),
        "surface": _pair(day_surface, night_surface, "Floating layers (menus, dialogs, drawers) and the sidebar."),
        "surface-sunken": _pair(P["p-stone-200"], P["p-abyss-950"], "Inputs, table header rows, empty-state wells."),
        "line": _pair(P["p-stone-300"], P["p-abyss-700"], "1px hairlines: table rules, gridlines, range tracks."),
        "line-strong": _pair(P["p-stone-500"], mix(P["p-foam-0"], .42, P["p-abyss-900"]), "Input and control borders (3:1 on surface)."),
        "rail": _pair("{ink}", "{ink}", "The 2px rule across the top of every bay. The only heavy line."),
        "ink": _pair(P["p-stone-900"], P["p-foam-0"], "Headings, readouts, body copy."),
        "ink-muted": _pair(P["p-stone-700"], mix(P["p-foam-0"], .80, P["p-abyss-900"]), "Labels, captions, axis text, timestamps (≥ 4.5:1)."),
        "accent": _pair(P["p-lagoon-600"], P["p-lagoon-200"], "Tideline's lagoon teal: the one interactive colour. Primary keys, links, current nav, focus."),
        "accent-soft": _pair(P["p-lagoon-100"], P["p-lagoon-800"], "Selected rows, active chips, nav hover. Text on it is ink or accent."),
        "on-accent": _pair(P["p-stone-0"], P["p-abyss-950"], "Text and icons on an accent fill."),
        "focus": _pair("{accent}", "{accent}", "Focus ring: solid 2px, 2px offset."),
        "annotation": _pair(CATEGORICAL[1], _NIGHT_SERIES[1], "Chart annotations: thresholds such as the bleaching MMM + 1 °C line. Never text, never status."),
        "positive": _pair(STATUS["live"], _NIGHT_STATUS["live"], "Live, confirmed, good change. Always with a word or sign."),
        "positive-soft": _pair(mix(STATUS["live"], .12, day_surface), mix(_NIGHT_STATUS["live"], .16, night_surface), "Ground of a confirmed or live chip."),
        "negative": _pair(STATUS["warning"], _NIGHT_STATUS["warning"], "Failed, rejected, destructive. Always with a word or icon."),
        "negative-soft": _pair(mix(STATUS["warning"], .12, day_surface), mix(_NIGHT_STATUS["warning"], .16, night_surface), "Ground of a rejected or failed chip."),
        "caution": _pair(STATUS["stale"], _NIGHT_STATUS["stale"], "Stale data, pending changes, sign-off outstanding."),
        "caution-soft": _pair(mix(STATUS["stale"], .12, day_surface), mix(_NIGHT_STATUS["stale"], .16, night_surface), "Ground of a pending or stale chip."),
        "scrim": _pair("rgba(43,37,32,0.48)", "rgba(5,15,20,0.64)", "Backdrop behind dialogs."),
        **{f"series-{i + 1}": _pair(CATEGORICAL[i], _NIGHT_SERIES[i], f"Categorical series {i + 1} (Tideline's Okabe–Ito set): one per buoy.")
           for i in range(len(CATEGORICAL))},
        "series-temp": _pair(DATA["data-temp"], _NIGHT_TEMP, "Water temperature, wherever it is plotted (Tideline data-temp)."),
        "series-turb": _pair(DATA["data-turb"], mix(DATA["data-turb"], .55, P["p-foam-0"]), "Turbidity, wherever it is plotted (Tideline data-turb)."),
        "series-other": _pair("{ink-muted}", "{ink-muted}", "Anything past the categorical set, grouped as Other."),
        **{f"seq-{i}": _pair(P[f"p-lagoon-{day}"], P[f"p-lagoon-{night}"], "Sequential scale: lagoon stepping in lightness, never a rainbow.")
           for i, (day, night) in enumerate(((50, 800), (200, 700), (400, 500), (600, 400), (800, 200)))},
    }


def tokens() -> dict:
    return {
        "name": "S.C.O.U.T. Console (COR system, Tideline colour)",
        "version": 1,
        "type": {
            "families": {
                "sans": "\"DM Sans\", ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif",
                "mono": "\"JetBrains Mono\", ui-monospace, \"SF Mono\", Menlo, Consolas, monospace",
            },
        },
        "color": {
            "themes": [{"id": "light", "name": "Day"}, {"id": "dark", "name": "Night"}],
            "tokens": [{"name": name, "value": {"light": v["light"], "dark": v["dark"]}, "usage": v["usage"]}
                       for name, v in colours().items()],
        },
        "spacing": {"tokens": [{"name": f"space-{n}", "value": f"{px}px"}
                               for n, px in ((1, 4), (2, 8), (3, 12), (4, 16), (6, 24), (8, 32))]},
        "radius": {"tokens": [{"name": "radius-sm", "value": "2px"}, {"name": "radius-md", "value": "4px"},
                              {"name": "radius-full", "value": "999px"}]},
        "shadow": {"tokens": [{"name": "shadow-pop", "value": {"light": "0 8px 24px rgba(43,37,32,0.12)",
                                                                "dark": "0 8px 24px rgba(0,0,0,0.5)"}}]},
        "size": {"tokens": [{"name": n, "value": v} for n, v in (
            ("control-sm", "28px"), ("control", "34px"), ("control-touch", "44px"), ("row", "40px"),
            ("topbar", "56px"), ("sidebar", "232px"), ("drawer", "440px"), ("dialog", "480px"), ("icon", "16px"))]},
        "zIndex": {"tokens": [{"name": n, "value": v} for n, v in (
            ("z-sticky", "10"), ("z-drag", "20"), ("z-drawer", "30"), ("z-dialog", "40"), ("z-menu", "50"),
            ("z-toast", "60"), ("z-tooltip", "70"))]},
    }


def render() -> str:
    return json.dumps(tokens(), indent=2, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render())
    print(f"wrote {OUT.relative_to(_ROOT)}")  # noqa: T201 — CLI output
