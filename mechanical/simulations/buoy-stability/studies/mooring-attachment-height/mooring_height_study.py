"""Quasi-static heel vs mooring attachment height, using buoy_stability.py (2026-10-08).

Static hydrostatics only: waves, line dynamics and added mass are NOT modelled. The drag areas,
coefficients and drag centres below are first-pass estimates [A].

Run (from this folder, with the buoy-stability venv):   python mooring_height_study.py [output_dir]
"""
import sys, csv, json
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import buoy_stability as bs
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent; OUT.mkdir(parents=True, exist_ok=True)
IN, G = bs.IN, 9.81
cap = bs.CAP_V6
LEAD_KG, DEPTH = 2.6, 24.0

def budget(z_att, V_N):
    b = bs.build_budget(cap, preset="current", ballast=dict(lead_kg=LEAD_KG, depth_in=DEPTH))
    b = [i for i in b if i[0] != "Mooring collar + swivel"]
    # same 220 g of mooring hardware (collar/eye + rope + shackle), moved to the attachment height
    b.append(("Mooring hardware at attachment", 220.0, z_att, 191.7 / 220, "[A] moved with the attachment"))
    if V_N > 0:
        b.append(("Steady vertical line pull", V_N / G * 1000, z_att, 1.0, "[A] downward pull of the line"))
    return b

Hl = bs.hull(cap)

def props(b):
    m = np.array([x[1] for x in b]); z = np.array([x[2] for x in b]); f = np.array([x[3] for x in b])
    w = m * f; Wn = w.sum() / 1000; KG = (w * z).sum() / w.sum() * IN
    n = int(round(Wn / bs.RHO_SW * 1e6 / Hl.dv))
    return Wn, KG, n

def gz_curve(b, angles):
    Wn, KG, n = props(b)
    return np.array([bs._gz_at(Hl, n, KG, a) for a in angles]), Wn

angles = list(range(0, 91, 3))

# ---- steady-current drag centre (design current 0.8 m/s), simple Cd*A model, estimates
U = 0.8; rho = 1025.0
base = bs.solve(cap, budget(-2.5, 0), angles=[0])
T_in = base["draft_in"]
comps = [  # name, Cd, area m2, z_in (from keel)
    ("hull strip (draft)", 1.0, 0.457 * T_in * 0.0254, T_in / 2),
    ("pipe arm", 1.2, 0.0267 * 0.61, -12.0),
    ("sensor pod", 1.0, 0.052 * 0.15, -13.5),
    ("lead", 1.0, 0.076 * 0.05, -22.2),
]
F = [0.5 * rho * c * a * U ** 2 for _, c, a, _ in comps]
H_cur = sum(F); z_cd_cur = sum(f * z for f, (_, _, _, z) in zip(F, comps)) / H_cur
z_cd_wave = T_in / 2   # conservative: wave loads act near the surface

atts = {"keel pad-eye (z=0)": 0.0, "collar 2.5 in below keel": -2.5, "mid-stem (z=-12 in)": -12.0,
        "stem bottom, at lead (z=-24 in)": -24.0}
Hs = [20, 50, 100, 200, 330]

rows = []; curves = {}
for name, za in atts.items():
    b = budget(za, 0)
    s = bs.solve(cap, b, angles=angles)
    gz = np.array(s["gz_in"]); Wn = s["supported_kg"]
    RM = Wn * G * gz * IN / 1000                 # N·m
    rm_max = RM.max(); th_rmmax = angles[int(RM.argmax())]
    curves[name] = (RM, s)
    for zcd_name, zcd in (("steady current drag centre", z_cd_cur), ("wave: drag at waterline", z_cd_wave)):
        arm_in = zcd - za
        for H in Hs + [None]:
            if H is None:
                Hcrit = rm_max / (arm_in * IN / 1000) if arm_in > 0 else float("inf")
                rows.append((name, zcd_name, round(zcd, 2), round(arm_in, 2), "H to knock down", round(Hcrit, 1), "", round(rm_max, 1), th_rmmax))
                continue
            Mh = H * arm_in * IN / 1000 * np.cos(np.radians(angles))
            diff = RM - Mh
            heel = None
            for k in range(1, len(angles)):
                if diff[k - 1] < 0 <= diff[k]:
                    heel = angles[k - 1] + (angles[k] - angles[k - 1]) * (-diff[k - 1]) / (diff[k] - diff[k - 1]); break
            if arm_in > 0 and H * arm_in * IN / 1000 >= rm_max: heel = None   # beyond the peak righting moment = knockdown
            rows.append((name, zcd_name, round(zcd, 2), round(arm_in, 2), H, "" if heel is None else round(heel, 1),
                         "KNOCKDOWN" if heel is None else "ok", round(rm_max, 1), th_rmmax))

with open(OUT / "heel-vs-attachment.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["attachment", "drag centre assumed", "z_cd_in", "arm_in", "horizontal_force_N (or 'H to knock down' in the next column)",
                "heel_deg / H_knockdown_N", "status", "rm_max_Nm", "rm_max_at_deg"])
    w.writerows(rows)

# ---- natural roll period estimates (rigid, no added mass; added mass would lengthen it)
def roll_period(za):
    b = budget(za, 0); s = bs.solve(cap, b, angles=[0])
    m = np.array([x[1] for x in b]) / 1000; z = np.array([x[2] for x in b]) * IN / 1000
    zcg = (m * np.array([x[3] for x in b]) * z).sum() / (m * np.array([x[3] for x in b])).sum()
    r_ring = {"Wedge shells x6": 7.0, "Wedge-bottom caps x6": 7.0, "Wedge caps x6": 7.0, "Flotation foam": 7.0}
    I = 0.0
    for x, mi, zi in zip(b, m, z):
        r = r_ring.get(x[0], 0.0) * IN / 1000
        I += mi * ((zi - zcg) ** 2 + r ** 2 / 2)
    GM = s["GM_in"] * IN / 1000; W = s["supported_kg"]
    return 2 * np.pi * np.sqrt(I / (W * GM)), I, GM
rp = {n: roll_period(za) for n, za in atts.items()}

# ---- plots
cols = ["tab:gray", "tab:blue", "tab:orange", "tab:red"]
fig, ax = plt.subplots(1, 2, figsize=(13, 5))
for (name, (RM, s)), c in zip(curves.items(), cols):
    ax[0].plot(angles, RM, c=c, label=name)
for H, ls in ((20, ":"), (100, "--"), (330, "-.")):
    for (name, za), c in zip(atts.items(), cols):
        Mh = H * (z_cd_wave - za) * IN / 1000 * np.cos(np.radians(angles))
        if name.startswith(("collar", "stem bottom")):
            ax[0].plot(angles, Mh, c=c, ls=ls, lw=0.9, alpha=0.9)
ax[0].set_xlabel("heel angle (deg)"); ax[0].set_ylabel("moment (N·m)")
ax[0].set_title("Righting moment (solid) vs heeling moment (dashed)\nlines: H = 20 N dotted, 100 N dashed, 330 N dash-dot")
ax[0].set_ylim(0, 120); ax[0].legend(fontsize=8); ax[0].grid(alpha=.3)
Hgrid = np.linspace(0, 330, 67)
for (name, za), c in zip(atts.items(), cols):
    RM = curves[name][0]; hs = []
    for H in Hgrid:
        Mh = H * (z_cd_wave - za) * IN / 1000 * np.cos(np.radians(angles)); d = RM - Mh; h = np.nan
        for k in range(1, len(angles)):
            if d[k - 1] < 0 <= d[k]:
                h = angles[k - 1] + (angles[k] - angles[k - 1]) * (-d[k - 1]) / (d[k] - d[k - 1]); break
        if H * (z_cd_wave - za) * IN / 1000 >= RM.max(): h = np.nan
        hs.append(h)
    ax[1].plot(Hgrid, hs, c=c, label=name)
ax[1].set_xlabel("sustained horizontal mooring force H (N)"); ax[1].set_ylabel("equilibrium heel (deg)")
ax[1].set_title("Heel vs steady force (line ends = no equilibrium, capsize)")
ax[1].set_ylim(0, 90); ax[1].legend(fontsize=8); ax[1].grid(alpha=.3)
fig.tight_layout(); fig.savefig(OUT / "heel-vs-attachment.png", dpi=130)

# ---- summary
summ = dict(draft_in=T_in, H_current_0p8_mps_N=H_cur, z_cd_current_in=z_cd_cur, z_cd_wave_in=z_cd_wave,
            rm_max={n: float(curves[n][0].max()) for n in atts},
            GM_in={n: curves[n][1]["GM_in"] for n in atts},
            roll_period_s={n: float(rp[n][0]) for n in atts},
            vanishing_deg={n: curves[n][1]["vanishing_deg"] for n in atts})
json.dump(summ, open(OUT / "summary.json", "w"), indent=1, default=str)
print(json.dumps(summ, indent=1, default=str))
for r in rows:
    if r[5] != "" and (r[4] in (20, 100, 330) or r[4] == "H to knock down"): print(r)
