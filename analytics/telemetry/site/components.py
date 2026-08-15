"""Reusable presentational fragments shared across the authored pages.

Pure string builders — no state. Kept deliberately small; page-specific composition lives in
the ``pages`` package.
"""

from __future__ import annotations

import html

from . import assets


def side_critter(base: str, name: str, side: str, aspect: str) -> str:
    """A single ambient Lottie animation fixed in a page's side margin (shown only on wide
    screens where real margin exists). ``side`` is 'left' or 'right'; ``aspect`` is the
    animation's ``w/h`` (e.g. ``'1666/1607'``). Same-origin JSON, driven by the shared init.js."""
    return (
        f'<div class="side-critter side-{side}" aria-hidden="true" '
        f'style="aspect-ratio:{aspect}" '
        f'data-lottie="{base}assets/lottie/{name}.json"></div>'
    )


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


def feature_plain(glyph_name: str, kicker: str, title: str, body: str, *, cls: str = "") -> str:
    """A signal descriptor with no card chrome — glyph, kicker, title, body straight on the page."""
    return (
        f'<div class="feature-plain reveal {cls}">'
        f"{assets.glyph(glyph_name)}"
        f'<p class="kicker">{kicker}</p><h3>{title}</h3><p>{body}</p>'
        "</div>"
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


def member(name: str, role: str, disc: str, bio: str, initials: str, uid: int, hue: int,
           linkedin: str, photo: str | None = None) -> str:
    avatar = assets.avatar_photo(photo, name) if photo else assets.avatar(initials, uid, hue)
    return (
        '<article class="member reveal">'
        '<div class="member-top">'
        f"{avatar}"
        f'<a class="member-linkedin" href="{linkedin}" aria-label="{html.escape(name)} on LinkedIn">'
        f'{assets.social_icon("linkedin")}</a>'
        "</div>"
        f'<span class="disc">{disc}</span>'
        f'<h3>{name}</h3><p class="role">{role}</p><p>{bio}</p>'
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


def data_path() -> str:
    """The buoy → shore → dashboard data path. Shared verbatim by Home and Technology so the two
    can never drift. Values track docs/hub/facts.md (Communications & data · Sensing)."""
    body = steps([
        ("Sense", "The buoy wakes about every 30 minutes, reads water temperature and battery "
                  "voltage, samples turbidity less often, and returns to sleep."),
        ("Store", "Each wake appends one row to an on-board CSV log, timestamped in UTC. Raw data "
                  "never leaves the buoy: the full archive, audio included, stays in on-board "
                  "storage and is retrieved by hand."),
        ("Transmit", "Once a day the buoy sends a single 82-byte summary to shore over a 915 MHz "
                     "LoRa link, roughly 2 km line of sight. No cellular service or internet is "
                     "used at the buoy."),
        ("Publish", "The shore Raspberry Pi validates each packet, runs quality control and NOAA "
                    "Coral Reef Watch thermal-stress metrics, and regenerates this dashboard, "
                    "using only the Python standard library."),
    ])
    return section(
        head_block("How it works", "The data path")
        + f'<div style="margin-top:2.8rem">{body}</div>',
        cls="section-sm",
        sid="how",
    )
