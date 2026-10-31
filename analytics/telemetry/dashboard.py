"""Multi-panel telemetry dashboard (temperature + DHW, turbidity, battery, reef sound) as a PNG.

Optional: needs ``matplotlib``. The rest of the pipeline runs without it — this import only
happens when a dashboard is explicitly requested. Colours come from the site's design tokens and
missing calendar days are NaN: lines break at gaps rather than being drawn across them
(docs/engineering/design-system-data-viz.md).
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

from . import bleaching
from .pipeline import TelemetryReport
from .site.theme import tokens


@dataclass(frozen=True)
class Band:
    lo: float
    hi: float | None
    level: str          # alert token key: "alert1", "alert2", …


# NOAA CRW Alert Levels 1–5 (the 2023 scale bleaching.py computes), one band per DHW range.
DHW_BANDS = (
    Band(4.0, 8.0, "alert1"),
    Band(8.0, 12.0, "alert2"),
    Band(12.0, 16.0, "alert3"),
    Band(16.0, 20.0, "alert4"),
    Band(20.0, None, "alert5"),
)

PALETTE = {
    "canvas": tokens.hex_of("color-canvas"),
    "ink": tokens.hex_of("color-text"),
    "subtle": tokens.hex_of("color-text-subtle"),
    "line": tokens.hex_of("color-line-strong"),
    "temp": tokens.DATA["data-temp"],
    "turb": tokens.DATA["data-turb"],
    "batt": tokens.DATA["data-instrument"],
    "dhw": tokens.hex_of("color-text"),
    "threshold": tokens.ALERTS["alert1"][0],
    "alert1": tokens.ALERTS["alert1"][0],
    "alert2": tokens.ALERTS["alert2"][0],
    "alert3": tokens.ALERTS["alert3"][0],
    "alert4": tokens.ALERTS["alert4"][0],
    "alert5": tokens.ALERTS["alert5"][0],
    "event": tokens.STATUS["warning"],
    "ndsi": tokens.CATEGORICAL[0],   # acoustic series: categorical hues (design-system-data-viz.md)
    "snaps": tokens.CATEGORICAL[2],
}


def dhw_band_spans(peak: float) -> list[tuple[float, float, str]]:
    """The alert bands the PNG shades, from ``DHW_BANDS``.

    A band is drawn only once DHW reaches it — an empty alert band would read as an alert that
    never happened — and the highest one reached stops at the peak rather than running on.
    """
    return [(band.lo, peak if band.hi is None else min(band.hi, peak), band.level)
            for band in DHW_BANDS if peak >= band.lo]


def calendar_series(points: list[tuple[date, float | None]]) -> tuple[list[date], list[float]]:
    """Every calendar day from first to last, with NaN where there is no value."""
    if not points:
        return [], []
    by_day = dict(points)
    first, last = min(by_day), max(by_day)
    days, values, day = [], [], first
    while day <= last:
        v = by_day.get(day)
        days.append(day)
        values.append(math.nan if v is None else v)
        day += timedelta(days=1)
    return days, values


def plot_dashboard(report: TelemetryReport, output_path: str | Path) -> Path:
    """Render the dashboard to ``output_path`` (PNG). Raises ImportError if matplotlib absent."""
    try:
        import matplotlib

        matplotlib.use("Agg")  # non-interactive, safe in scripts
        import matplotlib.dates as mdates
        import matplotlib.pyplot as plt
    except ImportError as exc:  # pragma: no cover - depends on environment
        raise ImportError(
            "The dashboard needs matplotlib. Install it (pip install matplotlib) or omit --dashboard."
        ) from exc

    p = PALETTE
    style = {"axes.facecolor": p["canvas"], "figure.facecolor": p["canvas"],
             "axes.edgecolor": p["line"], "text.color": p["ink"], "axes.labelcolor": p["ink"],
             "xtick.color": p["subtle"], "ytick.color": p["subtle"]}
    with plt.rc_context(style):  # scoped: never changes matplotlib's global settings
        return _draw(plt, mdates, report, Path(output_path))


def _draw(plt, mdates, report: TelemetryReport, output_path: Path) -> Path:
    p = PALETTE
    daily = report.daily
    rows = 4 if report.acoustic else 3
    fig, axes = plt.subplots(rows, 1, figsize=(12, 3.6 * rows + 0.2), sharex=True)
    fig.suptitle("SCOUT telemetry — thermal stress, turbidity, power"
                 + (", reef sound" if report.acoustic else ""), fontsize=14, weight="bold")

    # Panel 1 — daily mean temperature with MMM / bleaching threshold, DHW on a twin axis.
    ax = axes[0]
    days, temps = calendar_series([(d.day, d.temp_mean) for d in daily])
    ax.plot(days, temps, color=p["temp"], marker=".", lw=1.6, label="Daily mean SST")
    if report.mmm is not None:
        ax.axhline(report.mmm, color=p["line"], ls="--", lw=1, label="MMM")
        ax.axhline(bleaching.bleaching_threshold(report.mmm), color=p["threshold"], ls=":", lw=1,
                   label="Bleaching threshold (MMM+1)")
    ax.set_ylabel("Temperature (°C)")
    ax.legend(loc="upper left", fontsize=8)

    if report.thermal:
        ax2 = ax.twinx()
        t_days, dhw = calendar_series([(t.day, t.dhw) for t in report.thermal])
        ax2.plot(t_days, dhw, color=p["dhw"], lw=1.2)
        peak = max((v for v in dhw if not math.isnan(v)), default=0.0)
        for lo, hi, level in dhw_band_spans(peak):
            ax2.axhspan(lo, hi, color=p[level], alpha=0.12)
        ax2.set_ylabel("DHW (°C-weeks)")

    # Panel 2 — turbidity (uncalibrated ADC; higher counts = clearer water) with events.
    ax = axes[1]
    days, turb = calendar_series([(d.day, d.turbidity_median_adc) for d in daily])
    ax.plot(days, turb, color=p["turb"], marker=".", lw=1.6,
            label="Daily median (ADC, higher = clearer)")
    event_days = {
        (e.at.date() if hasattr(e.at, "date") else e.at)
        for e in report.turbidity_anomalies.events
    }
    ev = [(d.day, d.turbidity_median_adc) for d in daily if d.day in event_days]
    if ev:
        ax.scatter([e[0] for e in ev], [e[1] for e in ev], color=p["event"], zorder=5,
                   label="Anomaly")
    ax.set_ylabel("Turbidity (ADC, uncal.)")
    ax.legend(loc="upper left", fontsize=8)

    # Panel 3 — daily minimum battery voltage (instrument health: neutral, dashed).
    ax = axes[2]
    days, batt = calendar_series([(d.day, d.battery_min_v) for d in daily])
    ax.plot(days, batt, color=p["batt"], marker=".", lw=1.2, ls="--")
    ax.set_ylabel("Battery min (V)")
    if report.acoustic:
        _acoustic_panel(axes[3], report.acoustic)
    ax = axes[-1]
    ax.set_xlabel("Date (UTC)")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m-%d"))
    fig.autofmt_xdate()

    fig.tight_layout(rect=(0, 0, 1, 0.97))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=130)
    plt.close(fig)
    return output_path


def _acoustic_panel(ax, acoustic) -> None:
    """Panel 4 — reef sound (ADR-0010): daily buoy NDSI, snaps per recording, clipping marked."""
    p = PALETTE
    days, ndsi = calendar_series(list(acoustic.ndsi_daily))
    ax.plot(days, ndsi, color=p["ndsi"], marker=".", lw=1.6, label="Daily mean buoy NDSI")
    ax.set_ylim(-1.05, 1.05)
    ax.set_ylabel("NDSI (buoy)")
    ax2 = ax.twinx()
    recs = acoustic.recordings
    ax2.scatter([r.at.date() for r in recs], [r.snaps for r in recs], s=10, color=p["snaps"],
                label="Snaps per recording")
    clipped = [r for r in recs if r.clipping]
    if clipped:
        ax2.scatter([r.at.date() for r in clipped], [r.snaps for r in clipped], s=40,
                    facecolors="none", edgecolors=p["event"], label="Clipping")
    ax2.set_ylabel("Snaps / recording")
    handles = ax.get_legend_handles_labels()
    extra = ax2.get_legend_handles_labels()
    ax.legend(handles[0] + extra[0], handles[1] + extra[1], loc="lower left", fontsize=8)

