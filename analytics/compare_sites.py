"""
compare_sites.py
----------------
Cross-site acoustic index comparison for SCOUT.

Processes two or more recording directories, scores each independently,
then produces a side-by-side comparison report and chart.

Usage:
    python3 compare_sites.py
    python3 compare_sites.py \
        --sites "Site A (1.5m):data/raw_audio" "Site B (20m):data/raw_audio_site_b" \
        --output data/processed/comparison.png
"""

import argparse
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))

from utils.acoustic_indices import process_directory, health_score, detect_disturbances
from utils.visualize import plot_site_comparison


# Default site configurations
DEFAULT_SITES = [
    ("Site A (1.5m)", "data/raw_audio"),
    ("Site B (20m)",  "data/raw_audio_site_b"),
]


def load_or_process(label: str, audio_dir: str) -> pd.DataFrame:
    """Process a directory and return a scored DataFrame tagged with `label`."""
    print(f"\n[{label}] Processing {audio_dir} ...")
    df = process_directory(audio_dir)
    df = health_score(df)
    df = detect_disturbances(df)
    df["site"] = label
    return df


def print_comparison_table(datasets: dict) -> None:
    """Print a side-by-side summary of key statistics per site."""
    indices = ["ACI", "BI", "NDSI", "H", "ADI", "health_score"]
    col_w = 14

    header = f"{'Metric':<18}" + "".join(f"{lbl:>{col_w}}" for lbl in datasets)
    print("\n" + "=" * len(header))
    print("  CROSS-SITE COMPARISON SUMMARY")
    print("=" * len(header))
    print(header)
    print("-" * len(header))

    for idx in indices:
        row = f"  {idx:<16}"
        for df in datasets.values():
            val = df[idx].mean()
            fmt = f"{val:.3f}" if abs(val) < 1000 else f"{val:.1f}"
            row += f"{fmt:>{col_w}}"
        print(row)

    print("-" * len(header))
    print(f"  {'Disturbances':<16}" + "".join(
        f"{int(df['disturbance_detected'].sum()):>{col_w}}" for df in datasets.values()
    ))

    print("\n  Health label distribution:")
    for label, df in datasets.items():
        dist = df["health_label"].value_counts()
        parts = "  |  ".join(f"{lbl}: {cnt}" for lbl, cnt in dist.items())
        print(f"    {label}: {parts}")

    print("=" * len(header))


def main() -> None:
    parser = argparse.ArgumentParser(description="SCOUT Multi-Site Acoustic Comparison")
    parser.add_argument(
        "--sites",
        nargs="+",
        metavar="LABEL:DIR",
        help='Sites as "Label:path" pairs (default: Site A + Site B)',
    )
    parser.add_argument(
        "--output",
        default="data/processed/site_comparison.png",
        help="Output PNG path (default: data/processed/site_comparison.png)",
    )
    args = parser.parse_args()

    if args.sites:
        site_defs = []
        for spec in args.sites:
            label, path = spec.split(":", 1)
            site_defs.append((label.strip(), path.strip()))
    else:
        site_defs = DEFAULT_SITES

    print("=" * 60)
    print("  SCOUT Multi-Site Acoustic Comparison")
    print("=" * 60)

    datasets = {}
    for label, audio_dir in site_defs:
        if not Path(audio_dir).exists():
            print(f"WARNING: {audio_dir} not found — skipping {label}")
            continue
        datasets[label] = load_or_process(label, audio_dir)

    if len(datasets) < 2:
        print("Need at least 2 sites to compare. Exiting.")
        sys.exit(1)

    print_comparison_table(datasets)

    print("\nGenerating comparison chart...")
    plot_site_comparison(datasets, args.output)


if __name__ == "__main__":
    main()
