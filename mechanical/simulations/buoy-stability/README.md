# Buoy Stability Calculator

> **Summary** — Computes the buoy's floating waterline, freeboard, GM, and the full righting-arm
> curve from 0 to 180° directly from the committed STEP geometry. It also answers the design
> question "does it right itself from any angle?" and finds the minimum ballast that makes it do so.
> **Current results: [`results/2026-09-29/`](results/2026-09-29/).** Method and interpretation:
> [Stability Analysis §12](../../../docs/engineering/buoy-structural/stability-analysis.md#12-large-angle-stability-capsize-and-self-righting-ballast--2026-09-29).

---

## Run it

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

```bash
.venv/bin/python run_studies.py
```

This writes a new `results/<today>/` folder (~15 min). Use `--quick` for just the regression check
and the current configuration (~1 min). Open `results/<date>/stability-explorer.html` in any
browser for the interactive version: a housing-mass slider, cap height (3.0 / 1.5 / none), and
ballast on/off.

## Printed-float tip explorer (added 2026-10-14)

For the battery-only printed-float redesign: [`printed-float-tip-explorer/`](printed-float-tip-explorer/README.md).
Open **[`printed-float-tip-explorer.html`](printed-float-tip-explorer/printed-float-tip-explorer.html)** in a browser: drag the
heel slider or press Play to tilt the buoy and see G, B, the righting arm and where it tips, with mass sliders. It has its own
solver and float STEP, separate from the v5/v6 explorer below.

## Every iteration has stability and buoyancy (updated 2026-10-28)

All 15 iterations now show draft, freeboard, GM and the righting-arm curve. The 12 concept and assembly entries before the mushroom
come from [`assembly.py`](assembly.py) (the v5/v6/v7 assemblies still use the original solver, untouched):

- **Parts placed from the STEP files**, not sketched: sections stacked (v3 and v4: three; v5: bottom with top on it; v7: bottom with two on it), and
  a wedge given once in the STEP copied to **six, 60 degrees apart** around the chassis (v9, wedge-snap v3, wedge-bolted v3 and v4).
- **Real 3D hull**: a 3 mm voxel union of the parts. Each column is filled from its lowest to its highest surface crossing, so a cavity sealed
  by the part above counts as displacement and an open cup or through-hole (v1, v2 centre; the top v4 cup) floods. The wedges are open tubes
  that the real build fills with foam, so their whole plan outline counts as displacement. The electronics housing (127 mm body, flange on
  top, from the mushroom STEP) is added the same way.
- **Hydrostatics**: draft from displaced volume; at each heel angle the lowest voxels of the rotated hull are kept until their volume equals
  the displaced volume, B is their centroid, GZ is the horizontal distance from B to G. Heel runs toward a wedge and toward a gap and the worse
  GZ is shown. Checked against a plain cylinder with exact answers: volume +0.6%, draft +0.5%, KB -0.1%, GM +1% (3 mm voxels).
- **Payload is the current one** (mushroom budget: housing and electronics 899 g, coating 330 g, mooring hardware, pod, hydrophone), placed
  from the housing, which hangs flange-down from the top of each stack.

### Masses are estimates, not weights

No concept has a weighed or sliced mass. Each part's mass is its STEP volume times an effective density by kind, listed on the explorer:
chassis 0.319 g/cm3 (808 g slicer / 2536 cm3), wedge shell 0.785 g/cm3 (measured cap slice) plus 104 g of foam per wedge,
thin-walled sections 0.785 g/cm3, solid-modelled sections 0.217 g/cm3 (mushroom float). Replace with weights when known.

### Data gaps (replace with measurements for accurate numbers)

1. Mass of every concept (v1 to wedge-bolted v4).
2. Whether each concept's chambers are sealed (assumed yes except where the STEP shows an open cup or hole).
3. Stack joints: v3 uses the 25.4 mm stud in the 25 mm socket; v4's STEP has no connector (plain cup), so it is a butt joint; v5 and v7 butt.
4. v1 and v2 real size (the STEPs are 825 mm across; used as exported).
5. v9-bottom: the chassis and bottom ring may overlap in the STEP; mass could be double-counted.
6. Foam in the wedge concepts is assumed (2 lb/ft3, as in the current wedge build).
7. Housing position and payload heights for concepts that never had electronics (assumed flange on top, body hanging down).

## Every iteration, side by side (added 2026-10-07)

The explorer has a slider (◀ ▶ or the arrow keys) that steps through **every floatation/buoy iteration,
oldest to newest**. Each side view is a **true cut through the committed STEP files** along the vertical
plane through the buoy axis (`iteration_sections.py`), not a redrawn sketch.

- **Waterline and stability graph are the unchanged solver.** On the three full-buoy assemblies (v5, v6, v7) the
  explorer shows draft, freeboard, GM and the GZ curve from the same `buoy_stability.py` numbers as before.
- **Earlier concepts show the section only.** v1 to the v5 wedge have no mass budget on record, so no waterline is
  computed for them; the explorer says so instead of inventing one.
- The hydrostatics for v5/v6/v7 use today's mass budget on that iteration's cap geometry, not that day's real masses.
- v7 uses the v6 cap geometry because it has the same parts; it was not diffed against v6 beyond the part list.

**To add a new iteration:** append one entry to [`iterations.json`](iterations.json) (the STEP files, a name, a date,
and `"hydro": {"cap": "1.5"}` if the solver supports its cap), then run
`python run_studies.py --explorer-only` (about a minute, no re-solve). If the new design needs a different
hull profile, add a cap kind to `buoy_stability.py` and re-run the full `run_studies.py`.

## Files

| File | What it is |
|---|---|
| `buoy_stability.py` | The calculator: STEP geometry → hull, mass budget, hydrostatic solve, GZ curve, self-righting check, minimum lead |
| `run_studies.py` | Runs every study and writes CSVs, PNG figures, and the explorer to `results/<date>/` |
| `iterations.json` | Chronological registry of every iteration (STEP files, date, solver cap). The explorer slider follows its order |
| `assembly.py` | Places stacked sections and wedges-around-the-chassis from `iterations.json`, builds the 3D voxel hull and solves hydrostatics for the concepts |
| `printed_hulls.py` | Same for printed floats with no ballast stem (the mushroom) |
| `iteration_sections.py` | Cuts each registry entry's STEP files into side-view sections for the explorer |
| `stability-explorer-template.html` | Template the explorer is generated from (the data is embedded at run time) |
| `studies/mooring-attachment-height/` | Quasi-static heel versus mooring attachment height (2026-10-08): script, graph, CSV, summary. A one-off study, not a regenerated `results/` folder |
| `results/<date>/` | Dated outputs. **The newest folder is current.** |

## Presets

| Preset | Use | Inputs |
|---|---|---|
| **`current`** (default) | Design work | v6 assembly: [`full-buoy-assembly-v6.step`](../../cad/full-buoy-assembly-v6.step) (1.5 in caps from STEP), chassis **808 g** (slicer), 316 pipe arm 4816K51 + 6040T56 mount + backing plate, mooring collar on the pipe, lead ~1.8 in above the pipe end |
| `session-2026-09-29` | Regression only | Exactly the inputs behind the numbers first published in §12 (600 g chassis, PETG stem at 30 g/in, idealised caps). `regression.csv` checks it still reproduces them |

Change an input by editing the mass lines (`V5_BASE`) or the ballast block in `build_budget()`
in `buoy_stability.py`. Every line carries a provenance tag: `[M]` measured, `[X]` exact from
geometry, `[A]` assumption.

## Method in one paragraph

The hull is a 2 mm voxel grid: the cap's outer profile R(z) is read from the STEP mesh, the wedge
section is a Ø18 in cylinder, and the housing flange is a Ø5.75 in disc. Draft comes from a
continuous displacement integral. At each heel angle the grid is rotated and the lowest voxels up
to the required displacement are kept, so B comes from the real submerged shape. GZ is the
horizontal distance from B to G. Appendages (arm, pod, lead, mooring hardware) count at
**net-down weight** (weight minus their own buoyancy) at their own height. The self-righting check
requires GZ > 0 from 5° to 178°. Checks: GZ at 5° matches GM·sin 5° within the grid resolution,
and the v5 wedge-bottom envelope from the mesh matches the 2026-09-25 STEP measurement within 0.6%.

## Assumptions to revisit

- Tier III masses are placeholders (battery 250 g, solar panel 700 g, pod, hydrophone). Solar panel and mount count as weight only (no buoyancy).
- The 1.5 in cap's mass uses the v5 wedge-bottom slice density (207.06 g / 263.8 cm³); re-slice it.
- Foam at 2 lb/ft³ until the #0204 datasheet is on file.
- Waves, wind, mooring dynamics, and roll inertia are not modelled. This is static hydrostatics.

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Explorer rebuilt with an iteration slider: true STEP cross section of all 17 iterations; solver numbers unchanged (`explorer-data.json` now saved so the explorer can be rebuilt without re-solving). The "no caps" what-if is no longer in the explorer UI; its data is still in `housing-sweep.csv`. |
| 2026-09-29 | First committed version. Consolidates the scratch calculators used for §12, and adds the `current` preset for the v6 assembly (1.5 in caps from STEP, 808 g chassis, steel pipe arm and rail mount). Regression vs §12: mass identical; draft and GM within 0.02 / 0.08 in, because the original first pass rounded the draft to the voxel grid while this version solves it continuously. |
| 2026-10-28 | Added the mushroom-profile float (iteration, no ballast stem, 702 g). New `assembly.py` and `printed_hulls.py`: stacks and six-wedge rings placed from the STEP files, true 3D voxel hydrostatics for every concept, so every iteration now has draft, freeboard, GM and a GZ curve. Deleted v6, v8 and wedge-bolted v5 concepts. Fixed the section cutter re-meshing every solid per solid (rebuild 18+ min to 3 min). |
| 2026-10-08 | Added `studies/mooring-attachment-height/`: heel and knockdown force versus mooring attachment height, using this solver (no solver changes) |
