"""Test Assembly 10 float -> watertight CFD hulls (with and without fins), as multi-region ASCII STLs.

Input : the float exported from Fusion (mm, keel above the origin), e.g. ta10_float_fins_raw.stl
Output: hull_nofins.stl (region hull) and hull_fins.stl (regions hull + fins), metres, keel at z = 0.

The outer profile is read by ray casting from outside at the eight gap azimuths between the fins, so the fins,
loops, bore and lettering do not enter it. The fin outline is read the same way at the fin azimuth.
Usage: python make_hull_ta10.py RAW.STL [OUTDIR]
"""
import sys, math, numpy as np, trimesh

RAW = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else "."
TOP_MM = 158.0           # hull closed here: well above any waterline at a 30 degree tilt
FIN_W = 0.050            # fin width (tangential), m; unchanged from Test Assembly 9 (1.97 in)

raw = trimesh.load(RAW); raw.apply_translation([0, 0, -raw.bounds[0][2]])
ray = raw.ray

def hit_r(az_deg, z):
    a = math.radians(az_deg); d = np.array([-math.cos(a), -math.sin(a), 0.0])
    o = np.array([300 * math.cos(a), 300 * math.sin(a), z])
    loc, _, _ = ray.intersects_location([o], [d], multiple_hits=False)
    return float(np.hypot(*loc[0][:2])) if len(loc) else np.nan

gaps = [45.0 * k for k in range(8)]
zs = np.unique(np.r_[np.arange(0.2, TOP_MM, 2.5), TOP_MM])
Rh = np.array([np.nanmedian([hit_r(a, z) for a in gaps]) for z in zs])
fin_az = [22.5 + 45.0 * k for k in range(8)]
zf = np.arange(15.0, 60.0, 0.5)
Rf = np.array([np.nanmedian([hit_r(a, z) for a in fin_az]) for z in zf])
hull_at = lambda z: np.interp(z, zs, Rh)
fin_mask = Rf > hull_at(zf) + 0.5
assert fin_mask.any(), "no fin found at the fin azimuths"
z_lo, z_hi = zf[fin_mask].min(), zf[fin_mask].max()
print("hull radius: keel %.1f mm, max %.1f mm at z %.1f, closed at z %.1f" % (Rh[0], Rh.max(), zs[Rh.argmax()], TOP_MM))
print("fin: z %.1f to %.1f mm above keel, tip radius %.1f mm" % (z_lo, z_hi, Rf[fin_mask].max()))

prof = [(0.0, 0.0)] + list(zip(Rh, zs)) + [(0.0, TOP_MM)]
hull = trimesh.creation.revolve(np.array(prof), sections=120); hull.apply_scale(1e-3)

def fin(az_deg):
    sel = zf[fin_mask]; tip = Rf[fin_mask]
    outline = [(hull_at(sel[0]) - 4.0, sel[0] - 0.2)] + list(zip(tip, sel)) + [(hull_at(sel[-1]) - 4.0, sel[-1] + 0.2)]
    P = np.array([[u * 1e-3, s * FIN_W / 2, z * 1e-3] for (u, z) in outline for s in (-1, 1)])
    f = trimesh.convex.convex_hull(P)
    f.apply_transform(trimesh.transformations.rotation_matrix(math.radians(az_deg), [0, 0, 1])); return f

merged = trimesh.boolean.union([hull] + [fin(a) for a in fin_az], engine="manifold")

def write_stl(path, parts):
    with open(path, "w") as fh:
        for name, m in parts:
            fh.write(f"solid {name}\n")
            for f, n in zip(m.triangles, m.face_normals):
                fh.write(f" facet normal {n[0]:.6e} {n[1]:.6e} {n[2]:.6e}\n  outer loop\n")
                for v in f: fh.write(f"   vertex {v[0]:.7e} {v[1]:.7e} {v[2]:.7e}\n")
                fh.write("  endloop\n endfacet\n")
            fh.write(f"endsolid {name}\n")

# fin faces = merged faces whose centroid sits outside the bare hull
c = merged.triangles_center; rc = np.hypot(c[:, 0], c[:, 1]) * 1e3
is_fin = rc > np.interp(c[:, 2] * 1e3, zs, Rh) + 0.3
fins_part = merged.submesh([np.where(is_fin)[0]], append=True); hull_part = merged.submesh([np.where(~is_fin)[0]], append=True)
write_stl(f"{OUT}/hull_nofins.stl", [("hull", hull)])
write_stl(f"{OUT}/hull_fins.stl", [("hull", hull_part), ("fins", fins_part)])
for tag, m in (("hull_nofins", hull), ("hull_fins", merged)):
    print(tag, "watertight", m.is_watertight, "volume %.3f L" % (m.volume * 1e3), "faces", len(m.faces))
print("fin-region faces", int(is_fin.sum()), "of", len(merged.faces))
hull.export(f"{OUT}/hull_nofins_single.stl"); merged.export(f"{OUT}/hull_fins_single.stl")  # single-solid copies for the statics check
