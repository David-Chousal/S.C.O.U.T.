#!/usr/bin/env python3
"""Encode an AVIF next to every website photograph (JPEG), for ``<picture>`` to prefer.

Dev-only: needs the ``avifenc`` CLI (libavif; ``brew install libavif``). The site serves the
committed files and has no runtime dependency. Re-run after adding or replacing a photograph:

    python3 scripts/encode_site_images.py

The Home hero sits under a dark scrim, so it is encoded at a lower quality than the reef cards;
both settings were chosen by eye against the JPEG at 1440 px. Encoding is deterministic, so an
unchanged photograph reproduces its committed AVIF byte for byte.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

_IMG = Path(__file__).resolve().parents[1] / "analytics" / "telemetry" / "site" / "static" / "img"
_QUALITY = {"hero.jpg": 34}   # under the scrim; q34 matched the JPEG by eye at 1:1, q30 softened
_DEFAULT_QUALITY = 55
_SPEED = 4                    # slower = smaller at the same quality; deterministic either way


def encode(src: Path) -> Path:
    dest = src.with_suffix(".avif")
    quality = _QUALITY.get(src.name, _DEFAULT_QUALITY)
    subprocess.run(
        ["avifenc", "--speed", str(_SPEED), "-q", str(quality), "--yuv", "420", "--jobs", "1",
         str(src), str(dest)],
        check=True, capture_output=True,
    )
    return dest


def main() -> None:
    if shutil.which("avifenc") is None:
        sys.exit("avifenc is required: brew install libavif (or your platform's libavif tools)")
    for src in sorted([*_IMG.glob("*.jpg"), *_IMG.glob("team/*.jpg")]):
        dest = encode(src)
        print(f"{dest.relative_to(_IMG)}: {src.stat().st_size // 1024} KB JPEG "
              f"→ {dest.stat().st_size // 1024} KB AVIF")


if __name__ == "__main__":
    main()
