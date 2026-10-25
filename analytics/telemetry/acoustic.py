"""The buoy's acoustic summary (ADR-0010) as the dashboard reads it.

Each recording the buoy makes is summarised on board into seven numbers that ride in the next
packet: band levels for the anthro (0–200 Hz), mixed (200–1,000 Hz) and bio (1–8 kHz) bands and
broadband, an NDSI estimate, a snap count and a clip count. The full indices are still computed
on shore from the SD card (``utils/acoustic_indices.py``); this is the live indicator between
card recoveries. Specification: ``utils/acoustic_summary.py``.

Levels are dBFS (relative to the ADC's full scale) until the analog chain is calibrated, so they
are good for trends, not absolute loudness. The buoy NDSI tracks the shore NDSI but is not equal
to it (docs/analysis/acoustic-summary-validation.md).

Standard library only.
"""

from __future__ import annotations

import statistics
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime

from .model import TelemetryRecord, has_valid_clock

# One 60 s clip at 22,050 Hz (config.h ACOUSTIC_CLIP_SECONDS × ACOUSTIC_SAMPLE_RATE_HZ).
SAMPLES_PER_RECORDING = 60 * 22050
# A recording with more than 0.1% of its samples near the ADC rails is flagged: the gain is too
# high or something very loud was close, and its levels and snap count are biased low by the
# clipped peaks. Provisional until the amplifier gain is set (SCO-216).
CLIP_WARN_FRACTION = 0.001
CLIP_WARN_COUNT = round(SAMPLES_PER_RECORDING * CLIP_WARN_FRACTION)
# The firmware reports digital silence (zero energy) as the int16 minimum.
_SILENT_CDB = -32768
COUNTER_MAX = 65535
# Recent window for the clipping card: the last three days at three recordings a day.
RECENT_RECORDINGS = 9


@dataclass(frozen=True)
class Recording:
    """One recording's summary. Levels in dB re ADC full scale; ``None`` = digital silence."""

    at: datetime
    anthro_db: float | None
    mixed_db: float | None
    bio_db: float | None
    broad_db: float | None
    ndsi: float
    snaps: int
    clips: int

    @property
    def clipping(self) -> bool:
        return self.clips >= CLIP_WARN_COUNT


@dataclass(frozen=True)
class AcousticReport:
    recordings: tuple[Recording, ...]
    ndsi_daily: tuple[tuple[date, float], ...]

    @property
    def latest(self) -> Recording:
        return self.recordings[-1]

    @property
    def median_snaps(self) -> float:
        return statistics.median(r.snaps for r in self.recordings)

    @property
    def recent_clipping(self) -> int:
        """How many of the most recent recordings were clipping."""
        return sum(1 for r in self.recordings[-RECENT_RECORDINGS:] if r.clipping)

    @property
    def recent_count(self) -> int:
        return len(self.recordings[-RECENT_RECORDINGS:])


def _db(cdb: int) -> float | None:
    return None if cdb == _SILENT_CDB else cdb / 100


def recordings_from(records: list[TelemetryRecord]) -> list[Recording]:
    """Rows that carry a summary (v3, a recording that cycle, a trusted clock), oldest first."""
    out = []
    for r in records:
        if r.lvl_broad_cdb is None or not has_valid_clock(r):
            continue
        out.append(Recording(
            at=r.timestamp,
            anthro_db=_db(r.lvl_anthro_cdb or 0),
            mixed_db=_db(r.lvl_mixed_cdb or 0),
            bio_db=_db(r.lvl_bio_cdb or 0),
            broad_db=_db(r.lvl_broad_cdb),
            ndsi=(r.ndsi_e4 or 0) / 10000,
            snaps=r.snap_count or 0,
            clips=r.clip_count or 0,
        ))
    return sorted(out, key=lambda rec: rec.at)


def summarize_acoustic(records: list[TelemetryRecord]) -> AcousticReport | None:
    """The acoustic report, or ``None`` when no row carries a summary yet."""
    recordings = recordings_from(records)
    if not recordings:
        return None
    by_day: dict[date, list[float]] = defaultdict(list)
    for rec in recordings:
        by_day[rec.at.date()].append(rec.ndsi)
    ndsi_daily = tuple((day, round(statistics.fmean(v), 4)) for day, v in sorted(by_day.items()))
    return AcousticReport(recordings=tuple(recordings), ndsi_daily=ndsi_daily)


def to_json(report: AcousticReport | None) -> dict | None:
    """The summary-JSON section."""
    if report is None:
        return None
    latest = report.latest
    return {
        "n_recordings": len(report.recordings),
        "latest": {
            "at": latest.at.isoformat(),
            "anthro_dbfs": latest.anthro_db,
            "mixed_dbfs": latest.mixed_db,
            "bio_dbfs": latest.bio_db,
            "broad_dbfs": latest.broad_db,
            "ndsi_buoy": latest.ndsi,
            "snap_count": latest.snaps,
            "clip_count": latest.clips,
            "clipping": latest.clipping,
        },
        "median_snaps_per_recording": report.median_snaps,
        "recent_clipping": {"recordings": report.recent_count,
                            "clipping": report.recent_clipping,
                            "threshold_samples": CLIP_WARN_COUNT},
        "ndsi_daily": [{"day": d.isoformat(), "ndsi_buoy": v} for d, v in report.ndsi_daily],
        "note": ("Buoy-side summary (ADR-0010): dBFS levels, uncalibrated; NDSI from filtered "
                 "time-domain energy, which tracks but does not equal the shore NDSI."),
    }
