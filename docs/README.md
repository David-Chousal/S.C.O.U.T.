# S.C.O.U.T. Documentation

All project documentation, converted to Notion-compatible Markdown. Every page here can be
imported directly into Notion with formatting intact.

---

## Start here

| If you want to… | Read |
|---|---|
| Know what's true, decided, and where the project stands right now | **[Knowledge Hub](hub/README.md)** |
| Know where a file goes or what to name it | **[Conventions](CONVENTIONS.md)** |
| Understand what S.C.O.U.T. is and why | [MVP System Overview](overview/mvp-system-overview.md) |
| See the full technical design | [Engineering Design Document](engineering/engineering-design-document.md) |
| Know what researchers actually need | [Stakeholder Interviews](research/stakeholder-interviews.md) |
| Find the schedule | [Team Timeline](planning/team-timeline.md) |
| See what's still undecided | [Decision Records](decisions/README.md) |

---

## Knowledge Hub

The always-current, always-cited surface for what S.C.O.U.T. has decided, learned, and where it
stands. **Start here for any "what's true right now?" question.** Updated on every PR
([CLAUDE.md → Standing rule 7](../CLAUDE.md#standing-rules)).

| Document | Contents |
|---|---|
| [Hub README](hub/README.md) | Front door — the six surfaces and how they fit together |
| [Canonical Facts](hub/facts.md) | The values every doc must agree with (the anti-drift keystone) |
| [Decision Log](hub/decision-log.md) | Reverse-chron ledger of every decision, linking to its full record |
| [Status](hub/status.md) + [Journal](hub/journal/) | Current subsystem state + dated history |
| [Design Notes](hub/design-notes.md) | Design-iteration narratives — what concepts were tried for a subsystem, and why |
| [Source Registry](hub/research/sources.md) | Every external work cited, with access status and reading notes |
| [Open Research Questions](hub/research/open-questions.md) | What we still need to learn, and what's been asked |

## Overview

High-level project definition and status.

| Document | Contents |
|---|---|
| [MVP System Overview](overview/mvp-system-overview.md) | Project vision, primary mission, sensing payload, power strategy, communications, mechanical design, shore station, long-term vision |
| [Project Update — July 2026](overview/project-update-2026-07.md) | Stakeholder findings, engineering progress, and a proposed broadening of scope toward nearshore environmental monitoring |

## Engineering

Technical design and component specification.

| Document | Contents |
|---|---|
| [Engineering Design Document (v0.2)](engineering/engineering-design-document.md) | **The authoritative technical baseline.** 22 sections: requirements, mechanical/electrical/firmware architecture, component selection, sensor and audio subsystems, communications, storage, operating timeline, energy budget, battery and solar sizing, assumptions, constraints, verification plan, full BOM |
| [Sensor Selection](engineering/sensor-selection.md) | Candidate sensors tiered V1 / V1.5 / future, with cost, interface, power draw, and vendor links |
| [Sensor String Architecture](engineering/sensor-string-architecture.md) | Vertical multi-depth sensor string layout and placement rationale |
| [On-Board CSV Data Schema](engineering/data-schema.md) | The microSD log format — columns, units, timestamps; the firmware ↔ shore-station/analytics contract |
| [Shore Station (Raspberry Pi)](engineering/shore-station.md) | The Raspberry Pi base station — LoRa reception, packet decode, storage, analytics; the canonical Pi reference |
| [Live Dashboard (GitHub Pages)](engineering/live-dashboard.md) | How the shore Pi republishes a self-contained static telemetry dashboard to GitHub Pages — no server |
| [Buoy Structural Engineering](engineering/buoy-structural/) | Load equations, mass/buoyancy budget, force tracking, and print settings — grouped together since they cite each other constantly. See the [folder's own index](engineering/buoy-structural/README.md) for what's inside |
| [Design Panel Reviews](engineering/reviews/) | Panel-review write-ups (raw source PDF + Markdown transcription) of subsystem architecture — currently the [buoy preliminary design panel review](engineering/reviews/buoy-preliminary-design-panel-review-2026-08.md) |

## Research

External input and decision tracking.

| Document | Contents |
|---|---|
| [Stakeholder Interviews](research/stakeholder-interviews.md) | Summer 2026 interviews with three NOAA coral reef researchers; consolidated findings and recommended direction |
| [Market Analysis](research/market-analysis.md) | Is there a market beyond the capstone? Scientific and defence ocean monitoring sized against verifiable sources; what is and is not defensible; and §8, the operational sequence to a profitable company — IP gate, buyer pivot, 24-month plan with kill criteria |
| [Systems Decision Matrix](research/systems-decision-matrix.md) | Master taxonomy of every research and design decision area across all disciplines |

## Analysis

Data science methodology for the acoustic pipeline.

| Document | Contents |
|---|---|
| [Coral Bioacoustic Methodology](analysis/coral-bioacoustic-methodology.md) | Full scientific methodology: index definitions, trend detection, seasonal normalization, disturbance detection, health classification, data sources, limitations, and citations |
| [Environmental Telemetry Methodology](analysis/telemetry-methodology.md) | Temperature/turbidity/battery analysis: QC, daily aggregation, NOAA Coral Reef Watch DHW & bleaching alerts, Mann-Kendall trends, turbidity anomalies, with citations |

Implementation lives in [`analytics/`](../analytics/README.md).

## Planning

Schedule, meetings, and administrative records.

| Document | Contents |
|---|---|
| [Team Timeline](planning/team-timeline.md) | Phase 0–6 work plan from kickoff through Hawaii deployment, with parallel per-discipline tracks |
| [Meeting Notes](planning/meeting-notes.md) | Running team design meeting notes |
| [Signature Page](planning/signature-page.md) | SCU capstone declaration — team members and faculty advisors |

## Decisions

| Document | Contents |
|---|---|
| [Decision Records](decisions/README.md) | Architecture Decision Records — significant, hard-to-reverse choices |

---

## Conventions

**Full reference: [CONVENTIONS.md](CONVENTIONS.md)** — naming, file placement, formats, git,
units, citations, and a teammate FAQ.

The rules that apply specifically to documents in this directory:

- **One H1 per page.** Notion uses it as the page title.
- **Summary callout at the top** of each converted document, naming the original source file.
- **Relative links** between documents so navigation survives both GitHub and Notion import.
- **Tables use GFM pipe syntax** — Notion's importer does not reliably parse HTML tables.
- Source documents were converted from `.docx` via `pandoc -t gfm`, then cleaned. Original
  binaries are not retained; this Markdown is the source of truth. The one exception is
  [`assets/presentations/SCOUT-Proposal.pptx`](../assets/presentations/), kept because slide
  decks convert poorly.

## Known documentation issues

Contradictions found during the August 2026 documentation audit. Resolved items are struck
through with their resolution; the remaining open ones are marked ⏳ with an owner:

| Issue | Detail |
|---|---|
| ✅ ~~MCU and radio conflict~~ | **Resolved** by [ADR-0001](decisions/0001-mcu-and-radio-selection.md) (2026-08-14): Feather M0 + RFM95 build platform, ESP32-C3 + SX1262 future production target |
| ✅ ~~Deployment depth~~ | **Resolved: 2–8 m** max, confirmed against the actual Hawaii site (was 5–8 m). The ~30 m on the sensor-string diagram image is outdated and should be re-exported |
| ✅ ~~LoRa range~~ | **Resolved: ~2 km line of sight** ([Adafruit RFM9x FAQ](https://learn.adafruit.com/adafruit-feather-m0-radio-with-lora-radio-module/radio-range-faq)); ~100 yd / 15–20 km corrected. Actual over-saltwater range to be measured in Phase 4 |
| ✅ ~~Sensor count~~ | **Resolved** by [ADR-0003](decisions/0003-single-point-sensing.md): one sensor per modality deployed; extras are field spares; multi-depth deferred |
| **Hydrophone part** ⏳ | Diagram cites Aquarian H2a-XLR; EDD BOM specifies H2dM. **Owner: Isabella (ECE)** — [SCO-8](https://linear.app/scout1/issue/SCO-8), `Needs Decision` |
| **Dissolved oxygen status** ⏳ | Wanted (meeting notes, interviews), V1.5 in sensor-selection, absent from EDD/BOM. **Owner: Isabella (ECE)** — [SCO-11](https://linear.app/scout1/issue/SCO-11), `Needs Decision` |
| ✅ ~~Academic year~~ | **Resolved: 2026–2027.** No stray 2025–2027 remains in the docs |
| **Audio over LoRa** | EDD states raw audio is stored onboard and never transmitted. Any plan to transmit waveform data contradicts the design baseline and is not bandwidth-feasible |
