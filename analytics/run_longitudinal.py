"""
run_longitudinal.py
-------------------
Longitudinal reef health trend analysis for SCOUT.

Downloads one 25-minute midnight sample per month from Site A (1.5 m),
averages acoustic indices per session, and runs Mann-Kendall trend tests
across all sessions to produce a genuine improving/stagnant/declining label.

Why midnight instead of dusk?
  - Only the Aug 2017 – Jul 2018 continuous-recording months have both
    midnight AND dusk data reachable.  The earlier sessions (Jun/Jul 2017)
    recorded only at dusk.
  - Using midnight gives a consistent time-of-day baseline across all 8
    sessions.  Mixing dusk and midnight would conflate depth-of-day effects
    with real health trends.
  - The midnight snapping-shrimp chorus and fish-spawning calls are just as
    ecologically valid as the dusk chorus for index-based health tracking.

Usage:
    python3 run_longitudinal.py              # download + analyse
    python3 run_longitudinal.py --skip-download  # analyse only (files present)
    python3 run_longitudinal.py --sessions-dir data/longitudinal
"""

import argparse
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))

from utils.trend_analysis import (
    build_longitudinal_df,
    run_trend_analysis,
    run_seasonal_trend_analysis,
    run_pc1_trend_analysis,
    run_seasonal_pc1_trend_analysis,
    classify_reef_trend,
    classify_reef_trend_pc1,
    print_trend_summary,
)
from utils.visualize import plot_longitudinal_trend


# ── File IDs for 5 midnight files per session ─────────────────────────────────
# Each entry: (session_label, [(drive_id, filename), ...])
SESSIONS = [
    ("201708_20170801", [
        ("1IvELbaw1fk_-WToV8vr0h8FLvXaIf9Gs", "SSK_Site_A_20170801_000000.wav"),
        ("1J2GZ_O9det6ohHEmavAAa-pzZAAHxUOT",  "SSK_Site_A_20170801_000500.wav"),
        ("1JFFfOSgm-QW7oBBMmINme4MJJZ9kjHfu",  "SSK_Site_A_20170801_001000.wav"),
        ("1JJJ-003LM6nMRzNVb38CaJ1SKM_6gldx",  "SSK_Site_A_20170801_001500.wav"),
        ("1JREOUZOH1dboj9wUl5TdSJM4vS_W1RAZ",  "SSK_Site_A_20170801_002000.wav"),
    ]),
    ("201709_20170903", [
        ("1sRY8iNOjXLH2rxHAzd--LcUUilUDJ6j3", "SSK_Site_A_20170903_000000.wav"),
        ("1s_y_edrRnnvi5YDGnfTuQ1ruoHHyn-U_",  "SSK_Site_A_20170903_000500.wav"),
        ("1sc26RF8nBZdzQmERIuean1ftCuESkx2X",  "SSK_Site_A_20170903_001000.wav"),
        ("1sqodDIK7ejtFtnotnyTzGwiJCRcuhsV5",  "SSK_Site_A_20170903_001500.wav"),
        ("1ssg2W55qBPsFbbnkzKVtLAUDoqu2dqkc",  "SSK_Site_A_20170903_002000.wav"),
    ]),
    ("201801_20180101", [
        ("1_KpiffAtO_0JJQl9noVYT0k113ukW6Yn", "SSK_Site_A_20180101_000000.wav"),
        ("1_XnsritWCaBgUEfpmjxwIkYVIEwjURd3",  "SSK_Site_A_20180101_000500.wav"),
        ("1_woI39OeT_FcrPuCaWNxPd0-KuKO03l1",  "SSK_Site_A_20180101_001000.wav"),
        ("1a1PsQGsQBIodo52cNs1DJY7A8-RpUbs3",  "SSK_Site_A_20180101_001500.wav"),
        ("1a8AjlsTPGIAZjlpXDrzpeLPOImPZwiHM",  "SSK_Site_A_20180101_002000.wav"),
    ]),
    ("201803_20180301", [
        ("1wtnoRVlM1YiXoYcTWvnLW9UfjO8pinbp", "SSK_Site_A_20180301_000000.wav"),
        ("1x558rlK8WYByJe5u5DFhghELCB_DhOGR",  "SSK_Site_A_20180301_000500.wav"),
        ("1xGET2ac8JXdRWei1RZu2_vgbYOh3tu0Y",  "SSK_Site_A_20180301_001000.wav"),
        ("1xLFZWkNrs_eeLQmuTkf58cs36nb0tvgY",  "SSK_Site_A_20180301_001500.wav"),
        ("1xWNHo6DnGT2VKGJy5WjQyaSR8ncJNdWZ",  "SSK_Site_A_20180301_002000.wav"),
    ]),
    ("201804_20180401", [
        ("1f0zKmb1YsmKAxKbCVcmnEMR1UiYfIYqF", "SSK_Site_A_20180401_000000.wav"),
        ("1f42SOPAmhkbMQQORaqlCoVqJln0H1dhR",  "SSK_Site_A_20180401_000500.wav"),
        ("1fFR2ydX1pCzTqmqzzZ5JIpCVSN67UBbG",  "SSK_Site_A_20180401_001000.wav"),
        ("1fFpLnuYn-8yOpFl8PgBahXBNx5qmJ2oD",  "SSK_Site_A_20180401_001500.wav"),
        ("1fK2XKsc-y_ABKPTJ-XQmGOuKiFUbMMS2",  "SSK_Site_A_20180401_002000.wav"),
    ]),
    ("201805_20180501", [
        ("1hrHZF7jXpTms1YN_ALXZqY9J3nU1n4iO", "SSK_Site_A_20180501_000000.wav"),
        ("1hrkOYKUanSojUW9BPqvscvMFkP-bj4Oo",  "SSK_Site_A_20180501_000500.wav"),
        ("1hxJUHY0m_oxyryW9YMIcwjGgtUG_EzNC",  "SSK_Site_A_20180501_001000.wav"),
        ("1hzeeo1KO2y1AdHj9V6IiceeIL5ig8pJM",  "SSK_Site_A_20180501_001500.wav"),
        ("1i3UTZcXl26rtcwP69R9cQtd9Kz32AwFG",  "SSK_Site_A_20180501_002000.wav"),
    ]),
    ("201806_20180601", [
        ("1OM14bLw2-0blrloekbw_NdnTDy4dqIfo", "SSK_Site_A_20180601_000000.wav"),
        ("1OTx2XASZC6YR1KUPhiiHctEitwjaJDWO",  "SSK_Site_A_20180601_000500.wav"),
        ("1OWgUVVKbUVK0TKkN0eKGjteGs-s7_O6h",  "SSK_Site_A_20180601_001000.wav"),
        ("1OcC3C_Ea11qedtjb81wDreKHF-IF6eEK",  "SSK_Site_A_20180601_001500.wav"),
        ("1OjmTVVpUT7w64-u9SFWLtoHvoZYFvdMR",  "SSK_Site_A_20180601_002000.wav"),
    ]),
    ("201807_20180701", [
        ("1xDB4PQeevxdVTIzWUIhK5geZscxpY--J", "SSK_Site_A_20180701_000000.wav"),
        ("1xFQuVrPP8fjRFwF_P0lWpgAw-Zp6s6gc",  "SSK_Site_A_20180701_000500.wav"),
        ("1xKS7KH5QVUqDDL20QJucHujZapa0NPeA",  "SSK_Site_A_20180701_001000.wav"),
        ("1xKvVxiv4muunA9_n3ye47WIWY16fpJYC",  "SSK_Site_A_20180701_001500.wav"),
        ("1xNMMSs4Sl89OVB4CNL2s0gYx0H19LQIQ",  "SSK_Site_A_20180701_002000.wav"),
    ]),
]


def download_sessions(sessions_dir: Path) -> None:
    """Download all session files that are not already present, with retry."""
    import gdown
    import time

    total = sum(len(files) for _, files in SESSIONS)
    downloaded = 0

    for session_label, files in SESSIONS:
        session_dir = sessions_dir / session_label
        session_dir.mkdir(parents=True, exist_ok=True)
        for fid, fname in files:
            dest = session_dir / fname
            if dest.exists():
                downloaded += 1
                continue
            url = f"https://drive.google.com/uc?id={fid}"
            ok = False
            for attempt in range(3):
                try:
                    ok = gdown.download(url, str(dest), quiet=True)
                    if ok:
                        break
                except Exception:
                    pass
                if attempt < 2:
                    wait = 15 * (attempt + 1)
                    print(f"  [{downloaded+1:02d}/{total}] {fname} ... rate-limited, waiting {wait}s")
                    time.sleep(wait)
            status = "OK" if ok else "FAILED (skipped)"
            downloaded += 1
            print(f"  [{downloaded:02d}/{total}] {fname} ... {status}")
            # Small courtesy pause between files to avoid rate limits
            time.sleep(2)


def main() -> None:
    parser = argparse.ArgumentParser(description="SCOUT Longitudinal Trend Analysis")
    parser.add_argument(
        "--sessions-dir",
        default="data/longitudinal",
        help="Directory for session subdirectories (default: data/longitudinal)",
    )
    parser.add_argument(
        "--output",
        default="data/processed/longitudinal_trend.png",
        help="Output PNG path",
    )
    parser.add_argument(
        "--csv",
        default="data/processed/longitudinal_results.csv",
        help="Output CSV path for per-session index means",
    )
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Skip downloading; use already-present files",
    )
    args = parser.parse_args()

    sessions_dir = Path(args.sessions_dir)

    print("=" * 62)
    print("  SCOUT Longitudinal Reef Health Analysis")
    print("=" * 62)
    print(f"  Sessions  : {len(SESSIONS)} months  (Aug 2017 – Jul 2018)")
    print(f"  Window    : midnight baseline (00:00–00:20, 5 files × 5 min)")
    print(f"  Data dir  : {sessions_dir}")
    print()

    if not args.skip_download:
        print("Downloading session files (~2 GB, skipping already-present)...")
        download_sessions(sessions_dir)
        print()

    print("Computing per-session acoustic indices...")
    df = build_longitudinal_df(str(sessions_dir))

    Path(args.csv).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.csv, index=False)
    print(f"Session means saved → {args.csv}")

    mk_raw           = run_trend_analysis(df)
    mk_seasonal      = run_seasonal_trend_analysis(df)
    mk_pc1           = run_pc1_trend_analysis(df)
    mk_pc1_seasonal  = run_seasonal_pc1_trend_analysis(df)

    overall_raw          = classify_reef_trend(mk_raw)
    overall_seasonal     = classify_reef_trend(mk_seasonal)
    overall_pc1          = classify_reef_trend_pc1(mk_pc1)
    overall_pc1_seasonal = classify_reef_trend_pc1(mk_pc1_seasonal)

    print_trend_summary(
        df, mk_raw, overall_raw,
        mk_seasonal=mk_seasonal, overall_seasonal=overall_seasonal,
        mk_pc1=mk_pc1, overall_pc1=overall_pc1,
        mk_pc1_seasonal=mk_pc1_seasonal, overall_pc1_seasonal=overall_pc1_seasonal,
    )

    print("\nGenerating longitudinal trend chart...")
    plot_longitudinal_trend(
        df, mk_raw, overall_raw, args.output,
        mk_seasonal=mk_seasonal,
        overall_seasonal=overall_seasonal,
    )


if __name__ == "__main__":
    main()
