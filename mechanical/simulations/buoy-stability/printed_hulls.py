"""Hydrostatics for the printed floats (no foam, no ballast stem): the mushroom profile and any later float
whose STEP holds the float plus, optionally, the electronics housing.

The hull is the outer envelope of the float as a body of revolution, with its chambers sealed and dry, plus the
housing flange where it sits above the float top (all read from the STEP, nothing redrawn). Masses are the repo
budget used for the printed-float study (`printed-float-tip-explorer/run_printed_float.py`) with the float mass
from the slicer, so the numbers compare across designs. Same solver as `buoy_stability.py`.

`series(hydro)` returns the rows the explorer embeds: housing-loaded mass 0..4000 g in 500 g steps, matching the
wedge-cap series, plus the hull top height. Everything is mm in the file, inches in the solver.
"""
from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path

import numpy as np

import buoy_stability as bs

IN = bs.IN
CAD = bs.CAD

# Housing group of the printed-float budget (battery, boards, wiring, glands, antenna): replaced by one scaled lump
# when the explorer's "housing, loaded" slider moves. Heights are mm above the housing bottom.
HOUSING_GROUP = [("Housing body (flange style)", 385.0, 68), ("Deployment battery", 250.0, 25),
                 ("Feather M0 + RFM95 + Adalogger + headers", 16.8, 90), ("PID 6106 charger/boost", 12.0, 80),
                 ("Wiring, harness/sled, internal cabling", 120.0, 55), ("Leak sensor + hydrophone electronics", 27.0, 60),
                 ("Cable glands + bolts (lid)", 58.0, 135), ("Antenna", 30.0, 150)]
HOUSING_NOMINAL_G = sum(m for _, m, _ in HOUSING_GROUP)


def load(step: Path):
    """Return (float R(z) table, float top mm, socket floor mm, float centre of mass mm, housing profile or None).

    z is measured from the float's lowest point (the keel). The float is the largest solid in the file; any other
    solid is taken to be the housing and its outer profile is added to the hull above the float top.
    """
    import gmsh
    gmsh.initialize(); gmsh.option.setNumber("General.Terminal", 0)
    gmsh.clear()                            # the section cutter leaves its last STEP in the model; start empty
    gmsh.model.occ.importShapes(str(step)); gmsh.model.occ.synchronize()
    solids = sorted(gmsh.model.getEntities(3), key=lambda dt: -gmsh.model.occ.getMass(*dt))
    gmsh.option.setNumber("Mesh.MeshSizeMax", 2.0); gmsh.model.mesh.generate(2)

    def outline(dt):
        pts = []
        for d, t in gmsh.model.getBoundary([dt], oriented=False, recursive=False):
            _, c, _ = gmsh.model.mesh.getNodes(d, t, includeBoundary=True); pts.append(c.reshape(-1, 3))
        p = np.vstack(pts); return np.hypot(p[:, 0], p[:, 1]), p[:, 2]

    r, z = outline(solids[0]); keel = float(z.min()); z = z - keel
    com = gmsh.model.occ.getCenterOfMass(*solids[0])[2] - keel
    zs = np.arange(0.0, z.max() + 1e-9, 0.5)
    R = np.array([r[np.abs(z - q) <= 1.0].max() if (np.abs(z - q) <= 1.0).any() else 0.0 for q in zs])
    floor = float(z[(r < 50) & (z > 10)].max())
    housing = None
    if len(solids) > 1:
        hr, hz = outline(solids[1]); hz = hz - keel
        hs = np.arange(float(hz.min()), float(hz.max()) + 1e-9, 0.5)
        HR = np.array([hr[np.abs(hz - q) <= 1.0].max() if (np.abs(hz - q) <= 1.0).any() else 0.0 for q in hs])
        housing = (hs, HR)
    gmsh.finalize()
    return (zs, R), float(z.max()), floor, float(com), housing


def hull_from(step: Path):
    (zs, R), top, floor, com, housing = load(step)
    top_flange = top
    if housing:
        top_flange = float(housing[0].max())
        Rz = lambda z: np.maximum(np.interp(z, zs, R, right=0.0),
                                  np.interp(z, housing[0], housing[1], left=0.0, right=0.0))
    else:
        Rz = lambda z: np.interp(z, zs, R, right=0.0)
    x = np.arange(-230, 231, bs.VOXEL); zv = np.arange(bs.VOXEL / 2, top_flange, bs.VOXEL)
    X, Y, Z = np.meshgrid(x, x, zv, indexing="ij"); inside = np.hypot(X, Y) <= Rz(Z)
    H = bs.Hull({"kind": "printed", "h": 0}, Rz, top / IN, np.c_[X[inside], Y[inside], Z[inside]], bs.VOXEL ** 3)
    hb = float(housing[0].min()) if housing else floor      # housing bottom, mm above the keel
    return H, top, hb, com


def budget(top, hb, com, float_g, housing_g=None, pod_below_in=4.0, pod_g=217.0, hydro_g=150.0):
    """Printed-float budget (see run_printed_float.py), float at its CAD centre of mass, housing at its CAD height."""
    h = lambda mm: (hb + mm) / IN
    k = 1.0 if housing_g is None else housing_g / HOUSING_NOMINAL_G
    b = [("Printed float (slicer)", float_g, com / IN, 1)]
    b += [(n, m * k, h(z), 1) for n, m, z in HOUSING_GROUP]
    b += [("Epoxy + coating", 330.0, 0.5 * top / IN, 1), ("Mooring hardware", 220.0, 0.0, 191.7 / 220),
          ("External cabling", 60.0, -0.5, 16 / 60), ("Sensor pod", pod_g, -pod_below_in, 0.30),
          ("Hydrophone element", hydro_g, -pod_below_in, 0.60)]
    return [(n, m, z, f, "") for n, m, z, f in b]


@contextmanager
def _use(H):
    old = bs.hull
    bs.hull = lambda cap: H
    try:
        yield H.cap
    finally:
        bs.hull = old


def series(hydro: dict):
    """Explorer rows [housing_g, mass, draft, KG, KB, KM, GM, supported, gz[]] and the hull top height in inches."""
    H, top, hb, com = hull_from(CAD / hydro["step"])
    rows = []
    with _use(H) as cap:
        for X in sorted(set(range(0, 4001, 250)) | {round(HOUSING_NOMINAL_G)}):
            try:
                r = bs.solve(cap, budget(top, hb, com, hydro["float_g"], housing_g=X))
            except ValueError:               # buoy sinks: the printed float has less reserve than the wedge buoy
                break
            rows.append([X, round(r["mass_kg"], 3), round(r["draft_in"], 3), round(r["KG_in"], 3), round(r["KB_in"], 3),
                         round(r["KM_in"], 3), round(r["GM_in"], 3), round(r["supported_kg"], 3),
                         [round(g, 3) for g in r["gz_in"]]])
    return rows, round(top / IN, 3)


def report(hydro: dict):
    """Headline numbers at the nominal housing mass, for the README and Hub."""
    H, top, hb, com = hull_from(CAD / hydro["step"])
    with _use(H) as cap:
        bud = budget(top, hb, com, hydro["float_g"])
        r = bs.solve(cap, bud)
        r["self_rights"] = bs.self_rights(cap, bud)
    r["top_in"] = top / IN
    return r
