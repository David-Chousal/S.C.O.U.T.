# Firmware — Buoy Embedded Software

Embedded firmware for the SCOUT buoy: sensor sampling, duty-cycle scheduling, local logging,
and LoRa transmission.

> **Status:** Not yet implemented. This directory is the agreed destination for firmware,
> per [Team Timeline](../docs/planning/team-timeline.md) Phase 1.

## Blocked on

Firmware cannot be committed to a toolchain until
[ADR-0001 — MCU and Radio Selection](../docs/decisions/0001-mcu-and-radio-selection.md) is
resolved. The two candidate platforms do not share a toolchain:

- **ESP32-C3** → ESP-IDF (RISC-V)
- **Feather M0 / SAMD21** → Arduino SAMD core (ARM Cortex-M0+)

Code written against one will require porting to the other.

## Intended responsibilities

Per [Engineering Design Document §12](../docs/engineering/engineering-design-document.md):

- Sensor management — temperature (DS18B20, 1-Wire), turbidity (SEN0189, analog), audio (PCM1808, I²S)
- Duty-cycle state machine — `Sleep → Wake → Sense → Log → Battery check → Transmit → Sleep`
- Deep sleep scheduling and RTC alarm wake
- Battery voltage monitoring, with transmission skipped below threshold
- Local logging to onboard flash
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
