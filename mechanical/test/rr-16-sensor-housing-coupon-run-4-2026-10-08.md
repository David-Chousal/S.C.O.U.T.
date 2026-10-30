# Sensor Housing Coupon Run 4, Groove Matched to the Real Ring, 2026-10-08

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-16 · Planned |
| **Date, duration, who** | Body supplied 2026-10-08; not yet in the water, John Ryan Myrdal |
| **Requirement tested** | Printed housings stay watertight (benchmarks provisional until [SCO-139](https://linear.app/scout1/issue/SCO-139)) |
| **Tracking issue** | [SCO-108](https://linear.app/scout1/issue/SCO-108) |
| **Record kind** | Prospective |

**Question.** Does a groove cut for the real 3/16 in ring (about 28% squeeze), with 6 bolts and a shorter body, hold? Retires the risk that the ring and groove were mismatched in RR-15.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Interior moisture | Paper towel, visual | Dry after 24 hr at ≥ 0.3 m in ~35 ppt salt water | Not yet run | Not measured |

**How.** Shorter body (`sensor-housing-body-short-v1.step`, inches), groove Ø2.20 / Ø2.74 in, floor ~0.135 in below the face (~28% squeeze), 6 holes Ø0.22 in on a Ø3.10 in circle, flange Ø3.50 in.

**Result.** Not yet run.

**Does not establish.**

- Anything: the test has not been run.

**Decision.** Run the test. Record water, torque and ring elastomer.

---

## Part A — Plan


### A1. Purpose and risk retired
Does a groove cut for the real 3/16 in ring (about 28% squeeze), with 6 bolts and a shorter body, hold? Retires the risk that the ring and groove were mismatched in RR-15.

### A2. Hypothesis
If the groove matches the ring (3/16 in section, ~28% squeeze), then the interior stays dry for 24 hr, because the ring is compressed evenly and the mismatch of RR-15 is removed.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Interior moisture | dry / damp / flooded | Dry paper towel inside, inspected on opening | Binary (visual) | Not quantified | Not recorded |
| Soak duration | hr | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Groove matched to the 3/16 in ring; shorter body | vs RR-15 |
| Held fixed (controlled) | 6 bolts, paper-towel indicator, salt water ~35 ppt, ≥ 0.3 m | Torque to be recorded |
| Measured (dependent) | Paper towel state | dry / damp / flooded |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Interior stays dry | Dry paper towel after 24 hr at ≥ 0.3 m in ~35 ppt salt water | Provisional pending SCO-139 | [Register](risk-reduction-register.md) |

Locked on: 

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| CAD | [`sensor-housing-body-short-v1.step`](../cad/sensor-housing/sensor-housing-body-short-v1.step) |
| Ring | Everbilt Medium O-Ring Assortment ring, OD 2-5/8 in, ID 2-1/4 in, 3/16 in section; elastomer unknown |
| Groove | Ø2.20 in / Ø2.74 in, floor ~0.135 in (inferred from vertex heights), ~28% squeeze |
| Cap | Not in the supplied file; must match the body groove face and bolt circle |
| Sample size | 1 |
| Safety | None |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Caliper-check groove depth, width and ID. | Measured values | ☐ |
| 2 | Place dry paper towel; seat the ring; fit 6 bolts at recorded torque. | Torque | ☐ |
| 3 | Submerge at ≥ 0.3 m in ~35 ppt salt water. | Time in, depth, salinity | ☐ |
| 4 | Inspect at 24 hr. | Towel state, photo | ☐ |

### A8. Analysis plan
Dry, damp or flooded at 24 hr.

### A9. Curve required

None, pass/fail test.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Start / end | To be recorded |
| Operator | John Ryan Myrdal |
| Ambient / water temperature | To be recorded |
| Instrument IDs | Calipers (to be recorded) |

### B2. Raw data

Not yet run.

### B3. Deviations

Not yet run.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 dry at 24 hr | Not yet run | — | Not measured |

**Overall:** Planned.

### C2. Curve and analysis
Not yet run.

### C3. Validity and limits

- Does establish: nothing yet.
- Groove depth is inferred from vertex heights, not measured.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Not yet known |
| Design change driven by this test | None yet |
| Re-run needed? | Not yet run |
| Next test | RR-18 follows the same seal on PETG |
| Issues filed | [SCO-108](https://linear.app/scout1/issue/SCO-108) |

### C5. Evidence and traceability

- Source: [coupon record, run 4](sensor-housing-oring-coupon-2026-10-01.md#run-4--2026-10-08-matched-groove-body-supplied)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
