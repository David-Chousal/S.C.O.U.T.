# Test — Buoyancy, Structural, Pressure & Submersion Records

Buoyancy, waterline, structural (FEA), pressure, and submersion test records for the buoy
structure. First category populated 2026-08-17 with the initial floatation FEA pass.

**Owner:** GE lead (field & mechanical)

## Contents

| Record | Date | Summary |
|---|---|---|
| [`fea-mooring-load-cases.md`](fea-mooring-load-cases.md) | 2026-08-29 | **Tracker + results for LC2–LC9 + service** (all run 2026-08-29). Load, min SF, displacement, verdict per case + report links. Hull passes (SF 30–1450); **mooring attachment LC6 min SF 1.66, LC9 min SF 1.49 — marginal/failing**, re-run needed |
| [`fea-mooring-lc2-vertical-uplift-2026-08-29.md`](fea-mooring-lc2-vertical-uplift-2026-08-29.md) | 2026-08-29 | LC2 detailed summary — 322 N vertical uplift, min SF 7.53, 0.012 mm. The LC3–LC9 reports are HTML-only; their results are in the tracker |
| [`waterproofing-submersion-test-2026-08-24.md`](waterproofing-submersion-test-2026-08-24.md) | 2026-08-24 | Bench submersion test, 3 articles: PLA sensor housing + TPU O-ring passed (~30 hr, dry); PETG print (low quality) and the electronics housing both failed |
| [`print-weight-verification-2026-08-24.md`](print-weight-verification-2026-08-24.md) | 2026-08-24 | Full slicer weigh-in of all five current bolted-v4 floatation parts. Retires the shared calibration factor; flags an unreconciled ~31% Wedge weight discrepancy against the 2026-08-21 measurement |
| [`fea-floatation-side-load-2026-08-17.md`](fea-floatation-side-load-2026-08-17.md) | 2026-08-17 | First FEA pass: floatation wedges + bottom caps under a 300 N side load. Min safety factor 25.4 |

Each record is a Markdown summary (key results, methodology, caveats) linking to the full
native report export. The native export is the source of record for anything not summarized —
open it directly for full contact/mesh/result detail per component.

## Native report format

FEA studies run in **Autodesk Fusion** are exported as a self-contained interactive HTML
report (Fusion's built-in "Studies Report"). Per
[CONVENTIONS.md → File formats](../../docs/CONVENTIONS.md#file-formats), CAD and schematics
keep both a native source and a neutral export; there is no separate native Fusion study file
committed here (the design's native source is the shared Onshape/Fusion document — see
[`mechanical/cad/README.md`](../cad/README.md#native-source)), so the HTML report itself is
the committed artifact, paired with a Markdown summary for diffability and quick reading.

## What's not yet covered

**Update 2026-08-29** — the LC1–LC9 framework loads are computed
([`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md)) and **LC2–LC9 +
a service case have been run** — full results in [`fea-mooring-load-cases.md`](fea-mooring-load-cases.md).
**The hull/wedges pass comfortably (min SF 30–1450); the mooring attachment does not — LC6
(combined) min SF 1.66, LC9 (snap) min SF 1.49.** Those need a re-run with the final 316 pad-eye
geometry (the runs used a `3076T33` tie-down ring stand-in) and LC7 needs its moment applied.

Still to do, per [design-notes.md](../../docs/hub/design-notes.md):

- Max expected loads calculated from first principles — **methodology now formalized** in
  [Buoy Structural Load Framework](../../docs/engineering/buoy-structural/structural-load-framework.md)
  (corrected LC1–LC9 cases), but not yet run: several inputs are still open (mooring
  scope/line weight, design wave values, final Cd/Cm/Ca coefficients — see the framework's
  §12). The 300 N side load used in the 2026-08-17 study below was a test input, not a derived
  design load.
- FEA across additional planes/directions (top load, torsion, mooring-point pull)
- Thermal analysis
- A validated safety-factor target (this pass used **SF ≥ 4 as a pass/fail check for this
  study only** — not yet an established, derived requirement)

**2026-08-18 — validation-target pivot.** The SF 25.4 result above, read against the
project's cost target, was judged over-engineered — see
[`mechanical/cad/floatation/README.md`](../cad/floatation/README.md#cross-section-fit-test-print-and-a-validation-target-pivot--2026-08-18).
Future studies target **impact survivability at controlled cost** (grounding, drops, ideally a
boat strike) rather than continuing to push the static-load safety factor. FEA impact/drop-load
simulation and bench impact tests on printed samples are planned:
[SCO-71](https://linear.app/scout1/issue/SCO-71).
