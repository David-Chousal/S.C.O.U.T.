"""Engineering drawings shared between the home and technology pages.

Two sources, kept visually consistent but structurally separate so attribution never blurs:

- John Ryan Myrdal's mechanical CAD drawings — PNGs live in ``static/img/mechanical/``
  (rendered from ``mechanical/cad/*.pdf``, grayscale, 150 DPI, via PyMuPDF). Filenames keep the
  drawings' own ``floatation`` spelling; the captions use the correct ``Flotation``.
- The Rev A electrical schematic — PNG lives in ``static/img/electrical/`` (rendered from the
  authoritative ``hardware/schematics/scout-reva-schematic.pdf`` export of
  ``scout-reva.kicad_sch``, unedited).

**Updated 2026-10-28.** The gallery now shows John's DFM Assembly 3/4 drawings of the printed
floats (Float A, Float B), the electronics housing and its cap, copied from
``mechanical/cad/floatation/`` and ``mechanical/cad/electronics-housing/``. They replace the five
bolted-wedge v4/v5 sheets (wedge, wedge cap, wedge bottom, chassis, chassis cap), whose PNGs stay
in ``static/img/mechanical/`` but are no longer linked.
"""

from __future__ import annotations

# (file, caption). Order: the two printed floats, the electronics housing and its cap, then the sensor
# housing. Sheets are size B (11 x 17 in) at 150 DPI, 1650 x 2550 px; the turbidity sheet is still the
# older 1275 x 1650 render.
DRAWINGS = (
    ("float-a.png", "Float A"),
    ("float-b.png", "Float B"),
    ("electronics-housing.png", "Electronics housing"),
    ("electronics-housing-cap.png", "Electronics housing cap"),
    ("turbidity-sensor.png", "Turbidity sensor housing"),
)
SIZES = {"turbidity-sensor.png": (1275, 1650)}
DEFAULT_SIZE = (1650, 2550)


def gallery(base: str, *, eyebrow: str, heading: str, sub: str) -> str:
    """A gallery of the engineering drawings, framed like prints; each links to the full image."""
    figs = "".join(
        '<figure class="drawing reveal">'
        f'<a href="{base}assets/img/mechanical/{file}" aria-label="{caption}, full drawing">'
        f'<img src="{base}assets/img/mechanical/{file}" width="{SIZES.get(file, DEFAULT_SIZE)[0]}" '
        f'height="{SIZES.get(file, DEFAULT_SIZE)[1]}" '
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
