"""True side-view cross sections of every iteration in iterations.json, sliced from the committed STEP files.

Each solid's surface is meshed (gmsh/OpenCASCADE, 2 mm) and cut by the vertical plane x = 0, which runs through the
buoy axis and the centre of the wedge on +y. The cut gives closed outlines in (y, z); nothing is redrawn by hand.
Output coordinates are millimetres: h = y (horizontal), v = z - keel (up from the keel).
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[3]
CAD = REPO / "mechanical" / "cad"
HERE = Path(__file__).resolve().parent
EPS = 0.013            # mm; keeps the plane off mesh nodes on the symmetry plane
RDP_TOL = 0.15         # mm; polyline simplification, below drawing resolution
GAP = 30.0             # mm between parts in layout "row"


def _slice_solid(gmsh, dim_tag, size):
    gmsh.model.mesh.clear()
    gmsh.option.setNumber("Mesh.MeshSizeMax", size)
    gmsh.model.mesh.generate(2)
    V, T = [], []
    off = 0
    for d, t in gmsh.model.getBoundary([dim_tag], oriented=False, recursive=False):
        tags, xyz, _ = gmsh.model.mesh.getNodes(d, t, includeBoundary=True)
        _, _, nodes = gmsh.model.mesh.getElements(d, t)
        if not len(nodes):
            continue
        idx = {int(g): i for i, g in enumerate(tags)}
        tri = np.array([idx[int(n)] for n in nodes[0]]).reshape(-1, 3)
        V.append(xyz.reshape(-1, 3)); T.append(tri + off); off += len(tags)
    if not V:
        return []
    V = np.vstack(V); T = np.vstack(T)
    # merge duplicated nodes shared between surfaces so loops close
    key = np.round(V, 4)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    V = V[first]; T = inv.ravel()[T]
    d = V[:, 0] - EPS
    pos = d[T] > 0                                   # (n, 3) side of the plane per corner
    cross = pos.any(1) & ~pos.all(1)
    T = T[cross]; pos = pos[cross]
    pts = []
    for ea, eb in ((0, 1), (1, 2), (2, 0)):
        a, b = T[:, ea], T[:, eb]
        hit = pos[:, ea] != pos[:, eb]
        lo, hi = np.minimum(a, b), np.maximum(a, b)
        t = d[lo] / np.where(hit, d[lo] - d[hi], 1.0)
        P = V[lo] + t[:, None] * (V[hi] - V[lo])
        pts.append((hit, np.round(P[:, 1:], 3)))
    segs = []
    for i in range(len(T)):
        e = [tuple(P[i]) for hit, P in pts if hit[i]]
        if len(e) == 2 and e[0] != e[1]:
            segs.append((e[0], e[1]))
    return _loops(segs)


def _loops(segs):
    adj = {}
    for a, b in segs:
        adj.setdefault(a, []).append(b); adj.setdefault(b, []).append(a)
    seen, loops = set(), []
    for a, b in segs:
        if (a, b) in seen or (b, a) in seen:
            continue
        loop, prev, cur = [a], None, a
        nxt = b
        while True:
            seen.add((cur, nxt)); loop.append(nxt)
            prev, cur = cur, nxt
            cand = [n for n in adj[cur] if n != prev and (cur, n) not in seen and (n, cur) not in seen]
            if not cand:
                break
            nxt = cand[0]
            if nxt == loop[0]:
                loop.append(nxt); break
        loops.append(loop)
    return loops


def _rdp(p, tol):
    p = np.asarray(p); keep = np.zeros(len(p), bool); keep[[0, -1]] = True
    stack = [(0, len(p) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        a, b = p[i], p[j]; ab = b - a; n = np.hypot(*ab)
        dist = np.hypot(*(p[i + 1:j] - a).T) if n == 0 else np.abs(ab[0] * (p[i + 1:j, 1] - a[1]) - ab[1] * (p[i + 1:j, 0] - a[0])) / n
        k = int(np.argmax(dist))
        if dist[k] > tol:
            keep[i + 1 + k] = True; stack += [(i, i + 1 + k), (i + 1 + k, j)]
    return p[keep]


def build(registry_path=HERE / "iterations.json"):
    import gmsh
    gmsh.initialize(); gmsh.option.setNumber("General.Terminal", 0)
    out = []
    for it in json.loads(Path(registry_path).read_text())["iterations"]:
        parts = []
        for rel in it["files"]:
            gmsh.clear(); gmsh.model.occ.importShapes(str(CAD / rel)); gmsh.model.occ.synchronize()
            for dt in gmsh.model.getEntities(3):
                bb = gmsh.model.getBoundingBox(*dt)
                size = 3.0 if max(bb[3] - bb[0], bb[4] - bb[1]) > 600 else 2.0
                loops = [np.array(l) for l in _slice_solid(gmsh, dt, size) if len(l) > 3]
                if loops:
                    parts.append(dict(file=rel, z=(bb[2], bb[5]), loops=loops))
        allz = [l[:, 1] for p in parts for l in p["loops"]]
        keel = it.get("keel_z_mm", float(min(z.min() for z in allz)))
        dx = 0.0
        if it.get("layout") == "row":
            for f in it["files"]:
                grp = [p for p in parts if p["file"] == f]
                lo = min(l[:, 0].min() for p in grp for l in p["loops"]); hi = max(l[:, 0].max() for p in grp for l in p["loops"])
                for p in grp:
                    p["dx"] = dx - lo
                dx += hi - lo + GAP
        paths = []
        for p in parts:
            d = p.get("dx", 0.0)
            paths.append([[[round(float(h) + d, 1), round(float(v) - keel, 1)] for h, v in _rdp(l, RDP_TOL)] for l in p["loops"]])
        xs = [pt[0] for pp in paths for l in pp for pt in l]; zs = [pt[1] for pp in paths for l in pp for pt in l]
        out.append(dict(id=it["id"], name=it["name"], when=it["when"], note=it.get("note", ""), hydro=it.get("hydro"),
                        keel_z_mm=round(keel, 1), bbox=[min(xs), min(zs), max(xs), max(zs)], solids=paths))
        print(f"{it['id']}: {len(paths)} solids, keel {keel:.1f}, h {min(xs):.0f}..{max(xs):.0f}, v {min(zs):.0f}..{max(zs):.0f}", flush=True)
    return out


if __name__ == "__main__":
    build()
