# Shore Station (ESP32-S3)

> **Summary** — The shore-side base station that listens for the buoys over LoRa and gets their
> data to the dashboard over WiFi. It is an **Adafruit ESP32-S3 Feather with a LoRa Radio
> FeatherWing (RFM95W)**, running FreeRTOS so it can listen to LoRa and use WiFi at the same time.
> Under [ADR-0008](../decisions/0008-over-the-air-firmware-updates.md) it also sends firmware and
> settings to the buoys. **Its firmware is not written yet** ([SCO-24](https://linear.app/scout1/issue/SCO-24)).
>
> Rewritten 2026-10-19 from the team's decisions. This page used to describe a Raspberry Pi
> shore station; that design was replaced on 2026-09-24.

---

## What was agreed

Everything on this page traces to one of these. Nothing below goes beyond them; what they leave
open is listed under [Open items](#open-items).

| Date | Agreed | Record |
|---|---|---|
| 2026-09-24 | The base station is an **ESP32-based Feather S3 with a separate LoRa module**, not a Feather M0. The M0 is single-threaded and "goes deaf on every API call", so it cannot listen to LoRa and use WiFi at once; the S3 runs **FreeRTOS** and is multi-threaded. The buoys stay on the M0 | [SCO-86](https://linear.app/scout1/issue/SCO-86), [meeting notes](../planning/meeting-notes.md) |
| 2026-09-24 | The buoy is transmit-only with **no cloud path of its own**; the shore station is half of the minimum testable system and is ordered with the buoy | [SCO-115](https://linear.app/scout1/issue/SCO-115) |
| 2026-09-24 | Build **two buoys talking to one base station** | Meeting notes |
| 2026-09-24 | **Starlink rejected** as backhaul: the system must not depend on a single commercial provider | [Decision log](../hub/decision-log.md) |
| 2026-09-24 | **Talk to Catherine about her IoT dashboard** (React front end, SQL back end) before building one | [SCO-120](https://linear.app/scout1/issue/SCO-120) |
| 2026-09-30 | A previous senior-design group of Navid's built a near-identical **ESP32 + LoRa** station; its parts list is available | Meeting notes |
| 2026-10-06 | Parts: **ESP32-S3 Feather (Adafruit 5477) + LoRa Radio FeatherWing RFM95W 900 MHz (3231)** + stacking headers + 915 MHz antennas | [Build plan](electronics-build-and-test-plan.md#stage-4--data-transmission-buoy--shore) |
| 2026-10-07 | The shore station is **wall-powered** for now; USB-C charging is a stretch goal for off-grid sites. David and Isabella each get a shore station | Meeting notes |
| 2026-10-16 | Shore station confirmed as the S3 + LoRa FeatherWing, **pushing to the dashboard over WiFi**, on FreeRTOS | Meeting notes (lab session) |
| 2026-10-16 | It **knows the buoys' transmit-slot table** (00:10 / 08:10 / 16:10 UTC) and listens in a **±2 min** window around each slot; always-on listening is fine while it is mains-powered | [SCO-165](https://linear.app/scout1/issue/SCO-165) |
| 2026-10-16 | **Over-the-air updates: go.** The shore station sends firmware and settings (starting with the daily transmit count) to the buoys | [ADR-0008](../decisions/0008-over-the-air-firmware-updates.md), [SCO-197](https://linear.app/scout1/issue/SCO-197), [SCO-198](https://linear.app/scout1/issue/SCO-198) |
| 2026-10-25 | **The daily transmit count is a setting (1–3, pending ECE sign-off)** requested in the team console; the shore station follows the count each buoy reports for its slot tag, and relays the requested count to the buoy. **The console is the back end the shore pushes to** (Cloudflare Workers + D1); the public dashboard stays static | [SCO-198](https://linear.app/scout1/issue/SCO-198), [ADR-0012](../decisions/0012-authenticated-console.md) |
| 2026-10-16 | FCC: a receive-only shore antenna is uncapped, but **whatever the shore transmits through must stay within the module limits (≤ 2.15 dBi)** | [FCC Review Brief](../research/fcc-review-brief.md#outcome--reviewed-2026-10-16) |

## Role

1. **LoRa reception** from every buoy, matching their radio settings exactly.
2. **Packet validation and decode** against the 44-byte packet contract (v4, and v3 with the same bytes), still accepting 30-byte v1/v2 frames (CRC, version).
3. **Push to the dashboard over WiFi.**
4. **Downlink (ADR-0008):** send firmware images and settings to the buoys in their listen windows.
5. **Serve more than one buoy** (two planned), deduplicating any repeated reading on
   `(buoy_id, record_seq)`.

Raw audio never crosses the link; it stays on the buoy's SD card and is processed after retrieval.

## Hardware

| Item | Part | Notes |
|---|---|---|
| MCU | Adafruit **ESP32-S3 Feather**, 4 MB flash / 2 MB PSRAM (5477) | WiFi, FreeRTOS, multi-threaded |
| LoRa radio | Adafruit **LoRa Radio FeatherWing RFM95W 900 MHz** (3231) | SX1276, same chip family as the buoy's RFM95. Stacked on the S3 |
| Antenna | 915 MHz spring antenna (4269) for the bench | **≤ 2.15 dBi** for any antenna the station transmits through; a separate high-gain antenna is possible for receive only |
| Power | Wall (USB) | USB-C charging is a stretch goal for off-grid sites |
| Arrived | 2026-10-16 | Adafruit invoice 3758294 ([Purchase Log](../planning/purchase-log.md)) |

## Software

**On the S3 — receive half written, not yet run on the board** (`firmware/src/shore_rx/`, env
`feather_esp32s3_shore`, [SCO-24](https://linear.app/scout1/issue/SCO-24)). It copies the bench
receiver's radio setup and modem settings, validates each frame (length, CRC, schema version),
decodes it with `scout_packet_decode`, drops repeats on `(buoy_id, record_seq)`, and tags it in or
out of the ±2 min window around a slot. **The slots it tags against follow the daily transmit
count** ([SCO-198](https://linear.app/scout1/issue/SCO-198)): the count the frame reports (v4,
flags bits 8–9), else the count requested for that buoy, else the default 3. 1 → 00:10,
2 → 00:10 + 16:10, 3 → all. Each `OK` line ends `tx=<reported>/<requested>`, plus `pending` until
they match and `cmd_rejected` if the buoy refused a command. The requested count comes from the
console over WiFi (below); without WiFi, `N<buoy>:<count>` over USB (e.g. `N1:2`) sets it, and
`shore/scripts/sync_console.py` prints or writes those lines from the console. It listens all the time, since it is mains-powered, so the
count changes the tag, not when the radio is on. Its serial
output keeps the bench receiver's `RX …` line, so `scripts/decode_frames.py` reads it unchanged.
⚠️ The FeatherWing's CS/RST/IRQ jumper pads have no default; the build assumes **CS 10, RST 11,
IRQ 9**, to be confirmed by ECE. **Settings downlink written, off by default:** built with
`-DSCOUT_DOWNLINK` (env `feather_esp32s3_shore_downlink`, compile check with public example keys),
the station sends one HMAC-signed `SET_TX_COUNT` frame (`lib/scout_downlink`, 28 bytes) straight
after a buoy's packet whenever that buoy's reported count differs from the requested one, at the
buoy's +11 dBm. ⚠️ **Do not transmit off the bench** until the FeatherWing's FCC authorization is
checked (open item 3). Keys go in the gitignored `firmware/src/downlink_key.h`. **Not written:**
firmware OTA.

**WiFi push — written 2026-10-28, not yet run on the board**
([SCO-237](https://linear.app/scout1/issue/SCO-237)). The S3 sends every reading to the console
by itself, with no computer attached (`src/shore_rx/shore_net.cpp`):

- **Its own FreeRTOS task on core 0**, so the LoRa loop on core 1 never waits on the network.
- **Readings:** each new reading is queued (`lib/scout_upload_queue`, 256 readings, about six weeks
  of two buoys offline; when full the oldest is dropped and counted) and pushed in batches of 20 to
  `POST /api/device/readings` over HTTPS with the station's device token. A failed push is retried
  with a backoff from 5 s to 10 min; a reading the console refuses as invalid is dropped so it
  cannot block the rest. Re-sending is safe: the console stores each `(buoy_id, record_seq)` once.
- **Rows match the Python to the character** (`lib/scout_console`): the console keeps rows as sent
  and the computer bridge and SD import build the same rows in Python, so numbers are formatted
  with exact rounding rather than `printf`. `firmware/test/test_console/row_vectors.h`, generated
  from `shore/scout_shore/schema.py` (`python -m scout_shore.row_vectors --write`), checks every
  column, every battery millivolt from 2.0 to 4.4 V and every turbidity count;
  `shore/tests/test_row_vectors.py` fails if the header drifts.
- **Requested transmit counts** are read from `GET /api/device/settings` every 10 min; the
  console's answer replaces any `N<buoy>:<count>` typed over USB.
- **Clock, best source first** (`lib/scout_shore_clock`): NTP over WiFi (`pool.ntp.org`,
  `time.google.com`, `time.cloudflare.com`; SNTP re-syncs hourly). Without WiFi the S3's
  **internal clock** keeps time between syncs, and across any reset except power-on, because the
  ESP32's RTC timer survives resets
  ([ESP-IDF System Time](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/system_time.html));
  ⚠️ that survival is from the ESP-IDF docs, not yet seen on the board. `T<epoch>` over USB
  (`firmware/tools/set_rtc.py`) sets it by hand. Only a power-on with no WiFi and no USB leaves it
  unset, because the S3 has no battery-backed clock (open item 6). The clock only tags the slot
  window and stamps downlink counters: **readings carry the buoy's own timestamp**, so an unset
  shore clock never corrupts data.
- **HTTPS trusts eight roots** (`src/shore_rx/console_ca.h`: Google Trust Services R1–R4, Let's
  Encrypt X1/X2, SSL.com 2022 ECC/RSA), because Cloudflare can move the console's certificate
  between those CAs; the bundle was checked against the live console on 2026-10-28.
- **Credentials** go in the gitignored `src/shore_rx/shore_secrets.h` (copy
  `shore_secrets_example.h`): WiFi name and password, console URL, device token from the console's
  Stations page. Without it the station builds with WiFi off and works over USB exactly as before.
  Env `feather_esp32s3_shore_link_check` builds with dummy values so CI links the network code.
- **Footprint** with WiFi on: RAM 26.7 %, flash 64.3 % of the app partition.

**Fallbacks stay** (David, 2026-10-28). The S3 still prints every frame over USB, so a computer
can take over the push when the site has no usable WiFi (`shore/scripts/run_receiver.py
--link serial`, [SCO-257](https://linear.app/scout1/issue/SCO-257)), and every reading is on the
buoy's SD card, merged with `shore/scripts/import_sd_card.py` after retrieval.

The station must:

- use **915.0 MHz · BW 500 kHz · SF12 · CR 4/8** (`ModemConfig {0x98, 0xC4, 0x04}`), exactly as
  the buoy's `firmware/src/config.h`;
- apply the **SX1276 500 kHz erratum** on receive (`0x36` ← `0x02`, `0x3A` ← `0x64`;
  [reading note](../hub/research/notes/sx1276-errata-500khz.md)), which the transmit-only buoy
  does not need;
- listen around the slots of each buoy's transmit count, and transmit downlink messages
  (ADR-0008) at ≤ +11 dBm through a ≤ 2.15 dBi antenna;
- if it decodes frames itself, match the 44-byte v4 layout in `firmware/lib/scout_packet/` and
  `shore/scout_shore/packet.py` — the contract `scripts/check_packet_contract.py` enforces.

The bench receiver `firmware/src/bench_rx/` (a second Feather M0) already does the first two
and is the reference for the S3's radio setup. It is a test instrument, not the shore station.

**The Python package [`shore/`](../../shore/) — written and tested, runs on a computer.**
It decodes and validates packets, deduplicates repeated readings, writes the daily CSVs
(`shore/data-live/`), merges a retrieved SD card back in, and feeds the static site that GitHub
Pages publishes today ([Live Dashboard](live-dashboard.md)). On the bench it decodes the bench
receiver's output (`scripts/decode_frames.py`). How it relates to the S3's WiFi push depends on
which dashboard the S3 pushes to (open item 1). Since SCO-198 it also checks each frame against
the slots of the buoy's count (`tx_schedule.py`; `run_receiver.py --tx-count BUOY:COUNT`, counted
as `out_of_window`), carries the downlink frame codec (`downlink.py`, keys from
`SCOUT_CMD_KEY_<id>`), and talks to the team console (`console.py`, `scripts/sync_console.py`:
push readings, pull requested counts) with a device token from `SCOUT_CONSOLE_TOKEN`.

## Data flow

```
Buoys (Feather M0, ×2)                    Shore station (ESP32-S3 + LoRa FeatherWing, FreeRTOS)
  sample every 30 min → SD card              LoRa RX task  ──►  validate + decode
        │                                         ▲                    │
        └── 1-3 slots/day: LoRa TX ───────────────┘                    ▼
            (44-byte packet, 1 copy per slot)                 WiFi task: push to the console
                                                              (written; USB → computer and the
                                                              SD card are the fallbacks)
        ◄── SET_TX_COUNT in the 1 s listen window ──                   ▼
            (built, off by default; firmware OTA not built)    team console (ADR-0012)

   raw audio and the full record stay on each buoy's SD card;
   a retrieved card is merged with shore/scripts/import_sd_card.py
```

## Open items

1. **Bench-test the S3's WiFi push** ([SCO-237](https://linear.app/scout1/issue/SCO-237)):
   written 2026-10-28 against the console's device API
   ([ADR-0012](../decisions/0012-authenticated-console.md)). Still open: a frame from the bench
   buoy showing up on the console end to end, NTP and the clock surviving a reset seen on the
   board, and a site WiFi to run it on (item 4). Owner: CS lead.
2. **S3 toolchain:** Arduino core vs ESP-IDF (both give FreeRTOS). Owner: CS lead.
3. **The RFM95W FeatherWing's own FCC authorization**, now that the station transmits (ADR-0008).
   **Blocks switching on the SCO-198 downlink off the bench.** Owner: CS lead.
4. **WiFi and power at each site** (Monterey or Santa Cruz test, Hawaii yacht-club slip). Owner:
   CS + GENG.
5. **Downlink protocol** (listen windows, chunking, authentication, rollback):
   [SCO-197](https://linear.app/scout1/issue/SCO-197). The settings slice is built (SCO-198);
   the listen window's real current and timing and the downlink range are unmeasured, and the
   window needs Isabella's sign-off.
6. **A battery-backed clock for the shore station?** After a power cut with no WiFi, the S3's
   clock is unset until NTP or USB sets it, so slot-window tags read `unknown` and the downlink
   holds off; readings are unaffected. An RTC add-on (e.g. a PCF8523 or DS3231 FeatherWing) would
   close the gap. Owner: ECE (Isabella) to decide.

## Timeline

Phase 2 (System Integration, 2026-10-22 – 2026-12-06): bring up reception on the S3
([SCO-24](https://linear.app/scout1/issue/SCO-24), due 2026-10-30) after the bench link test
([SCO-155](https://linear.app/scout1/issue/SCO-155)). MVP target 2026-12-04: a packet reaches
the shore station.
