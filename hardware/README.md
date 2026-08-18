# Hardware — Electrical Design

Schematics, PCB layout, wiring diagrams, and electrical test records for the SCOUT buoy.

> **Status:** Rev A schematic complete, ERC-clean, and reviewed against manufacturer
> documentation (`schematics/scout-reva.kicad_sch`, reviewed 2026-08-18). **Physical assembly
> and system validation are pending** — this reflects a schematic-verified prototype design,
> not a physically tested one.
>
> Scope is controller + power path + temperature + turbidity + logging. Battery
> chemistry/capacity, the hydrophone/audio subsystem, and the production MCU/radio platform are
> all explicitly open — see Open items.

**Owner:** ECE lead

## Design baseline

Rev A diverges from the EDD's original component selection in several places (see
[ADR-0001](../docs/decisions/0001-mcu-and-radio-selection.md) and
[ADR-0002](../docs/decisions/0002-battery-chemistry.md) for why). Both are shown below so
nobody mistakes a schematic-verified prototype choice for a finalized production one.

**Rev A power architecture:** FlexSolar 10W panel (5V USB out) → `SOLAR_5V` → Adafruit bq25185
charger/power-path board (PID 6106) → boosted `SYSTEM_5V` → Feather M0 `VBUS` + SEN0189 5V
supply. The PKCELL LiPo connects to the bq25185's `BAT+`, not to the Feather. **The Feather
M0's onboard charger is not used in Rev A** — confirmed by direct inspection of the schematic
source (the Feather's BAT/VBAT pin is explicitly unconnected).

| Function | Rev A (schematic-verified prototype) | EDD production target | Status |
|---|---|---|---|
| Microcontroller + radio | Adafruit Feather M0 + RFM95 (Product 3178) | ESP32-C3 + Semtech SX1262 | See ADR-0001 — Rev A platform accepted, production platform still open |
| Battery charger / power path | External Adafruit bq25185 board (PID 6106) — not the Feather's onboard charger | TI BQ25570 (MPPT) | Rev A uses a linear charger + boost, not MPPT energy harvesting |
| Battery | PKCELL LiPo, 3.7 V, 500 mAh | LiFePO₄, capacity TBD | See ADR-0002 — Rev A prototype only, not finalized |
| Solar input | FlexSolar 10 W portable panel, regulated 5V USB output | Not specified in EDD | Prototype/reference hardware; no manufacturer datasheet on file yet |
| RTC + storage | Adafruit Adalogger FeatherWing (PID 2922) — PCF8523 RTC + microSD | Not specified in EDD | — |
| Temperature sensor | Adafruit DS18B20 waterproof probe (PID 3846) | DS18B20 (matches) | Confirmed |
| Turbidity sensor | DFRobot SEN0189 | SEN0189 (matches) | Confirmed |
| Hydrophone | **Not present in Rev A** | Aquarian H2dM (per EDD, per [SCO-8](https://linear.app/scout1/issue/SCO-8)) | Intentionally deferred — future electrical-design task |
| Audio ADC | Not present in Rev A | TI PCM1808 | Deferred with hydrophone subsystem |
| 3.3 V / 5 V regulation | Handled by Feather M0 onboard regulation + bq25185 boost | TI TPS62840 / TPS61299 | Rev A uses integrated board regulation, not discrete regulators |
| Load switches | Not present in Rev A | TI TPS22916 (×2) | Not yet implemented |
| Flash storage | microSD (via Adalogger) | Winbond W25Q02JV (onboard QSPI) | Rev A uses removable SD instead of onboard flash |

Verified schematic connections (reviewed against manufacturer documentation; **not yet
physically tested**):

- DS18B20 powered from `3V3`; `TEMP_DATA` → Feather `D5`; 4.7 kΩ pull-up (`3V3` → `TEMP_DATA`).
- SEN0189 powered from `SYSTEM_5V`; analog output is `TURB_RAW`.
- 10 kΩ / 20 kΩ divider produces `TURB_DATA` → Feather `A1`, scaling a possible 0–4.5 V sensor
  output down to ~0–3.0 V.
- Adalogger FeatherWing uses the Feather's SPI bus; SD chip-select on `D10`.
- Feather M0 + RFM95 is the Rev A controller/radio (see ADR-0001).
- PKCELL LiPo → `BAT+` → external bq25185 (PID 6106) only. Feather's BAT/VBAT pin is
  intentionally unconnected. bq25185's boosted 5V output feeds `SYSTEM_5V` → Feather `VBUS` +
  SEN0189 (see ADR-0002).

## Contents

```
hardware/
├── schematics/     Native KiCad schematic (authoritative) + exported PDF
├── wiring/          System interconnect diagram (communication/assembly aid)
├── datasheets/      Manufacturer documentation for selected Rev A components
├── pcb/             Board layout, gerbers, fabrication files — not yet started
└── test/            Power measurements, current draw logs, bring-up records — not yet started
```

The native KiCad schematic (`schematics/scout-reva.kicad_sch`) is the **authoritative electrical
source**. The exported PDF is its human-readable representation. The interconnect SVG in
`wiring/` is a communication/assembly aid and defers to the KiCad schematic if the two ever
disagree.

## Open items

- **Physical Rev A assembly and system-level testing** — the schematic is reviewed and
  ERC-clean, but the complete Rev A electrical system has not yet been physically built or
  tested as a system.
- **Updated power budget** — EDD §15–17 was computed against ESP32-C3/SX1262/LiFePO₄ figures
  and has not been recomputed against Rev A's actual Feather M0 + bq25185 + LiPo hardware.
- **Final battery chemistry and capacity** — Rev A's 3.7 V LiPo / 500 mAh is a prototype
  choice, not a deployment decision. See ADR-0002.
- **Hydrophone/audio electrical architecture** — intentionally outside Rev A. Signal
  conditioning, ADC/interface choice, sampling requirements, and storage implications are all
  still open. See SCO-8.
- **Final production MCU/radio decision** — ESP32-C3 + SX1262 vs. staying on Feather M0 vs.
  another platform. See ADR-0001.
- **Environmental/deployment hardware validation** — enclosure sealing, mounting, and any
  submersion/field testing remain outstanding and are not addressed by the Rev A schematic.
- SEN0189 physical connector pin order should be verified against the DFRobot board markings
  before assembly; the schematic's J4 connector represents electrical functions (5V / analog
  out / GND), not a guaranteed physical JST pin orientation.
- IRFZ44N MOSFET and LC709203F battery monitor are earlier candidate parts, **not** part of the
  Rev A design.

## Documentation gaps

- **Adafruit bq25185 PID 6106 board-level guide** — only the bare TI BQ25185 chip datasheet is
  on file (`datasheets/ti-bq25185-battery-charger.pdf`). The board-level guide (VIN/VUSB
  distinction, EN default behavior, board-specific pinout) has not been added yet.
- **FlexSolar 10W panel manufacturer documentation** — no authoritative manufacturer spec is on
  file. A retail listing is not treated as a datasheet; this remains unverified/reference-only
  until proper documentation is available.
