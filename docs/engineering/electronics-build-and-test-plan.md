# Electronics Build and Test Plan

> **Summary** — The staged plan for building and proving the S.C.O.U.T. electronics, from the
> first sensor reading on a laptop's USB to a prototype deployment. Each stage lists its goal,
> the parts it needs and when they are bought, and the benchmarks that count as "passed".
> Working plan as of **2026-10-06**: two Li-SOCl₂ D cells with firmware standby, an all-3.3 V
> prototype, and three follow-up orders placed only after the stage that justifies them.
> Electronics total ≈ **$440–550**.
>
> Owner: Isabella Rodriguez (ECEN). Power numbers: [Power Budget Update](power-budget-update-2026-10-05.md),
> [ADR-0007](../decisions/0007-primary-cell-power-source.md) (🟡 Open).

---

## System as of 2026-10-06

| Decision | Working choice | Why |
|---|---|---|
| Power source | **Two Saft LS33600 D cells in parallel**, no solar | Passes 12 months even on the pessimistic budget (≈ 14 months) without a power-off timer |
| Low-power mode | **Firmware standby** (SAMD21 sleeps, wakes on its internal RTC every 30 min) | No extra parts or wiring; the TPL5111 power-gate is dropped for the prototype |
| Rail | **Everything on 3.3 V** from the Feather's AP2112K regulator | No 5 V boost in the default build |
| Turbidity | **Seeed Grove Turbidity Sensor 101020752** (3.3 V / 5 V) | Runs on 3.3 V directly into A1, no divider. Output falls as turbidity rises, same direction as the SEN0189 and the analysis pipeline. MiniBoost 5 V kept only as a backup |
| Sensor switching | DS18B20 from a GPIO pin; turbidity behind a **DMG2305UX** P-MOSFET | DMG2305UX is 100 mΩ at V<sub>GS</sub> = −2.5 V and turns on at 0.9 V, so it switches fully from a 3.3 V pin |
| Hydrophone (later) | **3.5 mm plug-in-power** Aquarian version + 3.3 V preamp into the Feather's ADC | The XLR version needs 12–48 V phantom power; a 24-bit audio ADC is an upgrade only if clips are too noisy |
| Shore station | ESP32-S3 Feather + LoRa Radio FeatherWing ([SCO-86](https://linear.app/scout1/issue/SCO-86)) | Needed to receive and test the link from day one |

**Checked against the Feather M0 schematic (2026-10-06):** linear AP2112K-3.3 regulator fed
straight from VBAT; EN pulled up by 100k; VBAT divider 100k + 100k on D9/A7 (18 µA at 3.6 V);
MCP73831 charger at 100 mA via a 10k PROG resistor (must be removed before a primary cell goes
on BAT); radio on D3 (IRQ), D4 (RST), D8 (CS). One correction: with a power-off timer holding
EN low, EN's 100k pull-up adds 36 µA, so a gated floor is ≈ 55 µA, not 20 µA. This does not
affect the standby plan.

**Pins already used:** D3, D4, D8 + SPI (radio), D9/A7 (battery divider), D10 (SD), D13 (red
LED, keep off), SDA/SCL (RTC).

## Stage 1 — First readings (USB power)

**Goal:** the Feather runs, both sensors give believable readings, data saves to SD.

| Part | Source | Buy |
|---|---|---|
| Feather M0 RFM95 900 MHz (PID 3178) | Adafruit | Ordering 2026-10-06 |
| Adalogger FeatherWing (2922) + 128 MB microSD (5250) + stacking headers (2830) | Adafruit | Ordering 2026-10-06 |
| CR1220 coin cell (658-CR1220) | Mouser | Ordering 2026-10-06 |
| DS18B20 waterproof (381) | Adafruit | Ordering 2026-10-06 |
| Grove turbidity (713-101020752) + Grove to male jumper cable (713-110990210) | Mouser | Ordering 2026-10-06 |
| Breadboard, wire, 4.7k resistor, micro-USB data cable | Lab | On hand |

**Benchmarks**

- [ ] Temperature within **±0.5 °C** of a reference thermometer (DS18B20 spec)
- [ ] Turbidity: **clear water reads higher than turbid water**; 50 consecutive readings vary < ~1%
- [ ] SD card logs timestamped CSV rows; RTC keeps time across a power cycle

## Stage 2 — Measure power and confirm the budget

**Goal:** replace the estimates with measurements.

| Part | Source | Buy |
|---|---|---|
| Stage 1 setup | — | — |
| Current-limited bench supply (3.6 V) + multimeter with µA range | Lab | On hand |

**Benchmarks**

- [ ] 3.3 V rail = **3.3 V ±3%**
- [ ] **Sleep current ≤ 500 µA** — the number that decides battery life ([SCO-23](https://linear.app/scout1/issue/SCO-23))
- [ ] Turbidity current and settle time (target ≤ 1 s)
- [ ] Measured daily use ≈ **13–15 mAh/day** without the hydrophone

## Stage 3 — Sensor switching on and off

**Goal:** the turbidity sensor draws nothing while off.

| Part | Source | Buy |
|---|---|---|
| 2× DMG2305UX (621-DMG2305UX-7) + 2× SOT-23 adapter (SparkFun BOB-00717) | Mouser / SparkFun | Ordering 2026-10-06 |
| 100k resistor, 100 µF + 0.1 µF capacitors | Lab | On hand |
| MiniBoost 5 V (4654) — only if the Grove sensor needs 5 V | Adafruit | Ordering 2026-10-06 (backup) |

**Benchmarks**

- [ ] Off current of the switched sensor **< 1 µA**
- [ ] Readings after switch-on **match always-on readings**
- [ ] 3.3 V rail dip at switch-on < ~100 mV and **no MCU reset**

## Stage 4 — Data transmission (buoy → shore)

**Goal:** packets travel over LoRa and decode at the shore station.

| Part | Source | Buy |
|---|---|---|
| ESP32-S3 Feather (5477) + LoRa Radio FeatherWing (3231) + stacking headers | Adafruit | Ordering 2026-10-06 |
| 2× 915 MHz spring antenna (4269) | Adafruit | Ordering 2026-10-06 |
| USB-C data cable | Team | On hand (confirm) |

**Benchmarks**

- [ ] 30 B packets received with valid CRC, **< 1% loss** on the bench
- [ ] TX current **≤ 100 mA**; time on air ≈ **0.56 s**
- [ ] Outdoor line-of-sight range test with spring antennas, RSSI logged (aim ≥ 500 m)
- [ ] Never transmit without an antenna attached

## Stage 5 — Whole system under firmware control

**Goal:** the standby loop (wake → read → log → send → sleep) runs unattended.

**Benchmarks**

- [ ] **48 wakes and 3 transmissions in 24 h**, none missed
- [ ] Watchdog recovers from a forced hang
- [ ] D13 LED stays off; sensor pins re-asserted off every wake
- [ ] 24 h average current within budget (≈ **0.56 mA**)

## Stage 6 — Run on the batteries

**Goal:** two D cells, safely, with no possible charge path.

| Part | Source | Buy |
|---|---|---|
| 2× Saft LS33600 D cell **with solder tabs** | TME (~$22) / BatteryGuy ($35) / DigiKey | **Later order 1**, after Stage 2 |
| 2× ideal-diode IC (e.g. TI LM66100, to confirm) + PTC fuse + keyed connector | DigiKey / Mouser | Later order 1 |
| Remove the MCP73831 charger from the deployment Feather | Lab rework | — |

**Benchmarks**

- [ ] With USB connected, **0 µA flows into the battery** ([SCO-150](https://linear.app/scout1/issue/SCO-150))
- [ ] Battery **≥ 3.35 V during transmit**
- [ ] **7 days on battery**, measured use extrapolates to **≥ 12 months**

## Stage 7 — Hydrophone

**Goal:** record the scheduled clips and confirm their cost.

| Part | Source | Buy |
|---|---|---|
| Aquarian hydrophone, **3.5 mm plug-in-power** version | Aquarian Audio | **Later order 2**, after [SCO-8](https://linear.app/scout1/issue/SCO-8) |
| 3.3 V microphone preamp board | Adafruit / DigiKey | Later order 2 |
| 16–32 GB industrial microSD | DigiKey / Mouser | Later order 2 |

**Benchmarks**

- [ ] 1-min clips at **22.05 kHz** on schedule (midnight 5×, dusk 5×, weekly diel day)
- [ ] Recording current **≤ ~76 mA**
- [ ] Clips process cleanly through the acoustic pipeline; otherwise add a 24-bit audio ADC
- [ ] Battery budget re-run with the measured hydrophone draw

## Stage 8 — Sealed in the housing for days

**Goal:** the sealed buoy runs for 1–2 weeks.

| Part | Source | Buy |
|---|---|---|
| uFL connector + uFL-to-SMA bulkhead + 915 MHz whip (**≤ 2.15 dBi**, FCC grant limit) | Adafruit / DigiKey | **Later order 3**, once the lid design is set |
| Internal temp/humidity sensor ([SCO-60](https://linear.app/scout1/issue/SCO-60), e.g. SHT40) | Adafruit | Later order 3 |
| Conformal coating, desiccant | DigiKey / lab | Later order 3 |
| Cable glands | Lab stock | On hand |

**Benchmarks**

- [ ] **7–14 days sealed**, ≥ 95% of packets received, no resets
- [ ] Internal humidity low and not rising
- [ ] Range test with the real antenna at buoy height over water

## Stage 9 — Prototype deployment

**Goal:** it works in real water before Hawaii ([SCO-143](https://linear.app/scout1/issue/SCO-143)).

| Part | Source | Buy |
|---|---|---|
| Spares: Feather M0, DS18B20, turbidity sensor, microSD, antenna | Adafruit / Mouser | Optional, before deployment (~$70) |

**Benchmarks**

- [ ] Data arrives daily for the whole test (2–4 weeks)
- [ ] Temperature matches a reference logger
- [ ] No leaks; battery use on track for 12 months

## Buying schedule

| When | Order | ≈ Cost |
|---|---|---|
| 2026-10-06 | Adafruit: 3178, 2922, 2830 ×2, 381, 4654, 5250, 4269 ×2, 5477, 3231 | $103.60 |
| 2026-10-06 | Mouser: 713-101020752, 713-110990210, 658-CR1220, 621-DMG2305UX-7 ×2 (+ SparkFun BOB-00717 ×2) | ~$28 |
| After Stage 2 | Later 1: D cells + battery protection | $60–100 |
| After SCO-8 | Later 2: hydrophone + preamp + larger microSD | $220–270 |
| Lid design set | Later 3: antenna kit + humidity sensor + coating | $30–50 |
| Before deployment | Spares (optional) | ~$70 |
| **Electronics total** | | **≈ $440–550** (≈ $510–620 with spares) |

**Not bought, and why:** TPL5111 power-off timer (standby + two cells is enough); DFRobot
SEN0189 (Grove 3.3 V sensor replaces it); PKCELL LiPo, PID 6106 charger and solar panel
(superseded by the primary-cell plan); Feather M0 Adalogger 2796 (duplicate MCU).

## References

- Adafruit Feather M0 RFM9x schematic (rev B) — regulator, EN pull-up, divider, charger, radio pins
- [Seeed Grove Turbidity Sensor V1.0](https://wiki.seeedstudio.com/Grove-Turbidity-Sensor-Meter-for-Arduino-V1.0/) — 3.3 V/5 V, output decreases with turbidity
- [Diodes Inc. DMG2305UX](https://www.mouser.co.uk/ProductDetail/621-DMG2305UX-7) — 52 mΩ @ −4.5 V, 100 mΩ @ −2.5 V
- [TI PCM1808](https://www.ti.com/lit/gpn/pcm1808) — 5 V analog supply, why it is not the default audio path
- Saft LS33600 retail: [TME](https://www.tme.com/in/en/details/saft-ls33600/batteries/saft/ls-33600/), [BatteryGuy](https://batteryguy.com/ls33600-lithium-battery-3-6v-17000mah-ls33600-ba.html)
