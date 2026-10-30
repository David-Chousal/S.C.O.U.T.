# Wedge Wall-Thickness Structural Check (closed form), 2026-09-07

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-05 · Pass |
| **Date, duration, who** | 2026-09-07, hand calculation, John Ryan Myrdal (with Claude) |
| **Requirement tested** | Thinned v5 wedge walls are not overstressed |
| **Tracking issue** | [SCO-110](https://linear.app/scout1/issue/SCO-110) |
| **Record kind** | Retroactive (source: [wedge-wall-thickness-structural-check-2026-09-07.md](wedge-wall-thickness-structural-check-2026-09-07.md)) |

**Question.** Are the thinned v5 wedge walls (outer 0.095 in, sides 0.063 in, 5.5 in tall) sane on stress before print time is committed? Retires the risk that thin walls are overstressed.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Wall stress vs allowable | Closed-form hand calculation | Stress within allowable | Outer 0.095 in and sides 0.063 in accepted | Pass |

**How.** Closed-form calculation of LC3–LC5 wave/current and LC8 hydrostatic loads plus foam-fill expansion pressure and print/handling flex, against the thinned wall dimensions.

**Result.** Outer wall 0.095 in is acceptable and is the floor. Side walls 0.063 in accepted once John confirmed the wedges form an epoxied closed ring (60° each, epoxied seams, foam poured after assembly). The internal bracing web is mandatory.

**Does not establish.**

- Impact survivability (out of scope, [SCO-71](https://linear.app/scout1/issue/SCO-71)).
- Assembly-level buckling (see RR-06).

**Decision.** Good enough: do not thin the outer wall further. Next: RR-06.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Confirm the thinned wedge walls are not overstressed before committing print time.

### A2. Hypothesis
If the outer wall is 0.095 in and the sides 0.063 in, then wall stress stays within allowable for the design load cases, because the walls act as part of an epoxied closed ring.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Wall stress | MPa | Closed-form hand calculation | — | Conservative bound, not validated | Not applicable |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Wall thickness (outer / side) | 0.095 in / 0.063 in |
| Held fixed (controlled) | 5.5 in wedge height, PETG, load set | See source |
| Measured (dependent) | Stress vs allowable | See C1 |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Wall stress | Within allowable | Closed-form bound | Source §5 |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Model | v5 wedge, [SCO-110](https://linear.app/scout1/issue/SCO-110) |
| Material | PETG |
| Method | Closed-form hand calculations, not FEA |
| Sample size | Not applicable (calculation) |
| Safety | None |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Take the wedge-relevant load cases from the force budget. | Loads | Not recorded |
| 2 | Compute wall stress for outer and side walls. | Stress | Not recorded |
| 3 | Add foam-fill pressure and print/handling flex. | Values | Not recorded |
| 4 | Compare to allowable. | Verdict | Not recorded |

### A8. Analysis plan
Closed-form stress vs allowable per wall.

### A9. Curve required

None, analysis (closed form). Not validated against FEA or a physical test.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Run date | 2026-09-07 |
| Operator | John Ryan Myrdal |
| Method | Hand calculation |
| Revisions | Rev 2 and Rev 3 the same day after John confirmed the ring assembly |

### B2. Raw data

Calculations are in the source narrative (503 lines).

### B3. Deviations

Side-wall verdict made conditional in Rev 2, resolved in Rev 3 after John confirmed the ring construction.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 stress within allowable | Accepted (see source) | Not recorded here | Pass |

**Overall:** Pass on stress; internal web mandatory; foam retained as required backing.

### C2. Curve and analysis
Numerical margins are in the source narrative.

### C3. Validity and limits

- Sources of error: closed-form bounds.
- Does establish: the walls are sane on stress.
- Does not establish: impact survivability or buckling.
- Not recorded here: numerical margins (see source).

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for wall stress |
| Design change driven by this test | Internal bracing web mandatory; outer wall floor 0.095 in |
| Re-run needed? | No |
| Next test | RR-06, then RR-10 impact |
| Issues filed | [SCO-71](https://linear.app/scout1/issue/SCO-71) |

### C5. Evidence and traceability

- Source narrative: [wedge-wall-thickness-structural-check-2026-09-07.md](wedge-wall-thickness-structural-check-2026-09-07.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
