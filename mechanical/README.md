# Mechanical — Buoy Structure & Marine Design

CAD models, hull design, enclosure drawings, mooring specifications, and field test records.

> **Status:** Not yet populated. This directory is the agreed destination for CAD files and
> annotated sketches, per [Team Timeline](../docs/planning/team-timeline.md) Phase 1, Week 4.

**Owner:** GE lead (field & mechanical)

## Design baseline

Specified in
[Engineering Design Document §4](../docs/engineering/engineering-design-document.md) and
[Sensor String Architecture](../docs/engineering/sensor-string-architecture.md).

| Element | Current design |
|---|---|
| Main housing | 4" Schedule 40 PVC |
| Sealing | O-ring sealed removable end caps |
| Cable entry | IP68 cable glands, marine epoxy |
| Assembly | Heat-set inserts (replaced embedded nuts) |
| Geometry | Cylindrical at waterline, tapered to mooring below and antenna above |
| Sensor mounting | Modular vertical sensor string on multi-conductor cable |
| Mooring | Fixed mooring, reef-safe anchoring |

## Requirements

The structure must be waterproof, storm resistant, biofouling resistant, serviceable, and
reef-safe, with long-term mooring stability and minimal reef disturbance.

## Intended contents

```
mechanical/
├── cad/            Source CAD models and exported STEP/STL
├── drawings/       Dimensioned drawings, hull cross-sections
├── mooring/        Anchor, line, swivel, and shackle specifications
└── test/           Buoyancy, waterline, pressure, and submersion test records
```

## Open items

- **Deployment depth is 2–8 m** (revised 2026-08-14, was 5–8 m), confirmed against the actual
  Hawaii site — see [SCO-6](https://linear.app/scout1/issue/SCO-6). The ~30 m label on the
  sensor-string diagram image is outdated and should be re-exported.
- Biofouling mitigation strategy is undecided — candidates include copper mesh, mechanical
  wipers, and reef-safe antifouling coatings. Stakeholder interviews flagged this as a major
  risk to sensor accuracy.
- Waterproofing must be pressure tested at 5 m water equivalent before deployment
  ([Team Timeline](../docs/planning/team-timeline.md) Phase 5).
- Sacrificial anodes and desiccant packs are noted in meeting notes but not yet in the BOM.
