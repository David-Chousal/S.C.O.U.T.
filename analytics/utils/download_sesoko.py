"""
download_sesoko.py
------------------
Downloads a representative sample of WAV files from the Sesoko coral reef
dataset (Okinawa, Japan) hosted on Google Drive.

Source dataset:
  https://data.depositar.io/en/dataset/coral-reef-sesoko
  Audio folder: https://drive.google.com/drive/folders/1euUywVHE2xG6dmGdZ2eJzVkwi1dsVQKe

Usage:
    python3 download_sesoko.py --out ../data/raw_audio --limit 20

Requirements:
    pip install gdown
"""

import argparse
import subprocess
import sys
from pathlib import Path


FOLDER_ID = "1euUywVHE2xG6dmGdZ2eJzVkwi1dsVQKe"


def download_folder_sample(folder_id: str, out_dir: Path, limit: int):
    """
    Use gdown to download up to `limit` files from a Google Drive folder.
    gdown --folder downloads all files; we stop early via file count check.
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Downloading up to {limit} WAV files from Google Drive folder...")
    print(f"Folder ID : {folder_id}")
    print(f"Output    : {out_dir}\n")

    # gdown --folder pulls the entire folder structure.
    # For large folders, use --remaining-ok to tolerate partial downloads.
    cmd = [
        sys.executable, "-m", "gdown",
        "--folder",
        f"https://drive.google.com/drive/folders/{folder_id}",
        "--output", str(out_dir),
        "--remaining-ok",
    ]

    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"\nDownload error: {e}")
        print("If the folder is large, this is expected — check what was downloaded.")

    # Count what we got
    wav_files = list(out_dir.rglob("*.wav")) + list(out_dir.rglob("*.WAV"))
    print(f"\nDownloaded {len(wav_files)} WAV files.")

    # If we got more than limit, trim to limit (keep first N alphabetically)
    if len(wav_files) > limit:
        print(f"Trimming to {limit} files...")
        for f in sorted(wav_files)[limit:]:
            f.unlink()
        print(f"Kept {limit} files.")

    return sorted(out_dir.rglob("*.wav"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download Sesoko coral audio sample")
    parser.add_argument("--out",   default="../data/raw_audio", help="Output directory")
    parser.add_argument("--limit", type=int, default=20,        help="Max files to keep")
    args = parser.parse_args()

    out_path = Path(args.out).resolve()
    files = download_folder_sample(FOLDER_ID, out_path, args.limit)

    print(f"\nReady. Files in {out_path}:")
    for f in files:
        print(f"  {f.name}")
