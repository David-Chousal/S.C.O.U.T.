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

This runs `test_packet` (encoder vs. the shore golden vector), `test_scheduler`, `test_link`
and `test_timeset`.

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

## Set the clock (once per board, and after the coin cell is removed)

Nothing else gives the buoy the real time, and its transmit slots are UTC times of day
([SCO-201](https://linear.app/scout1/issue/SCO-201)). After flashing, run this and press RESET
once when asked:

```bash
python3 firmware/tools/set_rtc.py
```

For about 8 s after a reset, while USB is connected, the firmware accepts one line
`T<unix-epoch>` and writes it to the PCF8523. The script sends the current UTC time and prints
`time: set to …`. On battery there is no USB host, so the window simply passes.

## Build environments

| Env | What it is | Use |
|---|---|---|
| `feather_m0` | The buoy firmware | Everything that might be deployed |
| `feather_m0_bench` | Buoy firmware that samples **and transmits every 60 s**; prints a warning at boot | Bench link test only; **never deploy** |
| `feather_m0_rx` | Bench LoRa receiver for a **second** Feather M0 RFM95, same radio settings plus the 500 kHz erratum; prints `RX len=… rssi=… snr=… hex=…` per frame | Link test ([SCO-155](https://linear.app/scout1/issue/SCO-155)) |

```bash
pio run -e feather_m0_rx -t upload        # on the second Feather
pio device monitor | python3 ../shore/scripts/decode_frames.py --out /tmp/bench-data
```

`decode_frames.py` CRC-checks and decodes each frame with the shore codec; with `--out` the 3
copies of each transmission collapse to one CSV row.

## Over-the-air releases (`SCOUT_OTA`, SCO-197)

Off in the shipped builds and **never run on hardware yet**; the design and what is still open
are in the [OTA design §10](../../docs/engineering/ota-firmware-update-design.md#10-as-built-2026-11-12).

| Env | What it is |
|---|---|
| `feather_m0_ota` | The buoy with OTA: the `scout_boot` stub at `0x2000`, the app at `0x8000`. Needs `src/downlink_key.h` and `src/ota_pubkey.h` |
| `feather_m0_ota_check` | The same with the **public** test keys, for CI. Never deploy |
| `scout_boot` | The boot stub alone, ≤ 24 KB; not flashed by itself |
| `feather_esp32s3_shore_ota` | The shore station that relays signed bundles (`_check`: public keys, CI only) |

**Once, on the release machine:** make the signing key. The private key never goes in the repo
or on the shore station; the header is gitignored too.

```bash
python3 tools/ota_release.py keygen --key ~/scout-ota.key --header src/ota_pubkey.h
```

**First install is over USB** (the layout changes, so the stub must arrive by cable):
`pio run -e feather_m0_ota -t upload`. On its first boot the buoy copies itself to `FW/A.BIN`
on the SD card as the known-good image (the serial line reads `ota: phase=0 …`).

**Each release:**

1. Bump `FW_MAJOR`/`FW_MINOR`/`FW_PATCH` in `src/config.h`. The buoy refuses any version that is
   not higher than the one it runs.
2. `pio run -e feather_m0_ota`, then sign:
   `python3 tools/ota_release.py sign --key ~/scout-ota.key --buoy 1 --bin .pio/build/feather_m0_ota/firmware.bin --out scout-01-vX.Y.Z.scoutfw`
3. On the shore computer: `python3 shore/scripts/push_firmware.py --serial <S3 port> --bundle scout-01-vX.Y.Z.scoutfw --buoy 1`.
   The S3 prints `ota: ready …` once it has checked the hash and signature.
4. Watch the console: over about a day and a half the transfer runs in the 6-min session after
   each slot; the buoy then reboots into the new image and reports `FW_TRIAL` until the shore's
   `CONFIRM` lands, after which the S3 prints `ota: job done`. A `FW_ROLLED_BACK` flag means the
   buoy restored the previous image, and the shore drops the job.

After changing `src/boot/` or `lib/scout_fw_state`, regenerate the stub bytes with
`python3 tools/make_boot_image.py` before building.

## First-boot checks

- Serial prints a `boot: …` line, then a `seq=… flags=…` line each sample.
- `RTC_LOST` in the flags means the clock was never set: run `set_rtc.py` above.
- A `DATA/YYYYMMDD.CSV` file should appear on the microSD with the
  [data-schema](../../docs/engineering/data-schema.md) header and one row per sample.

## Notes

- `sleep_until()` uses real SAMD21 standby (`ArduinoLowPower`), woken by the SAMD21's own RTC
  alarm — no wake wire to add. **USB/Serial drops while in standby** — the port re-enumerates
  on wake, so watch the logged timestamps (or a scope on the sensor-gate pin), not a continuous
  serial stream, to confirm timing. Double-tap RESET to reflash if the bootloader is hard to
  catch during sleep cycles.
- Double-check the shared SPI bus (SD + LoRa) and the pin map in
  [pin-assignments.md](pin-assignments.md) against the ECE GPIO table before first power-on.
