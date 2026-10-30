# Sensor Housing Coupon Run 1, Purchased O-Ring, 3 Bolts, 2026-10-01

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-12 · Fail |
| **Date, duration, who** | Planned 2026-10-01, run 2026-10-06, 24 hr, John Ryan Myrdal |
| **Requirement tested** | Printed housings stay watertight (benchmarks provisional until [SCO-139](https://linear.app/scout1/issue/SCO-139)) |
| **Tracking issue** | [SCO-108](https://linear.app/scout1/issue/SCO-108) |
| **Record kind** | Retroactive (source: [sensor-housing-oring-coupon-2026-10-01.md](sensor-housing-oring-coupon-2026-10-01.md)) |

**Question.** Does the face-seal groove hold with a purchased O-ring? Retires the risk that the face seal leaks with a real ring (RR-07 failed with a printed one).

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Interior moisture | Paper towel, visual | Dry at 24 hr, then at 1 week | Slightly damp at 24 hr, not flooded | Fail |

**How.** Shortened PETG body and flat cap with 3 stainless socket-head screws into heat-set inserts, a 2-1/4 in ID × 2-5/8 in OD × 3/16 in plumbing ring, groove sized for 25% squeeze; ≥ 0.3 m in ~35 ppt salt water.

**Result.** Interior slightly damp, no standing water. The cap flexed between the bolts, leaving a visible gap midway between bolts, so the ring lost compression there.

**Does not establish.**

- The ring or groove depth: the failure is in joint stiffness.
- Whether more bolts or a stiffer cap close the gap: not yet tested (that is RR-14).

**Decision.** Change and re-run: stiffen the cap (more bolts, ribs). Next: RR-14.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Does the face-seal groove hold with a purchased O-ring? Retires the risk that the face seal leaks with a real ring (RR-07 failed with a printed one).

### A2. Hypothesis
If a purchased 3/16 in ring sits in a groove sized for 25% squeeze, then the interior stays dry for 24 hr, because the compressed ring seals the face.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Interior moisture | dry / damp / flooded | Dry paper towel inside, inspected on opening | Binary (visual) | Not quantified | Not recorded |
| Soak duration | hr | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Ring: purchased 3/16 in plumbing ring instead of printed TPU | 1 change vs RR-07 |
| Held fixed (controlled) | PETG, 3-bolt flat cap, no lubricant, paper-towel indicator | Torque: not recorded (hand tight) |
| Measured (dependent) | Paper towel state | dry / damp / flooded |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Interior stays dry | Dry paper towel after 24 hr at ≥ 0.3 m in ~35 ppt salt water, then 1 week | Provisional pending SCO-139 | [Register](risk-reduction-register.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Geometry | Shortened sensor-housing body, lower spigot, flared flange, flat cap, 3 bolts |
| O-ring | Hardware-store ring ID 2-1/4 in × OD 2-5/8 in × 3/16 in section, measured; elastomer not confirmed (likely nitrile) |
| Groove design | Depth 0.141 in, width 0.262 in, ID 2.250 in, OD 2.774 in (25% squeeze, ~75% fill) |
| Material / fasteners | PETG; 3 stainless socket-head screws into brass heat-set inserts; torque not recorded |
| Lubricant | None |
| Sample size | 1; no control |
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
| Start / end | Run 2026-10-06, 24 hr; times not recorded |
| Operator | John Ryan Myrdal |
| Water | Salt water (salinity and depth not recorded) |
| Instrument IDs | None (visual) |

### B2. Raw data

Groove measurements were not recorded. Observation: slightly damp interior; cap gap visible between the bolts in the side photo.

### B3. Deviations

Groove measurements (procedure step 1) were not recorded.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 dry at 24 hr | Slightly damp | — | Fail |

**Overall:** Fail (slightly damp at 24 hr).

### C2. Curve and analysis
Cause per John: cap flexes between the 3 bolts; faces touch at bolts but gap midway.

### C3. Validity and limits

- Sources of error: ring elastomer unknown, hand-tightened bolts.
- Does establish: 3 bolts on a flat cap are too flexible.
- Does not establish: the final ring or silicone choice.
- Not recorded: salinity, depth, torque, groove measurements.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | No |
| Design change driven by this test | Stiffer cap: more bolts, ribs |
| Re-run needed? | Yes: RR-14 |
| Next test | RR-14 |
| Issues filed | [SCO-108](https://linear.app/scout1/issue/SCO-108) |

### C5. Evidence and traceability

- Source narrative: [sensor-housing-oring-coupon-2026-10-01.md](sensor-housing-oring-coupon-2026-10-01.md)
- Photos: [assembled](sensor-housing-oring-coupon-2026-10-06-assembled.jpg), [side](sensor-housing-oring-coupon-2026-10-06-side.jpg), [top](sensor-housing-oring-coupon-2026-10-06-top.jpg), [body and groove](sensor-housing-oring-coupon-2026-10-06-body-groove.jpg)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
