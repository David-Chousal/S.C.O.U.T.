# Analytics

Two analysis pipelines:

1. **Bioacoustic** — turns raw hydrophone recordings into reef-health indices and multi-month
   trends. Rationale in [Coral Bioacoustic Methodology](../docs/analysis/coral-bioacoustic-methodology.md).
2. **Environmental telemetry** ([`telemetry/`](telemetry)) — turns the buoy's temperature /
   turbidity / battery CSV into quality-controlled daily series, NOAA Coral Reef Watch
   thermal-stress metrics (HotSpot, Degree Heating Weeks, bleaching alert levels),
   Mann-Kendall trends, and turbidity anomaly flags. Rationale in
   [Environmental Telemetry Methodology](../docs/analysis/telemetry-methodology.md).

This README covers running the code. The telemetry pipeline's scientific core is **pure Python
standard library** (no install needed; runs on a bare Raspberry Pi); the bioacoustic pipeline
needs the dependencies below.

---

## What it does

For each WAV recording the pipeline computes five established bioacoustic indices, reduces
them to a single per-session health score via PCA, and tests for monotonic trends across
sessions.

| Index | Full name | Captures |
|---|---|---|
| **ACI** | Acoustic Complexity Index | Amplitude variability over time — biological signal irregularity |
| **BI** | Bioacoustic Index | Energy in the biological frequency band |
| **NDSI** | Normalized Difference Soundscape Index | Biological vs anthropogenic energy balance |
| **H** | Acoustic Entropy | Spectral and temporal evenness |
| **ADI** | Acoustic Diversity Index | Diversity across frequency bands |

## Layout

```
analytics/
├── run_pipeline.py       Single-session analysis → dashboard + results CSV
├── run_longitudinal.py   Multi-session trend analysis → trend chart + results CSV
├── compare_sites.py      Side-by-side comparison of two recording sites
├── utils/
│   ├── acoustic_indices.py   Index computation, PCA health score, abiotic filtering
│   ├── trend_analysis.py     Session aggregation, Mann-Kendall tests, PC1 trend
│   ├── visualize.py          Dashboard and chart generation
│   └── download_sesoko.py    Dataset retrieval helper
└── data/
    ├── longitudinal/     Per-session audio, one directory per month
    ├── raw_audio/        Bulk archive (not tracked in git)
    └── processed/        Generated CSVs and figures
```

## Setup

```bash
pip install -r requirements.txt
```

Requires Python 3.9+. The heaviest dependency is `scikit-maad`, which provides the
peer-reviewed index implementations.

## Usage

Run all commands from the `analytics/` directory — default paths are relative to it.

**Single session**

```bash
python run_pipeline.py --audio_dir data/longitudinal/201708_20170801 \
                       --output data/processed/results.csv
```

| Flag | Default | Purpose |
|---|---|---|
| `--audio_dir` | `data/raw_audio` | Directory containing `.wav` files |
| `--output` | `data/processed/results.csv` | Output CSV path |

Produces a per-file index table, a reef health classification, and a dashboard figure.

**Longitudinal trend across sessions**

```bash
python run_longitudinal.py --sessions-dir data/longitudinal \
                           --csv data/processed/longitudinal_results.csv \
                           --output data/processed/longitudinal_trend.png \
                           --skip-download
```

| Flag | Default | Purpose |
|---|---|---|
| `--sessions-dir` | `data/longitudinal` | Directory of per-session subdirectories |
| `--output` | `data/processed/longitudinal_trend.png` | Output trend chart |
| `--csv` | `data/processed/longitudinal_results.csv` | Per-session index means |
| `--skip-download` | off | Use already-present files instead of downloading |

Aggregates each session, fits one global PCA across all sessions, and runs a Hamed-Rao
modified Mann-Kendall test on the resulting PC1 time series.

**Site comparison**

```bash
python compare_sites.py --sites "Site A:data/raw_audio" "Site B:data/raw_audio_site_b" \
                        --output data/processed/site_comparison.png
```

| Flag | Default | Purpose |
|---|---|---|
| `--sites` | Site A + Site B | `Label:path` pairs |
| `--output` | `data/processed/site_comparison.png` | Output comparison chart |

> **Note** — flag naming is inconsistent across scripts: `run_pipeline.py` uses
> `--audio_dir` with an underscore, while the others use hyphenated flags. Left as-is to
> avoid breaking existing invocations; worth normalizing in a future change.

## Environmental telemetry

Analyze the buoy/shore telemetry CSV ([data-schema.md](../docs/engineering/data-schema.md)).
No dependencies required for the core; add `pymannkendall` for the autocorrelation-corrected
trend test and `matplotlib` for `--dashboard`.

```bash
# One daily file, with the site's NOAA CRW Maximum Monthly Mean SST for Degree Heating Weeks
python run_telemetry.py --source ../shore/data/SCOUT-01_20260814.csv --mmm 27.6

# A directory of daily files, plus the dashboard
python run_telemetry.py --source ../shore/data --mmm 27.6 --dashboard --out data/processed
```

| Flag | Default | Purpose |
|---|---|---|
| `--source` | — (required) | Telemetry CSV file, or a directory of daily CSVs |
| `--mmm` | none | Site Maximum Monthly Mean SST (°C) from NOAA CRW; enables DHW/bleaching alerts |
| `--out` | `data/processed` | Output directory |
| `--dashboard` | off | Also render the PNG dashboard (needs matplotlib) |

Writes `telemetry_daily.csv` (per-day temp, HotSpot, DHW, alert level, turbidity, battery) and
`telemetry_summary.json` (completeness, trends, peak thermal stress, turbidity events). Without
`--mmm` it still runs QC, aggregation, trends, and turbidity — only the DHW/bleaching stage is
skipped (undefined without a climatology).

**Live dashboard (GitHub Pages).** Add `--web <dir>` to also render a **self-contained static
`index.html`** (inline SVG charts, no external requests) that the shore Raspberry Pi can push
to GitHub Pages on a schedule — the publish loop is documented in
[Live Dashboard](../docs/engineering/live-dashboard.md).

```bash
python run_telemetry.py --source ../shore/data --mmm 27.6 --web site
```

**Multi-buoy (fleet) mode.** With `--fleet`, the source is treated as *many* buoys: records are
grouped by `buoy_id` and the full per-buoy pipeline runs for each (blending buoys into one
stream would corrupt daily means and DHW). Because buoys sit at different reefs, DHW needs a
per-site MMM — pass a JSON map with `--mmm-config` (`--mmm` is the fallback for buoys not in it).

```bash
echo '{"SCOUT-01": 27.6, "SCOUT-02": 25.5}' > sites.json
python run_telemetry.py --source ../shore/data --fleet --mmm-config sites.json --out data/fleet
```

Writes `data/fleet/<buoy_id>/{telemetry_daily.csv,telemetry_summary.json}` per buoy plus a
`fleet_summary.json` (one status row per buoy: completeness, trend, peak alert, events).

Tests (standard-library `unittest`; `pytest` also runs them):

```bash
python -m unittest discover -s telemetry/tests -t .
```

## Design decisions

These are deliberate and load-bearing — read the methodology doc before changing them.

**Three-zone frequency model.** Rather than the common two-way biological/anthropogenic
split, the pipeline uses three bands:

| Band | Range | Role |
|---|---|---|
| `ANTHRO_BAND` | 0–200 Hz | Heavy shipping and industrial machinery only |
| `MIXED_BAND` | 200–1000 Hz | Fish vocalizations and small vessels overlap — **excluded from NDSI** |
| `BIO_BAND` | 1000–8000 Hz | Invertebrate-dominated biological band |

The conventional 0–1000 Hz "anthropogenic" band misclassified reef fish choruses as noise,
which is why the mixed band is carved out and excluded rather than assigned to either side.

**PCA health score.** `health_score()` applies thin SVD to the five-index matrix per session.
PC1 is reported as the Acoustic Quality Score, with ACI, BI, and NDSI loading positively by
sign convention. **Scores are session-local and not comparable across sessions** — a global
PCA is fit separately for longitudinal work.

**PC1 Mann-Kendall trend.** `run_pc1_trend_analysis()` fits one global PCA across all
sessions and runs a single Hamed-Rao modified Mann-Kendall test on the PC1 series. This
replaced an earlier five-index voting scheme. Per-index Mann-Kendall results are retained as
diagnostics only. If Hamed-Rao returns a NaN p-value on a perfectly monotonic series, the
code falls back to `pymannkendall.original_test`.

**Median session aggregation.** Sessions aggregate by median rather than mean, for robustness
against the roughly 1-in-5 disturbance-contaminated file.

**Seasonal z-scoring.** Okinawa seasons are modeled as cool (Nov–Apr), baiu (May–Jun), and
hot (Jul–Oct). The standard deviation floor is set at 1% of dataset standard deviation to
avoid division instability in the baiu season, which has only two samples.

**Abiotic contamination filter.** `flag_abiotic_contamination()` prefers a weather-station
DataFrame with `wind_knots` and `precip_mm_hr` columns, joined within ±30 minutes. Absent
that, it falls back to an acoustic heuristic — simultaneous BI increase, ACI decrease, and H
increase — calibrated for n ≈ 20 files.

## Dataset

Recordings are from **Sesoko Island, Okinawa, Japan (Site A, 1.5 m depth)** — 8 monthly
sessions of 5 midnight recordings each, spanning August 2017 to July 2018.

**Known gap:** session `201807` contains 4 of 5 files. `SSK_Site_A_20170701_000000.wav`
failed to download. The pipeline handles n < 5 by taking the median of whatever is present.

Only session `201708_20170801` is committed to git, as a runnable sample. The full archive
is excluded by size — see the root [README](../README.md#data).

## Planned work

**Fish-Chorus Index for the 200–1000 Hz mixed band.** Either a Chorus Ratio (Staaterman et
al. 2014, [doi:10.3354/meps10911](https://doi.org/10.3354/meps10911)) or a band-limited ACI
restricted to those frequency rows. This would give PC1 an independent fish-diversity
dimension, partially decoupling the trend signal from snapping shrimp density. Not yet
implemented.
