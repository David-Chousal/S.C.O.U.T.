"""Multi-panel telemetry dashboard (temperature + DHW, turbidity, battery).

Optional: needs ``matplotlib``. The rest of the pipeline runs without it — this import only
happens when a dashboard is explicitly requested. Style follows the acoustic pipeline's
``visualize.py`` (Agg backend, shared colour palette).
"""

from __future__ import annotations

from pathlib import Path

from . import bleaching
from .pipeline import TelemetryReport

# Shared palette with the alert scale.
_ALERT_COLORS = {
    bleaching.ALERT_NO_STRESS: "#2ecc71",
    bleaching.ALERT_WATCH: "#f1c40f",
    bleaching.ALERT_WARNING: "#e67e22",
    bleaching.ALERT_LEVEL_1: "#e74c3c",
    bleaching.ALERT_LEVEL_2: "#8e44ad",
}


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

    daily = report.daily
    days = [d.day for d in daily]
    fig, axes = plt.subplots(3, 1, figsize=(12, 11), sharex=True)
    fig.suptitle("SCOUT telemetry — thermal stress, turbidity, power", fontsize=14, weight="bold")

    # Panel 1 — daily mean temperature with MMM / bleaching threshold, DHW on a twin axis.
    ax = axes[0]
    temps = [d.temp_mean for d in daily]
    ax.plot(days, temps, color="#c0392b", marker=".", lw=1.2, label="Daily mean SST")
    if report.mmm is not None:
        ax.axhline(report.mmm, color="#7f8c8d", ls="--", lw=1, label="MMM")
        ax.axhline(bleaching.bleaching_threshold(report.mmm), color="#e74c3c", ls=":", lw=1,
                   label="Bleaching threshold (MMM+1)")
    ax.set_ylabel("Temperature (°C)")
    ax.legend(loc="upper left", fontsize=8)

    if report.thermal:
        ax2 = ax.twinx()
        thermal_by_day = {t.day: t.dhw for t in report.thermal}
        ax2.fill_between(days, [thermal_by_day.get(d, 0.0) for d in days], color="#e74c3c",
                         alpha=0.12)
        ax2.axhline(bleaching.DHW_ALERT_LEVEL_1, color="#e74c3c", ls="--", lw=0.8)
        ax2.axhline(bleaching.DHW_ALERT_LEVEL_2, color="#8e44ad", ls="--", lw=0.8)
        ax2.set_ylabel("DHW (°C-weeks)")

    # Panel 2 — turbidity (uncalibrated ADC) with event markers.
    ax = axes[1]
    turb = [d.turbidity_median_adc for d in daily]
    ax.plot(days, turb, color="#2980b9", marker=".", lw=1.2, label="Daily median turbidity (ADC)")
    event_days = {
        (e.at.date() if hasattr(e.at, "date") else e.at)
        for e in report.turbidity_anomalies.events
    }
    ev_x = [d.day for d in daily if d.day in event_days]
    ev_y = [d.turbidity_median_adc for d in daily if d.day in event_days]
    if ev_x:
        ax.scatter(ev_x, ev_y, color="#e74c3c", zorder=5, label="Anomaly")
    ax.set_ylabel("Turbidity (ADC, uncal.)")
    ax.legend(loc="upper left", fontsize=8)

    # Panel 3 — daily minimum battery voltage.
    ax = axes[2]
    ax.plot(days, [d.battery_min_v for d in daily], color="#27ae60", marker=".", lw=1.2)
    ax.set_ylabel("Battery min (V)")
    ax.set_xlabel("Date (UTC)")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m-%d"))
    fig.autofmt_xdate()

    fig.tight_layout(rect=(0, 0, 1, 0.97))
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=130)
    plt.close(fig)
    return output_path
