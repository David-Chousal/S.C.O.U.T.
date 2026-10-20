"""Colour maths for the design tokens: OKLCH → sRGB, WCAG contrast, and colour-vision checks.

Standard library only. Used to derive every hex fallback from its OKLCH source and, in
``telemetry/tests/test_tokens.py``, to prove each pairing meets its contrast threshold.
"""

from __future__ import annotations

import math

# Machado, Oliveira & Fernandes (2009), severity 1.0, applied in linear sRGB.
# https://doi.org/10.1109/TVCG.2009.113
_CVD = {
    "protan": ((0.152286, 1.052583, -0.204868), (0.114503, 0.786281, 0.099216),
               (-0.003882, -0.048116, 1.051998)),
    "deutan": ((0.367322, 0.860646, -0.227968), (0.280085, 0.672501, 0.047413),
               (-0.011820, 0.042940, 0.968881)),
    "tritan": ((1.255528, -0.076749, -0.178779), (-0.078411, 0.930809, 0.147602),
               (0.004733, 0.691367, 0.303900)),
}


def _encode(c: float) -> float:
    c = min(1.0, max(0.0, c))
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def _decode(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _channels(hexval: str) -> tuple[float, float, float]:
    h = hexval.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _to_hex(rgb: tuple[float, float, float]) -> str:
    return "#" + "".join(f"{round(c * 255):02x}" for c in rgb)


def oklch_to_hex(lightness: float, chroma: float, hue: float) -> str:
    """OKLCH (lightness 0–1) to an sRGB hex string, clipped to gamut."""
    a = chroma * math.cos(math.radians(hue))
    b = chroma * math.sin(math.radians(hue))
    l_ = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m_ = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s_ = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3
    linear = (
        4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
        -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
        -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_,
    )
    return _to_hex(tuple(_encode(c) for c in linear))


def wcag(a: str, b: str) -> float:
    """WCAG 2 contrast ratio between two hex colours."""
    def luminance(hexval: str) -> float:
        r, g, b_ = (_decode(c) for c in _channels(hexval))
        return 0.2126 * r + 0.7152 * g + 0.0722 * b_
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def mix(fg: str, alpha: float, bg: str) -> str:
    """``fg`` at ``alpha`` composited over an opaque ``bg``."""
    f, g = _channels(fg), _channels(bg)
    return _to_hex(tuple(alpha * x + (1 - alpha) * y for x, y in zip(f, g)))


def channel_distance(a: str, b: str) -> int:
    """Largest per-channel difference, in 0–255 steps."""
    return max(abs(round(x * 255) - round(y * 255)) for x, y in zip(_channels(a), _channels(b)))


def _oklab(linear: tuple[float, float, float]) -> tuple[float, float, float]:
    r, g, b = linear
    l_ = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m_ = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s_ = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_)


def _simulate(hexval: str, kind: str) -> tuple[float, float, float]:
    linear = tuple(_decode(c) for c in _channels(hexval))
    if kind == "normal":
        return linear
    matrix = _CVD[kind]
    return tuple(min(1.0, max(0.0, sum(row[j] * linear[j] for j in range(3)))) for row in matrix)


def min_separation(colours: list[str], kind: str) -> float:
    """Smallest pairwise ΔE (OKLab × 100) in ``colours`` as seen with ``kind`` vision."""
    seen = [_oklab(_simulate(c, kind)) for c in colours]
    return min(100 * math.dist(p, q) for i, p in enumerate(seen) for q in seen[i + 1:])
