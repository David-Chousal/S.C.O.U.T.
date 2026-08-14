# Hardware — Electrical Design

Schematics, PCB layout, wiring diagrams, and electrical test records for the SCOUT buoy.

> **Status:** Not yet populated. This directory is the agreed destination for wiring diagrams
> and schematics, per [Team Timeline](../docs/planning/team-timeline.md) Phase 1, Week 4.

**Owner:** ECE lead

## Blocked on

PCB layout cannot begin until
[ADR-0001 — MCU and Radio Selection](../docs/decisions/0001-mcu-and-radio-selection.md) is
resolved.

## Design baseline

The electrical architecture is specified in
[Engineering Design Document §5–7](../docs/engineering/engineering-design-document.md).
Summary of the current component selection:

| Function | Part | Notes |
|---|---|---|
| Microcontroller | ESP32-C3 | See ADR-0001 — contested |
| LoRa transceiver | Semtech SX1262 | See ADR-0001 — contested |
| MPPT solar charger | TI BQ25570 | Energy harvesting |
| 3.3 V buck regulator | TI TPS62840 | Always-on digital rail |
| 5 V boost regulator | TI TPS61299 | Switched measurement rail |
| Load switches | TI TPS22916 (×2) | Switched peripheral power |
| Audio ADC | TI PCM1808 | I²S audio digitization |
| Flash storage | Winbond W25Q02JV | QSPI, onboard data storage |
| Battery | LiFePO₄ | Sizing pending measured power budget |

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
- If the Feather M0 is selected, its onboard charger targets 3.7 V LiPo and is **not**
  compatible with the specified LiFePO₄ chemistry without modification.
