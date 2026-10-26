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

- Sensor management — temperature (DS18B20, 1-Wire), turbidity (Seeed Grove 101020752, analog), audio (hydrophone preamp on A2, SAMD21 12-bit ADC at 22.05 kHz via timer + DMA, [ADR-0011](../docs/decisions/0011-audio-capture-parameters.md))
- Duty-cycle state machine — `Sleep → Wake → Sense → Log → Battery check → Transmit → Sleep`
- Deep sleep scheduling and RTC alarm wake
- Battery voltage monitoring, with transmission skipped below threshold
- Local logging to microSD (Adalogger FeatherWing)
- LoRa packet assembly and transmission (44-byte payload in v3, including the 14-byte acoustic summary from `lib/scout_acoustic`; 140 B is the ceiling, `SCOUT_LINK_PAYLOAD_CEILING_BYTES`)
- Watchdog timer and error recovery
- State of Health telemetry — battery voltage, internal temperature, humidity

## Layout

```
firmware/
├── platformio.ini          Buoy, bench, bench-receiver, shore-station and native (host) test envs
├── src/
│   ├── main.cpp            Duty-cycle state machine: Sleep→Wake→Sense→Log→Battery→TX→Sleep
│   ├── config.h            Pin map, cadence, thresholds  (⚠ confirm pins with ECE)
│   ├── acoustic_config.h   Feeds config.h constants into scout_acoustic
│   ├── drivers/            Thin hardware wrappers (DS18B20, turbidity, SHT40, PCF8523, SD, RFM95,
│   │                       battery, audio capture)
│   ├── bench_rx/           Bench LoRa receiver for a second Feather M0 (env feather_m0_rx)
│   └── shore_rx/           ESP32-S3 shore-station receiver (env feather_esp32s3_shore)
├── lib/                    Hardware-free, host-testable libraries:
│   ├── scout_packet/       LoRa packet codec — byte-identical to shore/scout_shore/packet.py
│   ├── scout_scheduler/    Duty-cycle timing math (sample grid, TX slots, power modes, audio hours)
│   ├── scout_link/         Blind-repetition delivery policy + watchdog-headroom guard
│   ├── scout_dedupe/       Shore-side duplicate filter on (buoy_id, record_seq)
│   ├── scout_acoustic/     14-byte acoustic summary — bit-exact port of acoustic_summary.py
│   ├── scout_capture/      WAV header, 12→16-bit conversion, dropped-sample accounting
│   ├── scout_sht4x/        SHT40 frame CRC + humidity/temperature conversion
│   └── scout_timeset/      Bench clock-set command ("T<unix-epoch>") parser
├── test/                   Unity unit tests (run on the host), one suite per library:
│   ├── test_packet/        Encoder vs the shore golden vector + CRC + fixed-point helpers
│   ├── test_scheduler/     Sample grid, TX slots, battery gate, power modes, audio scheduling
│   ├── test_link/          Repeat counts by power mode, gap widening, watchdog headroom
│   ├── test_dedupe/        Duplicate filter
│   ├── test_acoustic/      Summary vs golden vectors written by the Python reference
│   ├── test_capture/       WAV header and sample conversion
│   ├── test_sht4x/         Frame CRC and conversion
│   └── test_timeset/       Clock-set command parsing
├── tools/set_rtc.py        Sets the PCF8523 to UTC over USB (SCO-201)
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
  - **Standby sleep and fixed schedule** ([SCO-165](https://linear.app/scout1/issue/SCO-165)) —
    real SAMD21 deep sleep (`ArduinoLowPower`) woken by the SAMD21's own RTC alarm, which runs
    from the Feather's 32.768 kHz crystal; no wake wire is needed. The PCF8523 is re-read after
    every wake, so the internal RTC only times one interval and drift never accumulates.
    Samples at :00 and :30; transmits the latest reading in three fixed slots (`TX_SLOTS_SOD`:
    00:10, 08:10, 16:10 UTC), so the radio never overlaps a sensor read. A missed slot is
    skipped, not retried. Needs a current measurement to confirm the low-power draw.
  - **Watchdog** — the SAMD21 WDT (`Adafruit_SleepyDog`, ~16 s) guards each active cycle and
    init; a hang resets the buoy so it recovers on its own. Disabled during standby (its
    timeout is far shorter than the 30-min interval) and re-armed on wake. A watchdog reset is
    detected at boot (`PM->RCAUSE`) and logged.
  - **Adaptive transmission (graceful degradation)** — a power mode derived from battery
    voltage (`scout_power_mode`): **NORMAL** (all sensing, transmit in every slot) →
    **CONSERVE** (audio off, transmit in every `TRANSMIT_CONSERVE_EVERY`-th slot) → **CRITICAL**
    (temperature + logging only; no turbidity, audio, or TX). Core temperature always logs.
    The `POWER_CONSERVE` flag marks throttled rows so shore can see it. Pure logic in
    `scout_scheduler`, unit-tested; thresholds in `config.h` (provisional, ADR-0002).
  - **Retained state across resets** — `record_seq` and `last_tx_epoch` live in a no-init RAM
    section (magic-guarded) that the C startup doesn't clear, so a watchdog/system reset keeps
    the counter monotonic and doesn't re-send the daily packet. RAM-based: a full power loss
    still cold-starts (the PCF8523 has no user NVRAM; SD/flash persistence was declined to
    avoid wear for the rarer power-loss case). Verify by inducing a reset and confirming
    `resume_seq` continues in the boot log.
  - **Packet delivery reliability** — CR 4/8 forward error correction, and **one copy per
    transmit slot** (`SCOUT_LINK_REPEATS_NORMAL`; was 3 copies until 2026-10-23, SCO-21): the
    three daily slots ~8 h apart give the time diversity, and the buoy never listens for an
    acknowledgement. A lost packet costs timeliness, not data (the full record is on the SD
    card), so ACKed retransmit would buy little and risks an avalanche across a multi-buoy
    deployment. Copies by power mode: 1 in NORMAL, 1 in CONSERVE (slot 0 only), 0 in CRITICAL.
    The shore station deduplicates on `(buoy_id, record_seq)`, so any duplicate collapses to one row.
    The modem runs **BW 500 kHz · SF12 · CR 4/8 · +11 dBm** — widened from BW125/SF7 on
    2026-09-01 because 47 CFR §15.247 requires either a ≥500 kHz bandwidth or ≥50-channel
    hopping, and the old single-channel BW125 config met neither (SCO-19). See the note in
    `drivers/lora_link.h` and [`facts.md`](../docs/hub/facts.md). Policy is pure logic in `scout_link`, unit-tested, including a
    guard that the repeat schedule cannot outrun the watchdog. Needs a real range test
    (SCO-14) to confirm the delivery gain over the air.
- **Scaffold (Phase 1 bench work):** the driver wrappers call the real libraries but need
  on-hardware verification and pin confirmation. **Audio capture** (`drivers/audio_capture.h`,
  [SCO-231](https://linear.app/scout1/issue/SCO-231)) is written and compiles but has never run:
  there is no hydrophone or preamp yet. Its hardware-free half (`lib/scout_capture`: WAV header,
  12→16-bit conversion, dropped-sample accounting) is unit-tested.

## Notes

- **The packet layout is the contract with the shore station.** `lib/scout_packet` mirrors
  `shore/scout_shore/packet.py` exactly; `test_packet` enforces it against a golden vector
  generated by the Python side. Change one, change both, and bump `SCOUT_PACKET_VERSION`.
- The CSV log format is specified in
  [data-schema.md](../docs/engineering/data-schema.md) — the writer↔reader contract with
  `analytics/`.
- Pure-logic code stays in `lib/` (no Arduino includes) so it compiles and tests on the host.
