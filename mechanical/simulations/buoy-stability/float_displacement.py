"""Float displacement tool: predicted draft and displaced mass for a printed float, plus the running log and charts.

For each float in the log (`mechanical/test/float-displacement-log.csv`) this builds the true 3D hull from the STEP
(`assembly.py`: voxels, sealed hull, open bore not counted), turns it into a displaced-mass-versus-draft curve, and
draws two panels: the vertical section through the axis, and the displacement chart with every logged run plotted
on the predicted curve. A run that lands on the curve agrees with the model.

Add a run:
  .venv/bin/python float_displacement.py --add --run-id 2026-11-03-a --test RR-21 --float mushroom \\
      --step ../../cad/floatation/float-mushroom-corrected-2026-11-02.step --float-mass-g 702 --added-g 429 \\
      --basis freeboard_from_top --measured-in 4.5 --date 2026-11-03 --notes "can in the bore"
Redraw all charts:
  .venv/bin/python float_displacement.py --charts

Everything is mm in the STEP, inches in the log. Water density defaults to 1.025 g/mL (about 35 ppt, room
temperature; an estimate). Predictions are unverified until a run agrees with them (see the README).
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import assembly as A  # noqa: E402

LOG = HERE.parent.parent / "test" / "float-displacement-log.csv"
OUT = HERE / "float-displacement"
IN = 25.4
FIELDS = ["date", "run_id", "test", "float", "step_file", "float_mass_g", "added_g", "total_g", "rho_g_per_ml",
          "basis", "measured_in", "predicted_draft_in", "predicted_freeboard_in", "diff_in", "displaced_g_at_reading",
          "status", "notes"]
_cache: dict[str, tuple] = {}


def hull(step: Path):
    """Return (draft_mm sorted voxel heights, cumulative volume mL, float height mm, section points)."""
    key = str(step.resolve())
    if key in _cache:
        return _cache[key]
    import gmsh
    gmsh.initialize(); gmsh.option.setNumber("General.Terminal", 0); gmsh.clear()
    gmsh.model.occ.importShapes(str(step)); gmsh.model.occ.synchronize()
    sol = sorted(gmsh.model.getEntities(3), key=lambda dt: -gmsh.model.occ.getMass(*dt))
    gmsh.option.setNumber("Mesh.MeshSizeMax", 1.5); gmsh.model.mesh.generate(2)
    tri = A.triangles(gmsh, sol[0])
    pts = []
    for d, t in gmsh.model.getBoundary([sol[0]], oriented=False, recursive=False):
        _, c, _ = gmsh.model.mesh.getNodes(d, t, includeBoundary=True); pts.append(c.reshape(-1, 3))
    gmsh.finalize()
    P = A.voxels([tri]); keel = tri.reshape(-1, 3)[:, 2].min(); top = tri.reshape(-1, 3)[:, 2].max() - keel
    z = P[:, 2] - P[:, 2].min(); lay, cnt = np.unique(np.round(z, 3), return_counts=True)
    zs = np.r_[0.0, lay + A.DX / 2]; cum = np.r_[0.0, np.cumsum(cnt) * A.DX ** 3 / 1000.0]   # layer tops, linear between
    sec = np.vstack(pts); sec = sec[np.abs(sec[:, 1]) <= 1.2]; sec = np.c_[sec[:, 0], sec[:, 2] - keel]
    _cache[key] = (zs, cum, top, sec)
    return _cache[key]


def predict(step: Path, total_g: float, rho: float):
    zs, cum, top, _ = hull(step)
    draft = float(np.interp(total_g / rho, cum, zs))
    return draft / IN, (top - draft) / IN


def displaced_g(step: Path, draft_in: float, rho: float) -> float:
    zs, cum, _, _ = hull(step)
    return float(np.interp(draft_in * IN, zs, cum) * rho)


def add_run(a):
    step = (HERE / a.step).resolve() if not Path(a.step).is_absolute() else Path(a.step)
    total = a.float_mass_g + a.added_g
    pd, pf = predict(step, total, a.rho)
    top = hull(step)[2] / IN
    draft = a.measured_in if a.basis == "draft_bottom_up" else top - a.measured_in
    freeboard = top - draft
    diff = draft - pd            # measured draft minus predicted draft: positive = deeper than predicted
    row = {"date": a.date, "run_id": a.run_id, "test": a.test, "float": a.float, "step_file": a.step,
           "float_mass_g": a.float_mass_g, "added_g": a.added_g, "total_g": total, "rho_g_per_ml": a.rho,
           "basis": a.basis, "measured_in": a.measured_in, "predicted_draft_in": round(pd, 2),
           "predicted_freeboard_in": round(float(pf), 2), "diff_in": round(float(diff), 2),
           "displaced_g_at_reading": round(displaced_g(step, draft, a.rho)), "status": a.status, "notes": a.notes}
    new = not LOG.exists()
    with LOG.open("a", newline="") as f:
        w = csv.DictWriter(f, FIELDS)
        if new:
            w.writeheader()
        w.writerow(row)
    print(row)


def charts():
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    rows = list(csv.DictReader(LOG.open()))
    OUT.mkdir(exist_ok=True)
    for name in sorted({r["float"] for r in rows}):
        rs = [r for r in rows if r["float"] == name]
        step = (HERE / rs[0]["step_file"]).resolve()
        zs, cum, top, sec = hull(step)
        rho = float(rs[0]["rho_g_per_ml"])
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6.4), gridspec_kw={"width_ratios": [1, 1.05]})
        ax1.scatter(sec[:, 0], sec[:, 1], s=2, c="#1f4e79"); ax1.set_aspect("equal")
        ax1.set_xlabel("x (mm)"); ax1.set_ylabel("height above keel (mm)"); ax1.set_title(f"{name}: section through the axis")
        ax2.plot(zs / IN, cum * rho, c="#1f4e79", lw=2, label="model: displaced mass at each draft")
        marks = {"draft_bottom_up": "o", "freeboard_from_top": "s"}
        for r in rs:
            m = float(r["measured_in"]); basis = r["basis"]
            d = m if basis == "draft_bottom_up" else top / IN - m
            ax2.scatter([d], [float(r["total_g"])], c="#d98e04", marker=marks.get(basis, "o"), s=70, zorder=3)
            ax2.annotate(f'{r["run_id"]}\n{r["total_g"]} g', (d, float(r["total_g"])), textcoords="offset points",
                         xytext=(6, -22), fontsize=7)
            ax1.axhline(d * IN, color="#d98e04", lw=0.8, ls="--")
        ax2.scatter([], [], c="#d98e04", marker="o", s=70, label="measured (draft, true mass)")
        ax2.set_xlabel("draft, bottom up to the waterline (in)"); ax2.set_ylabel("displaced mass = float mass (g)")
        ax2.set_title("Displacement chart: points on the line agree with the model"); ax2.grid(alpha=0.3)
        ax2.legend(loc="upper left", fontsize=8)
        fig.suptitle(f"{name}  |  {rs[0]['step_file']}  |  35 ppt (1.025 g/mL, estimate)  |  UNVERIFIED until a run agrees",
                     fontsize=9, color="#a33")
        plt.tight_layout(rect=(0, 0, 1, 0.95)); out = OUT / f"{name}-displacement-chart.png"
        plt.savefig(out, dpi=130); plt.close(); print("wrote", out.relative_to(HERE.parent.parent.parent))
        np.savetxt(OUT / f"{name}-displacement-curve.csv", np.c_[zs[::5] / IN, cum[::5] * rho], delimiter=",",
                   header="draft_in,displaced_mass_g", comments="", fmt="%.3f")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--charts", action="store_true"); p.add_argument("--add", action="store_true")
    for k in ("run-id", "test", "float", "step", "date", "basis", "notes"):
        p.add_argument(f"--{k}")
    for k in ("float-mass-g", "added-g", "measured-in", "rho"):
        p.add_argument(f"--{k}", type=float)
    p.add_argument("--status", default="unverified")
    a = p.parse_args()
    a.rho = a.rho or 1.025; a.added_g = a.added_g or 0.0
    if a.add:
        add_run(a)
    if a.charts:
        charts()
