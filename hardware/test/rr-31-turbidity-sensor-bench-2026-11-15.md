# Turbidity Sensor — First Bench Reading at 3.3 V, 2026-11-15

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-31 · Pass (reads, steady in clear water, cloudier water reads lower); no accuracy number, by design |
| **Date, duration, who** | 2026-11-15, ≈ 16:40–17:10 PST (≈ 30 min), Isabella Rodriguez |
| **Requirement tested** | R-03 detect turbidity ([Requirements Test Matrix](../../docs/engineering/requirements-test-matrix.md)): ordering and repeatability; bench plan Test 6 |
| **Tracking issue** | [SCO-157](https://linear.app/scout1/issue/SCO-157), [SCO-153](https://linear.app/scout1/issue/SCO-153) |
| **Record kind** | Prospective, with gaps: the pass marks are the R-03 matrix row (committed 2026-10-30) and the T6 lab procedure (drafted 2026-11-03), both before this run; the cloudy sample was coffee instead of the planned milk series (B3) |

**Question.** Does the Seeed Grove turbidity sensor work at 3.3 V on A1, read steadily in clear
water, and read lower as water gets cloudier (the polarity the firmware, analytics and simulator
assume)?

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Reading present (ADC count) | `scout_t6_turbidity`, 1 Hz, 12-bit | A reading every second; never stuck at 0 or 4095 | 1951–2548 in normal readings (switch on A) | Pass |
| Clear-water spread (%) | Same, `s` = 50 readings | (max − min) / mean < 1 % | **0.41 %** (2435–2445, mean 2438.7) | Pass |
| Ordering | Same | Clear water reads higher than cloudy water | Clear 2438.7 → coffee 2045.1 (−16 %) | Pass |
| Clear-water voltage at 3.3 V (V) | Same | Record only | **1.965 V** | Recorded |

**How and steps.** Sensor on the Feather M0 + Adalogger bench stack, wired direct to 3V (no Q1
switch). Probe tip in air, then about 250 mL of tap water, then coffee added to the same cup.
The `s` command takes 50 readings and prints mean, min, max and spread.

**Result.** With the board switch on A, the sensor reads, holds within 0.41 % in clear water once
the probe is fixed in place, and drops 16 % when the water is clouded. Higher count = clearer
water, as the code assumes. The first readings were taken with the board's A/D switch on D
(flat ≈ 0.12 V in air and water); moving it to A fixed it.

**Does not establish.**

- Accuracy in NTU: no turbidity standard ([SCO-271](https://linear.app/scout1/issue/SCO-271)).
- A graded dilution series: coffee is mostly dissolved dye, not suspended particles; one cloudy step only.
- The Q1 power switch (Test 9: off current, settle time, rail dip), salt water, or the flight firmware's cycle.

**Decision.** R-03 moves from Gap to Partial. Next: a milk or flour drop series (0, 5, 10, 15, 20)
for a graded ordering, then Test 9 with a multimeter.

---

## Part A — Plan (write and date before the run)

### A1. Purpose and risk retired
The whole turbidity pipeline assumes the sensor works at 3.3 V on A1 and that a higher count means
clearer water. If either is wrong, the firmware, `turbidity.py`, `drift.py`, the simulator and the
data schema would all be wrong together. This is the sensor's first bench reading.

### A2. Hypothesis
If the Grove sensor is powered at 3.3 V with its switch on A, then it gives a steady analog count
(spread < 1 % in clear water) that falls when the water gets cloudier, because the probe measures
how much light crosses the gap in its tip.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Turbidity output | ADC count, V | Feather M0 A1, 12-bit, 3.3 V reference; `scout_t6_turbidity` | 1 count ≈ 0.8 mV | Not characterised | Not calibrated (no standard) |
| Spread | % | (max − min) / mean over 50 readings | 0.01 % | — | — |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | What the probe tip is in | Air, clear tap water, tap water + coffee |
| Held fixed (controlled) | Sensor, cable, wiring, USB power, cup, water volume (≈ 250 mL), probe depth (≈ 2 cm), room light | Same through the run |
| Measured (dependent) | ADC count and volts | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Reading present | Present | A reading every second; never stuck at 0 or 4095 | 0 or 4095 means a wiring or range fault | Bench plan Test 6; lab procedure T6-1 |
| M2 | Ordering | Plausible | Clear water reads higher than cloudy water | The polarity the firmware and analytics assume | R-03 matrix row; lab procedure T6-2 |
| M3 | Repeatability | Plausible | Spread < 1 % over 50 readings in clear water | Bench plan Stage 1 | R-03 matrix row; lab procedure T6-3 |
| M4 | Clear-water voltage | Other | Record only | Seeed does not publish the 3.3 V output range | Lab procedure T6-4 |

Locked on: 2026-10-30 (R-03 row of the requirements test matrix, commit `7dbcf68`, before this run).

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | Breadboard build as RR-25; sketch [`scout_t6_turbidity`](bench-sketches/scout_t6_turbidity/) |
| Material and print settings | n/a |
| Configuration | Seeed Grove turbidity 101020752 via Grove-to-male cable 110990210: red → 3V, black → GND, yellow → A1, white taped off; board switch on A. No Q1 switch (red direct to 3V). DS18B20 on D12 and SHT40 on STEMMA QT left wired. Matches `firmware/src/config.h` (`PIN_TURBIDITY A1`, 3.3 V, no divider) |
| Conditions | Indoors, tap water, room light unchanged |
| Sample size and replication | One sensor (spare kept bagged); 50 readings per sample |
| Control / reference article | Clear tap water as the reference sample |
| Reference instrument or standard | None (no NTU standard) |
| Expected values | Clear water higher than cloudy; steady to < 1 % |
| Before you start (go/no-go) | USB unplugged while wiring; red on 3V (not USB or BAT); switch on A; only the clear tip in water |
| Data path | USB 115200 baud → Arduino IDE Serial Monitor → screenshots |
| Stop and abort conditions | Reading pinned at 4095 or V ≥ 3.3 V (wrong supply); water near the board or laptop |
| Safety | 3.3 V from USB; cups away from the electronics |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Red wire on USB or BAT | Output above 3.3 V can damage A1 | Reading pinned at 4095 | Red on 3V, checked before power |
| Switch on D | Output is digital only | Flat or two-valued reading | Switch on A (happened: D-01) |
| Probe moving or bubbles on the tip | Unsteady reading | Large spread, sudden dips | Fix the probe in place, knock bubbles off (happened: D-02) |
| Probe dipped past the line | Water reaches the probe electronics | Erratic readings | Tip only |

### A7. Procedure

**Prerequisites checklist.** Sensor wired as A6; `scout_t6_turbidity` uploaded; Serial Monitor at
115200, New Line; cup, tap water, a clouding agent.

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Power up; watch the 1 s lines | Readings | Not 0 or 4095 | ☑ |
| 2 | Probe in air; `s` | Mean, spread | Steady (no pass mark) | ☑ |
| 3 | Probe tip in clear water, fixed in place; wait; `s` | Mean, spread, V | Spread < 1 % | ☑ (second try, D-02) |
| 4 | Cloud the water; wait; `s` | Mean | Lower than step 3 | ☑ coffee (D-03) |

### A8. Analysis plan
Spread is (max − min) / mean of the 50 readings the sketch takes. Ordering compares the clear and
cloudy means. The clear-water mean voltage is recorded as the 3.3 V reference point.

### A9. Curve required

| Curve | Axes and units | Standard or model compared against | Range to cover | Acceptance for the fit |
|---|---|---|---|---|
| None for this run | — | — | — | A graded dilution curve is the next test |

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| Lab procedure (T6) | Drafted 2026-11-03 | Not recorded | None |

Open question: an NTU standard for calibration ([SCO-271](https://linear.app/scout1/issue/SCO-271)).

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | 2026-11-15, ≈ 16:40–17:10 PST (from screenshot times) |
| Operator | Isabella Rodriguez |
| Ambient conditions | Indoors; temperature Not recorded |
| Instrument serials / IDs | Not recorded (single prototype units) |

### B2. Raw data

Summary data: [`t6-turbidity-2026-11-15.csv`](evidence/rr-31-2026-11-15/data/t6-turbidity-2026-11-15.csv);
Serial Monitor screenshots in [`evidence/rr-31-2026-11-15/screenshots/`](evidence/rr-31-2026-11-15/screenshots/).

| Time (PST) | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|
| 16:42 | Air, switch on D | ≈ 147 (0.118 V) every second | — | Flat; D-01 |
| 16:45 | Air, switch on D, `s` | Mean 145.2 (0.117 V), 100–151, spread 35.1 % | — | Invalid (D-01) |
| 16:52 | Clear water, switch on D, `s` | Mean 148.0 (0.118 V), 141–187, spread 31.1 % | — | Same as air: fault found |
| 16:55 | Air, switch on A, `s` | Mean 1957.0 (1.577 V), 1951–1966, spread 0.77 % | — | |
| 16:57 | Clear water, hand-held, `s` | Mean 2481.0 (1.999 V), 2414–2548, spread 5.40 %; dips to 279 | — | D-02 |
| 16:59 | Clear water, fixed in place, `s` | **Mean 2438.7 (1.965 V), 2435–2445, spread 0.41 %** | — | M3 |
| 17:08 | Same cup + coffee, `s` | **Mean 2045.1 (1.648 V), 2036–2055, spread 0.93 %** | Clear 2438.7 | M2 |

### B3. Deviations

| Time | What differed from A7 | Why | Effect on validity |
|---|---|---|---|
| 16:42–16:52 | D-01: board switch on D (digital) | Not checked before power | Those readings discarded; all metrics use the switch-on-A readings |
| 16:57 | D-02: probe hand-held; spread 5.40 % with dips | Movement and bubbles | Re-run with the probe fixed: 0.41 % |
| 17:08 | D-03: coffee instead of a milk drop series | No milk at hand | One cloudy step only; coffee darkens mostly by dye, so this proves the direction, not a turbidity scale |
| Whole run | D-04: supply voltage (`b`) not read | Skipped | None on M1–M3 |

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 reading present | Every second; 1951–2548 with the switch on A | Far from 0 and 4095 | Pass |
| M2 ordering | Clear 2438.7 > coffee 2045.1 | −16 % | Pass |
| M3 repeatability | 0.41 % in clear water | 0.59 points under 1 % | Pass |
| M4 clear-water voltage | 1.965 V at 3.3 V supply | — | Recorded |

**Overall:** Pass for what R-03 can check today (presence, ordering, repeatability).

### C2. Curve and analysis

Clear water read about 25 % higher than air (2439 vs 1957), and coffee about 16 % lower than
clear water. With the switch on A, all settled samples held within 1 %. The hand-held try's dips
(to 279) came back once the probe was fixed in place, so they were movement or bubbles, not the
sensor. No chart was made; the record is the seven samples above.

### C3. Validity and limits

- **Sources of error:** one cloudy agent that is mostly dye; single run; room light not measured; supply voltage not read.
- **What this does establish:** the sensor reads at 3.3 V on A1, steady to 0.41 % in clear water, and lower in cloudier water.
- **What this does not establish:** NTU accuracy; a graded response; the Q1 switch; salt water.
- **Not recorded or shortcut taken:** exact times (taken from screenshots); room temperature; no setup photo.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for wiring and polarity (3.3 V, A1, no divider) |
| Design change driven by this test | None. Add "switch on A" to the wiring checks |
| Re-run needed? | A graded milk or flour series (0–20 drops) for R-03's dilution series |
| Next test | Test 9, the Q1 switch, with a multimeter ([SCO-87](https://linear.app/scout1/issue/SCO-87)) |
| Issues filed | None new |

### C5. Evidence and traceability

- Data: [`t6-turbidity-2026-11-15.csv`](evidence/rr-31-2026-11-15/data/t6-turbidity-2026-11-15.csv), [screenshots](evidence/rr-31-2026-11-15/screenshots/)
- Tools: [`scout_t6_turbidity`](bench-sketches/scout_t6_turbidity/)
- R-03 → this test → [SCO-157](https://linear.app/scout1/issue/SCO-157); calibration gap [SCO-271](https://linear.app/scout1/issue/SCO-271)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](../../mechanical/test/risk-reduction-register.md).
