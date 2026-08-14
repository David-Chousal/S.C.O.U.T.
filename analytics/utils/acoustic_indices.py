"""
acoustic_indices.py
-------------------
Computes bioacoustic indices from WAV files for coral reef health assessment.

Indices computed:
  - ACI   : Acoustic Complexity Index      — proxy for biodiversity / biological activity
  - BI    : Bioacoustic Index              — energy in the biological frequency band
  - NDSI  : Normalized Difference Soundscape Index — bio vs. anthrop. noise ratio
  - Ht    : Temporal Entropy               — variation in energy over time
  - H     : Combined Acoustic Entropy      — overall soundscape complexity
  - ADI   : Acoustic Diversity Index       — diversity of frequency-band activity
"""

import re
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Optional
from maad import sound, features
from pathlib import Path


# ── Frequency band definitions (Hz) ──────────────────────────────────────────
#
# Three-zone spectrum model (Duarte et al., 2021; Tricas & Boyle, 2014):
#
#   ANTHRO_BAND   0 – 200 Hz   : Heavy shipping, industrial machinery.
#                                 Clearly anthropogenic — no reef species vocalize
#                                 exclusively here.
#
#   MIXED_BAND  200 – 1000 Hz  : Ambiguous overlap zone.
#                                 Most vocalizing coral reef fishes (groupers,
#                                 damselfish, squirrelfish) call between 100–800 Hz,
#                                 which overlaps with small-vessel engine harmonics.
#                                 Using this band as "anthropogenic" would cause a
#                                 healthy spawning chorus to drive NDSI *down* and
#                                 falsely trigger the disturbance flag.
#                                 → Excluded from NDSI.
#
#                                 FUTURE WORK — Fish-Chorus Index:
#                                 When fish diversity tracking is added, compute
#                                 one of the following on this band exclusively:
#
#                                 1. Chorus Ratio (CR): ratio of chorus-active
#                                    time bins to total time bins within the band.
#                                    Sensitive to diel and seasonal spawning events.
#                                    See Staaterman et al. (2014) Mar. Ecol. Prog.
#                                    Ser. 508:17–32. doi:10.3354/meps10911
#
#                                 2. Band-limited ACI (ACI_fish): apply the standard
#                                    ACI algorithm restricted to 200–1000 Hz frequency
#                                    rows of the spectrogram.  Tracks temporal
#                                    complexity of fish calls independently of the
#                                    invertebrate-dominated BIO_BAND.
#
#                                 Either metric would give PC1 an independent fish-
#                                 diversity dimension, partially decoupling the
#                                 longitudinal trend signal from shrimp density alone.
#
#   BIO_BAND   1000 – 8000 Hz  : Invertebrate-dominated biological band.
#                                 Snapping shrimp (Alpheidae spp.) dominate 2–20 kHz;
#                                 no significant anthropogenic source occupies this
#                                 range at typical vessel traffic levels.
#
BIO_BAND    = (1000, 8000)   # used for BI and NDSI bio component
ANTHRO_BAND = (0,    200)    # used for NDSI anthro component — heavy shipping only
MIXED_BAND  = (200, 1000)    # fish-vocal / small-vessel overlap — excluded from NDSI


def parse_timestamp(filename: str) -> Optional[datetime]:
    """
    Extract datetime from Sesoko-style filenames:
        SSK_Site_A_YYYYMMDD_HHMMSS.wav

    Returns a datetime object, or None if the pattern is not found.
    """
    match = re.search(r"(\d{8})_(\d{6})", filename)
    if not match:
        return None
    try:
        return datetime.strptime(match.group(1) + match.group(2), "%Y%m%d%H%M%S")
    except ValueError:
        return None


def load_audio(wav_path: str, target_sr: int = 22050):
    """Load a WAV file. Returns (signal, sample_rate)."""
    s, sr = sound.load(wav_path, sr=target_sr, mono=True)
    return s, sr


def compute_spectrograms(s, sr: int):
    """
    Compute amplitude and power spectrograms.

    ACI, BI, ADI expect amplitude.
    NDSI (soundscape_index) expects power.
    Returns (Sxx_amplitude, Sxx_power, tn, fn)
    """
    Sxx_amp, tn, fn, _ = sound.spectrogram(
        s, sr, nperseg=1024, noverlap=512, mode="amplitude"
    )
    Sxx_pwr, _,  _,  _ = sound.spectrogram(
        s, sr, nperseg=1024, noverlap=512, mode="psd"
    )
    return Sxx_amp, Sxx_pwr, tn, fn


def compute_all_indices(wav_path: str, target_sr: int = 22050) -> dict:
    """
    Compute all bioacoustic indices for a single WAV file.

    Returns a dict with keys:
        filename, duration_s, ACI, BI, NDSI, Ht, H, ADI
    """
    path = Path(wav_path)
    s, sr = load_audio(str(path), target_sr=target_sr)
    Sxx_amp, Sxx_pwr, tn, fn = compute_spectrograms(s, sr)

    duration = len(s) / sr

    # ACI — Acoustic Complexity Index (uses amplitude spectrogram)
    # Returns: ACI_xx (2d), ACI_per_bin (1d), ACI_sum (scalar)
    _, _, aci_sum = features.acoustic_complexity_index(Sxx_amp)

    # BI — Bioacoustic Index (energy in biological frequency band)
    # Returns: scalar
    bi = features.bioacoustics_index(Sxx_amp, fn, flim=BIO_BAND)

    # NDSI — Normalized Difference Soundscape Index (uses power spectrogram)
    # Returns: NDSI, ratioBA, antroPh, bioPh
    ndsi, _, _, _ = features.soundscape_index(
        Sxx_pwr, fn,
        flim_bioPh=BIO_BAND,
        flim_antroPh=ANTHRO_BAND
    )

    # Temporal Entropy — variation of energy envelope over time
    # Returns: scalar
    Ht = features.temporal_entropy(s)

    # Spectral Entropy — returns 6 values; EPS (spectral entropy) is index [3]
    # EAS=energy spread, ECU=spectral flatness, ECV=coeff variation, EPS=entropy
    _se = features.spectral_entropy(Sxx_amp, fn)
    assert len(_se) == 6, f"maad.spectral_entropy returned {len(_se)} values, expected 6"
    _, _, _, Hf, _, _ = _se

    # Combined entropy
    H = float(Ht) * float(Hf)

    # ADI — Acoustic Diversity Index (diversity of active frequency bands)
    # Returns: scalar
    adi = features.acoustic_diversity_index(Sxx_amp, fn)

    ts = parse_timestamp(path.name)

    return {
        "filename":   path.name,
        "timestamp":  ts,
        "duration_s": round(duration, 2),
        "ACI":        round(float(aci_sum), 4),
        "BI":         round(float(bi),      4),
        "NDSI":       round(float(ndsi),    4),
        "Ht":         round(float(Ht),      4),
        "H":          round(float(H),       4),
        "ADI":        round(float(adi),     4),
    }


def process_directory(audio_dir: str, output_csv: str = None) -> pd.DataFrame:
    """
    Compute indices for all WAV files in a directory.

    Args:
        audio_dir:  Path to folder containing .wav files.
        output_csv: If provided, saves results to this CSV path.

    Returns:
        DataFrame with one row per file.
    """
    audio_dir = Path(audio_dir)
    wav_files = sorted(audio_dir.glob("*.wav")) + sorted(audio_dir.glob("*.WAV"))

    if not wav_files:
        raise FileNotFoundError(f"No WAV files found in {audio_dir}")

    print(f"Found {len(wav_files)} WAV files. Processing...")
    rows = []
    for i, wav in enumerate(wav_files, 1):
        print(f"  [{i}/{len(wav_files)}] {wav.name}", end=" ... ", flush=True)
        try:
            row = compute_all_indices(str(wav))
            rows.append(row)
            print("OK")
        except Exception as e:
            print(f"FAILED ({e})")

    df = pd.DataFrame(rows)

    if output_csv:
        df.to_csv(output_csv, index=False)
        print(f"\nResults saved to: {output_csv}")

    return df


def detect_disturbances(
    df: pd.DataFrame,
    ndsi_z_threshold: float = -2.0,
    bi_z_threshold: float = -2.0,
) -> pd.DataFrame:
    """
    Flag recordings that show anomalous anthropogenic noise as disturbance events.

    Uses z-score outlier detection on NDSI (soundscape balance) and BI
    (biological energy).  A boat or motor signature appears as both dropping
    sharply relative to the rest of the dataset.  A recording is flagged when
    either index falls more than |threshold| standard deviations below the mean.

    Threshold rationale: -2.0σ (OR) gives ~2.3% false-positive rate per index
    under a normal distribution.  The previous -1.5σ threshold produced ~13%
    false positives across both indices, generating 2–3 spurious alerts per
    20-file session on clean data.

    Adds two columns:
        disturbance_score   : float [0, 1] — higher = stronger disturbance signal
        disturbance_detected: bool         — True when threshold is exceeded
    """
    df = df.copy()

    ndsi_z = (df["NDSI"] - df["NDSI"].mean()) / df["NDSI"].std()
    bi_z   = (df["BI"]   - df["BI"].mean())   / df["BI"].std()

    # Invert so that negative z-scores (anomalously low) raise the score.
    # Clip at 0 — values above mean don't contribute — then scale to [0, 1].
    ndsi_contrib = np.clip(-ndsi_z / 2.0, 0.0, 1.0)
    bi_contrib   = np.clip(-bi_z   / 2.0, 0.0, 1.0)

    df["disturbance_score"]    = (0.6 * ndsi_contrib + 0.4 * bi_contrib).round(4)
    df["disturbance_detected"] = (ndsi_z < ndsi_z_threshold) | (bi_z < bi_z_threshold)

    return df


_SCORE_COLS = ["ACI", "BI", "NDSI", "H", "ADI"]

# Indices whose positive direction signals higher biological activity.
# Used to determine the sign convention for PC1 — if the mean loading
# across these three is negative, PC1 is flipped so that "more biology"
# always maps to a higher health_score.
_HEALTH_POSITIVE = ["ACI", "BI", "NDSI"]


def health_score(df: pd.DataFrame) -> pd.DataFrame:
    """
    Derive an Acoustic Quality score from the five indices using PCA.

    Replaces the previous heuristic-weighted composite, which was effectively
    a redundant snapping-shrimp counter: ACI, BI, and NDSI (75% of the old
    weight) are all dominated by Alpheidae activity above 1 kHz and are
    highly correlated.  Assigning arbitrary weights to correlated variables
    does not separate signal; it amplifies the dominant covariance structure
    while burying less-correlated indices like H and ADI.

    PCA approach:
        1. Standardise all five indices to zero mean and unit variance within
           the session, making them dimensionally comparable.
        2. Compute PC1 via thin SVD on the standardised matrix.  PC1 is the
           direction of maximum variance — the axis that best separates
           recordings along the dominant acoustic dimension.  When indices are
           correlated (as they are here), PC1 captures their shared variance
           without double-counting it.
        3. Sign-correct PC1 so that higher scores always mean higher biological
           activity (ACI, BI, NDSI all load positively).

    Outputs added to the DataFrame:
        health_score          : float  — PC1 coordinate; centred at ~0, no
                                         fixed upper bound.  Higher = healthier.
        health_label          : str    — 'improving' | 'stagnant' | 'declining'
                                         (relative to session median ± 0.5 σ).
        pc1_variance_explained: float  — fraction of total index variance in PC1.
                                         Values above 0.60 confirm strong index
                                         covariance (shrimp dominance).
        {idx}_loading         : float  — PC1 loading for each index; shows which
                                         indices drive the score this session.

    IMPORTANT — session-local comparison only:
        PCA is fitted on each session independently.  health_score and
        health_label must NOT be compared across sessions or pipeline runs.

    References:
        Bradfer-Lawrence et al. (2019) Methods in Ecology and Evolution
            10(10):1796–1807.  https://doi.org/10.1111/2041-210X.13254
        Bohnenstiehl et al. (2018) — index redundancy / shrimp dominance.
    """
    df = df.copy()

    if len(df) < 2:
        # Degenerate session — PCA undefined; fill neutrals.
        df["health_score"]           = 0.0
        df["pc1_variance_explained"] = float("nan")
        df["health_label"]           = "stagnant"
        for col in _SCORE_COLS:
            df[f"{col}_loading"] = float("nan")
        return df

    X = df[_SCORE_COLS].values.astype(float)

    # ── 1. Standardise ────────────────────────────────────────────────────────
    mu  = X.mean(axis=0)
    sig = X.std(axis=0, ddof=1)
    sig[sig == 0] = 1.0          # constant column → no information; avoid ÷0
    X_std = (X - mu) / sig       # shape (n, 5), each column ~ N(0,1)

    # ── 2. PCA via thin SVD ───────────────────────────────────────────────────
    # X_std is already column-centred by construction.
    # SVD: X_std = U Σ Vᵀ  →  PC1 scores = U[:,0] * Σ[0]
    #                         PC1 loadings = Vᵀ[0]
    U, s, Vt = np.linalg.svd(X_std, full_matrices=False)

    pc1_scores = U[:, 0] * s[0]        # (n,)
    loadings   = Vt[0].copy()          # (5,) — contribution of each index to PC1
    var_explained = float(s[0] ** 2 / (s ** 2).sum())

    # ── 3. Sign convention ────────────────────────────────────────────────────
    # SVD is sign-ambiguous.  Flip so that the primary health indices
    # (ACI, BI, NDSI) load positively — ensuring higher PC1 = healthier.
    primary_idx = [_SCORE_COLS.index(c) for c in _HEALTH_POSITIVE]
    if loadings[primary_idx].mean() < 0:
        pc1_scores = -pc1_scores
        loadings   = -loadings

    # ── 4. Write outputs ──────────────────────────────────────────────────────
    df["health_score"]            = pc1_scores
    df["pc1_variance_explained"]  = round(var_explained, 4)
    for col, loading in zip(_SCORE_COLS, loadings):
        df[f"{col}_loading"] = round(float(loading), 4)

    # ── 5. Classify relative to session PC1 distribution ─────────────────────
    median = float(np.median(pc1_scores))
    std    = float(np.std(pc1_scores, ddof=1))

    def classify(score: float) -> str:
        if std == 0:
            return "stagnant"
        if score >= median + 0.5 * std:
            return "improving"
        if score <= median - 0.5 * std:
            return "declining"
        return "stagnant"

    df["health_label"] = [classify(float(s)) for s in pc1_scores]
    return df


def flag_abiotic_contamination(
    df: pd.DataFrame,
    weather_df: Optional[pd.DataFrame] = None,
    wind_knots_threshold: float = 15.0,
    precip_mm_hr_threshold: float = 2.0,
) -> pd.DataFrame:
    """
    Flag recordings likely contaminated by wind or rain noise.

    At 1.5 m depth, heavy rain and high winds dominate the spectrogram:
      - Rain generates broadband energy across 1–8 kHz, artificially inflating BI.
      - Wind-driven surface turbulence produces low-frequency rumble, suppressing ACI
        (constant noise → low temporal variability → low ACI despite high amplitude).
      - Both effects corrupt all five indices and must be excluded from baselines.

    Two detection paths:

    PRIMARY — weather station data (recommended):
        Pass a DataFrame with columns:
            timestamp   : datetime-like — observation time
            wind_knots  : float         — wind speed
            precip_mm_hr: float         — precipitation rate
        Recordings are joined to the nearest weather observation (±30 min window)
        and flagged when wind > wind_knots_threshold OR precip > precip_mm_hr_threshold.

    FALLBACK — acoustic heuristic (no weather data):
        Detects the characteristic abiotic signature within the session:
            high BI   (broadband rain/wind energy inflates the biological-band integral)
          + low ACI   (constant noise is temporally smooth → low complexity score)
          + high H    (flat broadband spectrum → high entropy)
        A recording is flagged when all three z-scores exceed their thresholds
        simultaneously.  This combination is rarely produced by biological activity
        alone and is consistent with rain or high-wind contamination.

    Adds two columns:
        abiotic_flag  : bool — True when contamination is suspected
        abiotic_reason: str  — 'weather_station' | 'acoustic_heuristic' | ''
    """
    df = df.copy()

    if weather_df is not None:
        # ── Weather station path ──────────────────────────────────────────────
        wx = weather_df.copy()
        wx["timestamp"] = pd.to_datetime(wx["timestamp"])
        wx = wx.sort_values("timestamp").reset_index(drop=True)

        rec_ts = pd.to_datetime(df["timestamp"]).sort_values()
        merged = pd.merge_asof(
            df.assign(_sort_ts=pd.to_datetime(df["timestamp"])).sort_values("_sort_ts"),
            wx[["timestamp", "wind_knots", "precip_mm_hr"]],
            left_on="_sort_ts", right_on="timestamp",
            direction="nearest",
            tolerance=pd.Timedelta("30min"),
        ).drop(columns=["_sort_ts", "timestamp_y"], errors="ignore")

        wind_flag  = merged["wind_knots"].fillna(0)  > wind_knots_threshold
        precip_flag = merged["precip_mm_hr"].fillna(0) > precip_mm_hr_threshold
        contaminated = wind_flag | precip_flag

        df["abiotic_flag"]   = contaminated.values
        df["abiotic_reason"] = ["weather_station" if f else "" for f in contaminated]

    else:
        # ── Acoustic heuristic fallback ───────────────────────────────────────
        def _zscore(col: pd.Series) -> pd.Series:
            s = col.std(ddof=1)
            return (col - col.mean()) / s if s > 0 else col * 0

        bi_z  =  _zscore(df["BI"])    # high = rain inflating energy
        aci_z = -_zscore(df["ACI"])   # high = ACI depressed (inverted)
        h_z   =  _zscore(df["H"])     # high = flat/entropic spectrum

        contaminated = (bi_z > 1.5) & (aci_z > 1.5) & (h_z > 1.5)
        df["abiotic_flag"]   = contaminated
        df["abiotic_reason"] = ["acoustic_heuristic" if f else "" for f in contaminated]

    return df
