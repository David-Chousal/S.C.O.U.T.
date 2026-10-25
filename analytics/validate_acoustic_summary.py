"""
validate_acoustic_summary.py
----------------------------
Does the buoy's acoustic summary (ADR-0010) track the shore indices it approximates?

For each recording, the first ``--seconds`` (default 60, one buoy clip) is processed twice:

* **Shore**: BI and NDSI exactly as ``utils/acoustic_indices.compute_all_indices`` computes them
  (left channel at the file's own rate, the same spectrogram settings), on the same segment.
* **Buoy**: resampled to 22,050 Hz, quantised to 12-bit ADC codes, and run through the reference
  summary in ``utils/acoustic_summary.py``, which the firmware matches bit for bit.

It writes one CSV row per recording, prints Pearson and Spearman correlations of buoy NDSI with
shore NDSI and of ``lvl_bio`` with shore BI, and draws a two-panel scatter plot.

Usage:
    python validate_acoustic_summary.py --out /tmp/acoustic-validation \\
        [--plot ../assets/diagrams/acoustic-summary-validation.png]
"""

from __future__ import annotations

import argparse
import sys
from multiprocessing import Pool
from pathlib import Path

import numpy as np
import pandas as pd
from maad import features, sound
from scipy.stats import pearsonr, spearmanr

sys.path.insert(0, str(Path(__file__).parent))

from utils.acoustic_indices import (  # noqa: E402
    ANTHRO_BAND,
    BIO_BAND,
    compute_spectrograms,
    parse_timestamp,
)
from utils.acoustic_summary import load_clip, quantize_to_adc, summarize  # noqa: E402

DEFAULT_DIRS = ("data/longitudinal",)


def _shore_indices(path: Path, seconds: float) -> dict:
    signal, rate = sound.load(str(path), channel="left", detrend=True)
    segment = signal[: int(seconds * rate)]
    sxx_amp, sxx_pwr, _, fn = compute_spectrograms(segment, rate)
    bi = features.bioacoustics_index(sxx_amp, fn, flim=BIO_BAND)
    ndsi, _, _, _ = features.soundscape_index(sxx_pwr, fn, flim_bioPh=BIO_BAND,
                                              flim_antroPh=ANTHRO_BAND)
    return {"shore_rate_hz": int(rate), "BI": float(bi), "NDSI": float(ndsi)}


def process(args: tuple[str, float]) -> dict:
    path, seconds = Path(args[0]), args[1]
    summary = summarize(quantize_to_adc(load_clip(path, seconds=seconds)))
    row = {"filename": path.name, "session": path.parent.name,
           "timestamp": parse_timestamp(path.name)}
    row.update(_shore_indices(path, seconds))
    row.update({
        "lvl_anthro_cdb": summary.lvl_anthro_cdb,
        "lvl_mixed_cdb": summary.lvl_mixed_cdb,
        "lvl_bio_cdb": summary.lvl_bio_cdb,
        "lvl_broad_cdb": summary.lvl_broad_cdb,
        "ndsi_e4": summary.ndsi_e4,
        "snap_count": summary.snap_count,
        "clip_count": summary.clip_count,
    })
    return row


def correlations(df: pd.DataFrame) -> pd.DataFrame:
    pairs = (("buoy NDSI vs shore NDSI", df["ndsi_e4"] / 10000, df["NDSI"]),
             ("lvl_bio vs shore BI", df["lvl_bio_cdb"] / 100, df["BI"]),
             ("snaps/clip vs shore BI", df["snap_count"], df["BI"]))
    rows = []
    for name, x, y in pairs:
        r, r_p = pearsonr(x, y)
        rho, rho_p = spearmanr(x, y)
        rows.append({"pair": name, "n": len(x), "pearson_r": round(r, 3), "pearson_p": r_p,
                     "spearman_rho": round(rho, 3), "spearman_p": rho_p})
    return pd.DataFrame(rows)


def plot(df: pd.DataFrame, stats: pd.DataFrame, out: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(1, 2, figsize=(10, 4.2))
    panels = ((axes[0], df["NDSI"], df["ndsi_e4"] / 10000, "Shore NDSI (maad, spectrogram)",
               "Buoy NDSI (ndsi_e4 / 10,000)", stats.iloc[0]),
              (axes[1], df["BI"], df["lvl_bio_cdb"] / 100, "Shore BI (maad)",
               "Buoy lvl_bio (dBFS)", stats.iloc[1]))
    sessions = sorted(df["session"].unique())
    colours = plt.cm.viridis(np.linspace(0, 0.9, len(sessions)))
    for ax, x, y, xlabel, ylabel, s in panels:
        for session, colour in zip(sessions, colours):
            mask = df["session"] == session
            ax.scatter(x[mask], y[mask], s=22, color=colour, label=session[:6])
        ax.set_xlabel(xlabel)
        ax.set_ylabel(ylabel)
        ax.set_title(f"Pearson r = {s.pearson_r:.2f}, Spearman ρ = {s.spearman_rho:.2f}",
                     fontsize=10)
        ax.grid(alpha=0.3)
    axes[1].legend(title="Session", fontsize=7, title_fontsize=8, loc="best")
    fig.suptitle(f"Buoy acoustic summary vs shore indices, Sesoko Site A, "
                 f"{len(df)} one-minute clips", fontsize=11)
    fig.tight_layout()
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, dpi=150)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--dirs", nargs="+", default=list(DEFAULT_DIRS),
                        help="directories searched recursively for .wav files")
    parser.add_argument("--seconds", type=float, default=60.0, help="clip length (buoy: 60 s)")
    parser.add_argument("--out", type=Path, required=True, help="output directory for the CSVs")
    parser.add_argument("--plot", type=Path, help="where to write the scatter plot (PNG)")
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()

    wavs = sorted(p for d in args.dirs for p in Path(d).rglob("*.wav"))
    if not wavs:
        sys.exit(f"no .wav files under {args.dirs}")
    with Pool(args.workers) as pool:
        rows = pool.map(process, [(str(p), args.seconds) for p in wavs])

    df = pd.DataFrame(rows).sort_values(["session", "filename"])
    stats = correlations(df)
    args.out.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out / "acoustic_summary_validation.csv", index=False)
    stats.to_csv(args.out / "acoustic_summary_correlations.csv", index=False)
    print(df.to_string(index=False))
    print()
    print(stats.to_string(index=False))
    if args.plot:
        plot(df, stats, args.plot)
        print(f"\nplot: {args.plot}")


if __name__ == "__main__":
    main()
