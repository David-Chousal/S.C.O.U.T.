#!/usr/bin/env python3
"""Environmental-telemetry analysis CLI.

Reads the buoy/shore CSV(s) (data-schema.md) and writes a per-day results table, a JSON
summary, and (optionally) a dashboard.

Examples:
    # A single daily file, with the site's Maximum Monthly Mean for DHW:
    python run_telemetry.py --source ../shore/data/SCOUT-01_20260814.csv --mmm 27.6

    # A directory of daily files, plus a dashboard:
    python run_telemetry.py --source ../shore/data --mmm 27.6 --dashboard

`--mmm` is the site's NOAA Coral Reef Watch Maximum Monthly Mean SST (°C). Without it, the run
still does QC, aggregation, trends, and turbidity — but skips Degree Heating Weeks (which is
undefined without a climatology). See docs/analysis/telemetry-methodology.md.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from telemetry import run


def main() -> None:
    parser = argparse.ArgumentParser(description="SCOUT environmental telemetry analysis")
    parser.add_argument("--source", required=True, type=Path, help="CSV file or directory of CSVs")
    parser.add_argument("--mmm", type=float, default=None, help="site Maximum Monthly Mean SST (°C) for DHW")
    parser.add_argument("--out", type=Path, default=Path("data/processed"), help="output directory")
    parser.add_argument("--dashboard", action="store_true", help="also render the PNG dashboard (needs matplotlib)")
    args = parser.parse_args()

    report = run(args.source, mmm=args.mmm, out_dir=args.out, dashboard=args.dashboard)

    qc = report.qc
    print(f"records         : {qc.n_records}  ({qc.completeness_pct}% complete)")
    print(f"span            : {qc.first} → {qc.last}")
    print(f"gaps            : {len(qc.gaps)}  ({qc.total_missing} missing samples)")
    print(f"temp trend      : {report.temp_trend.label} "
          f"(p={report.temp_trend.p_value}, {report.temp_trend.slope_per_year} °C/yr)")
    print(f"turbidity trend : {report.turbidity_trend.label} (p={report.turbidity_trend.p_value})")
    print(f"turbidity events: {len(report.turbidity_anomalies.events)}")
    if report.thermal_summary:
        ts = report.thermal_summary
        print(f"thermal stress  : peak DHW {ts.peak_dhw} °C-weeks → {ts.peak_alert} "
              f"(threshold {ts.threshold} °C)")
    else:
        print("thermal stress  : skipped (no --mmm provided)")
    print(f"outputs written : {args.out.resolve()}")


if __name__ == "__main__":
    main()
