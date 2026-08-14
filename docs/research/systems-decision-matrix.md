# Systems Research & Decision Matrix

> **Summary** — Master taxonomy of every research and design decision area across all four
> disciplines, used to track ownership, priority, status, and final recommendations.
>
> **Source document** — `Project Description/SCOUT Systems Research & Decision Matrix.xlsx`
>
> **Status** — The source spreadsheet is a **template that has not yet been populated**. The
> decision-area taxonomy below is complete and carried over verbatim; the tracking columns are
> empty and awaiting team input. In Notion this page converts cleanly into a database.

---

## How to use this

Each row is one decision that must be made and recorded. Fill in:

| Field | Meaning |
|---|---|
| **Priority** | `P0` (blocking) · `P1` · `P2` · `P3` |
| **Owner** | Team member accountable for driving the decision |
| **Status** | `Not started` · `In progress` · `Blocked` · `Completed` |
| **Decision deadline** | Date by which the decision blocks downstream work |
| **Dependencies** | Other decisions that must resolve first |
| **Research needed** | What must be learned before deciding |
| **Deliverable** | Artifact produced (doc, test result, trade study) |
| **Links / sources** | Datasheets, papers, vendor pages, prior art |
| **Decision / recommendation** | The final call, once made |

When a decision is significant and hard to reverse, record it as an
[Architecture Decision Record](../decisions/README.md) rather than only as a row here.

---

## Team / system level

| Decision area | Priority | Owner | Status | Decision / recommendation |
|---|---|---|---|---|
| Stakeholder / customer discovery | P0 | | In progress | See [Stakeholder Interviews](stakeholder-interviews.md) |
| Requirements definition | P1 | | In progress | See [Engineering Design Document §2](../engineering/engineering-design-document.md) |
| System architecture | P2 | | In progress | See [Engineering Design Document §3](../engineering/engineering-design-document.md) |
| Trade studies / decision matrices | P3 | | Not started | |
| Risk assessment | | | Not started | |
| Testing & validation plan | | | In progress | See [Engineering Design Document §21](../engineering/engineering-design-document.md) |
| BOM / cost optimization | | | In progress | See [Engineering Design Document §22](../engineering/engineering-design-document.md) |
| Regulatory / environmental constraints | | | Not started | Includes RF band compliance for deployment region |

## General Engineering — mechanical & field

| Decision area | Priority | Owner | Status | Decision / recommendation |
|---|---|---|---|---|
| Buoy geometry & industrial design | | | In progress | Cylindrical waterline, tapered top and bottom |
| Waterproofing / enclosure system | | | In progress | 4" Schedule 40 PVC, O-ring sealed end caps |
| Marine materials | | | Not started | |
| Mooring & anchoring | | | Not started | |
| Biofouling mitigation | | | Not started | Flagged by stakeholders as a major risk |
| Sensor selection | | | In progress | See [Sensor Selection](../engineering/sensor-selection.md) |
| Sensor placement & mechanical integration | | | In progress | See [Sensor String Architecture](../engineering/sensor-string-architecture.md) |
| Manufacturing & scalability | | | Not started | |
| Deployment logistics | | | Not started | Hawaii site, Phase 5–6 |
| Temperature sensor selection | | | Completed | DS18B20 |
| Water quality sensor tradeoff (turbidity vs light) | | | Completed | Turbidity (DFRobot SEN0189) |
| Hydrophone feasibility | | | In progress | Aquarian H2dM — part number differs across docs |
| Reef-safe anchoring strategy | | | Not started | |
| Housing manufacturing method | | | Not started | |

## ECEN — electrical & embedded

| Decision area | Priority | Owner | Status | Decision / recommendation |
|---|---|---|---|---|
| Embedded controller | | | **Open** | See [ADR-0001](../decisions/0001-mcu-and-radio-selection.md) |
| Power system architecture | | | In progress | BQ25570 MPPT + TPS62840 / TPS61299 rails |
| Battery system | | | In progress | LiFePO₄; final sizing pending measured power budget |
| Solar system | | | In progress | Sizing pending measured power budget |
| Charge controller / regulation | | | In progress | BQ25570 |
| Sleep logic / power scheduling | | | In progress | See [Engineering Design Document §12–13](../engineering/engineering-design-document.md) |
| Local data storage | | | In progress | Winbond W25Q02JV QSPI flash |
| Communications (LoRa) | | | **Open** | See [ADR-0001](../decisions/0001-mcu-and-radio-selection.md) |
| Electrical packaging | | | Not started | |
| PCB / wiring architecture | | | Not started | |

## CSEN — software & data

| Decision area | Priority | Owner | Status | Decision / recommendation |
|---|---|---|---|---|
| Shore station architecture | | | Not started | Raspberry Pi receiver assumed |
| Data pipeline | | | In progress | See [`analytics/`](../../analytics/README.md) |
| Database / storage architecture | | | Not started | Currently flat CSV |
| Statistical processing | | | Completed | See [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md) |
| Acoustic processing (hydrophone) | | | In progress | Five-index pipeline implemented; edge port pending |
| Dashboard / visualization | | | In progress | Static matplotlib dashboards implemented |
| Cloud integration | | | Not started | |
| Future ML / predictive analytics | | | Not started | |

## Integration & system testing

| Test area | Priority | Owner | Status | Notes |
|---|---|---|---|---|
| Waterproofing testing | | | Not started | Pressure test at 5 m water equivalent (Phase 5) |
| Power testing | | | Not started | Measured budget replaces analytical estimates |
| Communication / LoRa testing | | | Not started | Range + packet loss over saltwater |
| Sensor accuracy testing | | | Not started | |
| Marine survivability testing | | | Not started | |
| Field deployment testing | | | Not started | Campus pond/pool, Phase 4 |
| Long-duration reliability testing | | | Not started | |
| Failure mode testing | | | Not started | |
| Maintenance testing | | | Not started | |
