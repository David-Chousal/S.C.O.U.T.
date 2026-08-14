# SCOUT Documentation

All project documentation, converted to Notion-compatible Markdown. Every page here can be
imported directly into Notion with formatting intact.

---

## Start here

| If you want to… | Read |
|---|---|
| Know where a file goes or what to name it | **[Conventions](CONVENTIONS.md)** |
| Understand what SCOUT is and why | [MVP System Overview](overview/mvp-system-overview.md) |
| See the full technical design | [Engineering Design Document](engineering/engineering-design-document.md) |
| Know what researchers actually need | [Stakeholder Interviews](research/stakeholder-interviews.md) |
| Find the schedule | [Team Timeline](planning/team-timeline.md) |
| See what's still undecided | [Decision Records](decisions/README.md) |

---

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

## Research

External input and decision tracking.

| Document | Contents |
|---|---|
| [Stakeholder Interviews](research/stakeholder-interviews.md) | Summer 2026 interviews with three NOAA coral reef researchers; consolidated findings and recommended direction |
| [Systems Decision Matrix](research/systems-decision-matrix.md) | Master taxonomy of every research and design decision area across all disciplines |

## Analysis

Data science methodology for the acoustic pipeline.

| Document | Contents |
|---|---|
| [Coral Bioacoustic Methodology](analysis/coral-bioacoustic-methodology.md) | Full scientific methodology: index definitions, trend detection, seasonal normalization, disturbance detection, health classification, data sources, limitations, and citations |

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

Contradictions found during the August 2026 documentation audit that are **not yet resolved**:

| Issue | Detail |
|---|---|
| ✅ ~~MCU and radio conflict~~ | **Resolved** by [ADR-0001](decisions/0001-mcu-and-radio-selection.md) (2026-08-14): Feather M0 + RFM95 build platform, ESP32-C3 + SX1262 future production target |
| **Deployment depth** | MVP overview says 5–8 m max; sensor string diagram annotates ~30 m |
| **LoRa range** | Stated variously as ~100 yards, ~2 km, and 15–20 km across documents |
| **Hydrophone part** | Diagram cites Aquarian H2a-XLR; EDD BOM specifies H2dM |
| **Academic year** | Listed as both 2025–2027 and 2026–2027 |
| **Audio over LoRa** | EDD states raw audio is stored onboard and never transmitted. Any plan to transmit waveform data contradicts the design baseline and is not bandwidth-feasible |
