"""Inline-SVG brand and atmosphere assets.

Every function returns an inline ``<svg>`` string with **no** ``xmlns`` attribute: inline SVG
in HTML5 inherits the namespace from the parser, so the markup carries no ``http`` reference
and remains safe even on the strict self-contained Analytics page. Gradients take an ``uid`` to
keep element ids unique when several SVGs share a page.

The reef "atmospheres" are the reliable imagery baseline — authored, self-contained, no
attribution burden — used wherever a real Ocean Image Bank photograph is not (yet) placed.
"""

from __future__ import annotations

import html
import re


# Authored reef atmospheres — each a distinct oceanic mood built from gradients + organic forms.
_ATMOS = {
    "sunlit": (
        ("oklch(72% 0.12 205)", "oklch(46% 0.10 220)", "oklch(24% 0.07 240)"),
        "shallow",
    ),
    "reef": (
        ("oklch(66% 0.10 200)", "oklch(52% 0.13 30)", "oklch(30% 0.08 250)"),
        "coral",
    ),
    "kelp": (
        ("oklch(60% 0.11 175)", "oklch(40% 0.10 190)", "oklch(20% 0.06 235)"),
        "fronds",
    ),
    "abyss": (
        ("oklch(44% 0.09 225)", "oklch(28% 0.07 245)", "oklch(14% 0.05 255)"),
        "deep",
    ),
}


def reef_atmosphere(variant: str, uid: int) -> str:
    """A self-contained oceanic gradient scene for a pill card (imagery fallback)."""
    (top, mid, bot), motif = _ATMOS.get(variant, _ATMOS["sunlit"])
    gid, cid = f"a{uid}", f"c{uid}"
    parts = [
        '<svg class="atmos" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">',
        "<defs>",
        f'<linearGradient id="{gid}" x1="0" y1="0" x2="0.3" y2="1">',
        f'<stop offset="0" stop-color="{top}"/>',
        f'<stop offset="0.55" stop-color="{mid}"/>',
        f'<stop offset="1" stop-color="{bot}"/>',
        "</linearGradient>",
        f'<linearGradient id="{cid}" x1="0" y1="0" x2="0.4" y2="1">',
        '<stop offset="0" stop-color="#f6f2ec" stop-opacity="0.55"/>',
        '<stop offset="1" stop-color="#f6f2ec" stop-opacity="0"/>',
        "</linearGradient>",
        "</defs>",
        f'<rect width="300" height="400" fill="url(#{gid})"/>',
        # light shafts from the surface
        f'<g fill="url(#{cid})" opacity="0.8"><path d="M120 -20 L160 -20 L90 420 L60 420Z"/>'
        f'<path d="M210 -20 L235 -20 L180 420 L150 420Z" opacity="0.7"/></g>',
    ]
    if motif == "coral":
        parts.append(
            '<g opacity="0.9"><path d="M0 400 C 40 320 30 300 70 300 C 110 300 96 350 130 340 '
            'C 168 330 150 270 196 288 C 236 304 220 360 270 344 C 300 336 300 360 300 400 Z" '
            'fill="oklch(40% 0.12 28)" opacity="0.8"/>'
            '<circle cx="70" cy="300" r="16" fill="oklch(58% 0.14 20)" opacity="0.7"/>'
            '<circle cx="196" cy="288" r="14" fill="oklch(62% 0.12 40)" opacity="0.7"/></g>'
        )
    elif motif == "fronds":
        parts.append(
            '<g stroke="oklch(46% 0.10 168)" stroke-width="7" fill="none" opacity="0.7" '
            'stroke-linecap="round"><path d="M40 400 C 30 300 60 240 44 150"/>'
            '<path d="M110 400 C 104 320 130 260 118 190"/>'
            '<path d="M200 400 C 210 300 186 250 208 170"/>'
            '<path d="M260 400 C 250 330 276 280 262 210"/></g>'
        )
    elif motif == "deep":
        parts.append(
            '<g fill="#f6f2ec" opacity="0.5"><circle cx="80" cy="120" r="2"/>'
            '<circle cx="220" cy="90" r="1.6"/><circle cx="150" cy="220" r="1.4"/>'
            '<circle cx="250" cy="300" r="2"/><circle cx="60" cy="320" r="1.4"/></g>'
        )
    else:  # shallow — sandy floor + ripple
        parts.append(
            '<path d="M0 360 C 80 340 220 372 300 350 L300 400 L0 400 Z" '
            'fill="oklch(78% 0.06 90)" opacity="0.55"/>'
            '<g stroke="#f6f2ec" stroke-width="1.4" fill="none" opacity="0.5">'
            '<path d="M-10 300 C 80 288 220 312 310 296"/>'
            '<path d="M-10 330 C 90 320 210 340 310 326"/></g>'
        )
    parts.append("</svg>")
    return "".join(parts)


def avatar(initials: str, uid: int, hue: int) -> str:
    """A circular gradient monogram — authored stand-in for a team portrait."""
    gid = f"av{uid}"
    return (
        f'<svg class="avatar" viewBox="0 0 64 64" role="img" aria-label="{initials}">'
        "<defs>"
        f'<linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="oklch(62% 0.11 {hue})"/>'
        f'<stop offset="1" stop-color="oklch(38% 0.09 {hue + 30})"/>'
        "</linearGradient></defs>"
        f'<circle cx="32" cy="32" r="32" fill="url(#{gid})"/>'
        '<circle cx="32" cy="32" r="20" fill="none" stroke="oklch(96% 0.02 200)" '
        'stroke-width="0.8" opacity="0.35"/>'
        f'<text x="32" y="41" text-anchor="middle" font-family="var(--font-sans)" '
        f'font-size="22" fill="oklch(97% 0.01 200)" font-weight="500">{initials}</text>'
        "</svg>"
    )


def picture(img_html: str) -> str:
    """Wrap an ``<img ….(jpg|jpeg|png)>`` in a ``<picture>`` that prefers same-origin siblings
    at the identical path: AVIF for photographs (every ``.jpg`` has one, built by
    ``scripts/encode_site_images.py``), then WebP, then the original raster. All sources stay
    same-origin, so the strict Analytics contract holds. If the ``src`` is not a raster we can
    pair, the ``<img>`` is returned unchanged."""
    m = re.search(r'src="([^"]+)\.(jpg|jpeg|png)"', img_html)
    if not m:
        return img_html
    stem, ext = m.groups()
    avif = f'<source srcset="{stem}.avif" type="image/avif">' if ext in ("jpg", "jpeg") else ""
    return (f'<picture>{avif}<source srcset="{stem}.webp" type="image/webp">'
            f"{img_html}</picture>")


def avatar_photo(src: str, name: str) -> str:
    """A real portrait avatar — same 60px circular footprint as the monogram, used when a
    team member has supplied a photo. Same-origin image (WebP with a raster fallback); the CSS
    crops it to the circle."""
    return picture(
        f'<img class="avatar" src="{src}" alt="{html.escape(name)}" '
        'width="60" height="60" loading="lazy" decoding="async">'
    )


_GLYPHS = {
    "temp": '<path d="M12 4a2 2 0 0 1 2 2v8.1a4 4 0 1 1-4 0V6a2 2 0 0 1 2-2z"/><path d="M12 14v3"/>',
    "turbidity": '<path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3z"/>'
    '<path d="M8.5 14a3.5 3.5 0 0 0 3.5 3.5" stroke-linecap="round"/>',
    "battery": '<rect x="3" y="8" width="15" height="9" rx="2"/><path d="M21 11v3"/>'
    '<path d="M7 12.5h5"/>',
    "sound": '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6" stroke-linecap="round"/>',
    "solar": '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M3 8h18M3 12h18M9 4v12M15 4v12"/>'
    '<path d="M12 18v3M8 21h8"/>',
    "radio": '<circle cx="12" cy="14" r="2.4"/><path d="M8 10a5.5 5.5 0 0 0 0 8M16 10a5.5 5.5 0 0 1 0 8" '
    'stroke-linecap="round"/><path d="M5.5 7.5a9 9 0 0 0 0 13M18.5 7.5a9 9 0 0 1 0 13" stroke-linecap="round"/>',
    "cpu": '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3'
    'M2 10h3M2 14h3M19 10h3M19 14h3"/>',
    "anchor": '<circle cx="12" cy="5" r="2.2"/><path d="M12 7v13M6 12a6 6 0 0 0 12 0M4 12h4M16 12h4" '
    'stroke-linecap="round"/>',
    "waves": '<path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" '
    'stroke-linecap="round"/>',
    "leaf": '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M9 15c2-3 5-6 8-8" stroke-linecap="round"/>',
}


# Social icons (Feather line style), reused from the owner's portfolio. Sized by CSS.
_SOCIAL = {
    "linkedin": '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 '
                '6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    "github": '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 '
              "6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 "
              "0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 "
              '6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/>'
            '<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
}


def social_icon(name: str) -> str:
    """A Feather-style social icon (stroke = ``currentColor``, sized by CSS)."""
    return (
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
        f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{_SOCIAL[name]}</svg>'
    )


def glyph(name: str, cls: str = "card-glyph") -> str:
    """A 24px line icon (stroke = ``currentColor``)."""
    body = _GLYPHS.get(name, _GLYPHS["waves"])
    return (
        f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        f'stroke-width="1.6" aria-hidden="true">{body}</svg>'
    )


def dhw_svg() -> str:
    """A conceptual SST-vs-threshold plot with accumulating HotSpot area (Science page)."""
    return (
        '<svg viewBox="0 0 620 260" class="flow" role="img" '
        'aria-label="Conceptual Degree Heating Weeks: sea-surface temperature rising above the '
        'MMM+1 degree bleaching threshold; the shaded area above the threshold accumulates into '
        'Degree Heating Weeks." fill="none">'
        "<defs>"
        '<linearGradient id="dh" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="var(--alert-warning-fill)" stop-opacity="0.34"/>'
        '<stop offset="1" stop-color="var(--alert-warning-fill)" stop-opacity="0"/>'
        "</linearGradient></defs>"
        # axes
        '<line x1="48" y1="20" x2="48" y2="222" stroke="var(--color-line)"/>'
        '<line x1="48" y1="222" x2="600" y2="222" stroke="var(--color-line)"/>'
        # threshold + MMM lines
        '<line x1="48" y1="96" x2="600" y2="96" stroke="var(--alert-alert1-fill)" stroke-dasharray="5 4"/>'
        '<text x="596" y="90" text-anchor="end" font-family="var(--font-sans)" font-size="10" '
        'fill="var(--alert-alert1-text)">Bleaching threshold  (MMM + 1 °C)</text>'
        '<line x1="48" y1="140" x2="600" y2="140" stroke="var(--color-text-subtle)" stroke-dasharray="3 4"/>'
        '<text x="596" y="134" text-anchor="end" font-family="var(--font-sans)" font-size="10" '
        'fill="var(--color-text-subtle)">MMM</text>'
        # accumulated hotspot area (above threshold, clipped conceptually)
        '<path d="M232 96 C 300 40 360 44 430 96 L430 96 C 360 78 300 74 232 96 Z" fill="url(#dh)"/>'
        '<path d="M232 96 C 300 40 360 44 430 96" stroke="none" fill="url(#dh)"/>'
        '<path d="M232 222 L232 96 C 300 40 360 44 430 96 L430 222 Z" fill="url(#dh)"/>'
        # SST curve
        '<path d="M48 176 C 130 168 180 150 232 96 C 300 40 360 44 430 96 C 500 150 540 168 600 172" '
        'stroke="var(--data-temp)" stroke-width="2.4"/>'
        '<text x="150" y="205" font-family="var(--font-sans)" font-size="10" fill="var(--color-text-subtle)">'
        'daily SST</text>'
        '<text x="330" y="150" text-anchor="middle" font-family="var(--font-sans)" font-size="10" '
        'fill="var(--color-text)">HotSpot accumulates → DHW</text>'
        "</svg>"
    )
