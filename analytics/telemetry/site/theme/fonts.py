"""Self-hosted @font-face rules: DM Sans for prose, JetBrains Mono for measured values.

The WOFF2 subsets in ``static/fonts/`` are built by ``scripts/subset_site_fonts.py``; each
``unicode-range`` below must match the range that script subset (``test_fonts.py`` checks), so
a browser downloads a file only when the page uses one of its characters. While a file loads,
text shows in the system UI font: measured on macOS, it shifted nothing on swap, whereas Arial
scaled to DM Sans' metrics did (CLS 0.051 on Technology, mobile).
"""

from __future__ import annotations

SANS_LATIN = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2013-2014,"
    "U+2018-201E,U+2020-2022,U+2026,U+2030,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2122,"
    "U+2190-2194,U+2212,U+2215,U+2248,U+2260,U+2264-2265"
)
SANS_LATIN_EXT = "U+0100-0130,U+0132-0151,U+0154-017F"
MONO_LATIN = (
    "U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2032-2033,"
    "U+2190-2194,U+2212,U+2248,U+2260,U+2264-2265"
)


def _face(family: str, src: str, weight: str, unicode_range: str) -> str:
    return (f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};"
            f"font-display:swap;src:{src};unicode-range:{unicode_range};}}")


def css(base: str) -> str:
    """The web-font faces, with URLs relative to ``base``."""
    def url(file: str) -> str:
        return f"url('{base}assets/fonts/{file}') format('woff2')"

    return "".join((
        _face("DM Sans", url("dmsans-latin.woff2"), "300 700", SANS_LATIN),
        _face("DM Sans", url("dmsans-latin-ext.woff2"), "300 700", SANS_LATIN_EXT),
        _face("JetBrains Mono", url("jetbrainsmono-latin.woff2"), "400 600", MONO_LATIN),
    ))
