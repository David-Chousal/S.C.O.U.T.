# ADR-0003 — Single-point sensing per modality (multi-depth string deferred)

- **Status:** 🟢 Accepted
- **Date decided:** 2026-08-14
- **Owners:** CS lead (David Chousal Cantu), confirmed by the team
- **Affects:** sensor architecture, wiring, power budget, CSV schema, mechanical sensor mount

---

## Context

The documents disagreed on how many sensors the buoy carries. The
[Engineering Design Document §8/§22](../engineering/engineering-design-document.md), the
[README architecture](../../README.md), and
[Sensor String Architecture](../engineering/sensor-string-architecture.md) all describe
**3× DS18B20 + 3× SEN0189 distributed down a vertical multi-depth string**. The confirmed
hardware purchase and the team's actual intent are different: **one sensor of each modality in
the buoy**, with the additional temperature and turbidity units bought as **spares /
replacements**, not deployed simultaneously.

## Decision

- The build deploys **one DS18B20 (temperature)**, **one SEN0189 (turbidity)**, and the
  **single hydrophone**, at one sensing location beneath the buoy.
- The extra DS18B20 and SEN0189 units are **field spares** — kept to swap in if a sensor
  fails or biofouls, never wired up together.
- The **vertical multi-depth sensor string remains a documented future concept** (see the
  [July 2026 project update](../overview/project-update-2026-07.md) and
  [Sensor String Architecture](../engineering/sensor-string-architecture.md)), not part of the
  current capstone build.

## Consequences

- **CSV schema** ([data-schema.md](../engineering/data-schema.md)) uses single `temp_c` and
  `turbidity_*` columns; the `temp_c_NN` multi-depth columns stay a future extension only.
- **EDD §8/§22** quantities are corrected to 1 each (+ spares). The §8 operation steps and
  §15 energy figures that assume "all three sensors" are **superseded** for the build; a
  Feather-specific power budget is produced empirically anyway (per
  [ADR-0001](0001-mcu-and-radio-selection.md)).
- Simplifies wiring, the switched-power design, and the analog front end.
- Mechanical sensor mount only needs to site one probe of each, not a string.

## Related gaps — NOT resolved here (owner: ECE lead, Isabella)

These surfaced alongside the sensor-count question but are **ECE decisions**, left as
documented gaps. **A session with Linear access should turn each into an issue assigned to
Isabella Rodriguez (`ece`):**

1. **Hydrophone part number** — `Aquarian H2dM` (EDD BOM) vs `H2a-XLR` (sensor-string diagram
   and [sensor-selection](../engineering/sensor-selection.md)). One must win.
2. **Dissolved-oxygen sensor status** — wanted in the meeting notes and stakeholder interviews,
   listed as V1.5 in [sensor-selection](../engineering/sensor-selection.md), but absent from
   the EDD sensor architecture and BOM. Decide: V1.5 commitment or future.

## References

- [Engineering Design Document §8 Sensor Architecture, §22 BOM](../engineering/engineering-design-document.md)
- [Sensor String Architecture](../engineering/sensor-string-architecture.md)
- [Sensor Selection](../engineering/sensor-selection.md)
- [On-Board CSV Data Schema](../engineering/data-schema.md)
- [ADR-0001 — MCU and Radio Selection](0001-mcu-and-radio-selection.md)
