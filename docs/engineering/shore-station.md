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
| 2026-10-16 | FCC: a receive-only shore antenna is uncapped, but **whatever the shore transmits through must stay within the module limits (≤ 2.15 dBi)** | [FCC Review Brief](../research/fcc-review-brief.md#outcome--reviewed-2026-10-16) |

## Role

1. **LoRa reception** from every buoy, matching their radio settings exactly.
2. **Packet validation and decode** against the 30-byte packet contract (CRC, version).
3. **Push to the dashboard over WiFi.**
4. **Downlink (ADR-0008):** send firmware images and settings to the buoys in their listen windows.
5. **Serve more than one buoy** (two planned), deduplicating each buoy's blind repeats on
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

**On the S3 — not written.** It must:

- use **915.0 MHz · BW 500 kHz · SF12 · CR 4/8** (`ModemConfig {0x98, 0xC4, 0x04}`), exactly as
  the buoy's `firmware/src/config.h`;
- apply the **SX1276 500 kHz erratum** on receive (`0x36` ← `0x02`, `0x3A` ← `0x64`;
  [reading note](../hub/research/notes/sx1276-errata-500khz.md)), which the transmit-only buoy
  does not need;
- listen around the slot table, and later transmit downlink messages (ADR-0008) at ≤ +11 dBm
  through a ≤ 2.15 dBi antenna;
- if it decodes frames itself, match the 30-byte layout in `firmware/lib/scout_packet/` and
  `shore/scout_shore/packet.py` — the contract `scripts/check_packet_contract.py` enforces.

The bench receiver `firmware/src/bench_rx/` (a second Feather M0) already does the first two
and is the reference for the S3's radio setup. It is a test instrument, not the shore station.

**The Python package [`shore/`](../../shore/) — written and tested, runs on a computer.**
It decodes and validates packets, deduplicates the blind repeats, writes the daily CSVs
(`shore/data-live/`), merges a retrieved SD card back in, and feeds the static site that GitHub
Pages publishes today ([Live Dashboard](live-dashboard.md)). On the bench it decodes the bench
receiver's output (`scripts/decode_frames.py`). How it relates to the S3's WiFi push depends on
which dashboard the S3 pushes to (open item 1).

## Data flow

```
Buoys (Feather M0, ×2)                    Shore station (ESP32-S3 + LoRa FeatherWing, FreeRTOS)
  sample every 30 min → SD card              LoRa RX task  ──►  validate + decode
        │                                         ▲                    │
        └── 3 slots/day: LoRa TX ─────────────────┘                    ▼
            (30-byte packet, 3 copies)                        WiFi task: push to the dashboard
                                                                       │
        ◄── downlink in listen windows (ADR-0008, not built) ──        ▼
            firmware images, settings                          dashboard (back end: open item 1)

   raw audio and the full record stay on each buoy's SD card;
   a retrieved card is merged with shore/scripts/import_sd_card.py
```

## Open items

1. **Which dashboard the S3 pushes to, and in what form.** The meetings agree the S3 pushes to
   the dashboard over WiFi, but not what receives it. Today's dashboard is a static GitHub Pages
   site rebuilt from CSVs committed in `shore/data-live/`, which has no endpoint to push to; the
   team was told to review Catherine's React + SQL dashboard before building one
   ([SCO-120](https://linear.app/scout1/issue/SCO-120)). Deciding this fixes whether the S3 sends
   raw frames or decoded rows, and whether the Python shore package stays in the live path.
   Owner: CS lead.
2. **S3 toolchain:** Arduino core vs ESP-IDF (both give FreeRTOS). Owner: CS lead.
3. **The RFM95W FeatherWing's own FCC authorization**, now that the station transmits (ADR-0008).
   Owner: CS lead.
4. **WiFi and power at each site** (Monterey or Santa Cruz test, Hawaii yacht-club slip). Owner:
   CS + GENG.
5. **Downlink protocol** (listen windows, chunking, authentication, rollback):
   [SCO-197](https://linear.app/scout1/issue/SCO-197).

## Timeline

Phase 2 (System Integration, 2026-10-22 – 2026-12-06): bring up reception on the S3
([SCO-24](https://linear.app/scout1/issue/SCO-24), due 2026-10-30) after the bench link test
([SCO-155](https://linear.app/scout1/issue/SCO-155)). MVP target 2026-12-04: a packet reaches
the shore station.
