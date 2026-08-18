# ADR-0005 — V1 sensing payload

- **Status:** 🟢 Accepted
- **Date decided:** 2026-08-17
- **Owners:** Team (SCOUT Weekly) — David Chousal Cantu (`csen`), John Ryan Myrdal (`geng`),
  Navid Shaghaghi (advisor). Isabella Rodriguez (`ece`) absent; no objection raised since.
- **Affects:** BOM, power budget, housing envelope, CSV schema, analytics scope

## Context

The V1 sensor list had never been closed. Three signals were settled in practice —
temperature, turbidity, and a hydrophone — but **dissolved oxygen (DO)** sat unresolved
across documents: wanted in the early meeting notes and stakeholder interviews, listed as
V1.5 in [Sensor Selection](../engineering/sensor-selection.md), and absent from the
Engineering Design Document and the BOM. It was tracked as
[SCO-11](https://linear.app/scout1/issue/SCO-11).

An open sensor list keeps three other things open with it: the BOM, the power budget, and the
housing envelope. None of those can be finalised while a ~35 mA sensor might still be added.

## Decision

**The V1 sensing payload is temperature, turbidity, and hydrophone. Dissolved oxygen is
excluded from V1.**

Per [ADR-0003](0003-single-point-sensing.md) each is deployed as a **single unit** at one
depth; spare units are field spares, not a simultaneous array.

### Why dissolved oxygen is out

**NOAA has largely stopped using DO for reef monitoring, because it is too locally
sensitive.** A DO reading is accurate for the exact point it is taken, but different
organisms across a reef each produce and consume oxygen differently, so a single point cannot
be read as reef-wide health. DO remains genuinely useful for identifying **dead zones** in
open water — which is not what S.C.O.U.T. measures.

That is a stronger reason than cost, and it is the one that decides it. The supporting
reasons follow the same direction: the Atlas Scientific kit is \$175–355 (a significant
fraction of the sub-\$5,000 target), it draws ~35 mA, and DO probes are among the most
biofouling-prone and calibration-hungry sensors available — on a platform whose top
stakeholder-flagged risk is already biofouling.

### Two temperature measurements, not one

Also settled: **water temperature is measured by an external waterproof probe**, not by a
sensor inside the sealed bay. The electronics self-heat, so an internal sensor would need
software compensation and a thermal-transfer characterisation to recover water temperature —
work that a \$7 external probe makes unnecessary.

A **separate, cheap internal temperature + humidity sensor** is added inside the bay purely
for State of Health. Its value is the humidity channel: **in a sealed enclosure humidity
should read near zero, so a rise is a leak** — the earliest possible warning for the failure
mode that ends a deployment. Tracked as
[SCO-60](https://linear.app/scout1/issue/SCO-60).

## Consequences

- **The V1 BOM can close.** Power budget and housing envelope are no longer waiting on a
  possible fourth sensor.
- **`internal_temp_c` and `internal_humidity_pct` are activated.** They exist in the
  [Data Schema](../engineering/data-schema.md) as future columns marked *"not in the v1 BOM"*.
  Fitting the SoH sensor promotes them, which means a `schema_version` bump plus matching
  firmware and shore changes.
- **The analytics pipeline is unaffected** — it never had a DO path.
- **Nothing about the hydrophone part number is resolved here.** H2a-XLR vs H2dM remains open
  as [SCO-8](https://linear.app/scout1/issue/SCO-8).

## Not permanent

DO returns as a **stretch, not a re-litigation**. The team has an **infrared DO sensor from a
prior lab project** that could be incorporated if time and capability allow — cheaper than the
Atlas kit and already understood. Reopening this needs new evidence that a point DO
measurement says something useful about reef health, not simply spare time.

Chlorophyll remains separately deferred ([SCO-18](https://linear.app/scout1/issue/SCO-18)).

## References

- [Stakeholder Interviews](../research/stakeholder-interviews.md) — Shantz and Barkley both
  ranked DO low; Shantz flagged sensor complexity, calibration, and biofouling
- [ADR-0003 — Single-point sensing](0003-single-point-sensing.md)
- [Sensor Selection](../engineering/sensor-selection.md)
- [SCO-11](https://linear.app/scout1/issue/SCO-11) · [SCO-60](https://linear.app/scout1/issue/SCO-60)
- SCOUT Weekly, 2026-08-17
