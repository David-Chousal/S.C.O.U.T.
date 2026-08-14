"""SCOUT environmental-telemetry analytics.

Turns the buoy's temperature / turbidity / battery CSV (data-schema.md) into quality-controlled
daily series, NOAA Coral Reef Watch thermal-stress metrics (HotSpot, DHW, bleaching alert
levels), monotonic trends (Mann-Kendall + Sen's slope), and turbidity anomaly flags.

The scientific core is pure standard library — it runs with no third-party packages and is
fully unit-tested. `pymannkendall` (autocorrelation-corrected trends) and `matplotlib` (the
dashboard) are optional accelerators. Methodology and citations:
docs/analysis/telemetry-methodology.md.
"""

from . import bleaching, turbidity
from .aggregate import DailyAggregate, aggregate_daily, daily_temperature_series
from .fleet import FleetReport, analyze_fleet, group_by_buoy, run_fleet, summarize_fleet
from .io import TelemetryFormatError, load_csv, load_dir
from .model import TelemetryRecord
from .pipeline import TelemetryReport, analyze, run
from .qc import QCReport, run_qc
from .trends import TrendResult, mann_kendall

__all__ = [
    "bleaching",
    "turbidity",
    "TelemetryRecord",
    "TelemetryFormatError",
    "load_csv",
    "load_dir",
    "run_qc",
    "QCReport",
    "aggregate_daily",
    "daily_temperature_series",
    "DailyAggregate",
    "mann_kendall",
    "TrendResult",
    "analyze",
    "run",
    "TelemetryReport",
    "FleetReport",
    "analyze_fleet",
    "group_by_buoy",
    "run_fleet",
    "summarize_fleet",
]
