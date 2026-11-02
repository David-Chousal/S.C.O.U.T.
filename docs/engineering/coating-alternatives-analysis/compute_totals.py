"""Weighted totals, weighting sensitivity and a no-evidence robustness check for the coating alternatives analysis.

Run: python3 compute_totals.py            (reads scores.csv in this folder; standard library only)
Re-score by editing scores.csv (and the evidence in README.md), then rerun.
"""
import csv
import random
from pathlib import Path

HERE = Path(__file__).resolve().parent
rows = list(csv.DictReader((HERE / "scores.csv").open()))
cols = ["c1_waterproofing", "c2_reef_safety", "c3_seam_sealing", "c4_petg_adhesion", "c5_flexibility",
        "c6_application", "c7_added_mass", "c8_cost"]
n = len(cols)
roc = [100 * sum(1 / k for k in range(i, n + 1)) / n for i in range(1, n + 1)]      # rank-order centroid, ranks 1..n
rank_sum = [100 * (n - i) / (n * (n + 1) / 2) for i in range(n)]
WEIGHTS = {
    "main: ROC, reef safety ranked 2nd (34/22/15/11/8/5/3/2)": [34, 22, 15, 11, 8, 5, 3, 2],
    "reef safety ranked 1st": [22, 34, 15, 11, 8, 5, 3, 2],
    "rank-sum weights, reef safety 2nd": rank_sum,
    "equal weights": [100 / n] * n,
}


def total(r, w):
    return sum(float(r[c]) * wi for c, wi in zip(cols, w)) / 100


for label, w in WEIGHTS.items():
    ranked = sorted(rows, key=lambda r: -total(r, w))
    print(f"{label}: " + " | ".join(f"{r['option']} {total(r, w):.2f}" for r in ranked))

random.seed(1)
main = WEIGHTS["main: ROC, reef safety ranked 2nd (34/22/15/11/8/5/3/2)"]
first = {r["option"]: 0 for r in rows}
N = 20000
for _ in range(N):
    sim = []
    for r in rows:
        s = dict(r)
        for cell in filter(None, r["no_evidence_cells"].split(";")):
            s[cols[int(cell[1]) - 1]] = random.randint(1, 4)       # unknown could be anywhere from 1 to 4
        sim.append(s)
    first[max(sim, key=lambda s: total(s, main))["option"]] += 1
print("share of runs first when every no-evidence cell is any of 1 to 4: " +
      " | ".join(f"{k} {100 * v / N:.0f}%" for k, v in first.items()))
