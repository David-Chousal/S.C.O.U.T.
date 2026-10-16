# Electronics Housing Packaging

> **Summary** — How the electronics go inside the sealed housing (111.8 mm ID × 127 mm tall):
> the current in-housing component list, four stackable packaging options, and **option C**, the
> chosen direction, as an interactive 3D explorer with every dimension labelled. First-pass
> geometry from 2026-10-15 for the CAD of the printed layers, not a final design.
>
> Part of [`mechanical/cad/electronics-housing/`](../README.md). Linear:
> [SCO-49](https://linear.app/scout1/issue/SCO-49), [SCO-68](https://linear.app/scout1/issue/SCO-68).

---

## ⭐ Open this: [`option-c-layer-explorer.html`](option-c-layer-explorer.html)

Self-contained (three.js embedded), works offline. Open it in a browser. Drag to rotate, scroll to
zoom, use **Explode** to separate the layers, **Solo, top view** (L1, L2, L3) to read one layer's
dimensions flat, and the **dimensions** checkbox to hide the labels.

## Decision direction (2026-10-15, John Ryan)

- **Minimise space used and keep the weight low.** The two D cells lie on their side in the
  bottom layer.
- **All cables run up through the top cap**: hydrophone, antenna and sensors.
- **Layers are printed discs** that stack on pinned pillars, with open gaps between them for wiring.
- Chosen: **option C**. Its 3 layers use **93 of 127 mm**, leaving about 34 mm for cable bend under the cap.

## Components inside the housing (Rev B drawing set, 2026-10-12)

| Part | Size | Where |
|---|---|---|
| 2 × Saft LS33600 D cell, in parallel | Ø33.4 × 61.6 mm, ~90 g each ([datasheet copy](https://pdf.jiepei.com/ls33600-22301536.html), not yet checked against Saft's own PDF) | L1 |
| 2 × LM66100 ideal diode on SC-70-6 to DIP adapters, PTC fuse (about 0.5 A hold), JST-PH 2-pin (Adafruit 261) | adapters and PTC sizes not yet measured | L1 power bay |
| SHT40 (Adafruit 4885) + STEMMA QT cable (4209) | ~17.8 × 25.4 mm (unverified) | L1, floor pocket |
| Feather M0 + RFM95 (3178) | 50.8 × 22.9 × 8 mm | L2 |
| Adalogger FeatherWing (2922), CR1220 coin cell, microSD | 50.8 × 22.9 mm | L2 |
| FeatherWing Proto (2884): Q1, Q2, MCP6002 preamp, 3.5 mm jack, 3-pin screw terminal | 50.8 × 22.9 mm | L2 |
| uFL (1661) + SMA bulkhead cable (851) | 15 cm | L2 to the cap |
| Desiccant | not yet chosen | L3 |

Not inside: the Aquarian H2dM hydrophone body, the DS18B20 probe, the turbidity probe tip and the
SMA whip. Only their cables enter, through glands **in the top cap**.

## The four options

Side sections to scale: [`electronics-packaging-options-2026-10-15.svg`](../../../../assets/diagrams/electronics-packaging-options-2026-10-15.svg)
(regenerate with [`make_packaging_options_svg.py`](make_packaging_options_svg.py)).

| Option | Height used | Notes |
|---|---|---|
| A. Flat tower, cells upright | ~124 mm | Needs the whole 127 mm to be cavity. No margin |
| B. Flat tower, cells on their side | ~104 mm | Power parts get their own slab |
| **C. B with the power parts in the cradle (chosen)** | **~93 mm** (explorer; ~101 mm in the options drawing, which still carried the SHT40 and desiccant slab) | Fewest layers, lowest weight |
| D. Cells flank a standing Feather stack | ~90 mm | About 103 mm across, ~4 mm spare per side |

## Option C geometry (mm, z = height above the housing floor)

All layers: discs Ø104, 3 printed pillars Ø7 at radius 47.5 (angles 90°, 210°, 330°) with Ø3 steel
pins or M3 rod through Ø3.2 holes. Pillar lengths: 41 between L1 and L2, 38 between L2 and L3.

| Layer | z | Features |
|---|---|---|
| L1 cradle | 0 to 38 | 4 floor. Cells along X at y ±17.2, axis z 20.9. Two saddle ribs 69 × 6 × 16.9 at x −26 to −20 and 20 to 26, with Ø33.8 notches. Power bay frame 18 × 34 × 7 at x 40.5: diode pockets 15 × 8 at y 11 and 1, PTC 9 × 4 at y −8, JST 10 × 7 at y −14. SHT40 pocket frame 19 × 27 × 5 at x −40.5 |
| L2 stack tray | 45 to 76 | 3 tray. Four Ø6 × 4 standoffs at (±22.9, ±8.9). Boards 50.8 × 22.9: M0 z 52 to 60, Adalogger 61 to 69, Proto 70 to 75. Jack 14 × 11 × 6 at x −18, terminal 15 × 8 × 10 at x 16. Cut-outs Ø10 at (38, 0), Ø7 at (−37, 0), Ø8 at (0, −30) |
| L3 cable deck | 90 to 93 | 3 deck. Four Ø9 cable holes at (±32, ±12): DS18B20, turbidity, hydrophone, antenna. Desiccant pocket 30 × 14 × 8 at (0, −33) |

## Open items

1. **Usable height is unknown.** 127 mm is the decided inside height; whether the lid or cap uses
   part of it is not recorded ([`facts.md`](../../../../docs/hub/facts.md) Enclosure dimensions).
2. **Turbidity board location conflicts.** Rev B sheet 1 draws the Grove turbidity board inside this
   housing; the [Sensor Pod Packing Budget](../../../../docs/engineering/sensor-pod-packing-budget.md)
   puts it in the pod. Recorded in the [open questions](../../../../docs/hub/research/open-questions.md).
3. **Stack height ~30 mm is unverified**, as are the diode adapter, PTC, JST, jack and terminal sizes
   used here. Replace them with measured values when the Adafruit order arrives.
4. **Gland positions in the cap** are not drawn yet. L3's four holes assume one cable each.
5. [`electronics-housing-packing-budget.md`](../../../../docs/engineering/electronics-housing-packing-budget.md)
   still assumes the LiPo and PID 6106 and is superseded for layout by this folder.
