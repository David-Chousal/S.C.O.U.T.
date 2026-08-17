# Hardware — Electrical Design

Schematics, PCB layout, wiring diagrams, and electrical test records for the SCOUT buoy.

> **Status:** Build platform and BOM confirmed (below) — but no schematics, PCB layout, or
> wiring diagrams committed yet. This directory is the agreed destination for those, per
> [Team Timeline](../docs/planning/team-timeline.md) Phase 1, Week 4.

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

## Intended contents

```
hardware/
├── schematics/     Schematic capture source and exported PDFs
├── pcb/            Board layout, gerbers, fabrication files
├── wiring/         Breadboard and harness diagrams, labeled photos
└── test/           Power measurements, current draw logs, bring-up records
```

## Open items

- Sleep current target is **< 5 mA average** ([Team Timeline](../docs/planning/team-timeline.md) Phase 1, Week 3).
- LoRa and flash share the SPI bus — chip-select conflict verification is required.
- Battery and solar sizing remain provisional until the measured power budget replaces
  analytical estimates.
- **LiFePO₄ charging path (open) — [ADR-0002](../docs/decisions/0002-lifepo4-charging-path.md).**
  The Feather M0's onboard charger targets 3.7 V LiPo and is **not** compatible with the
  specified LiFePO₄ chemistry without modification. Options and the presumptive direction
  (external charger + regulated feed to `3V3`) are recorded in the ADR. Owner: ECE lead.
- **Turbidity sensor is 5 V analog.** SEN0189 outputs up to ~4.5 V; the SAMD21 ADC is 3.3 V
  tolerant, so a divider or level-safe front end is required on the analog input.
