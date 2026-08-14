# ADR-0001 — Microcontroller and LoRa Radio Selection

- **Status:** 🟡 Open — decision not yet made
- **Date raised:** 2026-08-13
- **Owners:** ECE lead (hardware), CS lead (firmware)
- **Blocks:** PCB layout, firmware toolchain, power budget verification, audio buffer design

---

## Context

Project documents currently specify **two different microcontroller and radio combinations**,
and the conflict has not been resolved in writing. This ADR records both options so the
decision is made deliberately rather than by whichever document someone reads first.

| Source | Date | MCU | Radio |
|---|---|---|---|
| [Engineering Design Document v0.2](../engineering/engineering-design-document.md) | latest | ESP32-C3 | Semtech SX1262 |
| [Team Timeline](../planning/team-timeline.md), Phase 1 Wk 3 | May 2026 | ESP32 (generic) | RFM95W (SX1276) |
| [MVP System Overview](../overview/mvp-system-overview.md) | May 2026 | ESP32 | LoRa, unspecified |
| [Sensor String diagram](../engineering/sensor-string-architecture.md) | Jul 2026 | ESP32 | LoRa, unspecified |
| Team discussion | Aug 2026 | Adafruit Feather M0 (SAMD21G18) | RFM95 (SX1276) |

## Options

### Option A — ESP32-C3 + SX1262 (discrete, as specified in the EDD)

**Pros**
- Substantially more RAM (~400 KB SRAM vs 32 KB), which materially affects audio buffering.
- SX1262 is the newer LoRa generation: lower receive current (~4.6 mA vs ~10 mA), lower sleep
  current, and better transmit efficiency than the SX127x family.
- Matches the current BOM, power budget, and PCB plan in the EDD.
- Suited to a custom PCB, which is the stated production direction.

**Cons**
- Discrete design — more schematic and layout work than an off-the-shelf board.
- Less mature Arduino-ecosystem library support than RadioHead/RFM95.
- Integrated Wi-Fi/BLE radios go unused, adding cost and some quiescent draw.

### Option B — Adafruit Feather M0 + RFM95 (integrated dev board)

**Pros**
- MCU, LoRa radio, USB, and LiPo charging integrated on one board — fastest path to a
  working prototype.
- Very mature Arduino tooling and the well-trodden RadioHead `RH_RF95` library.
- Matches what the team timeline already scheduled for Phase 1 hardware bring-up.

**Cons**
- **32 KB SRAM is a hard constraint.** A 5-minute recording cannot be held in memory, so any
  on-device acoustic index computation must be streamed blockwise from storage.
- Cortex-M0+ has no FPU — DSP work is materially slower than on the ESP32-C3.
- SX1276 is the older radio generation, with worse receive and sleep current.
- **The onboard charger is designed for 3.7 V LiPo, not the 3.2 V LiFePO₄ cell the EDD
  specifies.** Using the planned battery chemistry means bypassing or replacing the Feather's
  built-in charging circuit.

## Possible resolution

These may not actually be competing choices. A defensible reading of the project history:

- **Feather M0 + RFM95 as the prototyping platform** — Phase 1–4 bring-up, protocol
  development, and field testing, where integration speed matters most.
- **ESP32-C3 + SX1262 as the production platform** — the custom PCB the EDD is designed
  around, where RAM headroom, radio efficiency, and BOM control matter most.

If adopted, this must be stated explicitly, since firmware written against the Arduino
SAMD21 core does not port to ESP-IDF without work. Deciding this early is cheaper than
discovering it during Phase 3 integration.

## Decision

**Not yet made.** To be resolved by the ECE and CS leads.

## Consequences of deferring

- PCB layout cannot begin.
- The firmware toolchain (Arduino/SAMD21 vs ESP-IDF/RISC-V) cannot be fixed, so firmware
  written now may need porting.
- The power budget in EDD §15–17 assumes ESP32-C3 and SX1262 current figures; if the Feather
  is chosen, battery and solar sizing must be recomputed.
- Audio subsystem design depends heavily on available RAM.

## Open questions

1. Is a custom PCB definitely in scope, or could an off-the-shelf board ship in the final build?
2. Does on-device acoustic index computation remain a requirement? If yes, the RAM gap
   strongly favors Option A. If indices are computed shore-side from stored audio, it matters much less.
3. What is the actual required LoRa range? Assumptions in the documents vary widely — the MVP
   doc says ~100 yards, meeting notes cite 15–20 km, and the Feather M0 datasheet claims ~2 km
   line-of-sight. This needs a single agreed figure, measured over saltwater.
4. If the Feather is selected, how is LiFePO₄ charging handled?

## References

- [Engineering Design Document §5–6, §10](../engineering/engineering-design-document.md) — electrical architecture, component selection, communications
- [Team Timeline](../planning/team-timeline.md) — Phase 1 hardware bring-up schedule
- Deployment region is Hawaii (FCC 902–928 MHz ISM band); both radios are compatible.
