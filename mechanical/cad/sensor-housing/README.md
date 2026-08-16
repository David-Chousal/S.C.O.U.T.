# Sensor Housing

CAD models for the sensor/turbidity pod: mounting and housing for the sensors that sit
underwater on the sensor stem. Narrated by John Ryan (field/mechanical lead).

> ⚠️ **This pod is part of a multi-depth sensor stem design, which is contested against
> [ADR-0003](../../../docs/decisions/0003-single-point-sensing.md)** (single-point sensing,
> multi-depth deferred). See the callout in
> [Sensor String Architecture](../../../docs/engineering/sensor-string-architecture.md) for the
> full flag — not resolved here.

## Drawings

- `turbidity-sensor.pdf` — turbidity sensor housing drawing

PDF drawing export only. Per
[CONVENTIONS.md → File formats](../../../docs/CONVENTIONS.md#file-formats), add the **native
source + a STEP export** alongside it when available. If this drawing is actually an electronics
schematic rather than a housing, it belongs under [`hardware/`](../../../hardware/) instead.

## System context

The buoy's electronics and floatation sit above the waterline; a solid **sensor stem** hangs
below it. Multiple cables run out of the top of the buoy — near where the solar panel and
LoRa/antenna equipment sit — down to the individual underwater sensors. This pod is one of
those sensor nodes.

Stakeholder input (NOAA researchers) is the driver: multiple temperature and turbidity readings
at different depths let the team observe **stratification** through the water column — see
[Stakeholder Interviews](../../../docs/research/stakeholder-interviews.md). The design also
targets **easy replaceability** — a fouled or failed pod should swap out without disturbing the
rest of the stem.

## Pod construction — dry/flood chamber

The pod splits into two chambers, epoxied together at a watertight interface:

- **Dry chamber** — holds the small board/chip/circuit that reads the turbidity probes. Never
  contacts water.
- **Flood chamber** — deliberately water-filled. The turbidity probes stick into it. It's
  shaped to **block ambient light around the probes** — avoiding light pollution in the
  turbidity reading — while still letting water flow through freely.

**Why this exists:** the hydrophone and temperature (thermometer) sensors are
**pre-waterproofed off-the-shelf** and don't need special housing. The turbidity probe
generally is **not** pre-waterproofed, which is what drives this chamber split.

**Iteration note:** an earlier version exposed the turbidity probes directly on the outside of
the cylindrical body wall (no flood chamber). The flood chamber was added specifically to
control ambient light exposure at the probe.

## Current components

| File | Role | Status |
|---|---|---|
| [`sensor-housing-body-current.step`](sensor-housing-body-current.step) | Pod body, no port | **Current** |
| [`sensor-housing-top-cap-current.step`](sensor-housing-top-cap-current.step) | Top cap | **Current** |
| [`sensor-housing-flood-chamber-cap.step`](sensor-housing-flood-chamber-cap.step) | Flood chamber cap — where the light-blocking geometry lives | Current (single version provided) |
| [`sensor-housing-body-no-port-threaded.step`](sensor-housing-body-no-port-threaded.step) | Pod body, no port, threaded variant | Iteration |
| [`sensor-housing-body-v1.step`](sensor-housing-body-v1.step) | Pod body, earlier revision (AS568-137 O-ring seal, ported) | Iteration |
| [`sensor-housing-top-cap-v1.step`](sensor-housing-top-cap-v1.step) | Top cap, earliest revision | Iteration |
| [`sensor-housing-top-cap-v2.step`](sensor-housing-top-cap-v2.step) | Top cap, second revision | Iteration |
| [`sensor-housing-top-cap-no-port.step`](sensor-housing-top-cap-no-port.step) | Top cap, no-port variant | Iteration |

Body sealing uses an **AS568-137 O-ring**. File naming here is John Ryan's own designation
("current" vs. prior iterations) from the source folder — not inferred, since (as with the
[floatation iterations](../floatation/README.md)) bulk Onshape re-export timestamps aren't a
reliable ordering signal.

Dimensions are TBD — see [`docs/hub/facts.md`](../../../docs/hub/facts.md).
