import numpy as np, trimesh, math, capytaine as cpt
cpt.set_logging("ERROR")
# outer profile (mm above keel) from the Fusion STL (wall + bottom), then the shoulder to the float top
m = cpt.load_mesh("stl/float_no_fins.stl", file_format="stl"); v = np.asarray(m.vertices); v[:, 2] -= v[:, 2].min()
r = np.hypot(v[:, 0], v[:, 1]); zk = np.round(v[:, 2], 1)
uz = np.unique(zk[zk < 135]); ur = np.array([r[zk == q].max() for q in uz])
zs = np.arange(0.0, 135.1, 2.5); Rs = np.interp(zs, uz, ur)
prof = [(0.0, 0.0)] + [(a, b) for b, a in zip(zs, Rs)] + [(124.3, 139.8), (100.0, 165.1), (0.0, 165.1)]
hull = trimesh.creation.revolve(np.array(prof), sections=120)
hull.apply_scale(1e-3)                                  # metres
def fin(az_deg, w=0.050):
    pts = [(110, 44.5), (129.3, 44.5), (129.3, 40.5), (114.3, 25.5), (110, 25.5)]
    P = np.array([[u * 1e-3, s * w / 2, z * 1e-3] for (u, z) in pts for s in (-1, 1)])
    f = trimesh.convex.convex_hull(P)
    f.apply_transform(trimesh.transformations.rotation_matrix(math.radians(az_deg), [0, 0, 1])); return f
fins = [fin(22.5 + 45 * k) for k in range(8)]
with_fins = trimesh.boolean.union([hull] + fins, engine="manifold")
for name, mesh in (("hull_nofins", hull), ("hull_fins", with_fins)):
    print(name, "watertight", mesh.is_watertight, "volume L %.3f" % (mesh.volume * 1000), "bounds m", mesh.bounds.round(3).tolist(), "faces", len(mesh.faces))
    mesh.export(f"{name}.stl")
