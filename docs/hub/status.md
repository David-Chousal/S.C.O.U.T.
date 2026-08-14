# Project Status — Current

> **Summary** — The current state of every subsystem in one place. This is the source of truth
> the [README status table](../../README.md#status) reflects. Updated whenever a subsystem's
> state changes; a dated history of these snapshots lives in [`journal/`](journal/).
>
> Part of the [Knowledge Hub](README.md). **As of 2026-08-14.**

---

## Phase

**Phase 0 — Kickoff** (2026-08-14 – 2026-09-04), In Progress. Holds the open design-alignment
decisions; nothing downstream starts until those land. Full plan:
[Team Timeline](../planning/team-timeline.md).

## Subsystems

| Subsystem | Status | Detail | Blocked on |
|---|---|---|---|
| Stakeholder research | ✅ Complete | 3 NOAA researchers interviewed | — |
| System architecture | ✅ Complete | [EDD v0.2](../engineering/engineering-design-document.md) | — |
| Acoustic analysis pipeline | ✅ Working | Validated on 8 Sesoko sessions | — |
| Environmental telemetry pipeline | ✅ Working | QC, NOAA CRW DHW + bleaching alerts, trends, turbidity ([`analytics/telemetry/`](../../analytics/telemetry/)) | — |
| Live dashboard | 🟢 Deployed | Static GitHub Pages telemetry dashboard, sample data ([live-dashboard](../engineering/live-dashboard.md)) | — |
| Firmware | 🟡 In progress | Phase 1: state machine, drivers, verified packet codec + scheduler, standby sleep, watchdog, adaptive transmission | Hardware bring-up |
| Shore station | 🟡 In progress | Simulated LoRa→CSV data path (codec, receiver, store) + tests ([`shore/`](../../shore/)) | Real radio bring-up |
| Electrical design | 🟡 In progress | Build platform decided; wiring/PCB pending | Charging path ([ADR-0002](../decisions/0002-lifepo4-charging-path.md)) |
| Mechanical design | 🟡 In progress | Enclosure + hull concepts developed; flotation + turbidity-housing drawings in `mechanical/cad/` | Native CAD + STEP exports, mooring, biofouling approach |
| Field deployment | 🔴 Planned | Hawaii, Phase 6 (Mar–May 2027) | Everything upstream |

**Legend:** ✅ Complete · 🟢 Ready/unblocked · 🟡 In progress · 🔴 Not started or early

## What's blocking the most

1. **[ADR-0002](../decisions/0002-lifepo4-charging-path.md)** (LiFePO₄ charging path) — blocks
   power bench bring-up, battery/solar sizing, and firmware battery thresholds.
2. **Hydrophone part number** (H2a-XLR vs H2dM) — blocks the audio front-end and BOM order.
3. **Dissolved oxygen decision** — blocks closing the V1 sensor list.

## Latest decisions

See the [Decision Log](decision-log.md) for the full ledger. Most recent: single-point sensing
adopted ([ADR-0003](../decisions/0003-single-point-sensing.md)), CSV schema v1 defined, and the
Feather M0 + RFM95 build platform confirmed ([ADR-0001](../decisions/0001-mcu-and-radio-selection.md)).

---

## How this page is maintained

Update the table whenever a subsystem changes state, and in the same edit append a dated
snapshot to [`journal/`](journal/) capturing what changed. In a later phase this page will be
**generated** from `git log` + Linear + the ADR index rather than hand-edited — see
[Hub README → Roadmap](README.md#roadmap). Until then, keep it current by hand and never let it
contradict [`facts.md`](facts.md).
