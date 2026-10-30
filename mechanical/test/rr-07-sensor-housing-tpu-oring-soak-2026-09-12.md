# Sensor Housing One-Week Soak, TPU-Printed O-Ring, 2026-09-12

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-07 · Fail |
| **Date, duration, who** | 2026-09-12 (opened), ~1 week, John Ryan Myrdal |
| **Requirement tested** | Printed housings stay watertight (benchmarks provisional until [SCO-139](https://linear.app/scout1/issue/SCO-139)) |
| **Tracking issue** | [SCO-106](https://linear.app/scout1/issue/SCO-106) |
| **Record kind** | Retroactive (source: [sensor-housing-tpu-oring-failure-2026-09-12.md](sensor-housing-tpu-oring-failure-2026-09-12.md)) |

**Question.** Does the turbidity sensor housing stay dry for a week with a TPU-printed O-ring? Retires the risk that a printed O-ring is good enough.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Interior moisture | Visual on opening | Dry after 1 week | Water had got in | Fail |

**How.** The assembled housing (3-bolt body–cap joint, face-seal remodel assumed) was left submerged about a week, then opened. No indicator paper or timestamps were set up.

**Result.** Water had got into the housing. The ring was poor but kept out most water for close to a week first, which fits a slow leak.

**Does not establish.**

- Whether the face-seal design works: the seal under test was a printed ring.
- Whether the leak was gradual or late: no interim check.
- The exact STEP revision of the tested article.

**Decision.** Change and re-run: no more housing soaks until a purchased O-ring is on hand ([SCO-106](https://linear.app/scout1/issue/SCO-106)). Next: RR-12.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Does the turbidity sensor housing stay dry for a week with a TPU-printed O-ring? Retires the risk that a printed O-ring is good enough.

### A2. Hypothesis
If the housing is sealed with a TPU-printed O-ring, then it stays dry for a week, because the ring seats in the face-seal groove.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Interior moisture | dry / damp / flooded | Dry paper towel inside, inspected on opening | Binary (visual) | Not quantified | Not recorded |
| Soak duration | hr | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | None (single article) | TPU-printed ring |
| Held fixed (controlled) | Submerged for ~a week, opened and inspected | Depth, water type: Not recorded |
| Measured (dependent) | Water inside on opening | yes / no |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Interior stays dry | Dry after 1 week | Register benchmark | [Register](risk-reduction-register.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Article | Printed turbidity sensor-housing prototype, 3-bolt body–cap joint; assumed face-seal remodel (`sensor-housing-body-face-seal` + `sensor-housing-sealed-cap-v2`), not confirmed against a STEP |
| Seal | TPU-printed O-ring, deliberate shortcut; specified AS568-137 not yet bought |
| Material / fasteners / torque | Not recorded |
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
| Start / end | 'Almost exactly a week' by John's recollection; no timestamps |
| Operator | John Ryan Myrdal |
| Water type / depth | Not recorded |
| Instrument IDs | None |

### B2. Raw data

No log. Observation on opening: water had got in.

### B3. Deviations

No moisture indicator paper and no interim inspection, unlike RR-03.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 dry after 1 week | Water inside | — | Fail |

**Overall:** Fail.

### C2. Curve and analysis
Held most of a week with a poor ring, so a slow weep rather than a wide-open failure is likely; not distinguished.

### C3. Validity and limits

- Sources of error: ring variability, no timestamps, no indicator paper.
- Does establish: a printed TPU ring is an unreliable stand-in on the current geometry over a week.
- Does not establish: the validity of the face-seal design.
- Not recorded: start/stop times, depth, torque, the photo (shared in chat, not saved).

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | No |
| Design change driven by this test | No housing soaks until a purchased ring is available |
| Re-run needed? | Yes, with a real ring |
| Next test | RR-12 |
| Issues filed | [SCO-106](https://linear.app/scout1/issue/SCO-106), [SCO-108](https://linear.app/scout1/issue/SCO-108) |

### C5. Evidence and traceability

- Source narrative: [sensor-housing-tpu-oring-failure-2026-09-12.md](sensor-housing-tpu-oring-failure-2026-09-12.md)
- Photo: not saved to the repo

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
