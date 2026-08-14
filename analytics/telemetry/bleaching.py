"""Thermal-stress and coral-bleaching assessment — NOAA Coral Reef Watch (CRW) method.

This implements CRW's operational thermal-stress metrics, the standard the reef-science
community uses to anticipate bleaching:

- **HotSpot (HS)** — the positive sea-surface-temperature (SST) anomaly above the warmest
  part of the climatology: ``HS = max(0, SST − MMM)``.
- **MMM (Maximum Monthly Mean)** — the highest of the twelve climatological monthly-mean
  SSTs for the site. It comes from a long baseline climatology (CRW's is 1985–2012+), **not**
  from a short buoy deployment, so it is a required input here.
- **Bleaching threshold** — ``MMM + 1 °C``. Corals begin accumulating stress above it.
- **Degree Heating Weeks (DHW)** — the trailing-12-week accumulation of daily HotSpots that
  are ≥ 1 °C, expressed in °C-weeks: ``DHW = Σ(HS ≥ 1 over 84 days) / 7``.
- **Bleaching Alert Level** — CRW's categorical scale derived from HS and DHW.

Thresholds (Liu et al. 2014; Skirving et al. 2020):
    DHW ≥ 4  → Alert Level 1 — significant bleaching likely
    DHW ≥ 8  → Alert Level 2 — severe bleaching + mortality likely

Deviation from the operational product: CRW builds daily SST from *nighttime-only* satellite
retrievals to suppress diurnal skin warming. A shallow surface buoy sees a real diurnal
cycle, so the daily aggregate used here (a daily mean, upstream in ``aggregate.py``) can run
slightly warm relative to CRW. Documented in docs/analysis/telemetry-methodology.md; prefer a
nighttime daily aggregate when comparing directly against CRW products.

Pure standard library — no third-party dependencies.

References:
    Liu, G. et al. (2014). Reef-scale thermal stress monitoring of coral ecosystems:
        new 5-km global products from NOAA Coral Reef Watch. Remote Sensing 6(11), 11579–11606.
        https://doi.org/10.3390/rs61111579
    Skirving, W. et al. (2020). CoralTemp and the Coral Reef Watch coral bleaching heat stress
        product suite v3.1. Remote Sensing 12(23), 3856. https://doi.org/10.3390/rs12233856
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

BLEACHING_THRESHOLD_OFFSET_C = 1.0  # threshold = MMM + 1 °C
HOTSPOT_MIN_C = 1.0  # only HotSpots ≥ 1 °C accumulate into DHW
DHW_WINDOW_DAYS = 84  # 12 weeks
DHW_ALERT_LEVEL_1 = 4.0  # °C-weeks — significant bleaching likely
DHW_ALERT_LEVEL_2 = 8.0  # °C-weeks — severe bleaching + mortality likely

# Ordered from least to most severe; index doubles as a numeric severity.
ALERT_NO_STRESS = "No Stress"
ALERT_WATCH = "Bleaching Watch"
ALERT_WARNING = "Bleaching Warning"
ALERT_LEVEL_1 = "Alert Level 1"
ALERT_LEVEL_2 = "Alert Level 2"
ALERT_LEVELS = (ALERT_NO_STRESS, ALERT_WATCH, ALERT_WARNING, ALERT_LEVEL_1, ALERT_LEVEL_2)


def bleaching_threshold(mmm: float) -> float:
    """The temperature above which stress accumulates: ``MMM + 1 °C``."""
    return mmm + BLEACHING_THRESHOLD_OFFSET_C


def hotspot(sst: float, mmm: float) -> float:
    """CRW HotSpot: the positive anomaly above the climatological maximum, ``max(0, SST−MMM)``."""
    return max(0.0, sst - mmm)


def alert_level(hs: float, dhw: float) -> str:
    """CRW Bleaching Alert Level from the current HotSpot and DHW.

    Warning and both Alert levels require a *current* HotSpot ≥ 1 °C — if the water has cooled
    below the threshold, accumulated DHW no longer raises the alert beyond Watch.
    """
    if hs <= 0.0:
        return ALERT_NO_STRESS
    if hs < HOTSPOT_MIN_C:
        return ALERT_WATCH
    # hs ≥ 1 °C from here.
    if dhw >= DHW_ALERT_LEVEL_2:
        return ALERT_LEVEL_2
    if dhw >= DHW_ALERT_LEVEL_1:
        return ALERT_LEVEL_1
    return ALERT_WARNING


@dataclass(frozen=True)
class DailyThermal:
    """CRW thermal-stress state for one calendar day."""

    day: date
    sst: float | None  # daily aggregate SST (°C); None if the day has no valid data
    hotspot: float | None
    dhw: float
    alert: str
    window_coverage: float  # fraction of the trailing 84-day window with valid data [0, 1]


@dataclass(frozen=True)
class ThermalStressSummary:
    """Deployment-level rollup of the daily series."""

    mmm: float
    threshold: float
    peak_dhw: float
    peak_dhw_day: date | None
    peak_alert: str
    days_at_or_above_threshold: int
    n_days: int


def _fill_calendar(daily: list[tuple[date, float]]) -> list[tuple[date, float | None]]:
    """Expand sparse (day, sst) points to a gap-free daily calendar, missing days as None.

    DHW accumulates over *calendar* weeks, so gaps must be represented explicitly rather than
    silently compressed — otherwise a fortnight of missing data would look like two adjacent
    days and understate the window span.
    """
    if not daily:
        return []
    ordered = sorted(daily, key=lambda pair: pair[0])
    by_day = {day: sst for day, sst in ordered}
    start, end = ordered[0][0], ordered[-1][0]
    out: list[tuple[date, float | None]] = []
    cursor = start
    while cursor <= end:
        out.append((cursor, by_day.get(cursor)))
        cursor += timedelta(days=1)
    return out


def assess_thermal_stress(
    daily: list[tuple[date, float]],
    mmm: float,
    *,
    window_days: int = DHW_WINDOW_DAYS,
) -> list[DailyThermal]:
    """Compute HotSpot, DHW, and Alert Level for each day.

    Args:
        daily: (calendar day, daily-aggregate SST in °C) pairs. May be sparse; gaps are handled.
        mmm: Maximum Monthly Mean SST (°C) for the site, from a CRW climatology.
        window_days: DHW accumulation window (default 84 = 12 weeks).

    Returns:
        One :class:`DailyThermal` per calendar day between the first and last input day.
        DHW on any day sums only the HotSpots ≥ 1 °C present in the trailing window; days with
        no data contribute nothing, and ``window_coverage`` exposes how complete that window was
        so a gap-biased DHW is visible rather than hidden.
    """
    calendar = _fill_calendar(daily)
    hotspots = [None if sst is None else hotspot(sst, mmm) for _, sst in calendar]

    results: list[DailyThermal] = []
    for i, (day, sst) in enumerate(calendar):
        lo = max(0, i - window_days + 1)
        window = hotspots[lo : i + 1]
        accumulated = sum(hs for hs in window if hs is not None and hs >= HOTSPOT_MIN_C)
        dhw = accumulated / 7.0
        present = sum(1 for hs in window if hs is not None)
        coverage = present / window_days
        hs_today = hotspots[i]
        alert = ALERT_NO_STRESS if hs_today is None else alert_level(hs_today, dhw)
        results.append(
            DailyThermal(
                day=day,
                sst=sst,
                hotspot=hs_today,
                dhw=round(dhw, 3),
                alert=alert,
                window_coverage=round(coverage, 3),
            )
        )
    return results


def summarize(daily_thermal: list[DailyThermal], mmm: float) -> ThermalStressSummary:
    """Roll a daily series up into a deployment-level summary."""
    threshold = bleaching_threshold(mmm)
    peak = max(daily_thermal, key=lambda d: d.dhw, default=None)
    peak_alert = ALERT_NO_STRESS
    for d in daily_thermal:
        if ALERT_LEVELS.index(d.alert) > ALERT_LEVELS.index(peak_alert):
            peak_alert = d.alert
    at_threshold = sum(1 for d in daily_thermal if d.sst is not None and d.sst >= threshold)
    return ThermalStressSummary(
        mmm=mmm,
        threshold=threshold,
        peak_dhw=peak.dhw if peak else 0.0,
        peak_dhw_day=peak.day if peak else None,
        peak_alert=peak_alert,
        days_at_or_above_threshold=at_threshold,
        n_days=len(daily_thermal),
    )
