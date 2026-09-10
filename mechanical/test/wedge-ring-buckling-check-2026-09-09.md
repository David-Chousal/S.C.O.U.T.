# Closed-Form External-Pressure Buckling Check — v5 Flotation Wedge Ring

**Date:** 2026-09-09 · **Owner:** GE lead · **Type:** closed-form structural check (not FEA)

> **Question.** The v5 wedge thinning (outer curved wall 0.250 → **0.095 in**) left the
> [2026-09-07 wall check](wedge-wall-thickness-structural-check-2026-09-07.md) with the
> statement *"a single bare panel is marginal on external-pressure buckling — the bonded ring is
> much stiffer but needs an assembly-level buckling FEA to confirm; foam must be in before any
> submersion."* This check puts numbers on that: **how far under is the bare wall, and how much
> does the foam backing recover?** It is a bounding hand calculation, **not a substitute for the
> assembly-level ring-buckling FEA** still owed on
> [SCO-71](https://linear.app/scout1/issue/SCO-71) / [SCO-73](https://linear.app/scout1/issue/SCO-73).
>
> **Result:** the bare 0.095 in outer wall buckles well below the 50.3 kPa (5 m) design
> pressure — **SF ≈ 0.01 as a free ring, ≈ 0.2–0.7 as an edge-supported curved panel.**
> Foam-bonded to the wall inner face it recovers to **SF ≈ 3–5**. **The "foam in before
> submersion" rule is confirmed and quantified**; the bonded 6-wedge ring is stiffer again and
> is the case the FEA must close.

## 1. Inputs

| Quantity | Symbol | Value | Tag |
|---|---|---|---|
| Outer curved wall thickness (v5) | `t` | 0.095 in = 2.413 mm | [M] |
| Outer radius | `R` | 9.000 in = 0.2286 m | [M] |
| Wedge sector angle | `θ` | 60° = π/3 rad | [X] |
| Curved panel arc width (between epoxied radial seams) | `b = R·θ` | 9.425 in = 0.2394 m | [X from M] |
| Panel height (between wedge cap and wedge bottom) | `L` | 5.500 in = 0.1397 m | [M] |
| PETG Young's modulus | `E` | 2240 MPa | [A] — Fusion custom profile, [force budget](../../docs/engineering/buoy-structural/force-budget.md) |
| PETG Poisson ratio | `ν` | 0.38 | [A] |
| Foam compressive modulus (US Composites #0204, 2 lb/ft³) | `E_f` | ~10 MPa (range 7–14) | [A] — generic 2 pcf rigid PU; datasheet pending [SCO-76](https://linear.app/scout1/issue/SCO-76) |
| Design external pressure (5 m water equivalent) | `p_d` | 50.3 kPa | [M] — LC8, waterproofing test spec |

Wall bending stiffness per unit width:
```
D = E t³ / (12 (1 − ν²)) = 2.24e9 · (2.413e-3)³ / (12 · (1 − 0.38²))
  = 2.24e9 · 1.405e-8 / (12 · 0.8556)
  = 31.47 / 10.267
  = 3.065 N·m       [X from M+A]
```

## 2. Bare wall — no foam credit

### 2.1 As a free ring (lower bound)

The classic long-tube / free-ring external-pressure buckling pressure (n = 2 ovalisation mode):
```
p_cr,ring = E t³ / (4 R³ (1 − ν²))          [L] — Timoshenko, Theory of Elastic Stability
          = 2.24e9 · (2.413e-3)³ / (4 · (0.2286)³ · 0.8556)
          = 2.24e9 · 1.405e-8 / (4 · 0.011944 · 0.8556)
          = 31.47 / 0.040876
          = 770 Pa
```
`SF = 770 / 50 300 = ` **0.015**. A bare, unsupported ring of this wall would collapse under
about 8 cm of water head.

### 2.2 As an edge-supported curved panel (realistic bare case)

The wall is not a free ring — it is bounded by the **epoxied radial seams** every 60° (arc
`b` = 9.43 in) and by the **wedge cap and wedge bottom** top and bottom (`L` = 5.5 in). The
buckle half-wavelength is capped at ~`b`, which raises `p_cr` substantially.

Batdorf curvature parameter:
```
Z_b = (b² / (R t)) · √(1 − ν²) = (0.2394² / (0.2286 · 2.413e-3)) · 0.925
    = (0.05731 / 5.517e-4) · 0.925 = 103.9 · 0.925 = 96.1
```
`Z_b` ≈ 96 → a **moderately deep** curved panel (between flat-plate and full-cylinder
behaviour). Bracketing:

- **Flat-plate lower bound** (ignore curvature, all edges simply supported, hoop compression
  `N_θ = p R`): `N_cr = k π² D / b²` with `k` ≈ 4 for a panel of this aspect ratio →
  `N_cr = 4 · 9.87 · 3.065 / 0.05731 = 2112 N/m`; `p_cr = N_cr / R = 2112 / 0.2286 = 9240 Pa`.
  `SF ≈ 0.18`.
- **Curved-panel correction** for `Z_b` ≈ 96: NASA SP-8007 / Timoshenko charts give a knock-up
  factor of roughly 2–4× over the flat-plate value for external-pressure (hoop) buckling at
  this `Z_b`, so `p_cr` ≈ 18–37 kPa. `SF ≈ 0.4–0.7`.

**Bare edge-supported wall: `SF` ≈ 0.2–0.7 against the 50.3 kPa design pressure — it does not
pass.** Consistent with the 2026-09-07 wording ("marginal … a single bare panel"), quantified:
marginal-to-failing, not adequate.

## 3. Foam-backed wall

The wedge cavity is filled with rigid closed-cell PU foam **bonded to the wall inner face**. For
short-wavelength inward buckling the foam acts as an elastic foundation resisting the wall's
radial deflection.

Foundation modulus (force per unit area per unit radial deflection), taking the effective foam
depth mobilised by a buckle of wavelength ~`b` as `L_c` ≈ `b`/4 ≈ 60 mm:
```
k_f = E_f / L_c = 10e6 / 0.060 = 1.67e8 N/m³     [A]
```

Plate-on-elastic-foundation buckling (the foundation adds a term independent of wavelength at
the critical mode):
```
N_cr,found = 2 √(k_f · D) = 2 √(1.67e8 · 3.065) = 2 √(5.12e8) = 2 · 22 630 = 45 260 N/m
p_cr,found = N_cr,found / R = 45 260 / 0.2286 = 198 kPa
```

Total (edge-supported panel **plus** foundation):
```
p_cr,total ≈ p_cr,panel + p_cr,found ≈ (18–37) + 198 ≈ 216–235 kPa
SF = 216 000 / 50 300 ≈ 4.3     (range 3.3–4.9 across the foam-modulus and panel-bracket spread)
```

**Foam-backed: `SF` ≈ 3–5.** The foam is doing the structural work the thinned wall gave up.

## 4. The bonded 6-wedge ring (the FEA case)

Beyond the foam-on-single-panel model, the **six wedges epoxied at their radial seams form a
closed monocoque ring** (confirmed by John — exactly 60° each, seams epoxied, foam poured after
ring assembly). The bonded seams turn the assembly into a continuous stiffened ring rather than
six independent panels: the effective `I` for ring ovalisation includes the full wall + the
3.2 mm bonded seam acting as a stringer at each 60° station, and the wedge caps + bottoms + the
chassis core add hoop restraint. This is **stiffer again** than the foam-backed single panel of
§3 — but the interaction of the bonded seams, the foam, the caps, and the chassis under
combined external pressure is exactly what a closed-form check cannot resolve.

**This is the open FEA case** ([SCO-71](https://linear.app/scout1/issue/SCO-71) /
[SCO-73](https://linear.app/scout1/issue/SCO-73)): an assembly-level linear (and ideally
nonlinear/imperfection-sensitive) buckling analysis of the epoxied ring with the foam modelled
as a bonded elastic core, under the 50.3 kPa external pressure. Expected outcome given §3:
comfortable margin, but it needs confirming before the "foam in before submersion" rule can be
relaxed.

## 5. Conclusions

1. **Bare** (no foam): the v5 outer wall fails external-pressure buckling — `SF` ≈ 0.2–0.7 as an
   edge-supported panel, far worse as a free ring. **Never submerge a foam-empty wedge.**
2. **Foam-backed** (single panel on elastic foundation): `SF` ≈ 3–5. Adequate.
3. **Epoxied 6-wedge ring**: stiffer than (2); the confirming FEA is
   [SCO-71](https://linear.app/scout1/issue/SCO-71) / [SCO-73](https://linear.app/scout1/issue/SCO-73).
4. Sensitivity: the result leans on the foam modulus `E_f` (assumed ~10 MPa) — pull the
   US Composites #0204 datasheet value ([SCO-76](https://linear.app/scout1/issue/SCO-76)) and
   re-run §3 before treating the `SF` ≈ 3–5 as firm.
5. This does **not** change the [2026-09-07 check](wedge-wall-thickness-structural-check-2026-09-07.md)'s
   conclusions on wall *stress* (outer wall SF 7.3 on yield) — that check was on membrane/bending
   stress, this one is on stability. Both must pass; the stability mode is the binding one for
   the bare wall.
