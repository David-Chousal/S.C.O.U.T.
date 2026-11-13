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
- Expect WiFi firmware *pull* from the console onto the S3 until SCO-312’s shore side lands;
  USB `push_firmware.py` is the OTA load path today.

## Keys and flash (before power)

1. Create real keys (never commit):
   - `python3 firmware/tools/ota_release.py keygen --key ~/scout-ota.key --header firmware/src/ota_pubkey.h`
   - Copy `firmware/src/downlink_key_example.h` → `downlink_key.h`. Generate one 32-byte key for
     this `BUOY_ID` (`python3 -c "import secrets; print(', '.join(f'0x{b:02x}' for b in secrets.token_bytes(32)))"`;
     template rows exist for IDs 1–2 — **add a row** if `BUOY_ID` is anything else). Put that
     **same** key in: (1) the buoy build — keep **only** that buoy’s row; (2) the S3 build — keep
     **every** buoy you command (replace example bytes; never leave a public example key for an
     active id). **Delete** `#define SCOUT_DOWNLINK_KEY_IS_EXAMPLE 1` in both. Optional Python USB
     host: same key as 64 hex digits in `SCOUT_CMD_KEY_<id>`.
2. Confirm `BUOY_ID` in [`firmware/src/config.h`](../../firmware/src/config.h) (reports as
   `SCOUT-01`, two digits).
3. Flash buoy: `cd firmware && pio run -e feather_m0 -t upload` (double-tap RESET /
   FEATHERBOOT). First OTA-capable image needs the `scout_boot` layout (see flashing guide).
4. Flash shore: `pio run -e feather_esp32s3_shore -t upload` (BOOT+RESET). Optional compile-time
   seed: gitignored `shore_secrets.h` from `shore_secrets_example.h` (fills an empty store only).
5. Insert a **formatted microSD** in the buoy Adalogger before first power (OTA adopt + CSV).

## Buoy Serial success (115200)

Within a few seconds of USB power you should see a `boot:` line with `rtc=… sd=… lora=…`.

| Print | Meaning | Action if FAIL |
|---|---|---|
| `lora=ok` | RFM95 init | Check SPI / CS8 vs SD CS10 / antenna |
| `sd=ok` | Card mounted | Format FAT, reseat card |
| `rtc=ok` after `set_rtc.py` | Wall clock | `python3 firmware/tools/set_rtc.py` in the 8 s window |
| `WARNING: … EXAMPLE key` | Wrong build | Re-flash shipped env with real keys |
| `lora: TX FAIL` | Send returned false | SPI / radio; shore will hear nothing |

Set the clock **once** after flash (and after coin-cell loss):

```bash
python3 firmware/tools/set_rtc.py
```

Wiring note: firmware temperature pin is **D12**; Rev A schematic annotation may still say D5 —
wire to D12 for the flight firmware.

## Shore Serial success (115200)

| Print | Meaning | Action if FAIL |
|---|---|---|
| `shore_rx: radio=ok … errata=applied` | FeatherWing + modem | Confirm **CS=10 RST=11 IRQ=9** jumpers |
| `shore_rx: radio=FAIL … (fix CS=…` | Init failed; loop will **not** spam USB | Fix jumpers / wing seat; USB cmds still work |
| `time: unset…` | No NTP yet | Join WiFi or send `T<epoch>` |

Preferred first contact: empty WiFi store → phone joins `SCOUT-Setup-XXXX` → paste console
device token → station check-in turns green on **Stations**.

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

Optional: install `scout-shore-sync.timer` for periodic USB sync (WiFi path does not need it).

## Link go / no-go (same bench)

1. Shore shows `radio=ok`; buoy shows `lora=ok` and a TX (boot hello or bench wait for slot).
2. Shore USB shows `RX …` / `OK` (or console Stations check-in + a new reading).
3. Packet is 46 B v5; host/console accept it (contract is CI-gated).

If the buoy is silent: CRITICAL battery suppresses TX and boot hello; WDT resets skip hello —
read `boot: watchdog_reset=` and battery millivolts before assuming a radio failure.

## Software readiness verdict (this checklist’s PR)

Automated gates (shore / analytics / console / packet contract / PlatformIO native + CI envs)
must be green. Hardware stages in the runbook remain open until this checklist is executed on
the boards.
