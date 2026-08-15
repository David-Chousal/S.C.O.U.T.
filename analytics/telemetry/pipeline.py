"""End-to-end telemetry pipeline: CSV(s) → QC → daily aggregation → thermal stress (DHW) →
trends → turbidity anomalies → a per-day CSV and a JSON summary report.

Standard library only (the optional dashboard adds matplotlib). Runs on the shore CSVs today
and, unchanged, on a bare Raspberry Pi.
"""

from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path

from . import bleaching, turbidity
from .aggregate import DailyAggregate, aggregate_daily, daily_temperature_series
from .drift import DriftAssessment, assess_drift
from .io import load_csv, load_dir
from .model import TelemetryRecord
from .qc import QCReport, run_qc
from .trends import TrendResult, mann_kendall

def _event_day(event) -> date:
    """A turbidity event's calendar day (its label is a datetime for raw samples)."""
    at = event.at
    return at.date() if hasattr(at, "date") else at


_DAILY_CSV_COLUMNS = (
    "day",
    "temp_mean_c",
    "coverage",
    "hotspot_c",
    "dhw_c_weeks",
    "alert_level",
    "dhw_window_coverage",
    "turbidity_median_adc",
    "battery_min_v",
    "n_samples",
)


@dataclass
class TelemetryReport:
    qc: QCReport
    daily: list[DailyAggregate]
    temp_trend: TrendResult
    turbidity_trend: TrendResult
    thermal: list[bleaching.DailyThermal]
    thermal_summary: bleaching.ThermalStressSummary | None
    turbidity_anomalies: turbidity.TurbidityAnomalies
    turbidity_drift: DriftAssessment
    mmm: float | None


def analyze(records: list[TelemetryRecord], *, mmm: float | None = None) -> TelemetryReport:
    """Run the full analysis on already-loaded records."""
    qc = run_qc(records)
    daily = aggregate_daily(records)

    temp_series = daily_temperature_series(daily)
    temp_trend = mann_kendall(temp_series)

    # Trend runs on the daily median (long-term drift); anomaly detection runs on the raw
    # per-sample series so short sub-daily runoff spikes aren't smoothed away by the median.
    turb_daily = [(d.day, d.turbidity_median_adc) for d in daily if d.turbidity_median_adc is not None]
    turbidity_trend = mann_kendall(turb_daily)
    turb_raw = [(r.timestamp, r.turbidity_adc) for r in records if r.turbidity_adc is not None]
    turbidity_anomalies = turbidity.detect_events(turb_raw)

    # The turbidity trend above cannot tell creeping water from a fouling sensor — both are
    # monotonic. This screens the daily clean-water floor against the non-optical channel.
    turbidity_drift = assess_drift(records, reference_series=temp_series)

    thermal: list[bleaching.DailyThermal] = []
    thermal_summary: bleaching.ThermalStressSummary | None = None
    if mmm is not None and temp_series:
        thermal = bleaching.assess_thermal_stress(temp_series, mmm)
        thermal_summary = bleaching.summarize(thermal, mmm)

    return TelemetryReport(
        qc=qc,
        daily=daily,
        temp_trend=temp_trend,
        turbidity_trend=turbidity_trend,
        thermal=thermal,
        thermal_summary=thermal_summary,
        turbidity_anomalies=turbidity_anomalies,
        turbidity_drift=turbidity_drift,
        mmm=mmm,
    )


def write_daily_csv(report: TelemetryReport, path: str | Path) -> Path:
    """Write the per-day results table."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    thermal_by_day: dict[date, bleaching.DailyThermal] = {t.day: t for t in report.thermal}

    with path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(_DAILY_CSV_COLUMNS)
        for agg in report.daily:
            t = thermal_by_day.get(agg.day)
            writer.writerow(
                [
                    agg.day.isoformat(),
                    "" if agg.temp_mean is None else agg.temp_mean,
                    agg.coverage,
                    "" if t is None or t.hotspot is None else t.hotspot,
                    "" if t is None else t.dhw,
                    "" if t is None else t.alert,
                    "" if t is None else t.window_coverage,
                    "" if agg.turbidity_median_adc is None else agg.turbidity_median_adc,
                    "" if agg.battery_min_v is None else agg.battery_min_v,
                    agg.n_samples,
                ]
            )
    return path


def write_summary_json(report: TelemetryReport, path: str | Path) -> Path:
    """Write a machine-readable summary of the whole deployment."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    qc = report.qc
    summary = {
        "data_quality": {
            "n_records": qc.n_records,
            "first": qc.first.isoformat() if qc.first else None,
            "last": qc.last.isoformat() if qc.last else None,
            "completeness_pct": qc.completeness_pct,
            "expected_records": qc.expected_records,
            "gaps": len(qc.gaps),
            "missing_samples": qc.total_missing,
            "temp_missing": qc.temp_missing,
            "temp_out_of_range": qc.temp_out_of_range,
            "flags": qc.flag_counts,
            "soh": qc.soh_counts,
            "channels": {name: asdict(ch) for name, ch in qc.channels.items()},
        },
        "temperature_trend": asdict(report.temp_trend),
        "turbidity_trend": asdict(report.turbidity_trend),
        "thermal_stress": (
            None
            if report.thermal_summary is None
            else {
                "mmm_c": report.thermal_summary.mmm,
                "bleaching_threshold_c": report.thermal_summary.threshold,
                "peak_dhw_c_weeks": report.thermal_summary.peak_dhw,
                "peak_dhw_day": (
                    report.thermal_summary.peak_dhw_day.isoformat()
                    if report.thermal_summary.peak_dhw_day
                    else None
                ),
                "peak_alert_level": report.thermal_summary.peak_alert,
                "days_at_or_above_threshold": report.thermal_summary.days_at_or_above_threshold,
            }
        ),
        "turbidity_anomalies": {
            "baseline_median_adc": report.turbidity_anomalies.baseline_median,
            "n_events": len(report.turbidity_anomalies.events),
            "event_days": sorted({_event_day(e).isoformat() for e in report.turbidity_anomalies.events}),
            "note": report.turbidity_anomalies.note,
        },
        "biofouling_drift": {
            "verdict": report.turbidity_drift.verdict,
            "n_days": report.turbidity_drift.n_days,
            "clean_water_floor_trend": asdict(report.turbidity_drift.floor_trend),
            "reference_channel_trend": asdict(report.turbidity_drift.reference_trend),
            "floor_slope_adc_per_year": report.turbidity_drift.floor_slope_per_year,
            "rationale": report.turbidity_drift.rationale,
            "note": report.turbidity_drift.note,
        },
    }
    path.write_text(json.dumps(summary, indent=2))
    return path


def run(
    source: str | Path,
    *,
    mmm: float | None = None,
    out_dir: str | Path = "data/processed",
    dashboard: bool = False,
    web_dir: str | Path | None = None,
    web_banner: str | None = None,
) -> TelemetryReport:
    """Load from a file or directory, analyze, and write outputs.

    ``web_dir`` additionally builds the full multi-page static site (home, technology, science,
    about, and the data-driven analytics dashboard + raw data) for GitHub Pages — see
    :mod:`telemetry.site`.
    """
    source = Path(source)
    records = load_dir(source) if source.is_dir() else load_csv(source)
    report = analyze(records, mmm=mmm)

    out_dir = Path(out_dir)
    write_daily_csv(report, out_dir / "telemetry_daily.csv")
    write_summary_json(report, out_dir / "telemetry_summary.json")
    if dashboard:
        from .dashboard import plot_dashboard  # local import keeps matplotlib optional

        plot_dashboard(report, out_dir / "telemetry_dashboard.png")
    if web_dir is not None:
        from .site import build_site  # local import; stdlib only

        # Pass the raw records so the site also builds the Fleet page (per-buoy, never blended).
        # The single ``mmm`` becomes the fleet default until a per-buoy MMM map is wired through.
        build_site(report, web_dir, banner=web_banner, records=records, default_mmm=mmm)
    return report
