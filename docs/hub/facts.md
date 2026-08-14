# Canonical Facts

> **Summary** — The single table of values every other document must agree with. When a doc
> contradicts this page, the doc is wrong — fix the doc, not this page (unless the fact itself
> changed, in which case change it here first and cite the decision that changed it).
>
> Part of the [Knowledge Hub](README.md). This is the keystone: every contradiction the
> August 2026 audit found was a disagreement on one of these values.

---

## How to use this page

- **Reading a doc and something disagrees with this table?** This table wins. File it the way
  [CONVENTIONS.md → Decisions and disagreements](../CONVENTIONS.md#decisions-and-disagreements)
  says — surface it, don't silently reconcile.
- **A fact here actually changed?** Change it here **first**, in the same session, and put the
  source in the last column (an ADR, a measurement, a meeting). Then fix the docs that cite it.
- **Every value carries a source.** A number with no source is a number someone will build a
  power budget on. If it is an unverified estimate, say so in the value.

---

## Identity

| Fact | Canonical value | Source |
|---|---|---|
| Acronym expansion | **Santa Clara Oceanic Utilities Transmitter** (plural "Utilities") | [README](../../README.md) |
| Project type | Nearshore environmental monitoring **platform**, coral reef health as first mission | [MVP System Overview](../overview/mvp-system-overview.md) |
| Program | Santa Clara University · Senior Design Capstone | [README](../../README.md) |
| Academic year | **2026–2027** | [ADR-0001 reconciliation](../decisions/0001-mcu-and-radio-selection.md) |
| Project window | **2026-08-14 – 2027-05-28** | [CLAUDE.md → Projects](../../CLAUDE.md), [Team Timeline](../planning/team-timeline.md) |

## Mission targets

| Fact | Canonical value | Source |
|---|---|---|
| Total system cost | **< $5,000** (practical ceiling from researcher interviews) | [Stakeholder Interviews](../research/stakeholder-interviews.md) |
| Autonomous deployment | **1+ year** unattended | [MVP System Overview](../overview/mvp-system-overview.md) |
| Deployment depth | **5–8 m** max (MVP). The ~30 m on the sensor-string diagram is an outdated image | [ADR-0003](../decisions/0003-single-point-sensing.md) |
| First deployment site | **Hawaii**, Phase 6 (Mar–May 2027) | [Team Timeline](../planning/team-timeline.md) |

## Build platform (settled — see ADR-0001)

| Fact | Canonical value | Source |
|---|---|---|
| MCU + radio (build) | **Feather M0 + RFM95 (Adafruit 3178)** — Arduino SAMD21 core, RadioHead `RH_RF95` | [ADR-0001](../decisions/0001-mcu-and-radio-selection.md) |
| MCU + radio (future production PCB) | **ESP32-C3 + SX1262** — documented target, not the current build | [ADR-0001](../decisions/0001-mcu-and-radio-selection.md) |
| RTC | PCF8523 | [Data Schema](../engineering/data-schema.md) |
| Local flash | Winbond W25Q02JV QSPI | [Systems Decision Matrix](../research/systems-decision-matrix.md) |
| Battery chemistry | **LiFePO₄** (final sizing pending measured power budget) | [ADR-0002](../decisions/0002-lifepo4-charging-path.md) |
| Charge controller | BQ25570 MPPT (charging path itself still open) | [ADR-0002](../decisions/0002-lifepo4-charging-path.md) |
| Enclosure | 4" Schedule 40 PVC, O-ring sealed end caps | [Project Update 2026-07](../overview/project-update-2026-07.md) |

## Sensing (single-point per modality — see ADR-0003)

| Fact | Canonical value | Source |
|---|---|---|
| Temperature | **DS18B20 ×1** (±0.5 °C), 1-Wire; extra units are field spares | [Sensor Selection](../engineering/sensor-selection.md), [ADR-0003](../decisions/0003-single-point-sensing.md) |
| Turbidity | **DFRobot SEN0189 ×1**, analog; extra unit is a field spare | [Sensor Selection](../engineering/sensor-selection.md) |
| Hydrophone | **Aquarian** — ⏳ part number unresolved: H2a-XLR (diagram) vs H2dM (BOM) | [ADR-0003 related gaps](../decisions/0003-single-point-sensing.md) |
| Dissolved oxygen | ⏳ status unresolved — wanted, V1.5 in sensor list, absent from EDD/BOM | [Sensor Selection](../engineering/sensor-selection.md) |
| Multi-depth string | **Deferred** — documented future concept, not the current build | [ADR-0003](../decisions/0003-single-point-sensing.md) |

## Communications & data

| Fact | Canonical value | Source |
|---|---|---|
| LoRa frequency | **915 MHz** (US ISM band) | [EDD](../engineering/engineering-design-document.md) |
| LoRa range | **~2 km line of sight** (Adafruit RFM9x FAQ). Real over-saltwater range TBD in Phase 4 | [ADR-0001 reconciliation](../decisions/0001-mcu-and-radio-selection.md) |
| Daily packet size | **82 bytes**, 1× per day — a summary, not a row dump | [Data Schema](../engineering/data-schema.md), EDD §10/§14 |
| Raw audio over LoRa | **Never transmitted.** Stored onboard in `/AUDIO/`, retrieved physically | [EDD §10](../engineering/engineering-design-document.md) |
| Sample interval | ~30 min wake/sample cycle (turbidity + audio run less often) | [Data Schema](../engineering/data-schema.md) |
| On-board log format | Append-only CSV, one row per wake event, UTC ISO 8601, `schema_version` 1 | [Data Schema](../engineering/data-schema.md) |
| Timestamps | **UTC**, ISO 8601 with trailing `Z` | [Data Schema](../engineering/data-schema.md) |

## Analytics (acoustic pipeline)

| Fact | Canonical value | Source |
|---|---|---|
| Acoustic indices | **5**: ACI, BI, NDSI, H, ADI → PCA → Acoustic Quality Score | [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md) |
| Frequency model | **Three-zone** (0–200 Hz anthropogenic · 200–1000 Hz mixed · biophony above) | [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md) |
| Validation dataset | Sesoko Island, Okinawa, Japan — 8 monthly sessions, Aug 2017 – Jul 2018, 1.5 m depth | [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md#data-sources) |
| Trend test | Modified Mann-Kendall (Hamed & Rao 1998) via `pyMannKendall` | [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md) |

---

## Open facts (deliberately not settled yet)

These are **not** canonical values — they are known gaps tracked so nobody treats a placeholder
as settled. Each should have a Linear issue and, when resolved, become a row above.

| Open fact | Why it's open | Owner |
|---|---|---|
| Hydrophone part number | H2a-XLR (diagram) vs H2dM (BOM) | Isabella (ECE) |
| Dissolved oxygen inclusion | Wanted vs absent from BOM — decide V1.5 vs future | Isabella (ECE) |
| LiFePO₄ charging path | [ADR-0002](../decisions/0002-lifepo4-charging-path.md) not yet decided | Isabella (ECE) |
| Turbidity units (NTU) | Ship raw ADC + volts for v1, or invest in a calibration curve | David (CSEN) |
| Measured sleep current | Analytical estimate only; `< 5 mA` is a target, not a measurement | Isabella (ECE) |
| Over-saltwater LoRa range | ~2 km is the datasheet figure; real range measured in Phase 4 | David (CSEN) |
