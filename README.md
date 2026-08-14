# S.C.O.U.T.

**Santa Clara Oceanic Utilities Transmitter** — a low-cost, solar-powered marine buoy for
long-term coral reef and nearshore water quality monitoring.

Santa Clara University · Senior Design Capstone · 2026–2027

---

## What SCOUT is

Coral reefs are among the most threatened ecosystems on Earth, and the instruments used to
monitor them are expensive and rarely serviced. Existing monitoring buoys cost tens of
thousands of dollars, and researchers interviewed for this project described sites where data
is physically retrieved only every few years.

SCOUT is a small, modular, solar-powered buoy designed to be deployed adjacent to shallow
reefs and left alone. It samples water temperature, turbidity, and reef soundscapes,
stores everything locally, and transmits a summarized daily packet to a shore station over
LoRa radio — no cellular service or internet required at the buoy.

**Design priorities:** affordable · durable · low power · modular · minimal maintenance ·
scalable to many buoys across many sites.

**Target:** autonomous operation for 1+ year deployments at a total system cost well below
the $5,000 figure researchers identified as the practical ceiling.

### What makes it different

Stakeholder interviews with three NOAA coral reef researchers pointed consistently at the
same gap: the highest-value contribution is not replacing existing monitoring systems, but
providing **affordable, accessible ground-truth measurements** — particularly in shallow
nearshore water, where satellite products degrade badly due to bottom reflectance and coastal
complexity. See [Stakeholder Interviews](docs/research/stakeholder-interviews.md).

---

## Status

| Subsystem | Status |
|---|---|
| Stakeholder research | ✅ Complete — 3 NOAA researchers interviewed |
| System architecture | ✅ Complete — [Engineering Design Document v0.2](docs/engineering/engineering-design-document.md) |
| Mechanical design | 🟡 In progress — enclosure and hull concepts developed |
| Electrical design | 🟡 In progress — components selected, **MCU/radio contested** |
| Firmware | 🔴 Not started — blocked on [ADR-0001](docs/decisions/0001-mcu-and-radio-selection.md) |
| Acoustic analysis pipeline | ✅ Working — validated on 8 sessions of reef recordings |
| Shore station | 🔴 Not started |
| Field deployment | 🔴 Planned — Hawaii, Phase 6 (Jan–Mar 2027) |

**Most urgent open decision:** the microcontroller and LoRa radio are specified inconsistently
across documents, and this blocks PCB layout, firmware toolchain selection, and power budget
verification. See [ADR-0001](docs/decisions/0001-mcu-and-radio-selection.md).

---

## Team

| Member | Discipline | Role |
|---|---|---|
| Isabella Rodriguez | ECEN | Hardware lead — electrical design, PCB, power system |
| John Ryan Myrdal | GENG | Field & mechanical lead — buoy structure, deployment |
| David Chousal Cantu | CSEN | Software lead — firmware, data pipeline, shore station |

**Faculty advisors:** Jes Kuczenski · Navid Shaghaghi

---

## Repository layout

```
S.C.O.U.T./
├── docs/           All project documentation (Notion-compatible Markdown)
│   ├── overview/       Project vision, MVP definition, status updates
│   ├── engineering/    Design document, sensor selection, architecture
│   ├── research/       Stakeholder interviews, decision matrix
│   ├── analysis/       Bioacoustic methodology and citations
│   ├── planning/       Timeline, meeting notes, administrative
│   └── decisions/      Architecture Decision Records
├── analytics/      Coral bioacoustic analysis pipeline (Python) — implemented
├── firmware/       Buoy embedded software — not yet started
├── hardware/       Schematics, PCB, wiring diagrams — not yet started
├── mechanical/     CAD, hull design, mooring specs — not yet started
├── assets/         Diagrams and presentations
└── data/           Raw audio archive (excluded from git — see Data below)
```

Each subsystem directory has its own README describing scope, current status, and what
it is blocked on.

---

## Quick start

The analytics pipeline is the only runnable component today.

```bash
cd analytics
pip install -r requirements.txt

# Analyze the committed sample session
python run_pipeline.py --audio_dir data/longitudinal/201708_20170801 \
                       --output data/processed/results.csv
```

This computes five bioacoustic indices per recording, derives a PCA-based health score, and
writes a dashboard figure. See [`analytics/README.md`](analytics/README.md) for longitudinal
trend analysis and site comparison.

---

## System architecture

```
   ┌─────────────────────────── BUOY ───────────────────────────┐
   │                                                            │
   │  Solar panel ──► MPPT charger ──► LiFePO₄ battery          │
   │                                        │                   │
   │                                        ▼                   │
   │  Temperature (DS18B20 ×3) ──┐    Microcontroller           │
   │  Turbidity  (SEN0189 ×3) ───┼──►  duty-cycle state machine │
   │  Hydrophone (Aquarian) ─────┘     sleep / sense / log / TX │
   │                                        │                   │
   │                          Onboard flash ┤                   │
   │                                        ▼                   │
   │                                   LoRa radio               │
   └────────────────────────────────────────┼───────────────────┘
                                            │  82-byte packet, 1×/day
                                            ▼
                        ┌─────────── SHORE STATION ───────────┐
                        │  Raspberry Pi receiver              │
                        │  Packet validation → storage        │
                        │  Statistical processing             │
                        │  Future: dashboards, cloud, ML      │
                        └─────────────────────────────────────┘
```

**Sensing.** Sensors are distributed down a vertical string at multiple depths, enabling
measurement of thermal and turbidity stratification while the electronics bay stays sealed
above the waterline. See [Sensor String Architecture](docs/engineering/sensor-string-architecture.md).

**Power.** The system sleeps most of the time, waking on an RTC alarm to sample, log, and
periodically transmit. Under sustained cloud cover it degrades gracefully: transmission
frequency drops first, local logging continues, and nonessential sensing pauses before core
operation is compromised.

**Communications.** A single summarized 82-byte packet per day. Raw audio is **stored onboard
and never transmitted** — moving waveform data over LoRa is not bandwidth-feasible, and this
constraint is baked into the design.

---

## The acoustic pipeline

The [`analytics/`](analytics/README.md) pipeline is the most mature part of the project. It
processes 5-minute hydrophone recordings into reef health indicators using five established
bioacoustic indices (ACI, BI, NDSI, H, ADI), reduces them via PCA to a single Acoustic
Quality Score, and applies modified Mann-Kendall tests to detect multi-month trends.

It was developed and validated against a published reef acoustic dataset from **Sesoko
Island, Okinawa, Japan** — 8 monthly sessions spanning August 2017 to July 2018 — which
serves as a stand-in until SCOUT collects its own recordings.

Notable design choices, documented in full in
[Coral Bioacoustic Methodology](docs/analysis/coral-bioacoustic-methodology.md):

- A **three-zone frequency model** that carves out a 200–1000 Hz mixed band and excludes it
  from NDSI, because the conventional two-way split misclassified reef fish choruses as
  anthropogenic noise.
- **Session-local PCA** for health scoring, with a separately fit global PCA for longitudinal
  trend detection — scores are explicitly not comparable across sessions.
- **Median aggregation** and an **abiotic contamination filter** to stay robust against
  wind- and rain-contaminated recordings at 1.5 m depth.

---

## Data

The raw audio archive is roughly 7 GB and is **not tracked in git**.

| What | Where | Tracked |
|---|---|---|
| Sample session (5 × 5-min WAV, ~252 MB) | `analytics/data/longitudinal/201708_20170801/` | ✅ Yes — so the pipeline is runnable on clone |
| Full 8-session archive | `analytics/data/longitudinal/` | ❌ Excluded by size |
| Bulk raw archive | `data/` | ❌ Excluded by size |
| Generated results and figures | `analytics/data/processed/` | ✅ Yes |

The full dataset is publicly available from its original authors — see the dataset citation
in [Coral Bioacoustic Methodology](docs/analysis/coral-bioacoustic-methodology.md#data-sources).
`analytics/utils/download_sesoko.py` assists with retrieval.

**Known gap:** session `201807` has 4 of 5 files; one recording failed to download. The
pipeline handles short sessions by taking the median of what is present.

---

## Documentation

Full index at [`docs/README.md`](docs/README.md). All documentation is Notion-compatible
Markdown and can be imported directly.

| Document | Why you'd read it |
|---|---|
| [MVP System Overview](docs/overview/mvp-system-overview.md) | What SCOUT is and what it must do |
| [Engineering Design Document](docs/engineering/engineering-design-document.md) | The authoritative technical baseline — 22 sections including full BOM |
| [Stakeholder Interviews](docs/research/stakeholder-interviews.md) | What reef researchers actually need |
| [Coral Bioacoustic Methodology](docs/analysis/coral-bioacoustic-methodology.md) | The science behind the acoustic analysis |
| [Team Timeline](docs/planning/team-timeline.md) | Phase 0–6 plan through Hawaii deployment |
| [Decision Records](docs/decisions/README.md) | Significant open and settled decisions |

---

## Known inconsistencies

Surfaced during the August 2026 documentation audit and **not yet resolved**. Recorded here
rather than silently reconciled, since resolving each requires a team decision.

| Issue | Detail |
|---|---|
| **MCU and radio** | ESP32-C3 + SX1262 (design doc) vs Feather M0 + RFM95 (timeline, recent discussion) — [ADR-0001](docs/decisions/0001-mcu-and-radio-selection.md) |
| **Deployment depth** | 5–8 m (MVP overview) vs ~30 m annotated (sensor string diagram) |
| **LoRa range** | ~100 yards vs ~2 km vs 15–20 km across documents — needs one measured figure over saltwater |
| **Hydrophone part** | Aquarian H2a-XLR (diagram) vs H2dM (BOM) |
| **Academic year** | 2025–2027 vs 2026–2027 |
| **Project name** | "Oceanic **Utilities** Transmitter" is used across design documents; "Utility" appears occasionally. This README uses "Utilities" |

---

## Related

- Team repository: [github.com/irodriguez-17/SCOUT](https://github.com/irodriguez-17/SCOUT)
- Project proposal deck: [`assets/presentations/SCOUT-Proposal.pptx`](assets/presentations/)

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 David Chousal Cantu,
Isabella Rodriguez, John Ryan Myrdal.
