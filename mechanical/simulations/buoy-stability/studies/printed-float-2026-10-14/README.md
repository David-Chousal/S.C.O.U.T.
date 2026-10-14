# Printed-float buoy: stability check, 2026-10-14

> **Summary** — First stability and freeboard run for the battery-only redesign
> ([SCO-190](https://linear.app/scout1/issue/SCO-190)): a single printed float around the existing electronics
> housing, no ballast stem. At ~3.0 kg it floats at about 2.7 in draft with 3.8 in of freeboard and
> **self-rights from every angle, but with almost no margin near inverted**. Masses are mostly
> repo estimates; replace them with weighed values.

**Geometry:** [`printed-float-v8.step`](printed-float-v8.step), treated as a body of revolution with sealed, dry
chambers (outer envelope 7.0 L, 6.5 in tall, R 90 mm at the keel flaring to 124 mm). The housing sits on the socket
floor (25 mm above the keel) with its lid flange above the float top.
**Float mass:** 1154 g (Bambu, 5 wall loops, 5 top/bottom layers, 10% honeycomb, double-layer infill lines).
**Run:** `python run_printed_float.py` (uses the repo calculator's solver; needs gmsh and numpy).

**Interactive:** open [`printed-float-explorer.html`](printed-float-explorer.html) in a browser. Drag the heel slider (or press Play) to tilt the buoy and watch G, B and the righting arm; mass sliders recompute it. Figures: [`cross-section.png`](cross-section.png), [`gz-curve.png`](gz-curve.png). Rebuild with `python make_explorer.py`.

## Results (pod 4 in below the keel, no ballast)

| Quantity | Value |
|---|---|
| Total mass | 3.03 kg |
| Draft / freeboard to float top | 2.70 in / 3.80 in |
| KG / GM | 2.27 in / 1.43 in |
| Max righting arm | 40 mm at ~70° |
| GZ at 150° / 170° / 178° | 17 / 5 / 1 mm (positive everywhere, so it self-rights) |

- **Margin near inverted is thin.** GZ falls to about 1 mm at 178°. The hull shape, not the mass, drives this, so
  ballast helps little: 500 g at the keel raises GZ at 178° only from 1.1 to 1.5 mm. Confirm with a physical tilt
  test from 180° ([SCO-171](https://linear.app/scout1/issue/SCO-171)).
- **Pod depth** moves GM only: pod at the keel 1.20 in, at 13.5 in below 1.96 in. The pod and hydrophone are
  the biggest appendage lever.
- **Reserve buoyancy** is large: adding 2 kg still leaves 2.1 in of freeboard.

## Assumptions (all estimates unless marked)

- Electronics masses from the repo budget (`V5_BASE`), stacked from the housing bottom upward: battery 250 g
  at 25 mm, boards at 80–90 mm, antenna at 150 mm. Solar and its mount removed.
- Epoxy/coating 330 g, mooring hardware 220 g at the keel, pod 217 g plus hydrophone 150 g (4 in below the keel).
- No foam in the float, no ballast stem. The flange above the float top is modelled as a R 89 mm cylinder.
- Not covered: mooring heel, wave loads, chamber flooding, biofouling mass.
