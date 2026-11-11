"""Capytaine heave and roll radiation study of the printed float hull (wetted body of revolution).

Usage:  python hull_bem.py float_no_fins.stl     (STL exported from Fusion, mm; fins are not meshed)
Needs:  pip install capytaine meshio numpy
Buoy numbers (mass, GM, KG) come from the repo solver run for Test Assembly 9; edit M, GM_in, KG_in to rerun.
"""
import sys, math, numpy as np
STL = sys.argv[1]
import capytaine as cpt
cpt.set_logging("ERROR")
IN = 25.4
_m = cpt.load_mesh(STL, file_format="stl"); _v = np.asarray(_m.vertices); _v[:, 2] -= _v[:, 2].min()
_r = np.hypot(_v[:, 0], _v[:, 1]); _zk = np.round(_v[:, 2], 1)
_uz = np.unique(_zk[_zk < 140]); _ur = np.array([_r[_zk == q].max() for q in _uz])
zs = np.arange(0.0, 120.0, 1.0); R = np.interp(zs, _uz, _ur)
print("hull radius from the Fusion STL: z=0 %.1f mm, z=25.4 %.1f mm, z=69 %.1f mm (%.2f in)" % (R[0], np.interp(25.4, zs, R), np.interp(69, zs, R), np.interp(69, zs, R) / IN))
draft_mm = 2.71 * IN                       # Test Assembly 9 loaded draft from the repo solver
M, GM_in, KG_in = 3.042, 1.33, 2.36        # from fin_analysis.py (Test Assembly 9 budget)
# wetted hull of revolution: bottom disc + side wall, mm -> m, waterline at z = 0
nz, nth = 48, 96
zz = np.linspace(0.0, draft_mm, nz)
rr = np.interp(zz, zs, R)
prof = [(0.0, 0.0)] + [(r, z) for r, z in zip(rr, zz)]
# add radial rings on the bottom disc
disc = [(r, 0.0) for r in np.linspace(0, rr[0], 14)[:-1]]
prof = disc + [(r, z) for r, z in zip(rr, zz)]
th = np.linspace(0, 2 * math.pi, nth, endpoint=False)
V = np.array([[r * math.cos(t), r * math.sin(t), z] for (r, z) in prof for t in th]) / 1000.0
V[:, 2] -= draft_mm / 1000.0
F = []
for i in range(len(prof) - 1):
    for j in range(nth):
        a = i * nth + j; b = i * nth + (j + 1) % nth; c = (i + 1) * nth + (j + 1) % nth; d = (i + 1) * nth + j
        F.append([a, d, c, b])                  # outward normals (checked below)
mesh = cpt.Mesh(vertices=V, faces=np.array(F))
if mesh.volume < 0: mesh = cpt.Mesh(vertices=V, faces=np.array(F)[:, ::-1])
print("mesh faces %d | displaced volume %.3f L | waterplane area %.4f m2 | wetted area %.4f m2" % (mesh.nb_faces, mesh.volume * 1000, mesh.waterplane_area, mesh.wet_surface_area))
zG = -(draft_mm / 1000.0) + KG_in * IN / 1000.0          # centre of gravity, m, waterline at 0
body = cpt.FloatingBody(mesh=mesh, dofs=cpt.rigid_body_dofs(rotation_center=(0, 0, zG)), center_of_mass=(0, 0, zG), name="float")
solver = cpt.BEMSolver()
RHO, g = 1025.0, 9.81
omegas = np.array([2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0])
res = {"Heave": [], "Roll": []}
for w in omegas:
    for dof in ("Heave", "Roll"):
        pb = cpt.RadiationProblem(body=body, radiating_dof=dof, omega=float(w), rho=RHO)
        r = solver.solve(pb)
        res[dof].append((r.added_masses[dof], r.radiation_dampings[dof]))
Awp = mesh.waterplane_area; C33 = RHO * g * Awp
C44 = M * g * GM_in * IN / 1000
I44 = 0.0131
print("\nomega  T(s) |  heave: A33 (kg)  B33 (kg/s)  |  roll: A44 (kg m2)  B44 (kg m2/s)")
for w, (a3, b3), (a4, b4) in zip(omegas, res["Heave"], res["Roll"]):
    print("%5.1f %5.2f | %12.3f %12.3f | %14.5f %14.5f" % (w, 2 * math.pi / w, a3, b3, a4, b4))
def interp(arr, w, k): return float(np.interp(w, omegas, [x[k] for x in arr]))
def natural(C, I, key):
    w = 5.0
    for _ in range(60): w = math.sqrt(C / (I + interp(res[key], w, 0)))
    return w
w3 = natural(C33, M, "Heave"); w4 = natural(C44, I44, "Roll")
for lab, w, C, I, key in (("Heave", w3, C33, M, "Heave"), ("Roll", w4, C44, I44, "Roll")):
    A = interp(res[key], w, 0); B = interp(res[key], w, 1); z = B / (2 * math.sqrt(C * (I + A)))
    print("%s: natural omega %.2f rad/s, period %.2f s | added %s %.5f | radiation damping ratio zeta_rad %.3f (Q_rad %.1f)" % (key, w, 2 * math.pi / w, "mass" if key == "Heave" else "inertia", A, z, 1 / (2 * z)))
print("hand estimates for comparison: heave T 0.69 s, A33 2.3 kg; roll T 0.82-1.00 s, A44 0.0078-0.023 kg m2")
