# Electronics Housing

CAD models for the sealed electronics bay enclosure (MCU, battery, radio, logger).

## Current components

- [`electronics-housing-body.step`](electronics-housing-body.step) — 3D-printed chassis
  cylinder body ("Full Print Body Upper")
- [`electronics-housing-endcap-no-port.step`](electronics-housing-endcap-no-port.step) — end
  cap that slides into and seals the chassis cylinder ("Top-Bottom No Port")

## Assembly

The end cap slides into the printed chassis cylinder and is secured with **heat-set insert M4
bolts and washers**. Waterproofing is via **rubber sealing washers** at the bolt joints.

**Not final:** the current cap has a shackle/connection point in place of a cable entry. The
final design replaces that with a **cable gland** (matches the cable-entry method already
specified in [`mechanical/README.md`](../../README.md#design-baseline)) — this STEP is a
placeholder for that geometry, not the build spec.

Dimensions are TBD — see [`docs/hub/facts.md`](../../../docs/hub/facts.md).
