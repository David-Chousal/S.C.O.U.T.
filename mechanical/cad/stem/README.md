# Stem

CAD for the sensor stem — the structural member that hangs below the buoy and carries the
sensor pod(s) underwater. See
[Sensor Housing → System context](../sensor-housing/README.md#system-context) for how this
fits into the overall buoy architecture (electronics + floatation above water, solid stem
below, cables routed from the buoy top down to underwater sensors).

## Components

| File | Onshape source | Status |
|---|---|---|
| [`stem-current.step`](stem-current.step) | `With Tolerances > Sensor Stem Copy 1` | **Current** — hex-socket top connector with rows of drainage/flow holes around the lower cylindrical body |
| [`stem-initial-concept.step`](stem-initial-concept.step) | `Initial Frame > Sensor Stem` | Early concept — a longer, thinner rod/screw-style stem. `Initial Frame` is an early whole-system concept pass (also holds early Bolt, Top/Bottom, Floatation, Body, and Solar Mount concepts), largely superseded by the per-subsystem work elsewhere in this repo |

The hex socket on the current design suggests a tool-driven mechanical connection (wrench/hex
key) to the electronics housing above; the drainage holes let water flow through rather than
pool against the stem body.

**Native source:** see [`mechanical/cad/README.md`](../README.md#native-source) — one Onshape
document covers the whole project, not a separate one per subsystem.
