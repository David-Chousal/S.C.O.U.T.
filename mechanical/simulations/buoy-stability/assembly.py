"""Hydrostatics for the concept iterations, built straight from the STEP files (stacked sections, wedges around the chassis).

A registry entry with an `"assembly"` block lists its parts; each part is a STEP file placed by:
  count / overlap_mm   stack `count` copies, each one's lowest point on the previous one's highest, minus the connector overlap
  around: N            copy N times about the vertical axis (a wedge given once becomes N around the chassis)
  mate: "bottom"       place the part's lowest point on the highest point of the part before it (default: keep STEP coordinates)
  kind                 chassis | wedge | wedge-cap | wedge-bottom | section: picks the mass rule below

Physics, no sketches: the hull is the union of the parts' voxels, each column filled from its lowest to its highest
surface crossing (a sealed cavity under another part counts as displacement; an open cup or a through-hole floods). The
electronics housing (body 127 mm, flange on top, as in the mushroom STEP) is added in the same way, flange resting on the
top. Draft comes from the displaced volume; at each heel angle the lowest voxels of the rotated hull are kept until their
volume equals the displaced volume, B is their centroid, GZ = horizontal distance from B to G. Heel is run about two axes
(toward a wedge and toward a gap) and the worse GZ is reported. Same method as `buoy_stability.py`, but on the real 3D shape.

Masses are NOT measured for these concepts. They come from the STEP volume with an effective density per part kind, tagged
[A] below, and are listed on the explorer so they can be replaced by slicer or scale weights. Payload is the current
(printed-float / mushroom) payload from `printed_hulls.py`.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

import buoy_stability as bs
import printed_hulls as ph

IN, CAD, RHO_SW = bs.IN, bs.CAD, bs.RHO_SW
DX = 3.0                                    # voxel edge, mm (horizontal and vertical)
ANGLES = list(range(0, 181, 5))
HOUSING_R, HOUSING_L, FLANGE_R, FLANGE_T = 57.15, 127.0, 95.25, 8.9     # from the mushroom STEP's housing solid

# [M] derived from measured slicer masses, [A] assumed
RHO_CHASSIS = bs.CHASSIS_SLICE_G / 2536.0                                 # [M] 808 g slicer / 2536 cm3 STEP chassis
RHO_WEDGE = bs.V5_WEDGE_BOTTOM_SLICE_G / bs.V5_WEDGE_BOTTOM_SOLID_CM3      # [M] 207.06 g / 263.8 cm3 (4 walls, 15% gyroid)
RHO_INFILL = 702.0 / 3233.0                                               # [M] mushroom float: slicer 702 g / STEP 3233 cm3
FOAM_G = {"wedge": bs.FOAM_WEDGE_L * 1000 * bs.RHO_FOAM, "wedge-bottom": bs.FOAM_V5_WEDGE_BOTTOM_L * 1000 * bs.RHO_FOAM}  # [A] 2 lb/ft3 foam


def _gmsh():
    import gmsh
    if not gmsh.isInitialized():
        gmsh.initialize()
    gmsh.option.setNumber("General.Terminal", 0)
    return gmsh


def place(gmsh, it):
    """Import and transform every part of one registry entry. Returns [dict(file, kind, tag, count_idx, dimtag)]."""
    gmsh.clear()
    out, prev_top = [], None
    for p in it["assembly"]["parts"]:
        reps = []
        dts = gmsh.model.occ.importShapes(str(CAD / p["file"])); gmsh.model.occ.synchronize()
        solids = [dt for dt in dts if dt[0] == 3]
        if p.get("keep_above_z") is not None:      # drop thin posts and tabs below this height, keep the main body
            cutter = gmsh.model.occ.addBox(-400, -400, -100, 800, 800, 100 + p["keep_above_z"])
            res, _ = gmsh.model.occ.cut(solids, [(3, cutter)]); gmsh.model.occ.synchronize()
            res = [dt for dt in res if dt[0] == 3]
            vols = [gmsh.model.occ.getMass(*dt) for dt in res]
            solids = [res[int(np.argmax(vols))]]
            gmsh.model.occ.remove([dt for dt in res if dt != solids[0]], recursive=True)
        if p.get("cut_tube"):                      # remove a tall thin outer wall: [inner radius, from height] in the file's coordinates
            r_in, z0 = p["cut_tube"]
            tube = gmsh.model.occ.cut([(3, gmsh.model.occ.addCylinder(0, 0, z0, 0, 0, 300, r_in + 80))],
                                      [(3, gmsh.model.occ.addCylinder(0, 0, z0 - 10, 0, 0, 320, r_in))])[0]
            res, _ = gmsh.model.occ.cut(solids, tube); gmsh.model.occ.synchronize()
            res = [dt for dt in res if dt[0] == 3]
            vols = [gmsh.model.occ.getMass(*dt) for dt in res]
            solids = [res[int(np.argmax(vols))]]
            gmsh.model.occ.remove([dt for dt in res if dt != solids[0]], recursive=True)
        lo = min(gmsh.model.getBoundingBox(*dt)[2] for dt in solids)
        hi = max(gmsh.model.getBoundingBox(*dt)[5] for dt in solids)
        count, over = p.get("count", 1), p.get("overlap_mm", 0.0)
        dz0 = (prev_top - lo) if (p.get("mate") == "bottom" and prev_top is not None) else 0.0
        copies = [solids]
        for _ in range(count - 1):
            copies.append(gmsh.model.occ.copy(solids))
        for k, grp in enumerate(copies):
            gmsh.model.occ.translate(grp, 0, 0, dz0 + k * (hi - lo - over))
            reps.append(grp)
        prev_top = hi + dz0 + (count - 1) * (hi - lo - over)
        n = p.get("around", 1)
        for grp in reps:
            for a in range(n):
                g = grp if a == 0 else gmsh.model.occ.copy(grp)
                if a:
                    gmsh.model.occ.rotate(g, 0, 0, 0, 0, 0, 1, 2 * np.pi * a / n)
                for dt in g:
                    out.append(dict(file=p["file"], kind=p.get("kind", "section"), dimtag=dt))
    gmsh.model.occ.synchronize()
    return out


def add_housing(gmsh, parts, top):
    body = gmsh.model.occ.addCylinder(0, 0, top - HOUSING_L, 0, 0, HOUSING_L, HOUSING_R)
    flange = gmsh.model.occ.addCylinder(0, 0, top, 0, 0, FLANGE_T, FLANGE_R)
    gmsh.model.occ.synchronize()
    for t in (body, flange):
        parts.append(dict(file="housing", kind="housing", dimtag=(3, t)))


def triangles(gmsh, dimtag):
    V, T, off = [], [], 0
    for d, t in gmsh.model.getBoundary([dimtag], oriented=False, recursive=False):
        tags, xyz, _ = gmsh.model.mesh.getNodes(d, t, includeBoundary=True)
        _, _, nodes = gmsh.model.mesh.getElements(d, t)
        if not len(nodes):
            continue
        idx = {int(g): i for i, g in enumerate(tags)}
        V.append(xyz.reshape(-1, 3)); T.append(np.array([idx[int(n)] for n in nodes[0]]).reshape(-1, 3) + off); off += len(tags)
    V, T = np.vstack(V), np.vstack(T)
    return V[T]                                                           # (M, 3, 3)


def column_range(tris, x0, y0, nx, ny):
    """Per (x, y) column of the grid: lowest and highest z where the surface crosses it (NaN if none)."""
    zlo = np.full((nx, ny), np.inf); zhi = np.full((nx, ny), -np.inf)
    gx = x0 + (np.arange(nx) + 0.5) * DX + 1.3e-3; gy = y0 + (np.arange(ny) + 0.5) * DX + 0.7e-3   # off-lattice, avoids shared edges
    for t in tris:
        (ax, ay, az), (bx, by, bz), (cx, cy, cz) = t
        det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(det) < 1e-9:
            continue                                                       # vertical face, no crossing
        i0 = max(int(np.floor((min(ax, bx, cx) - x0) / DX - 0.5)), 0); i1 = min(int(np.ceil((max(ax, bx, cx) - x0) / DX - 0.5)), nx - 1)
        j0 = max(int(np.floor((min(ay, by, cy) - y0) / DX - 0.5)), 0); j1 = min(int(np.ceil((max(ay, by, cy) - y0) / DX - 0.5)), ny - 1)
        if i1 < i0 or j1 < j0:
            continue
        X, Y = np.meshgrid(gx[i0:i1 + 1], gy[j0:j1 + 1], indexing="ij")
        l1 = ((by - cy) * (X - cx) + (cx - bx) * (Y - cy)) / det
        l2 = ((cy - ay) * (X - cx) + (ax - cx) * (Y - cy)) / det
        l3 = 1 - l1 - l2
        m = (l1 >= 0) & (l2 >= 0) & (l3 >= 0)
        if not m.any():
            continue
        z = l1 * az + l2 * bz + l3 * cz
        sl = (slice(i0, i1 + 1), slice(j0, j1 + 1))
        zlo[sl] = np.where(m, np.minimum(zlo[sl], z), zlo[sl]); zhi[sl] = np.where(m, np.maximum(zhi[sl], z), zhi[sl])
    return zlo, zhi


def _convex(pts):
    """Counter-clockwise convex hull of 2D points (monotone chain)."""
    p = np.unique(np.round(pts, 3), axis=0); p = p[np.lexsort((p[:, 1], p[:, 0]))]
    def half(seq):
        h = []
        for q in seq:
            while len(h) >= 2 and (h[-1][0] - h[-2][0]) * (q[1] - h[-2][1]) - (h[-1][1] - h[-2][1]) * (q[0] - h[-2][0]) <= 0:
                h.pop()
            h.append(q)
        return h
    lower, upper = half(p), half(p[::-1])
    return np.array(lower[:-1] + upper[:-1])


def voxels(tri_groups, fill_top=None):
    """Union envelope of the triangle groups as voxel centres (N, 3) mm.

    fill_top[i] True: the group is a foam-filled shell (a wedge): its whole plan outline, lowest to highest point, counts
    as displacement, because foam fills the hollow. The STEP wedges are open tubes, so columns through the hollow cross no surface.
    """
    fill_top = fill_top or [False] * len(tri_groups)
    allp = np.concatenate([g.reshape(-1, 3) for g in tri_groups])
    lo, hi = allp.min(0), allp.max(0)
    nx, ny = int(np.ceil((hi[0] - lo[0]) / DX)) + 1, int(np.ceil((hi[1] - lo[1]) / DX)) + 1
    zlo = np.full((nx, ny), np.inf); zhi = np.full((nx, ny), -np.inf)
    for g, ft in zip(tri_groups, fill_top):
        if ft:
            hull = _convex(g.reshape(-1, 3)[:, :2])
            gx = lo[0] + (np.arange(nx) + 0.5) * DX; gy = lo[1] + (np.arange(ny) + 0.5) * DX
            X, Y = np.meshgrid(gx, gy, indexing="ij"); inside = np.ones_like(X, bool)
            for (x1, y1), (x2, y2) in zip(hull, np.roll(hull, -1, axis=0)):
                inside &= (x2 - x1) * (Y - y1) - (y2 - y1) * (X - x1) >= 0
            a = np.where(inside, g[:, :, 2].min(), np.inf); b = np.where(inside, g[:, :, 2].max(), -np.inf)
        else:
            a, b = column_range(g, lo[0], lo[1], nx, ny)
        zlo, zhi = np.minimum(zlo, a), np.maximum(zhi, b)
    ci, cj = np.nonzero(np.isfinite(zlo))
    pts = []
    for i, j in zip(ci, cj):
        k0, k1 = int(np.ceil(zlo[i, j] / DX - 0.5)), int(np.floor(zhi[i, j] / DX - 0.5))
        if k1 >= k0:
            z = (np.arange(k0, k1 + 1) + 0.5) * DX
            pts.append(np.c_[np.full(len(z), lo[0] + (i + 0.5) * DX), np.full(len(z), lo[1] + (j + 0.5) * DX), z])
    return np.vstack(pts)


def mass_rule(kind, vol_cm3, env_cm3):
    """Estimated mass g of one part from its STEP volume. Returns (grams, rule text)."""
    if kind == "chassis":
        return vol_cm3 * RHO_CHASSIS, "chassis: 0.319 g/cm3 from the 808 g slicer mass"
    if kind in ("wedge", "wedge-cap", "wedge-bottom"):
        foam = FOAM_G.get(kind, 0.0)
        return vol_cm3 * RHO_WEDGE + foam, f"wedge shell 0.785 g/cm3 from the measured cap slice{' + foam fill' if foam else ''}"
    if vol_cm3 / max(env_cm3, 1e-9) < 0.5:
        return vol_cm3 * RHO_WEDGE, "thin-walled part: 0.785 g/cm3 (wall-printed PETG, 4 walls 15% gyroid)"
    return vol_cm3 * RHO_INFILL, "solid-modelled part: 0.217 g/cm3 (mushroom float, honeycomb infill)"


_CACHE = {}


def build(it):
    """Mesh the assembly (the gmsh model stays live for slicing). Returns dict(parts, keel, top); numbers are cached by id."""
    gmsh = _gmsh()
    parts = place(gmsh, it)
    # keel and top from the float parts only
    bbs = [gmsh.model.getBoundingBox(*p["dimtag"]) for p in parts]
    keel = min(b[2] for b in bbs); top = max(b[5] for b in bbs)
    if it["assembly"].get("housing", True):
        add_housing(gmsh, parts, top)
    gmsh.option.setNumber("Mesh.MeshSizeMax", DX); gmsh.model.mesh.generate(2)
    for p in parts:
        p["tris"] = triangles(gmsh, p["dimtag"]); p["vol"] = gmsh.model.occ.getMass(*p["dimtag"]) / 1000.0
        p["com"] = np.array(gmsh.model.occ.getCenterOfMass(*p["dimtag"]))
    _CACHE[it["id"]] = dict(parts=parts, keel=keel, top=top)
    return _CACHE[it["id"]]


def hull_and_masses(A):
    parts = A["parts"]
    P = voxels([p["tris"] for p in parts], [p["kind"] in FOAM_G for p in parts]); P[:, 2] -= A["keel"]
    dv = DX ** 3 / 1000.0                                                  # cm3 per voxel
    masses, rules = [], []
    cache = {}
    for p in parts:
        if p["kind"] == "housing":
            continue
        key = p["file"]
        if key not in cache:
            env = len(voxels([p["tris"]])) * dv
            cache[key] = env
        m, rule = mass_rule(p["kind"], p["vol"], cache[key])
        masses.append((p["file"].split("/")[-1], p["kind"], m, p["com"][2] - A["keel"], rule))
    return P, dv, masses


def budget(masses, hb, top, housing_g=None):
    h = lambda mm: (hb + mm) / IN
    k = 1.0 if housing_g is None else housing_g / ph.HOUSING_NOMINAL_G
    b = [(f"{n} ({kind})", m, z / IN, 1.0) for n, kind, m, z, _ in masses]
    b += [(n, m * k, h(z), 1.0) for n, m, z in ph.HOUSING_GROUP]
    b += [("Epoxy + coating", 330.0, 0.5 * top / IN, 1.0), ("Mooring hardware", 220.0, 0.0, 191.7 / 220),
          ("External cabling", 60.0, -0.5, 16 / 60), ("Sensor pod", 217.0, -4.0, 0.30), ("Hydrophone element", 150.0, -4.0, 0.60)]
    return b


def hydrostatics(P, dv, bud, top_mm):
    """Draft, KB, KG, GM and the GZ curve (min over two heel axes) for one budget. Inches."""
    m = np.array([b[1] for b in bud]); z = np.array([b[2] for b in bud]); f = np.array([b[3] for b in bud])
    w = m * f; Wn = w.sum() / 1000; KG = (w * z).sum() / w.sum() * IN       # mm
    Vreq = Wn / RHO_SW * 1e6 / 1000.0                                      # cm3
    n = int(round(Vreq / dv))
    if n >= len(P) * 0.995:
        raise ValueError("buoy sinks")
    gz = np.full((2, len(ANGLES)), np.nan); KB = T = None
    for hd, ax in enumerate((1, 0)):                                       # heel toward +/-y, then toward +/-x
        a = P[:, ax].astype(np.float64); zz = P[:, 2].astype(np.float64)
        for k, deg in enumerate(ANGLES):
            c, s = np.cos(np.radians(deg)), np.sin(np.radians(deg))
            wv = zz * c + a * s; u = a * c - zz * s
            sel = np.argpartition(wv, n - 1)[:n] if n < len(P) else np.arange(len(P))
            if deg == 0 and hd == 0:
                KB = zz[sel].mean(); T = wv[sel].max()
            gz[hd, k] = (-KG * s) - u[sel].mean()                          # u_G - u_B, positive restores
    g = gz.min(0)
    GM = g[1] / np.sin(np.radians(ANGLES[1])) / IN                         # from GZ at 5 deg
    return dict(mass_kg=m.sum() / 1000, supported_kg=Wn, draft_in=T / IN, KG_in=KG / IN, KB_in=KB / IN,
                GM_in=GM, KM_in=KG / IN + GM, gz_in=[float(x) / IN for x in g], top_in=top_mm / IN)


def series(it, X_values=None):
    X_values = X_values or sorted(set(range(0, 4001, 250)) | {round(ph.HOUSING_NOMINAL_G)})
    A = _CACHE.get(it["id"]) or build(it)
    P, dv, masses = hull_and_masses(A)
    top = A["top"] - A["keel"]
    hb = it["assembly"].get("payload_hb_mm", top - HOUSING_L)      # housing bottom above the keel; or the cavity floor
    rows, last = [], None
    for X in X_values:
        try:
            r = hydrostatics(P, dv, budget(masses, hb, top, housing_g=X), top)
        except ValueError:
            break
        rows.append([X, round(r["mass_kg"], 3), round(r["draft_in"], 3), round(r["KG_in"], 3), round(r["KB_in"], 3),
                     round(r["KM_in"], 3), round(r["GM_in"], 3), round(r["supported_kg"], 3), [round(g, 3) for g in r["gz_in"]]])
    info = dict(top_in=round(top / IN, 3), keel_z_mm=round(A["keel"], 1), masses=masses, hull_L=round(len(P) * dv / 1000, 2),
                float_g=round(sum(m[2] for m in masses)))
    return rows, info
