# Buoy 3D viewer (2026-11-06)

> **Summary**: One self-contained web page that shows the buoy CAD in 3D, styled in the site's Tideline design. Pick a design, drag to
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

All 15 designs in the stability simulator, plus two floats that are not in it. Newest first in the picker.

| Id | Design | Source |
|---|---|---|
| `ta10`, `ta9` | Test Assembly 10 and 9 printed floats, float body only, exported from Fusion 2026-11-13 | `floatation/test-assembly-10-float-2026-11-13.step`, `floatation/test-assembly-9-float-2026-11-13.step` |
| `float-regular` | Regular float (self-righted in RR-29) | `floatation/float-regular-2026-11-02.step` |
| `float-mushroom-corrected` | Mushroom float, re-exported 2026-11-02 | `floatation/float-mushroom-corrected-2026-11-02.step` |
| `mushroom` | Mushroom float as the simulator has it (2026-10-28 file) | `floatation/float-mushroom.step` |
| `assembly-v7`, `assembly-v6`, `assembly-v5` | Full buoy assemblies | `full-buoy-assembly-v*.step` |
| `wedge-bolted-v4`, `wedge-bolted-v3`, `wedge-snap-v3` | Chassis, wedges and caps | `floatation/` |
| `v5-pegs-seated` | The three v5 sections with each peg slid into the next socket, no trimming (2026-11-06). Each section is lifted by the body height of the one below (63.5 mm, then 127 mm), the lowest height with zero overlap | `floatation/floatation-v5-*-section.step` |
| `v6-pegs-seated` | Same stack with the redesigned top section (79.8 mm tall instead of 125.4), same lift heights | `floatation/floatation-v5b-top-section.step` and the v5 bottom and middle |
| `v10-bottom`, `v10-concept`, `v8-concept`, `v4-concept`, `v3`, `v2`, `v1` | Earlier concepts (v8 was v7 and v10 was v9 before the 2026-11-06 renumbering; CAD file names unchanged) | `floatation/` |

The ids match `buoy-stability/iterations.json`, so the viewer and the simulator can name the same design.
Entries with an `assembly` block there (stacked sections, wedges copied around the chassis, trims) are placed
by the same rules as `assembly.py`, and carry the simulator's electronics housing (shown as "Electronics housing
body/flange (simulator)", a plain cylinder, not your CAD). Single-file entries are read as they come.

**To update a design:** replace the STEP in `mechanical/cad/` (same name) or point its registry entry at a new
file, then rebuild. **To add one:** add it to `iterations.json` (it then also appears in the simulator) or to
`EXTRA` in `convert_models.py` (single files only). Registry entries can lift parts with `z_offset_mm`. A new id goes in `ORDER` to set its place in the picker; otherwise it lands last.

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

`convert_models.py` writes `data/<id>.json` (mesh arrays, part names, volumes) and `data/index.json` (picker order). It also takes ids to rebuild just those, for example `convert_models.py assembly-v7`. `build_viewer.py`
inlines those plus the vendored three.js into `buoy-viewer.html`. The second step needs no CAD
library, so a teammate without `cadquery` can still rebuild from the committed `data/`.

## On the website

The public Technology page embeds this viewer together with the stability explorer, driven by one slider
(`analytics/telemetry/site/design_explorer.py`, which also writes the site copy under `static/viewer/`). After
changing a model or this page, rebuild here, then run `python3 -m telemetry.site.design_explorer` from `analytics/`.
Opened with `?embed=1` the page hides its own title and design picker and keeps the controls.

## Things to know

- **Units and axes:** the STEP files are millimetres, Z up. The page shows millimetres and inches.
- **Part names come from the CAD.** Several parts are unnamed in the source (`Component1`,
  `=>[0:1:1:4]`), so the list shows them as "Unnamed part" with their volume. Naming them in the
  CAD fixes it everywhere. The list groups identical parts (for example six wedges, shown as ×6).
- **Page size is about 7.6 MB** with all 17 models. Fine from disk; for the site it may be better to load models only when picked.
- **Look:** colours, type and square hairline plates follow the Tideline tokens (`analytics/telemetry/site/theme/tokens.py`), light and dark. The fonts load from `../fonts/` once the page sits in the site's `assets/`; standalone it falls back to system fonts.
- **Skipped on conversion:** `Wedge Bottom (1.5")` has no surfaces in the v6 and v7 STEP files, so
  it is not drawn. The conversion prints this each run.
- **Mesh accuracy:** 0.25 mm deflection from the true surface. Colours are assigned by part size
  and mean nothing physical.
- **Cut through** is a visual cut only; it draws no cap on the cut face.
- **Vendored libraries:** `vendor/three.min.js` and `vendor/orbit-controls.js` are three.js r147
  (MIT, [`vendor/license-three.txt`](vendor/license-three.txt)), kept in the repo because the site
  never loads scripts from another host.
