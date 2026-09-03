# Mechanical — Buoy Structure & Marine Design

CAD models, hull design, enclosure drawings, mooring specifications, and field test records.

> **Status:** All five CAD categories populated — floatation, electronics housing,
> sensor/turbidity housing, stem, solar mount (49 STEP/PDF files total, see
> [`cad/README.md`](cad/README.md)). **Floatation family chosen 2026-08-17** — bolted wedge
> variant with bottom caps ([`cad/floatation/README.md`](cad/floatation/README.md)), first FEA
> pass complete ([`test/`](test/README.md)). **Chassis cap + wedge cap added 2026-08-20**
> (first pass at the [SCO-53](https://linear.app/scout1/issue/SCO-53) cable-gland cap revision;
> cable routing and cap OD still open). **Design panel review 2026-08-21** — architecture
> confirmed, proceed to detailed design ([full write-up](../docs/engineering/reviews/buoy-preliminary-design-panel-review-2026-08.md)).
> Dimensioned v4 drawings (wedge, wedge cap, wedge bottom, chassis, chassis cap) landed the
> same day, giving a first-pass [mass/buoyancy budget](../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md)
> and confirming the buoy's overall diameter at 18 in. **All five parts now have real
> slicer-measured weights (2026-08-24)** — whole shell ~5.49 kg, ~337.6 N net reserve buoyancy;
> see [`test/print-weight-verification-2026-08-24.md`](test/print-weight-verification-2026-08-24.md).
> **First waterproofing submersion test, 2026-08-24** — PLA sensor housing + TPU-printed O-ring
> passed ~30 hr submerged; PETG (low print quality) and the electronics housing (no bolt-joint
> washers on the tested article) both failed, see
> [`test/waterproofing-submersion-test-2026-08-24.md`](test/waterproofing-submersion-test-2026-08-24.md).
> **Electronics housing packing analysis, 2026-08-25** — real component dimensions from
> Isabella's Rev A datasheets, three candidate cylindrical layouts computed, recommended
> ~⌀100 mm × 110–130 mm (fits the existing ~4" PVC reference); see
> [Electronics Housing Packing Budget](../docs/engineering/electronics-housing-packing-budget.md).
> **Electronics housing static face-seal clamp, 2026-09-02** — new clamp + lid pair moving the
> 6 fasteners **outside** the AS568-043 O-ring boundary and sizing the groove to the standard
> ring (22.9 % squeeze, 75 % fill); closes the design panel review's lid-seal finding
> ([SCO-68](https://linear.app/scout1/issue/SCO-68),
> [`cad/electronics-housing/README.md`](cad/electronics-housing/README.md#static-face-seal-clamp--2026-09-02)).
> Printed, slight O-ring tolerance trouble, **reprint pending**
> ([SCO-105](https://linear.app/scout1/issue/SCO-105)). **Declared the housing baseline the same
> day**, superseding the end-cap-into-cylinder scheme.
> Print-structure spec (walls/infill per part) now lives in its own
> [Print Settings](../docs/engineering/buoy-structural/print-settings.md) doc; the actual FEA load values will
> land in [Force Budget](../docs/engineering/buoy-structural/force-budget.md) as their inputs arrive. Still
> open: buoyancy check + PDF-drawing reconciliation on
> [SCO-48](https://linear.app/scout1/issue/SCO-48), housing dimensions
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
| Main housing (electronics) | **Face-seal clamp + lid** (baseline 2026-09-02) — Ø114.3 mm OD × 118.11 mm, at the ~4" Schedule 40 PVC reference. Internal sizing still open ([SCO-49](https://linear.app/scout1/issue/SCO-49)) |
| Sealing | **Static face seal, fasteners outside the O-ring boundary** — AS568-043 on the electronics housing, AS568-137 on the sensor pod. Supersedes the end-cap-into-cylinder scheme |
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
