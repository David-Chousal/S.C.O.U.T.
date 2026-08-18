# Mechanical — Buoy Structure & Marine Design

CAD models, hull design, enclosure drawings, mooring specifications, and field test records.

> **Status:** All five CAD categories populated — floatation, electronics housing,
> sensor/turbidity housing, stem, solar mount (40 STEP/PDF files total, see
> [`cad/README.md`](cad/README.md)). **Floatation family chosen 2026-08-17** — bolted wedge
> variant with bottom caps ([`cad/floatation/README.md`](cad/floatation/README.md)), first FEA
> pass complete ([`test/`](test/README.md)). Still open: buoyancy check + PDF-drawing
> reconciliation on [SCO-48](https://linear.app/scout1/issue/SCO-48), housing dimensions
> ([SCO-49](https://linear.app/scout1/issue/SCO-49)), chassis top section — sealing/service
> access ([SCO-68](https://linear.app/scout1/issue/SCO-68)), mooring/sensor-string attachment
> hardware ([SCO-69](https://linear.app/scout1/issue/SCO-69)), and the items below.

**Owner:** GE lead (field & mechanical)

## Design baseline

Specified in
[Engineering Design Document §4](../docs/engineering/engineering-design-document.md) and
[Sensor String Architecture](../docs/engineering/sensor-string-architecture.md).

| Element | Current design |
|---|---|
| Main housing (electronics) | **TBD** — built around an approximate 4" Schedule 40 PVC reference, not finalized |
| Sealing | O-ring sealed removable end caps |
| Cable entry | IP68 cable glands, marine epoxy |
| Assembly | Heat-set inserts (replaced embedded nuts) |
| Geometry | Cylindrical at waterline, tapered to mooring below and antenna above |
| Sensor mounting | Modular vertical sensor string on multi-conductor cable |
| Mooring | Fixed mooring, reef-safe anchoring |

## Requirements

The structure must be waterproof, storm resistant, biofouling resistant, serviceable, and
reef-safe, with long-term mooring stability and minimal reef disturbance.

## Contents

```
mechanical/
├── cad/                        Source CAD models and exported STEP/STL
│   ├── floatation/             Hull, float, and buoyancy structure
│   ├── electronics-housing/    Sealed electronics bay enclosure
│   ├── sensor-housing/         Sensor mounting and housing
│   ├── stem/                   Structural member carrying the sensor pod underwater
│   └── solar-mount/            Solar panel mounting bracket
├── drawings/                   Dimensioned drawings, hull cross-sections
├── mooring/                    Anchor, line, swivel, and shackle specifications
└── test/                       Buoyancy, waterline, pressure, and submersion test records
```

## Open items

- **Deployment depth is 2–8 m** (revised 2026-08-14, was 5–8 m), confirmed against the actual
  Hawaii site — see [SCO-6](https://linear.app/scout1/issue/SCO-6). The ~30 m label on the
  sensor-string diagram image is outdated and should be re-exported.
- **Biofouling mitigation decided: Sea Hawk Smart Solution antifouling coating, 1 pint**
  (copper-free) — over copper mesh, mechanical wipers, and copper-based coatings, which
  conflict with the project's reef-safe design principle. See
  [Biofouling Antifouling Coatings](../docs/research/biofouling-antifouling-coatings.md#decision)
  ([SCO-15](https://linear.app/scout1/issue/SCO-15)).
- Waterproofing must be pressure tested at 5 m water equivalent before deployment
  ([Team Timeline](../docs/planning/team-timeline.md) Phase 5).
- Sacrificial anodes and desiccant packs are noted in meeting notes but not yet in the BOM.
- **Print material is still open** — PETG is the current default; ABS and ASA (and SLA/nylon
  for comparison) are under evaluation, one sample per material
  ([SCO-64](https://linear.app/scout1/issue/SCO-64)).
- **Mooring/sensor-string attachment hardware** on the chassis bottom is not yet designed —
  leading candidate is a stainless U-bolt with a mounting plate
  ([SCO-69](https://linear.app/scout1/issue/SCO-69)).
