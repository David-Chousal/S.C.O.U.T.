# Electronics Bench — Controller, Sensor and Clock Bring-Up, 2026-10-29

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-25 · Pass (5 of 5 bench checks; accuracy, power and clock backup not tested) |
| **Date, duration, who** | 2026-10-29, 12:15–13:30 (about 1.25 hr), Isabella Rodriguez |
| **Requirement tested** | R-01 water temperature (reading present and plausible, resolution), R-05 housing leak sensing (sensing function only), clock keeps time on USB ([Requirements Test Matrix](../../docs/engineering/requirements-test-matrix.md)) |
| **Tracking issue** | [SCO-152](https://linear.app/scout1/issue/SCO-152), [SCO-60](https://linear.app/scout1/issue/SCO-60), [SCO-204](https://linear.app/scout1/issue/SCO-204), [SCO-259](https://linear.app/scout1/issue/SCO-259) |
| **Record kind** | Retroactive (source: test report [SCOUT-E-TR-001 Rev C](evidence/rr-25-2026-10-29/scout-e-tr-001-bench-test-report.html), written after the session from its screenshots and CSVs, and the [bench plan](../../docs/planning/isabella-bench-plan-2026-10-29.html)) |

**Question.** Does the soldered buoy controller stack (Feather M0 RFM95 + Adalogger) work, and
do the DS18B20 water-temperature probe, the SHT40 leak sensor and the PCF8523 clock each answer
on their interfaces and respond to a physical stimulus? Retires the risk that the first
electronics are dead on arrival or wired wrong before radio, storage and power testing.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Controller upload and serial output | Arduino IDE, `scout_t1_hello` | Uploads; output at 1 Hz; banner after reset | 11,020 B uploaded; 1 Hz; banner after reset | Pass |
| DS18B20 reading (°C) | `scout_t3_ds18b20`, 12-bit | 1 device; room ±1 °C; tracks warming and cooling; no dropouts | 22 °C room; rose to 27.25 °C and decayed smoothly; 0.0625 °C steps; 0 dropouts after the fix | Pass |
| SHT40 temperature and RH | `scout_t11_sht40` | Within 0.7 °C of the probe; RH steady ±1 %; clear step on breath; recovers to ±1 % | ΔT 0.39 °C; 33.6 % RH steady; 33 → 96 % on breath; recovered in 90 s | Pass |
| Both sensors together | `scout_t3b_temp_leak` | Both report every cycle; each stimulus moves only its own sensor | 35 cycles, no errors; probe +4.3 °C with the SHT40 unchanged; absolute humidity ×3.9 with the probe unaffected | Pass |
| PCF8523 clock | `scout_t4_rtc` | Found on I²C; counts 1 s; keeps time through reset | Set to 13:23:18, counted at 1 Hz, continued after reset | Pass (USB power only) |

**How and steps.** Feather M0 RFM95 (3178) stacked on the Adalogger (2922) with hand-soldered
headers; DS18B20 probe (381) on D12 with a 4.7 kΩ pull-up; SHT40 (4885) on I²C; laptop USB
power, indoor still air. Steps: (1) upload the hello sketch and reset; (2) probe sketch, touch
check, hand-warm the tip and log the cool-down; (3) SHT40 sketch, 1 min at rest, breath test;
(4) both sensors together, warm the probe then breathe on the SHT40; (5) clock sketch, reset.

**Result.** All five checks passed on USB, 1-Wire (D12) and I²C (0x44, 0x68). The probe read at
full 12-bit resolution (0.0625 °C steps) with a still-air time constant of about 150–170 s; the
SHT40 agreed with it within 0.39 °C and its humidity jumped from 33 % to 96 % on breath.

**Does not establish.**

- Absolute accuracy of either sensor: no reference was available (D-02); see [RR-26](rr-26-ds18b20-water-step-response-2026-11-03.md).
- Rail voltage or current draw (no multimeter, D-01); the clock on its coin cell or its drift.
- The flight firmware: these were bench sketches (D-03).

**Decision.** Good enough to move on to water, storage, radio and power tests. Next:
[RR-26](rr-26-ds18b20-water-step-response-2026-11-03.md) (probe in water), microSD (Test 5),
coin-cell backup and drift, current draw once a meter is available.

---

## Part A — Plan (write and date before the run)

_Retroactive record: the plan was the 2026-10-24 Bench Test Plan (Tests 1, 3, 3b, 4 and 11),
filed in the repo as the [2026-10-29 bench plan](../../docs/planning/isabella-bench-plan-2026-10-29.html).
This record is converted from TR-001; fields that source does not hold are marked `Not recorded`._

### A1. Purpose and risk retired
First powered check of the controller stack and its first two sensors, so that radio, storage
and power work starts from hardware known to work and known to be wired as drawn.

### A2. Hypothesis
If the stack and sensors are soldered and wired per the Electrical Block Diagram (2026-10-28),
then each device answers on its interface (USB serial, 1-Wire D12, I²C 0x44 and 0x68) and its
reading follows a hand-warming or breath stimulus, because these are the parts' rated interfaces
and behaviours.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Water temperature | °C | DS18B20 (381), 12-bit | 0.0625 °C | ±0.5 °C (datasheet) | Not calibrated |
| Bay temperature, RH | °C, % RH | SHT40 (4885), high precision, heater off | 0.01 °C, 0.01 % RH | ±0.2 °C, ±1.8 % RH (datasheet) | Not calibrated |
| Clock time | s | PCF8523 on the Adalogger | 1 s | Not measured | Not checked |
| Serial output | lines | Arduino IDE 2.3.10 Serial Monitor | n/a | n/a | n/a |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Stimulus: hand warmth on the probe; breath on the SHT40 | On or off |
| Held fixed (controlled) | Board stack, wiring, USB power, 3.3 V from the Feather regulator, indoor still air | ≈ 22.5 °C, ≈ 33.5 % RH |
| Measured (dependent) | Each sensor's reading over time | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Controller alive | Present | Uploads; 1 Hz serial; banner after reset | Board, bootloader and USB work | Bench plan Test 1 |
| M2 | Probe reading | Present, plausible | 1 device; room ±1 °C; follows warming and cooling; no dropouts | Spec temperature accuracy marginal ±1.0 °C | Bench plan Test 3; [project specs](../../docs/planning/project-specs-and-block-diagram-2026-11-01.md) #1 |
| M3 | Leak sensor | Plausible | Within 0.7 °C of the probe; RH steady ±1 %; clear step; recovers to ±1 % | Combined sensor tolerance; leak alarm needs a clear RH step | Bench plan Test 11; [SCO-204](https://linear.app/scout1/issue/SCO-204) |
| M4 | No cross-talk | Present | Both report every cycle; each stimulus moves only its own sensor | The two sensors share 3.3 V and run in one firmware loop | Bench plan Test 3b |
| M5 | Clock | Present | Found on I²C; counts 1 s; keeps time through reset | Every reading needs a timestamp | Bench plan Test 4 |

Locked on: 2026-10-24 (Bench Test Plan), per TR-001.

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | Electrical Block Diagram, 2026-10-28 (breadboard build) |
| Material and print settings | n/a |
| Configuration | Feather M0 RFM95 (3178) + Adalogger FeatherWing (2922) on hand-soldered stacking headers; DS18B20 probe (381) red → 3V3, blue → GND, yellow → D12, 4.7 kΩ to 3V3; SHT40 (4885) by STEMMA QT cable (4209) |
| Conditions | Indoor lab (Room 4020, ECEN Soldering Lab), still air, ≈ 22.5 °C, ≈ 33.5 % RH (from the sensors under test) |
| Sample size and replication | One stack, one probe, one SHT40; one run per test |
| Control / reference article | None |
| Reference instrument or standard | None: the probe and SHT40 were compared with each other only (D-02) |
| Expected values | 1 Hz serial; room ≈ 20–25 °C on both sensors; probe tip not warm after power-up |
| Before you start (go/no-go) | Wire with power off; after power-up touch the probe tip: warm means red and black swapped, unplug at once |
| Data path | USB serial at 115200 baud → Arduino IDE Serial Monitor → copied to CSV and screenshots |
| Stop and abort conditions | Probe warm to the touch; no device found |
| Safety | 3.3 V from USB only; no shock or battery hazard |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Probe red and black swapped | DS18B20 runs reversed, heats, can die in minutes | Tip warm to the touch | Unplug at once; wires labeled (spare ≈ $10) |
| Data wire on the wrong pin or no pull-up | No reading, nothing damaged | −127 °C / "NO PROBE" | Move the wire; check the 4.7 kΩ (happened: AR-01) |
| Cold solder joint on the headers | I²C devices or the clock missing | Device not found | Reflow; the clock answering also proves the headers |
| SHT40 heater left on | Dries the air it measures | RH falls on its own | Heater off in the sketch |

### A7. Procedure

**Prerequisites checklist.** Stacked boards, probe with spliced leads, SHT40 and cable, 4.7 kΩ
resistor, breadboard and jumpers, laptop with Arduino IDE 2.3.10, Adafruit SAMD 1.7.17, OneWire
2.3.8, DallasTemperature 4.0.6, Adafruit SHT4x 1.0.5, RTClib 2.1.4, and the
[bench sketches](bench-sketches/README.md).

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Upload `scout_t1_hello`, open the Serial Monitor, press reset | Sketch size, tick rate | 1 Hz ticks; banner after reset | ☑ |
| 2 | Wire the probe (power off), power up, touch the tip, upload `scout_t3_ds18b20` | Device count, room reading | 1 device, room ±1 °C, tip not warm | ☑ (after AR-01 fix) |
| 3 | Warm the tip by hand, release, log the cool-down | Readings | Rise, then smooth decay | ☑ |
| 4 | Connect the SHT40 (power off), upload `scout_t11_sht40`, log 1 min, then breathe on it | T, RH every 10 s | Steady, then a clear RH step and recovery | ☑ |
| 5 | Upload `scout_t3b_temp_leak`, warm the probe, then breathe on the SHT40 | Both sensors every ≈ 5.6 s | Each stimulus moves only its sensor | ☑ |
| 6 | Upload `scout_t4_rtc`, watch the count, press reset | Time | Counts 1 s; continues after reset | ☑ |

### A8. Analysis plan
Compare each reading with its A5 metric. Probe cool-down fitted to Newton cooling
T(t) = T∞ + (T0 − T∞)·e^(−t/τ) to estimate the still-air time constant. Absolute humidity from
the Magnus formula for the leak metric.

### A9. Curve required

| Curve | Axes and units | Standard or model compared against | Range to cover | Acceptance for the fit |
|---|---|---|---|---|
| Probe cool-down | °C vs s | Newton cooling | 27.25 → 25.06 °C | Smooth, no dropouts (τ reported, no pass mark) |
| SHT40 breath response | % RH vs s | None | Baseline → peak → baseline | Recovers to ±1 % |

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| Dr. Shoba Krishnan, Dr. Jes Kuczenski | Named as TR-001 reviewers; sent date Not recorded | Not recorded | None |

Open question carried forward: the SHT40 leak alarm threshold ([SCO-204](https://linear.app/scout1/issue/SCO-204)).

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | 2026-10-29, 12:15–13:30 |
| Operator | Isabella Rodriguez |
| Ambient conditions | Indoor still air, ≈ 22.5 °C, ≈ 33.5 % RH |
| Instrument serials / IDs | Not recorded (single prototype units) |

### B2. Raw data

| Time | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|
| ≈ 12:15 | Test 1 | 11,020 B (4 % of flash) uploaded; 1 Hz ticks; banner after reset; COM3 → COM5 after the first upload | — | [screenshot](evidence/rr-25-2026-10-29/screenshots/01-test1-upload-hello.png) |
| Not recorded | Test 3, first run | "NO PROBE (−127)" | 1 device | AR-01; [screenshot](evidence/rr-25-2026-10-29/screenshots/02-test3-no-probe-before-fix.png) |
| Not recorded | Test 3 | 22 °C room; warmed to ≥ 27.25 °C, fell to 25.06 °C over ≈ 91 s | — | [CSV](evidence/rr-25-2026-10-29/data/test3-ds18b20-cooldown.csv) |
| Not recorded | Test 11 | 22.82–22.86 °C, 33.55–33.58 % RH at rest; breath 33.4 → 96.1 % within 30 s | Probe 22.44 °C | [baseline](evidence/rr-25-2026-10-29/data/test11-sht40-baseline.csv), [breath](evidence/rr-25-2026-10-29/data/test11-sht40-breath.csv) |
| 13:08–13:23 (≈) | Test 3b | Probe 22.37 → 26.62 °C with the SHT40 at 22.7 °C, 33.7 %; absolute humidity 6.8 → 26.8 g/m³ | — | [CSV](evidence/rr-25-2026-10-29/data/test3b-temp-and-leak-together.csv) |
| 13:23:18 | Test 4 | Clock set (was stopped), counted at 1 Hz, continued after reset | Laptop local time | [screenshot](evidence/rr-25-2026-10-29/screenshots/07-test4-clock-running.png) |

### B3. Deviations

| Time | What differed from A7 | Why | Effect on validity |
|---|---|---|---|
| Test 3 | AR-01: probe not detected on the first run. A diagnostic sketch (`scout_t3_diag`) and a wiggle check traced it to a loose jumper-to-jumper junction on the yellow DQ line; re-seated, no dropouts in the next 69 readings | Loose breadboard junction | None after the fix; use a continuous or soldered wire in the final build |
| Throughout | D-03: bench sketches, not the flight firmware; clock set to local time, not UTC | Bring-up before firmware integration | Firmware behaviour not tested |

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 controller | 1 Hz, banner after reset | — | Pass |
| M2 probe | 1 device, 22 °C, smooth response, 0.0625 °C steps, 0 dropouts after the fix | Room check is plausibility only | Pass |
| M3 leak sensor | ΔT 0.39 °C; RH ±0.03 % at rest; +62.7 % step; recovered in 90 s | 0.31 °C inside 0.7 °C | Pass |
| M4 no cross-talk | 35 cycles; each stimulus moved only its own sensor | — | Pass |
| M5 clock | Counted at 1 Hz, kept time through reset | USB power only | Pass |

**Overall:** Pass. The stack and both sensors work as wired, alone and together; accuracy, power and the clock's battery backup remain untested.

### C2. Curve and analysis

The probe cool-down fits Newton cooling with T∞ = 22.0–22.4 °C and τ ≈ 150–170 s in still air
([chart](evidence/rr-25-2026-10-29/charts/c-cool.png)). At the 30-minute sample interval this
does not limit a water reading; in water τ is far shorter (12–13 s, RR-26). Absolute humidity
recovered faster than RH after the breath because the air was also cooling
([chart](evidence/rr-25-2026-10-29/charts/c-3b-ah.png)), which supports absolute humidity as the
leak metric ([SCO-204](https://linear.app/scout1/issue/SCO-204)).

### C3. Validity and limits

- **Sources of error:** no reference instrument; the two sensors checked only against each other; time axis of the cool-down estimated at 2.75 s per reading.
- **What this does establish:** every device answers on its interface and responds to a stimulus; 12-bit probe resolution; the stacking-header joints are good (the clock and SHT40 both answer on I²C).
- **What this does not establish:** absolute accuracy, rail voltage, current draw, coin-cell backup, clock drift, flight firmware behaviour.
- **Not recorded or shortcut taken:** exact times of Tests 3 and 11; instrument serials; advisor feedback on TR-001.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for bring-up; no design change needed |
| Design change driven by this test | Use a continuous or soldered DQ wire in the final build (AR-01) |
| Re-run needed? | No |
| Next test | [RR-26](rr-26-ds18b20-water-step-response-2026-11-03.md) probe in water; Test 5 microSD; coin-cell backup and drift; current draw (D-01) |
| Issues filed | None new; tracked on [SCO-152](https://linear.app/scout1/issue/SCO-152), [SCO-259](https://linear.app/scout1/issue/SCO-259), [SCO-204](https://linear.app/scout1/issue/SCO-204) |

### C5. Evidence and traceability

- Report: [SCOUT-E-TR-001 Rev C (HTML)](evidence/rr-25-2026-10-29/scout-e-tr-001-bench-test-report.html), [PDF](evidence/rr-25-2026-10-29/scout-e-tr-001-bench-test-report.pdf)
- Photos and screenshots: [`evidence/rr-25-2026-10-29/screenshots/`](evidence/rr-25-2026-10-29/screenshots/)
- Data: [`evidence/rr-25-2026-10-29/data/`](evidence/rr-25-2026-10-29/data/); charts: [`evidence/rr-25-2026-10-29/charts/`](evidence/rr-25-2026-10-29/charts/)
- Sketches: [`bench-sketches/`](bench-sketches/README.md)
- R-01, R-05 → this test → SCO-152, SCO-259; related: [RR-26](rr-26-ds18b20-water-step-response-2026-11-03.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](../../mechanical/test/risk-reduction-register.md).
