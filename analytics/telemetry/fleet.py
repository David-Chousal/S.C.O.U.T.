"""Multi-buoy (fleet) orchestration.

The per-buoy science (QC, daily aggregation, DHW, trends, turbidity) is unchanged — this layer
only **groups records by buoy and runs the existing pipeline per buoy**, then assembles a
fleet-level summary. Merging buoys into one stream (as a naive `load_dir` does) would corrupt
daily means and DHW, so every buoy is analysed in isolation.

Each buoy may sit at a different reef, so Degree Heating Weeks needs a **per-buoy MMM**; supply
a `buoy_id → MMM` map (with an optional default for buoys not in it).

Standard library only.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from .model import TelemetryRecord
from .pipeline import TelemetryReport, analyze, write_daily_csv, write_summary_json


@dataclass
class FleetReport:
    """Per-buoy reports plus the MMM actually used for each (keyed by buoy_id, e.g. 'SCOUT-01')."""

    reports: dict[str, TelemetryReport]
    mmm_by_buoy: dict[str, float | None]


def group_by_buoy(records: list[TelemetryRecord]) -> dict[str, list[TelemetryRecord]]:
    """Split a mixed record stream into one list per ``buoy_id`` (preserves order)."""
    groups: dict[str, list[TelemetryRecord]] = {}
    for record in records:
        groups.setdefault(record.buoy_id, []).append(record)
    return groups


def analyze_fleet(
    records: list[TelemetryRecord],
    *,
    mmm_by_buoy: dict[str, float] | None = None,
    default_mmm: float | None = None,
) -> FleetReport:
    """Group by buoy and run the per-buoy pipeline for each, with its own MMM."""
    mmm_by_buoy = mmm_by_buoy or {}
    groups = group_by_buoy(records)
    reports: dict[str, TelemetryReport] = {}
    used_mmm: dict[str, float | None] = {}
    for buoy_id in sorted(groups):
        mmm = mmm_by_buoy.get(buoy_id, default_mmm)
        reports[buoy_id] = analyze(groups[buoy_id], mmm=mmm)
        used_mmm[buoy_id] = mmm
    return FleetReport(reports=reports, mmm_by_buoy=used_mmm)


def summarize_fleet(fleet: FleetReport) -> dict:
    """One compact status row per buoy — the fleet-level rollup."""
    buoys: dict[str, dict] = {}
    for buoy_id, report in fleet.reports.items():
        thermal = report.thermal_summary
        buoys[buoy_id] = {
            "n_records": report.qc.n_records,
            "completeness_pct": report.qc.completeness_pct,
            "first": report.qc.first.isoformat() if report.qc.first else None,
            "last": report.qc.last.isoformat() if report.qc.last else None,
            "mmm_c": fleet.mmm_by_buoy.get(buoy_id),
            "peak_dhw_c_weeks": thermal.peak_dhw if thermal else None,
            "peak_alert": thermal.peak_alert if thermal else None,
            "temp_trend": report.temp_trend.label,
            "temp_slope_per_year": report.temp_trend.slope_per_year,
            "turbidity_events": len(report.turbidity_anomalies.events),
        }
    return {"n_buoys": len(fleet.reports), "buoys": buoys}


def write_fleet(fleet: FleetReport, out_dir: str | Path) -> Path:
    """Write per-buoy outputs to ``out_dir/<buoy_id>/`` and a ``fleet_summary.json``."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    for buoy_id, report in fleet.reports.items():
        buoy_dir = out_dir / buoy_id
        write_daily_csv(report, buoy_dir / "telemetry_daily.csv")
        write_summary_json(report, buoy_dir / "telemetry_summary.json")
    summary_path = out_dir / "fleet_summary.json"
    summary_path.write_text(json.dumps(summarize_fleet(fleet), indent=2))
    return summary_path


def run_fleet(
    source: str | Path,
    *,
    mmm_by_buoy: dict[str, float] | None = None,
    default_mmm: float | None = None,
    out_dir: str | Path = "data/processed/fleet",
) -> FleetReport:
    """Load a file or directory (many buoys), analyse per buoy, and write outputs."""
    from .io import load_csv, load_dir  # local import to avoid a cycle at module load

    source = Path(source)
    records = load_dir(source) if source.is_dir() else load_csv(source)
    fleet = analyze_fleet(records, mmm_by_buoy=mmm_by_buoy, default_mmm=default_mmm)
    write_fleet(fleet, out_dir)
    return fleet
