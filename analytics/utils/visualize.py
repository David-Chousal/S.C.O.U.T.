"""
visualize.py
------------
Dashboard and time-series plots for SCOUT acoustic reef health data.

Produces a single multi-panel figure saved to data/processed/health_dashboard.png:
  Panel 1 — Composite health score over time (color-coded by label)
  Panel 2 — Individual index trends (ACI, BI, NDSI) over time
  Panel 3 — Entropy (H) and diversity (ADI) over time
  Panel 4 — Index correlation heatmap
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")   # non-interactive backend — safe for scripts
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
from pathlib import Path


LABEL_COLORS = {
    "improving": "#2ecc71",   # green
    "stagnant":  "#f39c12",   # amber
    "declining": "#e74c3c",   # red
}

INDEX_DISPLAY = {
    "ACI":  "ACI (Complexity)",
    "BI":   "BI (Bio Energy)",
    "NDSI": "NDSI (Bio/Anthro)",
    "H":    "H (Entropy)",
    "ADI":  "ADI (Diversity)",
}


def _sort_by_time(df: pd.DataFrame) -> pd.DataFrame:
    """Sort by timestamp if available, else by filename."""
    if "timestamp" in df.columns and df["timestamp"].notna().any():
        return df.sort_values("timestamp").reset_index(drop=True)
    return df.sort_values("filename").reset_index(drop=True)


def _time_axis(df: pd.DataFrame):
    """Return the best x-axis values: timestamps or integer index."""
    if "timestamp" in df.columns and df["timestamp"].notna().any():
        return pd.to_datetime(df["timestamp"]), True
    return list(range(len(df))), False


def plot_dashboard(df: pd.DataFrame, output_path: str) -> None:
    """
    Render a 4-panel health dashboard and save to output_path.

    Args:
        df:           DataFrame from acoustic_indices.health_score()
        output_path:  File path for the saved PNG.
    """
    df = _sort_by_time(df)
    x, use_datetime = _time_axis(df)

    fig, axes = plt.subplots(4, 1, figsize=(14, 18), constrained_layout=True)
    fig.suptitle(
        "SCOUT — Coral Reef Acoustic Health Dashboard\n"
        "Sesoko Island, Okinawa (Site A, 1.5 m depth)  |  June 5 2017"
        "  |  health labels are session-local comparisons only",
        fontsize=14, fontweight="bold",
    )

    # ── Panel 1: Composite health score ──────────────────────────────────────
    ax1 = axes[0]
    for label, color in LABEL_COLORS.items():
        mask = df["health_label"] == label
        ax1.scatter(
            [x[i] for i in df.index[mask]],
            df.loc[mask, "health_score"],
            color=color, label=label.capitalize(), s=80, zorder=3
        )
    ax1.plot(x, df["health_score"], color="#555", linewidth=1, zorder=2, alpha=0.6)

    # Shade background by label regions
    for i, row in df.iterrows():
        ax1.axvspan(
            x[i] if i == 0 else (x[i-1] + (x[i] - x[i-1]) / 2),
            x[i] + (x[min(i+1, len(x)-1)] - x[i]) / 2 if i < len(x)-1 else x[i],
            alpha=0.08,
            color=LABEL_COLORS[row["health_label"]]
        )

    # Disturbance markers (if column present)
    if "disturbance_detected" in df.columns:
        dist_mask = df["disturbance_detected"]
        for i in df.index[dist_mask]:
            ax1.axvline(x[i], color="#c0392b", linewidth=1.2, linestyle=":", alpha=0.8)
        if dist_mask.any():
            ax1.scatter(
                [x[i] for i in df.index[dist_mask]],
                df.loc[dist_mask, "health_score"],
                marker="v", color="#c0392b", s=120, zorder=5,
                label="Disturbance detected",
            )

    ax1.set_ylabel("Health Score (0–1)", fontsize=10)
    ax1.set_title("Composite Health Score Over Time", fontsize=11)
    ax1.legend(loc="lower left", fontsize=9)
    ax1.set_ylim(0, 1.05)
    ax1.grid(axis="y", alpha=0.3)
    ax1.axhline(df["health_score"].median(), color="#999", linestyle="--",
                linewidth=0.8, label="Median")
    if use_datetime:
        ax1.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
        ax1.set_xlabel("Local Time (UTC+9)", fontsize=9)
    else:
        ax1.set_xlabel("Recording Index", fontsize=9)

    # ── Panel 2: ACI, BI, NDSI (normalized to [0,1] for comparison) ──────────
    ax2 = axes[1]
    for col, color in [("ACI", "#3498db"), ("BI", "#9b59b6"), ("NDSI", "#1abc9c")]:
        col_min, col_max = df[col].min(), df[col].max()
        normed = (df[col] - col_min) / (col_max - col_min) if col_max > col_min else df[col] * 0 + 0.5
        ax2.plot(x, normed, marker="o", markersize=4, linewidth=1.5,
                 label=INDEX_DISPLAY[col], color=color)
    ax2.set_ylabel("Normalized Value", fontsize=10)
    ax2.set_title("Acoustic Complexity (ACI), Biological Energy (BI), Soundscape Balance (NDSI)",
                  fontsize=11)
    ax2.legend(loc="lower left", fontsize=9)
    ax2.set_ylim(-0.05, 1.15)
    ax2.grid(alpha=0.3)
    if use_datetime:
        ax2.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
        ax2.set_xlabel("Local Time (UTC+9)", fontsize=9)

    # ── Panel 3: Entropy (H) and Diversity (ADI) ─────────────────────────────
    ax3 = axes[2]
    ax3_twin = ax3.twinx()
    ax3.plot(x, df["H"], marker="s", markersize=4, linewidth=1.5,
             color="#e67e22", label="H (Entropy)")
    ax3_twin.plot(x, df["ADI"], marker="^", markersize=4, linewidth=1.5,
                  color="#16a085", label="ADI (Diversity)", linestyle="--")
    ax3.set_ylabel("H — Acoustic Entropy", fontsize=10, color="#e67e22")
    ax3_twin.set_ylabel("ADI — Acoustic Diversity", fontsize=10, color="#16a085")
    ax3.set_title("Acoustic Entropy (H) and Diversity Index (ADI)", fontsize=11)
    lines1, labels1 = ax3.get_legend_handles_labels()
    lines2, labels2 = ax3_twin.get_legend_handles_labels()
    ax3.legend(lines1 + lines2, labels1 + labels2, loc="lower left", fontsize=9)
    ax3.grid(alpha=0.3)
    if use_datetime:
        ax3.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
        ax3.set_xlabel("Local Time (UTC+9)", fontsize=9)

    # ── Panel 4: Correlation heatmap ─────────────────────────────────────────
    ax4 = axes[3]
    index_cols = ["ACI", "BI", "NDSI", "H", "ADI", "health_score"]
    corr = df[index_cols].corr()
    mask = np.triu(np.ones_like(corr, dtype=bool), k=1)   # upper triangle only
    sns.heatmap(
        corr, ax=ax4, annot=True, fmt=".2f", cmap="RdYlGn",
        center=0, vmin=-1, vmax=1,
        linewidths=0.5, square=True,
        xticklabels=[INDEX_DISPLAY.get(c, c) for c in index_cols],
        yticklabels=[INDEX_DISPLAY.get(c, c) for c in index_cols],
        cbar_kws={"shrink": 0.6}
    )
    ax4.set_title("Index Correlation Matrix", fontsize=11)
    ax4.tick_params(axis="x", rotation=30, labelsize=9)
    ax4.tick_params(axis="y", rotation=0,  labelsize=9)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Dashboard saved → {output_path}")


def plot_longitudinal_trend(
    df: pd.DataFrame,
    mk_results: dict,
    overall_trend: str,
    output_path: str,
    mk_seasonal: dict = None,
    overall_seasonal: str = None,
) -> None:
    """
    Three-panel longitudinal trend chart (two panels when no seasonal data).

    Panel 1 — Raw indices normalized per-index, with Sen's slope for significant trends.
    Panel 2 — Seasonal z-scores over time, colour-coded by season (if provided).
    Panel 3 — Side-by-side tau bar chart: raw vs. seasonal-corrected MK.
    """
    TREND_COLORS = {"increasing": "#27ae60", "decreasing": "#e74c3c", "no trend": "#95a5a6"}
    SEASON_COLORS = {"summer": "#e74c3c", "spring": "#27ae60", "winter": "#3498db", "fall": "#f39c12"}
    INDEX_COLORS = {
        "ACI": "#3498db", "BI": "#9b59b6", "NDSI": "#1abc9c",
        "H": "#e67e22", "ADI": "#e74c3c",
    }
    indices = [k for k in ["ACI", "BI", "NDSI", "H", "ADI"] if k in df.columns]
    n_panels = 3 if mk_seasonal else 2

    df_s = df.sort_values("session_date").reset_index(drop=True)
    x_dates = pd.to_datetime(df_s["session_date"])
    x_num = np.arange(len(df_s))

    label_raw = overall_trend.upper()
    label_seas = f"  |  seasonal-corrected: {overall_seasonal.upper()}" if overall_seasonal else ""
    fig, axes = plt.subplots(n_panels, 1, figsize=(14, 5 * n_panels + 1), constrained_layout=True)
    if n_panels == 2:
        axes = list(axes)
    fig.suptitle(
        f"SCOUT — Reef Health Longitudinal Trend  |  Site A (1.5 m)  |  Midnight baseline\n"
        f"Raw: {label_raw}{label_seas}   "
        f"({len(df_s)} sessions, {df_s['session_date'].min()} → {df_s['session_date'].max()})",
        fontsize=12, fontweight="bold",
    )
    ax1, ax2 = axes[0], axes[-1]

    # ── Panel 1: Raw normalized indices over time ─────────────────────────────
    for idx in indices:
        col_min, col_max = df_s[idx].min(), df_s[idx].max()
        normed = (
            (df_s[idx] - col_min) / (col_max - col_min)
            if col_max > col_min else df_s[idx] * 0 + 0.5
        )
        color = INDEX_COLORS.get(idx, "#555")
        ax1.plot(x_dates, normed, marker="o", markersize=6, linewidth=1.5,
                 label=INDEX_DISPLAY.get(idx, idx), color=color, alpha=0.85)

        r = mk_results.get(idx, {})
        if r.get("p_value", 1) < 0.05:
            scale = col_max - col_min + 1e-9
            intercept = float(normed.mean()) - r["slope"] * (len(df_s) - 1) / 2 / scale
            y_line = [intercept + r["slope"] * i / scale for i in x_num]
            ax1.plot(x_dates, y_line, linestyle="--", linewidth=1.2, color=color, alpha=0.5)

    ax1.axhspan(0, 1.05, alpha=0.03,
                color={"improving": "#27ae60", "declining": "#e74c3c", "stagnant": "#f39c12"}[overall_trend])
    ax1.set_ylabel("Normalized Value", fontsize=10)
    ax1.set_title("Raw Acoustic Index Trajectories (dashed = significant Sen's slope)", fontsize=11)
    ax1.set_ylim(-0.05, 1.15)
    ax1.legend(loc="upper left", fontsize=9, ncol=2)
    ax1.grid(alpha=0.3)
    ax1.xaxis.set_major_formatter(mdates.DateFormatter("%b %Y"))
    plt.setp(ax1.xaxis.get_majorticklabels(), rotation=30, ha="right", fontsize=8)

    # ── Panel 2 (optional): Seasonal z-scores ────────────────────────────────
    if mk_seasonal and n_panels == 3:
        ax_mid = axes[1]
        # Import here to avoid circular dependency
        from utils.trend_analysis import add_seasonal_context, INDICES as T_INDICES
        df_z = add_seasonal_context(df_s).sort_values("session_date").reset_index(drop=True)
        x_z = pd.to_datetime(df_z["session_date"])

        for idx in indices:
            col = f"{idx}_zscore"
            if col not in df_z.columns:
                continue
            color = INDEX_COLORS.get(idx, "#555")
            ax_mid.plot(x_z, df_z[col], marker="s", markersize=5, linewidth=1.5,
                        label=INDEX_DISPLAY.get(idx, idx), color=color, alpha=0.85)
            r = mk_seasonal.get(idx, {})
            if r.get("p_value", 1) < 0.05:
                z_vals = df_z[col].values
                slopes_mk = [
                    (z_vals[j] - z_vals[i]) / (j - i)
                    for i in range(len(z_vals) - 1) for j in range(i + 1, len(z_vals))
                ]
                slope = float(np.median(slopes_mk)) if slopes_mk else 0.0
                intercept = float(np.mean(z_vals)) - slope * (len(z_vals) - 1) / 2
                y_line = [intercept + slope * i for i in range(len(z_vals))]
                ax_mid.plot(x_z, y_line, linestyle="--", linewidth=1.2, color=color, alpha=0.5)

        # Shade season bands
        if "season" in df_z.columns:
            for _, row in df_z.iterrows():
                s_color = SEASON_COLORS.get(row["season"], "#aaa")
                ax_mid.axvspan(
                    x_z.iloc[max(0, list(df_z.index).index(_) - 0)],
                    x_z.iloc[min(len(x_z) - 1, list(df_z.index).index(_))],
                    alpha=0.06, color=s_color,
                )

        ax_mid.axhline(0, color="#333", linewidth=0.8, linestyle="--", alpha=0.5)
        ax_mid.axhspan(-1, 1, alpha=0.04, color="#27ae60")
        ax_mid.set_ylabel("Z-score (within season)", fontsize=10)
        ax_mid.set_title(
            "Seasonally Corrected Indices  |  0 = season mean, ±1 = 1 std dev  "
            f"(overall: {(overall_seasonal or 'N/A').upper()})",
            fontsize=11,
        )
        ax_mid.set_ylim(-3.2, 3.2)
        ax_mid.legend(loc="upper left", fontsize=9, ncol=2)
        ax_mid.grid(alpha=0.3)
        ax_mid.xaxis.set_major_formatter(mdates.DateFormatter("%b %Y"))
        plt.setp(ax_mid.xaxis.get_majorticklabels(), rotation=30, ha="right", fontsize=8)

        # Add season legend
        season_patches = [
            plt.Rectangle((0, 0), 1, 1, fc=SEASON_COLORS[s], alpha=0.4, label=s.capitalize())
            for s in ["summer", "spring", "winter", "fall"]
        ]
        ax_mid.legend(
            handles=list(ax_mid.get_legend_handles_labels()[0]) + season_patches,
            labels=list(ax_mid.get_legend_handles_labels()[1]) + [s.get_label() for s in season_patches],
            fontsize=8, loc="upper right", ncol=2,
        )

    # ── Last panel: Tau comparison bar chart ──────────────────────────────────
    bar_x = np.arange(len(indices))
    width = 0.35 if mk_seasonal else 0.6

    taus_raw = [mk_results.get(idx, {}).get("tau", 0) for idx in indices]
    pvals_raw = [mk_results.get(idx, {}).get("p_value", 1) for idx in indices]
    bars_raw = ax2.bar(
        bar_x - (width / 2 if mk_seasonal else 0),
        taus_raw,
        width,
        label="Raw",
        color=[TREND_COLORS[mk_results.get(i, {}).get("trend", "no trend")] for i in indices],
        alpha=0.85,
    )
    for bar, pv in zip(bars_raw, pvals_raw):
        if pv < 0.05:
            ax2.text(bar.get_x() + bar.get_width() / 2,
                     bar.get_height() + (0.03 if bar.get_height() >= 0 else -0.06),
                     "★", ha="center", fontsize=10, color="#c0392b")

    if mk_seasonal:
        taus_seas = [mk_seasonal.get(idx, {}).get("tau", 0) for idx in indices]
        pvals_seas = [mk_seasonal.get(idx, {}).get("p_value", 1) for idx in indices]
        bars_seas = ax2.bar(
            bar_x + width / 2, taus_seas, width,
            label="Seasonal-corrected",
            color=[TREND_COLORS[mk_seasonal.get(i, {}).get("trend", "no trend")] for i in indices],
            alpha=0.55, hatch="//",
        )
        for bar, pv in zip(bars_seas, pvals_seas):
            if pv < 0.05:
                ax2.text(bar.get_x() + bar.get_width() / 2,
                         bar.get_height() + (0.03 if bar.get_height() >= 0 else -0.06),
                         "★", ha="center", fontsize=10, color="#8e44ad")
        ax2.legend(fontsize=9, loc="upper right")

    ax2.axhline(0, color="#333", linewidth=0.8)
    ax2.set_xticks(bar_x)
    ax2.set_xticklabels([INDEX_DISPLAY.get(i, i) for i in indices], fontsize=9)
    ax2.set_ylabel("Kendall's τ  (+ = improving, − = declining)", fontsize=10)
    title_suffix = "  |  solid = raw, hatched = seasonal-corrected" if mk_seasonal else ""
    ax2.set_title(f"Mann-Kendall τ per Index  (★ = p < 0.05){title_suffix}", fontsize=11)
    ax2.set_ylim(-1.1, 1.1)
    ax2.grid(axis="y", alpha=0.3)

    legend_patches = [
        plt.Rectangle((0, 0), 1, 1, fc=TREND_COLORS["increasing"], label="Increasing"),
        plt.Rectangle((0, 0), 1, 1, fc=TREND_COLORS["decreasing"], label="Decreasing"),
        plt.Rectangle((0, 0), 1, 1, fc=TREND_COLORS["no trend"],   label="No trend"),
    ]
    ax2.legend(handles=legend_patches + (ax2.get_legend_handles_labels()[0]
               if mk_seasonal else []), fontsize=9, loc="upper right")

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Longitudinal trend chart saved → {output_path}")


def plot_site_comparison(
    datasets: dict,   # {site_label: df}  e.g. {"Site A (1.5m)": df_a, "Site B (20m)": df_b}
    output_path: str,
) -> None:
    """
    Three-panel cross-site comparison chart.

    Panel 1 — Mean index values per site (normalized to [0,1] within each index
               so that BI's absolute scale doesn't dwarf NDSI).
    Panel 2 — Health score over local time-of-day for each site on the same axis.
    Panel 3 — Box-plot distribution of each raw index by site.
    """
    indices = ["ACI", "BI", "NDSI", "H", "ADI"]
    site_colors = ["#2980b9", "#e67e22", "#27ae60", "#8e44ad"]
    labels = list(datasets.keys())

    fig, axes = plt.subplots(3, 1, figsize=(14, 16), constrained_layout=True)
    fig.suptitle(
        "SCOUT — Multi-Site Acoustic Index Comparison\n"
        "Sesoko Island, Okinawa  |  Dusk window (17:40–19:15 JST)",
        fontsize=13, fontweight="bold",
    )

    # ── Panel 1: Normalised mean index bar chart ──────────────────────────────
    ax1 = axes[0]
    x = np.arange(len(indices))
    width = 0.8 / len(labels)
    for j, (label, df) in enumerate(datasets.items()):
        means = []
        for col in indices:
            col_min, col_max = df[col].min(), df[col].max()
            normed = (df[col] - col_min) / (col_max - col_min) if col_max > col_min else df[col] * 0 + 0.5
            means.append(float(normed.mean()))
        offset = (j - len(labels) / 2 + 0.5) * width
        ax1.bar(x + offset, means, width * 0.9, label=label,
                color=site_colors[j % len(site_colors)], alpha=0.85)

    ax1.set_xticks(x)
    ax1.set_xticklabels([INDEX_DISPLAY[c] for c in indices], fontsize=9)
    ax1.set_ylabel("Normalized Mean Value", fontsize=10)
    ax1.set_title("Index Means by Site (normalized per index)", fontsize=11)
    ax1.set_ylim(0, 1.15)
    ax1.legend(fontsize=9)
    ax1.grid(axis="y", alpha=0.3)

    # ── Panel 2: Health score time-of-day overlay ─────────────────────────────
    ax2 = axes[1]
    for j, (label, df) in enumerate(datasets.items()):
        df_s = _sort_by_time(df)
        # Use time-of-day string (HH:MM) as a comparable x-axis regardless of date
        if "timestamp" in df_s.columns and df_s["timestamp"].notna().any():
            tod = pd.to_datetime(df_s["timestamp"]).dt.strftime("%H:%M")
        else:
            tod = list(range(len(df_s)))
        ax2.plot(tod, df_s["health_score"], marker="o", markersize=5,
                 linewidth=1.8, label=label, color=site_colors[j % len(site_colors)])
        if "disturbance_detected" in df_s.columns:
            for i, row in df_s[df_s["disturbance_detected"]].iterrows():
                ts = pd.to_datetime(row["timestamp"]).strftime("%H:%M") if pd.notna(row.get("timestamp")) else str(i)
                ax2.axvline(ts, color=site_colors[j % len(site_colors)],
                            linewidth=1, linestyle=":", alpha=0.6)

    ax2.set_ylabel("Health Score (0–1)", fontsize=10)
    ax2.set_xlabel("Time of Day (JST, HH:MM)", fontsize=9)
    ax2.set_title("Health Score Trajectory — Same Dusk Window by Depth", fontsize=11)
    ax2.set_ylim(0, 1.05)
    ax2.legend(fontsize=9)
    ax2.grid(alpha=0.3)
    plt.setp(ax2.xaxis.get_majorticklabels(), rotation=30, ha="right", fontsize=8)

    # ── Panel 3: Raw index distributions by site ──────────────────────────────
    ax3 = axes[2]
    all_data = []
    for label, df in datasets.items():
        for col in indices:
            col_min, col_max = df[col].min(), df[col].max()
            normed = (df[col] - col_min) / (col_max - col_min) if col_max > col_min else df[col] * 0 + 0.5
            for v in normed:
                all_data.append({"site": label, "index": INDEX_DISPLAY[col], "value": float(v)})
    plot_df = pd.DataFrame(all_data)

    if len(plot_df) > 0:
        sns.boxplot(
            data=plot_df, x="index", y="value", hue="site",
            palette=site_colors[: len(labels)], ax=ax3,
            width=0.6, fliersize=3,
        )
    ax3.set_ylabel("Normalized Value", fontsize=10)
    ax3.set_xlabel("")
    ax3.set_title("Index Distribution by Site (normalized per index)", fontsize=11)
    ax3.tick_params(axis="x", labelsize=9)
    ax3.legend(fontsize=9, title="Site")
    ax3.grid(axis="y", alpha=0.3)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Site comparison saved → {output_path}")


def plot_index_timeseries(df: pd.DataFrame, output_path: str) -> None:
    """
    Individual full-resolution time-series for each index.
    Saved as a separate PNG for detailed inspection.
    """
    df = _sort_by_time(df)
    x, use_datetime = _time_axis(df)

    indices = ["ACI", "BI", "NDSI", "H", "ADI"]
    fig, axes = plt.subplots(len(indices), 1, figsize=(14, 14), constrained_layout=True)
    fig.suptitle("SCOUT — Individual Index Time Series", fontsize=13, fontweight="bold")

    for ax, col in zip(axes, indices):
        ax.plot(x, df[col], marker="o", markersize=3, linewidth=1.5, color="#2c3e50")
        ax.fill_between(x, df[col].min(), df[col], alpha=0.15, color="#2c3e50")
        ax.set_ylabel(INDEX_DISPLAY[col], fontsize=9)
        ax.grid(alpha=0.3)
        if use_datetime:
            ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
        # Annotate min/max
        i_max = df[col].idxmax()
        i_min = df[col].idxmin()
        ax.annotate(f"max {df[col].max():.1f}", xy=(x[i_max], df[col].max()),
                    xytext=(5, 5), textcoords="offset points", fontsize=7, color="green")
        ax.annotate(f"min {df[col].min():.1f}", xy=(x[i_min], df[col].min()),
                    xytext=(5, -12), textcoords="offset points", fontsize=7, color="red")

    axes[-1].set_xlabel(
        "Local Time (UTC+9)" if use_datetime else "Recording Index", fontsize=9
    )

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Index time series saved → {output_path}")
