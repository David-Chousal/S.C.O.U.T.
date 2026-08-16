# Electronics Housing

CAD models for the sealed electronics bay enclosure (MCU, battery, radio, logger).

## Current components

- [`electronics-housing-body.step`](electronics-housing-body.step) — 3D-printed chassis
  cylinder body ("Full Print Body Upper")
- [`electronics-housing-endcap-no-port.step`](electronics-housing-endcap-no-port.step) — end
  cap that slides into and seals the chassis cylinder ("Top-Bottom No Port")
- [`electronics-housing-top-fitting.step`](electronics-housing-top-fitting.step) — the
  **waterproof top fitting** ("Body Upper"). **Printed and physically tested**: validated
  heat-set insert M4 fastening and lid fit.
- [`electronics-housing-tpu-ring.step`](electronics-housing-tpu-ring.step) — a **TPU-printed
  O-ring experiment**. John Ryan has also considered **printed injection molds** to batch-cast
  his own O-rings in-house, rather than sourcing off-the-shelf — not yet pursued, but a live
  option consistent with the project's in-house-additive manufacturing approach (see
  [floatation → Manufacturing approach](../floatation/README.md#manufacturing-approach)).
- [`electronics-housing-o-ring.step`](electronics-housing-o-ring.step) — the housing's O-ring
  seal, modeled directly (as opposed to the TPU-print experiment above).

## Assembly

The end cap slides into the printed chassis cylinder and is secured with **heat-set insert M4
bolts and washers**. Waterproofing is via **rubber sealing washers** at the bolt joints.

**Not final:** the current cap has a shackle/connection point in place of a cable entry. The
final design replaces that with a **cable gland** (matches the cable-entry method already
specified in [`mechanical/README.md`](../../README.md#design-baseline)) — this STEP is a
placeholder for that geometry, not the build spec.

Dimensions are TBD — see [`docs/hub/facts.md`](../../../docs/hub/facts.md).

**Native source:** see [`mechanical/cad/README.md`](../README.md#native-source) — one Onshape
document covers the whole project, not a separate one per subsystem.
