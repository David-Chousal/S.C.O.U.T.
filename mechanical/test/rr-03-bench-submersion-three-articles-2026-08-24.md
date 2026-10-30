# Bench Submersion of Three Printed Housings, 2026-08-24

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-03 · Partial |
| **Date, duration, who** | 2026-08-24, ~30 hr (article 1), John Ryan Myrdal |
| **Requirement tested** | Printed housings stay watertight (benchmarks provisional until [SCO-139](https://linear.app/scout1/issue/SCO-139)) |
| **Tracking issue** | [SCO-82](https://linear.app/scout1/issue/SCO-82) |
| **Record kind** | Retroactive (source: [waterproofing-submersion-test-2026-08-24.md](waterproofing-submersion-test-2026-08-24.md)) |

**Question.** Do printed housings sealed with 3D-printed TPU O-rings stay dry? Retires the risk that printed housings leak.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Interior moisture | Paper towel (toilet paper), visual | Dry on opening | Article 1 dry (~30 hr); articles 2 and 3 wet | 1 Pass, 2 Fail |

**How.** Three articles, each with a paper towel inside, sealed and left submerged: (1) PLA sensor housing, (2) PETG sensor housing at lower print quality, (3) the electronics housing with no sealing washers at the bolts. All O-rings were TPU-printed.

**Result.** Article 1 (PLA) dry after ~30 hr. Article 2 (PETG, stringy ring) failed. Article 3 flooded significantly. Durations for 2 and 3 were not recorded.

**Does not establish.**

- Why PLA passed and PETG failed: print quality and material both differ.
- Anything about purchased O-rings: all rings were printed, a shortcut.
- Pressure performance or leak rate.

**Decision.** Change and re-run: reprint the PETG at the same quality, add the specified washers to the electronics housing, and log durations. Next: RR-07.

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Do printed housings sealed with 3D-printed TPU O-rings stay dry? Retires the risk that printed housings leak.

### A2. Hypothesis
If a printed housing is sealed with a printed TPU O-ring, then its interior stays dry, because the ring compresses into the groove.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Interior moisture | dry / damp / flooded | Dry paper towel inside, inspected on opening | Binary (visual) | Not quantified | Not recorded |
| Soak duration | hr | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Article: PLA sensor housing / PETG sensor housing / electronics housing (material, print quality and design all differ) | 3 articles |
| Held fixed (controlled) | Paper-towel indicator; all rings TPU-printed; submerged in water | Water type, depth, temperature: Not recorded |
| Measured (dependent) | Paper towel condition | dry / wet |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Interior stays dry | Paper towel bone-dry on opening | A seal that lets water in fails | Register benchmark |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Article 1 | Sensor housing, PLA, TPU-printed O-ring |
| Article 2 | Sensor housing, PETG, low print quality (stringy ring), TPU-printed O-ring |
| Article 3 | Electronics housing; no rubber sealing washers at the bolt joints despite the design spec |
| Fasteners / torque | Not recorded |
| Sample size | 1 per article; no control |
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
| Start / end | Article 1 ~30 hr; articles 2 and 3: Not recorded |
| Operator | John Ryan Myrdal |
| Water type / depth / temperature | Not recorded |
| Instrument IDs | None (visual) |

### B2. Raw data

| # | Article | Duration | Observation |
|---|---|---|---|
| 1 | PLA sensor housing, TPU ring | ~30 hr | Paper bone-dry |
| 2 | PETG sensor housing, low quality | Not recorded | Failed; ring stringy |
| 3 | Electronics housing, no bolt washers | Not recorded | Significant water ingress |

### B3. Deviations

Bolt washers specified in the design were missing from article 3 as built.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 article 1 dry | Dry | — | Pass |
| M1 article 2 dry | Not dry | — | Fail |
| M1 article 3 dry | Significant ingress | — | Fail |

**Overall:** Partial: one pass, two fails.

### C2. Curve and analysis
Source hypotheses (unconfirmed): article 2 failed on the stringy ring fit, not the concept; article 3 failure was expected because the washers were not fitted.

### C3. Validity and limits

- Sources of error: all rings printed; indicator method gives no rate.
- Does establish: a PLA + printed-TPU seal held ~30 hr once; the washer-less electronics housing leaks.
- Does not establish: PETG vs PLA effect, pressure performance, purchased-ring performance.
- Not recorded: durations for articles 2 and 3, water depth and temperature, torque.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | No |
| Design change driven by this test | Washers at the electronics housing bolts to be built; purchased O-rings (decision log) |
| Re-run needed? | Yes |
| Next test | RR-07, then RR-12 |
| Issues filed | [SCO-82](https://linear.app/scout1/issue/SCO-82) tracks the pressure test |

### C5. Evidence and traceability

- Source narrative: [waterproofing-submersion-test-2026-08-24.md](waterproofing-submersion-test-2026-08-24.md)
- Photo: [sensor-housing-waterproofing-test-2026-08-24.jpg](sensor-housing-waterproofing-test-2026-08-24.jpg)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
