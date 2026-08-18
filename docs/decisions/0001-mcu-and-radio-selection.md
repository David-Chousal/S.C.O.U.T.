# ADR-0001 — Microcontroller and LoRa Radio Selection

- **Status:** 🟢 Accepted — Rev A prototype platform only. **Production/deployment platform is
  NOT decided by this ADR** (see Decision and Open Questions).
- **Date raised:** 2026-08-13
- **Date decided (Rev A prototype scope):** 2026-08-18
- **Owners:** ECE lead (hardware), CS lead (firmware)
- **Blocks:** Prototype PCB layout, firmware toolchain — unblocked by this decision. Production
  PCB layout remains blocked on the still-open production-platform question.

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
- ~~**The onboard charger is designed for 3.7 V LiPo, not the 3.2 V LiFePO₄ cell the EDD
  specifies.** Using the planned battery chemistry means bypassing or replacing the Feather's
  built-in charging circuit.~~ Addressed for Rev A — see [ADR-0002](0002-battery-chemistry.md).
  Rev A does not use the Feather's onboard charger at all: charging and power-path management
  are handled by an external Adafruit bq25185 board (PID 6106), and the Feather is powered as a
  regulated-5V load via VBUS. Confirmed by direct inspection of the Rev A schematic — the
  Feather's BAT/VBAT pin is explicitly unconnected. Final deployment chemistry is still open.

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

**Accepted for the Rev A prototype only.** The Feather M0 + RFM95 (Adafruit Product 3178) is
the selected MCU/radio for the Rev A prototype electrical design, per the Rev A KiCad
schematic (`hardware/schematics/scout-reva.kicad_sch`). The schematic has been reviewed against
manufacturer documentation and passes KiCad ERC with 0 violations. **The complete Rev A
electrical system has not yet been physically assembled or tested** — this acceptance is based
on schematic and documentation review only, not on physical hardware validation.

**This is not acceptance of a final or production SCOUT architecture.** The ESP32-C3 + SX1262
production platform (Option A) — or any other platform — remains explicitly unresolved and
deferred. A future ADR (or a revision to this one) is required before production PCB layout
begins.

## Consequences

- Rev A prototype schematic work, firmware toolchain selection (Arduino/SAMD21), and Phase 1–4
  bring-up planning can proceed on the Feather M0 + RFM95 basis.
- Production PCB layout remains blocked until the production-platform question is resolved.
- **The EDD's power budget (§15–17) was computed against ESP32-C3 and SX1262 current figures
  and has not been recomputed against Rev A's actual hardware.** This schematic review does not
  validate that budget — it remains outstanding.
- Audio subsystem / on-device acoustic index computation is still constrained by the Feather
  M0's 32 KB SRAM for as long as Rev A remains the active prototype platform.
- Battery chemistry for the Rev A prototype is LiPo, charged via an external bq25185 board, not
  the Feather's onboard charger — see [ADR-0002](0002-battery-chemistry.md) for that decision
  and its own open questions.

## Open questions

1. Is a custom PCB definitely in scope, or could an off-the-shelf board ship in the final build?
2. Does on-device acoustic index computation remain a requirement? If yes, the RAM gap
   strongly favors Option A. If indices are computed shore-side from stored audio, it matters much less.
3. What is the actual required LoRa range? Assumptions in the documents vary widely — the MVP
   doc says ~100 yards, meeting notes cite 15–20 km, and the Feather M0 datasheet claims ~2 km
   line-of-sight. This needs a single agreed figure, measured over saltwater.
4. ~~If the Feather is selected, how is LiFePO₄ charging handled?~~ **Addressed for Rev A** —
   Rev A doesn't use LiFePO₄ or the Feather's onboard charger; see
   [ADR-0002](0002-battery-chemistry.md). Reopens if a future revision returns to LiFePO₄.
5. Is the production platform (Option A) still the intended direction, or does the Rev A
   prototype change that calculus? **Not decided by this ADR.**

## References

- [Engineering Design Document §5–6, §10](../engineering/engineering-design-document.md) — electrical architecture, component selection, communications
- [Team Timeline](../planning/team-timeline.md) — Phase 1 hardware bring-up schedule
- [ADR-0002 — Battery Chemistry](0002-battery-chemistry.md)
- Rev A schematic: `hardware/schematics/scout-reva.kicad_sch` (native, authoritative) and
  `hardware/schematics/scout-reva-schematic.pdf` (exported)
- Deployment region is Hawaii (FCC 902–928 MHz ISM band); both radios are compatible.
