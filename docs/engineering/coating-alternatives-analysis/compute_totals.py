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
        "c6_application", "c7_added_mass", "c8_cost", "c9_sourcing"]
n = len(cols)
roc = [100 * sum(1 / k for k in range(i, n + 1)) / n for i in range(1, n + 1)]      # rank-order centroid, ranks 1..n
rank_sum = [100 * (n - i) / (n * (n + 1) / 2) for i in range(n)]


def by_rank(order, scheme):
    """order = criterion numbers 1..n from most to least important; returns weights in column order."""
    w = [0.0] * n
    for rank, c in enumerate(order):
        w[c - 1] = scheme[rank]
    return w


MAIN_ORDER = [1, 2, 3, 8, 9, 4, 5, 6, 7]        # waterproofing, reef safety, seams, cost, sourcing, adhesion, ...
WEIGHTS = {
    "main: ROC, reef safety 2nd, cost 4th, sourcing 5th": by_rank(MAIN_ORDER, roc),
    "reef safety ranked 1st": by_rank([2, 1, 3, 8, 9, 4, 5, 6, 7], roc),
    "rank-sum weights, same order": by_rank(MAIN_ORDER, rank_sum),
    "earlier ranking: cost and sourcing last": by_rank([1, 2, 3, 4, 5, 6, 7, 8, 9], roc),
    "equal weights": [100 / n] * n,
}


def total(r, w):
    return sum(float(r[c]) * wi for c, wi in zip(cols, w)) / 100


print("main weights (%): " + ", ".join(f"{c.split('_', 1)[0]} {x:.1f}" for c, x in zip(cols, WEIGHTS["main: ROC, reef safety 2nd, cost 4th, sourcing 5th"])))
for label, w in WEIGHTS.items():
    ranked = sorted(rows, key=lambda r: -total(r, w))
    print(f"{label}: " + " | ".join(f"{r['option']} {total(r, w):.2f}" for r in ranked))

random.seed(1)
main = WEIGHTS["main: ROC, reef safety 2nd, cost 4th, sourcing 5th"]
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
