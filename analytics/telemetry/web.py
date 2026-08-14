"""Analytics dashboard generator — the data-driven page of the S.C.O.U.T. site.

Because the buoy transmits ~once per day, "live" means *republished when new data lands*, not
real-time. The shore Raspberry Pi runs the pipeline on a schedule, calls :func:`write_site`,
and pushes the result; GitHub Pages serves it. See docs/engineering/live-dashboard.md.

The page is rendered through the shared site design system (:mod:`telemetry.site`) so it reads
as one surface with the rest of the site, yet it remains **fully self-contained**: inline CSS,
inline SVG charts, and no external scripts, fonts, stylesheets, or network requests — so it
renders offline, passes a strict CSP, and needs no JavaScript. Chart colours are CSS design
tokens, so every series is correct in both light and dark themes. Standard library only.
"""

from __future__ import annotations

import html
from datetime import date, datetime, timezone
from pathlib import Path

from . import bleaching
from .pipeline import TelemetryReport, write_daily_csv, write_summary_json
from .site import layout

# Bleaching alert → CSS class (colour lives in the design tokens, theme-aware).
_ALERT_CLASS = {
    bleaching.ALERT_NO_STRESS: "a-nostress",
    bleaching.ALERT_WATCH: "a-watch",
    bleaching.ALERT_WARNING: "a-warning",
    bleaching.ALERT_LEVEL_1: "a-alert1",
    bleaching.ALERT_LEVEL_2: "a-alert2",
}
_W, _H = 720, 200
_PAD_L, _PAD_R, _PAD_T, _PAD_B = 46, 14, 14, 26


def _range(values: list[float | None], extra: tuple[float, ...] = ()) -> tuple[float, float]:
    nums = [v for v in values if v is not None] + list(extra)
    if not nums:
        return 0.0, 1.0
    lo, hi = min(nums), max(nums)
    if lo == hi:
        return lo - 1.0, hi + 1.0
    pad = (hi - lo) * 0.10
    return lo - pad, hi + pad


def _svg_chart(
    values: list[float | None],
    *,
    series: str,                       # 'temp' | 'dhw' | 'turb' | 'batt' → CSS classes s-*/f-*
    days: list[date],
    reflines: tuple[tuple[float, str, str], ...] = (),   # (value, css_suffix, label)
    markers: frozenset[int] = frozenset(),
    fill: bool = False,
) -> str:
    """One responsive SVG line chart, styled entirely by CSS class (theme-aware)."""
    vmin, vmax = _range(values, extra=tuple(r[0] for r in reflines))
    n = len(values)
    span_x = _W - _PAD_L - _PAD_R
    span_y = _H - _PAD_T - _PAD_B

    def x(i: int) -> float:
        return _PAD_L + (0 if n <= 1 else i / (n - 1) * span_x)

    def y(v: float) -> float:
        return _PAD_T + span_y - (v - vmin) / (vmax - vmin) * span_y

    # No xmlns: inline SVG in HTML5 inherits the SVG namespace from the parser, so the page
    # stays provably free of any external reference (not even a namespace URL).
    parts: list[str] = [
        f'<svg viewBox="0 0 {_W} {_H}" class="chart" preserveAspectRatio="none" role="img">'
    ]
    # baseline + y-axis min/max labels
    parts.append(f'<line class="grid" x1="{_PAD_L}" y1="{y(vmin):.1f}" '
                 f'x2="{_W - _PAD_R}" y2="{y(vmin):.1f}"/>')
    parts.append(f'<text x="6" y="{y(vmax) + 3:.1f}" class="ax">{vmax:.2f}</text>')
    parts.append(f'<text x="6" y="{y(vmin):.1f}" class="ax">{vmin:.2f}</text>')
    # reference lines (MMM, threshold, DHW alert levels …)
    for value, suffix, label in reflines:
        if vmin <= value <= vmax:
            yy = y(value)
            parts.append(f'<line class="rl-{suffix}" x1="{_PAD_L}" y1="{yy:.1f}" '
                         f'x2="{_W - _PAD_R}" y2="{yy:.1f}" stroke-dasharray="4 3" '
                         'stroke-width="1" opacity="0.85"/>')
            parts.append(f'<text class="ax tx-{suffix}" x="{_W - _PAD_R:.1f}" y="{yy - 3:.1f}" '
                         f'text-anchor="end">{html.escape(label)}</text>')
    # data as polyline segments (break on None gaps)
    segment: list[str] = []
    for i, v in enumerate(values):
        if v is None:
            if len(segment) > 1:
                parts.append(_polyline(segment, series, fill, y(vmin)))
            segment = []
        else:
            segment.append(f"{x(i):.1f},{y(v):.1f}")
    if len(segment) > 1:
        parts.append(_polyline(segment, series, fill, y(vmin)))
    elif len(segment) == 1:
        cx, cy = segment[0].split(",")
        parts.append(f'<circle class="f-{series}" cx="{cx}" cy="{cy}" r="2.6"/>')
    # markers (e.g. turbidity events)
    for i in markers:
        if 0 <= i < n and values[i] is not None:
            parts.append(f'<circle class="mk-event" cx="{x(i):.1f}" cy="{y(values[i]):.1f}" '
                         'r="3.4" stroke="var(--surface)" stroke-width="0.8"/>')
    # x-axis date labels
    if days:
        parts.append(f'<text x="{_PAD_L}" y="{_H - 6}" class="ax">{days[0].isoformat()}</text>')
        parts.append(f'<text x="{_W - _PAD_R}" y="{_H - 6}" class="ax" '
                     f'text-anchor="end">{days[-1].isoformat()}</text>')
    parts.append("</svg>")
    return "".join(parts)


def _polyline(points: list[str], series: str, fill: bool, baseline_y: float) -> str:
    line = (f'<polyline class="s-{series}" points="{" ".join(points)}" fill="none" '
            'stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>')
    if not fill:
        return line
    first_x = points[0].split(",")[0]
    last_x = points[-1].split(",")[0]
    area = (f'<polygon class="f-{series}" points="{first_x},{baseline_y:.1f} '
            f'{" ".join(points)} {last_x},{baseline_y:.1f}" opacity="0.14"/>')
    return area + line


def _stat(label: str, value: str, *, cls: str = "", sub: str | None = None) -> str:
    sub_html = f'<p class="stat-sub">{html.escape(sub)}</p>' if sub else ""
    return (
        '<div class="stat">'
        f'<p class="stat-label">{html.escape(label)}</p>'
        f'<p class="stat-value {cls}">{html.escape(value)}</p>{sub_html}</div>'
    )


def _legend(items: list[tuple[str, str]]) -> str:
    spans = "".join(
        f'<span><i class="f-{cls}" style="background:var(--c-{cls})"></i>{html.escape(lbl)}</span>'
        for cls, lbl in items
    )
    return f'<div class="legend">{spans}</div>'


def _panel(title: str, unit: str, chart: str, legend: str = "") -> str:
    return (
        '<section class="panel reveal"><div class="panel-head">'
        f'<h3>{html.escape(title)}</h3><span class="unit">{html.escape(unit)}</span></div>'
        f"{chart}{legend}</section>"
    )


def render_html(
    report: TelemetryReport,
    *,
    title: str = "Live Telemetry · S.C.O.U.T.",
    generated_at: datetime | None = None,
    banner: str | None = None,
    base: str = "../",
    fonts_present: bool = False,
) -> str:
    """Render the full self-contained Analytics document."""
    generated_at = generated_at or datetime.now(timezone.utc)
    generated = generated_at.strftime("%Y-%m-%d %H:%M UTC")
    daily = report.daily
    days = [d.day for d in daily]
    thermal_by_day = {t.day: t for t in report.thermal}
    event_days = {
        (e.at.date() if hasattr(e.at, "date") else e.at) for e in report.turbidity_anomalies.events
    }

    temps = [d.temp_mean for d in daily]
    dhws = [thermal_by_day[d].dhw if d in thermal_by_day else None for d in days]
    turb = [d.turbidity_median_adc for d in daily]
    batt = [d.battery_min_v for d in daily]
    turb_markers = frozenset(i for i, d in enumerate(days) if d in event_days)

    ts = report.thermal_summary
    latest_alert = report.thermal[-1].alert if report.thermal else "n/a"
    latest_batt = next((b for b in reversed(batt) if b is not None), None)
    tt = report.temp_trend
    mmm_line = (
        "MMM %.2f °C" % report.mmm if report.mmm is not None else "no MMM set, DHW disabled"
    )

    # Status cards
    cards = "".join([
        _stat("Current alert", latest_alert, cls=_ALERT_CLASS.get(latest_alert, "")),
        _stat("Peak DHW", f"{ts.peak_dhw:g} °C-wk" if ts else "—"),
        _stat("Peak alert", ts.peak_alert if ts else "—",
              cls=_ALERT_CLASS.get(ts.peak_alert, "") if ts else ""),
        _stat("Temp trend",
              f"{tt.slope_per_year:g} °C/yr" if tt.slope_per_year is not None else "—",
              sub=tt.label),
        _stat("Turbidity events", str(len(report.turbidity_anomalies.events))),
        _stat("Data completeness", f"{report.qc.completeness_pct:g}%"),
        _stat("Latest battery", f"{latest_batt:g} V" if latest_batt is not None else "—"),
    ])

    temp_refs: tuple[tuple[float, str, str], ...] = ()
    if report.mmm is not None:
        temp_refs = (
            (report.mmm, "mmm", "MMM"),
            (bleaching.bleaching_threshold(report.mmm), "threshold", "threshold"),
        )
    dhw_refs = (
        (bleaching.DHW_ALERT_LEVEL_1, "a1", "Alert 1"),
        (bleaching.DHW_ALERT_LEVEL_2, "a2", "Alert 2"),
    )

    span = (f"{report.qc.first:%Y-%m-%d %H:%M} → {report.qc.last:%Y-%m-%d %H:%M} UTC"
            if report.qc.first and report.qc.last else "no data")

    panels = [_panel(
        "Daily mean temperature", "°C",
        _svg_chart(temps, series="temp", days=days, reflines=temp_refs),
        _legend([("temp", "Daily mean SST")]) if temp_refs == () else
        '<div class="legend"><span><i style="background:var(--c-temp)"></i>Daily mean SST</span>'
        '<span><i style="background:var(--a-alert1)"></i>Bleaching threshold</span></div>',
    )]
    if report.thermal:
        panels.append(_panel(
            "Degree Heating Weeks", "°C-weeks",
            _svg_chart(dhws, series="dhw", days=days, reflines=dhw_refs, fill=True),
            '<div class="legend"><span><i style="background:var(--c-dhw)"></i>DHW</span>'
            '<span><i style="background:var(--a-alert1)"></i>Alert 1 (≥4)</span>'
            '<span><i style="background:var(--a-alert2)"></i>Alert 2 (≥8)</span></div>',
        ))
    panels.append(_panel(
        "Turbidity (daily median)", "ADC · uncalibrated",
        _svg_chart(turb, series="turb", days=days, markers=turb_markers),
        '<div class="legend"><span><i style="background:var(--c-turb)"></i>Daily median</span>'
        '<span><i style="background:var(--coral)"></i>Anomaly event</span></div>',
    ))
    panels.append(_panel(
        "Battery (daily minimum)", "V",
        _svg_chart(batt, series="batt", days=days),
        _legend([("batt", "Daily minimum voltage")]),
    ))

    dash_head = (
        '<section class="page-head"><div class="wrap">'
        '<p class="eyebrow">Live telemetry</p>'
        '<h1>Reef telemetry</h1>'
        '<div class="dash-meta" style="margin-top:1rem">'
        f'<span><span class="k">Generated</span> {html.escape(generated)}</span>'
        f'<span><span class="k">Data span</span> {html.escape(span)}</span>'
        f'<span><span class="k">Climatology</span> {html.escape(mmm_line)}</span>'
        "</div></div></section>"
    )

    body = (
        f"{dash_head}"
        '<section class="section"><div class="wrap">'
        f'<div class="cards">{cards}</div>'
        f'<div class="panels">{"".join(panels)}</div>'
        '<p class="data-links">Raw data · '
        '<a href="telemetry_daily.csv">daily CSV</a> · '
        '<a href="telemetry_summary.json">summary JSON</a> · '
        '<a href="../science/">how these metrics are computed</a></p>'
        '<p class="data-links" style="color:var(--faint)">Thermal stress is computed with NOAA '
        "Coral Reef Watch Degree Heating Weeks. Turbidity is uncalibrated and reported as "
        "relative events, not NTU. This page is regenerated by the shore station from the buoy's "
        "LoRa telemetry.</p>"
        "</div></section>"
    )

    return layout.document(
        title=title,
        description=("Live environmental telemetry from the S.C.O.U.T. reef-monitoring buoy: "
                     "temperature and Degree Heating Weeks, turbidity events, and battery health."),
        active="analytics",
        body=body,
        base=base,
        banner=banner,
        generated=generated,
        fonts_present=fonts_present,
        external=False,
    )


def write_site(
    report: TelemetryReport,
    out_dir: str | Path,
    *,
    title: str = "Live Telemetry · S.C.O.U.T.",
    generated_at: datetime | None = None,
    banner: str | None = None,
    base: str = "../",
    fonts_present: bool = False,
) -> Path:
    """Write ``index.html`` plus the raw daily CSV and summary JSON (for download links)."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    write_daily_csv(report, out_dir / "telemetry_daily.csv")
    write_summary_json(report, out_dir / "telemetry_summary.json")
    index = out_dir / "index.html"
    index.write_text(render_html(report, title=title, generated_at=generated_at, banner=banner,
                                 base=base, fonts_present=fonts_present))
    return index
