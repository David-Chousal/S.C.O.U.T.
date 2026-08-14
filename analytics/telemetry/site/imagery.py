"""Reef imagery catalog + pill-card rendering.

Two tiers, by design:

1. **Authored atmospheres** — self-contained inline-SVG oceanic scenes (:mod:`assets`). These
   always render, need no network and carry no attribution burden. They are the reliable
   baseline the site ships with.
2. **Real photographs** — when a curated image is placed at ``assets/img/<key>.<ext>`` *and*
   the catalog entry carries a verified ``credit``, the pill uses the photo and shows the
   required credit. The Ocean Image Bank licence requires crediting each photographer; we never
   fabricate a credit, so a photo appears only once its exact attribution is recorded here.

Drop a file + fill in ``credit`` to promote any card from authored to photographic — no other
change needed.
"""

from __future__ import annotations

import html
from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class Photo:
    """A real photograph's provenance. Absent ``file`` → the authored atmosphere is used."""

    photographer: str = ""
    source: str = "Ocean Image Bank"
    source_url: str = "https://oceanimagebank.theoceanagency.org"
    file: str = ""  # basename under assets/img/, e.g. "reef-01.webp"; empty → not placed yet


@dataclass(frozen=True)
class Reef:
    key: str
    variant: str          # authored-atmosphere variant (assets.reef_atmosphere)
    title: str
    caption: str
    alt: str
    photo: Photo = field(default_factory=Photo)


# The curated set. Titles/captions describe the mood so the authored atmospheres read as
# intentional; when a photo is placed, its alt text + credit take over.
CATALOG: tuple[Reef, ...] = (
    Reef("shallow-reef", "sunlit", "Shallow reef", "Sunlit nearshore water, S.C.O.U.T.'s habitat",
         "A sunlit shallow coral reef, Raja Ampat, Indonesia.",
         Photo(photographer="Noemi Merz", file="shallow-reef.jpg")),
    Reef("coral-detail", "reef", "Coral colony", "Where thermal stress is measured",
         "A vivid soft-coral colony on a tropical reef.",
         Photo(photographer="Cinzia Osele Bismarck", file="coral-detail.jpg")),
    Reef("kelp-column", "kelp", "Water column", "Turbidity and light through the column",
         "A kelp forest on the Great Southern Reef, Australia.",
         Photo(photographer="Stefan Andrews", file="kelp-column.jpg")),
    Reef("open-water", "abyss", "Open water", "The open ocean beyond the shelf",
         "The open ocean surface from below.",
         Photo(photographer="Kurt Arrigo", file="open-water.jpg")),
)
_BY_KEY = {r.key: r for r in CATALOG}

# The Home hero photograph (wide 2:1). Falls back to the authored atmosphere if absent.
HERO = Photo(photographer="Renata Romeo", file="hero.jpg")
HERO_ALT = "A sunlit tropical coral reef alive with schooling fish."


def _photo_available(reef: Reef, img_dir: Path | None) -> bool:
    return bool(
        reef.photo.file and reef.photo.photographer and img_dir and (img_dir / reef.photo.file).exists()
    )


def pill(key: str, base: str, *, uid: int, img_dir: Path | None = None, wide: bool = False) -> str:
    """Render one pill card — a real photo when placed + credited, else the authored scene."""
    reef = _BY_KEY[key]
    wide_cls = " wide" if wide else ""
    if _photo_available(reef, img_dir):
        media = (
            f'<img src="{base}assets/img/{html.escape(reef.photo.file)}" '
            f'alt="{html.escape(reef.alt)}" loading="lazy" decoding="async" '
            'width="600" height="800">'
        )
        credit = (
            f'<p class="pill-credit">{html.escape(reef.photo.photographer)} / '
            f'<a href="{reef.photo.source_url}">{html.escape(reef.photo.source)}</a></p>'
        )
    else:
        from . import assets  # local import avoids a cycle at module load
        media = assets.reef_atmosphere(reef.variant, uid)
        credit = ""
    return (
        f'<figure class="pill{wide_cls} reveal">{media}<div class="pill-scrim"></div>{credit}'
        f'<figcaption class="pill-cap"><b>{html.escape(reef.title)}</b>'
        f'<span>{html.escape(reef.caption)}</span></figcaption></figure>'
    )


def _hero_available(img_dir: Path | None) -> bool:
    return bool(HERO.file and HERO.photographer and img_dir and (img_dir / HERO.file).exists())


def hero(base: str, img_dir: Path | None = None) -> tuple[str, str]:
    """Return ``(media_html, credit_html)`` for the Home hero — real photo or authored scene."""
    if _hero_available(img_dir):
        media = (
            f'<img src="{base}assets/img/{html.escape(HERO.file)}" alt="{html.escape(HERO_ALT)}" '
            'loading="eager" fetchpriority="high" decoding="async" width="1440" height="720">'
        )
        credit = (
            f'<p class="pill-credit">{html.escape(HERO.photographer)} / '
            f'<a href="{HERO.source_url}">{html.escape(HERO.source)}</a></p>'
        )
        return media, credit
    from . import assets
    return assets.reef_atmosphere("sunlit", 10), ""


def any_photos(img_dir: Path | None) -> bool:
    return _hero_available(img_dir) or any(_photo_available(r, img_dir) for r in CATALOG)


def credits_page_body(img_dir: Path | None) -> str:
    """Body HTML for assets/credits.html — lists real-photo attributions + the authored note."""
    entries: list[tuple[str, Photo]] = []
    if _hero_available(img_dir):
        entries.append(("Home hero, sunlit coral reef", HERO))
    entries += [(r.title, r.photo) for r in CATALOG if _photo_available(r, img_dir)]
    rows = ""
    if entries:
        rows = "<ul class='prose'>" + "".join(
            f'<li><strong>{html.escape(label)}</strong> by '
            f'{html.escape(photo.photographer)} / '
            f'<a href="{photo.source_url}">{html.escape(photo.source)}</a>, '
            f'used under the Ocean Image Bank licence.</li>'
            for label, photo in entries
        ) + "</ul>"
    authored_note = (
        "<p>Any reef scene not individually credited above is an <em>authored illustration</em> "
        "generated by the site rather than a photograph, and needs no attribution.</p>"
        '<h2 style="margin-top:2.4rem">Typography</h2>'
        "<p>Set in <strong>DM Sans</strong> (Colophon Foundry and Indian Type Foundry), "
        "self-hosted under the SIL Open Font License 1.1. See "
        "<a href=\"fonts/OFL.txt\">fonts/OFL.txt</a>.</p>"
    )
    return (
        '<section class="section"><div class="wrap narrow prose">'
        '<p class="eyebrow">Attribution</p><h1>Image credits</h1>'
        "<p class=\"lead\">S.C.O.U.T. uses free reef photography from the Ocean Image Bank "
        "(The Ocean Agency) under its licence, which requires crediting each photographer. "
        "Photographs are used for ocean conservation and education, as the licence intends.</p>"
        f"{rows}{authored_note}"
        '<p><a href="../">← Back to S.C.O.U.T.</a></p>'
        "</div></section>"
    )
