# FEA — Floatation Side Load, 2026-08-17

> **Summary** — First structural FEA pass on the buoy: the chosen bolted-wedge floatation
> design plus its new bottom caps, under a static 300 N side load. Full interactive report:
> [`fea-floatation-side-load-2026-08-17.html`](fea-floatation-side-load-2026-08-17.html).

---

## Setup

| | |
|---|---|
| Tool | Autodesk Fusion (2704.1.53), Static Stress study |
| Model | Floatation wedges + bottom caps, heat-set attachment parts (Part 1:1, Part 2:1–6, Part 3:1–6) |
| Load case | "Side wave test 300 N" — 300 N total, resolved as X −259.808 N / Y 150.00 N / Z 0 N |
| Constraint | Fixed (Ux/Uy/Uz) at the chassis mounting reference |
| Material used for this pass | **ABS Plastic** (E = 2240 MPa, yield 20 MPa, UTS 29.6 MPa, ρ = 1.06×10⁻⁶ kg/mm³) — **not a build-material decision.** Print material (PETG vs ABS vs ASA) is still open; see [SCO-64](https://linear.app/scout1/issue/SCO-64). ABS was used as one candidate's material properties for this pass |
| Mesh | Parabolic solids, 84,831 nodes / 43,130 elements |

## Results

| Result | Min | Max |
|---|---|---|
| Safety factor | 25.4 | 43,374 (capped/local) |
| Von Mises stress | 4.6×10⁻⁴ MPa | 0.786 MPa |
| Total displacement | 0 mm | 0.23 mm |
| Total reaction force | 0 N | 30.0 N |

**Pass/fail criterion used:** safety factor ≥ 4. This is a **provisional check for this study
only**, not yet an established, derived requirement — max expected loads haven't been
calculated from first principles yet, so there's no basis yet to set a real target. Treat the
25.4 minimum as "comfortably above an arbitrary bar," not as a validated margin.

Fusion's own guided-results note flagged the min-25.4 result as an opportunity to reduce
material/volume — worth weighing once the material and wall/infill settings are finalized (see
[floatation README](../cad/floatation/README.md)), since removing material trades against the
foam-fill and bottom-cap impact-protection goals.

## What this does and doesn't establish

- **Does:** confirms the bolted wedge + bottom-cap assembly does not obviously fail under a
  moderate side load, at ABS material properties.
- **Doesn't:** establish a validated safety margin (no derived max load yet), cover other load
  directions (top load, torsion, mooring-point pull), cover temperature effects, or confirm
  behavior at the actual print material (PETG is still the default; ABS/ASA are under
  evaluation per [SCO-64](https://linear.app/scout1/issue/SCO-64)).

## Next steps

1. Calculate max expected loads from first principles (wave/current/impact) — replaces the
   300 N test input with a derived design load.
2. Repeat FEA across additional planes and directions.
3. Add a temperature analysis pass.
4. Re-run at the confirmed print material once [SCO-64](https://linear.app/scout1/issue/SCO-64)
   closes.
