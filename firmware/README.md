# Firmware — Buoy Embedded Software

Embedded firmware for the SCOUT buoy: sensor sampling, duty-cycle scheduling, local logging,
and LoRa transmission.

> **Status:** **Phase 1 scaffold.** The project structure, the duty-cycle state machine, the
> hardware-driver wrappers, and the build/test setup are in place. The **pure-logic core is
> real and verified** (packet codec byte-identical to the shore decoder; scheduling math
> unit-tested). Hardware bring-up on the bench — real sensor reads, SD, LoRa, and true SAMD21
> standby sleep — is the next step, per [Team Timeline](../docs/planning/team-timeline.md) Phase 1.

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

## Layout

```
firmware/
├── platformio.ini          Feather M0 build + native (host) test envs
├── src/
│   ├── main.cpp            Duty-cycle state machine: Sleep→Wake→Sense→Log→Battery→TX→Sleep
│   ├── config.h            Pin map, cadence, thresholds  (⚠ confirm pins with ECE)
│   └── drivers/            Thin hardware wrappers (DS18B20, turbidity, PCF8523, SD, RFM95, battery)
├── lib/                    Hardware-free, host-testable libraries:
│   ├── scout_packet/       LoRa packet codec — byte-identical to shore/scout_shore/packet.py
│   ├── scout_scheduler/    Duty-cycle timing math (next wake, daily TX, battery gate, audio hours)
│   └── scout_link/         Blind-repetition delivery policy + watchdog-headroom guard
├── test/                   Unity unit tests (run on the host)
│   ├── test_packet/        Encoder vs the shore golden vector + CRC + fixed-point helpers
│   ├── test_scheduler/     Wake grid, daily-TX cadence, battery gate, audio scheduling
│   └── test_link/          Repeat counts by power mode, gap widening, watchdog headroom
└── docs/                   pin-assignments.md, flashing-guide.md
```

## Build & test

```bash
pio run                 # build for the Feather M0
pio run -t upload       # flash (double-tap RESET for the bootloader)
pio test -e native      # run the pure-logic unit tests on your computer (no board needed)
```

## What's real vs. scaffold

- **Real & verified:** `scout_packet` (encoder proven byte-identical to the Python shore
  decoder) and `scout_scheduler` (unit-tested). The state machine and CSV row format
  ([data-schema.md](../docs/engineering/data-schema.md)) are wired end to end.
- **Implemented, pending bench verification:**
  - **Standby sleep** — real SAMD21 deep sleep (`ArduinoLowPower`) woken by the PCF8523
    countdown-timer INT on `PIN_RTC_INT`, with a flag-clear on wake so it re-arms each
    interval. Needs the INT wired and a current measurement to confirm the low-power draw.
  - **Watchdog** — the SAMD21 WDT (`Adafruit_SleepyDog`, ~16 s) guards each active cycle and
    init; a hang resets the buoy so it recovers on its own. Disabled during standby (its
    timeout is far shorter than the 30-min interval) and re-armed on wake. A watchdog reset is
    detected at boot (`PM->RCAUSE`) and logged.
  - **Adaptive transmission (graceful degradation)** — a power mode derived from battery
    voltage (`scout_power_mode`): **NORMAL** (all sensing, transmit each interval) →
    **CONSERVE** (audio off, transmit ×`TRANSMIT_CONSERVE_FACTOR` less often) → **CRITICAL**
    (temperature + logging only; no turbidity, audio, or TX). Core temperature always logs.
    The `POWER_CONSERVE` flag marks throttled rows so shore can see it. Pure logic in
    `scout_scheduler`, unit-tested; thresholds in `config.h` (provisional, ADR-0002).
  - **Retained state across resets** — `record_seq` and `last_tx_epoch` live in a no-init RAM
    section (magic-guarded) that the C startup doesn't clear, so a watchdog/system reset keeps
    the counter monotonic and doesn't re-send the daily packet. RAM-based: a full power loss
    still cold-starts (the PCF8523 has no user NVRAM; SD/flash persistence was declined to
    avoid wear for the rarer power-loss case). Verify by inducing a reset and confirming
    `resume_seq` continues in the boot log.
  - **Daily-packet delivery reliability** — CR 4/8 forward error correction plus **blind
    repetition**: the same frame goes out `SCOUT_LINK_REPEATS_NORMAL` times, spaced with
    widening gaps, and the buoy never listens for an acknowledgement. A lost daily packet
    costs timeliness, not data (the full record is on the SD card), so ACKed retransmit would
    buy little and risks an avalanche across a multi-buoy deployment. Repeat count degrades
    with the power mode like everything else (3 in NORMAL, 1 in CONSERVE, 0 in CRITICAL).
    The shore station deduplicates on `(buoy_id, record_seq)`, so copies collapse to one row.
    Spreading factor stays at SF7 pending the FCC dwell-time question (SCO-19) — see the note
    in `drivers/lora_link.h`. Policy is pure logic in `scout_link`, unit-tested, including a
    guard that the repeat schedule cannot outrun the watchdog. Needs a real range test
    (SCO-14) to confirm the delivery gain over the air.
- **Scaffold (Phase 1 bench work):** the driver wrappers call the real libraries but need
  on-hardware verification and pin confirmation; **audio** (PCM1808/hydrophone) is a scheduled
  hook only — it's a V1 stretch, not on the confirmed Feather build.

## Notes

- **The packet layout is the contract with the shore station.** `lib/scout_packet` mirrors
  `shore/scout_shore/packet.py` exactly; `test_packet` enforces it against a golden vector
  generated by the Python side. Change one, change both, and bump `SCOUT_PACKET_VERSION`.
- The CSV log format is specified in
  [data-schema.md](../docs/engineering/data-schema.md) — the writer↔reader contract with
  `analytics/`.
- Pure-logic code stays in `lib/` (no Arduino includes) so it compiles and tests on the host.
