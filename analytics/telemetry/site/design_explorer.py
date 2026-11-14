"""Build the site's design explorer: one design picker that drives the 3D viewer and the stability explorer together.

Writes two generated files into ``static/`` (copied to ``assets/`` at build time, like the stability explorer):

* ``static/viewer/``: the 3D buoy viewer from ``mechanical/simulations/buoy-viewer/``, split for the site into a small
  ``index.html`` plus ``three.min.js``, ``orbit-controls.js`` and ``models.js`` (the standalone viewer inlines all of
  these into one file; on the site they are separate, cacheable and kept out of the HTML the self-containment test reads).
* ``static/design-explorer/index.html``: the page the Technology page embeds. It holds the shared design picker (a timeline of
  chips) and two frames (the viewer and ``static/stability/index.html``, both opened with ``?embed=1``) and tells both which design
  to show whenever the pick changes.

The design list, its order and names come from ``mechanical/simulations/buoy-stability/iterations.json``, the same
registry the stability explorer and the viewer are built from, so the three cannot disagree. Refresh after the
simulator, the viewer or the registry changes (run from ``analytics/``)::

    python3 -m telemetry.site.stability_embed <path to stability-explorer.html>
    python3 -m telemetry.site.design_explorer
"""

from __future__ import annotations

import json
import re
from pathlib import Path

_HERE = Path(__file__).parent
_REPO = _HERE.parents[2]
_REGISTRY = _REPO / "mechanical" / "simulations" / "buoy-stability" / "iterations.json"
_VIEWER_DIR = _REPO / "mechanical" / "simulations" / "buoy-viewer"
_VIEWER_OUT = _HERE / "static" / "viewer"
_OUT = _HERE / "static" / "design-explorer" / "index.html"

_TEMPLATE = _HERE / "design-explorer-template.html"


_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")


def _chip_date(when: str) -> str:
    """The one date a timeline chip shows: the first date for a dated design, "concept" for an undated one."""
    found = _DATE.search(when)
    return "concept" if when.startswith("concept") or not found else found.group()


def _short_names(names: list[str]) -> list[str]:
    """Chip labels: each name up to its first " — " or " (", keeping more of the name where that would repeat a label."""
    cut = [n.split(" (")[0].split(" — ")[0].replace("Full buoy assembly", "Assembly") for n in names]
    return [c if cut.count(c) == 1 else n.split(" (")[0].replace(" — ", " ") for c, n in zip(cut, names)]


def designs() -> list[dict]:
    """Every design in the stability registry, oldest to newest, as the explorer's timeline orders them."""
    reg = json.loads(_REGISTRY.read_text(encoding="utf-8"))["iterations"]
    shorts = _short_names([it["name"] for it in reg])
    return [{"id": it["id"], "name": it["name"], "when": it["when"], "short": s, "date": _chip_date(it["when"])}
            for it, s in zip(reg, shorts)]


def build() -> str:
    return _TEMPLATE.read_text(encoding="utf-8").replace(
        "__DESIGNS__", json.dumps(designs(), ensure_ascii=False, separators=(",", ":")))


def build_viewer() -> dict[str, str]:
    """The site's viewer files, by name: the template with its inlined library and model data pulled out into scripts."""
    html = (_VIEWER_DIR / "viewer-template.html").read_text(encoding="utf-8")
    for token, line in (("<script>/*THREE*/</script>", '<script src="three.min.js"></script>'),
                        ("<script>/*CONTROLS*/</script>", '<script src="orbit-controls.js"></script>\n<script src="models.js"></script>'),
                        ("const MODELS = /*MODELS*/;", "const MODELS = window.SCOUT_MODELS;")):
        if html.count(token) != 1:
            raise ValueError(f"viewer template changed; {token!r} not found exactly once")
        html = html.replace(token, line)
    order = json.loads((_VIEWER_DIR / "data" / "index.json").read_text(encoding="utf-8"))
    models = [json.loads((_VIEWER_DIR / "data" / f"{i}.json").read_text(encoding="utf-8")) for i in order]
    return {"index.html": html,
            "three.min.js": (_VIEWER_DIR / "vendor" / "three.min.js").read_text(encoding="utf-8"),
            "orbit-controls.js": (_VIEWER_DIR / "vendor" / "orbit-controls.js").read_text(encoding="utf-8"),
            "models.js": "window.SCOUT_MODELS=" + json.dumps(models, separators=(",", ":")) + ";"}


if __name__ == "__main__":
    _VIEWER_OUT.parent.mkdir(parents=True, exist_ok=True)
    _VIEWER_OUT.mkdir(parents=True, exist_ok=True)
    files = build_viewer()
    for name, text in files.items():
        (_VIEWER_OUT / name).write_text(text, encoding="utf-8")
    _OUT.parent.mkdir(parents=True, exist_ok=True)
    _OUT.write_text(build(), encoding="utf-8")
    mb = sum(len(t) for t in files.values()) / 1e6
    print(f"wrote viewer/ ({len(files)} files, {mb:.2f} MB) and design-explorer/index.html, {len(designs())} designs")
