"""Static HTML dashboard generator — a self-contained page for GitHub Pages.

Because the buoy transmits ~once per day, "live" means *republished when new data lands*, not
real-time. The shore Raspberry Pi runs the pipeline on a schedule, calls :func:`write_site`,
and pushes the result; GitHub Pages serves it. See docs/engineering/live-dashboard.md.

The page is fully self-contained: inline CSS and inline SVG charts, **no external scripts,
fonts, or network requests** — so it renders offline, passes any CSP, and needs no JS library.
Standard library only.
"""

from __future__ import annotations

import html
from datetime import date, datetime, timezone
from pathlib import Path

from . import bleaching
from .pipeline import TelemetryReport, write_daily_csv, write_summary_json

_ALERT_COLORS = {
    bleaching.ALERT_NO_STRESS: "#2ecc71",
    bleaching.ALERT_WATCH: "#f1c40f",
    bleaching.ALERT_WARNING: "#e67e22",
    bleaching.ALERT_LEVEL_1: "#e74c3c",
    bleaching.ALERT_LEVEL_2: "#8e44ad",
}
_W, _H = 720, 180
_PAD_L, _PAD_R, _PAD_T, _PAD_B = 44, 12, 12, 24


def _range(values: list[float | None], extra: tuple[float, ...] = ()) -> tuple[float, float]:
    nums = [v for v in values if v is not None] + list(extra)
    if not nums:
        return 0.0, 1.0
    lo, hi = min(nums), max(nums)
    if lo == hi:
        return lo - 1.0, hi + 1.0
    pad = (hi - lo) * 0.08
    return lo - pad, hi + pad


def _svg_chart(
    values: list[float | None],
    *,
    color: str,
    days: list[date],
    reflines: tuple[tuple[float, str, str], ...] = (),
    markers: frozenset[int] = frozenset(),
    fill: bool = False,
) -> str:
    """One responsive SVG line chart. ``values`` aligns index-for-index with ``days``."""
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
    parts: list[str] = [f'<svg viewBox="0 0 {_W} {_H}" class="chart" preserveAspectRatio="none">']
    # y-axis min/max labels
    parts.append(f'<text x="4" y="{y(vmax):.1f}" class="ax">{vmax:.2f}</text>')
    parts.append(f'<text x="4" y="{y(vmin):.1f}" class="ax">{vmin:.2f}</text>')
    # reference lines (MMM, threshold, DHW alert levels …)
    for value, rcolor, label in reflines:
        if vmin <= value <= vmax:
            yy = y(value)
            parts.append(f'<line x1="{_PAD_L}" y1="{yy:.1f}" x2="{_W - _PAD_R}" y2="{yy:.1f}" '
                         f'stroke="{rcolor}" stroke-dasharray="4 3" stroke-width="1" opacity="0.8"/>')
            parts.append(f'<text x="{_W - _PAD_R:.1f}" y="{yy - 3:.1f}" '
                         f'class="ax" text-anchor="end" fill="{rcolor}">{html.escape(label)}</text>')
    # data as polyline segments (break on None gaps)
    segment: list[str] = []
    for i, v in enumerate(values):
        if v is None:
            if len(segment) > 1:
                parts.append(_polyline(segment, color, fill, y(vmin)))
            segment = []
        else:
            segment.append(f"{x(i):.1f},{y(v):.1f}")
    if len(segment) > 1:
        parts.append(_polyline(segment, color, fill, y(vmin)))
    elif len(segment) == 1:
        cx, cy = segment[0].split(",")
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="2.5" fill="{color}"/>')
    # markers (e.g. turbidity events)
    for i in markers:
        if 0 <= i < n and values[i] is not None:
            parts.append(f'<circle cx="{x(i):.1f}" cy="{y(values[i]):.1f}" r="3.2" '
                         'fill="#e74c3c" stroke="#fff" stroke-width="0.8"/>')
    # x-axis date labels
    if days:
        parts.append(f'<text x="{_PAD_L}" y="{_H - 6}" class="ax">{days[0].isoformat()}</text>')
        parts.append(f'<text x="{_W - _PAD_R}" y="{_H - 6}" class="ax" '
                     f'text-anchor="end">{days[-1].isoformat()}</text>')
    parts.append("</svg>")
    return "".join(parts)


def _polyline(points: list[str], color: str, fill: bool, baseline_y: float) -> str:
    line = (f'<polyline points="{" ".join(points)}" fill="none" stroke="{color}" '
            'stroke-width="1.8" stroke-linejoin="round"/>')
    if not fill:
        return line
    first_x = points[0].split(",")[0]
    last_x = points[-1].split(",")[0]
    area = (f'<polygon points="{first_x},{baseline_y:.1f} {" ".join(points)} '
            f'{last_x},{baseline_y:.1f}" fill="{color}" opacity="0.12"/>')
    return area + line


def _card(label: str, value: str, *, color: str | None = None) -> str:
    style = f' style="color:{color}"' if color else ""
    return (f'<div class="card"><div class="card-label">{html.escape(label)}</div>'
            f'<div class="card-value"{style}>{html.escape(value)}</div></div>')


def render_html(
    report: TelemetryReport,
    *,
    title: str = "S.C.O.U.T. — Live Telemetry",
    generated_at: datetime | None = None,
    banner: str | None = None,
) -> str:
    """Render the full self-contained dashboard HTML document.

    ``banner`` renders a prominent notice above the header — use it to label sample/simulated
    or stale data so a public page can't be mistaken for a live deployment.
    """
    generated_at = generated_at or datetime.now(timezone.utc)
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

    # Status cards
    cards = [
        _card("Current alert", latest_alert, color=_ALERT_COLORS.get(latest_alert)),
        _card("Peak DHW", f"{ts.peak_dhw:g} °C-wk" if ts else "—"),
        _card("Peak alert", ts.peak_alert if ts else "—",
              color=_ALERT_COLORS.get(ts.peak_alert) if ts else None),
        _card("Temp trend", f"{tt.label} ({tt.slope_per_year:g} °C/yr)"
              if tt.slope_per_year is not None else tt.label),
        _card("Turbidity events", str(len(report.turbidity_anomalies.events))),
        _card("Data completeness", f"{report.qc.completeness_pct:g}%"),
        _card("Latest battery", f"{latest_batt:g} V" if latest_batt is not None else "—"),
    ]

    # Temperature reference lines
    temp_refs: tuple[tuple[float, str, str], ...] = ()
    if report.mmm is not None:
        temp_refs = (
            (report.mmm, "#7f8c8d", "MMM"),
            (bleaching.bleaching_threshold(report.mmm), "#e74c3c", "threshold"),
        )
    dhw_refs = (
        (bleaching.DHW_ALERT_LEVEL_1, "#e74c3c", "Alert 1"),
        (bleaching.DHW_ALERT_LEVEL_2, "#8e44ad", "Alert 2"),
    )

    span = (f"{report.qc.first:%Y-%m-%d %H:%M} → {report.qc.last:%Y-%m-%d %H:%M} UTC"
            if report.qc.first and report.qc.last else "no data")
    panels = [("Daily mean temperature (°C)", _svg_chart(temps, color="#c0392b", days=days, reflines=temp_refs))]
    if report.thermal:
        panels.append(("Degree Heating Weeks (°C-weeks)",
                       _svg_chart(dhws, color="#e67e22", days=days, reflines=dhw_refs, fill=True)))
    panels.append(("Turbidity — daily median (ADC, uncalibrated)",
                   _svg_chart(turb, color="#2980b9", days=days, markers=turb_markers)))
    panels.append(("Battery — daily minimum (V)", _svg_chart(batt, color="#27ae60", days=days)))

    panels_html = "".join(
        f'<section class="panel"><h2>{html.escape(t)}</h2>{svg}</section>' for t, svg in panels
    )

    banner_html = f'<div class="banner">{html.escape(banner)}</div>' if banner else ""
    return _PAGE_TEMPLATE.format(
        title=html.escape(title),
        banner=banner_html,
        generated=generated_at.strftime("%Y-%m-%d %H:%M UTC"),
        span=html.escape(span),
        cards="".join(cards),
        panels=panels_html,
        mmm=("MMM %.2f °C" % report.mmm) if report.mmm is not None else "no MMM set — DHW disabled",
    )


def write_site(
    report: TelemetryReport,
    out_dir: str | Path,
    *,
    title: str = "S.C.O.U.T. — Live Telemetry",
    generated_at: datetime | None = None,
    banner: str | None = None,
) -> Path:
    """Write ``index.html`` plus the raw daily CSV and summary JSON (for download links)."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    write_daily_csv(report, out_dir / "telemetry_daily.csv")
    write_summary_json(report, out_dir / "telemetry_summary.json")
    index = out_dir / "index.html"
    index.write_text(render_html(report, title=title, generated_at=generated_at, banner=banner))
    return index


_PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
  :root {{ --bg:#f6f8fa; --panel:#fff; --text:#1b2733; --muted:#5b6b7b; --border:#e1e6eb; }}
  @media (prefers-color-scheme: dark) {{
    :root {{ --bg:#0f1620; --panel:#182430; --text:#e6edf3; --muted:#9fb0c0; --border:#243447; }}
  }}
  * {{ box-sizing: border-box; }}
  body {{ margin:0; background:var(--bg); color:var(--text);
    font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }}
  header {{ padding:24px 20px 8px; max-width:900px; margin:0 auto; }}
  h1 {{ margin:0 0 4px; font-size:1.5rem; }}
  .meta {{ color:var(--muted); font-size:.85rem; }}
  main {{ max-width:900px; margin:0 auto; padding:12px 20px 40px; }}
  .cards {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin:16px 0 22px; }}
  .card {{ background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:12px 14px; }}
  .card-label {{ color:var(--muted); font-size:.72rem; text-transform:uppercase; letter-spacing:.04em; }}
  .card-value {{ font-size:1.15rem; font-weight:600; margin-top:2px; }}
  .panel {{ background:var(--panel); border:1px solid var(--border); border-radius:10px;
    padding:14px 16px; margin-bottom:16px; overflow:hidden; }}
  .panel h2 {{ margin:0 0 8px; font-size:.95rem; font-weight:600; color:var(--muted); }}
  .chart {{ width:100%; height:auto; display:block; }}
  .chart .ax {{ fill:var(--muted); font-size:9px; }}
  footer {{ max-width:900px; margin:0 auto; padding:0 20px 40px; color:var(--muted); font-size:.8rem; }}
  a {{ color:#2980b9; }}
  .banner {{ max-width:900px; margin:16px auto 0; padding:10px 14px; border-radius:8px;
    background:#fff4e5; color:#7a4b00; border:1px solid #f0c987; font-size:.85rem; font-weight:600; }}
  @media (prefers-color-scheme: dark) {{
    .banner {{ background:#3a2a10; color:#f3c98b; border-color:#6b4e1e; }}
  }}
</style>
</head>
<body>
{banner}
<header>
  <h1>{title}</h1>
  <div class="meta">Generated {generated} · data span {span} · {mmm}</div>
</header>
<main>
  <div class="cards">{cards}</div>
  {panels}
  <p class="meta">Raw data: <a href="telemetry_daily.csv">daily CSV</a> ·
  <a href="telemetry_summary.json">summary JSON</a></p>
</main>
<footer>
  Thermal stress via NOAA Coral Reef Watch Degree Heating Weeks. Turbidity is uncalibrated
  (relative events, not NTU). Regenerated by the shore station from the buoy's LoRa telemetry.
  Methodology: docs/analysis/telemetry-methodology.md.
</footer>
</body>
</html>
"""
