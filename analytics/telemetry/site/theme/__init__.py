"""The S.C.O.U.T. design system — tokens, CSS, and inline-SVG brand assets.

Direction: *warm zen · beachy · oceanic minimalism* — a pale-sand canvas, warm ink, enormous
whitespace, one clean geometric sans (DM Sans, self-hosted), and micro-labels set in uppercase
with wide tracking. Chrome stays quiet and warm-neutral; colour comes from the reef imagery and
the data. Cards are softly rounded and lifted by a soft, eased-back shadow — no outline
(only the buoy render-slot keeps a hairline ring).

The Home page opens on a **full-viewport photographic hero**: the reef photograph is the stage
and the type sits over it, on a scrim whose stops were set by measuring worst-case contrast on
the real glyph boxes rather than by eye. The hero re-points the palette tokens to dark-ground
values so its children invert through the cascade. Every other page opens on a tinted
atmospheric wash behind oversized display type.

Everything is emitted as a string into each page. There are **no external requests**: the fonts
are self-hosted (same-origin, with a graceful system fallback), colours are warm tokens, and
every graphic is inline SVG. The site is deliberately **light-only** (one sandy, beige canvas
regardless of the OS colour-scheme). Navigation between pages uses the CSS cross-document View
Transitions API for a left-to-right slide-and-fade, with no JavaScript; browsers without it
navigate normally.

**Motion is scroll-dependent as of 2026-09-10** — this reverses the rule that held until then,
and the safety work is what earns the reversal. Sections fade and rise into view on scroll, the
hero photograph parallaxes, and a progress line tracks reading. Content is still never trapped
invisible, guarded three ways: the hiding CSS is gated on `html.js-reveal`, which only an
inline head script sets (no JavaScript -> nothing hides); a 4s watchdog clears that flag if
`reveal.js` never runs; and `prefers-reduced-motion: reduce` keeps every `.reveal` fully
visible. Scroll-driven layers additionally sit behind `@supports (animation-timeline: scroll())`
and degrade to a static composition. Only `transform` and `opacity` animate, so the work stays
off the main thread.

The CSS lives in one module per area (``tokens``, ``base``, ``navigation``, ``hero``,
``content``, ``footer``, ``dashboard``, ``motion``, ``chat``) and is joined below in cascade
order, so a later module still overrides an earlier one exactly as the single string did.
"""

from __future__ import annotations

from . import base, chat, content, dashboard, footer, hero, motion, navigation, tokens

# ── Favicon — the S.C.O.U.T. buoy mark on sand (base64 so the page carries no literal "http";
# the sand backdrop keeps it visible on dark browser tab bars) ────────────────────────────────
FAVICON = (
    "data:image/svg+xml;base64,"
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ij"
    "AgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOSIgZmls"
    "bD0iI2VmZWFlMiIvPjxwYXRoIGQ9Ik0xNiA2LjggVjE1LjMiIGZpbGw9Im5vbmUiIH"
    "N0cm9rZT0iIzJhMjUyMCIgc3Ryb2tlLXdpZHRoPSIyLjEiIHN0cm9rZS1saW5lY2Fw"
    "PSJyb3VuZCIvPjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYuNyIgcj0iMi41IiBmaWxsPS"
    "IjMmEyNTIwIi8+PGVsbGlwc2UgY3g9IjE2IiBjeT0iMjAuOCIgcng9IjguNyIgcnk9"
    "IjIuMzUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJhMjUyMCIgc3Ryb2tlLXdpZHRoPS"
    "IxLjQiLz48ZWxsaXBzZSBjeD0iMTYiIGN5PSIyMC44IiByeD0iNC4zIiByeT0iMS4x"
    "IiBmaWxsPSJub25lIiBzdHJva2U9IiMyYTI1MjAiIHN0cm9rZS13aWR0aD0iMS4yNS"
    "IvPjwvc3ZnPg=="
)

SERIES = {
    "temp": "Daily mean temperature",
    "dhw": "Degree Heating Weeks",
    "turb": "Turbidity (relative)",
    "batt": "Battery minimum",
}


def styles(*, base: str = "", fonts_present: bool = False) -> str:
    """Return the full design-system CSS, with self-hosted DM Sans when available."""
    face = ""
    if fonts_present:
        face = (
            "@font-face{font-family:'DM Sans';font-style:normal;font-weight:300 700;"
            "font-display:swap;"
            f"src:url('{base}assets/fonts/dmsans-latin.woff2') format('woff2');"
            "unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
            "U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,"
            "U+FEFF,U+FFFD;}"
            "@font-face{font-family:'DM Sans';font-style:normal;font-weight:300 700;"
            "font-display:swap;"
            f"src:url('{base}assets/fonts/dmsans-latin-ext.woff2') format('woff2');"
            "unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,"
            "U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,"
            "U+2113,U+2C60-2C7F,U+A720-A7FF;}"
        )
    return face + _CSS


# Emitted in cascade order — later sections override earlier ones.
_CSS = "".join((
    tokens.CSS,
    base.CSS,
    navigation.CSS,
    hero.CSS,
    content.CSS,
    footer.CSS,
    dashboard.CSS,
    motion.CSS,
    chat.CSS,
))
