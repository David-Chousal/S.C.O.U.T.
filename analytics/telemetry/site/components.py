"""Reusable presentational fragments shared across the authored pages.

Pure string builders — no state. Kept deliberately small; page-specific composition lives in
the ``pages`` package.
"""

from __future__ import annotations

import html

from . import assets


def section(inner: str, *, cls: str = "", sid: str | None = None, wrap: str = "wrap") -> str:
    idattr = f' id="{sid}"' if sid else ""
    classes = ("section " + cls).strip()
    body = f'<div class="{wrap}">{inner}</div>' if wrap else inner
    return f'<section class="{classes}"{idattr}>{body}</section>'


def head_block(eyebrow: str, title: str, lead: str | None = None, *, cls: str = "reveal") -> str:
    lead_html = f'<p class="lead">{lead}</p>' if lead else ""
    return (
        f'<div class="head-block {cls}"><p class="eyebrow">{eyebrow}</p>'
        f"<h2>{title}</h2>{lead_html}</div>"
    )


def cta(kicker: str, title: str, buttons: str) -> str:
    """A single warm ink card — the one bold moment on an otherwise calm page."""
    return section(
        '<article class="card card-ink center">'
        f'<p class="kicker">{kicker}</p>'
        f'<h2 style="max-width:20ch;margin-inline:auto">{title}</h2>'
        f'<div class="btn-row" style="margin-top:1.8rem">{buttons}</div></article>',
        cls="section-sm",
    )


def page_header(eyebrow: str, title: str, lead: str) -> str:
    return (
        '<section class="page-head"><div class="wrap">'
        f'<p class="eyebrow">{eyebrow}</p><h1>{title}</h1>'
        f'<p class="lead">{lead}</p></div></section>'
    )


def feature_card(glyph_name: str, kicker: str, title: str, body: str, *, cls: str = "") -> str:
    return (
        f'<article class="card hoverable reveal {cls}">'
        f'<div class="card-figure">{assets.glyph(glyph_name)}<div>'
        f'<p class="kicker">{kicker}</p><h3>{title}</h3><p>{body}</p>'
        "</div></div></article>"
    )


def stat_card(value: str, unit: str, label: str, *, deep: bool = False) -> str:
    cls = "card feature-deep reveal" if deep else "card reveal"
    return (
        f'<article class="{cls}"><p class="kicker">{label}</p>'
        f'<p class="big">{value} <span class="big-unit">{unit}</span></p></article>'
    )


def render_slot(tag: str, title: str, sub: str) -> str:
    return (
        '<div class="render-slot reveal">'
        f"{assets.buoy_render_svg()}"
        f'<div class="rs-label"><span class="tag">{tag}</span>'
        f"<b>{title}</b><span>{sub}</span></div></div>"
    )


def steps(items: list[tuple[str, str]]) -> str:
    inner = "".join(
        f'<div class="step reveal"><h3>{t}</h3><p>{b}</p></div>' for t, b in items
    )
    return f'<div class="steps">{inner}</div>'


def spec(pairs: list[tuple[str, str]]) -> str:
    rows = "".join(
        f'<div class="spec-row"><dt>{dt}</dt><dd>{dd}</dd></div>' for dt, dd in pairs
    )
    return f'<dl class="spec">{rows}</dl>'


def member(name: str, role: str, disc: str, bio: str, initials: str, uid: int, hue: int) -> str:
    return (
        '<article class="member reveal">'
        f"{assets.avatar(initials, uid, hue)}"
        f'<span class="disc">{disc}</span>'
        f"<h3>{name}</h3><p class=\"role\">{role}</p><p>{bio}</p>"
        "</article>"
    )


def data_table(caption: str, headers: list[str], rows: list[list[str]], *, num_cols: set[int] = frozenset()) -> str:
    head = "".join(f"<th>{html.escape(h)}</th>" for h in headers)
    body_rows = []
    for row in rows:
        cells = "".join(
            f'<td class="{"num" if i in num_cols else ""}">{html.escape(str(c))}</td>'
            for i, c in enumerate(row)
        )
        body_rows.append(f"<tr>{cells}</tr>")
    return (
        '<div class="table-scroll"><table class="data">'
        f"<caption>{html.escape(caption)}</caption>"
        f"<thead><tr>{head}</tr></thead><tbody>{''.join(body_rows)}</tbody></table></div>"
    )
