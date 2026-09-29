"""Run every buoy stability study and write dated results.

    python run_studies.py                 # all studies -> results/<today>/
    python run_studies.py --quick         # regression + current configuration only

Outputs (results/<YYYY-MM-DD>/):
    regression.csv            session-2026-09-29 preset vs the numbers published in stability §12
    current-summary.csv       current configuration (v6 geometry), with and without ballast
    current-mass-budget.csv   every mass line of the current configuration
    gz-curves.csv             GZ(heel) for every summarised configuration
    housing-sweep.csv         housing loaded mass 0-4 kg x cap {3.0, 1.5 v6, none} x ballast {off, on}
    cap-comparison.csv        cap height vs minimum lead, freeboard, GM, keel emergence (24 in ballast)
    ballast-depth.csv         ballast depth vs minimum lead, total mass, freeboard
    *.png                     figures
    stability-explorer.html   interactive calculator (open in any browser, no server needed)
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import math
from pathlib import Path

import numpy as np

import buoy_stability as bs

HERE = Path(__file__).resolve().parent
LEAD_MARGIN = 1.10


def write_csv(path, rows, header):
    with open(path, "w", newline="") as fh:
        w = csv.writer(fh); w.writerow(header); w.writerows(rows)


def summary_row(label, r):
    return [label, f"{r['mass_kg']:.3f}", f"{r['draft_in']:.3f}", f"{r['freeboard_in']:.3f}", f"{r['KG_in']:.3f}",
            f"{r['KB_in']:.3f}", f"{r['BM_in']:.3f}", f"{r['GM_in']:.3f}", f"{r['gz_max_in']:.3f}", r["gz_max_deg"],
            f"{r['rm_max_Nm']:.2f}", "never" if r["vanishing_deg"] is None else f"{r['vanishing_deg']:.1f}"]


SUMMARY_HEADER = ["configuration", "mass_kg", "draft_in", "freeboard_in", "KG_in", "KB_in", "BM_in", "GM_in",
                  "gz_max_in", "gz_max_deg", "rm_max_Nm", "vanishing_deg"]


def lead_for(cap, preset="current", depth=24.0):
    m = bs.min_lead(cap, preset=preset, depth_in=depth)
    return None if m is None else math.ceil(m * LEAD_MARGIN * 10) / 10


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--quick", action="store_true")
    ap.add_argument("--date", default=dt.date.today().isoformat())
    a = ap.parse_args()
    out = HERE / "results" / a.date; out.mkdir(parents=True, exist_ok=True)
    curves = {}

    # --- 1. regression against stability §12 (session-2026-09-29 inputs) ------------------
    ref = bs.solve(bs.CAP_V5_FULL, bs.build_budget(bs.CAP_V5_FULL, preset="session-2026-09-29"))
    ml = bs.min_lead(bs.CAP_IDEAL_15, preset="session-2026-09-29", depth_in=24.0)
    reg = [["v5 nominal mass (kg)", 8.19, round(ref["mass_kg"], 2)],
           ["v5 nominal draft (in)", 2.56, round(ref["draft_in"], 2)],
           ["v5 nominal GM (in)", 7.12, round(ref["GM_in"], 2)],
           ["v5 nominal vanishing angle (deg)", 90, round(ref["vanishing_deg"] or 180)],
           ["min lead, ideal 1.5 in caps, 24 in (kg)", 2.56, round(ml, 2)]]
    write_csv(out / "regression.csv", reg, ["quantity", "published_stability_s12", "recomputed"])
    curves["session: v5 full caps, no ballast"] = ref
    print("regression:", reg, flush=True)

    # --- 2. current configuration (v6 geometry) ---------------------------------------------
    lead = lead_for(bs.CAP_V6)
    rows = []
    for label, cap, bal in [("current v6: 1.5 in caps, no ballast", bs.CAP_V6, None),
                            (f"current v6: 1.5 in caps + {lead} kg lead at 24 in", bs.CAP_V6,
                             dict(lead_kg=lead, depth_in=24.0))]:
        b = bs.build_budget(cap, ballast=bal)
        r = bs.solve(cap, b); r["self_rights"] = bs.self_rights(cap, b)
        curves[label] = r; rows.append(summary_row(label, r) + [r["self_rights"]])
        if bal:
            write_csv(out / "current-mass-budget.csv",
                      [[n, f"{m:.1f}", f"{z:.2f}", f"{f:.3f}", s] for n, m, z, f, s in b] +
                      [["TOTAL", f"{sum(i[1] for i in b):.1f}", "", "", ""]],
                      ["item", "mass_g", "z_in_from_keel", "net_down_factor", "source"])
    write_csv(out / "current-summary.csv", rows, SUMMARY_HEADER + ["self_rights_from_any_angle"])
    print("current:", rows, flush=True)

    if not a.quick:
        # --- 3. housing-mass sweep ------------------------------------------------------------
        caps = [("3.0 in (v5 STEP)", bs.CAP_V5_FULL), ("1.5 in (v6 STEP)", bs.CAP_V6), ("none", bs.CAP_NONE)]
        leads = {k: lead_for(c) for k, c in caps}
        sweep, explorer = [], {}
        for key, cap in caps:
            for on in (0, 1):
                bal = dict(lead_kg=leads[key], depth_in=24.0) if on else None
                series = []
                for X in range(0, 4001, 500):
                    r = bs.solve(cap, bs.build_budget(cap, ballast=bal, housing_loaded_g=X))
                    sweep.append([key, on, X] + summary_row("", r)[1:])
                    series.append([X, round(r["mass_kg"], 3), round(r["draft_in"], 3), round(r["KG_in"], 3),
                                   round(r["KB_in"], 3), round(r["KM_in"], 3), round(r["GM_in"], 3),
                                   round(r["supported_kg"], 3), [round(g, 3) for g in r["gz_in"]]])
                explorer[f"{cap['h']}_{on}"] = series
                print("sweep", key, on, flush=True)
        write_csv(out / "housing-sweep.csv", sweep, ["cap", "ballast_on", "housing_loaded_g"] + SUMMARY_HEADER[1:])

        # --- 4. cap-height comparison with 24 in ballast ---------------------------------------
        cc = []
        for cap in [bs.CAP_NONE, {"kind": "ideal", "h": 0.75}, {"kind": "ideal", "h": 1.0}, bs.CAP_V6,
                    {"kind": "ideal", "h": 2.0}, {"kind": "ideal", "h": 2.5}, bs.CAP_V5_FULL]:
            m = bs.min_lead(cap, depth_in=24.0)
            r = bs.solve(cap, bs.build_budget(cap, ballast=dict(lead_kg=m, depth_in=24.0)))
            R0 = float(bs.hull(cap).Rz(np.array(0.0))) / bs.IN
            cc.append([cap["h"], cap["kind"], f"{m:.2f}", f"{r['mass_kg']:.2f}", f"{r['draft_in']:.2f}",
                       f"{r['freeboard_in']:.2f}", f"{r['GM_in']:.2f}",
                       f"{math.degrees(math.atan(r['draft_in'] / R0)):.1f}",
                       f"{math.degrees(math.atan(r['freeboard_in'] / 9.0)):.1f}", f"{r['hull_top_in'] + 2.5:.1f}"])
            print("cap", cap, flush=True)
        write_csv(out / "cap-comparison.csv", cc, ["cap_in", "geometry", "min_lead_kg", "mass_kg", "draft_in",
                                                  "freeboard_in", "GM_in", "keel_emerges_deg",
                                                  "hull_top_immerses_deg", "keel_to_panel_in"])

        # --- 5. ballast depth sweep (current, v6 caps) -------------------------------------------
        bd = []
        for d in (12, 16, 20, 24, 30, 36):
            m = bs.min_lead(bs.CAP_V6, depth_in=d)
            r = bs.solve(bs.CAP_V6, bs.build_budget(bs.CAP_V6, ballast=dict(lead_kg=m, depth_in=d)))
            bd.append([d, f"{m:.2f}", f"{r['mass_kg']:.2f}", f"{r['freeboard_in']:.2f}", f"{r['GM_in']:.2f}",
                       f"{m * (d - 1.8):.1f}"])
            print("depth", d, flush=True)
        write_csv(out / "ballast-depth.csv", bd, ["arm_length_in", "min_lead_kg", "mass_kg", "freeboard_in",
                                                  "GM_in", "lead_x_depth_kg_in"])
        make_figures(out, curves, cc, bd, sweep)
        make_explorer(out, explorer, leads)

    write_csv(out / "gz-curves.csv", [[k, a_, f"{g:.3f}"] for k, r in curves.items()
                                      for a_, g in zip(r["angles"], r["gz_in"])], ["configuration", "heel_deg", "gz_in"])
    print("done ->", out)


def make_figures(out, curves, cc, bd, sweep):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    # GZ curves
    fig, ax = plt.subplots(figsize=(8, 4.5))
    for k, r in curves.items():
        ax.plot(r["angles"], r["gz_in"], label=k)
    ax.axhline(0, color="k", lw=0.6); ax.set_xlabel("heel (deg)"); ax.set_ylabel("righting arm GZ (in)")
    ax.set_xlim(0, 180); ax.legend(fontsize=8); ax.grid(alpha=0.3); ax.set_title("Righting-arm curves")
    fig.tight_layout(); fig.savefig(out / "gz-curves.png", dpi=150); plt.close(fig)
    # cap comparison
    h = [float(r[0]) for r in cc]
    fig, ax = plt.subplots(1, 3, figsize=(11, 3.4))
    for axi, col, lab in zip(ax, (2, 5, 7), ("min lead (kg)", "freeboard (in)", "keel emerges (deg)")):
        axi.plot(h, [float(r[col]) for r in cc], "o-"); axi.set_xlabel("cap height (in)"); axi.set_title(lab)
        axi.axvline(1.5, color="C3", ls="--", lw=0.8); axi.grid(alpha=0.3)
    fig.suptitle("Wedge-bottom cap height with 24 in ballast (dashed: chosen 1.5 in)")
    fig.tight_layout(); fig.savefig(out / "cap-comparison.png", dpi=150); plt.close(fig)
    # ballast depth
    d = [r[0] for r in bd]
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.plot(d, [float(r[1]) for r in bd], "o-", label="min lead (kg)")
    ax.plot(d, [float(r[2]) for r in bd], "s-", label="buoy total (kg)")
    ax.axvline(24, color="C3", ls="--", lw=0.8, label="chosen 24 in")
    ax.set_xlabel("arm length / ballast depth below keel (in)"); ax.set_ylabel("kg"); ax.grid(alpha=0.3); ax.legend()
    ax.set_title("Self-righting ballast vs depth (v6, 1.5 in caps)")
    fig.tight_layout(); fig.savefig(out / "ballast-depth.png", dpi=150); plt.close(fig)
    # housing sweep: vanishing angle + GM
    fig, ax = plt.subplots(1, 2, figsize=(11, 3.8))
    keys = sorted({(r[0], r[1]) for r in sweep})
    for cap, on in keys:
        rows = [r for r in sweep if r[0] == cap and r[1] == on]
        x = [r[2] for r in rows]
        ax[0].plot(x, [float(r[9]) for r in rows], label=f"{cap}{' + ballast' if on else ''}")
        ax[1].plot(x, [180 if r[13] == "never" else float(r[13]) for r in rows], label=f"{cap}{' + ballast' if on else ''}")
    ax[0].set_title("GM (in)"); ax[1].set_title("vanishing angle (deg; 180 = self-rights)")
    for a_ in ax:
        a_.set_xlabel("housing loaded mass (g)"); a_.grid(alpha=0.3)
    ax[1].legend(fontsize=7); fig.tight_layout(); fig.savefig(out / "housing-sweep.png", dpi=150); plt.close(fig)


def make_explorer(out, data, leads):
    tpl = (HERE / "stability_explorer_template.html").read_text()
    shapes = {}
    for h, cap in (("3.0", bs.CAP_V5_FULL), ("1.5", bs.CAP_V6), ("0", bs.CAP_NONE)):
        Rz = bs.hull(cap).Rz
        zs = np.linspace(0, cap["h"] * bs.IN, 12) if cap["h"] else np.array([0.0])
        prof = [[round(float(Rz(np.array(z))) / bs.IN, 3), round(z / bs.IN, 3)] for z in zs]
        shapes[h] = dict(profile=prof, top=cap["h"] + bs.WEDGE_H)
    lead_by = {"3.0": leads["3.0 in (v5 STEP)"], "1.5": leads["1.5 in (v6 STEP)"], "0": leads["none"]}
    html = (tpl.replace("__DATA__", json.dumps({f"{k.split('_')[0]}_{k.split('_')[1]}": v for k, v in data.items()},
                                               separators=(",", ":")))
            .replace("__SHAPES__", json.dumps(shapes, separators=(",", ":")))
            .replace("__LEAD__", json.dumps(lead_by)).replace("__DATE__", out.name))
    (out / "stability-explorer.html").write_text(html)


if __name__ == "__main__":
    main()
