# Buoy 3D viewer (2026-11-06)

> **Summary**: One self-contained web page that shows the buoy CAD in 3D. Pick a design, drag to
> turn it, switch parts off, spread them apart, or cut the model in half. Every shape is
> tessellated from the committed STEP files, not redrawn. This is the standalone first version;
> linking it to the stability explorer's design slider and putting it on the public site is the
> next step.

---

## Use it

Open [`buoy-viewer.html`](buoy-viewer.html) in a browser. It makes no network requests.

| Control | What it does |
|---|---|
| Design picker, arrow buttons, left and right arrow keys | Switch between the four models |
| Drag, scroll, right-drag | Turn, zoom, move |
| Part list | Tick to show or hide a part; hover to highlight it |
| Spread apart | Pushes each part outward from the centre |
| Cut through | Removes everything on one side of a vertical plane through the model |
| Wireframe, Reset view | As named |

The page reads `?model=<id>` and also accepts `postMessage({model: '<id>'})`, so the site and
the stability explorer can later pick which design is shown.

## Models

| Id | Design | STEP source |
|---|---|---|
| `float-regular` | Regular float (the design that self-righted in RR-29) | `mechanical/cad/floatation/float-regular-2026-11-02.step` |
| `float-mushroom` | Mushroom float, corrected | `mechanical/cad/floatation/float-mushroom-corrected-2026-11-02.step` |
| `assembly-v6` | Full buoy assembly v6 | `mechanical/cad/full-buoy-assembly-v6.step` |
| `assembly-v7` | Full buoy assembly v7 | `mechanical/cad/full-buoy-assembly-v7.step` |

To add a design, add one line to `MODELS` in `convert_models.py` and its id to `ORDER` in
`build_viewer.py`, then rebuild.

## Rebuild after the CAD changes

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

```bash
.venv/bin/python convert_models.py
```

```bash
python3 build_viewer.py
```

`convert_models.py` writes `data/<id>.json` (mesh arrays, part names, volumes). `build_viewer.py`
inlines those plus the vendored three.js into `buoy-viewer.html`. The second step needs no CAD
library, so a teammate without `cadquery` can still rebuild from the committed `data/`.

## Things to know

- **Units and axes:** the STEP files are millimetres, Z up. The page shows millimetres and inches.
- **Part names come from the CAD.** Several parts are unnamed in the source (`Component1`,
  `=>[0:1:1:4]`), so the list shows them as "Unnamed part" with their volume. Naming them in the
  CAD fixes it everywhere. The list groups identical parts (for example six wedges, shown as ×6).
- **Skipped on conversion:** `Wedge Bottom (1.5")` has no surfaces in the v6 and v7 STEP files, so
  it is not drawn. The conversion prints this each run.
- **Mesh accuracy:** 0.25 mm deflection from the true surface. Colours are assigned by part size
  and mean nothing physical.
- **Cut through** is a visual cut only; it draws no cap on the cut face.
- **Vendored libraries:** `vendor/three.min.js` and `vendor/OrbitControls.js` are three.js r147
  (MIT, [`vendor/LICENSE-three.txt`](vendor/LICENSE-three.txt)), kept in the repo because the site
  never loads scripts from another host.
