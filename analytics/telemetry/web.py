"""Analytics dashboard generator — the data-driven page of the S.C.O.U.T. site.

The buoy transmits in three fixed slots a day, so "live" means *republished when new data
lands*, not real-time; the page says how fresh the data is against that schedule. The shore Raspberry Pi runs the pipeline on a schedule, calls :func:`write_site`,
and pushes the result; GitHub Pages serves it. See docs/engineering/live-dashboard.md.

The page is rendered through the shared site design system (:mod:`telemetry.site`) so it reads
as one surface with the rest of the site. Its data content is entirely inline (inline CSS and
inline SVG charts) and it **loads nothing cross-origin**: no CDN, no third-party, every
resource (fonts, animations, data) same-origin. The header GitHub icon is an external
*hyperlink* — a user navigation, not a loaded resource — so it is present here as on every
page; ``tests/test_web.py`` enforces the real invariant (no cross-origin resource loads) rather
than banning outbound links. Like the rest of the site it loads small same-origin scripts (scroll
reveals, the chat widget), so it is not script-free. Chart colours are CSS design tokens.
Standard library only (on the Python side).
"""

from __future__ import annotations

import html
from datetime import date, datetime, timezone
from pathlib import Path

from . import bleaching, charts, drift, freshness
from .aggregate import SAMPLES_PER_DAY
from .pipeline import TelemetryReport, write_daily_csv, write_summary_json
from .site import layout

# Bleaching alert → CSS class (colour lives in the design tokens, theme-aware).
_ALERT_CLASS = {
    bleaching.ALERT_NO_STRESS: "a-nostress",
    bleaching.ALERT_WATCH: "a-watch",
    bleaching.ALERT_WARNING: "a-warning",
    bleaching.ALERT_LEVEL_1: "a-alert1",
    bleaching.ALERT_LEVEL_2: "a-alert2",
    bleaching.ALERT_LEVEL_3: "a-alert3",
    bleaching.ALERT_LEVEL_4: "a-alert4",
    bleaching.ALERT_LEVEL_5: "a-alert5",
}
# Biofouling verdict → the same severity palette. Distinct labels keep the two readable as
# different things: a bleaching alert is about the reef, a drift verdict about the instrument.
# "insufficient data" stays unstyled on purpose — an absence of evidence is not a warning.
_DRIFT_CLASS = {
    drift.DRIFT_NONE: "a-nostress",
    drift.DRIFT_SUSPECT: "a-warning",
    drift.DRIFT_LIKELY: "a-alert1",
}
def _stat(label: str, value: str, *, cls: str = "", sub: str | None = None) -> str:
    sub_html = f'<p class="stat-sub">{html.escape(sub)}</p>' if sub else ""
    return (
        '<div class="stat">'
        f'<p class="stat-label">{html.escape(label)}</p>'
        f'<p class="stat-value {cls}">{html.escape(value)}</p>{sub_html}</div>'
    )


_STATUS_GLYPH = {
    "live": '<circle cx="6" cy="6" r="4.5"/>',
    "stale": '<circle cx="6" cy="6" r="4" class="ring"/><path d="M6 2a4 4 0 0 1 0 8z"/>',
    "offline": '<circle cx="6" cy="6" r="4" class="ring"/>',
    "fault": '<path d="M6 1.5 11 10.5H1z"/>',
}
_STATUS_LABEL = {"live": "Live", "stale": "Stale", "offline": "Offline", "fault": "Fault"}


def status_line(f: freshness.Freshness) -> str:
    """Glyph + label + one sentence; the colour is on the glyph, the words stay readable."""
    return (
        f'<span class="status status-{f.status}"><svg viewBox="0 0 12 12" aria-hidden="true">'
        f"{_STATUS_GLYPH[f.status]}</svg>{_STATUS_LABEL[f.status]}</span> "
        f'<span class="status-text">{html.escape(freshness.describe(f))}</span>'
    )


def _points(daily, attr: str) -> list:
    return [(d.day, getattr(d, attr)) for d in daily]


def _panel(title: str, unit: str, chart: str, note: str = "") -> str:
    return (
        '<section class="panel reveal"><div class="panel-head">'
        f'<h3>{html.escape(title)}</h3><span class="unit">{html.escape(unit)}</span></div>'
        f"{chart}{note}</section>"
    )


def _drift_note(drift) -> str:
    """The biofouling verdict, rendered where someone is already reading turbidity.

    A fouled sensor drifts monotonically and looks exactly like genuinely worsening water, so
    the verdict belongs next to the turbidity chart rather than filed away in the summary JSON
    — a reader drawing conclusions from that chart is precisely who needs the caveat.
    """
    cls = _DRIFT_CLASS.get(drift.verdict, "")
    return (
        '<p class="panel-note">'
        f'<span class="pn-verdict {cls}">Sensor drift: {html.escape(drift.verdict)}</span> — '
        f"{html.escape(drift.rationale)} {html.escape(drift.note)}</p>"
    )


def _cards(report: TelemetryReport) -> str:
    ts, tt = report.thermal_summary, report.temp_trend
    latest_alert = report.thermal[-1].alert if report.thermal else "n/a"
    latest_batt = next((d.battery_min_v for d in reversed(report.daily)
                        if d.battery_min_v is not None), None)
    return "".join([
        _stat("Current alert", latest_alert, cls=_ALERT_CLASS.get(latest_alert, "")),
        _stat("Peak DHW", f"{ts.peak_dhw:g} °C-wk" if ts else "—"),
        _stat("Peak alert", ts.peak_alert if ts else "—",
              cls=_ALERT_CLASS.get(ts.peak_alert, "") if ts else ""),
        _stat("Temp trend",
              f"{tt.slope_per_year:g} °C/yr" if tt.slope_per_year is not None else "—",
              sub=tt.label),
        _stat("Turbidity events", str(len(report.turbidity_anomalies.events))),
        _stat("Sensor drift", report.turbidity_drift.verdict,
              cls=_DRIFT_CLASS.get(report.turbidity_drift.verdict, ""),
              sub=f"biofouling screen · {report.turbidity_drift.n_days} d"),
        _stat("Data completeness", f"{report.qc.completeness_pct:g}%"),
        # Only shown when it happens. A row whose clock the buoy could not trust is excluded
        # from every time-based figure above, so the reader needs to know it existed.
        (_stat("Clock-invalid rows", str(report.qc.clock_invalid), cls="a-warning",
               sub="excluded from timing") if report.qc.clock_invalid else ""),
        _stat("Latest battery", f"{latest_batt:g} V" if latest_batt is not None else "—"),
    ])


def _low_coverage(daily) -> dict:
    """Why a day that had rows still has no daily mean: it fell below the coverage floor."""
    return {d.day: f"too few samples ({d.temp_n} of {SAMPLES_PER_DAY})"
            for d in daily if d.temp_mean is None and d.n_samples}


def _panels(report: TelemetryReport) -> list[str]:
    daily = report.daily
    events = frozenset(e.at.date() if hasattr(e.at, "date") else e.at
                       for e in report.turbidity_anomalies.events)
    temp_refs: tuple[tuple[float, str, str], ...] = ()
    if report.mmm is not None:
        threshold = bleaching.bleaching_threshold(report.mmm)
        temp_refs = ((report.mmm, "mmm", f"MMM {report.mmm:.1f}"),
                     (threshold, "threshold", f"Bleaching threshold {threshold:.1f}"))
    panels = [_panel("Daily mean temperature", "°C", charts.chart(
        _points(daily, "temp_mean"), series="temp", title="Daily mean water temperature",
        unit="°C", reflines=temp_refs, missing_reasons=_low_coverage(daily)))]
    if report.thermal:
        panels.append(_panel("Degree Heating Weeks", "°C-weeks", charts.chart(
            [(t.day, t.dhw) for t in report.thermal], series="dhw", title="Degree Heating Weeks",
            unit="°C-weeks", bands=charts.DHW_BANDS)))
    panels.append(_panel("Turbidity (daily median)", "ADC · uncalibrated", charts.chart(
        _points(daily, "turbidity_median_adc"), series="turb", title="Daily median turbidity",
        unit="ADC counts", events=events,
        # Polarity rides in the legend: it is the one thing a reader can get exactly backwards.
        legend_extra=('<span>Higher counts = clearer water</span>'
                      '<span><i class="sw sw-ev"></i>Anomaly event</span>')),
        note=_drift_note(report.turbidity_drift)))
    panels.append(_panel("Battery (daily minimum)", "V", charts.chart(
        _points(daily, "battery_min_v"), series="batt", title="Daily minimum battery voltage",
        unit="V")))
    return panels


def _head(report: TelemetryReport, generated_at: datetime, published: str) -> str:
    fresh = freshness.assess(report.received[-1] if report.received else None,
                             now=generated_at, faults=report.latest_flags)
    span = (f"{report.qc.first:%Y-%m-%d %H:%M} → {report.qc.last:%Y-%m-%d %H:%M} UTC"
            if report.qc.first and report.qc.last else "no data")
    mmm_line = ("MMM %.2f °C" % report.mmm if report.mmm is not None
                else "no MMM set, DHW disabled")
    history = freshness.slot_history(report.received, now=generated_at)
    return (
        '<section class="page-head"><div class="wrap">'
        '<p class="eyebrow">From the buoy</p>'
        '<h1>Reef telemetry</h1>'
        f'<p class="freshness stack-4">{status_line(fresh)}</p>'
        f'{charts.slot_rule(history, label="Packets")}'
        '<div class="dash-meta stack-4">'
        f'<span><span class="k">Published</span> {html.escape(published)}</span>'
        f'<span><span class="k">Data span</span> {html.escape(span)}</span>'
        f'<span><span class="k">Climatology</span> {html.escape(mmm_line)}</span>'
        "</div></div></section>"
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
    published = generated_at.strftime("%Y-%m-%d %H:%M UTC")
    body = (
        f"{_head(report, generated_at, published)}"
        '<section class="section"><div class="wrap">'
        f'<div class="cards">{_cards(report)}</div>'
        f'<div class="panels">{"".join(_panels(report))}</div>'
        '<p class="data-links">Raw data · '
        '<a href="telemetry_daily.csv">daily CSV</a> · '
        '<a href="telemetry_summary.json">summary JSON</a> · '
        '<a href="../science/">how these metrics are computed</a></p>'
        '<p class="data-links">Each point is one day. The buoy samples every 30 minutes and '
        "keeps the full record on board; this page shows what reached shore by radio, in three "
        "transmit slots a day. A single missing day is bridged with a dashed estimate; longer "
        "gaps stay empty until the on-board record is retrieved. Thermal stress is computed "
        "with NOAA Coral Reef Watch Degree Heating Weeks from measured days only. Turbidity is "
        "uncalibrated and reported as relative events, not NTU.</p>"
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
        generated=published,
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
