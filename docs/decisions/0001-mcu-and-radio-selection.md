# ADR-0001 — Microcontroller and LoRa Radio Selection

- **Status:** 🟢 Accepted — dual-platform (see Decision)
- **Date raised:** 2026-08-13
- **Date decided:** 2026-08-14
- **Owners:** ECE lead (hardware), CS lead (firmware)
- **Formerly blocked:** PCB layout, firmware toolchain, power budget verification, audio buffer design

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

**Accepted 2026-08-14 — dual-platform**, adopting the resolution proposed above.

- **Adafruit Feather M0 + RFM95 LoRa (Adafruit 3178) is the confirmed build platform** for
  all subsystem bring-up, firmware development, protocol work, and field testing (Phases 1–6).
  This is the hardware the team has purchased — see
  [`hardware/README.md`](../../hardware/README.md). Local logging and timekeeping are provided
  by the **Adalogger FeatherWing (Adafruit 2922)**: microSD plus a PCF8523 RTC.
- **ESP32-C3 + SX1262 remains the documented production target** — the custom PCB the
  [Engineering Design Document](../engineering/engineering-design-document.md) is designed
  around, retained for a future revision where RAM headroom, radio efficiency, and per-unit
  cost matter. It is **not** being built for the graded capstone deliverable.

Firmware is therefore written against the **Arduino SAMD21 core** (ARM Cortex-M0+) using the
**RadioHead `RH_RF95`** driver. Whether the custom ESP32-C3 board is ever built is a separate,
later decision and should be recorded as its own ADR when the team reaches it.

## Consequences

- **Firmware unblocked.** Toolchain is fixed (Arduino SAMD21); development can start now.
- **The EDD's power/audio analysis describes the future production board, not the Feather.**
  EDD §15–17 (energy budget, battery and solar sizing) assumes ESP32-C3 and SX1262 current
  figures. Those numbers stand as the production-target analysis; a Feather-specific power
  budget will be produced empirically during Phase 1–4 bench and field testing rather than
  re-derived on paper now.
- **Audio is analyzed shore-side.** See open question 2 below.

## Resolved open questions

1. **Custom PCB in scope?** Not for the graded build. The Feather stack ships; the custom
   ESP32-C3 board is a documented future target, not a Phase 0–6 deliverable.
2. **On-device acoustic index computation?** No. The SAMD21's **32 KB SRAM** cannot hold a
   5-minute recording, so the buoy only records and stores audio to microSD; all acoustic
   indices are computed **shore-side** by the [`analytics/`](../../analytics) pipeline, which
   already works this way.
3. **Required LoRa range?** Still open — needs one measured figure over saltwater (Phase 4
   range test). Design assumes conservative line-of-sight to a nearshore shore station.
4. **LiFePO₄ charging?** The Feather's onboard charger targets 3.7 V LiPo, not the specified
   LiFePO₄ chemistry. Split into its own record — see
   [ADR-0002 — LiFePO₄ charging path](0002-lifepo4-charging-path.md). Owner: ECE lead.

## References

- [Engineering Design Document §5–6, §10](../engineering/engineering-design-document.md) — electrical architecture, component selection, communications
- [Team Timeline](../planning/team-timeline.md) — Phase 1 hardware bring-up schedule
- Deployment region is Hawaii (FCC 902–928 MHz ISM band); both radios are compatible.
