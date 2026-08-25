# Print Weight Verification — Current Bolted-V4 Floatation Set, 2026-08-24

> **Summary** — Full slicer weigh-in of all five parts in the current bolted-wedge v4 floatation
> design (Chassis, Wedge, Wedge Bottom, Chassis Cap, Wedge Cap). Feeds real **[M]** weights
> directly into [Buoy Mass and Buoyancy Budget §§3–9](../../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md),
> retiring the 1.178× calibration factor that had covered the three parts without their own
> slicer data. Source CAD: [`mechanical/cad/floatation/current/`](../cad/floatation/current/).

---

## Setup

Sliced from the current `chassis-floatation-bolted-v4-*` STEP files, per-part print settings per
[Print Settings](../../docs/engineering/buoy-structural/print-settings.md) (wedge family: 3–4
walls / ~15% gyroid; chassis family: 6 walls / 25–30% gyroid), PETG, 6 wedges per buoy.

**Convention used below:** the reported weight is the slicer's **Model** figure only. Two parts
(Chassis, Wedge Cap) print with support material, which is sacrificial and removed before the
part is used — support weight is excluded from the "used" weight, though it's recorded here for
the record.

## Results

| Part | Filament (model) | Filament (support) | Weight (model) | Weight (support) | Weight used | Print time |
|---|---|---|---|---|---|---|
| Chassis | 235.20 m | 1.12 m | 712.82 g | 3.38 g | **712.82 g** | 10h47m |
| Wedge | 107.51 m | — | 325.83 g | — | **325.83 g** | 6h23m |
| Wedge Bottom | 59.79 m | — | 181.21 g | — | **181.21 g** | 3h23m |
| Chassis Cap | 29.63 m | — | 89.79 g | — | **89.79 g** | 1h26m |
| Wedge Cap | 41.86 m | 2.01 m | 126.86 g | 6.11 g | **126.86 g** | 2h18m |

Six wedges per buoy: Wedge + Wedge Bottom + Wedge Cap are each printed ×6; Chassis and Chassis
Cap are printed ×1. Full per-part application (envelope volume, displacement, buoyant force,
module and whole-shell aggregates): [Buoy Mass and Buoyancy Budget](../../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md).

## Flagged, not reconciled — Wedge weight discrepancy

The Wedge was already weighed once before, on 2026-08-21: **474.58 g**, on the same nominal
print spec as this 325.83 g result — a ~31% difference with no logged settings or CAD change
between the two dates. This record uses the 2026-08-24 figure as the most current data point,
per the mass-and-buoyancy budget's living-document convention, but the discrepancy itself is
**not resolved**. Before trusting either number over the other, check: the actual slicer profile
used each time (wall count, infill % as sliced, not just as specced), whether a physical scale
weighing agrees with either slicer estimate, and whether the CAD file in `current/` changed
between the two dates.

## What this does and doesn't establish

- **Does:** gives real, measured weights for all five parts of the current design — no part in
  the mass/buoyancy budget is still a geometric estimate.
- **Doesn't:** resolve the Wedge weight discrepancy above. Doesn't include electronics, battery,
  solar mount, or mooring hardware mass — those aren't part of these five prints
  ([SCO-70](https://linear.app/scout1/issue/SCO-70)). Doesn't confirm foam-fill weight (still an
  assumed placeholder density, [SCO-76](https://linear.app/scout1/issue/SCO-76) covers the
  foam-fill manufacturing trials that would measure it directly).

## Next steps

1. Reconcile the Wedge weight discrepancy (474.58 g vs. 325.83 g) — re-slice with a logged
   profile, or weigh a physical print on a scale.
2. Weigh a foam-filled wedge module once foam-fill trials ([SCO-76](https://linear.app/scout1/issue/SCO-76))
   produce a real sample, to check the assumed 148 g/module foam-fill figure.
3. Re-run this weigh-in if the `current/` design changes (new revision moves in per
   [floatation README](../cad/floatation/README.md#current--the-active-bolted-wedge-v4-design)).

## Source images

Slicer screenshots for each part are pending upload — see PR discussion.
