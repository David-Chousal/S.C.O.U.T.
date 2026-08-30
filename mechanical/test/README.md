# Test — Buoyancy, Structural, Pressure & Submersion Records

Buoyancy, waterline, structural (FEA), pressure, and submersion test records for the buoy
structure. First category populated 2026-08-17 with the initial floatation FEA pass.

**Owner:** GE lead (field & mechanical)

## Contents

| Record | Date | Summary |
|---|---|---|
| [`fea-mooring-load-cases.md`](fea-mooring-load-cases.md) | 2026-08-29 | Tracker for the FEA runs of the corrected LC1–LC9 load cases — design load + direction per case, run status, report links. **LC2 run; LC3–LC9 pending upload (top priority).** |
| [`fea-mooring-lc2-vertical-uplift-2026-08-29.md`](fea-mooring-lc2-vertical-uplift-2026-08-29.md) | 2026-08-29 | LC2 — 322 N vertical uplift (taut-line) on the mooring attachment. Custom PETG profile, 3076T33 tie-down ring stand-in. Min SF 7.53, 0.012 mm displacement — comfortable pass. LC9 snap (~810 N) is the case that still matters |
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

**Update 2026-08-29** — the LC1–LC9 framework loads are now computed
([`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md)) and **LC2 has been
run** ([`fea-mooring-lc2-vertical-uplift-2026-08-29.md`](fea-mooring-lc2-vertical-uplift-2026-08-29.md)).
**LC3–LC9 are pending** — see [`fea-mooring-load-cases.md`](fea-mooring-load-cases.md) for the
per-case load/direction and status. The governing case for the mooring attachment is **LC9**
(the ~810 N mooring snap); LC2 alone does not sign it off.

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
