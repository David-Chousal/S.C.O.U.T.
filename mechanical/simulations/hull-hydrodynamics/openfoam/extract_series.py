"""Roll and heave time series, peak table and decay fit for the Test Assembly 10 CFD cases.

Usage: python extract_series.py OUTDIR CASE_DIR [CASE_DIR ...]   (needs numpy, matplotlib)
Reads each case's log.interFoam (a restarted log is fine: the last value logged for a time wins) and writes
OUTDIR/<case>-roll.csv (every 4th step), OUTDIR/<case>-peaks.csv, OUTDIR/ta10-roll-decay-series.png and a summary.

The log's orientation is relative to the start. The start tilt was a +30 degree rotation about y and the logged angle
rises as the float rights itself, so absolute tilt = 30 - logged angle (checked against the sign of the angular velocity).
"""
import math, os, re, sys
import numpy as np
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt

START = 30.0
out = sys.argv[1]; os.makedirs(out, exist_ok=True)

def load(case):
    t = None; rows = {}; z0 = None; last = -math.inf
    for l in open(case + "/log.interFoam"):
        m = re.match(r"^Time = ([\d.e+-]+)$", l)
        if m:
            t = float(m.group(1))
            if t < last: rows = {k: v for k, v in rows.items() if k < t}   # restart: drop the superseded samples
            last = t
            continue
        m = re.search(r"Centre of rotation: \(([^)]*)\)", l)
        if m and t is not None: z = float(m.group(1).split()[2]); z0 = z if z0 is None else z0; cur = z
        m = re.search(r"Orientation: \(([^)]*)\)", l)
        if m and t is not None:
            R = list(map(float, m.group(1).split())); rows[t] = (START - math.degrees(math.atan2(R[2], R[0])), cur - z0)
    T = np.array(sorted(rows)); return T, np.array([rows[k][0] for k in T]), np.array([rows[k][1] for k in T])

fig, ax = plt.subplots(2, 1, figsize=(9, 7), sharex=True); res = {}
for case in sys.argv[2:]:
    name = os.path.basename(case.rstrip("/")); T, A, Z = load(case)
    ex = [i for i in range(1, len(T) - 1) if (A[i] - A[i-1]) * (A[i+1] - A[i]) < 0]
    with open(f"{out}/{name}-roll.csv", "w") as fh:
        fh.write("time_s,tilt_deg,heave_m\n"); [fh.write(f"{T[i]:.6f},{A[i]:.4f},{Z[i]:.6f}\n") for i in range(0, len(T), 4)]
    with open(f"{out}/{name}-peaks.csv", "w") as fh:
        fh.write("time_s,tilt_deg\n"); [fh.write(f"{T[i]:.4f},{A[i]:.3f}\n") for i in ex]
    et = T[ex]; ea = A[ex]; sw = np.abs(np.diff(ea)); tm = (et[1:] + et[:-1]) / 2
    per = 2 * np.mean(np.diff(et)); k = np.polyfit(tm, np.log(sw), 1)[0]   # swing ~ exp(k t)
    zeta = -k / (2 * math.pi / per)
    res[name] = (len(T), T[-1], per, sw[0], sw[-1], zeta, A.min(), A.max())
    ax[0].plot(T, A, lw=1.2, label=name); ax[1].plot(T, Z * 1e3, lw=1.2, label=name)
ax[0].axhline(0, c="grey", lw=.5); ax[0].set_ylabel("tilt from vertical (deg)"); ax[1].set_ylabel("heave (mm)"); ax[1].set_xlabel("time (s)")
ax[0].set_title("Test Assembly 10 roll decay, 30 degree start (OpenFOAM interFoam)"); ax[0].legend(); ax[1].legend()
fig.tight_layout(); fig.savefig(f"{out}/ta10-roll-decay-series.png", dpi=150)
for n, (s, tend, per, s0, s1, zeta, lo, hi) in res.items():
    print(f"{n}: {s} steps to t={tend:.4f} s | period {per:.3f} s | swing first {s0:.1f} -> last {s1:.1f} deg | "
          f"fitted decay zeta {zeta:+.4f} (negative = growing) | tilt range {lo:.1f} to {hi:.1f} deg")
