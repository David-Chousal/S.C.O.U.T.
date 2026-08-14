"""Turbidity anomaly detection.

The SEN0189 ships **uncalibrated** — its output is raw ADC counts / volts, not NTU (see
data-schema.md open questions). Absolute water-quality thresholds are therefore not
defensible yet, so this module deliberately detects **relative** turbidity events (runoff,
resuspension, sediment plumes) against the deployment's own robust baseline, and says nothing
about NTU.

Method: the Iglewicz–Hoaglin modified z-score, which uses the median and MAD instead of the
mean and standard deviation, so a few large spikes don't inflate the baseline they're being
measured against. A day is an event when its modified z-score exceeds ``threshold`` (3.5 is
the Iglewicz–Hoaglin recommendation). Only positive excursions (dirtier water) are flagged.

When more than half the days share one value the MAD collapses to zero; Iglewicz & Hoaglin's
documented fallback uses the mean absolute deviation instead, so a lone spike above an
otherwise-flat baseline is still caught.

Standard library only.

Reference:
    Iglewicz, B. & Hoaglin, D. (1993). *How to Detect and Handle Outliers.* ASQC Quality Press.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass
from typing import Any

MODIFIED_Z_THRESHOLD = 3.5
_MAD_TO_STDDEV = 0.6745  # scale factor making MAD a consistent σ estimator for normal data
_MEANAD_TO_STDDEV = 1.253314  # Iglewicz–Hoaglin MeanAD fallback constant (used when MAD == 0)


@dataclass(frozen=True)
class TurbidityEvent:
    at: Any  # sample label — a datetime (raw samples) or date (daily); orderable
    value: float  # raw ADC (uncalibrated)
    modified_z: float


@dataclass(frozen=True)
class TurbidityAnomalies:
    baseline_median: float | None
    events: list[TurbidityEvent]
    n_days: int
    note: str = "Uncalibrated (ADC counts) — relative events only, not NTU."


def detect_events(
    samples: list[tuple[Any, float]],
    *,
    threshold: float = MODIFIED_Z_THRESHOLD,
) -> TurbidityAnomalies:
    """Flag samples whose turbidity is anomalously high relative to the robust baseline.

    Feed **raw per-sample** turbidity (timestamp, ADC) so short sub-daily runoff/resuspension
    events are caught — a daily median would smooth them away.
    """
    points = [(label, v) for label, v in samples if v is not None]
    if not points:
        return TurbidityAnomalies(baseline_median=None, events=[], n_days=0)

    values = [v for _, v in points]
    median = statistics.median(values)
    deviations = [abs(v - median) for v in values]
    mad = statistics.median(deviations)
    mean_ad = statistics.fmean(deviations)

    def modified_z(value: float) -> float | None:
        if mad > 0:
            return _MAD_TO_STDDEV * (value - median) / mad
        if mean_ad > 0:  # MAD degenerate (majority-constant series) → MeanAD fallback
            return (value - median) / (_MEANAD_TO_STDDEV * mean_ad)
        return None  # truly constant series — nothing anomalous

    events: list[TurbidityEvent] = []
    for label, value in points:
        mod_z = modified_z(value)
        if mod_z is not None and mod_z > threshold:  # positive excursions only (dirtier water)
            events.append(TurbidityEvent(at=label, value=value, modified_z=round(mod_z, 2)))

    return TurbidityAnomalies(
        baseline_median=round(median, 1),
        events=events,
        n_days=len(points),
    )
