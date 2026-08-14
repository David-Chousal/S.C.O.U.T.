"""Live figures threaded from the telemetry report into the authored pages.

Home shows a few real numbers from the latest publish (current alert, temperature, data
completeness) so the static site feels connected to the buoy. Everything here is derived from
the same :class:`~telemetry.pipeline.TelemetryReport` that drives the Analytics page.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class LiveStats:
    current_alert: str
    alert_class: str          # CSS class: a-nostress | a-watch | a-warning | a-alert1 | a-alert2
    latest_temp: str          # formatted, e.g. "26.8 °C" or "—"
    latest_batt: str
    completeness: str         # e.g. "100%"
    peak_dhw: str             # e.g. "0 °C-wk"
    turbidity_events: int
    n_records: int
    span: str
    mmm: str
    is_sample: bool           # True while the banner (sample-data) is set


@dataclass(frozen=True)
class SiteContext:
    live: LiveStats
    base: str
    fonts_present: bool
    img_dir: Path | None
    ribbon: str | None        # site-wide sample-data ribbon text (or None)
    banner: str | None        # analytics banner text (or None)
