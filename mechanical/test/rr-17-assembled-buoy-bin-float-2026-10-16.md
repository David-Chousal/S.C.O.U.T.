# Dry Float of the Assembled Foam-Version Buoy in a Bin, 2026-10-16

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-17 · Partial |
| **Date, duration, who** | 2026-10-16, John Ryan Myrdal |
| **Requirement tested** | Built buoy floats at the modelled waterline (benchmark ±0.5 in) |
| **Tracking issue** | [SCO-170](https://linear.app/scout1/issue/SCO-170) |
| **Record kind** | Retroactive (source: [risk-reduction register RR-17](risk-reduction-register.md) and the [assembly record](buoy-assembly-2026-10-06.md)) |

**Question.** Does the built buoy float at the modelled waterline? Retires the risk that the mass/freeboard model is wrong.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Freeboard vs model | Not recorded | Within ±0.5 in of the model | Waterline and freeboard numbers not recorded | Not measured |
| Seam leakage | Visual | No leak | Leaked slightly through the marine-epoxy seams | Fail |

**How.** The assembled buoy (wedges, chassis, caps; inside seams Gorilla Glue, outside seams J-B Weld/marine epoxy) was floated in a bin tested empty (no foam) and without its outermost complete seam coats.

**Result.** Floated well, leaked slightly through the epoxy seams. The buoy was built to rely on flotation foam and was tested empty.

**Does not establish.**

- The freeboard accuracy: numbers not recorded.
- Behaviour with foam or full seam coats.
- Salt-water waterline (planned in [SCO-172](https://linear.app/scout1/issue/SCO-172)).

**Decision.** Change and re-run: re-float with foam and full seam coats and record waterline and freeboard. Next: [SCO-172](https://linear.app/scout1/issue/SCO-172).

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Check that the built buoy floats where the mass and freeboard model says it should.

### A2. Hypothesis
If the assembled buoy is floated in a bin, then its freeboard is within ±0.5 in of the model, because the printed parts and seams are mass-matched to the model.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Freeboard | in | Not recorded | Not recorded | Not recorded | Not recorded |
| Waterline | in | Not recorded | Not recorded | Not recorded | Not recorded |
| Seam leakage | yes / no | Visual | Binary | Not quantified | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | None (single float) | — |
| Held fixed (controlled) | Not recorded | Tested empty, no foam, outer seam coats incomplete |
| Measured (dependent) | Freeboard, leak | Not recorded |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Freeboard within the model | ±0.5 in of the 4.27 in model | Register benchmark; model figure from register to-do | [Register](risk-reduction-register.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Article | Assembled buoy: wedges, chassis, bottom caps ([assembly 2026-10-06](buoy-assembly-2026-10-06.md)) |
| Seams | Inside Gorilla Glue; outside marine epoxy / J-B Weld applied 2026-10-07, not all crevices |
| Foam | None (built to rely on foam) |
| Water | Not recorded |
| Sample size | 1 |
| Safety | None |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Float the buoy in a bin. | Waterline, freeboard | Not recorded |
| 2 | Observe leaks. | Seam locations | Not recorded |

### A8. Analysis plan
Compare freeboard to the model; note leaks.

### A9. Curve required

None, measurement against a model value. A model-vs-measurement (validation) point was not captured because freeboard was not recorded.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Date | 2026-10-16 |
| Operator | John Ryan Myrdal |
| Water | Not recorded |
| Instrument IDs | Not recorded |

### B2. Raw data

Observation: floated well; leaked slightly through the epoxy seams.

### B3. Deviations

Floated empty and without the outermost complete seam coats.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 freeboard ±0.5 in | Not recorded | — | Not measured |

**Overall:** Partial: floats, leaks slightly; accuracy not recorded.

### C2. Curve and analysis
No numbers to compare.

### C3. Validity and limits

- Sources of error: empty buoy, incomplete seam coats.
- Does establish: the built buoy floats.
- Does not establish: freeboard accuracy.
- Not recorded: waterline, freeboard, water conditions.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | No |
| Design change driven by this test | Waterproof coating on both buoys (2026-10-27 plan) |
| Re-run needed? | Yes, with numbers |
| Next test | [SCO-172](https://linear.app/scout1/issue/SCO-172), [SCO-230](https://linear.app/scout1/issue/SCO-230) |
| Issues filed | [SCO-170](https://linear.app/scout1/issue/SCO-170) |

### C5. Evidence and traceability

- [Assembly record with 18 photos](buoy-assembly-2026-10-06.md)
- Photos: `buoy-jb-weld-2026-10-07-0*.jpg`

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
