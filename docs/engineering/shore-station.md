# Shore Station (Raspberry Pi)

> **Summary** — The shore-side base station that receives, validates, stores, and analyzes the
> buoy's data. It is a **Raspberry Pi** with a LoRa radio, and it is the canonical home for
> Raspberry Pi in S.C.O.U.T. This page is the reference for what the Pi does and how it fits the
> system.

---

## Where the Raspberry Pi is used

**The Raspberry Pi is the shore station — and the only Pi in the system.** To avoid confusion:

| Node | Compute | Not |
|---|---|---|
| **Buoy** | Adafruit **Feather M0** (SAMD21), per [ADR-0001](../decisions/0001-mcu-and-radio-selection.md) | ❌ not a Pi |
| **Shore station** | **Raspberry Pi** + LoRa radio | — |
| **Analytics host** | The Pi can run the Python [`analytics/`](../../analytics) pipeline, or a dev laptop can | — |

"Use a Raspberry Pi wherever relevant" means: **the shore station, and optionally the analytics
runtime.** The buoy stays a low-power microcontroller — a Pi would not survive the power budget.

## Role

The shore station is the ground end of the LoRa link. Per
[EDD §10](engineering-design-document.md) and the
[MVP System Overview](../overview/mvp-system-overview.md), it is responsible for:

1. **LoRa reception** — listen for the buoy's daily packet.
2. **Packet validation & decode** — parse the packet per the packet-format contract, check the
   counter/CRC, drop malformed frames.
3. **Storage** — append each decoded reading to a CSV following the
   [On-Board CSV Data Schema](data-schema.md), so shore data and on-buoy data share one format.
4. **Archival** — keep the full history; back up off the SD card.
5. **Analytics** — run trend/quality checks; host the acoustic pipeline when SD cards are
   physically retrieved (audio is **never** transmitted — see below).
6. **Visualization** — dashboards/plots of temperature, turbidity, battery, packet-loss.
7. **Optional cloud sync & future ML/anomaly detection.**

## Hardware

| Item | Notes |
|---|---|
| Raspberry Pi | Model TBD — a Pi 4 or Pi Zero 2 W is enough for RX + storage; a Pi 4 is better if it also runs the audio pipeline. **Open — see below.** |
| LoRa radio for the Pi | Must match the buoy: **RFM95 / SX1276, 915 MHz** (US ISM). Candidates: Adafruit RFM95W LoRa Radio Bonnet (RFM95W + Pi header) or a Dragino LoRa HAT. **Open — see below.** |
| Antenna | 915 MHz; height/placement drives range (Phase 4 range test). |
| Power | Mains at a shore building, or a small solar + battery kit for a remote shore point. |
| Storage | SD card for the OS; the data CSV/archive should also be backed up off-card. |

## Software

- **Language: Python**, matching [`analytics/`](../../analytics) so the receiver, storage, and
  analysis share one runtime.
- **LoRa driver:** an RFM9x library such as `adafruit-circuitpython-rfm9x` or `pyLoRa`.
- **Packet decoder:** must **mirror the firmware's packet encoder** — same field order, units,
  and byte layout. This is a contract; define it once and keep the two in sync (see
  [`firmware/README.md`](../../firmware/README.md)).
- **Store:** decoded readings → CSV per [data-schema.md](data-schema.md). Same schema as the
  buoy's on-board log, so both feed the same analytics.

## Data flow

```
Buoy (Feather M0)                         Shore Station (Raspberry Pi)
  sample → log to SD                         LoRa RX  ──►  decode + validate packet
        │                                                        │
        └── 1×/day: LoRa TX  ────────────────────────►          ▼
            (summary packet)                          append to CSV (data-schema)
                                                                 │
   raw audio stays on the buoy's SD card                         ▼
   (retrieved physically, not transmitted)          analytics: trends · quality · plots
```

Raw audio is **stored on the buoy and never transmitted** (bandwidth-infeasible over LoRa). The
acoustic pipeline runs on retrieved SD cards, on the Pi or a laptop; only summarized telemetry
crosses the LoRa link.

## Timeline

Set-up and use are scheduled in the [Team Timeline](../planning/team-timeline.md):
Phase 1 (LoRa RX function on the Pi), Phase 3 (Pi + LoRa HAT, end-to-end reception; dashboard),
Phase 5–6 (Pi shore station stood up at the Hawaii site, live monitoring).

## Open items

- **Pi model** — Pi 4 vs Pi Zero 2 W. Depends on whether the Pi also runs the audio pipeline
  and on power availability at the shore point. Owner: CS lead.
- **LoRa HAT/bonnet selection** — must be RFM95/SX1276 915 MHz to match the buoy. Owner: CS lead
  with ECE input.
- **Remote access & power** at the Hawaii shore point — network for monitoring, and mains vs
  solar. Owner: CS + GE.
- **Cloud sync** — deferred; local-first for the capstone.
