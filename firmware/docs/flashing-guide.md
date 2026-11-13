# Flashing Guide

First power-on after flash: [first-boot checklist](../../docs/engineering/first-boot-checklist.md).

How to build, test, and flash the SCOUT firmware: the buoy (Adafruit Feather M0 with RFM95) and
the shore station (ESP32-S3 Feather with a LoRa FeatherWing). The full bench-to-field procedure,
stage by stage, is the [Integration Runbook](../../docs/engineering/integration-runbook.md).

## One-time setup

**PlatformIO (recommended)** — install the [PlatformIO extension](https://platformio.org/) in
VS Code, or the CLI:

```bash
pipx install platformio     # puts pio on the PATH; run it from firmware/
```

That's all: `platformio.ini` pins the board (`adafruit_feather_m0`) and libraries, so the
toolchain and dependencies install automatically on first build.

**Arduino IDE (alternative)** — install the "Arduino SAMD Boards" **and** "Adafruit SAMD"
board packages, select **Adafruit Feather M0**, and install the libraries from
`platformio.ini`'s `lib_deps` (OneWire, DallasTemperature, RTClib, RadioHead, SD, Arduino Low
Power, Adafruit SleepyDog, FlashStorage). The OTA layout (boot stub at `0x2000`) is only built by
PlatformIO.

## Run the host tests (no board needed)

The pure-logic core is testable on your computer:

```bash
cd firmware
pio test -e native
```

This runs every suite in `firmware/test/` (212 cases on 2026-11-12): the packet codec against
the shore golden vectors, scheduler, link policy, clock set, downlink and remote settings,
acoustic summary, the console row builder, upload queue, shore clock, dedupe, OTA frames and boot
state, the SHT4x, audio-capture and watchdog-test helpers, and the shore station's WiFi setup.

## Build & flash

```bash
cd firmware
pio run                 # compile the shipped buoy build (feather_m0)
pio run -t upload       # upload
pio device monitor      # watch the serial log (115200 baud)
```

**The shipped builds need two gitignored key files** and refuse to compile without them:
`src/downlink_key.h` (the radio command key of each buoy; copy `src/downlink_key_example.h` and
put in the real keys) and `src/ota_pubkey.h` (from `ota_release.py keygen`, below). Without them,
`pio run -e feather_m0_downlink` compiles the same firmware with the public example keys, for
checking only; never deploy it.

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
| `feather_m0_wdt_test` | The bench build plus one deliberate hang, to prove the watchdog reset | Runbook Stage 5 only; **never deploy** |
| `feather_m0_rx` | Bench LoRa receiver for a **second** Feather M0 RFM95, same radio settings plus the 500 kHz erratum; prints `RX len=… rssi=… snr=… hex=…` per frame | Link-test fallback; the shore station is the normal receiver ([SCO-155](https://linear.app/scout1/issue/SCO-155)) |
| `feather_esp32s3_shore` | The shore station | Everything that might be deployed |
| `feather_m0_downlink`, `feather_esp32s3_shore_downlink`, `feather_esp32s3_shore_link_check` | **CI / example-key compile checks only** (the `*_downlink` name is historical — it is *not* “the real downlink build”) | **Never flash** these; use `feather_m0` / `feather_esp32s3_shore` with real `downlink_key.h` + `ota_pubkey.h` |
| `scout_boot` | The OTA boot stub alone | Not flashed by itself (below) |

```bash
pio run -e feather_m0_rx -t upload        # on the second Feather
pio device monitor | python3 ../shore/scripts/decode_frames.py --out /tmp/bench-data
```

`decode_frames.py` CRC-checks and decodes each frame with the shore codec; with `--out` each
reading becomes one CSV row, even if a frame is heard twice (the buoy sends one copy per slot since
2026-10-23).

## The shore station

```bash
cd firmware
pio run -e feather_esp32s3_shore -t upload    # needs src/downlink_key.h and src/ota_pubkey.h
pio device monitor -e feather_esp32s3_shore
```

If the upload cannot find the board, hold **BOOT**, press and release **RESET**, release **BOOT**,
upload again, then press RESET.

**Its WiFi and console token are not in the build** ([SCO-310](https://linear.app/scout1/issue/SCO-310)).
With nothing saved, it opens an open WiFi network named `SCOUT-Setup-XXXX`. Join it from a phone;
the setup page opens (or browse to `http://192.168.4.1`). Pick the network (a 2.4 GHz phone
hotspot works), type its password, paste the token from the console's **Stations** page, and
save. It keeps them in flash across reflashes. It reopens the setup network by itself 10 s after
losing its network, and stays open until it is back online. To move a working station: **Change
WiFi** in its ⋯ menu on Stations, hold **BOOT** for 3 s, or send `W` over USB (10 minutes each).
⚠️ The setup network has no password, a risk accepted for the capstone only
([SCO-311](https://linear.app/scout1/issue/SCO-311)).

*Developer shortcut:* copy `src/shore_rx/shore_secrets_example.h` to `shore_secrets.h`
(gitignored) to fill an empty station on first boot without a phone.

To work on the setup page without a station: `python3 tools/setup_page_preview.py` serves it on
<http://localhost:8823> with a fake station behind it.

## Over-the-air releases (`SCOUT_OTA`, SCO-197)

**On in the shipped `feather_m0` and `feather_esp32s3_shore` builds since 2026-11-12**, and
**never run on hardware yet**. The design and what is still open are in the
[OTA design §10](../../docs/engineering/ota-firmware-update-design.md#10-as-built-2026-11-12).
Both builds now need `src/ota_pubkey.h` (below) as well as `src/downlink_key.h`, and refuse to
compile without them. The `_downlink` compile checks and the bench builds use the **public** test
key instead; never deploy them. `scout_boot` is the boot stub alone (≤ 24 KB); it is not flashed by
itself.

**Once, on the release machine:** make the signing key. The private key never goes in the repo
or on the shore station; the header is gitignored too.

```bash
python3 tools/ota_release.py keygen --key ~/scout-ota.key --header src/ota_pubkey.h
```

**First install is over USB** (the layout changes, so the stub must arrive by cable):
`pio run -e feather_m0 -t upload`. On its first boot the buoy copies itself to `FW/A.BIN`
on the SD card as the known-good image (the serial line reads `ota: phase=0 …`).

**Each release:**

1. Bump `FW_MAJOR`/`FW_MINOR`/`FW_PATCH` in `src/config.h`. The buoy refuses any version that is
   not higher than the one it runs.
2. `pio run -e feather_m0`, then sign:
   `python3 tools/ota_release.py sign --key ~/scout-ota.key --buoy 1 --bin .pio/build/feather_m0/firmware.bin --out scout-01-vX.Y.Z.scoutfw`
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
