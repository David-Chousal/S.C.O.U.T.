# Hang-Hole Static FEA, Through-Hole Floatation, 2026-10-30

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-20 · Pass (analysis only) |
| **Date, duration, who** | 2026-10-30, two static studies, John Ryan Myrdal |
| **Requirement tested** | Structure carries the loads (R-15), here the dock/boat hang through the floatation holes (benchmark SF ≥ 4) |
| **Tracking issue** | [SCO-276](https://linear.app/scout1/issue/SCO-276) |
| **Record kind** | Retroactive (source: the two Fusion reports linked under C5; closed by John on 2026-11-01) |

**Question.** Do the through-holes in the floatation carry the hang load when a rope harness is fed through them? Retires the risk that the hang holes tear out under the dock or boat load.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Safety factor, 322 N on each hole (min) | Autodesk Fusion static stress | SF ≥ 4 | about 14.2 (peak 1.413 MPa) | Pass |
| Safety factor, 644 N on one hole (min) | Fusion | SF ≥ 4 | about 12.4 (peak 1.615 MPa) | Pass |

**How.** Fusion static-stress study "Hanging Assembly 5": float (ABS, yield 20 MPa, stand-in for PETG), electronics housing and cap, fixed support, +Z force of 322 N on each of two holes, and 644 N on one hole. 83,931 elements, parabolic, 10% mesh, no refinement.

**Result.** Peak von Mises 1.413 MPa (shared) and 1.615 MPa (single). The safety factors are 20 MPa yield divided by those peaks, computed for this record, not read from the report's color plot.

**Does not establish.**

- A validated margin: housing and cap were modelled as steel (207 MPa) although they are printed PETG; the mesh is coarse so the hole-edge stress concentration is unresolved; the forces point +Z, not downward on the lower half of each hole; the fixed support location is not recorded.
- Real PETG strength, print-layer weakness, or rope wear and snap loads.
- Any physical load test ([SCO-274](https://linear.app/scout1/issue/SCO-274)).

**Decision.** John accepts ABS as close enough to PETG for the float, and closes SCO-276 on this analysis. Next: a physical hang check in the dock or tub test (SCO-274).

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Show that the floatation through-holes can carry the dock/boat hang load with a rope harness, so the hung V1 test configuration ([SCO-147](https://linear.app/scout1/issue/SCO-147)) does not tear out.

### A2. Hypothesis
If the holes carry 322 N each (or 644 N on one), then the minimum safety factor is at least 4, because the float walls around the holes are thick relative to the load.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Peak von Mises stress | MPa | Fusion static stress | Mesh-limited | Not assessed (no mesh convergence run) | Not recorded |
| Safety factor | dimensionless | 20 MPa yield / peak stress | Mesh-limited | Not assessed | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Load case | 322 N on each of two holes; 644 N on one hole |
| Held fixed (controlled) | Geometry (Hanging Assembly 5), mesh, constraint, materials | Float ABS (E 2240 MPa, yield 20 MPa); housing and cap Steel (E 210000 MPa, yield 207 MPa) |
| Measured (dependent) | Von Mises stress, safety factor, displacement | See B2 |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Minimum safety factor at the hang holes | SF ≥ 4 | Register bar for structural FEA | [Risk-reduction register](risk-reduction-register.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Model | Float, electronics housing and cap assembly with hang through-holes ([STEP](../cad/floatation/float-hang-holes-2026-11-01.step)) |
| Tool | Autodesk Fusion 2706.1.14, Static Stress |
| Material | Float: ABS Plastic (stand-in for PETG). Housing and cap: Steel (not the printed material) |
| Mesh | Parabolic solids, 138,165 nodes / 83,931 elements, 10% of model size, 0 adaptive steps |
| Load | Study 1: 322 N +Z on each of two holes. Study 2: 644 N +Z on one hole |
| Constraint | Fixed (Ux, Uy, Uz); location Not recorded |
| Sample size | 2 studies, no replicate |
| Safety | None (computation) |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Assign materials and the fixed constraint. | Study settings | 2026-10-30 |
| 2 | Apply the load case (shared 322 N, then single 644 N). | Loads table | 2026-10-30 |
| 3 | Mesh and solve. | Node/element count | 2026-10-30 |
| 4 | Read von Mises stress and safety factor. | Peak values | 2026-10-30 |

### A8. Analysis plan
Compare the minimum safety factor to SF ≥ 4 in each load case.

### A9. Curve required

None, analysis. No validation curve (model vs measurement) exists; a physical hang check is tracked in [SCO-274](https://linear.app/scout1/issue/SCO-274).

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Run date | 2026-10-30 |
| Operator | John Ryan Myrdal |
| Software | Autodesk Fusion 2706.1.14 |
| Reports | [Shared 322 N each](fea-hang-hole-shared-322n-2026-10-30.html), [Single 644 N](fea-hang-hole-single-644n-2026-10-30.html) |

### B2. Raw data

| Result | Shared 322 N each | Single 644 N |
|---|---|---|
| Peak von Mises stress | 1.413 MPa (as logged in SCO-276) | 1.615 MPa (as logged in SCO-276) |
| Float yield used | 20 MPa | 20 MPa |
| Safety factor (computed) | 14.2 | 12.4 |

The peak stresses were logged by John on 2026-10-30 and copied here; the summary table in each HTML report holds the Fusion minimum and maximum values as images. Confirm the stress-to-study pairing against those images.

### B3. Deviations

Housing and cap assigned Steel instead of PETG; forces applied +Z instead of downward on the lower half of each hole; mesh not refined at the holes. All three were identified on 2026-10-30 and are carried as limits in C3.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 SF ≥ 4, shared 322 N | 14.2 | 3.5× | Pass |
| M1 SF ≥ 4, single 644 N | 12.4 | 3.1× | Pass |

**Overall:** Pass (analysis only). Minimum SF about 12.4.

### C2. Curve and analysis
Both load cases sit about 12 to 14 times below the float's 20 MPa yield, so the result is a wide margin even if the coarse mesh under-predicts the hole-edge concentration by a factor of two to three. That reading is an estimate, not a convergence check.

### C3. Validity and limits

- Sources of error: steel housing and cap, ABS stand-in for PETG (accepted by John, 2026-11-01), +Z loading, coarse mesh, unrecorded fixed support.
- Does establish: the float around the holes is not near yield in either load case at these loads.
- Does not establish: a validated margin, print-layer (Z) weakness, rope chafe, or dynamic snap loads.
- Not recorded: fixed support location, load derivation (why 322 N each).

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for the V1 hung tests, by John's call |
| Design change driven by this test | Hanging harness through the floatation holes; eye points, printed top attachments and their proof load canceled ([SCO-243](https://linear.app/scout1/issue/SCO-243), [SCO-244](https://linear.app/scout1/issue/SCO-244), [SCO-251](https://linear.app/scout1/issue/SCO-251)) |
| Re-run needed? | Not for V1; a PETG, refined-mesh re-run if the load or hole changes |
| Next test | Physical hang check ([SCO-274](https://linear.app/scout1/issue/SCO-274)) |
| Issues filed | [SCO-276](https://linear.app/scout1/issue/SCO-276) closed |

### C5. Evidence and traceability

- [Fusion report, shared 322 N each](fea-hang-hole-shared-322n-2026-10-30.html)
- [Fusion report, single 644 N](fea-hang-hole-single-644n-2026-10-30.html)
- [Holed float STEP](../cad/floatation/float-hang-holes-2026-11-01.step)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
