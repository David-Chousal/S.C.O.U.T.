# First-boot checklist (buoy + shore, pre-bench)

> **Summary** — Ordered go/no-go steps for the **first software bring-up** of one buoy
> (`feather_m0`) and one shore station (`feather_esp32s3_shore`). Software readiness only;
> radio range, enclosure, and current measurements stay on the [integration runbook](integration-runbook.md).
>
> Companion: [flashing guide](../../firmware/docs/flashing-guide.md), [shore station](shore-station.md).

---

## Do not

- Flash `feather_m0_downlink`, `feather_esp32s3_shore_downlink`, `*_bench`, or `*_wdt_test` for a
  “real” first boot — those are CI / example-key / stress builds.
- Copy `*_example.h` → `downlink_key.h` / `ota_pubkey.h` and leave the example macros; the
  shipped envs now `#error` on that.
- Hand-tune LoRa from the EDD body (SF7 / BW125 / +14 dBm / ESP32-C3). Canonical modem:
  **915.0 MHz · BW 500 kHz · SF12 · CR 4/8 · +11 dBm** ([`facts.md`](../hub/facts.md)).
- Write live CSVs to `shore/data/` — Pages publishes from **`shore/data-live/`**.
- Use `/dev/ttyACM0` in systemd; use `/dev/serial/by-id/…` (see `shore/deploy/scout-shore.service`).
- Expect the S3 to pull firmware from the console. Only the console half of SCO-312 exists
  (upload + job API); the S3 has no pull code yet, so a console job stays pending. Load bundles
  with `shore/scripts/push_firmware.py` over USB.

## Keys and flash (before power)

1. Create real keys (never commit):
   - `python3 firmware/tools/ota_release.py keygen --key ~/scout-ota.key --header firmware/src/ota_pubkey.h`
   - Copy `firmware/src/downlink_key_example.h` → `downlink_key.h`. Generate one 32-byte key for
     this `BUOY_ID` (`python3 -c "import secrets; print(', '.join(f'0x{b:02x}' for b in secrets.token_bytes(32)))"`;
     template rows exist for IDs 1–2 — **add a row** if `BUOY_ID` is anything else). Put that
     **same** key in: (1) the buoy build — keep **only** that buoy’s row; (2) the S3 build — keep
     **every** buoy you command (replace example bytes; never leave a public example key for an
     active id). **Delete** `#define SCOUT_DOWNLINK_KEY_IS_EXAMPLE 1` in both. The build gate only
     sees that macro: check by eye that no active row still holds the template bytes (`0x00…0x1f`
     for ID 1, `0x20…0x3f` for ID 2). Optional Python USB host: same key as 64 hex digits in
     `SCOUT_CMD_KEY_<id>`.
2. Confirm `BUOY_ID` in [`firmware/src/config.h`](../../firmware/src/config.h) (reports as
   `SCOUT-01`, two digits).
3. Insert a **formatted microSD** in the buoy Adalogger **before** the first flash. The upload
   powers the board, and `ota_begin` (saves the running image as the known-good one) runs only
   once per boot — a card inserted later needs a RESET before OTA adoption happens.
4. Flash buoy, from the repo root: `(cd firmware && pio run -e feather_m0 -t upload)`
   (double-tap RESET / FEATHERBOOT). First OTA-capable image needs the `scout_boot` layout (see
   flashing guide). A build error `needs src/downlink_key.h` / `ota_pubkey.h` means step 1 was
   skipped. After its first sleep the buoy drops USB for hours (standby), so later uploads need
   the double-tap RESET to reach the bootloader.
5. Flash shore, from the repo root: `(cd firmware && pio run -e feather_esp32s3_shore -t upload)`
   (BOOT+RESET). Optional compile-time seed: gitignored `shore_secrets.h` from
   `shore_secrets_example.h` (fills an empty store only).

All later commands in this checklist also run from the **repo root**.

## Buoy Serial success (115200)

Within a few seconds of USB power you should see a `boot:` line with `rtc=… sd=… lora=…`, then
`power: battery_mv=… mode=…`.

| Print | Meaning | Action if FAIL |
|---|---|---|
| `lora=ok` | RFM95 init | Check SPI / CS8 vs SD CS10 / antenna |
| `sd=ok` | Card mounted | Format FAT, reseat card |
| `rtc=ok` | RTC chip **answered** — not that the clock is set | If `rtc=FAIL` or Serial says `RTC not found`, fix I²C wiring first |
| `RTC_LOST` absent from the `seq=… flags=` line | Clock is set | Otherwise run `set_rtc.py` (below) in the 8 s window after reset |
| `power: … mode=NORMAL` | Battery sensed on A7 | `mode=CRITICAL` = no boot hello and **no TX at all**: connect a charged battery pack, then RESET |
| (silent sensors) | Gate powered during `begin()` | Confirm D11 sensor-rail gate; cold boot now turns it on briefly for probe detect |
| `WARNING: … PUBLIC example/test key` | Wrong build | Re-flash shipped env with real keys |
| `lora: TX FAIL … (no TX-done IRQ?` | Send timed out | Check DIO0 → pin 3, SPI, antenna; shore will hear nothing |
| `lora: TX skipped - radio init failed` | `lora=FAIL` at boot | Check RFM95 CS8 / RST4 / IRQ3, then RESET |

Set the clock **once** after flash (and after coin-cell loss):

```bash
# If both boards are on USB, pass the buoy port explicitly (default may be the S3):
python3 firmware/tools/set_rtc.py --port /dev/ttyACM1   # macOS: /dev/cu.usbmodem…
```

Wiring note: firmware temperature pin is **D12**; Rev A schematic annotation may still say D5 —
wire to D12 for the flight firmware.

## Shore Serial success (115200)

| Print | Meaning | Action if FAIL |
|---|---|---|
| `shore_rx: radio=ok … errata=applied` | SPI to the FeatherWing works | Confirm **CS=10 RST=11 IRQ=9** jumpers. IRQ (pin 9) is only proven by the first `RX …` line |
| `shore_rx: radio=FAIL …` (repeats every 30 s; the host receiver logs it as an error) | Init failed; loop will **not** spam USB | Fix jumpers / wing seat, then **press RESET** (the radio is only initialised in `setup()`) and confirm `radio=ok`; USB cmds still work meanwhile |
| `time: unset…` | No NTP yet | Join WiFi or send `T<epoch>` |

Preferred first contact: empty WiFi store → phone joins `SCOUT-Setup-XXXX` → paste console
device token → station check-in turns green on **Stations**. On a fresh board, ESP-IDF `nvs_open`
/ `nvs_get_blob` NOT_FOUND lines just mean the store is empty. If the console refuses the token
(`console: device token refused`), the station reopens the setup network once so a new token can
be pasted; `console: no device token saved` means none was entered. Saving a different network
while connected now switches to it straight away.

USB fallback (Linux/Pi) — run from the **repo root**. Keep the receiver and sync in **separate
terminals** (or stop the receiver briefly before a one-shot sync):

```bash
ls /dev/serial/by-id/
# edit shore/deploy/scout-shore.service REPLACE_ME, then:
(cd shore && python scripts/run_receiver.py --link serial --serial /dev/serial/by-id/… --out data-live)
# other terminal, also from repo root:
(cd shore && SCOUT_CONSOLE_URL=https://console.scoutscu.com SCOUT_CONSOLE_TOKEN=scd_… \
  python scripts/sync_console.py --data data-live --serial /dev/serial/by-id/…)
```

`sync_console.py` runs **once** and exits: packets received and settings changed after the run
reach the console only on the next run. For an unattended USB-only station, install
`scout-shore-sync.timer` (recurring sync); otherwise rerun the command after new packets arrive or
settings change. A station on WiFi pushes on its own and does not need the timer.

## Link go / no-go (same bench)

1. Shore shows `radio=ok`; buoy shows `lora=ok` and a TX (boot hello or bench wait for slot).
2. Shore USB shows `RX …` / `OK` (or console Stations check-in + a new reading).
3. Packet is 46 B v5; host/console accept it (contract is CI-gated).

If the buoy is silent: CRITICAL battery suppresses TX and boot hello; WDT resets skip hello —
read `boot: watchdog_reset=` and the `power:` line before assuming a radio failure.

An OTA image (`push_firmware.py`) is not one transfer: a session is capped at 6 min, so a full
image takes several transmit slots and resumes between them. A half-delivered image is normal.

## Software readiness verdict (this checklist’s PR)

Automated gates (shore / analytics / console / packet contract / PlatformIO native + CI envs)
must be green. Hardware stages in the runbook remain open until this checklist is executed on
the boards.
