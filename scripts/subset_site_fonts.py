#!/usr/bin/env python3
"""Rebuild the website's self-hosted font subsets.

Dev-only: needs ``pip install fonttools brotli``. The site itself has no runtime dependency —
it serves the three WOFF2 files this script writes.

Usage (sources are the variable TTFs from https://github.com/google/fonts, ofl/dmsans and
ofl/jetbrainsmono):

    python3 scripts/subset_site_fonts.py \
        --dm-sans "DMSans[opsz,wght].ttf" --jetbrains-mono "JetBrainsMono[wght].ttf" \
        --out analytics/telemetry/site/static/fonts
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
except ImportError:
    sys.exit("fontTools is required: pip install fonttools brotli")

# Each range must match the ``unicode-range`` of its @font-face in theme/fonts.py, so a browser
# only downloads a file when the page actually uses one of its characters.
SANS_LATIN = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2013-2014,"
    "U+2018-201E,U+2020-2022,U+2026,U+2030,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2122,"
    "U+2190-2194,U+2212,U+2215,U+2248,U+2260,U+2264-2265"
)
# Latin Extended-A minus what the core file already holds: names such as "ć", Hawaiian
# kahakō such as "ā".
SANS_LATIN_EXT = "U+0100-0130,U+0132-0151,U+0154-017F"
# Data readouts only: ASCII, Latin-1, dashes, quotes, arrows and the maths the site writes.
MONO_LATIN = (
    "U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2032-2033,"
    "U+2190-2194,U+2212,U+2248,U+2260,U+2264-2265"
)

# Body text needs ss01 (requested by the site CSS) and case; the mono needs tabular zero.
SANS_FEATURES = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "ss01", "case",
                 "frac", "numr", "dnom", "sups"]
MONO_FEATURES = ["kern", "ccmp", "locl", "mark", "mkmk", "zero", "case"]

def _subset(src: Path, dest: Path, axes: dict, features: list[str], unicodes: str) -> None:
    # Subset first, then limit the axes: instancing a whole variable font before subsetting
    # trips fontTools' lazy gvar loading.
    font = TTFont(src)
    options = subset.Options()
    options.layout_features = features
    options.name_IDs = ["*"]
    options.notdef_outline = True
    sub = subset.Subsetter(options)
    sub.populate(unicodes=subset.parse_unicodes(unicodes))
    sub.subset(font)
    font = instancer.instantiateVariableFont(font, axes)
    font.flavor = "woff2"
    font.recalcTimestamp = False  # keep the source date, so a rebuild is byte-identical
    font.save(dest)
    print(f"{dest.name}: {dest.stat().st_size / 1024:.1f} KB")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--dm-sans", type=Path, required=True)
    ap.add_argument("--jetbrains-mono", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()

    sans, mono = args.out / "dmsans-latin.woff2", args.out / "jetbrainsmono-latin.woff2"
    sans_axes = {"wght": (300, 700), "opsz": (9, 40)}
    _subset(args.dm_sans, sans, sans_axes, SANS_FEATURES, SANS_LATIN)
    _subset(args.dm_sans, args.out / "dmsans-latin-ext.woff2", sans_axes, SANS_FEATURES,
            SANS_LATIN_EXT)
    _subset(args.jetbrains_mono, mono, {"wght": (400, 600)}, MONO_FEATURES, MONO_LATIN)


if __name__ == "__main__":
    main()
