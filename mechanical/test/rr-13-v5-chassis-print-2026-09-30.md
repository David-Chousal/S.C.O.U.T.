# v5 Chassis Print on the Dedicated Printer, 2026-09-30

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-13 · In progress |
| **Date, duration, who** | Started 2026-09-30, John Ryan Myrdal |
| **Requirement tested** | Chassis seal faces are flat and round enough to seal |
| **Tracking issue** | [SCO-93](https://linear.app/scout1/issue/SCO-93) |
| **Record kind** | Retroactive (source: [risk-reduction register RR-13](risk-reduction-register.md) only; the register row is the sole source) |

**Question.** Can the v5 chassis be printed round and flat enough to seal? Retires the risk that the chassis cannot be printed to seal tolerance.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Seal-face flatness and roundness | Not recorded | Within ±0.2 mm | Not recorded | Not measured |

**How.** v5 chassis printed on the dedicated printer ([SCO-93](https://linear.app/scout1/issue/SCO-93)). The 2026-10-08 status note says the chassis was printed; flatness and roundness were not recorded as measured.

**Result.** Printing at last register update; per the 2026-10-08 status the chassis was printed. No measurement of flatness or roundness is recorded.

**Does not establish.**

- Whether the seal faces meet ±0.2 mm: not measured.

**Decision.** Blocked on a measurement: measure seal-face flatness and roundness and add them to this record.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Show the chassis can be printed to the tolerance its static face seal needs.

### A2. Hypothesis
If the v5 chassis is printed on the dedicated printer, then its seal faces are flat and round within ±0.2 mm, because that printer produced good wedges.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Seal-face flatness | mm | Not recorded | Not recorded | Not recorded | Not recorded |
| Seal-face roundness | mm | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | None | — |
| Held fixed (controlled) | Not recorded | Not recorded |
| Measured (dependent) | Flatness, roundness | Not recorded |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Seal faces flat and round | Within ±0.2 mm | Seal requirement for the face seal | Register benchmark |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Part | v5 chassis |
| Printer | Dedicated printer |
| Settings | 6 walls / 25% gyroid (808 g) per the 2026-09-29 stability update; not confirmed for this print |
| Sample size | 1 |
| Safety | None |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Print the chassis. | Time, mass | Not recorded |
| 2 | Measure flatness and roundness of the seal faces. | Values | Not recorded |

### A8. Analysis plan
Compare measured flatness and roundness to ±0.2 mm.

### A9. Curve required

None, measurement against a tolerance.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Run date | Started 2026-09-30 |
| Operator | John Ryan Myrdal |
| Instrument IDs | Not recorded |
| Printer | Dedicated printer |

### B2. Raw data

No measurements recorded.

### B3. Deviations

None recorded.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 within ±0.2 mm | Not measured | — | Not measured |

**Overall:** In progress; no verdict.

### C2. Curve and analysis
No analysis possible without measurements.

### C3. Validity and limits

- Does establish: the chassis was printed (per the 2026-10-08 note).
- Does not establish: seal-face tolerance.
- Not recorded: everything measured.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Unknown |
| Design change driven by this test | None |
| Re-run needed? | Measure first |
| Next test | RR-12 onward uses the seal |
| Issues filed | [SCO-93](https://linear.app/scout1/issue/SCO-93) |

### C5. Evidence and traceability

- [Register](risk-reduction-register.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
