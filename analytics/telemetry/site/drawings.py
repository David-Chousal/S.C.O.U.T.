"""Engineering drawings shared between the home and technology pages.

Two sources, kept visually consistent but structurally separate so attribution never blurs:

- John Ryan Myrdal's mechanical CAD drawings — PNGs live in ``static/img/mechanical/``
  (rendered from ``mechanical/cad/*.pdf``). Filenames keep the drawings' own ``floatation``
  spelling; the captions use the correct ``Flotation``.
- The Rev A electrical schematic — PNG lives in ``static/img/electrical/`` (rendered from the
  authoritative ``hardware/schematics/scout-reva-schematic.pdf`` export of
  ``scout-reva.kicad_sch``, unedited).
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


# The Rev A electrical schematic — one image, so it gets the single-column variant of the
# same card treatment rather than the two-up CAD grid. Update width/height if the PDF export
# is ever re-rendered at a different resolution.
SCHEMATIC_FILE = "rev-a-schematic.png"
SCHEMATIC_SIZE = (4500, 3181)
SCHEMATIC_ALT = (
    "SCOUT Rev A electrical schematic: Feather M0 + RFM95 controller/radio, PID 6106 "
    "charger/boost power path, DS18B20 temperature, SEN0189 turbidity divider, and the "
    "Adalogger RTC/microSD logging stack."
)


def schematic(base: str, *, eyebrow: str, heading: str, sub: str, caption: str) -> str:
    """A single full-width engineering schematic card, styled like the CAD gallery above."""
    w, h = SCHEMATIC_SIZE
    return (
        '<div class="drawings">'
        f'<div class="drawings-head reveal"><p class="eyebrow">{eyebrow}</p>'
        f"<h3>{heading}</h3>"
        f'<p class="drawings-sub">{sub}</p></div>'
        '<div class="drawings-grid single">'
        '<figure class="drawing reveal">'
        f'<a href="{base}assets/img/electrical/{SCHEMATIC_FILE}" '
        f'aria-label="{caption}, full-resolution schematic">'
        f'<img src="{base}assets/img/electrical/{SCHEMATIC_FILE}" width="{w}" height="{h}" '
        f'loading="lazy" decoding="async" alt="{SCHEMATIC_ALT}"></a>'
        f"<figcaption>{caption}</figcaption></figure>"
        "</div></div>"
    )
