# v5 FEA Re-Check and Ring Buckling, 2026-09-25

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-09 · Pass |
| **Date, duration, who** | 2026-09-25, five runs, John Ryan Myrdal |
| **Requirement tested** | v5 geometry keeps load margins (benchmark SF ≥ ~3.5) |
| **Tracking issue** | [SCO-71](https://linear.app/scout1/issue/SCO-71), [SCO-73](https://linear.app/scout1/issue/SCO-73) |
| **Record kind** | Retroactive (source: [fea-mooring-load-cases.md § v5 re-check](fea-mooring-load-cases.md#results--v5-re-check-2026-09-25)) |

**Question.** Does the thinner v5 geometry break the load margins found at v4? Retires the risk that the v5 change breaks margins.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Buoy safety factor (min, PETG) | Fusion static stress | SF ≥ ~3.5 | ~3.5 | Pass (thin) |
| Ring buckling load factor | Fusion structural buckling | BLF > 1 | 1.873 | Pass (thin margin) |

**How.** Five Fusion runs on v5 geometry at v5 loads (LC5 toward a seam, LC5, LC8 hydrostatic, LC9 plus LC7 moment, ring buckling). Fusion's stock ABS used; stresses kept, SFs re-based to PETG as 35/σ.

**Result.** Thin-wall wedge stress passes (min real SF ~3.5 PETG unfoamed) and ring buckling passes with a load multiplier of 1.873 (thin margin), so foam fill is structurally required.

**Does not establish.**

- A mesh-converged result: mesh 10%, no refinement.
- The 30° LC9 case, skipped by choice.
- A physical test.

**Decision.** Good enough; foam fill is structurally required. Next: pad-eye re-run.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Re-check the v4 FEA results against the v5 lean geometry.

### A2. Hypothesis
If the v5 geometry is loaded with the v5 load set, then the buoy PETG keeps SF ≥ ~3.5, because v5 loads are 10–30% lower than v4.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Safety factor | dimensionless | Fusion static stress (SF = 35/σ for PETG) | Mesh-limited | ABS stock profile re-based to PETG | Not recorded |
| Buckling load factor | dimensionless | Fusion structural buckling | — | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Load case (5 runs) | See source table |
| Held fixed (controlled) | v5 lean geometry, 3076T33 ring, mesh 10% parabolic | Material: Fusion ABS (E 2240, ν 0.38, yield 20 MPa) |
| Measured (dependent) | SF, stress, BLF | See C1 |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Minimum real SF in the buoy PETG | SF ≥ ~3.5 | Accepted v5 margin | Register |
| M2 | Ring buckling load factor | BLF > 1 | Buckling occurs at BLF = 1 | Definition |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Model | v5 lean floatation with the 3076T33 stand-in ring |
| Material setup | Fusion stock ABS (yield 20 MPa), not the custom PETG profile (yield 35 MPa); density 1.06 (should be 1.27, immaterial for static) |
| Mesh | 10%, parabolic, no refinement |
| Sample size | 5 runs |
| Safety | None |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Run LC5 toward a seam. | Stress, SF | Not recorded |
| 2 | Run LC5 at +12%. | Stress, SF | Not recorded |
| 3 | Run LC8 hydrostatic. | Stress, SF | Not recorded |
| 4 | Run LC9 + LC7 moment. | Stress, SF | Not recorded |
| 5 | Run structural buckling. | BLF | Not recorded |

### A8. Analysis plan
Re-base SF to PETG; judge against the accepted ~3.5 margin; treat contact singularities as artifacts.

### A9. Curve required

None, analysis. Not validated against a physical test.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Run date | 2026-09-25 |
| Operator | John Ryan Myrdal |
| Software | Autodesk Fusion |
| Reports | `fea-mooring-lc*-v5-2026-09-25.html`, `fea-ring-buckling-v5-2026-09-25.html` |

### B2. Raw data

Five-run table in the source. Reports 1–3 were exported with empty result tables, so values come from plot legends.

### B3. Deviations

Wrong material profile (stock ABS) used; corrected by re-basing SFs. The 30° LC9 run was skipped.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 SF ≥ ~3.5 | ~3.5 (min real, unfoamed) | ≈ 0 | Pass (thin) |
| M2 BLF > 1 | 1.873 | +0.873 | Pass (thin) |

**Overall:** Pass with thin margins.

### C2. Curve and analysis
LC8 shows 5–10 MPa at mid-panel of each wedge outer wall (SF 3.5–7). Foam fill is required against buckling.

### C3. Validity and limits

- Sources of error: ABS profile re-based, no mesh refinement, legend-read values.
- Does establish: v5 thin walls pass with foam fill required.
- Does not establish: pad-eye, 30° LC9, physical margin.
- Not recorded: exact legend values for reports 1–3.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for v5 hull load adequacy |
| Design change driven by this test | Foam fill structurally required |
| Re-run needed? | Pad-eye re-run |
| Next test | RR-10 drop, pad-eye FEA |
| Issues filed | [SCO-71](https://linear.app/scout1/issue/SCO-71), [SCO-73](https://linear.app/scout1/issue/SCO-73) |

### C5. Evidence and traceability

- [Results § v5 re-check](fea-mooring-load-cases.md#results--v5-re-check-2026-09-25)
- HTML reports `*-v5-2026-09-25.html`

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
