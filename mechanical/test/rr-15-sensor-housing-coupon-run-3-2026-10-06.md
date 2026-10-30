# Sensor Housing Coupon Run 3, 6 Bolts, Thicker Cap and Ribs, 2026-10-06

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-15 · Fail |
| **Date, duration, who** | In water 2026-10-07, failed 2026-10-08, John Ryan Myrdal |
| **Requirement tested** | Printed housings stay watertight (benchmarks provisional until [SCO-139](https://linear.app/scout1/issue/SCO-139)) |
| **Tracking issue** | [SCO-108](https://linear.app/scout1/issue/SCO-108) |
| **Record kind** | Retroactive (source: [sensor-housing-oring-coupon-2026-10-01.md § Run 3](sensor-housing-oring-coupon-2026-10-01.md) and register RR-15) |

**Question.** Do six evenly spaced bolts and a stiffer cap close the gap that opened in RR-12 and RR-14?

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Interior moisture | Paper towel, visual | Dry after 24 hr at ≥ 0.3 m in ~35 ppt salt water | Pod flooded completely | Fail |

**How.** Redesigned in ~30 min, printed, six heat-set inserts pressed in, assembled with six bolts and submerged (~35 min). CAD `sensor-housing-assembly-v9.step`.

**Result.** The whole pod flooded despite six bolts. Likely cause (inference): the 3/16 in (4.76 mm) ring is about double the 2.62 mm AS568-137/142 section the groove was cut for; the ring used in run 3 was not recorded.

**Does not establish.**

- Which of bolt count and cap thickness mattered: both changed.
- That the ring mismatch caused the flood: inference, ring not recorded.

**Decision.** Change and re-run: cut the groove for the real ring. Next: RR-16.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Do six evenly spaced bolts and a stiffer cap close the gap that opened in RR-12 and RR-14?

### A2. Hypothesis
If six bolts and a thicker, ribbed cap are used, then the interior stays dry, because the cap no longer flexes between bolts.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Interior moisture | dry / damp / flooded | Dry paper towel inside, inspected on opening | Binary (visual) | Not quantified | Not recorded |
| Soak duration | hr | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Bolt count (6) and cap/rib thickness (confounded) | vs RR-14 |
| Held fixed (controlled) | Groove for the 2.62 mm ring, paper-towel indicator | Ring, torque: not recorded |
| Measured (dependent) | Paper towel state | dry / damp / flooded |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Interior stays dry | Dry paper towel after 24 hr at ≥ 0.3 m in ~35 ppt salt water | Provisional pending SCO-139 | [Register](risk-reduction-register.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Bolts | 6, evenly spaced, brass heat-set inserts |
| Cap | Thicker, thicker ribs; dimensions not recorded |
| Material | Orange print as in run 2; material not stated |
| O-ring | Not recorded (see inference) |
| Torque / lubricant | Not recorded |
| CAD | [`sensor-housing-assembly-v9.step`](../cad/sensor-housing/sensor-housing-assembly-v9.step) |
| Sample size | 1 |
| Safety | None |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Place a dry paper towel inside the article. | Towel state before | Not recorded |
| 2 | Seat the O-ring and bolt the cap, with the fasteners listed in A6. | Torque (Not recorded) | Not recorded |
| 3 | Submerge the sealed article. | Time in, depth, water type | Not recorded |
| 4 | Leave it for the soak duration. | Time out | Not recorded |
| 5 | Open it and inspect the towel. | Dry / damp / flooded, photo | Not recorded |

### A8. Analysis plan
Open the article, inspect the paper towel, and record dry, damp or flooded. A pass is a dry towel. This is an indicator method: it shows whether water got in, not how much or how fast.

### A9. Curve required

None, pass/fail test. A leak indicator needs no calibration or validation curve; a leak rate would need a measured mass or volume gain, which this method does not give.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Start / end | In the water 2026-10-07 (time not recorded); failed 2026-10-08 |
| Operator | John Ryan Myrdal |
| Water | Depth and salinity not recorded |
| Instrument IDs | None |

### B2. Raw data

Result: whole pod flooded. Where the water got in and the paper-towel state were not recorded.

### B3. Deviations

None recorded.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 dry at 24 hr | Flooded | — | Fail |

**Overall:** Fail (flooded).

### C2. Curve and analysis
Three failures in a row (3, 4, 6 bolts) suggest bolt count and cap stiffness were not the main problem.

### C3. Validity and limits

- Sources of error: ring in use not recorded.
- Does establish: 6 bolts do not by themselves fix the leak.
- Does not establish: the cause (ring mismatch is an inference).
- Not recorded: ring, torque, time in the water, depth, salinity, entry point.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | No |
| Design change driven by this test | Groove cut for the real 3/16 in ring |
| Re-run needed? | Yes: RR-16 |
| Next test | RR-16 |
| Issues filed | [SCO-108](https://linear.app/scout1/issue/SCO-108) |

### C5. Evidence and traceability

- Source: [coupon record, run 3](sensor-housing-oring-coupon-2026-10-01.md)
- Photos: [six inserts](sensor-housing-oring-coupon-2026-10-07-run3-body-six-inserts.jpg), [assembled](sensor-housing-oring-coupon-2026-10-07-run3-assembled-six-bolts.jpg)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
