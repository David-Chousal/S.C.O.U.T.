# Printed-float tip explorer and stability study (2026-10-14)

> **Summary** — First stability and freeboard run for the battery-only redesign
> ([SCO-190](https://linear.app/scout1/issue/SCO-190)): a single printed float around the existing electronics
> housing, no ballast stem. At ~2.9 kg (v9, 2026-10-16) it floats at about 2.6 in draft with 3.9 in of freeboard and
> **self-rights from every angle, but with almost no margin near inverted**. Masses are mostly
> repo estimates; replace them with weighed values.

**Geometry:** [`printed-float-v9.step`](printed-float-v9.step) (updated 2026-10-16 from Fusion "Floatwhole"; [`printed-float-v8.step`](printed-float-v8.step) is the previous version), treated as a body of revolution with sealed, dry
chambers (outer envelope 7.0 L, 6.5 in tall, R 90 mm at the keel flaring to 124 mm). The housing sits on the socket
floor (25 mm above the keel) with its lid flange above the float top.
**Float mass:** 1154 g (Bambu, 5 wall loops, 5 top/bottom layers, 10% honeycomb, double-layer infill lines).
**Run:** `python run_printed_float.py` (uses the repo calculator's solver; needs gmsh and numpy).

**Interactive:** open [`printed-float-tip-explorer.html`](printed-float-tip-explorer.html) in a browser. Drag the heel slider (or press Play) to tilt the buoy and watch G, B and the righting arm; mass sliders recompute it. Figures: [`cross-section.png`](cross-section.png), [`gz-curve.png`](gz-curve.png). Rebuild with `python make_explorer.py`.

## Results (pod 4 in below the keel, no ballast)

| Quantity | Value |
|---|---|
| Total mass | 2.87 kg (v9, float 992 g); v8 was 3.03 kg |
| Draft / freeboard to float top | 2.56 in / 3.94 in |
| KG / GM | 2.26 in / 1.47 in |
| Max righting arm | 40 mm at ~70° |
| GZ at 150° / 170° / 178° | v8 (1154 g float): 17 / 5 / 1 mm. **Not recomputed for v9**; the solver reports it still self-rights (no vanishing angle) |

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

## v9 update, 2026-10-16

[`printed-float-v9.step`](printed-float-v9.step) is the float with the **cable guide channel** (a hole through the float, inside the outer
diameter and wider than the slot for the electronics housing, [SCO-190](https://linear.app/scout1/issue/SCO-190)). John Ryan reports
the printed float at **992 g** (v8: 1154 g). Re-running `run_printed_float.py` with 992 g: total mass 2.87 kg, draft 2.56 in,
freeboard 3.94 in, GM 1.47 in, still self-rights from every angle. The study reads only the outer envelope, so the channel itself does
not enter the geometry. The v9 solid is 5436 cm3 against 5461 cm3 for v8, with the same R 124 mm outer radius and top, and the keel face about
1.6 mm lower. `run_printed_float.py` and `make_explorer.py` now read v9 and the 992 g mass, and the explorer HTML is regenerated. The
chart images (`cross-section.png`, `gz-curve.png`) were not regenerated and still show v8. Tilt test from 180°
([SCO-171](https://linear.app/scout1/issue/SCO-171)) is still the check on the thin margin near inverted.
