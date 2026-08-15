# Project Status — Current

> **Summary** — The current state of every subsystem in one place. This is the source of truth
> the [README status table](../../README.md#status) reflects. Updated whenever a subsystem's
> state changes; a dated history of these snapshots lives in [`journal/`](journal/).
>
> Part of the [Knowledge Hub](README.md). **As of 2026-08-15.**

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
| Environmental telemetry pipeline | ✅ Working | QC (incl. QARTOD per-channel tests + biofouling drift screen), NOAA CRW DHW + bleaching alerts, trends, turbidity ([`analytics/telemetry/`](../../analytics/telemetry/)). SEN0189 polarity corrected pipeline-wide ([SCO-41](https://linear.app/scout1/issue/SCO-41)) | — |
| Live dashboard | 🟢 Deployed | Public multi-page GitHub Pages site + telemetry dashboard, sample data ([live-dashboard](../engineering/live-dashboard.md), [SCO-44](https://linear.app/scout1/issue/SCO-44)). Drift verdict not yet surfaced ([SCO-51](https://linear.app/scout1/issue/SCO-51)) | — |
| Firmware | 🟡 In progress | Phase 1: state machine, drivers, verified packet codec + scheduler, standby sleep, watchdog, adaptive transmission, CR 4/8 + blind repetition. **Target build compiles and is now gated in CI** | Hardware bring-up |
| Shore station | 🟡 In progress | Simulated LoRa→CSV data path (codec, receiver, idempotent store) + tests ([`shore/`](../../shore/)) | Real radio bring-up |
| Electrical design | 🟡 In progress | Build platform decided; wiring/PCB pending | Charging path ([ADR-0002](../decisions/0002-lifepo4-charging-path.md)) |
| Mechanical design | 🟡 In progress | Floatation CAD iterations v1–v9 documented, in-house additive only ([SCO-45](https://linear.app/scout1/issue/SCO-45)); housing dimensions corrected to TBD ([SCO-46](https://linear.app/scout1/issue/SCO-46)) | Final iteration ([SCO-48](https://linear.app/scout1/issue/SCO-48)), housing dimensions ([SCO-49](https://linear.app/scout1/issue/SCO-49)), mooring, biofouling |
| Field deployment | 🔴 Planned | Hawaii, Phase 6 (Mar–May 2027) | Everything upstream |

**Legend:** ✅ Complete · 🟢 Ready/unblocked · 🟡 In progress · 🔴 Not started or early

## What's blocking the most

1. **[ADR-0002](../decisions/0002-lifepo4-charging-path.md)** (LiFePO₄ charging path) — blocks
   power bench bring-up, battery/solar sizing, and firmware battery thresholds.
   [SCO-10](https://linear.app/scout1/issue/SCO-10)
2. **Hydrophone part number** (H2a-XLR vs H2dM) — blocks the audio front-end and BOM order.
   [SCO-8](https://linear.app/scout1/issue/SCO-8)
3. **Dissolved oxygen decision** — blocks closing the V1 sensor list.
   [SCO-11](https://linear.app/scout1/issue/SCO-11)
4. **SEN0189 analog front end must be non-inverting** — an inverting stage would silently
   invert every downstream turbidity interpretation with no error anywhere.
   [SCO-47](https://linear.app/scout1/issue/SCO-47)

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
