# Sensor Pod Fresh-Water Seal Check, PETG, Inserts Pressed from Below, 2026-10-21

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-18 · Pass |
| **Date, duration, who** | 2026-10-21, 24 hr, John Ryan Myrdal |
| **Requirement tested** | Printed housings stay watertight (benchmarks provisional until [SCO-139](https://linear.app/scout1/issue/SCO-139)) |
| **Tracking issue** | [SCO-91](https://linear.app/scout1/issue/SCO-91), [SCO-108](https://linear.app/scout1/issue/SCO-108) |
| **Record kind** | Retroactive (source: [sensor-housing-petg-pass-2026-10-21.md](sensor-housing-petg-pass-2026-10-21.md)) |

**Question.** Does printing the pod in PETG and pressing the heat-set inserts in from the bottom keep the flange flat enough for even clamping around the ring?

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Interior moisture | Paper towel, visual | Dry after 24 hr submerged | Dry | Pass |

**How.** Dry paper towel inside, O-ring seated, bolts tightened, submerged 24 hr in fresh water at negligible depth with no sensor fitted, then opened and inspected.

**Result.** The paper towel was dry on opening. This is the first passing run of the face-seal design with a purchased O-ring.

**Does not establish.**

- Salt water (~35 ppt), the 5 m-equivalent pressure target, or the 1-week soak with the sensor live ([SCO-176](https://linear.app/scout1/issue/SCO-176)).
- The electronics-housing clamp ([SCO-108](https://linear.app/scout1/issue/SCO-108)).
- Which of PETG and insert direction mattered: both changed.

**Decision.** Good enough for the fresh-water gate; salt water and pressure are the next tests. Next: salt-water and pressure tests ([SCO-91](https://linear.app/scout1/issue/SCO-91)).

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Does printing the pod in PETG and pressing the heat-set inserts in from the bottom keep the flange flat enough for even clamping around the ring?

### A2. Hypothesis
If the pod is printed in PETG with inserts pressed from the bottom, then the interior stays dry for 24 hr, because the flange face stays flat and the ring is clamped evenly.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Interior moisture | dry / damp / flooded | Dry paper towel inside, inspected on opening | Binary (visual) | Not quantified | Not recorded |
| Soak duration | hr | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Print material (PETG) and insert direction (from the bottom) | vs RR-15 |
| Held fixed (controlled) | Purchased O-ring, paper-towel indicator, 24 hr | Torque: not recorded |
| Measured (dependent) | Paper towel state | dry / damp / flooded |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Interior stays dry | Dry paper towel after 24 hr submerged | Register benchmark (fresh water, no sensor, negligible depth) | [Register](risk-reduction-register.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision | '2.5' per John; file/STEP not confirmed |
| Material | PETG |
| Inserts | Heat-set, pressed in from the bottom of the flange; the photo shows eight in the body |
| Fasteners | Bolt count and torque not recorded |
| Water | Fresh, negligible depth, no sensor |
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
| Start / end | 2026-10-21, 24 hr; no timestamped start/stop log |
| Operator | John Ryan Myrdal |
| Water | Fresh, negligible depth |
| Instrument IDs | None |

### B2. Raw data

Observation: paper towel dry on opening (photo).

### B3. Deviations

None recorded.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 dry at 24 hr | Dry | — | Pass |

**Overall:** Pass (fresh water, negligible depth, no sensor).

### C2. Curve and analysis
Per John, the changes that made the difference were PETG and pressing inserts from the bottom (pressed from the top, hot inserts slightly deformed the flange face).

### C3. Validity and limits

- Sources of error: no timestamps; two changes at once.
- Does establish: the face-seal joint can hold a dry interior for 24 hr when print material and insert direction are right.
- Does not establish: salt water, pressure, week-long soak, sensor live.
- Not recorded: bolt count, torque, revision confirmation.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for the seal geometry; open for salt water and pressure |
| Design change driven by this test | PETG print; inserts pressed from the bottom |
| Re-run needed? | Salt water, pressure, 1-week with sensor |
| Next test | [SCO-176](https://linear.app/scout1/issue/SCO-176) |
| Issues filed | [SCO-91](https://linear.app/scout1/issue/SCO-91), [SCO-108](https://linear.app/scout1/issue/SCO-108) |

### C5. Evidence and traceability

- Source narrative: [sensor-housing-petg-pass-2026-10-21.md](sensor-housing-petg-pass-2026-10-21.md)
- Photo: [sensor-housing-petg-pass-2026-10-21-01.jpg](sensor-housing-petg-pass-2026-10-21-01.jpg)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
