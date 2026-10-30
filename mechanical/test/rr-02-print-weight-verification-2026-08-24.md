# Print Weight Verification — Bolted-V4 Floatation Set, 2026-08-24

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-02 · Partial |
| **Date, duration, who** | 2026-08-24, slicer weigh-in, John Ryan Myrdal |
| **Requirement tested** | Mass budget matches the printed parts (benchmark: slicer within ~10% of measured) |
| **Tracking issue** | [SCO-70](https://linear.app/scout1/issue/SCO-70) |
| **Record kind** | Retroactive (source: [print-weight-verification-2026-08-24.md](print-weight-verification-2026-08-24.md)) |

**Question.** Are the slicer weights of the five v4 floatation parts good enough to feed the mass budget? Retires the risk that the mass budget is wrong.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Part mass (g) | Slicer model estimate | Within ~10% of a measured weight | Five slicer weights; no scale weight | Partial |
| Wedge consistency (g) | Two slicer runs | Agree | 474.58 g (08-21) vs 325.83 g (08-24), ~31% apart | Fail |

**How.** Sliced the five parts (PETG; wedge family 3–4 walls / ~15% gyroid; chassis family 6 walls / 25–30% gyroid) and recorded the slicer 'Model' weight, excluding support.

**Result.** Chassis 712.82 g, Wedge 325.83 g, Wedge Bottom 181.21 g, Chassis Cap 89.79 g, Wedge Cap 126.86 g. The wedge differs ~31% from the 2026-08-21 figure and is not reconciled.

**Does not establish.**

- That slicer weights match physical weights: no printed part was weighed on a scale.
- The wedge discrepancy: not reconciled.
- Electronics, battery, mooring mass, or foam-fill mass.

**Decision.** Change and re-run: reconcile the wedge weight by re-slicing with a logged profile or weighing a physical print. Next: weigh a printed wedge.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Replace the shared 1.178× calibration factor with real per-part weights so the mass and buoyancy budget is built on data.

### A2. Hypothesis
If the five parts are sliced at the specified settings, then their slicer weights agree with measured weights to within ~10%, because the slicer models filament volume directly.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Part weight (model) | g | Slicer 'Model' figure | 0.01 g (slicer display) | Not assessed against a scale | Not recorded |
| Filament length | m | Slicer | 0.01 m | Not recorded | Not recorded |
| Print time | h:min | Slicer | 1 min | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Part (five parts) | Chassis, Wedge, Wedge Bottom, Chassis Cap, Wedge Cap |
| Held fixed (controlled) | Material (PETG), per-part settings per print-settings doc | See source |
| Measured (dependent) | Slicer weight, filament length, time | See C1 |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Slicer weight vs measured weight | Within ~10% | Register benchmark | [Register](risk-reduction-register.md) |
| M2 | Two weigh-ins of the same part agree | Within ~10% | Same nominal spec should give the same weight | Inferred |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Model | `chassis-floatation-bolted-v4-*` STEP files in `mechanical/cad/floatation/current/` |
| Material | PETG |
| Settings | Wedge family 3–4 walls / ~15% gyroid; chassis family 6 walls / 25–30% gyroid |
| Convention | Support weight excluded from 'used' weight |
| Sample size | 1 slicing per part; wedge sliced twice (08-21, 08-24) |
| Safety | None |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Slice each part from the current STEP. | Slicer profile | Not recorded |
| 2 | Record model and support weight, filament length, time. | Values | Not recorded |
| 3 | Compare to the earlier wedge weighing. | Difference | Not recorded |

### A8. Analysis plan
Report the slicer model weight per part; compare the wedge to its earlier figure.

### A9. Curve required

None, measurement. Slicer weight vs physical scale weight (a validation curve) was not made.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Run date | 2026-08-24 |
| Operator | John Ryan Myrdal |
| Instrument | Slicer only; scale: not used |
| Slicer screenshots | Pending upload per source |

### B2. Raw data

| Part | Weight used | Print time |
|---|---|---|
| Chassis | 712.82 g | 10h47m |
| Wedge | 325.83 g | 6h23m |
| Wedge Bottom | 181.21 g | 3h23m |
| Chassis Cap | 89.79 g | 1h26m |
| Wedge Cap | 126.86 g | 2h18m |

### B3. Deviations

Wedge result differs ~31% from 474.58 g measured 2026-08-21 with no logged settings or CAD change between the dates.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 slicer vs measured within ~10% | Not measured (no scale weight) | — | Not measured |
| M2 wedge agrees across weigh-ins | 474.58 g vs 325.83 g, ~31% | Over by ~21 points | Fail |

**Overall:** Partial. Weights recorded; accuracy against a scale not shown and the wedge disagrees with itself.

### C2. Curve and analysis
Source recommends checking the actual slicer profile used each time, a physical weighing, and whether the CAD changed between dates.

### C3. Validity and limits

- Sources of error: slicer profile may have differed between the two wedge runs.
- Does establish: a weight for every part in the design.
- Does not establish: that slicer weight equals physical weight.
- Not recorded: scale weights.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | No: wedge weight unreconciled |
| Design change driven by this test | Retired the 1.178× calibration factor |
| Re-run needed? | Yes, with a scale |
| Next test | Weigh a printed wedge; foam-filled module ([SCO-76](https://linear.app/scout1/issue/SCO-76)) |
| Issues filed | None recorded |

### C5. Evidence and traceability

- Source narrative: [print-weight-verification-2026-08-24.md](print-weight-verification-2026-08-24.md)
- [Mass and buoyancy budget](../../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
