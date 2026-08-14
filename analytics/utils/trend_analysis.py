"""
trend_analysis.py
-----------------
Longitudinal reef health trend detection via Mann-Kendall tests on PC1.

Primary pipeline:
    1. Fit a single global PCA on the session-level index matrix (all sessions
       pooled).  PC1 — the direction of maximum variance — captures the dominant
       shared acoustic signal without triple-counting the correlated ACI/BI/NDSI
       shrimp-activity axis.
    2. Run one modified Mann-Kendall test (Hamed & Rao 1998) on the PC1 time
       series.  A single test eliminates the multi-index voting scheme and its
       arbitrary 0.67 threshold, and removes the multiple-testing inflation that
       came with running five correlated MK tests simultaneously.
    3. Optionally: seasonal z-score the PC1 series before the MK test to remove
       the natural amplitude shift between Okinawa's hot, baiu, and cool seasons.

Per-index MK results (run_trend_analysis / run_seasonal_trend_analysis) are
retained as diagnostic output to show which individual indices drive the PC1
trend, but they no longer determine the overall reef classification.

Why Mann-Kendall over linear regression?
  - Non-parametric: no normality assumption on acoustic index distributions
  - Robust to outliers (individual disturbance events don't corrupt the trend)
  - Directly tests for monotonic increase/decrease — exactly what coral decline looks like
"""

import numpy as np
import pandas as pd
import pymannkendall as pymk
from datetime import date
from pathlib import Path
from typing import Optional

from utils.acoustic_indices import compute_all_indices

INDICES = ["ACI", "BI", "NDSI", "H", "ADI"]


# ── Session-level averaging ───────────────────────────────────────────────────

def compute_session_mean(wav_paths: list) -> Optional[dict]:
    """
    Compute mean bioacoustic indices over a list of WAV files.

    Returns a dict with keys: session_date, ACI, BI, NDSI, H, ADI, n_files.
    Returns None if all files fail to process.
    """
    rows = []
    for path in wav_paths:
        try:
            row = compute_all_indices(str(path))
            rows.append(row)
        except Exception as e:
            print(f"    WARN: {Path(path).name} failed ({e})")

    if not rows:
        return None

    df = pd.DataFrame(rows)

    # Parse session date from filename of first successful file
    from utils.acoustic_indices import parse_timestamp
    ts = parse_timestamp(rows[0]["filename"])
    if ts is None:
        raise ValueError(
            f"Could not parse timestamp from '{rows[0]['filename']}'. "
            "Filenames must match SSK_Site_X_YYYYMMDD_HHMMSS.wav. "
            "Without a valid date the session cannot be placed on the timeline."
        )
    session_date = ts.date()

    # Median is more robust than mean when one of the 5 files catches a passing
    # boat — a disturbance event would pull the mean down and bleed into the
    # longitudinal dataset despite disturbance detection being designed to isolate it.
    result = {"session_date": session_date, "n_files": len(rows)}
    for idx in INDICES:
        result[idx] = round(float(df[idx].median()), 4)
    return result


def build_longitudinal_df(sessions_dir: str) -> pd.DataFrame:
    """
    Process each subdirectory of sessions_dir as one recording session.

    Directory structure expected:
        sessions_dir/
            YYYYMM_YYYYMMDD/   ← one folder per session
                *.wav

    Returns a DataFrame sorted by session_date with one row per session.
    """
    sessions_dir = Path(sessions_dir)
    session_dirs = sorted(d for d in sessions_dir.iterdir() if d.is_dir())

    if not session_dirs:
        raise FileNotFoundError(f"No session subdirectories found in {sessions_dir}")

    rows = []
    for session_dir in session_dirs:
        wav_files = sorted(session_dir.glob("*.wav")) + sorted(session_dir.glob("*.WAV"))
        if not wav_files:
            print(f"  [{session_dir.name}] no WAV files — skipping")
            continue
        print(f"  [{session_dir.name}] {len(wav_files)} files ...", end=" ", flush=True)
        result = compute_session_mean(wav_files)
        if result:
            result["session_label"] = session_dir.name
            rows.append(result)
            print("OK")
        else:
            print("FAILED (all files errored)")

    if not rows:
        raise ValueError("No sessions processed successfully.")

    df = pd.DataFrame(rows).sort_values("session_date").reset_index(drop=True)
    return df


# ── Mann-Kendall trend test ───────────────────────────────────────────────────

def mann_kendall(series: pd.Series) -> dict:
    """
    Modified Mann-Kendall trend test (Hamed & Rao 1998) with autocorrelation correction.

    Standard MK assumes independence between observations. Adjacent monthly reef
    recordings are temporally autocorrelated, which inflates significance under
    the uncorrected test. The Hamed-Rao variance correction adjusts the S-statistic
    variance for the observed autocorrelation structure, giving honest p-values.

    Trend thresholds:
        p < 0.05  → 'increasing' / 'decreasing'  (significant)
        p < 0.10  → 'marginal increasing' / 'marginal decreasing'
        otherwise → 'no trend'

    Note on statistical power: with n=8 sessions, the minimum |tau| for p<0.05
    is ~0.64 — a very strong monotonic requirement. Most real-world trends will
    return 'no trend' or 'marginal' until more sessions are accumulated.

    Returns:
        trend    : 'increasing' | 'decreasing' | 'marginal increasing' |
                   'marginal decreasing' | 'no trend'
        p_value  : float [0, 1] — autocorrelation-corrected
        tau      : Kendall's tau [-1, 1] — effect size
        slope    : Sen's slope (change per session interval)
    """
    result = pymk.hamed_rao_modification_test(series.values)
    tau     = float(result.Tau)
    p_value = float(result.p)
    slope   = float(result.slope)

    # Hamed-Rao's autocorrelation normalization produces NaN when the series is
    # perfectly monotonic (zero variance in lag structure). Fall back to the
    # standard MK test, which is valid in this edge case.
    if np.isnan(p_value):
        fallback = pymk.original_test(series.values)
        p_value  = float(fallback.p)
        slope    = float(fallback.slope)

    if p_value < 0.05:
        trend = "increasing" if tau > 0 else "decreasing"
    elif p_value < 0.10:
        trend = "marginal increasing" if tau > 0 else "marginal decreasing"
    else:
        trend = "no trend"

    return {
        "trend":   trend,
        "p_value": round(p_value, 4),
        "tau":     round(tau, 4),
        "slope":   round(slope, 6),
    }


def run_trend_analysis(df: pd.DataFrame) -> dict:
    """
    Run Mann-Kendall on each index column in df, sorted by session_date.

    Returns a dict keyed by index name, each value is a mann_kendall() result.
    """
    df_sorted = df.sort_values("session_date").reset_index(drop=True)
    return {idx: mann_kendall(df_sorted[idx]) for idx in INDICES if idx in df_sorted.columns}


# ── Seasonal correction ──────────────────────────────────────────────────────

# Okinawa / Sesoko Island (~26°N) seasonal calendar:
#   cool/dry   Nov–Apr  — lower water temp, reduced snapping shrimp / fish activity
#   baiu       May–Jun  — rainy season transition, acoustic indices shift with SST rise
#   hot        Jul–Oct  — peak biological activity, highest BI / ACI
# Using temperate NH seasons (winter/spring/summer/fall) would assign the wrong
# amplitude baselines and corrupt the seasonal z-score correction.
SEASON_MAP: dict = {
    11: "cool", 12: "cool", 1: "cool", 2: "cool", 3: "cool", 4: "cool",
    5: "baiu",  6: "baiu",
    7: "hot",   8: "hot",   9: "hot",  10: "hot",
}


def assign_season(month: int) -> str:
    return SEASON_MAP.get(month, "unknown")


def add_seasonal_context(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add month, season, and per-index z-score columns to a longitudinal DataFrame.

    Z-scores are computed within each season group when ≥ 2 samples exist,
    otherwise fall back to the full-dataset z-score.

    Why this matters:
        Winter BI at a healthy reef is naturally ~65 % lower than summer BI
        because warm-water vocal fish and shrimp are less active in cold months.
        Without correction, a winter reading looks like a "declining" reef even
        when the reef is fine.  Z-scoring within season removes that amplitude
        shift and leaves only the cross-season health signal.

    Adds columns:
        month, season,
        {idx}_zscore        — normalised value (0 = season mean, ±1 = 1 std)
    """
    df = df.copy()
    df["month"]  = pd.to_datetime(df["session_date"]).dt.month
    df["season"] = df["month"].apply(assign_season)

    for idx in INDICES:
        if idx not in df.columns:
            continue

        # Pre-compute fallback (full-dataset) stats
        ds_mean = float(df[idx].mean())
        ds_std  = float(df[idx].std(ddof=1)) if len(df) > 1 else 1.0

        # Z-scores are computed in-sample: each observation contributes to the
        # group mean/std used to normalize itself.  With n=8 and 2 samples per
        # season, each point influences its own z-score by ~50%.  This is
        # acceptable for exploratory trend analysis but means z-scores are
        # slightly optimistic (biased toward smaller deviations).  Leave-one-out
        # normalization would remove this bias at the cost of added complexity;
        # given data scarcity (n=8) the practical effect is negligible.
        zscores: list = []
        for _, row in df.iterrows():
            group = df.loc[df["season"] == row["season"], idx]
            if len(group) >= 2:
                mu  = float(group.mean())
                sig = float(group.std(ddof=1))
                # Floor at 1% of the full-dataset std. Groups with n=2 and nearly
                # identical values (e.g. two similar baiu months) produce sig≈0,
                # which would inflate z-scores into the hundreds on any deviation.
                sig = max(sig, 0.01 * ds_std)
            else:
                mu, sig = ds_mean, ds_std
            zscores.append(round((row[idx] - mu) / sig if sig > 0 else 0.0, 4))

        df[f"{idx}_zscore"] = zscores

    return df


def run_seasonal_trend_analysis(df: pd.DataFrame) -> dict:
    """
    Run Mann-Kendall on seasonally z-scored indices.

    Z-scoring removes natural seasonal amplitude differences so the test
    reflects multi-year health trajectory rather than the calendar cycle.
    With only one year of data the correction is imperfect (season groups
    have 1–4 samples), but it already dampens large seasonal outliers like
    the winter BI crash.  Accuracy improves linearly with years of data.

    Returns the same dict structure as run_trend_analysis().
    """
    df_z = add_seasonal_context(df).sort_values("session_date").reset_index(drop=True)
    return {
        idx: mann_kendall(df_z[f"{idx}_zscore"])
        for idx in INDICES
        if f"{idx}_zscore" in df_z.columns
    }


# ── PC1-based longitudinal trend (primary method) ────────────────────────────

# Indices whose positive direction signals higher biological activity.
# PC1 is flipped if needed so that "more biology" always = higher PC1 score.
_LONGITUDINAL_HEALTH_POSITIVE = ["ACI", "BI", "NDSI"]


def _fit_longitudinal_pca(df_sorted: pd.DataFrame) -> tuple:
    """
    Fit PCA on the session-level index matrix and return PC1 projections.

    Returns:
        pc1_scores   : ndarray (n_sessions,) — each session's coordinate on PC1
        loadings     : ndarray (5,)          — how each index contributes to PC1
        var_explained: float                 — fraction of total variance in PC1
    """
    X = df_sorted[INDICES].values.astype(float)
    mu  = X.mean(axis=0)
    sig = X.std(axis=0, ddof=1)
    sig[sig == 0] = 1.0            # constant index → no information; avoid ÷0
    X_std = (X - mu) / sig

    U, s, Vt = np.linalg.svd(X_std, full_matrices=False)
    pc1_scores   = U[:, 0] * s[0]
    loadings     = Vt[0].copy()
    var_explained = float(s[0] ** 2 / (s ** 2).sum())

    # Sign convention: flip so ACI, BI, NDSI load positively
    primary_idx = [INDICES.index(c) for c in _LONGITUDINAL_HEALTH_POSITIVE]
    if loadings[primary_idx].mean() < 0:
        pc1_scores = -pc1_scores
        loadings   = -loadings

    return pc1_scores, loadings, var_explained


def run_pc1_trend_analysis(df: pd.DataFrame) -> dict:
    """
    Primary longitudinal trend method: fit global PCA → single MK on PC1.

    Fitting PCA on the pooled session matrix gives one stable PC1 axis shared
    by all sessions.  Running one MK test on that axis eliminates:
      - The multi-index voting scheme and its arbitrary 0.67 threshold.
      - The multiple-testing inflation from five correlated MK tests.
      - The double-counting of the shrimp-activity signal in ACI, BI, NDSI.

    Returns a dict with all mann_kendall() keys plus:
        var_explained : float — fraction of index variance captured by PC1.
                                Values above 0.60 confirm shrimp dominance.
        loadings      : dict  — {index_name: loading} for interpretation.
    """
    df_sorted    = df.sort_values("session_date").reset_index(drop=True)
    pc1, loadings, var_exp = _fit_longitudinal_pca(df_sorted)

    result = mann_kendall(pd.Series(pc1))
    result["var_explained"] = round(var_exp, 4)
    result["loadings"]      = {idx: round(float(l), 4)
                               for idx, l in zip(INDICES, loadings)}
    return result


def run_seasonal_pc1_trend_analysis(df: pd.DataFrame) -> dict:
    """
    Seasonal z-score the PC1 time series, then run a single MK test.

    Applies the same within-season z-scoring logic as add_seasonal_context()
    but to the scalar PC1 series rather than to five separate index columns.
    This removes the hot/cool/baiu amplitude shift from the global acoustic
    quality score before testing for a monotonic trend.
    """
    df_sorted = df.sort_values("session_date").reset_index(drop=True)
    pc1, loadings, var_exp = _fit_longitudinal_pca(df_sorted)

    # Build a small working frame for seasonal z-scoring
    work = df_sorted[["session_date"]].copy()
    work["PC1"]   = pc1
    work["month"] = pd.to_datetime(work["session_date"]).dt.month
    work["season"] = work["month"].apply(assign_season)

    ds_mean = float(work["PC1"].mean())
    ds_std  = float(work["PC1"].std(ddof=1)) if len(work) > 1 else 1.0

    zscores: list = []
    for _, row in work.iterrows():
        group = work.loc[work["season"] == row["season"], "PC1"]
        if len(group) >= 2:
            mu_s  = float(group.mean())
            sig_s = float(group.std(ddof=1))
            sig_s = max(sig_s, 0.01 * ds_std)
        else:
            mu_s, sig_s = ds_mean, ds_std
        zscores.append((row["PC1"] - mu_s) / sig_s if sig_s > 0 else 0.0)

    result = mann_kendall(pd.Series(zscores))
    result["var_explained"] = round(var_exp, 4)
    result["loadings"]      = {idx: round(float(l), 4)
                               for idx, l in zip(INDICES, loadings)}
    return result


def classify_reef_trend_pc1(mk_result: dict) -> str:
    """
    Classify overall reef trajectory from a single PC1 Mann-Kendall result.

    No voting threshold needed — the trend direction is read directly from
    the single MK test on the PC1 time series.

    Returns 'declining' | 'improving' | 'stagnant'.
    Marginal trends (p < 0.10) map to the same labels as significant ones;
    the distinction is preserved in mk_result['trend'] for the printed output.
    """
    trend = mk_result["trend"]
    if "decreasing" in trend:
        return "declining"
    if "increasing" in trend:
        return "improving"
    return "stagnant"


# ── Overall trend classification (per-index voting — retained as diagnostic) ──

def classify_reef_trend(mk_results: dict) -> str:
    """
    Derive a single reef-health trajectory label from per-index MK results.

    Voting scheme (ACI, BI, NDSI):
        Each significant index (p<0.05) contributes ±|tau| to the score,
        preserving effect size — tau=-0.95 outweighs tau=-0.41.
        Marginal indices (p<0.10) contribute ±0.5×|tau| (half weight).
        Non-significant indices contribute 0.

    Threshold (max possible score = 3.0 when all three indices have tau=1):
        score ≤ −0.67  → 'declining'   (equivalent to old 2/3 majority)
        score ≥  0.67  → 'improving'
        otherwise      → 'stagnant'

    Rationale: tau-weighted voting uses the information already computed by
    Mann-Kendall.  The 0.67 threshold (2/3 of max) preserves the original
    "2-of-3 indices must agree" spirit while rewarding stronger effect sizes.
    """
    score = 0.0
    for idx in ["ACI", "BI", "NDSI"]:
        if idx not in mk_results:
            continue
        r     = mk_results[idx]
        tau   = r["tau"]
        trend = r["trend"]
        if trend in ("increasing", "decreasing"):
            score += np.sign(tau) * abs(tau)
        elif trend in ("marginal increasing", "marginal decreasing"):
            score += np.sign(tau) * abs(tau) * 0.5

    if score <= -0.67:
        return "declining"
    if score >= 0.67:
        return "improving"
    return "stagnant"


# ── Summary printer ───────────────────────────────────────────────────────────

def print_trend_summary(
    df: pd.DataFrame,
    mk_raw: dict,
    overall_raw: str,
    mk_seasonal: Optional[dict] = None,
    overall_seasonal: Optional[str] = None,
    mk_pc1: Optional[dict] = None,
    overall_pc1: Optional[str] = None,
    mk_pc1_seasonal: Optional[dict] = None,
    overall_pc1_seasonal: Optional[str] = None,
) -> None:
    """Print PC1-primary and per-index diagnostic Mann-Kendall results."""
    print("\n" + "=" * 72)
    print("  LONGITUDINAL TREND ANALYSIS — Mann-Kendall Results")
    print("=" * 72)
    print(f"  Sessions analysed : {len(df)}")
    dates = df["session_date"].dropna()
    if len(dates) >= 2:
        print(f"  Date range        : {dates.iloc[0]}  →  {dates.iloc[-1]}")

    # ── PRIMARY: PC1-based result ─────────────────────────────────────────────
    if mk_pc1 and overall_pc1:
        print(f"\n  ══ PRIMARY — PC1 Acoustic Quality Score ══")
        print(f"     PC1 variance explained : {mk_pc1['var_explained']:.1%}")
        print(f"     PC1 loadings           : ", end="")
        print("  ".join(f"{k}={v:+.2f}" for k, v in mk_pc1["loadings"].items()))

        def _pc1_row(label: str, r: dict, overall: str) -> None:
            sig = "★" if r["p_value"] < 0.05 else ("◆" if r["p_value"] < 0.10 else " ")
            print(f"\n     {label}")
            print(f"     Overall trajectory : {overall.upper()}")
            print(f"     Trend  : {r['trend']}{sig}   tau={r['tau']:+.3f}   "
                  f"p={r['p_value']:.4f}   slope={r['slope']:.6f}/session")

        _pc1_row("Raw PC1", mk_pc1, overall_pc1)
        if mk_pc1_seasonal and overall_pc1_seasonal:
            _pc1_row("Seasonally corrected PC1 (z-scored within season)",
                     mk_pc1_seasonal, overall_pc1_seasonal)

    # ── DIAGNOSTIC: per-index results ─────────────────────────────────────────
    print(f"\n  ── DIAGNOSTIC — per-index MK (note: correlated tests) ──")
    print(f"  Note: p-values uncorrected for {len(INDICES)} simultaneous tests "
          f"(Bonferroni α = {0.05/len(INDICES):.3f}).")

    def _index_block(label: str, mk: dict, overall: str) -> None:
        print(f"\n  ── {label} (voting overall: {overall.upper()}) ──")
        print(f"  {'Index':<8} {'Mean':>8} {'Trend':<22} {'tau':>7} {'p-value':>9} {'slope/session':>14}")
        print("  " + "-" * 72)
        for idx in INDICES:
            if idx not in mk:
                continue
            r = mk[idx]
            mean_val = df[idx].mean()
            sig = "★" if r["p_value"] < 0.05 else ("◆" if r["p_value"] < 0.10 else " ")
            print(
                f"  {idx:<8} {mean_val:>8.3f} {r['trend']:<22}{sig}"
                f" {r['tau']:>7.3f} {r['p_value']:>9.4f} {r['slope']:>14.6f}"
            )
        print("  (★ = p<0.05  ◆ = p<0.10  p-values autocorrelation-corrected)")

    _index_block("Raw indices", mk_raw, overall_raw)

    if mk_seasonal and overall_seasonal:
        _index_block("Seasonally corrected (z-scored within season)",
                     mk_seasonal, overall_seasonal)
        if len(df) < 16:
            print()
            print("  NOTE: Seasonal correction is approximate with < 2 full years of data.")
            print("  Accuracy improves as SCOUT accumulates more recordings.")

    n = len(df)
    if n < 12:
        min_tau_05 = round(2.0 / (n * (n - 1) / 2) ** 0.5 * ((n * (n - 1) * (2 * n + 5) / 18) ** 0.5) / (n * (n - 1) / 2), 2)
        print()
        print(f"  POWER WARNING: n={n} sessions. Mann-Kendall requires |tau| ≥ ~0.64 for")
        print(f"  p<0.05 at n=8 — a very strong monotonic trend. 'no trend' does not mean")
        print(f"  no change; it means the available data cannot yet confirm one statistically.")
        print(f"  Marginal results (◆) indicate emerging signals worth watching.")
        print(f"  Significance and power improve substantially beyond n=12 sessions.")

    print("=" * 70)
