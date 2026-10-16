"""Stability of the printed-float buoy (battery only, no ballast stem) from its STEP.

Hull = outer envelope of printed-float-v9.step as a body of revolution (chambers sealed and dry),
plus the housing flange above the float top. Masses: float 992 g (slicer, 5 walls, 5 top/bottom,
10% honeycomb); electronics from the repo budget, stacked from the housing bottom upward.
Run:  python run_printed_float.py   (needs gmsh + numpy, see ../requirements.txt)
"""
import sys
from pathlib import Path

import gmsh
import numpy as np

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
import buoy_stability as bs                       # noqa: E402

IN = bs.IN
STEP = HERE / "printed-float-v9.step"
FLANGE_R, FLANGE_H = 89.0, 33.0                   # housing lid flange above the float top, mm


def float_profile():
    gmsh.initialize(); gmsh.option.setNumber("General.Terminal", 0)
    gmsh.model.occ.importShapes(str(STEP)); gmsh.model.occ.synchronize()
    d, t = gmsh.model.getEntities(3)[0]
    gmsh.option.setNumber("Mesh.MeshSizeMax", 2.0); gmsh.model.mesh.generate(2)
    pts = []
    for dd, tt in gmsh.model.getBoundary([(3, t)], oriented=False, recursive=False):
        _, c, _ = gmsh.model.mesh.getNodes(dd, tt, includeBoundary=True); pts.append(c.reshape(-1, 3))
    p = np.vstack(pts); r = np.hypot(p[:, 0], p[:, 1]); z = p[:, 2] - p[:, 2].min()
    floor = z[(r < 50) & (z > 10)].max()          # top of the socket floor
    zs = np.arange(0.0, z.max() + 1e-9, 0.5)
    R = np.array([r[np.abs(z - zz) <= 1.0].max() for zz in zs])
    gmsh.finalize()
    return zs, R, float(floor), float(z.max())


zs, R, FLOOR, TOP = float_profile()
Rz = lambda z: np.where(np.asarray(z) <= TOP, np.interp(z, zs, R), FLANGE_R)
top_flange = TOP + FLANGE_H
x = np.arange(-230, 231, bs.VOXEL); zv = np.arange(bs.VOXEL / 2, top_flange, bs.VOXEL)
X, Y, Z = np.meshgrid(x, x, zv, indexing="ij"); rr = np.hypot(X, Y)
inside = rr <= Rz(Z)
HULL = bs.Hull({"kind": "float-v8", "h": 0}, Rz, TOP / IN, np.c_[X[inside], Y[inside], Z[inside]], bs.VOXEL ** 3)
bs.hull = lambda cap: HULL                        # solve()/self_rights() use this hull
CAP = HULL.cap


def budget(pod_below_in=4.0, pod_g=217.0, hydro_g=150.0, ballast_g=0.0, ballast_z_mm=12.0, battery_g=250.0):
    hb = FLOOR                                    # housing bottom sits on the socket floor
    h = lambda mm: (hb + mm) / IN                 # height above the keel, in
    b = [
        ("Printed float (slicer)", 992.0, 0.0, 1, ""),
        ("Housing body (flange style)", 385.0, 0.0, 1, ""),
        ("Deployment battery", battery_g, 0.0, 1, ""),
        ("Feather M0 + RFM95 + Adalogger + headers", 16.8, 0.0, 1, ""),
        ("PID 6106 charger/boost", 12.0, 0.0, 1, ""),
        ("Wiring, harness/sled, internal cabling", 120.0, 0.0, 1, ""),
        ("Leak sensor + hydrophone electronics", 27.0, 0.0, 1, ""),
        ("Cable glands + bolts (lid)", 58.0, 0.0, 1, ""),
        ("Antenna", 30.0, 0.0, 1, ""),
        ("Epoxy + coating", 330.0, 0.0, 1, ""),
        ("Mooring hardware", 220.0, 0.0, 191.7 / 220, ""),
        ("External cabling", 60.0, -0.5, 16 / 60, ""),
        ("Sensor pod", pod_g, -pod_below_in, 0.30, ""),
        ("Hydrophone element", hydro_g, -pod_below_in, 0.60, ""),
    ]
    zmm = {"Printed float (slicer)": 0.36 * TOP, "Housing body (flange style)": hb + 68,
           "Deployment battery": hb + 25, "Feather M0 + RFM95 + Adalogger + headers": hb + 90,
           "PID 6106 charger/boost": hb + 80, "Wiring, harness/sled, internal cabling": hb + 55,
           "Leak sensor + hydrophone electronics": hb + 60, "Cable glands + bolts (lid)": hb + 135,
           "Antenna": hb + 150, "Epoxy + coating": 0.5 * TOP}
    out = []
    for n, m, z, f, s in b:
        out.append((n, m, zmm[n] / IN if n in zmm else z, f, s))
    if ballast_g:
        out.append(("Ballast (bottom of hull)", ballast_g, ballast_z_mm / IN, 1, ""))
    return out


def report(label, **kw):
    bud = budget(**kw)
    r = bs.solve(CAP, bud)
    ok = bs.self_rights(CAP, bud)
    van = "none" if r["vanishing_deg"] is None else f"{r['vanishing_deg']:.0f} deg"
    print(f"{label:46s} {r['mass_kg']:.2f} kg  draft {r['draft_in']:.2f} in  freeboard {r['freeboard_in']:.2f} in  "
          f"KG {r['KG_in']:.2f}  GM {r['GM_in']:.2f} in  GZmax {r['gz_max_in']*25.4:.0f} mm @ {r['gz_max_deg']} deg  "
          f"vanish {van}  self-rights {ok}")
    return r


if __name__ == "__main__":
    print(f"float height {TOP/IN:.2f} in, socket floor {FLOOR:.1f} mm above keel, hull envelope "
          f"{np.trapezoid(np.pi*Rz(np.linspace(0,TOP,3001))**2,np.linspace(0,TOP,3001))/1e6:.2f} L")
    report("baseline, pod 4 in below keel")
    for d in (0.0, 2.0, 8.0, 13.5):
        report(f"pod {d:g} in below keel", pod_below_in=d)
    report("no pod or hydrophone below", pod_g=0.0, hydro_g=0.0)
    report("battery 100 g instead of 250 g", battery_g=100.0)
    lo, hi = 0.0, 2000.0
    for kw in (dict(pod_below_in=4.0), dict(pod_below_in=0.0), dict(pod_below_in=13.5)):
        lo, hi = 0.0, 2500.0
        while hi - lo > 5:
            mid = (lo + hi) / 2
            lo, hi = (lo, mid) if bs.self_rights(CAP, budget(ballast_g=mid, **kw)) else (mid, hi)
        print(f"min ballast (steel at keel, net 1.0) to self-right, pod {kw['pod_below_in']:g} in: {hi:.0f} g")
