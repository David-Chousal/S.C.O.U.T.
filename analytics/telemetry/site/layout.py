"""The shared page shell: ``document()`` plus the site header and footer.

Every page is one standalone HTML document with the design-system CSS inlined. Navigation and
asset URLs are resolved through ``base`` (``""`` at the site root, ``"../"`` one level deep) so
pretty directory URLs work on GitHub Pages. External links in the footer are gated off on the
Analytics page, which is held to the strict self-contained contract (no external references at
all) enforced by ``telemetry/tests/test_web.py``.
"""

from __future__ import annotations

from . import theme

REPO_URL = "https://github.com/David-Chousal/S.C.O.U.T."
SCU_URL = "https://www.scu.edu/engineering/"

# (slug, label, optional-on-mobile). Home slug is "" (site root).
_NAV = (
    ("", "Home", False),
    ("technology/", "Technology", True),
    ("science/", "Science", True),
    ("analytics/", "Analytics", False),
    ("about/", "About", True),
)
_ACTIVE_SLUG = {"home": "", "technology": "technology/", "science": "science/",
                "analytics": "analytics/", "about": "about/"}


def _href(base: str, slug: str) -> str:
    return (base + slug) or "./"


def _brand(base: str) -> str:
    return (
        f'<a class="brand" href="{_href(base, "")}" aria-label="S.C.O.U.T. home">'
        '<span class="brand-txt"><b>S.C.O.U.T.</b>'
        "<span>Oceanic Utilities Transmitter</span></span></a>"
    )


def header(base: str, active: str) -> str:
    active_slug = _ACTIVE_SLUG.get(active, "")
    links = []
    for slug, label, optional in _NAV:
        active = slug == active_slug
        cur = ' aria-current="page"' if active else ""
        cls = ' class="opt"' if optional else ""
        # A real element (not ::after) so it can carry a view-transition-name and slide
        # between pages during the cross-document transition.
        mark = '<span class="nav-mark"></span>' if active else ""
        links.append(f'<li{cls}><a href="{_href(base, slug)}"{cur}>{label}{mark}</a></li>')
    return (
        '<header class="site-header"><nav class="wrap nav" aria-label="Primary">'
        f"{_brand(base)}"
        f'<ul class="nav-links">{"".join(links)}</ul>'
        "</nav></header>"
    )


def footer(base: str, *, external: bool = True) -> str:
    explore = "".join(
        f'<li><a href="{_href(base, slug)}">{label}</a></li>'
        for slug, label, _ in _NAV if slug  # skip Home
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
    return (
        '<footer class="site-footer"><div class="wrap footer-grid">'
        '<div class="footer-brand">'
        f"{_brand(base)}"
        "<p>Santa Clara Oceanic Utilities Transmitter. A low-cost, solar-powered nearshore "
        "monitoring buoy. Santa Clara University senior design capstone, 2026–2027.</p></div>"
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
        "</head>\n<body>\n"
        '<a class="skip" href="#main">Skip to content</a>\n'
        f"{ribbon_html}"
        f"{header(base, active)}\n"
        f"{banner_html}"
        f'<main id="main">\n{body}\n</main>\n'
        f"{footer(base, external=external)}\n"
        "</body>\n</html>\n"
    )
