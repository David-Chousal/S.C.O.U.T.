# Water-Temperature Probe — Ice-Point Re-Run in Water, 2026-11-04

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-28 · Partial (logging, resolution, steadiness and response time pass; ice point still inconclusive) |
| **Date, duration, who** | 2026-11-04, 13:05–13:17 PST (logging 12.1 min), Isabella Rodriguez, run as a live demo during a team meeting |
| **Requirement tested** | R-01 water temperature ([Requirements Test Matrix](../../docs/engineering/requirements-test-matrix.md)): wet logging, resolution, steadiness, response time; accuracy at 0 °C re-attempted after [RR-26](rr-26-ds18b20-water-step-response-2026-11-03.md) |
| **Tracking issue** | [SCO-259](https://linear.app/scout1/issue/SCO-259), [SCO-258](https://linear.app/scout1/issue/SCO-258) |
| **Record kind** | Prospective, with gaps: the ice-point pass mark was set in RR-26 §C4 and committed on 2026-11-03, before this run; the step order and bath preparation were not written down beforehand (B3). Filed from the CSV only |

**Question.** Re-run of RR-26 with event marks typed: does the DS18B20 read 0.0 ± 0.5 °C in an
ice bath, and do RR-26's wet logging and τ ≈ 12–13 s repeat?

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Readings and dropouts | `scout_t3c_water` at 1 Hz, logged by the bench page | One reading per second; 0 dropouts | 726 readings over 725 s; 0 dropouts; PC gaps 0.992–1.006 s | Pass |
| Resolution (°C) | Same | Every reading on a 0.0625 °C step | 726 of 726 | Pass |
| Still-bath steadiness (°C) | Same | Span ≤ 2 steps (0.125 °C) in a settled bath | Ice cup 250–310 s: 1.31–1.38 °C, span 0.0625; warm cup 612–654 s: span 0.0625 | Pass |
| Step response τ (s) | 63.2 % time from immersion | No pass mark (RR-26 measured 11.6–13.2 s) | Cooling into ice 14.4 s; heating into warm water 13.7 s | Measured |
| Ice point (°C) | Probe in an ice cup | 0.0 ± 0.5 °C (DS18B20 datasheet) | Lowest settled ≈ 1.35 °C (min 1.3125 at 259 s), then drifted up to 1.56 °C by 528 s | Inconclusive |

**How and steps.** Same stack, probe, sketch and bench page as RR-26; laptop USB power.
Marks typed in the page: `air` at 6 s, `ice` at 145 s, `hot` at 535 s. From the trace: probe
in air, an unmarked warm bump at 38–57 s, back in air, into the ice cup at ≈ 139.5 s, into a
warm cup at ≈ 529.5 s, logging stopped at 725 s.

**Result.** Logging, resolution and steadiness repeat RR-26 exactly, and τ came out 13.7–14.4 s,
close to RR-26's 11.6–13.2 s. The ice cup bottomed out at about 1.35 °C, closer to 0 °C than
RR-26's 3.0 °C, but it then warmed by 0.25 °C over 4.5 minutes. A bath with ice still in
it holds at 0 °C, so the drift says the cup was not an ice-water bath at equilibrium. The
1.35 °C cannot be split into bath error and probe offset without a reference thermometer.

**Does not establish.**

- Absolute accuracy: no reference thermometer; the bath's own temperature is unknown.
- Salt water, depth, or the flight firmware's 30-minute cycle.

**Decision.** Keep SCO-259 open. Next run: a cup packed full of crushed ice with just enough cold
water to fill the gaps, stirred, with ice visible at the end, and a reference thermometer in the
same cup. Pass stays 0.0 ± 0.5 °C.

---

## Part A — Plan (write and date before the run)

_The plan below is RR-26 §C4's re-run decision (committed 2026-11-03 in `bd3f252`, before this
run). The step order on the day was chosen live during the demo and is logged in B3._

### A1. Purpose and risk retired
RR-26 left R-01's accuracy unchecked because its ice cup never reached 0 °C. This run re-tries
the ice point and repeats the wet logging and response-time checks with event marks typed.

### A2. Hypothesis
If the probe tip sits in an ice-water bath at equilibrium, then it reads 0.0 ± 0.5 °C, because
that is the DS18B20's rated accuracy and an ice-water mix holds at 0 °C; and its τ in water
repeats RR-26's 12–13 s.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Water temperature | °C | DS18B20 (381), 12-bit, 1 Hz | 0.0625 °C | ±0.5 °C (datasheet, −10 to 85 °C) | Not calibrated; ice point re-attempted here |
| Time | s | Sketch timer; PC timestamp on each line | 0.1 s (sketch), 1 ms (PC) | PC gaps 0.992–1.006 s | Checked against the PC in this run |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Bath the tip is in | Air, ice cup, warm water |
| Held fixed (controlled) | Probe, stack, wiring, sketch, USB power, immersion (steel tip only) | Same as RR-26 |
| Measured (dependent) | Probe temperature vs time | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Logging chain wet | Present | One reading per second; 0 dropouts | A dropout is a lost sample at sea | RR-25 M2, RR-26 M1 |
| M2 | Resolution | Plausible | Every reading on a 0.0625 °C step | 12-bit mode | DS18B20 datasheet |
| M3 | Steadiness | Plausible | Span ≤ 2 steps (0.125 °C) in a settled bath | RR-26 M3 | RR-26 |
| M4 | Response time τ | Other | Measured; no pass mark; compare with RR-26 | Repeatability of RR-26 | RR-26 M4 |
| M5 | Ice point | Accurate vs reference | 0.0 ± 0.5 °C in a packed, stirred ice bath | Rated accuracy; ice point is a free 0 °C standard | DS18B20 datasheet; RR-26 §C4; [SCO-259](https://linear.app/scout1/issue/SCO-259) |

Locked on: 2026-11-03 (RR-26 §C4, committed before this run).

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | Breadboard build as RR-25/RR-26; sketch [`scout_t3c_water`](bench-sketches/scout_t3c_water/scout_t3c_water.ino) |
| Material and print settings | n/a |
| Configuration | Probe red → 3V3, blue → GND, yellow → D12, 4.7 kΩ pull-up; splice and breadboard kept dry |
| Conditions | Tap water in cups; room ≈ 22.7 °C (probe in air at start) |
| Sample size and replication | One probe; one step of each kind (second wet run after RR-26) |
| Control / reference article | None |
| Reference instrument or standard | Ice point (0 °C) only; no reference thermometer |
| Expected values | Air ≈ room temperature; ice bath 0.0 ± 0.5 °C; τ ≈ 12–13 s |
| Before you start (go/no-go) | Only the steel tip in water; splice out of the water; cups away from the board and laptop |
| Data path | USB 115200 baud → [`live-temp-monitor.html`](tools/live-temp-monitor.html) in Edge (Web Serial) → Download CSV |
| Stop and abort conditions | Water near the splice, breadboard or laptop; reading −127 or NaN repeatedly |
| Safety | 3.3 V from USB; warm tap water only |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Splice or jumpers get wet | Shorts or corrodes the data line | NaN in the CSV; wet joint | Keep only the steel tip in water |
| Spill reaches the board or laptop | Damage | Visible | Cups away from the electronics |
| Ice cup not packed or ice melts out | Bath above 0 °C; ice point meaningless | Reading settles above 0.5 °C or drifts up | Pack with crushed ice, stir, check ice remains (happened: D-02) |
| Marks typed late | Event times off by a few seconds | Mark after the visible step in the trace | Use the trace for timing (D-03) |

### A7. Procedure

**Prerequisites checklist.** Stack and probe as RR-26; `scout_t3c_water` uploaded; Edge with the
bench page; cups; tap water, ice.

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Probe in air; mark `air` | Readings | Room temperature, steady | ☑ (mark at 6 s) |
| 2 | Into a packed, stirred ice bath, ≥ 4 min; mark `ice` | Readings; ice left at the end | Settles at 0.0 ± 0.5 °C | ☑ 6.5 min; bath not confirmed packed (D-02) |
| 3 | Into warm water; mark `hot` | Readings | Fast rise, settles | ☑ 3.3 min (mark at 535 s) |
| 4 | Download CSV | File | — | ☑ |

### A8. Analysis plan
τ is the time from immersion to 63.2 % of the step, by linear interpolation between readings.
Immersion time is taken from the trace (the last reading before the step), since marks lag.
Steadiness is max − min over a settled window. Ice point is the lowest settled one-minute
mean in the ice cup, compared with 0.0 ± 0.5 °C.

### A9. Curve required

| Curve | Axes and units | Standard or model compared against | Range to cover | Acceptance for the fit |
|---|---|---|---|---|
| Step response | °C vs s | First-order step T(t) = T∞ + (T0 − T∞)·e^(−t/τ) | Air → ice, ice → warm | τ reported; compared with RR-26 |
| Ice-point check | °C | 0 °C ice point | One point | 0.0 ± 0.5 °C |

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| Team meeting (live demo) | 2026-11-04, during the run | Not recorded | None |

Open question: a reference thermometer for the R-01 spot check ([SCO-259](https://linear.app/scout1/issue/SCO-259)). Owner Isabella.

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | 2026-11-04, 21:05:22–21:17:27 UTC (13:05–13:17 PST) |
| Operator | Isabella Rodriguez |
| Ambient conditions | Indoors, ≈ 22.7 °C (probe in air); location Not recorded |
| Instrument serials / IDs | Not recorded (single prototype units) |

### B2. Raw data

Full data: [`test3c-water-steps-2026-11-04.csv`](evidence/rr-28-2026-11-04/data/test3c-water-steps-2026-11-04.csv)
(726 rows, unedited). Times below are from the trace; typed marks are shown where they fell.

| Time (s) | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|
| 0–36 | Air | 22.69 °C mean, drifting 22.88 → 22.56 | — | Mark `air` at 6 s |
| 38–57 | Unmarked | Rise to 24.19 °C at 57 s, then a slow fall | — | Cause not recorded (D-01) |
| 57–139 | Air | Falls back to 22.69 °C | — | |
| ≈ 139.5 | Into ice cup | Sharp fall; 9.2 °C at ≈ 153.9 s | 0 °C | Mark `ice` at 145 s |
| 250–310 | Ice cup | 1.31–1.38 °C, span 0.0625, mean ≈ 1.35 | 0 °C | Lowest settled window; min 1.3125 at 259 s |
| 310–528 | Ice cup | Drifts up to 1.50–1.56 °C | 0 °C | Bath warming (D-02) |
| ≈ 529.5 | Into warm water | Sharp rise; 21.7 °C at ≈ 543.2 s | — | Mark `hot` at 535 s |
| 612–654 | Warm cup | 33.38–33.44 °C, span 0.0625 | — | Peak 33.44 °C from 626 s |
| 654–725 | Warm cup | Slow fall to 33.13 °C | — | Water cooling; end of run |

### B3. Deviations

| Time | What differed from A7 | Why | Effect on validity |
|---|---|---|---|
| 38–57 s | D-01: an unmarked warm bump (+1.6 °C) before the ice step | Not recorded (live demo) | None on the metrics; the ice step starts from 22.69 °C in air |
| Ice cup | D-02: bath not confirmed packed or stirred, no reference; reading drifted up 0.25 °C | Demo set-up | M5 condition not met: inconclusive |
| Ice and warm steps | D-03: marks typed 5.5 s after each step | Typed by hand | Event times taken from the trace (±0.5 s) |
| Whole run | D-04: no reference thermometer | None available | Accuracy not checked |

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 logging chain | 726 readings / 725 s; 0 dropouts; PC gaps 0.992–1.006 s | — | Pass |
| M2 resolution | 726 of 726 on 0.0625 °C steps | — | Pass |
| M3 steadiness | Ice 0.0625 °C span; warm 0.0625 °C span | 1 step under | Pass |
| M4 τ | Cooling 14.4 s; heating 13.7 s | RR-26: 11.6–13.2 s | Measured |
| M5 ice point | ≈ 1.35 °C, then drifting up; bath not shown to be at 0 °C | — | Not measured (inconclusive) |

**Overall:** Partial. RR-26's wet-operation results repeat; the ice point needs a proper bath and a reference thermometer.

### C2. Curve and analysis

Cooling step from 22.69 °C at ≈ 139.5 s toward the ≈ 1.35 °C plateau: 63.2 % is 9.20 °C,
reached at ≈ 153.9 s, so τ ≈ 14.4 s. Heating step from 1.56 °C at ≈ 529.5 s toward the 33.4 °C
plateau: 63.2 % is 21.7 °C, reached at ≈ 543.2 s, so τ ≈ 13.7 s. Both are within about 2 s of
RR-26 and far below the 30-minute sample interval. The plateau values used as T∞ are the
settled readings, so τ carries the same small uncertainty as the plateau (a few tenths of a
second). The ice cup's upward drift after 310 s is what a bath losing its ice does; a probe
offset would sit still, so the drift points at the bath. No chart was made for this record;
the CSV plots directly.

### C3. Validity and limits

- **Sources of error:** bath temperature unknown; marks lag the steps by ≈ 5.5 s (timing taken from the trace); single run; tap water, not seawater.
- **What this does establish:** a second run of wet logging with 0 dropouts and full resolution; τ ≈ 14 s in water, repeatable with RR-26.
- **What this does not establish:** absolute accuracy at any temperature; behaviour in salt water or under pressure.
- **Not recorded or shortcut taken:** location; how the ice cup was made; cause of the 38–57 s bump; no photo.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for wet operation and response time; no for accuracy |
| Design change driven by this test | None |
| Re-run needed? | Yes: packed, stirred crushed-ice bath with ice visible at the end, plus a reference thermometer in the same cup |
| Next test | Ice-point and reference re-run for R-01 ([SCO-259](https://linear.app/scout1/issue/SCO-259)) |
| Issues filed | None new |

### C5. Evidence and traceability

- Data: [`test3c-water-steps-2026-11-04.csv`](evidence/rr-28-2026-11-04/data/test3c-water-steps-2026-11-04.csv)
- Tools: [`scout_t3c_water`](bench-sketches/scout_t3c_water/scout_t3c_water.ino), [`live-temp-monitor.html`](tools/live-temp-monitor.html)
- R-01 → this test → [SCO-259](https://linear.app/scout1/issue/SCO-259); follows [RR-26](rr-26-ds18b20-water-step-response-2026-11-03.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](../../mechanical/test/risk-reduction-register.md).
