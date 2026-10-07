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
| `iteration_sections.py` | Cuts each registry entry's STEP files into side-view sections for the explorer |
| `stability-explorer-template.html` | Template the explorer is generated from (the data is embedded at run time) |
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
