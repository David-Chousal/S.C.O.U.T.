# Sensor Housing

CAD models for the sensor/turbidity pod: mounting and housing for the sensors that sit
underwater on the sensor stem. Narrated by John Ryan (field/mechanical lead).

> ✅ **Resolved 2026-08-15 (John Ryan):** [ADR-0003](../../../docs/decisions/0003-single-point-sensing.md)
> stands — the current build deploys **one sensor per modality, single point**, multi-depth
> deferred. This pod is designed to enable multi-depth scaling later, not to deploy it now. See
> [Why build for scale now](#why-build-for-scale-now) below for the full reasoning.

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

## Why build for scale now

**The decision, precisely:** the graded capstone build deploys one sensor per modality at one
point, per [ADR-0003](../../../docs/decisions/0003-single-point-sensing.md). Multi-depth
sensing is *not* being activated now. But the pod hardware is deliberately designed so that
adding depths later is a manufacturing problem, not a redesign problem.

**Why design for scale before it's needed.** The alternative — build one single-point pod now,
throw it away, and redesign a "real" multi-depth pod later if the team decides to pursue it —
wastes the iteration work this pod already represents (see the component table below: two full
top-cap and body revision lines, a threading pass, a flood-chamber redesign). Since
[manufacturing is in-house additive only](../floatation/README.md#manufacturing-approach) — the
same constraint driving the floatation build — the *marginal* cost of producing a second or
third pod is low: it's more prints, not new tooling or a new mold. That only pays off, though,
if the pod design itself doesn't have to change to go from one instance to many. So the
iteration work here was spent making the pod a **self-contained, interchangeable module**:

- The **dry/flood chamber split with an epoxied interface** is a complete sensing module in
  itself — it doesn't need to know how many other pods exist on the stem, or where.
- The **threaded body variant** and the move away from a fixed-port design toward the current
  no-port body mean a pod attaches to the sensor cable the same way regardless of position
  along the stem — shallow, mid, or deep.
- This directly serves the **replaceability goal** from the stakeholder interviews: a design
  that swaps in and out easily at one depth is, by construction, a design that can be repeated
  at other depths without new engineering.

**What's deliberately *not* solved here.** Activating multi-depth for real is a cross-discipline
problem, not a mechanical one, and out of scope for this pod design:

- **Wiring/power** — multiple pods need multiplexed analog channels and a revised power budget;
  today's single-point wiring assumes one of each sensor.
- **Firmware** — the SAMD21's 32 KB SRAM and the current sampling loop assume one reading per
  modality per wake cycle, not N.
- **CSV schema** — [`data-schema.md`](../../../docs/engineering/data-schema.md) already reserves
  `temp_c_NN` multi-depth columns as a *future extension only*, per ADR-0003's own consequences
  section; they're not wired up.

So: the mechanical side is intentionally ahead of the electrical/firmware side. That's a
deliberate choice, not an oversight — it means that if/when the team decides to pursue
multi-depth in a future revision, the pod itself won't be the blocker.

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
