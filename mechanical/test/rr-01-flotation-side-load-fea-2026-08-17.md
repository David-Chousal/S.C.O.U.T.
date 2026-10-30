# Flotation Wedges and Bottom Caps — Side-Load FEA, 2026-08-17

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-01 · Pass |
| **Date, duration, who** | 2026-08-17, one static study, John Ryan Myrdal |
| **Requirement tested** | Hull survives wave and current side loads (benchmark provisional, SF ≥ 4) |
| **Tracking issue** | [SCO-73](https://linear.app/scout1/issue/SCO-73) |
| **Record kind** | Retroactive (source: [fea-floatation-side-load-2026-08-17.md](fea-floatation-side-load-2026-08-17.md) and its HTML report) |

**Question.** Do the bolted floatation wedges and bottom caps survive a 300 N static side load? Retires the risk that the wedges and caps fail under side load.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Safety factor (min) | Autodesk Fusion static stress | SF ≥ 4 | 25.4 | Pass |
| Displacement (max) | Fusion | No target | 0.23 mm | Not judged |

**How.** Fusion static-stress study of the wedges and bottom caps, 300 N total (X −259.8, Y 150 N), fixed at the chassis mounting reference, ABS properties as a stand-in, 43,130 elements.

**Result.** Minimum SF 25.4, peak von Mises stress 0.786 MPa, max displacement 0.23 mm. The 300 N was a test input, not a derived design load.

**Does not establish.**

- A validated safety margin: the 300 N load and SF ≥ 4 bar were not derived from first principles.
- Other load directions (top, torsion, mooring pull), temperature, or the real print material (PETG vs ABS, [SCO-64](https://linear.app/scout1/issue/SCO-64)).

**Decision.** Good enough as a first pass. Superseded by the derived load cases in RR-04. Next: RR-04.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Show that the chosen bolted-wedge floatation design does not obviously fail under a moderate side load before investing in derived loads.

### A2. Hypothesis
If the wedge-and-cap assembly carries a 300 N side load, then its minimum safety factor is at least 4, because the walls and bolted joints are far larger than needed for that load.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Safety factor | dimensionless | Fusion static stress, von Mises | Mesh-limited | Not assessed (no mesh convergence run) | Not recorded |
| Displacement | mm | Fusion | Mesh-limited | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | None (single study) | 300 N side load |
| Held fixed (controlled) | Geometry (bolted v4 wedges + caps), constraint at chassis reference, ABS properties, parabolic mesh | E 2240 MPa, yield 20 MPa |
| Measured (dependent) | SF, von Mises stress, displacement, reaction | See C1 |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Minimum safety factor | SF ≥ 4 | Provisional bar for this study only | Study-only placeholder, not a derived requirement |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Model | Floatation wedges + bottom caps, heat-set attachment parts (Part 1:1, 2:1–6, 3:1–6) |
| Tool | Autodesk Fusion 2704.1.53, Static Stress |
| Material | ABS Plastic as a stand-in (print material PETG/ABS/ASA was still open) |
| Mesh | Parabolic solids, 84,831 nodes / 43,130 elements |
| Load | 300 N resolved to X −259.808 / Y 150.000 / Z 0 N |
| Constraint | Fixed (Ux, Uy, Uz) at the chassis mounting reference |
| Sample size | 1 study, no replicate |
| Safety | None (computation) |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Apply the ABS material and the constraint at the chassis mounting reference. | Settings | Not recorded |
| 2 | Apply the 300 N side load. | Components | Not recorded |
| 3 | Mesh and solve. | Node/element count | Not recorded |
| 4 | Read SF, stress, displacement, reaction. | Min/max values | Not recorded |

### A8. Analysis plan
Compare the minimum safety factor to the SF ≥ 4 bar.

### A9. Curve required

None, analysis. A validation curve (model vs measurement) does not exist yet; this study has not been compared to a physical test.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Run date | 2026-08-17 |
| Operator | John Ryan Myrdal |
| Software | Autodesk Fusion 2704.1.53 |
| Report | [HTML report](fea-floatation-side-load-2026-08-17.html) |

### B2. Raw data

| Result | Min | Max |
|---|---|---|
| Safety factor | 25.4 | 43,374 (capped/local) |
| Von Mises stress | 4.6×10⁻⁴ MPa | 0.786 MPa |
| Displacement | 0 mm | 0.23 mm |
| Reaction force | 0 N | 30.0 N |

### B3. Deviations

None recorded.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 SF ≥ 4 | 25.4 | 6.4× | Pass |

**Overall:** Pass. Minimum SF 25.4.

### C2. Curve and analysis
Fusion's own note flagged the 25.4 minimum as an opportunity to remove material. The result is read as 'comfortably above an arbitrary bar', not as a validated margin.

### C3. Validity and limits

- Sources of error: ABS stand-in properties, no mesh convergence study, load not derived.
- Does establish: the assembly does not obviously fail under a moderate side load.
- Does not establish: a validated margin, other load directions, temperature, or the real material.
- Not recorded: mesh convergence.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for this question; the derived loads (RR-04) replace it |
| Design change driven by this test | None |
| Re-run needed? | Superseded by RR-04 |
| Next test | RR-04 |
| Issues filed | [SCO-73](https://linear.app/scout1/issue/SCO-73) tracks the derived load cases |

### C5. Evidence and traceability

- [Full Fusion report](fea-floatation-side-load-2026-08-17.html)
- Source narrative: [fea-floatation-side-load-2026-08-17.md](fea-floatation-side-load-2026-08-17.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
