"""Honest telemetry charts for the dashboard and Fleet pages (docs/engineering/design-system-data-viz.md).

- The x-axis is the calendar: a day with no packets keeps its place instead of vanishing.
- Every measured day gets a point; lines break at missing days, which are drawn as hatched bands.
- A single missing day between two measured days is bridged by a dashed line labelled
  "Estimated". Longer gaps are never bridged: that is when a guess is most likely to be wrong,
  and the buoy's on-board record will fill them with real values once retrieved.
- The SVG holds geometry only and stretches to the panel; every label is HTML at real pixels.
- The plot is an image with a one-sentence summary; the same values sit in a table beneath.

Standard library only. Colours come from CSS classes (``s-<series>``) styled by the theme.
"""

from __future__ import annotations

import html
from dataclasses import dataclass
from datetime import date, timedelta

_VW, _VH = 1000, 300   # SVG user space; geometry only, stretched to the panel
_INSET = 2.0           # % kept clear at each end so edge points are not clipped
_LABEL_MIN_PCT = 12.0  # a gap narrower than this carries no "no data" label (it would clip)


@dataclass(frozen=True)
class Band:
    lo: float
    hi: float | None
    level: str          # alert token key: "alert1", "alert2", …
    label: str


# NOAA CRW Alert Levels 1 and 2 — the levels bleaching.py computes. Levels 3–5 (NOAA, 2023) are
# deliberately not drawn until the pipeline adopts them (docs/hub/research/open-questions.md).
DHW_BANDS = (Band(4.0, 8.0, "alert1", "Alert Level 1"), Band(8.0, None, "alert2", "Alert Level 2"))
_DIGITS = {"temp": 1, "dhw": 1, "turb": 0, "batt": 2}
_SERIES_LABEL = {"temp": "Daily mean", "dhw": "DHW", "turb": "Daily median", "batt": "Daily minimum"}


def _calendar(points: list[tuple[date, float | None]]) -> list[tuple[date, float | None, bool]]:
    """Fill ``points`` to every calendar day: (day, value, had a row that day)."""
    if not points:
        return []
    by_day = dict(points)
    first, last = min(by_day), max(by_day)
    out, day = [], first
    while day <= last:
        out.append((day, by_day.get(day), day in by_day))
        day += timedelta(days=1)
    return out


def _range(values: list[float], extra: tuple[float, ...]) -> tuple[float, float]:
    nums = values + list(extra)
    if not nums:
        return 0.0, 1.0
    lo, hi = min(nums), max(nums)
    if lo == hi:
        return lo - 1.0, hi + 1.0
    pad = (hi - lo) * 0.1
    return lo - pad, hi + pad


def _gap_runs(cal) -> list[tuple[int, int]]:
    runs, start = [], None
    for i, (_, v, _) in enumerate(cal):
        if v is None and start is None:
            start = i
        if v is not None and start is not None:
            runs.append((start, i - 1))
            start = None
    if start is not None:
        runs.append((start, len(cal) - 1))
    return runs


class _Frame:
    """Maps calendar index and value to percent (labels) and user units (SVG)."""

    def __init__(self, n: int, lo: float, hi: float):
        self.n, self.lo, self.hi = n, lo, hi

    def xp(self, i: float) -> float:
        frac = 0.5 if self.n <= 1 else i / (self.n - 1)
        return _INSET + frac * (100 - 2 * _INSET)

    def yp(self, v: float) -> float:
        return (1 - (v - self.lo) / (self.hi - self.lo)) * 100

    def x(self, i: float) -> float:
        return self.xp(i) * _VW / 100

    def y(self, v: float) -> float:
        return self.yp(v) * _VH / 100


def _fmt(v: float, series: str) -> str:
    return f"{v:.{_DIGITS.get(series, 1)}f}"


def _geometry(cal, f: _Frame, series: str, events: frozenset[date], estimates: list) -> str:
    parts: list[str] = []
    segment: list[str] = []
    for i, (_, v, _) in enumerate(cal):
        if v is None:
            if len(segment) > 1:
                parts.append(f'<polyline class="line s-{series}" points="{" ".join(segment)}"/>')
            segment = []
            continue
        segment.append(f"{f.x(i):.1f},{f.y(v):.1f}")
    if len(segment) > 1:
        parts.append(f'<polyline class="line s-{series}" points="{" ".join(segment)}"/>')
    for a, b in estimates:
        (va, vb) = cal[a][1], cal[b][1]
        parts.append(f'<line class="est s-{series}" x1="{f.x(a):.1f}" y1="{f.y(va):.1f}" '
                     f'x2="{f.x(b):.1f}" y2="{f.y(vb):.1f}"/>')
    for i, (day, v, _) in enumerate(cal):
        if v is None:
            continue
        cls = "ev" if day in events else f"pt s-{series}"
        parts.append(f'<path class="{cls}" d="M{f.x(i):.1f} {f.y(v):.1f}h0"/>')
    return "".join(parts)


def _summary(title: str, unit: str, cal, measured: list[float], series: str) -> str:
    n, gaps = len(cal), sum(1 for _, v, _ in cal if v is None)
    if not measured:
        return f"{title}: no measured values."
    span = f"{cal[0][0].isoformat()} to {cal[-1][0].isoformat()}"
    rng = f"{_fmt(min(measured), series)} to {_fmt(max(measured), series)} {unit}"
    gap_txt = "no days without data" if gaps == 0 else (
        f"{gaps} day{'s' if gaps != 1 else ''} without data")
    return f"{title}: {n} days from {span}, measured values from {rng}; {gap_txt}."


def _table(cal, series: str, unit: str, reasons: dict[date, str]) -> str:
    rows = []
    for day, v, had_row in cal:
        if v is not None:
            value, status = _fmt(v, series), "measured"
        else:
            value = "–"
            status = reasons.get(day) or ("no value" if had_row else "no packets")
        rows.append(f'<tr><td class="mono">{day.isoformat()}</td><td class="num">{value}</td>'
                    f"<td>{html.escape(status)}</td></tr>")
    return (
        '<details class="viewdata"><summary>View data</summary>'
        '<div class="table-scroll" role="region" aria-label="Chart values" tabindex="0">'
        '<table class="data"><thead><tr><th>Date (UTC)</th>'
        f'<th class="num">{html.escape(unit)}</th><th>Status</th></tr></thead>'
        f'<tbody>{"".join(rows)}</tbody></table></div></details>'
    )


def chart(
    points: list[tuple[date, float | None]],
    *,
    series: str,
    title: str,
    unit: str,
    reflines: tuple[tuple[float, str, str], ...] = (),   # (value, css suffix, label)
    bands: tuple[Band, ...] = (),
    events: frozenset[date] = frozenset(),
    missing_reasons: dict[date, str] | None = None,
    legend_extra: str = "",
) -> str:
    """One chart: plot, axis labels, legend and data table, as an HTML fragment."""
    cal = _calendar(points)
    measured = [v for _, v, _ in cal if v is not None]
    if not measured:
        return f'<p class="chart-empty">{html.escape(title)}: no packets yet.</p>'
    lo, hi = _range(measured, tuple(r[0] for r in reflines))
    f = _Frame(len(cal), lo, hi)
    runs = _gap_runs(cal)
    estimates = [(a - 1, b + 1) for a, b in runs
                 if a == b and a > 0 and b < len(cal) - 1]

    svg = [f'<svg class="chart-svg" viewBox="0 0 {_VW} {_VH}" preserveAspectRatio="none" '
           'aria-hidden="true" focusable="false">']
    peak = max(measured)
    reached = [b for b in bands if peak >= b.lo]   # a band appears only once the data gets there
    for band in reached:
        top = hi if band.hi is None else min(band.hi, hi)
        if top > lo:
            y0, y1 = f.y(top), f.y(max(band.lo, lo))
            svg.append(f'<rect class="band band-{band.level}" x="0" y="{y0:.1f}" '
                       f'width="{_VW}" height="{y1 - y0:.1f}"/>')
    svg.append(f'<line class="grid" x1="0" y1="{f.y(lo):.1f}" x2="{_VW}" y2="{f.y(lo):.1f}"/>')
    for value, suffix, _ in reflines:
        if lo <= value <= hi:
            svg.append(f'<line class="rl rl-{suffix}" x1="0" y1="{f.y(value):.1f}" '
                       f'x2="{_VW}" y2="{f.y(value):.1f}"/>')
    svg.append(_geometry(cal, f, series, events, estimates))
    svg.append("</svg>")

    extremes = dict.fromkeys(_fmt(v, series) for v in (max(measured), min(measured)))
    labels = [f'<span class="ax ax-y" style="--y:{f.yp(float(t)):.2f}%">{t}</span>'
              for t in extremes]
    labels += [f'<span class="ax ax-ref tx-{suffix}" style="--y:{f.yp(value):.2f}%">'
               f"{html.escape(label)}</span>"
               for value, suffix, label in reflines if lo <= value <= hi]
    gaps = [f'<span class="gap" style="--x0:{f.xp(a - 0.5):.2f}%;--x1:{f.xp(b + 0.5):.2f}%">'
            f'{"<b>no data</b>" if f.xp(b + 0.5) - f.xp(a - 0.5) >= _LABEL_MIN_PCT else ""}'
            "</span>" for a, b in runs]

    legend = [f'<span><i class="sw sw-{series}"></i>{_SERIES_LABEL.get(series, title)}</span>']
    if estimates:
        legend.append('<span><i class="sw sw-est"></i>Estimated (one missing day)</span>')
    if runs:
        legend.append('<span><i class="sw sw-gap"></i>No data</span>')
    legend += [f'<span><i class="sw sw-{b.level}"></i>{html.escape(b.label)}</span>'
               for b in reached]

    summary = _summary(title, unit, cal, measured, series)
    return (
        '<div class="chart-frame">'
        f'<div class="chart-plot" role="img" aria-label="{html.escape(summary)}">'
        f'{"".join(gaps)}{"".join(svg)}<div aria-hidden="true">{"".join(labels)}</div></div>'
        f'<div class="ax-x" aria-hidden="true"><span>{cal[0][0].isoformat()}</span>'
        f"<span>{cal[-1][0].isoformat()}</span></div>"
        f'<div class="legend">{"".join(legend)}{legend_extra}</div>'
        f"{_table(cal, series, unit, missing_reasons or {})}</div>"
    )


def sparkline(points: list[tuple[date, float | None]], *, mmm: float | None) -> str:
    """A compact shape: calendar-true, broken at gaps, the latest reading marked. No axes."""
    cal = _calendar(points)
    measured = [v for _, v, _ in cal if v is not None]
    if not measured:
        return '<div class="spark spark-empty" aria-hidden="true"></div>'
    lo, hi = _range(measured, (mmm,) if mmm is not None else ())
    f = _Frame(len(cal), lo, hi)
    parts = [f'<svg class="chart-svg" viewBox="0 0 {_VW} {_VH}" preserveAspectRatio="none" '
             'aria-hidden="true" focusable="false">']
    if mmm is not None:
        parts.append(f'<line class="rl rl-mmm" x1="0" y1="{f.y(mmm):.1f}" '
                     f'x2="{_VW}" y2="{f.y(mmm):.1f}"/>')
    parts.append(_geometry(cal, f, "temp", frozenset(), []).replace('class="pt s-temp"',
                                                                    'class="pt-dot s-temp"'))
    last_i = max(i for i, (_, v, _) in enumerate(cal) if v is not None)
    parts.append(f'<path class="pt-last s-temp" d="M{f.x(last_i):.1f} '
                 f'{f.y(cal[last_i][1]):.1f}h0"/></svg>')
    gaps = sum(1 for _, v, _ in cal if v is None)
    label = (f"Daily mean temperature, {len(cal)} days, latest {_fmt(cal[last_i][1], 'temp')} °C"
             f"{f', {gaps} days without data' if gaps else ''}")
    return f'<div class="spark" role="img" aria-label="{html.escape(label)}">{"".join(parts)}</div>'


def slot_rule(history: list, *, label: str) -> str:
    """The signature: one tick per transmit slot — filled received, hollow missed, faint not due."""
    if not history:
        return ""
    n = len(history)
    ticks = []
    for i, (_, state) in enumerate(history):
        cls = "due" if state is None else ("got" if state else "miss")
        x = (i + 0.5) / n * _VW
        ticks.append(f'<rect class="tick {cls}" x="{x - 3:.1f}" y="6" width="6" height="28"/>')
    got = sum(1 for _, s in history if s)
    due = sum(1 for _, s in history if s is not None)
    days = n // 3
    return (
        f'<div class="slot-rule" role="img" aria-label="{html.escape(label)}: {got} of {due} '
        f'transmit slots received in the last {days} days">'
        f'<svg viewBox="0 0 {_VW} 40" preserveAspectRatio="none" aria-hidden="true" '
        f'focusable="false"><line class="base" x1="0" y1="20" x2="{_VW}" y2="20"/>'
        f'{"".join(ticks)}</svg></div>'
    )
