"""
run_pipeline.py
---------------
Main entry point. Runs the full acoustic analysis pipeline:
    1. Load WAV files from data/raw_audio/
    2. Compute bioacoustic indices for each file
    3. Derive composite health scores
    4. Save results to data/processed/results.csv
    5. Print a summary report

Usage:
    python3 run_pipeline.py
    python3 run_pipeline.py --audio_dir /path/to/wavs --output results.csv
"""

import argparse
import sys
import pandas as pd
from pathlib import Path

# Make utils importable when run from the analytics/ root
sys.path.insert(0, str(Path(__file__).parent))

from utils.acoustic_indices import process_directory, health_score, detect_disturbances
from utils.visualize import plot_dashboard, plot_index_timeseries


def main():
    parser = argparse.ArgumentParser(description="SCOUT Acoustic Health Pipeline")
    parser.add_argument(
        "--audio_dir",
        default="data/raw_audio",
        help="Directory containing .wav files (default: data/raw_audio)"
    )
    parser.add_argument(
        "--output",
        default="data/processed/results.csv",
        help="Output CSV path (default: data/processed/results.csv)"
    )
    args = parser.parse_args()

    audio_dir = Path(args.audio_dir)
    output    = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)

    # ── Step 1 & 2: Load and compute indices ──────────────────────────────────
    print("=" * 60)
    print("  SCOUT Acoustic Reef Health Pipeline")
    print("=" * 60)

    df = process_directory(str(audio_dir), output_csv=None)

    if df.empty:
        print("No files processed. Exiting.")
        sys.exit(1)

    # ── Step 3: Health scoring + disturbance detection ───────────────────────
    print("\nComputing health scores...")
    df = health_score(df)
    df = detect_disturbances(df)

    # ── Step 4: Save ──────────────────────────────────────────────────────────
    df.to_csv(output, index=False)
    print(f"Results saved → {output}")

    # ── Step 4b: Visualize ────────────────────────────────────────────────────
    processed_dir = Path(args.output).parent
    print("\nGenerating visualizations...")
    plot_dashboard(df, str(processed_dir / "health_dashboard.png"))
    plot_index_timeseries(df, str(processed_dir / "index_timeseries.png"))

    # ── Step 5: Summary report ────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  SUMMARY REPORT")
    print("=" * 60)
    print(f"  Files analyzed  : {len(df)}")
    print(f"  Mean ACI        : {df['ACI'].mean():.2f}")
    print(f"  Mean BI         : {df['BI'].mean():.2f}")
    print(f"  Mean NDSI       : {df['NDSI'].mean():.3f}  (range: -1 to +1)")
    print(f"  Mean H          : {df['H'].mean():.3f}")
    print(f"  Mean health score: {df['health_score'].mean():.3f}")
    print()
    print("  Health label distribution:")
    for label, count in df["health_label"].value_counts().items():
        pct = 100 * count / len(df)
        print(f"    {label:<12} : {count} files ({pct:.0f}%)")
    print()
    print("  Top 5 files by health score:")
    top = df.nlargest(5, "health_score")[["filename", "health_score", "health_label"]]
    for _, row in top.iterrows():
        print(f"    {row['filename']:<40} {row['health_score']:.3f}  [{row['health_label']}]")
    print()
    flagged = df[df["disturbance_detected"]]
    print(f"  Disturbance events detected : {len(flagged)}")
    if not flagged.empty:
        for _, row in flagged.iterrows():
            ts = row["timestamp"].strftime("%H:%M") if pd.notna(row["timestamp"]) else "?"
            print(f"    {row['filename']:<40} score={row['disturbance_score']:.3f}  [{ts}]")
    print("=" * 60)


if __name__ == "__main__":
    main()
