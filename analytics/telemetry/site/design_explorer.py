"""Build the data behind the Technology page's stability stage: every buoy design, floated and tilted in 3D.

The stage itself is hand-written (``static/explorer/explorer.js`` and ``explorer.css``). This writes what it reads,
all under ``static/explorer/`` (copied to ``assets/explorer/`` at build time):

* ``data.json``: every design in ``mechanical/simulations/buoy-stability/iterations.json`` order, with its draft and
  righting-arm series exactly as the stability simulator computed them, and where its keel sits in the 3D model.
* ``models/<id>.json``: one 3D model per design from ``mechanical/simulations/buoy-viewer/data/``, so the page loads
  only the design being looked at instead of every model at once.
* ``vendor/``: the three.js build and orbit controls the standalone viewer already vendors.
* ``index.html``: the stage on a page of its own, for "Open full screen".

The solver results are read from the simulator's generated ``stability-explorer.html``, the one file that holds the
per-design series (``explorer-data.json`` keeps only the base sweep). Refresh after the simulator, the 3D models or the
registry change (run from ``analytics/``)::

    python3 -m telemetry.site.design_explorer ../mechanical/simulations/buoy-stability/results/<date>/stability-explorer.html
"""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

_HERE = Path(__file__).parent
_REPO = _HERE.parents[2]
_REGISTRY = _REPO / "mechanical" / "simulations" / "buoy-stability" / "iterations.json"
_VIEWER_DIR = _REPO / "mechanical" / "simulations" / "buoy-viewer"
_OUT = _HERE / "static" / "explorer"

_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")

_PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Buoy stability stage · S.C.O.U.T.</title>
<link rel="stylesheet" href="explorer.css">
</head>
<body class="xp-page">
<main class="xp-solo">
<p class="xp-eyebrow">S.C.O.U.T. · Stability</p>
<h1>See it, then test it</h1>
<div class="xp" data-explorer data-base="./"></div>
</main>
<script defer src="explorer.js"></script>
<script defer src="explorer-ui.js"></script>
</body>
</html>
"""


def _chip_date(when: str) -> str:
    """The one date a timeline chip shows: the first date for a dated design, "concept" for an undated one."""
    found = _DATE.search(when)
    return "concept" if when.startswith("concept") or not found else found.group()


def _short_names(names: list[str]) -> list[str]:
    """Chip labels: each name up to its first " — " or " (", keeping more of the name where that would repeat a label."""
    cut = [n.split(" (")[0].split(" — ")[0].replace("Full buoy assembly", "Assembly") for n in names]
    return [c if cut.count(c) == 1 else n.split(" (")[0].replace(" — ", " ") for c, n in zip(cut, names)]


def solver_results(explorer_html: str) -> dict:
    """The series, lead masses and per-design inputs the simulator embedded in its generated page."""
    line = next((ln for ln in explorer_html.splitlines() if ln.startswith("const D=")), None)
    if line is None:
        raise ValueError("stability-explorer.html changed; no `const D=` line")
    dec, out, at = json.JSONDecoder(), {}, 0
    for name in ("D", "LEAD", "ITS"):
        start = line.find(name + "=", at)
        if start < 0:
            raise ValueError(f"stability-explorer.html changed; {name} not found")
        out[name], at = dec.raw_decode(line, start + len(name) + 1)
    # Housing-top height of the two wedge-bottom cap sweeps (the assemblies that carry no top_in of their own).
    top = explorer_html.find("const CAPTOP=")
    if top < 0:
        raise ValueError("stability-explorer.html changed; CAPTOP not found")
    out["CAPTOP"], _ = dec.raw_decode(explorer_html, top + len("const CAPTOP="))
    return out


def _keel_mm(reg_item: dict, model: dict) -> float:
    """Height of the keel in the 3D model's frame: recorded for placed assemblies, else the model's lowest point.

    The simulator measures every height from the keel, and its cross-sections start at 0 there, so this is the one
    offset that puts the solver's waterline and centre of gravity on the 3D model."""
    keel = reg_item.get("keel_z_mm")
    return float(keel) if keel is not None else float(model["bbox_mm"][0][2])


def build_data(solver: dict, models: dict[str, dict]) -> dict:
    reg = json.loads(_REGISTRY.read_text(encoding="utf-8"))["iterations"]
    its = {it["id"]: it for it in solver["ITS"]}
    shorts = _short_names([it["name"] for it in reg])
    designs = []
    for item, short in zip(reg, shorts):
        it = its.get(item["id"])
        if it is None:
            raise ValueError(f"{item['id']} is in iterations.json but not in the simulator's page; re-run it")
        designs.append({
            "id": item["id"], "name": item["name"], "short": short, "when": item["when"],
            "date": _chip_date(item["when"]), "note": it.get("note") or "", "hydro": it.get("hydro"),
            "keel_mm": round(_keel_mm(item, models[item["id"]]), 2),
        })
    keys = {f"{d['hydro']['cap']}_{b}" for d in designs if d["hydro"] for b in (0, 1)}
    return {"designs": designs, "lead_kg": solver["LEAD"], "cap_top_in": solver["CAPTOP"],
            "series": {k: v for k, v in solver["D"].items() if k in keys}}


def _models() -> dict[str, dict]:
    order = json.loads((_VIEWER_DIR / "data" / "index.json").read_text(encoding="utf-8"))
    return {i: json.loads((_VIEWER_DIR / "data" / f"{i}.json").read_text(encoding="utf-8")) for i in order}


def write(explorer_html: str) -> int:
    """Write everything under ``static/explorer/`` except the hand-written stage; returns the bytes written."""
    models = _models()
    data = build_data(solver_results(explorer_html), models)
    (_OUT / "models").mkdir(parents=True, exist_ok=True)
    (_OUT / "vendor").mkdir(parents=True, exist_ok=True)
    files = {"data.json": json.dumps(data, ensure_ascii=False, separators=(",", ":")), "index.html": _PAGE}
    for d in data["designs"]:
        m = models[d["id"]]
        files[f"models/{d['id']}.json"] = json.dumps({"bbox_mm": m["bbox_mm"], "parts": m["parts"]},
                                                     separators=(",", ":"))
    stale = {p.name for p in (_OUT / "models").glob("*.json")} - {f"{d['id']}.json" for d in data["designs"]}
    for name in stale:
        (_OUT / "models" / name).unlink()
    for name, text in files.items():
        (_OUT / name).write_text(text, encoding="utf-8")
    for name in ("three.min.js", "orbit-controls.js"):
        shutil.copyfile(_VIEWER_DIR / "vendor" / name, _OUT / "vendor" / name)
    return sum(len(t) for t in files.values())


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    size = write(Path(sys.argv[1]).read_text(encoding="utf-8"))
    print(f"wrote static/explorer/ ({size / 1e6:.2f} MB of data and pages)")
