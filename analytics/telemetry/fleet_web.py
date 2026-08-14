"""Fleet overview page — the network view of the S.C.O.U.T. site.

Where :mod:`telemetry.web` renders one buoy's live dashboard, this module renders the **fleet**:
a single overview page listing every buoy at a glance (current alert, a temperature sparkline,
key stats), each tile linking to that buoy's own full dashboard. It is rendered through the
shared site design system (:mod:`telemetry.site`) so it reads as one surface with the rest of
the site, and it references no external or cross-origin host.

Buoys are never blended — merging streams would corrupt daily means and DHW — so each buoy's
report comes from the per-buoy :mod:`telemetry.fleet` analysis, with its own site climatology.

The small chart / stat helpers here are deliberately kept local (rather than imported from
:mod:`telemetry.web`) so this page stays decoupled from that module's private internals; the
only shared dependency is :func:`telemetry.web.write_site`, the public per-buoy renderer.

Standard library only.
"""

from __future__ import annotations

import html
import json
from datetime import datetime, timezone
from pathlib import Path

from . import bleaching, web
from .fleet import FleetReport, summarize_fleet
from .pipeline import TelemetryReport
from .site import layout

# Bleaching alert → CSS class (colour lives in the theme tokens, theme-aware). Kept local so
# this page does not reach into web.py's private module surface.
_ALERT_CLASS = {
    bleaching.ALERT_NO_STRESS: "a-nostress",
    bleaching.ALERT_WATCH: "a-watch",
    bleaching.ALERT_WARNING: "a-warning",
    bleaching.ALERT_LEVEL_1: "a-alert1",
    bleaching.ALERT_LEVEL_2: "a-alert2",
}
# Severity order for triage: worst buoys sort to the top of the grid. "No data" is lowest.
_SEVERITY = {name: i for i, name in enumerate(bleaching.ALERT_LEVELS)}
_NO_DATA = "No data"

# Sparkline geometry (compact; drawn responsive via preserveAspectRatio).
_SW, _SH, _SPAD = 260, 58, 5


def _fmt(value: float | None, unit: str, digits: int = 1) -> str:
    return f"{value:.{digits}f} {unit}" if value is not None else "—"


def _latest(values: list[float | None]) -> float | None:
    return next((v for v in reversed(values) if v is not None), None)


def _sparkline(values: list[float | None], *, mmm: float | None) -> str:
    """A tiny temperature sparkline: the daily-mean line, plus a faint MMM reference.

    No axes or labels — it is a shape, not a chart; the full chart lives on the buoy's own
    dashboard. Styled by the shared ``.s-temp`` / ``.rl-mmm`` classes (theme-aware). No xmlns:
    inline SVG in HTML5 inherits the namespace, keeping the page free of any external reference.
    """
    nums = [v for v in values if v is not None]
    extra = [mmm] if mmm is not None else []
    if not nums:
        return '<div class="spark spark-empty" aria-hidden="true"></div>'
    lo, hi = min(nums + extra), max(nums + extra)
    if lo == hi:
        lo, hi = lo - 1.0, hi + 1.0
    span_x, span_y = _SW - 2 * _SPAD, _SH - 2 * _SPAD
    n = len(values)

    def x(i: int) -> float:
        return _SPAD + (0 if n <= 1 else i / (n - 1) * span_x)

    def y(v: float) -> float:
        return _SPAD + span_y - (v - lo) / (hi - lo) * span_y

    parts = [f'<svg viewBox="0 0 {_SW} {_SH}" class="chart spark" '
             'preserveAspectRatio="none" role="img" aria-label="Temperature trend">']
    if mmm is not None and lo <= mmm <= hi:
        parts.append(f'<line class="rl-mmm" x1="{_SPAD}" y1="{y(mmm):.1f}" '
                     f'x2="{_SW - _SPAD}" y2="{y(mmm):.1f}" stroke-dasharray="4 3" '
                     'stroke-width="1" opacity="0.7"/>')
    segment: list[str] = []
    for i, v in enumerate(values):
        if v is None:
            if len(segment) > 1:
                parts.append(_polyline(segment))
            segment = []
        else:
            segment.append(f"{x(i):.1f},{y(v):.1f}")
    if len(segment) > 1:
        parts.append(_polyline(segment))
    elif len(segment) == 1:
        cx, cy = segment[0].split(",")
        parts.append(f'<circle class="f-temp" cx="{cx}" cy="{cy}" r="2.6"/>')
    parts.append("</svg>")
    return "".join(parts)


def _polyline(points: list[str]) -> str:
    return (f'<polyline class="s-temp" points="{" ".join(points)}" fill="none" '
            'stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>')


def _stat(label: str, value: str, *, cls: str = "") -> str:
    return (
        '<div class="stat">'
        f'<p class="stat-label">{html.escape(label)}</p>'
        f'<p class="stat-value {cls}">{html.escape(value)}</p></div>'
    )


def _span_days(first: datetime | None, last: datetime | None) -> str:
    if not (first and last):
        return "—"
    days = (last.date() - first.date()).days + 1
    return f"{days} day" if days == 1 else f"{days} days"


def _current_alert(report: TelemetryReport) -> str:
    return report.thermal[-1].alert if report.thermal else _NO_DATA


def _tile(buoy_id: str, report: TelemetryReport, mmm: float | None) -> str:
    """One buoy card — alert badge, temperature sparkline, key stats — linking to its dashboard."""
    daily = report.daily
    temps = [d.temp_mean for d in daily]
    alert = _current_alert(report)
    alert_cls = _ALERT_CLASS.get(alert, "")
    ts = report.thermal_summary
    stats = "".join([
        _pair("Latest temp", _fmt(_latest(temps), "°C", 1)),
        _pair("Peak DHW", f"{ts.peak_dhw:g} °C-wk" if ts else "—"),
        _pair("Completeness", f"{report.qc.completeness_pct:g}%"),
        _pair("Data span", _span_days(report.qc.first, report.qc.last)),
    ])
    href = f"{html.escape(buoy_id)}/"
    return (
        f'<a class="card hoverable buoy-tile reveal" href="{href}" '
        f'aria-label="{html.escape(buoy_id)} dashboard — {html.escape(alert)}">'
        '<div class="buoy-head">'
        f"<h3>{html.escape(buoy_id)}</h3>"
        f'<span class="alert-badge {alert_cls}">{html.escape(alert)}</span></div>'
        f"{_sparkline(temps, mmm=mmm)}"
        f'<dl class="tile-stats">{stats}</dl>'
        '<span class="tile-more">View dashboard →</span></a>'
    )


def _pair(label: str, value: str) -> str:
    return f"<div><dt>{html.escape(label)}</dt><dd>{html.escape(value)}</dd></div>"


def _worst_alert(fleet: FleetReport) -> str:
    alerts = [_current_alert(r) for r in fleet.reports.values()]
    ranked = [a for a in alerts if a in _SEVERITY]
    return max(ranked, key=lambda a: _SEVERITY[a]) if ranked else _NO_DATA


def render_overview(
    fleet: FleetReport,
    *,
    title: str = "Fleet · S.C.O.U.T.",
    generated_at: datetime | None = None,
    banner: str | None = None,
    base: str = "../",
    fonts_present: bool = False,
) -> str:
    """Render the full self-contained fleet overview document."""
    generated_at = generated_at or datetime.now(timezone.utc)
    generated = generated_at.strftime("%Y-%m-%d %H:%M UTC")

    # Worst-first so a reader triages the network at a glance (severity, then id for stability).
    order = sorted(
        fleet.reports,
        key=lambda b: (-_SEVERITY.get(_current_alert(fleet.reports[b]), -1), b),
    )
    tiles = "".join(_tile(b, fleet.reports[b], fleet.mmm_by_buoy.get(b)) for b in order)

    n_buoys = len(fleet.reports)
    total_records = sum(r.qc.n_records for r in fleet.reports.values())
    total_events = sum(len(r.turbidity_anomalies.events) for r in fleet.reports.values())
    comps = [r.qc.completeness_pct for r in fleet.reports.values()]
    mean_comp = sum(comps) / len(comps) if comps else 0.0
    worst = _worst_alert(fleet)

    rollup = "".join([
        _stat("Buoys", str(n_buoys)),
        _stat("Highest alert", worst, cls=_ALERT_CLASS.get(worst, "")),
        _stat("Total records", f"{total_records:,}"),
        _stat("Mean completeness", f"{mean_comp:g}%"),
        _stat("Turbidity events", str(total_events)),
    ])

    buoy_word = "buoy" if n_buoys == 1 else "buoys"
    head = (
        '<section class="page-head"><div class="wrap">'
        '<p class="eyebrow">Fleet</p><h1>Fleet overview</h1>'
        f'<p class="lead">{n_buoys} {buoy_word} reporting across the network. Each is analysed '
        "independently — its own daily means, its own Degree Heating Weeks against its own site "
        "climatology — then summarised here.</p>"
        '<div class="dash-meta" style="margin-top:1.6rem">'
        f'<span><span class="k">Generated</span> {html.escape(generated)}</span>'
        f'<span><span class="k">Buoys</span> {n_buoys}</span>'
        f'<span><span class="k">Highest alert</span> {html.escape(worst)}</span>'
        "</div></div></section>"
    )

    body = (
        f"{head}"
        '<section class="section"><div class="wrap">'
        f'<div class="cards fleet-strip">{rollup}</div>'
        f'<div class="fleet-grid">{tiles}</div>'
        '<p class="data-links">Each tile links to that buoy\'s full dashboard · '
        'fleet rollup <a href="fleet_summary.json">summary JSON</a></p>'
        '<p class="data-links" style="color:var(--faint)">Buoys are never blended: merging '
        "streams would corrupt daily means and Degree Heating Weeks. Thermal stress uses NOAA "
        "Coral Reef Watch DHW with a per-buoy Maximum Monthly Mean.</p>"
        "</div></section>"
    )

    return layout.document(
        title=title,
        description=("Fleet overview for the S.C.O.U.T. nearshore-monitoring network: every buoy's "
                     "current bleaching-alert status, temperature trend, and data health at a glance."),
        active="fleet",
        body=body,
        base=base,
        banner=banner,
        generated=generated,
        fonts_present=fonts_present,
        external=True,
    )


def write_fleet_site(
    fleet: FleetReport,
    out_dir: str | Path,
    *,
    generated_at: datetime | None = None,
    banner: str | None = None,
    base: str = "../",
    fonts_present: bool = False,
) -> Path:
    """Write the fleet overview, one full dashboard per buoy, and the rollup JSON.

    Layout under ``out_dir`` (typically ``<site>/fleet``)::

        index.html                       fleet overview
        fleet_summary.json               per-buoy rollup
        <buoy_id>/index.html             that buoy's full dashboard (+ its CSV / JSON)
    """
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    # Per-buoy full dashboards (reuse the public analytics renderer; two levels deep → "../../").
    for buoy_id, report in fleet.reports.items():
        web.write_site(
            report, out / buoy_id,
            title=f"{buoy_id} · Telemetry · S.C.O.U.T.",
            generated_at=generated_at, banner=banner, base="../../", fonts_present=fonts_present,
        )

    (out / "fleet_summary.json").write_text(json.dumps(summarize_fleet(fleet), indent=2))

    index = out / "index.html"
    index.write_text(render_overview(
        fleet, generated_at=generated_at, banner=banner, base=base, fonts_present=fonts_present,
    ))
    return index
