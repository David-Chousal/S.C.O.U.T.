# Project Status — Current

> **Summary** — The current state of every subsystem in one place. This is the source of truth
> the [README status table](../../README.md#status) reflects. Updated whenever a subsystem's
> state changes; a dated history of these snapshots lives in [`journal/`](journal/).
>
> Part of the [Knowledge Hub](README.md). **As of 2026-08-31.**

---

## Phase

**Phase 0 — Kickoff** (2026-08-14 – 2026-09-20), In Progress. Holds the open design-alignment
decisions; nothing downstream starts until those land. Full plan:
[Team Timeline](../planning/team-timeline.md).

## Subsystems

| Subsystem | Status | Detail | Blocked on |
|---|---|---|---|
| Stakeholder research | ✅ Complete | 3 NOAA researchers interviewed | — |
| System architecture | ✅ Complete | [EDD v0.2](../engineering/engineering-design-document.md) | — |
| Acoustic analysis pipeline | ✅ Working | Validated on 8 Sesoko sessions | — |
| Environmental telemetry pipeline | ✅ Working | QC (incl. QARTOD per-channel tests + biofouling drift screen), NOAA CRW DHW + bleaching alerts, trends, turbidity ([`analytics/telemetry/`](../../analytics/telemetry/)). SEN0189 polarity corrected pipeline-wide ([SCO-41](https://linear.app/scout1/issue/SCO-41)) | — |
| Live dashboard | 🟢 Deployed | Public multi-page GitHub Pages site + telemetry dashboard, sample data ([live-dashboard](../engineering/live-dashboard.md), [SCO-44](https://linear.app/scout1/issue/SCO-44)). Biofouling drift verdict surfaced as a status card + a rationale note under the turbidity chart ([SCO-51](https://linear.app/scout1/issue/SCO-51)) | — |
| Ask S.C.O.U.T. chat | 🟢 Live | "Fred" widget backed by a Cloudflare Worker proxy (`scout-chat.scout1.workers.dev`, Groq key as a Worker secret); answers from the published `chat-context.txt` ([chatbot/README](../../chatbot/README.md)) | — |
| Firmware | 🟡 In progress | Phase 1: state machine, drivers, verified packet codec + scheduler, standby sleep, watchdog, adaptive transmission, CR 4/8 + blind repetition. **Target build compiles and is now gated in CI** | Hardware bring-up |
| Shore station | 🟡 In progress | Simulated LoRa→CSV data path (codec, receiver, idempotent store) + tests ([`shore/`](../../shore/)) | Real radio bring-up, base-station node architecture ([SCO-86](https://linear.app/scout1/issue/SCO-86)) |
| Electrical design | 🟡 In progress | Rev A schematic merged, ERC-clean, and has undergone pre-hardware schematic and integration verification against manufacturer documentation (not physical testing). PID 6106's system rail confirmed as a regulated 5 V via a TPS61023 boost stage (corrects an earlier ~4.5 V assumption). SEN0189 non-inverting divider verified (math + datasheet); firmware's `PIN_TURBIDITY` corrected from an unconnected `A0` to the schematic's actual `A1` ([SCO-85](https://linear.app/scout1/issue/SCO-85), merged via [PR #103](https://github.com/David-Chousal/S.C.O.U.T./pull/103)). Two new tracked gaps: battery-voltage telemetry doesn't currently measure the Rev A pack ([SCO-83](https://linear.app/scout1/issue/SCO-83)), and the battery connector needs a physical polarity check before first connection ([SCO-84](https://linear.app/scout1/issue/SCO-84)). Acoustic sensing is intentionally deferred to a later revision, not a Rev A gap. Bring-up parts order in progress | Charging path/chemistry ratification ([ADR-0002](../decisions/0002-lifepo4-charging-path.md), [SCO-10](https://linear.app/scout1/issue/SCO-10)); hydrophone/interface direction ([SCO-8](https://linear.app/scout1/issue/SCO-8)); physical assembly and bench validation; parts arrival ([SCO-88](https://linear.app/scout1/issue/SCO-88)) |
| Mechanical design | 🟡 In progress | **All five CAD categories documented** ([SCO-50](https://linear.app/scout1/issue/SCO-50)): floatation, electronics housing, sensor pod, stem, solar mount — 49 STEP/PDF exports from the live Onshape document, in-house additive only. ADR-0003 reaffirmed against the pod design ([SCO-52](https://linear.app/scout1/issue/SCO-52)). O-ring manufacturing method, reef-safe anchoring/mooring approach, and biofouling mitigation (Sea Hawk Smart Solution coating) all decided ([SCO-55](https://linear.app/scout1/issue/SCO-55), [ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md), [SCO-15](https://linear.app/scout1/issue/SCO-15)). **Floatation family chosen** — bolted wedge + bottom caps, first FEA pass complete (min safety factor 25.4, now read as over-engineered), cross-section fit-test print confirms chassis fit. **All five printed parts now have real slicer-measured weights (2026-08-24)** — whole shell system ~5.49 kg, ~38.9 L displacement, ~337.6 N net reserve buoyancy; see [mass-and-buoyancy-budget.md](../engineering/buoy-structural/mass-and-buoyancy-budget.md) and [mechanical/test/](../../mechanical/test/README.md). **Chassis cap + wedge cap added 2026-08-20** — first pass at the cable-gland cap revision, cable routing and cap OD still open ([SCO-53](https://linear.app/scout1/issue/SCO-53)). **Simulated design panel review completed 2026-08-21** — overall architecture confirmed (8.0/10), proceed to detailed design with no redesign; structural chassis definition (5.0/10) and the mooring U-bolt/backing-plate load path flagged as the priority gaps before a structural freeze ([Buoy Preliminary Design Panel Review](../engineering/reviews/buoy-preliminary-design-panel-review-2026-08.md)) **First waterproofing submersion test, 2026-08-24** — PLA sensor housing + TPU-printed O-ring passed ~30 hr submerged; PETG (low print quality) and the electronics housing (no bolt-joint washers on the article tested, though washers are the documented spec) both failed; see [`mechanical/test/waterproofing-submersion-test-2026-08-24.md`](../../mechanical/test/waterproofing-submersion-test-2026-08-24.md). **Electronics housing packing analysis, 2026-08-25** — real Rev A component dimensions computed against three cylindrical layouts; recommends ~⌀100 mm × 110–130 mm, fits the existing ~4" PVC reference; see [Electronics Housing Packing Budget](../engineering/electronics-housing-packing-budget.md). **Whole-buoy mass / freeboard model + FEA design loads, 2026-08-29** ([SCO-74](https://linear.app/scout1/issue/SCO-74), [SCO-73](https://linear.app/scout1/issue/SCO-73) partial) — as-deployed mass ~8.40 kg nominal, net reserve ~309 N, **nominal draft 2.69 in / 7.31 in freeboard; the buoy is substantially over-floated** (~9% of the float section wetted, ~4.75:1 margin). Fusion FEA load set computed at a *proposed* (not signed-off) environmental design set: LC2 uplift +322 N, LC5 wave+current ~440 N, LC8 hydrostatic 50.3 kPa, LC9 snap ~810 N; see [Buoy Mass, Displacement, and Freeboard Model](../engineering/buoy-structural/buoy-mass-displacement-and-freeboard-model.md) and [Force Budget](../engineering/buoy-structural/force-budget.md). **LC3–LC9 plus service-mooring FEA runs executed, 2026-08-30** ([SCO-73](https://linear.app/scout1/issue/SCO-73)) — LC6/LC9 low safety factors read as stand-in-ring meshing artifacts rather than real structural findings, and are tracked as such. **Turbidity sensor housing remodelled to a face seal, 2026-08-30**; the seal itself is not yet validated ([SCO-91](https://linear.app/scout1/issue/SCO-91)) **Electronics housing static face-seal clamp, 2026-09-02** ([SCO-68](https://linear.app/scout1/issue/SCO-68)) — new clamp + lid pair with the 6 fasteners moved **outside** the AS568-043 O-ring boundary (Ø104.14 mm bolt circle vs. Ø91.69 mm groove OD), groove sized to the standard ring (22.9 % squeeze, 75 % fill), and reinforced land-to-land seal faces; closes the design panel review's "fasteners inside the O-ring boundary" finding. Printed and found to have slight O-ring tolerance trouble — **reprint pending, no submersion re-test yet**. Lid carries engraved identifying text (wording to confirm); lid clearance holes not cut as exported. Sensor pod sealed-cap spigot also re-cut Ø31.75 → Ø31.496 mm; see [`mechanical/cad/electronics-housing/README.md`](../../mechanical/cad/electronics-housing/README.md#static-face-seal-clamp--2026-09-02) | Impact/boat-strike survivability testing — FEA + bench ([SCO-71](https://linear.app/scout1/issue/SCO-71)), buoyancy check + PDF-drawing reconciliation on floatation ([SCO-48](https://linear.app/scout1/issue/SCO-48)), propeller-resistant tether line ([SCO-72](https://linear.app/scout1/issue/SCO-72)), housing dimensions ([SCO-49](https://linear.app/scout1/issue/SCO-49)), cap cable gland ([SCO-53](https://linear.app/scout1/issue/SCO-53)), chassis top section — sealing/service access ([SCO-68](https://linear.app/scout1/issue/SCO-68)), mooring attachment hardware ([SCO-69](https://linear.app/scout1/issue/SCO-69)), stem/solar refinement ([SCO-54](https://linear.app/scout1/issue/SCO-54)), print material ([SCO-64](https://linear.app/scout1/issue/SCO-64)), reprint the face-seal clamp and run a submersion re-test of the new sealing joint (clamp + remodelled sensor pod) |
| Field deployment | 🔴 Planned | Hawaii, Phase 6 (Mar–May 2027) | Everything upstream |

**Legend:** ✅ Complete · 🟢 Ready/unblocked · 🟡 In progress · 🔴 Not started or early

## What's blocking the most

1. **Electronics component list and dimensions** — the largest single dependency on the board.
   Seven mechanical issues sit `Blocked` behind it: it gates housing dimensions
   ([SCO-49](https://linear.app/scout1/issue/SCO-49)), which gate the floatation buoyancy check
   ([SCO-48](https://linear.app/scout1/issue/SCO-48)), the FEA load cases
   ([SCO-73](https://linear.app/scout1/issue/SCO-73)), the chassis load path
   ([SCO-75](https://linear.app/scout1/issue/SCO-75)), stability
   ([SCO-80](https://linear.app/scout1/issue/SCO-80)), failure-case buoyancy
   ([SCO-81](https://linear.app/scout1/issue/SCO-81)), and the cap cable gland
   ([SCO-53](https://linear.app/scout1/issue/SCO-53)).
   [SCO-70](https://linear.app/scout1/issue/SCO-70)
2. **[ADR-0002](../decisions/0002-lifepo4-charging-path.md)** (LiFePO₄ charging path) — blocks
   power bench bring-up, battery/solar sizing, and firmware battery thresholds.
   [SCO-10](https://linear.app/scout1/issue/SCO-10)
3. **Rev A bring-up parts have not arrived** — firmware driver validation
   ([SCO-25](https://linear.app/scout1/issue/SCO-25)) and shore-station radio bring-up
   ([SCO-24](https://linear.app/scout1/issue/SCO-24)) are both written and waiting on hardware.
   [SCO-88](https://linear.app/scout1/issue/SCO-88)
4. **Hydrophone part number** (H2a-XLR vs H2dM) — blocks the audio front-end and BOM order.
   [SCO-8](https://linear.app/scout1/issue/SCO-8)
5. **SEN0189 analog front end must be non-inverting** — an inverting stage would silently
   invert every downstream turbidity interpretation with no error anywhere. The Rev A divider
   has been verified on paper ([SCO-85](https://linear.app/scout1/issue/SCO-85)); the front-end
   design itself is still open. [SCO-47](https://linear.app/scout1/issue/SCO-47)

The dissolved-oxygen scope call ([SCO-11](https://linear.app/scout1/issue/SCO-11)) is closed —
deferred past V1.5 — and no longer blocks the V1 sensor list.

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
