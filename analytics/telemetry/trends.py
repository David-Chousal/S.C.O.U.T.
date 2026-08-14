"""Monotonic-trend detection for daily environmental series.

Mann-Kendall is the right tool for reef/environmental trends: non-parametric (no normality
assumption), robust to outliers (a single storm day won't swing it), and it tests directly
for a monotonic change — which is what slow warming or creeping turbidity looks like. Sen's
slope gives the magnitude (change per day).

Environmental series are strongly autocorrelated, which inflates significance under the naive
test. When `pymannkendall` is installed we use its Hamed & Rao (1998) autocorrelation-corrected
variant; otherwise we fall back to a self-contained, tie-corrected original test implemented
here in pure Python. Sen's slope is always computed here from real day offsets.

References:
    Mann (1945) Econometrica 13(3); Kendall (1975) *Rank Correlation Methods*.
    Hamed & Rao (1998). A modified Mann-Kendall trend test for autocorrelated data.
        Journal of Hydrology 204(1–4), 182–196.
    Sen (1968). Estimates of the regression coefficient based on Kendall's tau. JASA 63(324).
"""

from __future__ import annotations

import math
import statistics
from collections import Counter
from dataclasses import dataclass
from datetime import date

try:  # optional accelerator — preferred for its autocorrelation correction
    import pymannkendall as _pymk
except ImportError:  # pragma: no cover - exercised only when the dep is absent
    _pymk = None

SIGNIFICANT_P = 0.05
MARGINAL_P = 0.10
_MIN_N = 4  # below this, a monotonic trend test is meaningless


@dataclass(frozen=True)
class TrendResult:
    label: str  # 'increasing' | 'decreasing' | 'marginal ...' | 'no trend' | 'insufficient data'
    p_value: float | None
    tau: float | None  # Kendall's tau-b, effect size [-1, 1]
    slope_per_day: float | None  # Sen's slope, units/day
    slope_per_year: float | None
    n: int
    method: str  # which test produced p


def _phi(z: float) -> float:
    """Standard-normal CDF via the error function."""
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def _mk_statistic(y: list[float]) -> tuple[int, float, float]:
    """Return (S, tau-b, two-sided p) from the tie-corrected original Mann-Kendall test."""
    n = len(y)
    s = 0
    for i in range(n - 1):
        for j in range(i + 1, n):
            s += (y[j] > y[i]) - (y[j] < y[i])

    ties = Counter(y)
    tie_term = sum(t * (t - 1) * (2 * t + 5) for t in ties.values())
    var_s = (n * (n - 1) * (2 * n + 5) - tie_term) / 18.0

    n0 = n * (n - 1) / 2.0
    tie_pairs = sum(t * (t - 1) / 2.0 for t in ties.values())
    denom = math.sqrt((n0 - tie_pairs) * n0) if n0 - tie_pairs > 0 else 0.0
    tau = s / denom if denom else 0.0

    if var_s <= 0:
        return s, tau, 1.0
    if s > 0:
        z = (s - 1) / math.sqrt(var_s)
    elif s < 0:
        z = (s + 1) / math.sqrt(var_s)
    else:
        z = 0.0
    p = 2.0 * (1.0 - _phi(abs(z)))
    return s, tau, min(max(p, 0.0), 1.0)


def _sens_slope(y: list[float], x: list[float]) -> float:
    """Median of pairwise slopes (units per unit x)."""
    slopes = [
        (y[j] - y[i]) / (x[j] - x[i])
        for i in range(len(y) - 1)
        for j in range(i + 1, len(y))
        if x[j] != x[i]
    ]
    return statistics.median(slopes) if slopes else 0.0


def _label(p: float, tau: float) -> str:
    if p < SIGNIFICANT_P:
        return "increasing" if tau > 0 else "decreasing"
    if p < MARGINAL_P:
        return "marginal increasing" if tau > 0 else "marginal decreasing"
    return "no trend"


def mann_kendall(series: list[tuple[date, float]]) -> TrendResult:
    """Test a daily ``(day, value)`` series for a monotonic trend.

    ``day`` offsets (in days from the first point) drive Sen's slope, so an uneven calendar
    yields a correct per-day magnitude. The trend test itself is rank-order based.
    """
    ordered = sorted(series, key=lambda p: p[0])
    y = [v for _, v in ordered]
    n = len(y)
    if n < _MIN_N:
        return TrendResult("insufficient data", None, None, None, None, n, "none")

    x_days = [(d - ordered[0][0]).days for d, _ in ordered]
    _, tau, p_pure = _mk_statistic(y)

    if _pymk is not None:
        result = _pymk.hamed_rao_modification_test(y)
        p = float(result.p)
        method = "hamed-rao (autocorrelation-corrected)"
        if math.isnan(p):  # perfectly monotonic → correction degenerates; use the original test
            p, method = p_pure, "original (pure-python fallback)"
    else:
        p, method = p_pure, "original (pure-python)"

    slope_day = _sens_slope(y, [float(v) for v in x_days])
    return TrendResult(
        label=_label(p, tau),
        p_value=round(p, 4),
        tau=round(tau, 4),
        slope_per_day=round(slope_day, 6),
        slope_per_year=round(slope_day * 365.25, 4),
        n=n,
        method=method,
    )
