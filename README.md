# S.C.O.U.T.

[![CI](https://github.com/David-Chousal/S.C.O.U.T./actions/workflows/ci.yml/badge.svg)](https://github.com/David-Chousal/S.C.O.U.T./actions/workflows/ci.yml)

**Santa Clara Oceanic Utilities Transmitter** — a low-cost, solar-powered, modular
**nearshore environmental monitoring platform**: one buoy carrying many sensing signals
(temperature, turbidity, dissolved oxygen, and more), with coral-reef health as its first
application.

Santa Clara University · Senior Design Capstone · 2026–2027

---

## What S.C.O.U.T. is

Coral reefs are among the most threatened ecosystems on Earth, and the instruments used to
monitor them are expensive and rarely serviced. Existing monitoring buoys cost tens of
thousands of dollars, and researchers interviewed for this project described sites where data
is physically retrieved only every few years.

S.C.O.U.T. is a small, modular, solar-powered buoy designed to be deployed adjacent to shallow
reefs and left alone. It samples a stack of environmental signals — water temperature and
turbidity today, with dissolved oxygen, light, chlorophyll, and reef soundscapes on the
sensor roadmap — stores everything locally, and transmits a summarized daily packet to a
shore station over LoRa radio, with no cellular service or internet required at the buoy.

It is deliberately built as a **platform, not a single-purpose instrument**: the sensing
payload is modular so the same buoy, power system, and shore link can be re-tasked across
reef monitoring, water-quality tracking, and satellite ground-truthing. Coral reef health is
the first mission, not the boundary. See the
[MVP System Overview](docs/overview/mvp-system-overview.md) and
[Sensor Selection](docs/engineering/sensor-selection.md) for the signal roadmap.

**Design priorities:** affordable · durable · low power · modular · minimal maintenance ·
scalable to many signals, many buoys, and many sites.

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
| Acoustic analysis pipeline | ✅ Working — validated on 8 sessions of reef recordings |
| Environmental telemetry pipeline | ✅ Working — QC, NOAA CRW Degree Heating Weeks + bleaching alerts, trends, and turbidity anomalies ([`analytics/telemetry/`](analytics/telemetry/)) |
| Firmware | 🟡 Phase 1 in progress — state machine, drivers, verified packet codec + scheduler, standby sleep, watchdog, and battery-tiered adaptive transmission; hardware bring-up next ([`firmware/`](firmware/README.md)) |
| Shore station | 🟡 In progress — simulated LoRa→CSV data path (packet codec, receiver, store) with tests ([`shore/`](shore/README.md)); real radio bring-up next |
| Live dashboard | 🟢 Deployed — static [GitHub Pages telemetry dashboard](docs/engineering/live-dashboard.md) (sample data) |
| Ask S.C.O.U.T. chat | 🟢 Live — "Fred" widget backed by a Cloudflare Worker proxy, answers from the published Hub context ([`chatbot/`](chatbot/README.md)) |
| Electrical design | 🟡 In progress — build platform decided ([ADR-0001](docs/decisions/0001-mcu-and-radio-selection.md)); charging path ([ADR-0002](docs/decisions/0002-lifepo4-charging-path.md)) and wiring/PCB pending |
| Mechanical design | 🟡 In progress — all five CAD categories documented ([SCO-50](https://linear.app/scout1/issue/SCO-50)): floatation, electronics housing, sensor/turbidity pod, stem, solar mount, in [`mechanical/cad/`](mechanical/cad/). Open: final floatation design, housing dimensions |
| Field deployment | 🔴 Planned — Hawaii, Phase 6 (Mar–May 2027) |

**Latest decision:** the microcontroller and LoRa radio are now settled — **Feather M0 +
RFM95 (Adafruit 3178)** as the confirmed build platform, with the ESP32-C3 + SX1262 retained
as the future production-PCB target. This unblocks firmware and wiring. See
[ADR-0001](docs/decisions/0001-mcu-and-radio-selection.md).

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
│   ├── hub/            Knowledge Hub — facts, decisions, status, research library
│   ├── overview/       Project vision, MVP definition, status updates
│   ├── engineering/    Design document, sensor selection, architecture, shore station
│   ├── research/       Stakeholder interviews, decision matrix
│   ├── analysis/       Bioacoustic + telemetry methodology and citations
│   ├── planning/       Timeline, meeting notes, administrative
│   └── decisions/      Architecture Decision Records
├── analytics/      Acoustic + environmental-telemetry pipelines (Python) — implemented
├── shore/          Shore-station receiver, store, and packet codec (Python) — simulated path working
├── firmware/       Buoy embedded software (SAMD21/PlatformIO) — Phase 1 in progress
├── hardware/       Schematics, PCB, wiring diagrams — build platform + BOM confirmed, no schematics/PCB files yet
├── mechanical/     CAD, hull design, mooring specs — all five CAD categories documented
├── chatbot/        "Ask S.C.O.U.T." chat widget (Cloudflare Worker + Groq) — deployed
├── assets/         Brand, diagrams, and presentations
├── scripts/        Repo-level helper scripts (e.g. cross-language packet-contract guard)
└── data/           Raw audio archive (excluded from git — see Data below)
```

Each subsystem directory has its own README describing scope, current status, and what
it is blocked on.

---

## Quick start

Several components run today with no hardware: the two analytics pipelines and the shore-station
data path.

**Acoustic pipeline** — five bioacoustic indices → PCA health score → dashboard figure, on the
committed sample session:

```bash
cd analytics
pip install -r requirements.txt
python run_pipeline.py --audio_dir data/longitudinal/201708_20170801 \
                       --output data/processed/results.csv
```

**Shore data path + environmental telemetry** — simulate a buoy, push the packets through the shore
receiver into daily CSVs, then analyze them (QC, NOAA CRW Degree Heating Weeks, trends, turbidity):

```bash
cd shore
pip install -r requirements.txt
python scripts/run_loopback.py --count 48 --out ./data     # sensor sim → encode → receive → store

cd ../analytics
python run_telemetry.py --source ../shore/data --mmm 27.6 --dashboard
```

See [`analytics/README.md`](analytics/README.md) and [`shore/README.md`](shore/README.md) for the
full options, and the [live telemetry dashboard](docs/engineering/live-dashboard.md) for the deployed view.

---

## System architecture

```
   ┌─────────────────────────── BUOY ───────────────────────────┐
   │                                                            │
   │  Solar panel ──► MPPT charger ──► LiFePO₄ battery          │
   │                                        │                   │
   │                                        ▼                   │
   │  Temperature (DS18B20 ×1) ──┐    Microcontroller           │
   │  Turbidity  (SEN0189 ×1) ───┼──►  duty-cycle state machine │
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

**Sensing.** One sensor of each modality is sited at a single point beneath the buoy, with the
electronics bay sealed above the waterline; spare temperature and turbidity units are kept for
field replacement ([ADR-0003](docs/decisions/0003-single-point-sensing.md)). A vertical
multi-depth string — measuring thermal and turbidity stratification — is a documented future
concept, not the current build. See [Sensor String Architecture](docs/engineering/sensor-string-architecture.md).

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
serves as a stand-in until S.C.O.U.T. collects its own recordings.

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

## The environmental telemetry pipeline

Alongside the acoustic work, [`analytics/telemetry/`](analytics/telemetry/) turns the buoy's daily
CSV records into reef-relevant indicators. It quality-controls the series (QARTOD-style range, spike,
flat-line, and gap flags), computes **NOAA Coral Reef Watch thermal-stress metrics** — HotSpot,
Degree Heating Weeks, and the 4/8/12 °C-week bleaching alert levels — detects multi-month temperature
and turbidity trends with modified Mann-Kendall, and flags turbidity anomalies. Run it with
`run_telemetry.py`; the method is written up in
[Environmental Telemetry Methodology](docs/analysis/telemetry-methodology.md), and the external
research behind it (DHW, turbidity, LoRa-over-saltwater) lives in the
[Knowledge Hub research library](docs/hub/research/sources.md).

The [`shore/`](shore/README.md) package closes the loop: a packet codec (byte-identical to the
firmware), a simulated LoRa link with configurable loss and corruption, a receiver, and a daily CSV
store — so the whole buoy → shore → analysis path runs today without hardware.

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
| **[Knowledge Hub](docs/hub/README.md)** | **What's true, decided, and where the project stands right now — the always-current surface** |
| **[Conventions](docs/CONVENTIONS.md)** | **Where files go, what to name them, formats, git, units — start here before adding anything** |
| [MVP System Overview](docs/overview/mvp-system-overview.md) | What S.C.O.U.T. is and what it must do |
| [Engineering Design Document](docs/engineering/engineering-design-document.md) | The authoritative technical baseline — 22 sections including full BOM |
| [Stakeholder Interviews](docs/research/stakeholder-interviews.md) | What reef researchers actually need |
| [Coral Bioacoustic Methodology](docs/analysis/coral-bioacoustic-methodology.md) | The science behind the acoustic analysis |
| [Team Timeline](docs/planning/team-timeline.md) | Phase 0–6 plan through Hawaii deployment |
| [Decision Records](docs/decisions/README.md) | Significant open and settled decisions |

---

## Known inconsistencies

Surfaced during the August 2026 documentation audit. Resolved items are struck through with
their resolution; the remaining open ones are marked ⏳ with an owner. Recorded here rather
than silently reconciled, since resolving each required a team decision.

> The settled values now live in [`docs/hub/facts.md`](docs/hub/facts.md) (canonical) and the
> open ones in [`facts.md` → Open facts](docs/hub/facts.md#open-facts-deliberately-not-settled-yet).
> This table is the historical audit record; `facts.md` is what to check going forward.

| Issue | Detail |
|---|---|
| ~~**MCU and radio**~~ ✅ Resolved | Settled by [ADR-0001](docs/decisions/0001-mcu-and-radio-selection.md): Feather M0 + RFM95 is the build platform; ESP32-C3 + SX1262 is the future production target |
| ~~**Deployment depth**~~ ✅ Resolved | **2–8 m** max, confirmed against the actual Hawaii site (was 5–8 m). The ~30 m on the sensor-string diagram image is outdated — PNG needs re-exporting |
| ~~**LoRa range**~~ ✅ Resolved | Standardized to **~2 km line of sight** ([Adafruit RFM9x FAQ](https://learn.adafruit.com/adafruit-feather-m0-radio-with-lora-radio-module/radio-range-faq)); ~100 yd and 15–20 km figures corrected. Real over-saltwater range still to be measured in Phase 4 |
| ~~**Sensor count**~~ ✅ Resolved | [ADR-0003](docs/decisions/0003-single-point-sensing.md): one sensor per modality deployed; extra DS18B20/SEN0189 are field spares; multi-depth string deferred |
| **Hydrophone part** ⏳ ECE | Aquarian H2a-XLR (diagram) vs H2dM (BOM). **Owner: Isabella (ECE)** — [SCO-8](https://linear.app/scout1/issue/SCO-8), `Needs Decision` |
| **Dissolved oxygen status** ⏳ ECE | Wanted (meeting notes, interviews), V1.5 in sensor-selection, absent from EDD/BOM. **Owner: Isabella (ECE)** — [SCO-11](https://linear.app/scout1/issue/SCO-11), `Needs Decision` |
| ~~**Academic year**~~ ✅ Resolved | **2026–2027**. No stray 2025–2027 remains in the docs |
| ~~**Project name**~~ ✅ Resolved | **"Oceanic Utilities Transmitter"** (plural) — used consistently across all docs; no "Utility" (singular) instances remain |

---

## Related

- Team repository: [github.com/irodriguez-17/S.C.O.U.T.](https://github.com/irodriguez-17/S.C.O.U.T.)
- Project proposal deck: [`assets/presentations/SCOUT-Proposal.pptx`](assets/presentations/)

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 David Chousal Cantu,
Isabella Rodriguez, John Ryan Myrdal.
