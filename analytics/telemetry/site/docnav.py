"""Left section navigation for the long content pages (technology, science).

A sticky sidebar listing the page's sections as dot-marked links, with a scroll-spy active
state driven by ``assets/js/doc-nav.js`` (an IntersectionObserver). Without JavaScript it
degrades to a plain in-page anchor list, so the page is still fully navigable.
"""

from __future__ import annotations


def _sidebar(title: str, items: list[tuple[str, str]]) -> str:
    links = "".join(
        f'<li><a class="doc-nav-link" href="#{sid}">'
        f'<span class="doc-nav-dot" aria-hidden="true"></span>{label}</a></li>'
        for sid, label in items
    )
    return (
        '<aside class="doc-nav" aria-label="On this page">'
        f'<p class="doc-nav-title">{title}</p>'
        f'<ul class="doc-nav-list">{links}</ul></aside>'
    )


def page(*, title: str, items: list[tuple[str, str]], content: str, base: str) -> str:
    """Wrap page ``content`` in the two-column doc layout with the sticky section sidebar.

    ``items`` are ``(section_id, label)`` pairs; each ``section_id`` must match a section's id
    in ``content``. The sidebar is hidden below the two-column breakpoint (see theme.py).
    """
    return (
        f'<div class="doc">{_sidebar(title, items)}'
        f'<div class="doc-body">{content}</div></div>'
        f'<script defer src="{base}assets/js/doc-nav.js"></script>'
    )
