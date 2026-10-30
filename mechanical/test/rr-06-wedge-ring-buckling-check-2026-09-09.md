# Wedge Ring External-Pressure Buckling Check (closed form), 2026-09-09

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-06 · Pass |
| **Date, duration, who** | 2026-09-09, hand calculation, John Ryan Myrdal (with Claude) |
| **Requirement tested** | Wedge ring survives 5 m water pressure (benchmark SF ≥ 2) |
| **Tracking issue** | [SCO-71](https://linear.app/scout1/issue/SCO-71), [SCO-73](https://linear.app/scout1/issue/SCO-73) |
| **Record kind** | Retroactive (source: [wedge-ring-buckling-check-2026-09-09.md](wedge-ring-buckling-check-2026-09-09.md)) |

**Question.** How far under is the bare 0.095 in outer wall on external-pressure buckling, and how much does foam backing recover? Retires the risk that the unfoamed ring buckles when submerged.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Buckling SF, bare wall | Closed form | SF ≥ 2 | 0.2–0.7 (panel); ~0.01 (free ring) | Fail |
| Buckling SF, foam-backed | Closed form | SF ≥ 2 | 3–5 | Pass |

**How.** Closed-form external-pressure buckling at the 50.3 kPa (5 m) design pressure for the bare wall as a free ring and as an edge-supported curved panel, then foam-bonded (foam modulus ~10 MPa, range 7–14).

**Result.** The bare wall fails (SF 0.2–0.7 as a panel). Foam-bonded it recovers to SF 3–5. The bonded 6-wedge ring is stiffer again. The rule 'foam in before submersion' is confirmed and quantified.

**Does not establish.**

- The assembly-level ring buckling, which needs FEA (later run in RR-09).
- Foam properties: the foam datasheet is pending ([SCO-76](https://linear.app/scout1/issue/SCO-76)).

**Decision.** Good enough: foam before submersion is mandatory. Next: RR-09 ring-buckling FEA.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Quantify the unfoamed ring's buckling margin that the 2026-09-07 check left open.

### A2. Hypothesis
If the bare 0.095 in wall is loaded to 50.3 kPa, then it buckles, and foam backing restores SF ≥ 2, because the foam supports the wall against inward deflection.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Buckling safety factor | dimensionless | Closed form | — | Bounding calculation; foam modulus range 7–14 MPa | Not applicable |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Foam backing: none / foam-bonded | 2 cases |
| Held fixed (controlled) | t 0.095 in, R 9.0 in, L 5.5 in, PETG E 2240 MPa ν 0.38, p 50.3 kPa | See source §1 |
| Measured (dependent) | Buckling SF | See C1 |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Buckling SF | SF ≥ 2 | Register benchmark | [Register](risk-reduction-register.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Model | v5 wedge outer wall, 60° sector, 5.5 in tall |
| Material | PETG, E 2240 MPa, ν 0.38 (assumed profile) |
| Foam | US Composites #0204, 2 lb/ft³, E_f ~10 MPa (generic rigid PU, assumed) |
| Sample size | Not applicable (calculation) |
| Safety | None |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | List inputs and tag measured vs assumed. | Table | Not recorded |
| 2 | Compute wall bending stiffness D. | Value | Not recorded |
| 3 | Compute buckling pressure bare and foam-backed. | Pressures | Not recorded |
| 4 | Compare to 50.3 kPa. | SF | Not recorded |

### A8. Analysis plan
Closed-form buckling pressure divided by the design pressure.

### A9. Curve required

None, analysis. Not yet validated by the assembly-level FEA or a physical test.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Run date | 2026-09-09 |
| Operator | John Ryan Myrdal |
| Method | Closed-form hand calculation |
| Design pressure | 50.3 kPa (LC8, 5 m) |

### B2. Raw data

Inputs and working are in the source narrative (141 lines).

### B3. Deviations

None recorded.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 bare wall SF ≥ 2 | 0.2–0.7 | Short by 1.3–1.8 | Fail |
| M1 foam-backed SF ≥ 2 | 3–5 | +1 to +3 | Pass |

**Overall:** Bare wall fails; foam-backed passes. Pass for the design as built with foam.

### C2. Curve and analysis
Foam modulus and PETG properties are assumed, so the foam-backed range is an estimate.

### C3. Validity and limits

- Sources of error: assumed foam modulus; closed-form bound.
- Does establish: foam backing is required.
- Does not establish: the bonded ring's true margin.
- Not recorded here: working (see source).

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for the foam rule |
| Design change driven by this test | Foam before any submersion is mandatory |
| Re-run needed? | Assembly-level FEA done in RR-09 |
| Next test | RR-09 |
| Issues filed | [SCO-71](https://linear.app/scout1/issue/SCO-71), [SCO-73](https://linear.app/scout1/issue/SCO-73) |

### C5. Evidence and traceability

- Source narrative: [wedge-ring-buckling-check-2026-09-09.md](wedge-ring-buckling-check-2026-09-09.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
