"""Turn the buoy STEP files into mesh data the browser viewer can draw.

Models come from two places (STEP, millimetres, Z up):

* every design in the stability simulator's registry, ``../buoy-stability/iterations.json``. Entries with an
  ``assembly`` block are placed exactly as ``assembly.py`` places them (stack, mate to the part below, copy around the
  vertical axis, trim), plus the simulator's electronics housing, so the viewer and the simulator show the same shape.
  Entries with one ``files`` STEP are read as they come, keeping each part's CAD name.
* ``EXTRA``: models that are not in the simulator.

Each model becomes ``data/<id>.json`` (part names, volumes, base64 float32/uint32 meshes) and ``data/index.json``
lists the picker order. ``build_viewer.py`` then inlines them into the single self-contained viewer HTML.

    python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
    .venv/bin/python convert_models.py            # all models
    .venv/bin/python convert_models.py float-regular
"""

from __future__ import annotations

import base64
import json
import math
import sys
from pathlib import Path

import numpy as np
from OCP.BRepBndLib import BRepBndLib
from OCP.BRepGProp import BRepGProp
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.BRep import BRep_Tool
from OCP.Bnd import Bnd_Box
from OCP.GProp import GProp_GProps
from OCP.IFSelect import IFSelect_RetDone
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TCollection import TCollection_ExtendedString
from OCP.TDF import TDF_Label, TDF_LabelSequence
from OCP.TDataStd import TDataStd_Name
from OCP.TDocStd import TDocStd_Document
from OCP.TopAbs import TopAbs_FORWARD
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_FACE
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS
from OCP.BRepAlgoAPI import BRepAlgoAPI_Cut
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakeCylinder
from OCP.gp import gp_Ax1, gp_Dir, gp_Pnt, gp_Trsf, gp_Vec
from OCP.XCAFApp import XCAFApp_Application
from OCP.XCAFDoc import XCAFDoc_DocumentTool

HERE = Path(__file__).parent
SIM = HERE.parent / "buoy-stability" / "iterations.json"
CAD = HERE.parents[1] / "cad"
OUT = HERE / "data"

# Models that are not in the simulator: id, label, STEP path under mechanical/cad, one line under the picker.
EXTRA = [
    ("float-regular", "Regular float (2026-11-02)", "floatation/float-regular-2026-11-02.step",
     "The printed float that self-righted in the tilt test (RR-29)."),
    ("float-mushroom-corrected", "Mushroom float, corrected (2026-11-02)", "floatation/float-mushroom-corrected-2026-11-02.step",
     "Mushroom float re-exported 2026-11-02. The simulator's own mushroom entry uses the older 2026-10-28 file."),
]

# Picker order: newest first. Anything in the registry that is not listed here is added at the end.
ORDER = ["ta10", "ta9", "float-regular", "float-mushroom-corrected", "mushroom", "assembly-v7", "assembly-v6", "assembly-v5",
         "wedge-bolted-v4", "wedge-bolted-v3", "wedge-snap-v3", "v10-bottom", "v10-concept", "v8-concept",
         "v6-pegs-seated", "v5-pegs-seated", "v4-concept", "v3", "v2", "v1"]

# Electronics housing the simulator adds on top of the hull (assembly.py: body 127 mm, flange on top).
HOUSING_R, HOUSING_L, FLANGE_R, FLANGE_T = 57.15, 127.0, 95.25, 8.9

# Deflection of the mesh from the true surface, in mm. 0.25 keeps a 450 mm buoy smooth at a few MB.
LINEAR_TOL = 0.25
ANGULAR_TOL = 0.35


def _name(label: TDF_Label) -> str:
    attr = TDataStd_Name()
    if label.FindAttribute(TDataStd_Name.GetID_s(), attr):
        return attr.Get().ToExtString().strip()
    return ""


def _leaves(shape_tool, label, loc, path):
    """Yield (name, shape-with-placement) for every simple shape under ``label``."""
    if shape_tool.IsAssembly_s(label):
        comps = TDF_LabelSequence()
        shape_tool.GetComponents_s(label, comps)
        for i in range(1, comps.Length() + 1):
            comp = comps.Value(i)
            ref = TDF_Label()
            if shape_tool.GetReferredShape_s(comp, ref):
                cloc = shape_tool.GetLocation_s(comp)
                yield from _leaves(shape_tool, ref, loc * cloc, path + [_name(comp) or _name(ref)])
    else:
        shape = shape_tool.GetShape_s(label)
        yield (path[-1] if path else _name(label)) or "Part", shape.Located(loc * shape.Location())


def _mesh(shape):
    """Return (n x 3 float32 vertices, m x 3 uint32 triangles) for a shape, one vertex set per face."""
    BRepMesh_IncrementalMesh(shape, LINEAR_TOL, False, ANGULAR_TOL, True)
    verts, tris, base = [], [], 0
    exp = TopExp_Explorer(shape, TopAbs_FACE)
    while exp.More():
        face = TopoDS.Face_s(exp.Current())
        loc = TopLoc_Location()
        tri = BRep_Tool.Triangulation_s(face, loc)
        if tri is not None:
            trsf = loc.Transformation()
            pts = np.array([[p.X(), p.Y(), p.Z()] for p in (tri.Node(i).Transformed(trsf) for i in range(1, tri.NbNodes() + 1))])
            flip = face.Orientation() != TopAbs_FORWARD
            t = np.array([[tri.Triangle(i).Value(k) - 1 for k in (1, 2, 3)] for i in range(1, tri.NbTriangles() + 1)])
            if flip:
                t = t[:, [0, 2, 1]]
            verts.append(pts)
            tris.append(t + base)
            base += len(pts)
        exp.Next()
    if not verts:
        return None
    return np.vstack(verts).astype("<f4"), np.vstack(tris).astype("<u4")



def _read(rel):
    """Open a STEP with names. Returns (shape_tool, root labels)."""
    app = XCAFApp_Application.GetApplication_s()
    doc = TDocStd_Document(TCollection_ExtendedString("MDTV-CAF"))
    app.InitDocument(doc)
    reader = STEPCAFControl_Reader()
    reader.SetNameMode(True)
    if reader.ReadFile(str(CAD / rel)) != IFSelect_RetDone or not reader.Transfer(doc):
        raise SystemExit(f"could not read {rel}")
    shape_tool = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
    roots = TDF_LabelSequence()
    shape_tool.GetFreeShapes(roots)
    return doc, shape_tool, roots


def _file_parts(rel):
    """All leaf (name, shape) in one STEP, with the document kept alive by the caller."""
    doc, shape_tool, roots = _read(rel)
    out = [(n, s) for r in range(1, roots.Length() + 1)
           for n, s in _leaves(shape_tool, roots.Value(r), TopLoc_Location(), [_name(roots.Value(r))])]
    return doc, out


def _zrange(shape):
    box = Bnd_Box()
    BRepBndLib.Add_s(shape, box)
    return box.CornerMin().Z(), box.CornerMax().Z()


def _volume(shape):
    props = GProp_GProps()
    BRepGProp.VolumeProperties_s(shape, props)
    return abs(props.Mass())


def _move(shape, dz=0.0, rot=0.0):
    trsf = gp_Trsf()
    if rot:
        trsf.SetRotation(gp_Ax1(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1)), rot)
    if dz:
        t2 = gp_Trsf()
        t2.SetTranslation(gp_Vec(0, 0, dz))
        trsf = t2.Multiplied(trsf)
    return BRepBuilderAPI_Transform(shape, trsf, True).Shape()


def _largest_solid(shape):
    """Keep the biggest solid of a boolean result, as assembly.py does after a trim."""
    from OCP.TopAbs import TopAbs_SOLID
    exp, best, bv = TopExp_Explorer(shape, TopAbs_SOLID), None, -1.0
    while exp.More():
        v = _volume(exp.Current())
        if v > bv:
            best, bv = exp.Current(), v
        exp.Next()
    return best


def _trim(shape, p):
    """assembly.py's keep_above_z (drop posts below a height) and cut_tube (remove a tall thin outer wall)."""
    if p.get("keep_above_z") is not None:
        cutter = BRepPrimAPI_MakeBox(gp_Pnt(-400, -400, -100), 800, 800, 100 + p["keep_above_z"]).Shape()
        shape = _largest_solid(BRepAlgoAPI_Cut(shape, cutter).Shape())
    if p.get("cut_tube"):
        r_in, z0 = p["cut_tube"]
        outer = BRepPrimAPI_MakeCylinder(gp_Ax2_z(0, 0, z0), r_in + 80, 300).Shape()
        inner = BRepPrimAPI_MakeCylinder(gp_Ax2_z(0, 0, z0 - 10), r_in, 320).Shape()
        tube = BRepAlgoAPI_Cut(outer, inner).Shape()
        shape = _largest_solid(BRepAlgoAPI_Cut(shape, tube).Shape())
    return shape


def gp_Ax2_z(x, y, z):
    from OCP.gp import gp_Ax2
    return gp_Ax2(gp_Pnt(x, y, z), gp_Dir(0, 0, 1))


def _place_assembly(it):
    """Mirror of assembly.place(): returns [(name, shape)] for one registry entry, then the housing if it has one."""
    keep, parts, prev_top = [], [], None
    for p in it["assembly"]["parts"]:
        doc, leaves = _file_parts(p["file"])
        keep.append(doc)
        stem = Path(p["file"]).stem
        solids = [_trim(s, p) for _, s in leaves] if (p.get("keep_above_z") is not None or p.get("cut_tube")) else [s for _, s in leaves]
        lo = min(_zrange(s)[0] for s in solids)
        hi = max(_zrange(s)[1] for s in solids)
        count, over = p.get("count", 1), p.get("overlap_mm", 0.0)
        dz0 = (prev_top - lo) if (p.get("mate") == "bottom" and prev_top is not None) else p.get("z_offset_mm", 0.0)
        for k in range(count):
            for s in solids:
                base = _move(s, dz=dz0 + k * (hi - lo - over))
                n = p.get("around", 1)
                for a in range(n):
                    parts.append((stem, _move(base, rot=2 * math.pi * a / n) if a else base))
        prev_top = hi + dz0 + (count - 1) * (hi - lo - over)
    if it["assembly"].get("housing"):
        top = max(_zrange(s)[1] for _, s in parts)
        parts.append(("Electronics housing body (simulator)",
                      BRepPrimAPI_MakeCylinder(gp_Ax2_z(0, 0, top - HOUSING_L), HOUSING_R, HOUSING_L).Shape()))
        parts.append(("Electronics housing flange (simulator)",
                      BRepPrimAPI_MakeCylinder(gp_Ax2_z(0, 0, top), FLANGE_R, FLANGE_T).Shape()))
    return keep, parts


def _write(model_id, label, source, blurb, named):
    parts, seen = [], {}
    for name, shape in named:
        mesh = _mesh(shape)
        if mesh is None:
            print(f"  skipped '{name}': no surfaces")
            continue
        v, t = mesh
        seen[name] = seen.get(name, 0) + 1
        parts.append({"name": name if seen[name] == 1 else f"{name} ({seen[name]})",
                      "volume_cm3": round(_volume(shape) / 1000.0, 2),
                      "verts": base64.b64encode(v.tobytes()).decode(),
                      "tris": base64.b64encode(t.tobytes()).decode(),
                      "nverts": int(len(v)), "ntris": int(len(t))})
    box = Bnd_Box()
    for _, shape in named:
        BRepBndLib.Add_s(shape, box)
    lo, hi = box.CornerMin(), box.CornerMax()
    data = {"id": model_id, "label": label, "source": source, "blurb": blurb, "units": "mm",
            "bbox_mm": [[lo.X(), lo.Y(), lo.Z()], [hi.X(), hi.Y(), hi.Z()]], "parts": parts}
    OUT.mkdir(exist_ok=True)
    path = OUT / f"{model_id}.json"
    path.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    print(f"{model_id}: {len(parts)} parts, {sum(p['ntris'] for p in parts):,} triangles, {path.stat().st_size / 1e6:.2f} MB")


def convert_file(model_id, label, rel, blurb):
    doc, named = _file_parts(rel)
    _write(model_id, label, f"mechanical/cad/{rel}", blurb, named)


def convert_sim(it):
    blurb = f"{it.get('when', '')}. Placed as the stability simulator places it.".lstrip(". ")
    if it.get("assembly"):
        keep, named = _place_assembly(it)
        files = ", ".join(p["file"] for p in it["assembly"]["parts"])
        _write(it["id"], it["name"], f"mechanical/cad/{files}".replace(", ", ", mechanical/cad/"), blurb, named)
    else:
        rel = it["files"][0]
        doc, named = _file_parts(rel)
        _write(it["id"], it["name"], f"mechanical/cad/{rel}", blurb, named)


def main(wanted):
    sims = {it["id"]: it for it in json.loads(SIM.read_text(encoding="utf-8"))["iterations"]}
    extra = {e[0]: e for e in EXTRA}
    order = ORDER + [i for i in list(sims) + list(extra) if i not in ORDER]
    for mid in order:
        if wanted and mid not in wanted:
            continue
        convert_file(*extra[mid]) if mid in extra else convert_sim(sims[mid])
    OUT.mkdir(exist_ok=True)
    (OUT / "index.json").write_text(json.dumps(order), encoding="utf-8")


if __name__ == "__main__":
    main(set(sys.argv[1:]))
