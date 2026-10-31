"""End-to-end telemetry pipeline: CSV(s) → QC → daily aggregation → thermal stress (DHW) →
trends → turbidity anomalies → a per-day CSV and a JSON summary report.

Standard library only (the optional dashboard adds matplotlib). Runs on the shore CSVs today
and, unchanged, on a bare Raspberry Pi.
"""

from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from datetime import date, datetime
from pathlib import Path

from . import acoustic, bleaching, turbidity
from .aggregate import DailyAggregate, aggregate_daily, daily_temperature_series
from .drift import DriftAssessment, assess_drift
from .io import load_csv, load_dir
from .model import TelemetryRecord, has_valid_clock
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
    # When each timed packet was stamped, for freshness against the transmit slots, and the
    # flags + SoH codes on the newest one (any code there marks a fault).
    received: tuple[datetime, ...] = ()
    latest_flags: frozenset[str] = frozenset()
    # schema_version of the newest packet: v2 and later carry the housing humidity flags.
    latest_schema_version: int = 0
    # Per-recording acoustic summaries (schema v3, ADR-0010); None until one arrives.
    acoustic: acoustic.AcousticReport | None = None
    # Daily transmit count the newest packet reports (schema v4, SCO-198); None = not reported,
    # which freshness treats as the default 3.
    tx_count: int | None = None


def analyze(records: list[TelemetryRecord], *, mmm: float | None = None) -> TelemetryReport:
    """Run the full analysis on already-loaded records."""
    qc = run_qc(records)

    # QC sees every row so it can report the clock-invalid ones. Everything downstream is
    # keyed on time — daily aggregation, DHW, trends, the drift screen, turbidity events —
    # so it gets only the rows whose timestamps mean something. A row the buoy stamped
    # 1970-01-01 because the RTC was unreadable would otherwise invent a phantom day fifty-six
    # years before the deployment and drag every series with it.
    timed = [r for r in records if has_valid_clock(r)]

    daily = aggregate_daily(timed)

    temp_series = daily_temperature_series(daily)
    temp_trend = mann_kendall(temp_series)

    # Trend runs on the daily median (long-term drift); anomaly detection runs on the raw
    # per-sample series so short sub-daily runoff spikes aren't smoothed away by the median.
    turb_daily = [(d.day, d.turbidity_median_adc) for d in daily if d.turbidity_median_adc is not None]
    turbidity_trend = mann_kendall(turb_daily)
    turb_raw = [(r.timestamp, r.turbidity_adc) for r in timed if r.turbidity_adc is not None]
    turbidity_anomalies = turbidity.detect_events(turb_raw)

    # The turbidity trend above cannot tell creeping water from a fouling sensor — both are
    # monotonic. This screens the daily clean-water floor against the non-optical channel.
    turbidity_drift = assess_drift(timed, reference_series=temp_series)

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
        received=tuple(sorted(r.timestamp for r in timed)),
        latest_flags=_latest_flags(timed),
        latest_schema_version=max(timed, key=lambda r: r.timestamp).schema_version if timed else 0,
        acoustic=acoustic.summarize_acoustic(timed),
        tx_count=_latest_tx_count(timed),
    )


def _latest_tx_count(timed: list[TelemetryRecord]) -> int | None:
    reported = [r for r in timed if r.tx_count is not None]
    return max(reported, key=lambda r: r.timestamp).tx_count if reported else None


def _latest_flags(timed: list[TelemetryRecord]) -> frozenset[str]:
    if not timed:
        return frozenset()
    newest = max(timed, key=lambda r: r.timestamp)
    return newest.flags | newest.soh


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
            "clock_invalid": qc.clock_invalid,
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
            "clean_water_trend": asdict(report.turbidity_drift.clean_water_trend),
            "reference_channel_trend": asdict(report.turbidity_drift.reference_trend),
            "clean_water_slope_adc_per_year": report.turbidity_drift.clean_water_slope_per_year,
            "rationale": report.turbidity_drift.rationale,
            "note": report.turbidity_drift.note,
        },
        "acoustic": acoustic.to_json(report.acoustic),
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

        build_site(report, web_dir, banner=web_banner)
    return report
