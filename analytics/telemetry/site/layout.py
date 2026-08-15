"""The shared page shell: ``document()`` plus the site header and footer.

Every page is one standalone HTML document with the design-system CSS inlined. Navigation and
asset URLs are resolved through ``base`` (``""`` at the site root, ``"../"`` one level deep) so
pretty directory URLs work on GitHub Pages. The footer's external resource links are gated off
on the Analytics page, which is held to the self-contained contract enforced by
``telemetry/tests/test_web.py``: it loads nothing cross-origin. External *hyperlinks* (the
header GitHub icon) are user navigations, not loaded resources, so they appear on every page.
"""

from __future__ import annotations

from . import assets, theme

REPO_URL = "https://github.com/David-Chousal/S.C.O.U.T."
SCU_URL = "https://www.scu.edu/engineering/"
CONTACT_EMAIL = "davidchousal@icloud.com"

# (slug, label, optional-on-mobile, in-header). Home slug is "" (site root). Fleet is in the
# footer only for now.
_NAV = (
    ("", "Home", False, True),
    ("technology/", "Technology", True, True),
    ("science/", "Science", True, True),
    ("analytics/", "Analytics", False, True),
    ("fleet/", "Fleet", True, False),
    ("about/", "About", True, True),
)
_ACTIVE_SLUG = {"home": "", "technology": "technology/", "science": "science/",
                "analytics": "analytics/", "fleet": "fleet/", "about": "about/"}


def _href(base: str, slug: str) -> str:
    return (base + slug) or "./"


def _brand(base: str) -> str:
    return (
        f'<a class="brand" href="{_href(base, "")}" aria-label="S.C.O.U.T. home">'
        + assets.picture(
            f'<img class="mark" src="{base}assets/img/brand/scout-mark.png" alt="" '
            'width="30" height="30" decoding="async">'
        )
        + '<span class="brand-txt"><b>S.C.O.U.T.</b>'
        "<span>Oceanic Utilities Transmitter</span></span></a>"
    )


def _nav_social(base: str) -> str:
    return (
        '<div class="nav-social">'
        f'<a href="{REPO_URL}" aria-label="SCOUT on GitHub">{assets.social_icon("github")}</a>'
        f'<a href="{base}about/#team" aria-label="The team on LinkedIn">'
        f'{assets.social_icon("linkedin")}</a>'
        "</div>"
    )


def header(base: str, active: str, social: bool = True) -> str:
    active_slug = _ACTIVE_SLUG.get(active, "")
    links = []
    for slug, label, optional, in_header in _NAV:
        if not in_header:
            continue
        is_active = slug == active_slug
        cur = ' aria-current="page"' if is_active else ""
        cls = ' class="opt"' if optional else ""
        # A real element (not ::after) so it can carry a view-transition-name and slide
        # between pages during the cross-document transition.
        mark = '<span class="nav-mark"></span>' if is_active else ""
        links.append(f'<li{cls}><a href="{_href(base, slug)}"{cur}>{label}{mark}</a></li>')
    # The GitHub icon is an external *hyperlink* (a user navigation), not a resource the page
    # loads, so it is safe even on the strict Analytics/per-buoy pages: those still fetch nothing
    # cross-origin on load. Shown everywhere.
    social_html = _nav_social(base) if social else ""
    # Script-free mobile menu: a visually-hidden checkbox toggles the nav panel via the label
    # (the CSS `:checked ~` sibling trick). No JavaScript, so it works on the strict Analytics
    # and per-buoy pages too; a full-page navigation naturally resets it closed.
    return (
        '<header class="site-header"><nav class="wrap nav" aria-label="Primary">'
        f"{_brand(base)}"
        '<input type="checkbox" id="nav-toggle" class="nav-toggle">'
        '<label for="nav-toggle" class="nav-burger" aria-label="Toggle navigation menu">'
        "<span></span></label>"
        f'<ul class="nav-links">{"".join(links)}</ul>'
        f"{social_html}"
        "</nav></header>"
    )


def _lottie_scripts(base: str) -> str:
    return (
        f'<script defer src="{base}assets/lottie/lottie.min.js"></script>'
        f'<script defer src="{base}assets/lottie/init.js"></script>'
    )


def _footer_seaweed(base: str) -> str:
    src = f"{base}assets/lottie/seaweed.json"
    return (
        '<div class="footer-seaweed" aria-hidden="true">'
        f'<span class="weed weed-a" data-lottie="{src}"></span>'
        f'<span class="weed weed-b" data-lottie="{src}"></span>'
        f'<span class="weed weed-c" data-lottie="{src}"></span>'
        "</div>"
    )


def footer(base: str, *, external: bool = True) -> str:
    explore = "".join(
        f'<li><a href="{_href(base, slug)}">{label}</a></li>'
        for slug, label, *_ in _NAV if slug  # skip Home; keeps Fleet in the footer
    )
    email = (
        '<div class="footer-social">'
        f'<a href="mailto:{CONTACT_EMAIL}" aria-label="Email the team">'
        f'{assets.social_icon("mail")}</a></div>'
        if external else ""
    )
    resources = (
        (
            '<div class="footer-col"><h4>Resources</h4><ul>'
            f'<li><a href="{REPO_URL}">GitHub repository</a></li>'
            f'<li><a href="{base}analytics/telemetry_daily.csv">Telemetry CSV</a></li>'
            f'<li><a href="{base}assets/credits.html">Image credits</a></li>'
            f'<li><a href="{SCU_URL}">SCU Engineering</a></li>'
            "</ul></div>"
        )
        if external
        else (
            '<div class="footer-col"><h4>Data</h4><ul>'
            '<li><a href="telemetry_daily.csv">Daily CSV</a></li>'
            '<li><a href="telemetry_summary.json">Summary JSON</a></li>'
            "</ul></div>"
        )
    )
    seaweed = _footer_seaweed(base)  # on every page, including Analytics
    # Ambient critters drifting around the footer — one each, spread for good spacing.
    critters = (
        '<div class="footer-critters" aria-hidden="true">'
        f'<span class="critter critter-jelly" data-lottie="{base}assets/lottie/jellyfish.json"></span>'
        f'<span class="critter critter-sub" data-lottie="{base}assets/lottie/submarine.json"></span>'
        f'<span class="critter critter-crab" data-lottie="{base}assets/lottie/crab.json"></span>'
        f'<span class="critter critter-star" data-lottie="{base}assets/lottie/starfish.json"></span>'
        "</div>"
    )
    return (
        f'<footer class="site-footer">{seaweed}{critters}<div class="wrap footer-grid">'
        '<div class="footer-brand">'
        "<p>Santa Clara Oceanic Utilities Transmitter. A low-cost, solar-powered nearshore "
        "monitoring buoy. Santa Clara University senior design capstone, 2026–2027.</p>"
        f"{email}</div>"
        f'<div class="footer-col"><h4>Explore</h4><ul>{explore}</ul></div>'
        f"{resources}"
        '<div class="wrap footer-base" style="padding-inline:0">'
        "<span>© 2026 D. Chousal Cantu · I. Rodriguez · J. R. Myrdal · MIT License</span>"
        "<span>Thermal-stress metrics via NOAA Coral Reef Watch</span>"
        "</div></div></footer>"
    )


def document(
    *,
    title: str,
    description: str,
    active: str,
    body: str,
    base: str = "",
    banner: str | None = None,
    ribbon: str | None = None,
    generated: str | None = None,
    fonts_present: bool = False,
    external: bool = True,
) -> str:
    """Assemble a full, self-contained HTML document."""
    ribbon_html = f'<div class="ribbon">{ribbon}</div>' if ribbon else ""
    banner_html = f'<div class="banner">{banner}</div>' if banner else ""
    gen_meta = f'<meta name="generator" content="scout-site {generated}">' if generated else ""
    return (
        "<!doctype html>\n"
        '<html lang="en">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f"<title>{title}</title>\n"
        f'<meta name="description" content="{description}">\n'
        '<meta name="theme-color" content="#f5f1ec">\n'
        f'<link rel="icon" href="{theme.FAVICON}">\n'
        f"{gen_meta}\n"
        f"<style>{theme.styles(base=base, fonts_present=fonts_present)}</style>\n"
        f'</head>\n<body data-lottie-base="{base}assets/lottie/">\n'
        '<a class="skip" href="#main">Skip to content</a>\n'
        f"{ribbon_html}"
        # Header social icons appear on every page (they are hyperlinks, not loaded resources).
        # The footer's external resource links stay gated on ``external``.
        f"{header(base, active, social=True)}\n"
        f"{banner_html}"
        f'<main id="main">\n{body}\n</main>\n'
        f"{footer(base, external=external)}\n"
        # Self-hosted Lottie runtime for the ambient animations, on every page (including
        # Analytics). Same-origin only; the page still makes no cross-origin request.
        f"{_lottie_scripts(base)}"
        "</body>\n</html>\n"
    )
