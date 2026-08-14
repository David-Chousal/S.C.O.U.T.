"""John Ryan Myrdal's mechanical CAD drawings, shared between the home and technology pages.

The PNGs live in ``static/img/mechanical/`` (rendered from ``mechanical/cad/*.pdf``). Filenames
keep the drawings' own ``floatation`` spelling; the captions use the correct ``Flotation``.
"""

from __future__ import annotations

# (file, caption). Order: the three flotation-collar parts, then the sensor housing.
DRAWINGS = (
    ("floatation-top.png", "Flotation top"),
    ("floatation-shell.png", "Flotation shell"),
    ("floatation-bottom.png", "Flotation bottom"),
    ("turbidity-sensor.png", "Turbidity sensor housing"),
)


def gallery(base: str, *, eyebrow: str, heading: str, sub: str) -> str:
    """A gallery of the engineering drawings, framed like prints; each links to the full image."""
    figs = "".join(
        '<figure class="drawing reveal">'
        f'<a href="{base}assets/img/mechanical/{file}" aria-label="{caption}, full drawing">'
        f'<img src="{base}assets/img/mechanical/{file}" width="1275" height="1650" '
        f'loading="lazy" decoding="async" alt="Engineering drawing, {caption}"></a>'
        f"<figcaption>{caption}</figcaption></figure>"
        for file, caption in DRAWINGS
    )
    return (
        '<div class="drawings">'
        f'<div class="drawings-head reveal"><p class="eyebrow">{eyebrow}</p>'
        f"<h3>{heading}</h3>"
        f'<p class="drawings-sub">{sub}</p></div>'
        f'<div class="drawings-grid">{figs}</div></div>'
    )
