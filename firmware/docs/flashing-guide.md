# Flashing Guide

How to build, test, and flash the SCOUT buoy firmware onto an Adafruit Feather M0 with RFM95.

## One-time setup

**PlatformIO (recommended)** — install the [PlatformIO extension](https://platformio.org/) in
VS Code, or the CLI:

```bash
pip install platformio
```

That's all: `platformio.ini` pins the board (`adafruit_feather_m0`) and libraries, so the
toolchain and dependencies install automatically on first build.

**Arduino IDE (alternative)** — install the "Arduino SAMD Boards" **and** "Adafruit SAMD"
board packages, select **Adafruit Feather M0**, and install the libraries from
`platformio.ini`'s `lib_deps` (OneWire, DallasTemperature, RTClib, RadioHead, SD, ArduinoLowPower).

## Run the host tests (no board needed)

The pure-logic core is testable on your computer:

```bash
cd firmware
pio test -e native
```

This runs `test_packet` (encoder vs. the shore golden vector) and `test_scheduler`.

## Build & flash

```bash
cd firmware
pio run                 # compile for the Feather M0
pio run -t upload       # upload
pio device monitor      # watch the serial log (115200 baud)
```

**Entering the bootloader:** if the upload can't find the board, **double-tap the RESET
button** — the onboard LED pulses, a `FEATHERBOOT` drive appears, and the M0 is ready to
accept a flash. This is normal for SAMD21 boards after deep sleep.

## First-boot checks

- Serial prints a `seq=… flags=…` line each cycle.
- `RTC_LOST` in the flags on first boot is expected until the PCF8523 is set — set the clock
  once (RTClib `adjust`) so timestamps are real.
- A `YYYYMMDD.CSV` file should appear on the microSD with the [data-schema](../../docs/engineering/data-schema.md)
  header and one row per cycle.

## Notes

- `enter_deep_sleep()` uses real SAMD21 standby (`ArduinoLowPower`), woken by the PCF8523
  countdown-timer INT on `PIN_RTC_INT`. **USB/Serial drops while in standby** — the port
  re-enumerates on wake, so watch the RTC cadence (or a scope on the sensor-gate pin), not a
  continuous serial stream, to confirm timing. Wire the Adalogger INT to `PIN_RTC_INT` first,
  and double-tap RESET to reflash if the bootloader is hard to catch during sleep cycles.
- Double-check the shared SPI bus (SD + LoRa) and the pin map in
  [pin-assignments.md](pin-assignments.md) against the ECE GPIO table before first power-on.
