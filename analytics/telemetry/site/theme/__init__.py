"""The S.C.O.U.T. design system — tokens, CSS, and inline-SVG brand assets.

Direction: *Tideline* (docs/engineering/design-system.md) — a pale-sand canvas and reef
photography for everything a person wrote (DM Sans), and a precise instrument layer for
everything the buoy measured (JetBrains Mono, hairline plates). Surfaces are square, controls are
round; marketing cards float on a soft shadow, instrument plates sit flat on a hairline.

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
``content``, ``footer``, ``dashboard``, ``dashboard_tokens``, ``status``, ``motion``, ``chat``,
``utilities``) and is joined in cascade order, so a later module still overrides an earlier one exactly as the single string did.
"""

from __future__ import annotations

import re

from . import (alert_labels, base, chat, content, dashboard, dashboard_tokens, fonts, footer,
               hero, motion, navigation, status, surfaces, tokens, utilities)

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


def styles(*, base: str = "", fonts_present: bool = False, bundle: str = "all") -> str:
    """Return the minified design-system CSS for ``bundle``, with the fonts when bundled.

    ``"site"`` is for the authored pages (no dashboard rules), ``"dashboard"`` for Analytics and
    Fleet (no hero or content components), ``"all"`` for both.
    """
    face = fonts.css(base) if fonts_present else ""
    return _minify(face + "".join(m.CSS for m in _BUNDLES[bundle]))


def _minify(css: str) -> str:
    """Strip comments and collapse whitespace. Spaces inside values (``calc(a * -1)``) and
    descendant combinators (``main :where(...)``) survive; only space next to ``{ } ; , >`` and
    runs of whitespace go."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{};,>])\s*", r"\1", css)
    return css.replace(";}", "}").strip()


# Each bundle lists its modules in cascade order — later sections override earlier ones.
_COMMON_HEAD = (tokens, base, navigation)
_COMMON_TAIL = (status, motion, chat, utilities)
_BUNDLES = {
    "all": (*_COMMON_HEAD, alert_labels, dashboard_tokens, hero, surfaces, content, footer,
            dashboard, *_COMMON_TAIL),
    "site": (*_COMMON_HEAD, hero, surfaces, content, footer, *_COMMON_TAIL),
    "dashboard": (*_COMMON_HEAD, alert_labels, dashboard_tokens, surfaces, footer, dashboard,
                  *_COMMON_TAIL),
}
