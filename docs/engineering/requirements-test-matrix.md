# Requirements Test Matrix

> **Summary** — One table that answers the advisors' 2026-10-21 ask
> ([SCO-221](https://linear.app/scout1/issue/SCO-221)): for every core requirement, the parameter
> measured, the success metric, the test method, the curve that proves it, and the Linear issue
> that tracks it. Pass marks come from the
> [Layered Test Protocol](layered-test-protocol.md), the
> [Electronics Build and Test Plan](electronics-build-and-test-plan.md) and the
> [risk-reduction register](../../mechanical/test/risk-reduction-register.md). Each row rolls up
> the one-page summaries of its test records ([template](test-record-template.md)).
>
> Part of [`docs/engineering/`](.). **Draft 2026-10-30.** The pass marks are the current
> provisional ones (see [Gaps](#gaps-and-conflicts)); a row with no numeric mark is a gap, not a pass.

---

## How to read it

- **Status** is the state of the verdict: *Pass*, *Fail*, *Partial*, *Not run* (planned, no result),
  or *Gap* (no numeric pass mark yet).
- **Curve** names the curve the test must show. *Calibration* is the reading against a known
  standard; *validation* is a model against a measurement. `None` means a pass/fail test.
- **Record** is the `RR-NN` test record in [`mechanical/test/`](../../mechanical/test/README.md),
  or the plan stage for electronics tests that have no record yet.
- Electronics rows follow the stage numbers in the
  [Electronics Build and Test Plan](electronics-build-and-test-plan.md).

## Sensing (Isabella, with David for the firmware side)

| # | Requirement | Parameter (instrument) | Pass mark (source) | Method and record | Curve | Issue | Status |
|---|---|---|---|---|---|---|---|
| R-01 | Measure water temperature | Temperature vs a digital reference thermometer | Within ±0.5 °C (DS18B20 spec) | Hot water cooling to room temperature, logged over time, spot-checked against the reference; protocol in progress | Calibration: sensor vs reference over the cooling range | [SCO-258](https://linear.app/scout1/issue/SCO-258), [SCO-259](https://linear.app/scout1/issue/SCO-259) | Not run |
| R-02 | Temperature holds up in the field | Temperature vs a reference logger, 2 to 4 weeks | Matches the reference logger; no leaks | Prototype deployment (stage 14 / Plan stage 9) | Validation: field series vs logger | [SCO-143](https://linear.app/scout1/issue/SCO-143), [SCO-195](https://linear.app/scout1/issue/SCO-195) | Not run |
| R-03 | Detect turbidity | Analog count vs water of known turbidity | Clear reads higher than turbid; 50 readings vary < ~1% (Plan stage 1). **No accuracy number** | Dilution series, bench | Calibration: count vs known turbidity standard | [SCO-157](https://linear.app/scout1/issue/SCO-157), [SCO-25](https://linear.app/scout1/issue/SCO-25) | Gap |
| R-04 | Turbidity sensor switches cleanly | Settle time after switch-on | ≤ 1 s; readings match always-on | Plan stage 2 and 3, bench | None | [SCO-157](https://linear.app/scout1/issue/SCO-157) | Not run |
| R-05 | Warn of a leak inside the housing | Internal humidity (SHT40) | Stable and not rising for 4+ weeks. **Alert threshold 70 %RH is a placeholder** | Sealed soak (stage 10) | Calibration: SHT40 vs a reference humidity | [SCO-204](https://linear.app/scout1/issue/SCO-204), [SCO-180](https://linear.app/scout1/issue/SCO-180) | Gap |
| R-06 | Record underwater sound | 1-min clips at 22.05 kHz, sample count, tone frequency, current | 1,323,000 samples per clip, none dropped; test tone correct; recording ≤ ~76 mA (Plan stage 7). **No noise-floor or frequency-response number** | Bench after the hydrophone arrives | Calibration: response vs a test tone sweep | [SCO-158](https://linear.app/scout1/issue/SCO-158) | Gap |

## Power, firmware and radio (Isabella and David)

| # | Requirement | Parameter (instrument) | Pass mark (source) | Method and record | Curve | Issue | Status |
|---|---|---|---|---|---|---|---|
| R-07 | Stable supply | 3.3 V rail | 3.3 V ±3% (Plan stage 2) | Meter, bench | None | [SCO-157](https://linear.app/scout1/issue/SCO-157) | Not run |
| R-08 | Ultra-low sleep and clean switching | Sleep current; switched-sensor off current; rail dip | Sleep ≤ 500 µA; off < 1 µA; dip < ~100 mV, no reset (Plan stages 2, 3) | Current measurements, bench | None | [SCO-157](https://linear.app/scout1/issue/SCO-157), [SCO-23](https://linear.app/scout1/issue/SCO-23) | Not run |
| R-09 | 1+ year on the battery | Daily energy; battery voltage at transmit; charge leakage | ≈ 0.56 mA 24 h average; ≥ 3.35 V at TX; 0 µA into the battery on USB; 7 days on cells extrapolates to ≥ 12 months (Plan stages 5, 6) | Run on cells, bench | Validation: measured current vs the power budget | [SCO-160](https://linear.app/scout1/issue/SCO-160), [SCO-150](https://linear.app/scout1/issue/SCO-150) | Not run |
| R-10 | Run autonomously and recover | Wakes, transmissions, resets | 48 wakes and 3 transmissions in 24 h, none missed; watchdog recovers; SD log and RTC survive a power cycle (Plan stages 1, 5) | Firmware loop, bench | None | [SCO-160](https://linear.app/scout1/issue/SCO-160) | Not run |
| R-11 | Link to shore | Packet loss, TX current, range | 44 B packets with valid CRC, < 1% loss; TX ≤ 100 mA; outdoor range ≥ 500 m (Plan stage 4) | Bench, then outdoor line of sight | Range: RSSI against distance | [SCO-24](https://linear.app/scout1/issue/SCO-24) | Not run |

## Mechanical (John)

| # | Requirement | Parameter (instrument) | Pass mark (source) | Method and record | Curve | Issue | Status |
|---|---|---|---|---|---|---|---|
| R-12 | Housing and pod stay dry (salt water) | Water inside the sealed article | Dry paper towel after 24 h at ≥ 0.3 m in ~35 ppt, then 1 week (Protocol stage 5) | Coupon and article soaks: RR-03, RR-07, RR-12, RR-14, RR-15, RR-16, RR-18, RR-19, RR-23 (planned) | None | [SCO-108](https://linear.app/scout1/issue/SCO-108), [SCO-91](https://linear.app/scout1/issue/SCO-91) | Partial |
| R-13 | Housing survives depth | Dry after pressure | Dry at ≥ 8 m equivalent (~0.8 bar) for 24 h (Protocol stage 8) | Pressure test of sealed housings | None | [SCO-177](https://linear.app/scout1/issue/SCO-177) | Not run |
| R-14 | Cap seals and glands stay dry | Seal at the lid, gland seats, antenna feed-through | Lid seals; feed-through dry (Protocol stage 9); gland fit coupon: PG11 seats and nut engages | RR-22 (cap assembly and gland fit, partial); RR-23 (cap and gland seal tests, planned) | None | [SCO-162](https://linear.app/scout1/issue/SCO-162), [SCO-270](https://linear.app/scout1/issue/SCO-270), [SCO-293](https://linear.app/scout1/issue/SCO-293), [SCO-294](https://linear.app/scout1/issue/SCO-294) | Not run |
| R-15 | Structure carries the loads | Safety factor, FEA | SF ≥ 4 (register); v5 re-check SF ~3.5 | RR-01, RR-04, RR-05, RR-09, RR-20 | Validation: none yet (no physical load test; proof load cancelled) | [SCO-73](https://linear.app/scout1/issue/SCO-73) | Pass (analysis only) |
| R-16 | Flotation ring does not buckle | Buckling factor | SF ≥ 2; foam-backed ring SF 3 to 5 | RR-06, RR-09 | None | [SCO-81](https://linear.app/scout1/issue/SCO-81) | Pass (analysis only) |
| R-17 | Floats at the modelled waterline | Freeboard in a bin and in the ocean | Within ±0.5 in of the model; waterline shift logged at ~35 ppt | RR-17 (dry float, partial); RR-21 (salt vs seawater, planned); salt bin and ocean to run | Validation: model vs measured freeboard | [SCO-171](https://linear.app/scout1/issue/SCO-171), [SCO-172](https://linear.app/scout1/issue/SCO-172), [SCO-183](https://linear.app/scout1/issue/SCO-183) | Partial |
| R-18 | Rights itself from any angle | Righting from 90° and 180° | Rights itself unaided (Protocol stage 7) | RR-11 (calculation), physical tilt test owed | Validation: righting-arm (GZ) curve vs tilt test | [SCO-171](https://linear.app/scout1/issue/SCO-171), [SCO-82](https://linear.app/scout1/issue/SCO-82) | Partial |
| R-19 | Survives impact and handling | Cracks after a drop | No cracks; height, surface, orientation recorded (Protocol stage 6) | RR-10 (1 sample, height not recorded) | None | [SCO-173](https://linear.app/scout1/issue/SCO-173) | Partial |
| R-20 | Biofouling does not blind the sensors | Fouling on sensor faces | **None written** | Coating choice in progress | Calibration: drift of the reading over the soak | [SCO-246](https://linear.app/scout1/issue/SCO-246) | Gap |

## System and field (all three)

| # | Requirement | Parameter (instrument) | Pass mark (source) | Method and record | Curve | Issue | Status |
|---|---|---|---|---|---|---|---|
| R-21 | Long sealed run | Humidity, packets, resets, 4+ weeks | Humidity stable; ≥ 95% of packets received; no resets (Protocol stage 10) | Sealed soak | None | [SCO-180](https://linear.app/scout1/issue/SCO-180), [SCO-161](https://linear.app/scout1/issue/SCO-161) | Not run |
| R-22 | Integrated MVP works | Electronics in the floating buoy, sensors, packet at shore | Sensors reading and a packet received at the shore (Protocol stage 11) | Integrated bench test | None | [SCO-182](https://linear.app/scout1/issue/SCO-182) | Not run |
| R-23 | Real-ocean flotation | Waterline, righting, leaks in open water | Floats at the modelled waterline; self-rights; no leaks (Protocol stage 12) | Open-water run | Validation: model vs measured | [SCO-183](https://linear.app/scout1/issue/SCO-183), [SCO-184](https://linear.app/scout1/issue/SCO-184) | Not run |
| R-24 | Hawaii deployment | Data, leaks, battery over the deployment | Per the permit route chosen (Protocol stage 15) | Live deployment | Validation: temperature vs a reference | [SCO-185](https://linear.app/scout1/issue/SCO-185), [SCO-164](https://linear.app/scout1/issue/SCO-164) | Not run |

## Software, firmware and console (David; automated)

These suites run in CI on every PR ([`ci.yml`](../../.github/workflows/ci.yml)); the last run on
`main` (2026-10-29, `02588ac`) passed. About 470 test functions across them. A suite is a
pass/fail test with no curve; a failing suite blocks the merge. They test the code, not the
hardware, so the bench rows above still need the physical test.

| # | Requirement | Parameter | Pass mark | Suite and method | Curve | Issue | Status |
|---|---|---|---|---|---|---|---|
| S-01 | Packet format is identical on buoy and shore | Packet bytes and CRC, firmware vs shore encoder | Firmware golden bytes equal the shore encoder's; round-trip decodes | `firmware/test/test_packet`, `shore/tests`, `scripts/check_packet_contract.py` | None | [SCO-40](https://linear.app/scout1/issue/SCO-40) | Pass in CI |
| S-02 | Duty cycle, scheduling and recovery logic | Wake and transmit slots, clock set, upload queue, dedupe | Suite passes: 3 TX slots a day, clock and queue behave | `firmware/test/test_scheduler`, `test_timeset`, `test_shore_clock`, `test_upload_queue`, `test_dedupe` | None | [SCO-165](https://linear.app/scout1/issue/SCO-165), [SCO-160](https://linear.app/scout1/issue/SCO-160) | Pass in CI; the 24 h bench run is R-10 |
| S-03 | Link, downlink and console commands | Radio framing, downlink, console protocol | Suite passes | `firmware/test/test_link`, `test_downlink`, `test_console`; `shore/tests` loopback and serial link | None | [SCO-24](https://linear.app/scout1/issue/SCO-24) | Pass in CI; real range is R-11 |
| S-04 | Capture, acoustic summary and humidity code | Audio capture, summary values, SHT40 handling | Suite passes; summary matches the reference implementation | `firmware/test/test_capture`, `test_acoustic`, `test_sht4x`; `utils/tests`; `shore/tests` acoustic schema | None | [SCO-205](https://linear.app/scout1/issue/SCO-205), [SCO-231](https://linear.app/scout1/issue/SCO-231) | Pass in CI; hardware test is R-05, R-06 |
| S-05 | Telemetry pipeline: QC, DHW, alerts, trends | Quality flags, Degree Heating Weeks, alert levels, drift screen | Suite passes | `analytics/telemetry/tests` (QC, bleaching, alert scale, trends, turbidity, fleet, humidity) | None | [SCO-31](https://linear.app/scout1/issue/SCO-31), [SCO-212](https://linear.app/scout1/issue/SCO-212) | Pass in CI |
| S-06 | Console, dashboard and site | Auth, fleet view, security, build, lint | Suite, lint and build pass | `console/test`, the front-end tests and build | None | [SCO-238](https://linear.app/scout1/issue/SCO-238) | Pass in CI |

## Adding a test

Every new test adds a row here **and** a row in the
[risk-reduction register](../../mechanical/test/risk-reduction-register.md), in the same PR as its
[test record](test-record-template.md). Pick the section by discipline: mechanical, electronics,
or software. A requirement with no row is a gap. A bench or field test of software or electronics
that is not a CI suite gets an `RR-NN` record like any other.

## Gaps and conflicts

Gaps are rows with no numeric pass mark. Each has an issue
([SCO-221](https://linear.app/scout1/issue/SCO-221) asks for gaps to be filed).

| Gap | Rows | What is missing | Issue |
|---|---|---|---|
| G1 | R-03 | Turbidity has an ordering and a repeatability mark but no accuracy number or calibration standard | [SCO-271](https://linear.app/scout1/issue/SCO-271) |
| G2 | R-05 | Humidity alert threshold (70 %RH) is a placeholder; no calibration curve | [SCO-204](https://linear.app/scout1/issue/SCO-204) |
| G3 | R-06 | Hydrophone noise floor and frequency response have no numbers | [SCO-272](https://linear.app/scout1/issue/SCO-272) |
| G4 | R-20 | Biofouling has no test or metric | [SCO-273](https://linear.app/scout1/issue/SCO-273) |
| G5 | R-15 | No physical load test behind the FEA | [SCO-274](https://linear.app/scout1/issue/SCO-274) |

Conflicts found while building the table (recorded, not reconciled, per
[Standing rule 1](../../CLAUDE.md)):

1. **Pressure depth.** The Layered Protocol tests to ≥ 8 m equivalent (stage 8), EDD §2 says a
   5 m water-equivalent target, and the deployment depth is 2 to 8 m
   ([facts](../hub/facts.md)). One number needs choosing.
2. **EDD §21 has no numeric marks,** though [SCO-139](https://linear.app/scout1/issue/SCO-139)
   is marked Done. The numbers live in the plan and the protocol; they still need writing
   into EDD §21.
3. **EDD §2 is stale.** It says one transmission and six measurements a day and LiFePO₄ with
   solar, while the facts say three transmission slots a day, a ~30 min sample cycle and
   battery-only primary cells.
4. **Self-righting row (R-18).** RR-11 passed for the v6 ballast-arm design; the Hub now says
   no ballast ([SCO-136](https://linear.app/scout1/issue/SCO-136) cancelled 2026-10-16). The
   calculator has to be re-run for the current design before R-18 can read Pass.
5. **Structural safety factor.** The register says minimum SF 10 to 1450 for the mooring FEA;
   the tracker says 30 to 1450.
