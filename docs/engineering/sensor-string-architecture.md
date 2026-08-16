# Vertical Sensor String Architecture

> **Summary** — Modular vertical sensor string suspending temperature, turbidity, and hydrophone nodes at multiple depths beneath the buoy, keeping the main electronics bay sealed above the waterline.
>
> **Source document** — `Vertical Sensor String Architecture.docx`

> ⚠️ **Status contested — flagging, not resolving.** [ADR-0003](../decisions/0003-single-point-sensing.md)
> (2026-08-14) marks this deferred: the capstone build was decided to use **one sensor of each
> modality at a single point**, with extra units as spares. But mechanical (John Ryan) is
> **actively building CAD for a multi-depth sensor stem** (2026-08-15) — 8 pod iterations in
> [`mechanical/cad/sensor-housing/`](../../mechanical/cad/sensor-housing/README.md) — directly
> motivated by the stakeholder interviews this project is based on: *"Multiple turbidity
> measurements at different depths may allow the observation of turbidity stratification"* and
> *"Temperature stratification"* / *"Multi-depth temperature"* are explicit findings in
> [Stakeholder Interviews](../research/stakeholder-interviews.md). ADR-0003's own listed
> "Affects" — wiring, power budget, CSV schema — means this needs a cross-discipline decision
> (mechanical + CS/ECE), not a unilateral change by either side. See
> [decision-log.md](../hub/decision-log.md) for the flagged conflict.

---

## Concept

The sensor string keeps all primary electronics in a single sealed enclosure at the surface
and distributes sensing elements down a multi-conductor cable. This enables multi-depth
measurement (thermoclines, turbidity stratification) while keeping the serviceable
electronics dry and accessible.

![S.C.O.U.T. buoy sensor architecture](../../assets/diagrams/sensor-string-architecture.png)

## String layout

```text
SURFACE
┌──────────────────────────┐
│ Solar / Antenna / Float   │
└────────────┬──────────────┘
             │
┌────────────▼──────────────┐
│ Sealed Electronics Bay    │
│ Feather M0 / SD / LoRa/RTC│
│ Battery / Audio Logger    │
└────────────┬──────────────┘
             │
      Main sensor cable
             │
┌────────────▼──────────────┐
│ Sensor Node 1             │
│ Temp + Turbidity          │
│ Shallow water layer       │
└────────────┬──────────────┘
             │
        Hydrophone 1
   near buoy / upper reef sound
             │
┌────────────▼──────────────┐
│ Sensor Node 2             │
│ Temp + Turbidity          │
│ Mid-water layer           │
└────────────┬──────────────┘
             │
┌────────────▼──────────────┐
│ Sensor Node 3 (optional)  │
│ Temp + Turbidity          │
│ Near reef / bottom layer  │
└────────────┬──────────────┘
             │
        Hydrophone 2
   near bottom / reef soundscape
             │
          Weight
             │
       Mooring line
```

## Component placement

| Component | Location | Purpose |
|---|---|---|
| Temp + turbidity pair 1 | Shallow / near buoy | Measures surface-layer heat and sediment |
| Hydrophone 1 | Upper cable | Captures near-surface sound: boats, wave noise, human activity |
| Temp + turbidity pair 2 | Mid-depth | Measures stratification through the water column |
| Temp + turbidity pair 3 | Near bottom (optional) | Measures reef-level conditions |
| Hydrophone 2 | Bottom of cable | Captures reef soundscape closer to fish/coral habitat |

## Pod construction — dry/flood chamber

Each turbidity/sensor pod (narrated by John Ryan; CAD in
[`mechanical/cad/sensor-housing/`](../../mechanical/cad/sensor-housing/README.md)) splits into
two chambers:

- **Dry chamber** — holds the small board/chip/circuit that reads the turbidity probes.
  Sealed and never contacts water.
- **Flood chamber** — deliberately water-filled. The turbidity probes stick into it, and it's
  shaped to **block ambient light around the probes** (avoiding light pollution in the
  turbidity reading) while still letting water flow through freely. An earlier iteration
  exposed the probes directly on the outside of the cylindrical wall; the flood chamber
  replaced that to control for light.
- The two chambers meet at an **epoxied, watertight interface**.

This exists specifically for turbidity: the **hydrophone and temperature (thermometer)
sensors are pre-waterproofed off-the-shelf** and don't need it. The turbidity probe is
generally **not** pre-waterproofed, which is what drives the dry/flood chamber split.

## Design rationale

- Cables run from the top of the buoy — near where the solar panel and LoRa/antenna
  equipment sit — down to each underwater sensor.
- All sensors connect to the electronics housing via a single multi-conductor cable.
- Data is logged to onboard storage and summarized data transmitted via LoRa.
- Sensors are spaced vertically to measure stratification.
- Hydrophones capture acoustic data at two depths.
- Sensor nodes are modular and individually replaceable — a stakeholder-driven requirement, so
  a fouled or failed pod can be swapped without disturbing the rest of the string.

## Open items

- **Deferred-vs-current status is contested — see the callout above.** Needs a cross-discipline
  decision, not a doc edit deciding it either way.
- **Deployment depth is 2–8 m** (revised 2026-08-14, was 5–8 m), confirmed against the actual
  Hawaii site — see [SCO-6](https://linear.app/scout1/issue/SCO-6). The `~30 m` annotation on
  the diagram image is outdated. The diagram PNG should be re-exported to drop the ~30 m label.
- **Hydrophone part number differs across documents.** The diagram cites the Aquarian
  H2a-XLR; the [Engineering Design Document](engineering-design-document.md) BOM specifies
  the Aquarian H2dM.
- The source diagram image contains a typo in its title ("ARCHIECTURE"). Preserved as-is
  since it is the original artwork.
