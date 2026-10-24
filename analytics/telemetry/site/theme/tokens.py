"""Tideline design tokens — primitive → semantic tiers, emitted as CSS custom properties.

Spec: docs/engineering/design-system.md. Colours are authored in OKLCH; each primitive's hex is
derived from it (and checked by ``test_tokens.py``) and is what ships. Every primitive sits inside
sRGB, so an OKLCH layer would render identically and only add bytes. Components read semantic roles (``--color-*``,
``--status-*``, ``--data-*``), never primitives. ``[data-ground="night"]`` re-points the roles,
so anything inside a dark ground inverts through the cascade.
"""

from __future__ import annotations

from .colour import mix, oklch_to_hex, wcag

_STONE = {0: (.993, .004), 50: (.985, .005), 100: (.968, .008), 150: (.952, .009),
          200: (.930, .010), 300: (.880, .011), 400: (.760, .012), 500: (.600, .013),
          600: (.520, .015), 700: (.420, .014), 800: (.340, .013), 900: (.270, .012)}
_LAGOON = {50: (.965, .018), 100: (.930, .025), 200: (.860, .045), 400: (.640, .080),
           500: (.550, .080), 600: (.470, .070), 700: (.400, .060), 800: (.330, .050)}
_ABYSS = {700: (.330, .030), 800: (.260, .028), 900: (.200, .025), 950: (.160, .020)}


def _ramp(name: str, stops: dict, hue: float) -> dict:
    return {f"p-{name}-{k}": ((l, c, hue), oklch_to_hex(l, c, hue)) for k, (l, c) in stops.items()}


# name → ((L, C, h), hex)
PRIMITIVES = {
    **_ramp("stone", _STONE, 65),    # warm neutral: wet sand
    **_ramp("lagoon", _LAGOON, 190),  # the one accent: deep-water teal, unused by any data scale
    **_ramp("abyss", _ABYSS, 230),   # the night ground under the hero photograph
    "p-foam-0": ((.982, .006, 75), oklch_to_hex(.982, .006, 75)),
}

# Day ground. A value is a primitive name or a literal CSS colour.
SEMANTIC = {
    "color-canvas": "p-stone-100",
    "color-canvas-sunken": "p-stone-200",
    "color-surface": "p-stone-50",
    "color-surface-raised": "p-stone-0",
    "color-text": "p-stone-900",
    "color-text-muted": "p-stone-700",
    "color-text-subtle": "p-stone-600",
    "color-line": "rgb(43 37 32 / 0.10)",
    "color-line-strong": "p-stone-500",
    "color-accent": "p-lagoon-600",
    "color-accent-hover": "p-lagoon-700",
    "color-accent-tint": "p-lagoon-100",
    "color-on-accent": "p-stone-0",
    "color-focus": "p-lagoon-600",
}

# Night ground: the same roles, re-pointed.
NIGHT = {
    "color-canvas": "p-abyss-900",
    "color-text": "p-foam-0",
    "color-text-muted": "rgb(252 249 245 / 0.80)",
    "color-text-subtle": "rgb(252 249 245 / 0.74)",
    "color-line-strong": "rgb(252 249 245 / 0.42)",
    "color-focus": "p-lagoon-200",
}

# Text roles and the grounds each may sit on. text-subtle is deliberately absent from
# canvas-sunken (4.52:1 is one rounding step from failing).
TEXT_PAIRS = [
    *[(fg, bg) for fg in ("color-text", "color-text-muted", "color-text-subtle")
      for bg in ("color-canvas", "color-surface", "color-surface-raised")],
    ("color-text", "color-canvas-sunken"), ("color-text-muted", "color-canvas-sunken"),
    ("color-accent", "color-canvas"), ("color-accent", "color-surface"),
    ("color-accent", "color-accent-tint"), ("color-text-muted", "color-accent-tint"),
    ("color-on-accent", "color-accent"), ("color-on-accent", "color-accent-hover"),
]

# Instrument status — quiet; the colour goes on the glyph, the label stays text-muted.
STATUS = {
    "live": oklch_to_hex(.49, .10, 160),
    "stale": oklch_to_hex(.50, .09, 75),
    "offline": oklch_to_hex(.49, .012, 65),
    "warning": oklch_to_hex(.50, .14, 35),
}

# NOAA Coral Reef Watch Bleaching Alert Area, including Levels 3–5 (added 2023-12-15).
_ALERT_LCH = {
    "nostress": (.80, .05, 235), "watch": (.86, .15, 95), "warning": (.73, .15, 60),
    "alert1": (.57, .19, 30), "alert2": (.48, .16, 25), "alert3": (.42, .15, 355),
    "alert4": (.36, .14, 320), "alert5": (.29, .11, 300),
}
ALERT_LIGHTNESS = {level: lch[0] for level, lch in _ALERT_LCH.items()}


def _on(fill: str) -> str:
    ink, foam = PRIMITIVES["p-stone-900"][1], PRIMITIVES["p-stone-0"][1]
    return ink if wcag(ink, fill) >= wcag(foam, fill) else foam


# level → (fill, label colour on that fill)
ALERTS = {level: (oklch_to_hex(*lch), _on(oklch_to_hex(*lch))) for level, lch in _ALERT_LCH.items()}


def _text_variant(lch: tuple) -> str:
    """The level's hue, darkened until it reads as text (≥ 4.6:1) on the canvas, the sunken
    canvas, and its own 12% badge tint over the surface."""
    l, c, h = lch
    surface = PRIMITIVES["p-stone-50"][1]
    grounds = (PRIMITIVES["p-stone-100"][1], PRIMITIVES["p-stone-200"][1])
    while True:
        text = oklch_to_hex(l, c, h)
        tint = mix(text, 0.12, surface)
        if all(wcag(text, g) >= 4.6 for g in (*grounds, tint)):
            return text
        l -= 0.01


# level → a text-safe colour in the level's hue, for labels and verdicts set as text.
ALERT_TEXT = {level: _text_variant(lch) for level, lch in _ALERT_LCH.items()}

# Variable identity: cmocean thermal 0.50 and turbid 0.60; instrument health is neutral ink.
DATA = {
    "data-temp": "#b15f82",
    "data-turb": "#8a5e3a",
    "data-instrument": PRIMITIVES["p-stone-700"][1],
}

# Okabe–Ito, re-lit until each mark clears 3:1 on the canvas; orange/ochre dropped (deutan clash).
CATEGORICAL = [oklch_to_hex(*lch) for lch in (
    (.50, .13, 245), (.57, .17, 42), (.55, .11, 165), (.53, .13, 345), (.62, .10, 225))]

_SPACE = (4, 8, 12, 16, 24, 32, 48, 64, 96, 128)
_Z = {"base": 0, "raised": 1, "sticky": 10, "header": 50, "overlay": 60, "skip": 100}
_MOTION = {
    "dur-instant": "100ms", "dur-quick": "180ms", "dur-base": "280ms", "dur-settle": "420ms",
    "ease-settle": "cubic-bezier(0.22,1,0.36,1)", "ease-standard": "cubic-bezier(0.2,0,0,1)",
    "ease-exit": "cubic-bezier(0.4,0,1,1)",
}

def hex_of(name: str) -> str:
    """Resolve a primitive, a day role, or ``night-<role>`` to its opaque hex value."""
    if name.startswith("night-"):
        ref = NIGHT[f"color-{name[len('night-'):]}"]
    else:
        ref = SEMANTIC.get(name, name)
    return PRIMITIVES[ref][1]


def _value(ref: str) -> str:
    return f"var(--{ref})" if ref.startswith("p-") else ref


def _declarations(pairs) -> str:
    return "".join(f"--{name}:{value};" for name, value in pairs)


def _css() -> str:
    root = _declarations([
        *((name, hexval) for name, (_, hexval) in PRIMITIVES.items()),
        *((name, _value(ref)) for name, ref in SEMANTIC.items()),
        *((f"status-{name}", hexval) for name, hexval in STATUS.items()),
        *DATA.items(),
        *((f"cat-{i}", hexval) for i, hexval in enumerate(CATEGORICAL, 1)),
        *((f"alert-{lvl}-{part}", val) for lvl, (fill, _) in ALERTS.items()
          for part, val in (("fill", fill), ("text", ALERT_TEXT[lvl]))),
        *((f"space-{i}", f"{px}px") for i, px in enumerate(_SPACE, 1)),
        ("radius-none", "0"), ("radius-xs", "4px"),
        ("shadow-0", "none"),
        ("border-hairline", "1px solid var(--color-line)"),
        ("border-control", "1px solid var(--color-line-strong)"),
        *((f"z-{name}", str(z)) for name, z in _Z.items()),
        *_MOTION.items(),
    ])
    night = _declarations((name, _value(ref)) for name, ref in NIGHT.items())
    return (
        "\n/* ── Tideline tokens (generated by theme/tokens.py) ── */\n"
        f":root{{{root}}}\n"
        f'[data-ground="night"]{{{night}}}\n'
    )


CSS = _css()
# The label colour on a solid alert fill. Only the dashboard pages paint alert badges, so this
# ships in their bundle alone (``theme.alert_labels``); the authored pages use text and fill.
ALERT_ON_CSS = ":root{" + _declarations((f"alert-{lvl}-on", on) for lvl, (_, on) in ALERTS.items()) + "}"
