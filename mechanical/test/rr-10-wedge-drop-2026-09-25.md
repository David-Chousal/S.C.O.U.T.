# Single-Wedge Drop Test, 2026-09-25

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-10 · Pass |
| **Date, duration, who** | 2026-09-25, one drop, John Ryan Myrdal |
| **Requirement tested** | Wedge survives handling and impact (no visible damage) |
| **Tracking issue** | [SCO-71](https://linear.app/scout1/issue/SCO-71) |
| **Record kind** | Retroactive (source: [wedge-drop-test-2026-09-25.md](wedge-drop-test-2026-09-25.md)) |

**Question.** Does a printed v5 flotation wedge survive being dropped? Retires the risk that a wedge cracks on handling or impact.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Visible damage | Visual | None | No deformation, cracking or delamination | Pass |
| Drop energy | — | Not defined | Height not recorded | Not measured |

**How.** One printed v5 wedge (single part, not the ring) was dropped. Height, surface, orientation and foam fill were not recorded.

**Result.** No visible deformation, cracking or delamination.

**Does not establish.**

- A quantitative survivability target or a boat-strike test.
- Scenario C (drop onto the base, lean wall section).
- Repeatability: one sample.

**Decision.** Good enough, per John, to close the impact check with RR-09 ([SCO-71](https://linear.app/scout1/issue/SCO-71)). If revisited: record height, surface and orientation, use foam-filled wedges and at least 3 samples.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
A quick physical check that a wedge survives a drop, complementing the FEA.

### A2. Hypothesis
If a printed v5 wedge is dropped, then it shows no damage, because the FEA margins (min SF ~3.5) cover handling loads.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Visible damage | yes / no | Visual inspection | Binary | Not quantified | Not recorded |
| Drop height | m | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | None (single drop) | — |
| Held fixed (controlled) | Not recorded | Not recorded |
| Measured (dependent) | Damage after the drop | yes / no |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | No visible damage | No deformation, cracking, delamination | Judged sufficient by John as GENG lead | [Source](wedge-drop-test-2026-09-25.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Specimen | One printed v5 flotation wedge, single part |
| Foam fill | Not recorded |
| Impact surface and orientation | Not recorded |
| Drop height | Not recorded |
| Sample size | 1; no control |
| Safety | Not recorded |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Drop the wedge. | Height, surface, orientation (Not recorded) | Not recorded |
| 2 | Inspect for deformation, cracks, delamination. | Observation | Not recorded |

### A8. Analysis plan
Visual inspection only.

### A9. Curve required

None, pass/fail test.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Date | 2026-09-25 |
| Operator | John Ryan Myrdal |
| Conditions | Not recorded |
| Instrument IDs | None |

### B2. Raw data

Observation: no visible deformation, cracking or delamination.

### B3. Deviations

None recorded.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 no visible damage | None seen | — | Pass |

**Overall:** Pass on John's judgement; one sample.

### C2. Curve and analysis
Consistent with the FEA (RR-09) but not a calibration of it.

### C3. Validity and limits

- Sources of error: unknown energy, one sample.
- Does establish: a wedge survived one drop.
- Does not establish: survivability thresholds.
- Not recorded: height, surface, orientation, foam fill.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes, per John |
| Design change driven by this test | None |
| Re-run needed? | Only if revisited (see decision above) |
| Next test | Drop of the assembled ring (register to-do) |
| Issues filed | [SCO-71](https://linear.app/scout1/issue/SCO-71) |

### C5. Evidence and traceability

- Source narrative: [wedge-drop-test-2026-09-25.md](wedge-drop-test-2026-09-25.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
