"""Turn the buoy STEP files into mesh data the browser viewer can draw.

Reads each model listed in ``MODELS`` (STEP, millimetres, Z up), walks the assembly tree with
OpenCascade so every part keeps its CAD name and placement, tessellates it, and writes one
``data/<id>.json`` per model: part names, colours, volumes and base64 float32/uint32 mesh arrays.
``build_viewer.py`` then inlines those files into the single self-contained viewer HTML.

    python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
    .venv/bin/python convert_models.py            # all models
    .venv/bin/python convert_models.py float-regular
"""

from __future__ import annotations

import base64
import json
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
from OCP.XCAFApp import XCAFApp_Application
from OCP.XCAFDoc import XCAFDoc_DocumentTool

CAD = Path(__file__).resolve().parents[2] / "cad"
OUT = Path(__file__).parent / "data"

# id, label, STEP path under mechanical/cad, one line shown under the model picker.
MODELS = [
    ("float-regular", "Regular float (2026-11-02)", "floatation/float-regular-2026-11-02.step",
     "The printed float that self-righted in the tilt test (RR-29)."),
    ("float-mushroom", "Mushroom float (corrected, 2026-11-02)", "floatation/float-mushroom-corrected-2026-11-02.step",
     "Float with the mushroom top. Not used in the first tilt test."),
    ("assembly-v6", "Full buoy assembly v6", "full-buoy-assembly-v6.step", "Float, wedges and housing, v6."),
    ("assembly-v7", "Full buoy assembly v7", "full-buoy-assembly-v7.step", "Latest full assembly on record, v7."),
]

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


def convert(model_id: str, label: str, rel: str, blurb: str) -> Path:
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

    parts, seen = [], {}
    for r in range(1, roots.Length() + 1):
        for name, shape in _leaves(shape_tool, roots.Value(r), TopLoc_Location(), [_name(roots.Value(r))]):
            mesh = _mesh(shape)
            if mesh is None:
                print(f"  skipped '{name}': no surfaces")
                continue
            v, t = mesh
            seen[name] = seen.get(name, 0) + 1
            props = GProp_GProps()
            BRepGProp.VolumeProperties_s(shape, props)
            parts.append({"name": name if seen[name] == 1 else f"{name} ({seen[name]})",
                          "volume_cm3": round(abs(props.Mass()) / 1000.0, 2),
                          "verts": base64.b64encode(v.tobytes()).decode(),
                          "tris": base64.b64encode(t.tobytes()).decode(),
                          "nverts": int(len(v)), "ntris": int(len(t))})
    box = Bnd_Box()
    for r in range(1, roots.Length() + 1):
        BRepBndLib.Add_s(shape_tool.GetShape_s(roots.Value(r)), box)
    lo, hi = box.CornerMin(), box.CornerMax()
    data = {"id": model_id, "label": label, "source": f"mechanical/cad/{rel}", "blurb": blurb, "units": "mm",
            "bbox_mm": [[lo.X(), lo.Y(), lo.Z()], [hi.X(), hi.Y(), hi.Z()]], "parts": parts}
    OUT.mkdir(exist_ok=True)
    path = OUT / f"{model_id}.json"
    path.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    tri_total = sum(p["ntris"] for p in parts)
    print(f"{model_id}: {len(parts)} parts, {tri_total:,} triangles, {path.stat().st_size / 1e6:.2f} MB")
    return path


if __name__ == "__main__":
    wanted = set(sys.argv[1:])
    for spec in MODELS:
        if not wanted or spec[0] in wanted:
            convert(*spec)
