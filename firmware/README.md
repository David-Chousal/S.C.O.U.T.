# Firmware — Buoy Embedded Software

Embedded firmware for the SCOUT buoy: sensor sampling, duty-cycle scheduling, local logging,
and LoRa transmission.

> **Status:** Not yet implemented — but **unblocked**. The platform is decided
> ([ADR-0001](../docs/decisions/0001-mcu-and-radio-selection.md), accepted 2026-08-14), so
> development can begin per [Team Timeline](../docs/planning/team-timeline.md) Phase 1.

## Platform & toolchain

Confirmed build platform: **Adafruit Feather M0 with RFM95 LoRa, 900 MHz (Adafruit 3178)**,
paired with the **Adalogger FeatherWing (Adafruit 2922)** for microSD logging and a PCF8523
real-time clock.

- **Toolchain:** Arduino IDE or PlatformIO, **Arduino SAMD core** (SAMD21G18, ARM Cortex-M0+).
- **LoRa driver:** RadioHead `RH_RF95`.
- **RTC:** PCF8523 on the Adalogger (use `RTClib`), not the DS3231 named in older timeline drafts.
- **Hard constraint — 32 KB SRAM.** A 5-minute recording cannot be held in memory, so audio
  is streamed to microSD in small blocks and **all acoustic-index computation happens
  shore-side** in [`analytics/`](../analytics). The buoy records and stores audio; it does not
  analyze it on-device.

The ESP32-C3 + SX1262 in the [Engineering Design Document](../docs/engineering/engineering-design-document.md)
is the *future production-PCB* target, **not** what firmware targets today. Code written
against the Arduino SAMD21 core would need porting to ESP-IDF if that board is ever built.
See [ADR-0001](../docs/decisions/0001-mcu-and-radio-selection.md).

## Intended responsibilities

Per [Engineering Design Document §12](../docs/engineering/engineering-design-document.md):

- Sensor management — temperature (DS18B20, 1-Wire), turbidity (SEN0189, analog), audio (PCM1808, I²S)
- Duty-cycle state machine — `Sleep → Wake → Sense → Log → Battery check → Transmit → Sleep`
- Deep sleep scheduling and RTC alarm wake
- Battery voltage monitoring, with transmission skipped below threshold
- Local logging to microSD (Adalogger FeatherWing)
- LoRa packet assembly and transmission (82-byte daily payload)
- Watchdog timer and error recovery
- State of Health telemetry — battery voltage, internal temperature, humidity

## Suggested layout, once started

```
firmware/
├── src/            Main firmware source
├── lib/            Project-specific libraries (sensor drivers, packet format)
├── test/           Unit tests for pure logic (packet encoding, scheduling math)
└── docs/           Pin assignments, wiring notes, flashing guide
```

## Notes

- The packet format is the contract between this directory and the shore station. Define it
  once, in a header shared with (or mirrored by) the receiver.
- Keep the packet encoder free of hardware dependencies so it can be unit tested off-target.
