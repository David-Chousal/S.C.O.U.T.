# Sensor Housing Coupon Run 2, PLA, 4 Bolts, Ribbed Cap, 2026-10-06

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-14 · Fail |
| **Date, duration, who** | 2026-10-06 to 2026-10-07, John Ryan Myrdal |
| **Requirement tested** | Printed housings stay watertight (benchmarks provisional until [SCO-139](https://linear.app/scout1/issue/SCO-139)) |
| **Tracking issue** | [SCO-108](https://linear.app/scout1/issue/SCO-108) |
| **Record kind** | Retroactive (source: [sensor-housing-oring-coupon-2026-10-01.md § Run 2](sensor-housing-oring-coupon-2026-10-01.md#run-2--2026-10-06-in-the-water-result-due-2026-10-07)) |

**Question.** Does stiffening the cap (4 bolts, 4 radial ribs, slightly larger ring) close the gap between bolts that failed RR-12?

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Interior moisture | Paper towel, visual | Dry after 24 hr at ≥ 0.3 m in ~35 ppt salt water | Pod leaked (hours to failure not recorded) | Fail |

**How.** Same groove as run 1; PLA instead of PETG (PETG ran out), 4 bolts, 4 radial ribs midway between bolts, a slightly larger ring that still fits the groove.

**Result.** The pod leaked (reported 2026-10-07). Before the soak the cap still flexed between the bolts, less than run 1.

**Does not establish.**

- Which of the four simultaneous changes mattered: material, ring size, bolt count and ribs all changed.
- Where the water entered or how long it took.

**Decision.** Change and re-run: 6 bolts and a thicker cap. Next: RR-15.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Does stiffening the cap (4 bolts, 4 radial ribs, slightly larger ring) close the gap between bolts that failed RR-12?

### A2. Hypothesis
If the cap is stiffened with 4 bolts and 4 ribs, then the ring is compressed evenly and the interior stays dry, because the gap between bolts closes.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Interior moisture | dry / damp / flooded | Dry paper towel inside, inspected on opening | Binary (visual) | Not quantified | Not recorded |
| Soak duration | hr | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Print material (PLA), bolt count (4), ribbed cap, slightly larger ring: four changes at once (confounded) | vs RR-12 |
| Held fixed (controlled) | Groove ID 2.250 in / OD 2.774 in, paper-towel indicator | Torque and lubricant: not recorded |
| Measured (dependent) | Paper towel state | dry / damp / flooded |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Interior stays dry | Dry paper towel after 24 hr at ≥ 0.3 m in ~35 ppt salt water | Provisional pending SCO-139 | [Register](risk-reduction-register.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Material | Orange PLA (PETG ran out) |
| Bolts | 4, brass heat-set inserts |
| Cap | Radial ribs on top, 4, midway between bolts |
| O-ring | Slightly larger than 3/16 in section ring; exact size not recorded |
| Torque / lubricant | Not recorded |
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
| Start / end | In the water 2026-10-06; leak reported 2026-10-07; hours to failure not recorded |
| Operator | John Ryan Myrdal |
| Water | Salinity and depth not recorded |
| Instrument IDs | None |

### B2. Raw data

Pre-soak observation: cap still flexes and flares between the bolts, less than run 1; a dark seam line visible between cap and body. Result: leaked.

### B3. Deviations

Material changed to PLA because PETG ran out.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 dry at 24 hr | Leaked | — | Fail |

**Overall:** Fail (leaked).

### C2. Curve and analysis
John's read before the soak: ribs need to sit further out; an outer rim ring was under consideration.

### C3. Validity and limits

- Sources of error: four simultaneous changes.
- Does establish: 4 bolts plus ribs on PLA still leak.
- Does not establish: which change mattered.
- Not recorded: hours to failure, where water entered, ring size, torque.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | No |
| Design change driven by this test | 6 bolts, thicker cap, thicker ribs |
| Re-run needed? | Yes: RR-15 |
| Next test | RR-15 |
| Issues filed | [SCO-108](https://linear.app/scout1/issue/SCO-108) |

### C5. Evidence and traceability

- Source: [coupon record, run 2](sensor-housing-oring-coupon-2026-10-01.md#run-2--2026-10-06-in-the-water-result-due-2026-10-07)
- Photos: [CAD](sensor-housing-oring-coupon-2026-10-06-run2-cad.jpg), [cap ribs](sensor-housing-oring-coupon-2026-10-06-run2-cap-top-ribs.jpg), [assembled](sensor-housing-oring-coupon-2026-10-06-run2-assembled-side.jpg), [seam gap](sensor-housing-oring-coupon-2026-10-06-run2-assembled-seam-gap.jpg)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
