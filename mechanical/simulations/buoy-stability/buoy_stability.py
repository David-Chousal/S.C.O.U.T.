"""S.C.O.U.T. buoy hydrostatics and stability calculator.

Computes, for a given hull configuration and mass budget:
  - floating waterline (draft) and freeboard
  - KG, KB, BM, KM, GM
  - the full righting-arm curve GZ(heel) from 0 to 180 deg, at constant displacement
  - the vanishing angle and whether the buoy self-rights from every angle
  - the minimum ballast (lead) needed for full self-righting

Method (documented in docs/engineering/buoy-structural/stability-analysis.md §12):
  - Hull geometry comes from the committed STEP files. The wedge-bottom cap's outer
    profile R(z) is read from the STEP surface mesh (gmsh/OpenCASCADE); the wedge
    section is an R = 9.000 in cylinder; the chassis/housing flange above the hull top
    is an R = 2.875 in disc.
  - Displacement and GZ use a 2 mm voxel grid of the hull, rotated about a horizontal
    axis; the waterline at each heel is found by keeping exactly the displaced volume.
  - Appendages below the keel (pipe, pod, lead, mooring hardware, cable) enter both the
    equilibrium and the moment balance at NET-DOWN weight (weight minus own buoyancy),
    applied at their own height.

Units: inches for heights (z measured up from the keel = lowest point of the hull),
grams for masses, mm internally for geometry.

Run everything with:  python run_studies.py   (see README.md)
"""
from __future__ import annotations

import functools
from dataclasses import dataclass
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[3]
CAD = REPO / "mechanical" / "cad"
STEP_V5_WEDGE_BOTTOM = CAD / "floatation" / "chassis-floatation-bolted-v5-wedge-bottom.step"
STEP_V5_WEDGE = CAD / "floatation" / "chassis-floatation-bolted-v5-wedge.step"
STEP_V6_ASSEMBLY = CAD / "full-buoy-assembly-v6.step"

IN = 25.4                 # mm per inch
RHO_SW = 1.025            # seawater, kg/L
RHO_FOAM = 0.032          # g/cm3 (2 lb/ft3, US Composites #0204; datasheet pending)
R_OUT = 9.0 * IN          # float radius, mm
R_CHASSIS = 2.875 * IN    # chassis / housing-flange radius, mm
R_INNER_WEDGE = 73.18     # wedge inner radius used for envelope integration, mm
WEDGE_H = 5.5             # wedge (float section) height, in
FLANGE_H = 0.5            # housing flange + lid above the hull top, in
PETG = 1.27               # g/cm3
STEEL = 8.0               # g/cm3 (316)
LEAD = 11.34              # g/cm3 (CRC handbook)
NET_STEEL = 1 - RHO_SW / STEEL
NET_LEAD = 1 - RHO_SW / LEAD
VOXEL = 2.0               # mm
ANGLES = list(range(0, 181, 5))
SELF_RIGHT_ANGLES = list(range(5, 171, 5)) + [172, 174, 176, 178]

# Measured references
V5_WEDGE_BOTTOM_SLICE_G = 207.06     # slicer, 2026-09-25 (4 walls, 15% gyroid)
V5_WEDGE_BOTTOM_SOLID_CM3 = 263.8    # STEP
V5_WEDGE_SOLID_CM3 = 168.7           # STEP
FOAM_WEDGE_L = 3.262                 # per wedge: 3.431 L envelope - 0.1687 L solid
FOAM_V5_WEDGE_BOTTOM_L = 1.084       # per wedge bottom, STEP (2026-09-25)
CHASSIS_SLICE_G = 808.0              # slicer, 2026-09-29 (6 walls, 25% gyroid, 6 top/bottom)


# --------------------------------------------------------------------------- geometry
def _gmsh():
    import gmsh
    if not gmsh.isInitialized():
        gmsh.initialize()
        gmsh.option.setNumber("General.Terminal", 0)
    return gmsh


def _profile_from_solid(gmsh, dim_tag, z_offset_mm):
    """Outer radius R(z) (mm) of one solid, z measured from the keel, 0.5 mm bins."""
    gmsh.model.mesh.clear()
    gmsh.option.setNumber("Mesh.MeshSizeMax", 2.0)
    gmsh.model.mesh.generate(2)
    pts = []
    for d, t in gmsh.model.getBoundary([dim_tag], oriented=False, recursive=False):
        _, coords, _ = gmsh.model.mesh.getNodes(d, t, includeBoundary=True)
        pts.append(coords.reshape(-1, 3))
    p = np.vstack(pts)
    r = np.hypot(p[:, 0], p[:, 1]); z = p[:, 2] + z_offset_mm
    zs = np.arange(0.0, z.max() + 1e-9, 0.5)
    R = np.array([r[np.abs(z - zz) <= 1.0].max() for zz in zs])
    return zs, R


@functools.lru_cache(maxsize=None)
def cap_profile(kind: str):
    """Return (zs_mm, R_mm, solid_cm3, solid_centroid_in, height_in) for a cap geometry.

    kind: 'v5-step'  -> 3.0 in cap, from the v5 wedge-bottom STEP
          'v6-step'  -> 1.5 in cap, from the v6 full-assembly STEP (current)
    """
    gmsh = _gmsh()
    gmsh.clear()
    if kind == "v5-step":
        gmsh.model.occ.importShapes(str(STEP_V5_WEDGE_BOTTOM)); gmsh.model.occ.synchronize()
        tag = gmsh.model.getEntities(3)[0]
        z_off = 76.2                                   # STEP keel sits at z = -76.2 mm
    elif kind == "v6-step":
        gmsh.model.occ.importShapes(str(STEP_V6_ASSEMBLY)); gmsh.model.occ.synchronize()
        tag = None
        for d, t in gmsh.model.getEntities(3):        # a cap spans z -38.1..0 mm, R 9.0 in
            b = gmsh.model.getBoundingBox(d, t)
            if abs(b[2] + 38.1) < 0.5 and abs(b[5]) < 0.5 and max(abs(b[0]), abs(b[3]), abs(b[1]), abs(b[4])) > 220:
                tag = (d, t); break
        if tag is None:
            raise RuntimeError("v6 cap solid not found in the assembly STEP")
        z_off = 38.1
    else:
        raise ValueError(kind)
    vol = gmsh.model.occ.getMass(*tag) / 1000.0
    cz = (gmsh.model.occ.getCenterOfMass(*tag)[2] + z_off) / IN
    zs, R = _profile_from_solid(gmsh, tag, z_off)
    keep = zs <= (zs.max() if kind == "v5-step" else 38.1)
    zs, R = zs[keep], R[keep]
    return zs, R, vol, cz, float(zs.max() / IN)


def envelope_litres(zs, R):
    A = (np.pi / 6) * (R ** 2 - R_INNER_WEDGE ** 2)
    return float(np.trapezoid(A, zs) / 1e6)


def radius_fn(cap: dict):
    """R(z) in mm for the hull outer surface, z in mm from the keel."""
    h = cap["h"] * IN
    if cap["kind"] in ("v5-step", "v6-step"):
        zs, R, *_ = cap_profile(cap["kind"])
        return lambda z: np.where(np.asarray(z) <= zs.max(), np.interp(z, zs, R), R_OUT)
    if cap["kind"] == "flat":
        return lambda z: np.full_like(np.asarray(z, dtype=float), R_OUT)
    if cap["kind"] == "ideal":                         # 45 deg taper to R_OUT at h - 0.25 in
        return lambda z: np.minimum(R_OUT, R_OUT - (h - 0.25 * IN) + np.asarray(z, dtype=float))
    raise ValueError(cap["kind"])


@dataclass
class Hull:
    cap: dict
    Rz: object
    top_in: float
    P: np.ndarray
    dv: float


@functools.lru_cache(maxsize=None)
def _hull_cached(kind, h):
    cap = {"kind": kind, "h": h}
    Rz = radius_fn(cap)
    top = (h + WEDGE_H) * IN
    x = np.arange(-230, 231, VOXEL); zz = np.arange(VOXEL / 2, top + FLANGE_H * IN, VOXEL)
    X, Y, Z = np.meshgrid(x, x, zz, indexing="ij"); r = np.hypot(X, Y)
    inside = np.where(Z <= top, r <= Rz(Z), r <= R_CHASSIS)
    P = np.c_[X[inside], Y[inside], Z[inside]]
    return Hull(cap, Rz, top / IN, P, VOXEL ** 3)


def hull(cap: dict) -> Hull:
    return _hull_cached(cap["kind"], cap["h"])


# --------------------------------------------------------------------------- mass budget
# (name, mass_g, z_in, net_factor, source). z is from the keel of the v5 full-cap hull
# (cap height 3.0 in); build_budget() shifts hull items for other cap heights.
V5_BASE = [
    ("Chassis shell", 600.0, 4.10, 1, "[A] v4 slice scaled to 8.5 in (superseded by 808 g slice)"),
    ("Wedge shells x6", 6 * 214.2, 5.75, 1, "[X] STEP 168.7 cm3 x 1.27"),
    ("Wedge bottoms x6", 6 * V5_WEDGE_BOTTOM_SLICE_G, 1.28, 1, "[M] slicer 2026-09-25"),
    ("Wedge caps x6", 761.2, 8.40, 1, "[M] slicer 2026-08-24"),
    ("Flotation foam", None, None, 1, "[X] STEP cavities x 0.032 g/cm3"),
    ("Electronics housing (flange style)", 385.0, 6.87, 1, "[A] geometry, 3/16 in walls"),
    ("Feather M0 + RFM95", 5.8, 5.2, 1, "[M] datasheet"),
    ("Adalogger FeatherWing", 6.0, 5.2, 1, "[A]"),
    ("Stacking headers + misc", 5.0, 5.2, 1, "[A]"),
    ("PID 6106 charger/boost", 12.0, 5.2, 1, "[A]"),
    ("Wiring, divider, connectors", 40.0, 5.0, 1, "[A]"),
    ("Harness / board sled", 40.0, 5.0, 1, "[A] projected"),
    ("Internal T/RH leak sensor", 2.0, 4.3, 1, "[A] projected"),
    ("Hydrophone audio electronics", 25.0, 5.2, 1, "[A] projected, Rev B"),
    ("Deployment battery (LiFePO4)", 250.0, 4.3, 1, "[A] ADR-0002 open"),
    ("Cable glands x3", 18.0, 8.9, 1, "[A]"),
    ("Antenna", 30.0, 10.0, 1, "[A]"),
    ("Solar mount", 320.0, 10.0, 1, "[A]"),
    ("Solar panel", 700.0, 11.0, 1, "[A] not specified"),
    ("Fasteners + inserts", 210.0, 4.5, 1, "[A]"),
    ("Epoxy / adhesive", 130.0, 5.2, 1, "[A]"),
    ("Antifouling + seal coat", 200.0, 4.2, 1, "[A]"),
    ("Internal cabling", 40.0, 5.0, 1, "[A]"),
    # appendages (z relative to the keel, NOT shifted with cap height)
    ("Mooring hardware", 220.0, 0.0, 191.7 / 220, "[A] freeboard model §6"),
    ("External cabling", 60.0, -2.0, 16 / 60, "[A] freeboard model §6"),
    ("Sensor stem (PETG)", 400.0, -6.0, 0.60, "[A] freeboard model §6"),
    ("Sensor pod (+ SEN0189 board)", 217.0, -13.5, 0.30, "[A]"),
    ("Hydrophone element", 150.0, -13.5, 0.60, "[A] projected"),
]
APPENDAGES = {"Mooring hardware", "External cabling", "Sensor stem (PETG)",
              "Sensor pod (+ SEN0189 board)", "Hydrophone element"}
HOUSING_GROUP = {"Electronics housing (flange style)", "Feather M0 + RFM95", "Adalogger FeatherWing",
                 "Stacking headers + misc", "PID 6106 charger/boost", "Wiring, divider, connectors",
                 "Harness / board sled", "Internal T/RH leak sensor", "Hydrophone audio electronics",
                 "Deployment battery (LiFePO4)"}


def cap_mass_and_foam(cap: dict, preset: str):
    """(cap mass g, cap centroid in, foam cavity per cap L) for 6 caps' worth of inputs."""
    h = cap["h"]
    if h == 0:
        return 0.0, 0.0, 0.0
    if cap["kind"] == "v5-step":
        return 6 * V5_WEDGE_BOTTOM_SLICE_G, 1.28, FOAM_V5_WEDGE_BOTTOM_L
    if cap["kind"] == "v6-step" and preset == "current":
        zs, R, vol, cz, _ = cap_profile("v6-step")
        dens = V5_WEDGE_BOTTOM_SLICE_G / V5_WEDGE_BOTTOM_SOLID_CM3   # same print settings
        return 6 * vol * dens, cz, max(envelope_litres(zs, R) - vol / 1000, 0.0)
    # session-2026-09-29 scaling for idealised caps
    return 6 * 1242.4 / 6 * (0.25 + 0.75 * h / 3) * 1.0, 0.45 * h, 1.084 * (h / 3) ** 1.2


def build_budget(cap: dict, *, preset="current", ballast=None, housing_loaded_g=None,
                 extra=()):
    """Return a list of (name, mass_g, z_in, net_factor, source).

    preset:  'current'            -> 808 g chassis, steel pipe arm + rail mount (if ballast)
             'session-2026-09-29' -> exactly the inputs used for stability §12 on 2026-09-29
    ballast: None, or dict(lead_kg=..., depth_in=24.0)
    housing_loaded_g: replace the housing + contents group with one lump of this mass
    extra:   additional (name, mass_g, z_in_from_keel, net_factor, source) items
    """
    h = cap["h"]; dz = h - 3.0
    cap_g, cap_z, foam_cap_L = cap_mass_and_foam(cap, preset)
    out = []
    for name, m, z, f, src in V5_BASE:
        if name == "Wedge bottoms x6":
            if cap_g:
                out.append(("Wedge-bottom caps x6", cap_g, cap_z, 1, f"cap {cap['kind']} {h} in"))
            continue
        if name == "Flotation foam":
            L = 6 * (FOAM_WEDGE_L + foam_cap_L)
            zc = (FOAM_WEDGE_L * (5.75 + dz) + foam_cap_L * (0.6 * h if cap["kind"] != "v5-step" else 1.81)) / (FOAM_WEDGE_L + foam_cap_L)
            out.append((name, L * 1000 * RHO_FOAM, zc, 1, src)); continue
        if name == "Chassis shell":
            L_ch = WEDGE_H + h
            if preset == "current":
                m, src = CHASSIS_SLICE_G, "[M] slicer 2026-09-29 (current CAD chassis)"
                z = 4.10 * L_ch / 8.5
            else:
                m = 600 * (0.30 + 0.70 * L_ch / 11) / (0.30 + 0.70 * 8.5 / 11)
                z = 4.10 if h == 3.0 else 4.10 * L_ch / 8.5
            out.append((name, m, z, f, src)); continue
        if name == "Antifouling + seal coat" and h != 3.0:
            m = 170 + 30 * h / 3
        if name in APPENDAGES:
            out.append((name, m, z, f, src))
        else:
            out.append((name, m, z + dz, f, src))
    if ballast:
        depth = ballast.get("depth_in", 24.0)
        out = [i for i in out if i[0] != "Sensor stem (PETG)"]
        if preset == "current":
            # 316 pipe 4816K51 (3/4 Sch 40, 24 in), 6040T56 rail mount, backing plate, lead near the bottom
            out = [i for i in out if i[0] != "Mooring hardware"]
            out += [
                ("Ballast arm: 316 pipe 4816K51", 1048.0 * depth / 24.0, -depth / 2, NET_STEEL, "[X] 214.9 mm2 x length x 8.0"),
                ("Arm mount: 6040T56 rail mount", 222.0, -0.9, NET_STEEL, "[X] STEP 27.8 cm3 x 8.0"),
                ("316 backing plate 4x4x1/8 in", 262.0, 0.2, 1, "[X] 2 in3 x 8.0"),
                ("Mount bolts + cross-bolt", 40.0, 0.0, NET_STEEL, "[A]"),
                ("Mooring collar + swivel", 220.0, -2.5, 191.7 / 220, "[A] U-bolt collar on pipe root"),
                ("Lead ballast (encapsulated)", ballast["lead_kg"] * 1000, -(depth - 1.8), NET_LEAD,
                 "[A] annulus ~3 in OD above the end cap"),
            ]
        else:
            out += [("Sensor stem (PETG, extended)", 30.0 * max(12.0, depth), -max(12.0, depth) / 2, 0.60,
                     "[A] 30 g/in"),
                    ("Lead ballast", ballast["lead_kg"] * 1000, -depth, NET_LEAD, "[A] point mass")]
    if housing_loaded_g is not None:
        grp = [i for i in out if i[0] in HOUSING_GROUP]
        zc = sum(i[1] * i[2] for i in grp) / sum(i[1] for i in grp)
        out = [i for i in out if i[0] not in HOUSING_GROUP]
        out.append(("Electronics housing, loaded (swept)", float(housing_loaded_g), zc, 1, "sweep"))
    out += list(extra)
    return out


# --------------------------------------------------------------------------- solver
def _gz_at(Hl: Hull, n, KG_mm, deg):
    p = np.radians(deg); c, s = np.cos(p), np.sin(p)
    zp = Hl.P[:, 1] * s + Hl.P[:, 2] * c; yp = Hl.P[:, 1] * c - Hl.P[:, 2] * s
    i = np.argpartition(zp, n)[:n]
    return float(-(yp[i].mean() + KG_mm * s)) / IN


def solve(cap: dict, budget, angles=ANGLES):
    Hl = hull(cap)
    m = np.array([b[1] for b in budget]); z = np.array([b[2] for b in budget]); f = np.array([b[3] for b in budget])
    w = m * f; Wn = w.sum() / 1000; KG = (w * z).sum() / w.sum() * IN
    Vreq = Wn / RHO_SW * 1e6
    zz = lambda T: np.linspace(0, T, 3001)
    V = lambda T: (np.trapezoid(np.pi * Hl.Rz(zz(T)) ** 2, zz(T)), np.trapezoid(np.pi * Hl.Rz(zz(T)) ** 2 * zz(T), zz(T)))
    lo, hi = 0.0, Hl.top_in * IN
    if V(hi)[0] < Vreq:
        raise ValueError("buoy sinks: required displacement exceeds the hull")
    for _ in range(60):
        mid = (lo + hi) / 2; lo, hi = (mid, hi) if V(mid)[0] < Vreq else (lo, mid)
    T = (lo + hi) / 2; v, mz = V(T); KB = mz / v
    BM = (np.pi * float(Hl.Rz(np.array(T))) ** 4 / 4) / Vreq
    n = int(round(Vreq / Hl.dv))
    gz = [_gz_at(Hl, n, KG, a) for a in angles]
    g = np.array(gz)
    van = None
    for k in range(2, len(angles)):
        if angles[k] > 175:
            break
        if g[k] < 0 <= g[k - 1]:
            van = angles[k - 1] + (angles[k] - angles[k - 1]) * g[k - 1] / (g[k - 1] - g[k]); break
    kmax = int(np.argmax(g))
    return dict(mass_kg=m.sum() / 1000, supported_kg=Wn, draft_in=T / IN, freeboard_in=Hl.top_in - T / IN,
                KG_in=KG / IN, KB_in=KB / IN, BM_in=BM / IN, KM_in=(KB + BM) / IN, GM_in=(KB + BM - KG) / IN,
                angles=list(angles), gz_in=gz, vanishing_deg=van, gz_max_in=float(g[kmax]),
                gz_max_deg=angles[kmax], rm_max_Nm=Wn * 9.81 * float(g[kmax]) * IN / 1000,
                waterline_R_in=float(Hl.Rz(np.array(T))) / IN, hull_top_in=Hl.top_in)


def self_rights(cap: dict, budget) -> bool:
    """True if GZ > 0 at every checked angle from 5 to 178 deg (inverted is unstable)."""
    Hl = hull(cap)
    m = np.array([b[1] for b in budget]); z = np.array([b[2] for b in budget]); f = np.array([b[3] for b in budget])
    w = m * f; KG = (w * z).sum() / w.sum() * IN
    n = int(round(w.sum() / 1000 / RHO_SW * 1e6 / Hl.dv))
    if n >= 0.9 * len(Hl.P):
        return False
    return all(_gz_at(Hl, n, KG, a) > 0 for a in SELF_RIGHT_ANGLES)


def min_lead(cap: dict, *, preset="current", depth_in=24.0, housing_loaded_g=None, extra=(),
             hi=12.0, tol=0.05):
    """Smallest lead mass (kg) at depth_in that makes the buoy self-right from any angle."""
    mk = lambda kg: build_budget(cap, preset=preset, ballast=dict(lead_kg=kg, depth_in=depth_in),
                                 housing_loaded_g=housing_loaded_g, extra=extra)
    if not self_rights(cap, mk(hi)):
        return None
    lo = 0.0
    while hi - lo > tol:
        mid = (lo + hi) / 2
        lo, hi = (lo, mid) if self_rights(cap, mk(mid)) else (mid, hi)
    return hi


# Standard cap configurations
CAP_V5_FULL = {"kind": "v5-step", "h": 3.0}      # v5, 3.0 in caps (STEP)
CAP_V6 = {"kind": "v6-step", "h": 1.5}           # current v6, 1.5 in caps (STEP)
CAP_IDEAL_15 = {"kind": "ideal", "h": 1.5}       # idealised 1.5 in (session 2026-09-29)
CAP_NONE = {"kind": "flat", "h": 0}
