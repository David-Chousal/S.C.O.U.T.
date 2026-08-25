# Hardware — Electrical Design

Schematics, PCB layout, wiring diagrams, and electrical test records for the SCOUT buoy.

> **Status:** Build platform and BOM confirmed (below). A Rev A prototype schematic now exists
> (`schematics/scout-reva.kicad_sch`) — ERC-clean (0 violations) and reviewed against
> manufacturer documentation. **This is schematic verification only: the Rev A electrical
> system has not yet been physically assembled or tested.** PCB layout and physical wiring
> diagrams are still not started. See **Rev A prototype schematic** below.

**Owner:** ECE lead

## Platform: dual (build vs. production)

Per [ADR-0001](../docs/decisions/0001-mcu-and-radio-selection.md) (accepted 2026-08-14) the
project runs two platforms:

- **Build platform (confirmed, purchased)** — Adafruit Feather M0 + RFM95 + Adalogger
  FeatherWing. This is what gets wired, tested, and deployed for the capstone. See
  **Confirmed hardware** below.
- **Production target (future PCB)** — the discrete ESP32-C3 + SX1262 design the
  [Engineering Design Document §5–7](../docs/engineering/engineering-design-document.md) is
  built around. Documented, not being fabricated now. See **Production-target baseline**.

## Confirmed hardware (build platform)

The team has committed to and purchased the following. Datasheet links are in the
[source index](#datasheet--source-index).

| Function | Part | Adafruit/SKU | Notes |
|---|---|---|---|
| MCU + LoRa radio | Feather M0 w/ RFM95 LoRa (900 MHz) | Adafruit 3178 | SAMD21G18 (Cortex-M0+), SX1276 radio, 32 KB SRAM |
| SD logging + RTC | Adalogger FeatherWing | Adafruit 2922 | microSD + PCF8523 RTC (stacks on the Feather) |
| Temperature | Waterproof DS18B20 (PTFE, high-temp) | Adafruit 3846 | 1-Wire, 3.0–5.0 V, 4.7 kΩ pullup |
| Turbidity | Gravity Analog Turbidity Sensor | DFRobot SEN0189 | Analog out; needs 5 V rail + level-safe ADC input |
| Battery | LiFePO₄ | — | Charging path TBD — see Open items (Feather charger targets LiPo) |

## Rev A prototype schematic

A KiCad schematic for the confirmed build platform above now exists in
[`schematics/`](schematics/), with a system interconnect diagram in [`wiring/`](wiring/) and
local copies of the relevant manufacturer documentation in [`datasheets/`](datasheets/). The
native `scout-reva.kicad_sch` is the **authoritative electrical source**; the exported PDF is
its human-readable representation; the interconnect SVG is a communication/assembly aid and
defers to the KiCad schematic if the two ever disagree.

**This is schematic-level verification, not physical validation.** KiCad ERC reports 0
violations, and the connections below were checked against manufacturer datasheets — but the
Rev A electrical system has not yet been physically built or bench-tested. Nothing here should
be read as "hardware confirmed working."

Verified schematic connections:

- **DS18B20:** powered from `3V3`; data line to Feather `D5` (`TEMP_DATA`); 4.7 kΩ pull-up
  between `3V3` and `TEMP_DATA`, matching the "4.7 kΩ pullup" note in the Confirmed hardware
  table above.
- **SEN0189:** powered from a `SYSTEM_5V` rail; analog output (`TURB_RAW`) passes through a
  10 kΩ/20 kΩ resistive divider before reaching Feather `A1` (`TURB_DATA`), scaling the
  sensor's ~0–4.5 V swing down to ~0–3.0 V — inside the SAMD21's 3.3 V ADC range. A resistive
  divider is linear and non-inverting, and the SEN0189's own manufacturer documentation
  confirms its raw analog output *decreases* as turbidity increases. This is relevant to
  [SCO-47](https://linear.app/scout1/issue/SCO-47) but does not close it — SCO-47 also
  requires the polarity to be confirmed on the bench with real clear/turbid samples, which
  hasn't happened yet.
- **Adalogger FeatherWing:** uses the Feather's SPI bus for the microSD card, with chip-select
  on `D10`; RTC (PCF8523) on I²C. Matches the "stacks on the Feather" note above.
- **Power path (recorded as [ADR-0006](../docs/decisions/0006-rev-a-battery-chemistry.md)):**
  the Rev A schematic charges a 3.7 V LiPo cell through an external Adafruit bq25185 board (not
  the Feather's onboard charger), feeding a boosted 5 V rail into the Feather's `VBUS` and the
  SEN0189 supply. This is a different chemistry and charge path than the LiFePO₄ entry in the
  table above and than any option recorded in
  [ADR-0002](../docs/decisions/0002-lifepo4-charging-path.md). ADR-0006 accepts it **for the Rev
  A prototype only**; it is still evidence toward
  [SCO-10](https://linear.app/scout1/issue/SCO-10) rather than a deployment decision, and the
  LiFePO₄ row above remains the canonical fact until that issue is resolved.

## Production-target baseline (future PCB, per EDD)

Retained for the eventual custom board; **not** the current build.

| Function | Part | Notes |
|---|---|---|
| Microcontroller | ESP32-C3 | ~400 KB SRAM — enables on-device DSP if ever pursued |
| LoRa transceiver | Semtech SX1262 | Newer generation; lower RX/sleep current than SX1276 |
| MPPT solar charger | TI BQ25570 | Energy harvesting |
| 3.3 V buck regulator | TI TPS62840 | Always-on digital rail |
| 5 V boost regulator | TI TPS61299 | Switched measurement rail |
| Load switches | TI TPS22916 (×2) | Switched peripheral power |
| Audio ADC | TI PCM1808 | I²S audio digitization |
| Flash storage | Winbond W25Q02JV | QSPI, onboard data storage |
| Battery | LiFePO₄ | Sizing pending measured power budget |

## Datasheet / source index

| Ref | Component | Primary sources |
|---|---|---|
| REF-01 | Feather M0 LoRa (900 MHz) — Adafruit 3178 | [Product page](https://www.adafruit.com/product/3178) · pinouts/technical guide · PCB/CAD files (GitHub) |
| REF-02 | Adalogger FeatherWing — Adafruit 2922 | [Product page](https://www.adafruit.com/product/2922) · overview/pinouts guide · PCF8523 RTC datasheet (NXP) |
| REF-03 | Waterproof DS18B20 (PTFE, high-temp) — Adafruit 3846 | [Product page](https://www.adafruit.com/product/3846) — no standalone datasheet hosted; electrical specs (3.0–5.0 V, 4.7 kΩ pullup, 1-Wire) verified from the PVC-cable sibling [ID 381](https://www.adafruit.com/product/381), same DS18B20 die |
| REF-04 | Gravity Analog Turbidity Sensor — DFRobot SEN0189 | [DFRobot product page](https://www.dfrobot.com/product-1394.html) · [DFRobot wiki (specs + example code)](https://wiki.dfrobot.com/Turbidity_sensor_SKU__SEN0189) |

## Contents

```
hardware/
├── schematics/     Native KiCad schematic (authoritative) + exported PDF — populated
├── wiring/         System interconnect diagram — populated
├── datasheets/     Local manufacturer documentation for Rev A's selected components — populated
├── pcb/            Board layout, gerbers, fabrication files — not started
└── test/           Power measurements, current draw logs, bring-up records — not started
```

## Open items

- **Physical Rev A assembly and system-level testing** — the schematic is reviewed and
  ERC-clean, but nothing has been physically built or bench-tested yet.
- Sleep current target is **< 5 mA average** ([Team Timeline](../docs/planning/team-timeline.md) Phase 1, Week 3).
- LoRa and flash share the SPI bus — chip-select conflict verification is required.
- Battery and solar sizing remain provisional until the measured power budget replaces
  analytical estimates.
- **LiFePO₄ charging path (open) — [ADR-0002](../docs/decisions/0002-lifepo4-charging-path.md).**
  The Feather M0's onboard charger targets 3.7 V LiPo and is **not** compatible with the
  specified LiFePO₄ chemistry without modification. Options and the presumptive direction
  (external charger + regulated feed to `3V3`) are recorded in the ADR. Owner: ECE lead. **A
  Rev A prototype schematic now implements a different path (LiPo + external bq25185) as
  evidence toward this decision — see Rev A prototype schematic above and
  [SCO-10](https://linear.app/scout1/issue/SCO-10). Now recorded as
  [ADR-0006](../docs/decisions/0006-rev-a-battery-chemistry.md) — accepted for the Rev A
  prototype only; ADR-0002 and SCO-10 remain open for the deployment decision.**
- **Turbidity sensor is 5 V analog.** SEN0189 outputs up to ~4.5 V; the SAMD21 ADC is 3.3 V
  tolerant, so a divider or level-safe front end is required on the analog input. **Rev A's
  schematic implements a non-inverting 10 kΩ/20 kΩ divider as a candidate — see Rev A
  prototype schematic above and [SCO-47](https://linear.app/scout1/issue/SCO-47), which
  remains open pending a bench polarity test.**
