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
| Deployment depth | **2–8 m** max, confirmed against the actual Hawaii site (revised 2026-08-14, was 5–8 m). The ~30 m on the sensor-string diagram is an outdated image | [SCO-6](https://linear.app/scout1/issue/SCO-6) |
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
| Enclosure dimensions | **TBD** — design is built around an approximate 4" Schedule 40 PVC reference form factor; not finalized. **The battery and solar panel, not the PCB, set the lower bound on volume** (confirmed 2026-08-17) | [mechanical/cad/electronics-housing](../../mechanical/cad/electronics-housing/README.md), [SCO-49](https://linear.app/scout1/issue/SCO-49) |

## Sensing (single-point per modality — see ADR-0003)

| Fact | Canonical value | Source |
|---|---|---|
| Temperature | **DS18B20 ×1** (±0.5 °C), 1-Wire; extra units are field spares | [Sensor Selection](../engineering/sensor-selection.md), [ADR-0003](../decisions/0003-single-point-sensing.md) |
| Turbidity | **DFRobot SEN0189 ×1**, analog; extra unit is a field spare | [Sensor Selection](../engineering/sensor-selection.md) |
| Turbidity polarity | **A higher `turbidity_adc` count means CLEARER water.** The SEN0189 is a transmittance sensor: particles block light to its phototransistor, so its output *falls* as turbidity rises — "the output value will decrease when in liquids with a high turbidity" ([DFRobot datasheet](https://media.digikey.com/pdf/data%20sheets/dfrobot%20pdfs/sen0189_web.pdf)). Clear water (< 0.5 NTU) ≈ 4.1 V. The firmware logs raw `analogRead` with no inversion, so the ADC inherits that direction. **Constraint for ECE:** the analog front end ([ADR-0002](../decisions/0002-lifepo4-charging-path.md)) must be **non-inverting** (divider/buffer, not an inverting amp) or this convention and the analytics that rely on it break | [Data Schema](../engineering/data-schema.md), [datasheet](https://media.digikey.com/pdf/data%20sheets/dfrobot%20pdfs/sen0189_web.pdf) |
| Hydrophone | **Aquarian** — ⏳ part number unresolved: H2a-XLR (diagram) vs H2dM (BOM) | [ADR-0003 related gaps](../decisions/0003-single-point-sensing.md) |
| Dissolved oxygen | **Excluded from V1** (2026-08-17). NOAA has largely stopped using DO for reef monitoring — it is too locally sensitive to read as reef-wide health, though it remains useful for open-water dead zones. Returns only as a stretch, via the lab's existing infrared DO sensor rather than the Atlas kit | [ADR-0005](../decisions/0005-v1-sensing-payload.md), [SCO-11](https://linear.app/scout1/issue/SCO-11) |
| Water temperature placement | **External waterproof probe**, not inside the sealed bay — the electronics self-heat, and an internal sensor would need software compensation plus a thermal-transfer characterisation that a \$7 external probe makes unnecessary | [ADR-0005](../decisions/0005-v1-sensing-payload.md) |
| Internal SoH sensor | A cheap internal **temp + humidity** sensor is fitted for diagnostics only. **Humidity should read near zero in a sealed bay, so a rise is a leak** — the earliest warning for the failure mode that ends a deployment. Activates the `internal_temp_c` / `internal_humidity_pct` columns | [SCO-60](https://linear.app/scout1/issue/SCO-60), [Data Schema](../engineering/data-schema.md) |
| Multi-depth string | **Deferred, confirmed 2026-08-15.** ADR-0003 stands — one sensor per modality now. The sensor pod mechanical design is intentionally built to enable multi-depth scaling in a future revision, without activating it | [ADR-0003](../decisions/0003-single-point-sensing.md), [Sensor Housing → Why build for scale now](../../mechanical/cad/sensor-housing/README.md#why-build-for-scale-now) |

## Communications & data

| Fact | Canonical value | Source |
|---|---|---|
| LoRa frequency | **915 MHz** (US ISM band) | [EDD](../engineering/engineering-design-document.md) |
| LoRa range | **~2 km line of sight** (Adafruit RFM9x FAQ). Real over-saltwater range TBD in Phase 4 | [ADR-0001 reconciliation](../decisions/0001-mcu-and-radio-selection.md) |
| Daily packet | 1× per day — a summary, not a row dump. ⚠️ **Size contested:** firmware (`SCOUT_PACKET_SIZE`) and shore (`PACKET_SIZE`) both encode **30 bytes**; the **82 bytes** cited here and in the EDD is the §10 *budget ceiling* (`LORA_PAYLOAD_BUDGET_BYTES`), not the actual size | [SCO-40](https://linear.app/scout1/issue/SCO-40), [Data Schema](../engineering/data-schema.md), EDD §10/§14 |
| Delivery scheme | **CR 4/8 + blind repetition** (3 copies NORMAL, 1 CONSERVE, widening gaps), never ACKed; shore deduplicates on `(buoy_id, record_seq)`. Spreading factor stays **SF7** — the stock CR 4/8 presets force SF12, which would overrun the TX budget and the FCC dwell limit | [SCO-21](https://linear.app/scout1/issue/SCO-21) |
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

## Analytics (environmental telemetry)

| Fact | Canonical value | Source |
|---|---|---|
| Thermal-stress metric | **NOAA Coral Reef Watch Degree Heating Weeks** over a 12-week window, against a per-site Maximum Monthly Mean; alert levels No Stress → Watch → Warning → Alert 1/2 | [Telemetry Methodology](../analysis/telemetry-methodology.md) |
| Multi-buoy analysis | Each `buoy_id` is analysed **in isolation** (never blended — merging streams corrupts daily means and DHW), each with **its own MMM** | [`analytics/telemetry/fleet.py`](../../analytics/telemetry/fleet.py) |
| Live dashboard | Self-contained static site on GitHub Pages, republished per publish (not real-time); **Analytics** (one buoy) and **Fleet** (network overview) pages are data-driven | [Live Dashboard](../engineering/live-dashboard.md) |

## Mechanical & deployment

| Fact | Canonical value | Source |
|---|---|---|
| Anchoring/mooring approach | **Marked sites** (existing pile/mooring) connect directly via line. **Unmarked sites** use a single **mushroom anchor**, sited adjacent to (never on) coral with enough swing clearance the line can't drag/agitate the reef. Synthetic marine rope by default; chain in high-turbulence sites | [ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md) |
| Flotation | **Wedge system, bolted variant** (heat-set inserts + bolts, no snap/keyhole locking) — chosen over the snap/keyhole Master V3 and Outer Octagon. Each wedge has a **bottom cap** (gyroid infill, many wall layers) for impact protection, and is injected with expanding foam — buoyancy, structure, and waterproofing-by-redundancy in one (a punctured wedge does not flood). Radial printed webs between wedges, inspired by surfboard stringer construction. First FEA (side load) gives minimum safety factor **25.4** against an **SF≥4 pass/fail check used for that one study**, not yet a validated target — max expected loads not yet derived | [SCO-48](https://linear.app/scout1/issue/SCO-48), [design-notes.md](design-notes.md), [mechanical/test/](../../mechanical/test/README.md) |
| Module interconnect | **Modular snap connectors** — each module mates electrically as it stacks, rather than cables routed through the body. Cables remain only where something must leave the chassis, notably the hydrophone | [SCO-61](https://linear.app/scout1/issue/SCO-61) |
| O-ring manufacturing method | **Purchased off-the-shelf** (standard AS568-type), not TPU-printed or batch-cast via injection mold — printed parts are porous along layer lines, a waterproofing-critical risk at the 5 m pressure target. Provisional; revisit if standard sizes don't fit | [SCO-55](https://linear.app/scout1/issue/SCO-55), [design-notes.md](design-notes.md) |

---

## Open facts (deliberately not settled yet)

These are **not** canonical values — they are known gaps tracked so nobody treats a placeholder
as settled. Each should have a Linear issue and, when resolved, become a row above.

| Open fact | Why it's open | Owner | Linear |
|---|---|---|---|
| Hydrophone part number | H2a-XLR (diagram) vs H2dM (BOM) | Isabella (ECE) | [SCO-8](https://linear.app/scout1/issue/SCO-8) |
| LiFePO₄ charging path | [ADR-0002](../decisions/0002-lifepo4-charging-path.md) not yet decided | Isabella (ECE) | [SCO-10](https://linear.app/scout1/issue/SCO-10) |
| Turbidity units (NTU) | Ship raw ADC + volts for v1, or invest in a calibration curve | David (CSEN) | [SCO-13](https://linear.app/scout1/issue/SCO-13) (blocked by [SCO-12](https://linear.app/scout1/issue/SCO-12)) |
| Measured sleep current | Analytical estimate only; `< 5 mA` is a target, not a measurement | Isabella (ECE) | [SCO-23](https://linear.app/scout1/issue/SCO-23) |
| Over-saltwater LoRa range | ~2 km is the datasheet figure; real range measured in Phase 4 | David (CSEN) | [SCO-14](https://linear.app/scout1/issue/SCO-14) |
| Daily packet size | 30 B actual (firmware + shore agree) vs the 82 B EDD §10 budget ceiling, stated interchangeably across docs | David (CSEN) | [SCO-40](https://linear.app/scout1/issue/SCO-40) |
| Enclosure dimensions | Battery and solar panel dimensions set the lower bound on housing volume; both still unspecified | Isabella (ECE) | [SCO-49](https://linear.app/scout1/issue/SCO-49) |
| Buoy body print material | PETG is the current default; ABS and ASA (plus SLA/nylon for comparison) are under evaluation, one sample per material | John Ryan (GENG) | [SCO-64](https://linear.app/scout1/issue/SCO-64) |
| Mooring/sensor-string attachment hardware | Leading candidate is a stainless U-bolt + mounting plate on the chassis bottom; not yet designed or sized against loads | John Ryan (GENG) | [SCO-69](https://linear.app/scout1/issue/SCO-69) |
