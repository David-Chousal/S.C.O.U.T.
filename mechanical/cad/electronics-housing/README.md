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

**Not yet built to this spec.** The [2026-08-24 submersion test](../../test/waterproofing-submersion-test-2026-08-24.md)
tested a physical electronics housing with **no rubber sealing washers at the bolt joints** —
bare bolt-into-cavity contact — and it failed with significant water ingress, as expected for
that build. This confirms the gap rather than the design: the documented spec above hasn't
actually been validated yet, only a version without it.

**Not final:** the current cap has a shackle/connection point in place of a cable entry. The
final design replaces that with a **cable gland** (matches the cable-entry method already
specified in [`mechanical/README.md`](../../README.md#design-baseline)) — this STEP is a
placeholder for that geometry, not the build spec.

Dimensions are still TBD for CAD purposes, but a first-pass packing analysis
(2026-08-25) gives a recommended target — see
[Electronics Housing Packing Budget](../../../docs/engineering/electronics-housing-packing-budget.md)
and [`docs/hub/facts.md`](../../../docs/hub/facts.md#build-platform-settled--see-adr-0001).
Recommended: **~⌀100 mm × 110–130 mm internal**, fitting inside the existing ~4" PVC reference
with margin. Two things that packing analysis flags as still open and relevant to CAD:

- **The Adafruit PID 6106 charger/boost board's real dimensions aren't known yet** — the packing
  budget uses an assumed 51 × 25 × 10 mm footprint. Confirm against the physical part once
  [SCO-88](https://linear.app/scout1/issue/SCO-88) lands before committing internal mounting
  geometry to it.
- **Antenna routing isn't decided** — an internal wire whip (no housing penetration, needs
  routing space) vs. a uFL+SMA bulkhead connector (a housing penetration, a new waterproofing
  interface not modeled in the current O-ring/cable-gland design). This changes the endcap
  design, not just internal layout.

**Native source:** see [`mechanical/cad/README.md`](../README.md#native-source) — one Onshape
document covers the whole project, not a separate one per subsystem.
