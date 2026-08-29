# Force Budget

> **Summary** — **Living document.** Tracks the actual computed values for each FEA load case
> defined in the [Buoy Structural Load Framework](structural-load-framework.md), as the
> inputs each one needs become available. The framework holds the equations and their
> derivations; this doc is where real numbers get plugged in and kept current. **As of
> 2026-08-29, LC2–LC9 are computed** — LC2/LC8 from geometry+mass, LC3–LC7/LC9 at a *proposed*
> environmental design set that still needs team sign-off ([SCO-73](https://linear.app/scout1/issue/SCO-73)).
> LC1 (catenary baseline) remains blocked on mooring hardware. A ready-to-use Fusion load table
> is in [§ FEA load application](#fea-load-application--fusion-static-stress-setup).
>
> Part of the [Knowledge Hub](../../hub/README.md)'s supporting engineering docs. Tracks
> [SCO-73](https://linear.app/scout1/issue/SCO-73).

## How to update this document

1. When an input listed as blocking a case becomes available (a decision, a measurement, a
   chosen environmental value), compute that load case using the framework's equations.
2. Fill in that case's row below with the result, the date, and a link to the calculation
   (a commit, a spreadsheet, or inline here if short).
3. Update the case's status in the table and re-check whether any *other* case is now
   unblocked as a result.
4. If a computed load changes a structural conclusion, log it in
   [`design-notes.md`](../../hub/design-notes.md) and, if significant, add a
   [`decision-log.md`](../../hub/decision-log.md) row.

---

## What today's mass/buoyancy work unlocked

[Buoy Mass and Buoyancy Budget](mass-and-buoyancy-budget.md) supplies the printed shell's
`m_b` (part of it) and `V_disp` — real progress on inputs the framework's §1 table had marked
`[M]` "not yet available until parts are finalized." **This does not fully resolve `m_b`** —
electronics, battery, solar mount, and mooring hardware mass are still outside those five
drawings, blocked on [SCO-70](https://linear.app/scout1/issue/SCO-70). Treat every case below
that depends on `m_b` as using a **shell-only placeholder**, not the final buoy mass, until that
lands.

**Updated 2026-08-24** — all five shell parts now have real slicer-measured weights (was a mix
of calculated/calibrated estimates before). Shell-only `m_b` is **5.494 kg**, `V_disp` is
**38.93 L** — see [Buoy Mass and Buoyancy Budget §9](mass-and-buoyancy-budget.md#9-aggregate--printed-shell-system)
for the full breakdown. (This also corrects a stale `m_b ≈ 4.0 kg` figure that had been left in
this section below since before the 2026-08-21 wedge recalibration bumped the shell-only total
to ~5.49 kg — that earlier value was never updated here.)

**Updated 2026-08-29** — [Buoy Mass, Displacement, and Freeboard Model](buoy-mass-displacement-and-freeboard-model.md)
extends the shell budget to the **whole deployed buoy** (electronics/battery/solar/stem/mooring
hardware estimated pending [SCO-70](https://linear.app/scout1/issue/SCO-70)) and solves the
floating equilibrium. This unblocks the geometry/statics inputs the FEA needs:

| Input | Value | Tag |
|---|---|---|
| Complete deployed mass `m_b` | **8.40 kg** nominal (7.06 low / 10.50 high) | [A] — Tier III still on SCO-70 |
| Buoy weight `W = m_b g` | 82.4 N nominal (69.3 / 103.0) | [A] |
| Buoy diameter `D` | 0.4572 m (18.000 in) | [M] |
| Draft / submerged height `h_s` | **0.0683 m** (2.69 in) nominal | [A]-derived |
| Displaced volume at equilibrium `V_disp` | 7.834 L = 0.007834 m³ | [A]-derived |
| Max buoyant force `F_B,max` (fully submerged) | **391.3 N** | [X from M] |
| **Net reserve buoyancy** `F_B,max − W` | **308.9 N** nominal, **322.0 N** at the light build | [A]-derived |
| Waterplane area `A_wp` | 0.16417 m² | [X from M] |
| Exposed float height above the waterline | 0.1857 m (7.31 in) | [A]-derived |

The reserve-buoyancy figure **is** the LC2 result (below): the vertical load the mooring / U-bolt
sees if the buoy is pulled fully under on a taut line. `h_s` is the LC8 draft. What is still an
`[E]` team decision — not unblocked by this — is the **environmental design set** (`H`, `T`,
`U_c`, `U_wind`); a *recommended* set and the loads it produces are in
[§ Recommended environmental design values](#recommended-environmental-design-values--proposed-needs-team-sign-off) below,
flagged **proposed** until the team signs off (that sign-off is the core of
[SCO-73](https://linear.app/scout1/issue/SCO-73)).

## Load case status

Mirrors the [Buoy Structural Load Framework §10](structural-load-framework.md#10-corrected-fea-load-cases)
table exactly — same case numbering, same primary checks.

**Two tiers of readiness.** LC2 and LC8 need only geometry + mass and are **computed** below.
LC3–LC7, LC9 additionally need the `[E]` environmental design set — computed here at the
**proposed** survival values (see the next section), to be re-run if the team picks different
numbers. LC1 remains fully blocked on mooring hardware.

| Case | Load | Status | Design result (survival) |
|---|---|---|---|
| LC1 | Slack-mooring calm-water catenary tension | **Blocked** — needs scope `S`, line unit weight `w_m` ([SCO-69](https://linear.app/scout1/issue/SCO-69)) | — |
| LC2 | Upper-bound taut-line vertical tension `F_B,max − W` | **Computed** | **+322 N** vertical uplift at the U-bolt (light build; 309 N nominal) |
| LC3 | Current-only lateral load | **Computed (proposed `U_c`)** | **~14 N** horizontal on the submerged band |
| LC4 | Wave drag + inertia, phase-swept | **Computed (proposed `H`,`T`,`d`)** — linear-theory validity flagged (Ursell ≈ 98) | **~185 N** horizontal on the wetted float band |
| LC5 | Wave + current, aligned, phase-swept | **Computed (proposed)** | **~440 N** horizontal (crest engulfment) |
| LC6 | Resultant `F_H`, `F_V` at shackle | **Computed (proposed)** | `F_H` 490 N, `F_V` 322 N → **‖T‖ ≈ 586 N at 57° from vertical** |
| LC7 | `F_H` + overturning moment, per-component lever arms | **Computed (proposed)** | `F_H` 490 N + **`M` ≈ 70 N·m** about the U-bolt |
| LC8 | Hydrostatic pressure | **Computed** | **50.3 kPa** external (5 m water-equivalent test spec); 0.69 kPa as-floating (non-governing) |
| LC9 | Amplified snap-load case | **Computed (proposed, ×2.0 dynamic)** | `F` (490, 0, 644) N → **‖T‖ ≈ 810 N at 37° from vertical** |

Cross-check against the [2026-08-17 side-load FEA](../../../mechanical/test/fea-floatation-side-load-2026-08-17.md):
that study used a **300 N** side load and found min SF 25.4. LC5/LC6 here (440–490 N) are ~1.5×
that, implying a re-run min SF of roughly ~16 — still far above any credible target, consistent
with the "over-engineered for the cost target" finding. Boat-strike / impact survivability is a
**separate** non-quasi-static study ([SCO-71](https://linear.app/scout1/issue/SCO-71)), not one
of these load cases.

## Recommended environmental design values (proposed — needs team sign-off)

These are `[E]` choices, not measurements. They are **proposed** here so the FEA can run now;
the team must confirm or revise them, and that confirmation is the substance of
[SCO-73](https://linear.app/scout1/issue/SCO-73). Site basis: nearshore Hawaii reef, 2–8 m
(commonly 2–3 m per the [panel review §3](../reviews/buoy-preliminary-design-panel-review-2026-08.md)),
moderate-to-low wave climate, trade-wind exposed, slack catenary mooring
([ADR-0004](../../decisions/0004-reef-safe-anchoring-and-mooring.md)), deployment window
Mar–May 2027 (pre–hurricane season; the buoy is recovered ahead of a forecast hurricane, so the
survival case is a strong gale / marginal tropical storm, **not** a design hurricane).

| Parameter | Symbol | Normal | **Survival (design)** | Basis | Tag |
|---|---|---|---|---|---|
| Design water depth | `d` | 3.0 m | **2.0 m** | shallowest routine depth → highest wave orbital velocity at the buoy, most conservative | [E] |
| Wave height | `H` | 0.4 m | **1.2 m** | depth-limited (`H/d` ≈ 0.6, below the ~0.78 breaking limit); "moderate-to-low" per panel §3 | [E] |
| Wave period | `T_w` | 4 s | **6 s** | local wind-sea to moderate refracted swell | [E] |
| Current speed | `U_c` | 0.3 m/s | **0.8 m/s** | reef-flat tidal/wind-driven flow; 0.8 covers channelised flow | [E] |
| Wind speed | `U_wind` | 10 m/s | **22 m/s** (~43 kt) | trade-wind normal; survival = strong gale, sub-hurricane | [E] |
| Seawater density | `ρ_w` | — | 1025 kg/m³ | standard | [L] |
| Air density | `ρ_air` | — | 1.225 kg/m³ | sea level, standard | [L] |
| Kinematic viscosity | `ν` | — | 1.05×10⁻⁶ m²/s | Sharqawy 2010, ~25 °C / 35 g/kg | [L] |

### Coefficient selection (framework §3.1)

```
Steady current:  Re = U_c D / nu = 0.8 * 0.4572 / 1.05e-6 = 3.48e5
                 → smooth-cylinder critical-transition range; with fouling roughness take C_D = 1.2   [A]

Wave (oscillatory):  u_m computed below = 1.379 m/s
                     KC = u_m T_w / D = 1.379 * 6 / 0.4572 = 18.1
                     → DNV-RP-C205 smooth-cylinder curves at KC ≈ 18: C_D ≈ 1.5, C_M ≈ 1.8   [A]
```
`[A]` until the DNV-RP-C205 table values are pulled directly for the final report (framework §3.1).

### Wave kinematics — linear (Airy), survival `H` = 1.2 m, `T_w` = 6 s, `d` = 2 m

```
omega = 2 pi / T_w = 1.0472 rad/s
dispersion  omega^2 = g k tanh(k d):  1.0966 = 9.81 k tanh(2k)  → solve  k = 0.2459 /m
L  = 2 pi / k = 25.55 m
k d = 0.4918 ;  sinh(kd) = 0.5117 ;  cosh(kd) = 1.1234 ;  coth(kd) = 2.1955

surface orbital velocity amplitude   u_m = (H omega / 2) coth(kd) = (1.2*1.0472/2)*2.1955 = 1.379 m/s
surface orbital acceleration ampl.    a_m = (H omega^2/2) coth(kd) = (1.2*1.0966/2)*2.1955 = 1.445 m/s^2
```

**Validity checks (framework §4.1) — both flagged:**
```
Ursell   Ur = H L^2 / d^3 = 1.2 * 25.55^2 / 2^3 = 97.9     → >> 26: linear theory is outside its
         comfortable range. A Stokes-2nd / stream-function recheck is a final-report item; for a
         first-pass FEA load, linear kinematics with a drag-dominated response is acceptable and
         mildly conservative on velocity.  [A]
Miche    H_max = 0.142 L tanh(kd) = 0.142 * 25.55 * 0.4555 = 1.65 m   → design H = 1.2 m < 1.65 m:
         non-breaking at d = 2 m. If local depth drops below ~1.6 m the design wave breaks and a
         slamming model (out of framework scope, SCO-71) governs instead.  [L]
```

### Areas (from the freeboard model geometry)

```
still-water submerged frontal area     A_p,sw  = D h_s      = 0.4572 * 0.0683 = 0.0312 m^2
                                       (use 0.035 m^2 at the slightly deeper survival draft)
wave-crest engulfment (full float ring wetted)  A_p,crest = D * 0.254 = 0.1161 m^2
submerged volume at crest                       V_sub,crest ≈ A_wp * 0.254 ≈ 0.040 m^3
above-water frontal area (normal to wind):
   exposed float ring   0.4572 * 0.1857 = 0.0849 m^2   at z_c = 0.161 m above the keel
   chassis stub + cap   0.146  * 0.033  = 0.0048 m^2   at z_c = 0.28 m
   solar panel + mount  ~0.05 m^2 [A]                  at z_c = 0.36 m
   A_air,total ≈ 0.135 m^2
```

---

## Computed load cases

`g` = 9.81 m/s². Keel datum `z = 0` at the U-bolt / chassis bottom (per the freeboard model §1).
Horizontal environmental loads are taken **co-linear and co-directional** (`+X`) — the
conservative aligned case (framework LC5); real headings differ.

### LC2 — taut-line vertical uplift  →  **+322 N vertical at the U-bolt**

```
F_net = F_B,max - W        (buoy pulled fully under on a taut line; framework §8.3)
nominal build:  391.3 - 82.4 = 308.9 N
light build:    391.3 - 69.3 = 322.0 N    ← design value (lightest credible build = most uplift)
```
Pure axial tension on the U-bolt, its legs, the backing plate, and the local chassis boss — the
single-point-failure region the panel review flagged (Action A1).

### LC3 — current drag  →  **~14 N horizontal**

```
F_current = 0.5 rho_w C_D A_p,sw U_c^2 = 0.5 * 1025 * 1.2 * 0.035 * 0.8^2 = 13.8 N
```
Distributed over the submerged hull band (`z` = 0 → 0.068 m), acting at `z ≈ 0.05 m`.

### LC4 — wave load, Morison, phase-swept  →  **~185 N horizontal**

```
drag amplitude     F_D,w = 0.5 rho_w C_D,w A_p,crest u_m^2 = 0.5*1025*1.5*0.1161*1.379^2 = 169.6 N
inertia amplitude  F_I,w = rho_w C_M V_sub,crest a_m       = 1025*1.8*0.040*1.445        = 106.6 N
phase sweep F(phi) = F_D,w cos(phi)|cos(phi)| - F_I,w sin(phi),  phi in [0, 2pi)
   → max |F| ≈ 1.09 * F_D,w ≈ 185 N     (not the 200 N naive sqrt-sum; drag peak governs)
```
Over the wetted float band, resultant at `z ≈ 0.13 m`.

### LC5 — wave + current, aligned, phase-swept  →  **~440 N horizontal**

```
drag term at the drag-peak phase uses (U_c + u_m) = 0.8 + 1.379 = 2.179 m/s
F_D,5 = 0.5 rho_w C_D,w A_p,crest (U_c+u_m)^2 = 0.5*1025*1.5*0.1161*2.179^2 = 423.8 N
+ inertia ~107 N, 90 deg out of phase → phase-swept max ≈ 440 N
```
This is the governing horizontal environmental load. Over the wetted float band, `z ≈ 0.13 m`.

### Wind  →  **~50 N horizontal, acting high**

```
per patch  F = 0.5 rho_air C_D,air A U_wind^2,  C_D,air = 1.2,  U_wind = 22 m/s
   float ring   0.5*1.225*1.2*0.0849*484 = 30.2 N  @ z = 0.161 m
   chassis stub 0.5*1.225*1.2*0.0048*484 =  1.7 N  @ z = 0.28 m
   solar        0.5*1.225*1.2*0.05  *484 = 17.8 N  @ z = 0.36 m
   Sum F_wind = 49.7 N ;  moment about keel  Sigma(F z) = 4.86 + 0.48 + 6.41 = 11.75 N·m
```

### LC6 — resultant at the shackle / U-bolt  →  **‖T‖ ≈ 586 N at 57° from vertical**

```
F_H = F_LC5 + F_wind = 440 + 50 = 490 N   (+X)
F_V = LC2 reserve buoyancy               = 322 N   (+Z, up)
T_shackle = sqrt(490^2 + 322^2) = sqrt(343784) = 586 N
theta     = atan(F_H / F_V) = atan(1.522) = 56.7 deg from vertical
```

### LC7 — horizontal load + overturning moment (per-component lever arms, framework §9.1)

```
M about the U-bolt (z = 0):
   current       14  N * 0.05 m =  0.7  N·m
   wave+current  440 N * 0.13 m = 57.2  N·m
   wind          (composite)    = 11.75 N·m
   M_shackle = 0.7 + 57.2 + 11.75 = 69.7 N·m  ≈ 70 N·m
```
Apply `F_H` = 490 N (`+X`) at the U-bolt together with a 70 N·m couple about the `+Y` axis on the
chassis.

### LC8 — hydrostatic pressure  →  **50.3 kPa external on all sealed boundaries**

```
as-floating:  p = rho_w g h_s = 1025 * 9.81 * 0.0683 =   687 Pa  = 0.69 kPa   (non-governing, skip)
design test:  p = rho_w g * 5.0 m                     = 50 280 Pa = 50.3 kPa   (7.3 psi)
```
The **5 m water-equivalent** value is the waterproofing pressure-test spec
([`mechanical/README.md`](../../../mechanical/README.md), Team Timeline Phase 5) and also covers a
storm push-under and the sensor pod at the bottom of the 2–8 m range. Apply as a uniform inward
normal pressure on: chassis OD wall, chassis cap outer face, chassis bottom / end cap, the O-ring
land, the cable-gland bosses, and the U-bolt penetration. Closed-cell foam transmits the pressure
into the wedge cavities; the wedge shell sees 50.3 kPa external but is foam-backed, so net wall
stress there is low — the chassis and its seals are what this case checks.

### LC9 — amplified snap load  →  **‖T‖ ≈ 810 N at 37° from vertical**

A slack catenary going taut under a wave is a dynamic snap; framework says ×1.5–2.0. Using ×2.0
on the vertical component:

```
F_V,snap = 322 * 2.0 = 644 N
F_H       = 490 N  (LC6 horizontal, not amplified — the snap is a heave event)
T_snap    = sqrt(490^2 + 644^2) = sqrt(654836) = 809 N
theta     = atan(490 / 644) = 37.3 deg from vertical
```

---

## FEA load application — Fusion Static Stress setup

Axes: **Z** = buoy vertical axis (up +), **X** = the aligned environmental direction, **Y** =
transverse horizontal. Enable **gravity** in every case. Assign **PETG** (`ρ` = 1.27e-6 kg/mm³,
`E` ≈ 2.0 GPa, yield ≈ 50 MPa) as the primary run, then repeat the governing cases for ABS and
ASA per [SCO-64](https://linear.app/scout1/issue/SCO-64). The 2026-08-17 pass used ABS — not a
build-material decision.

| FEA case | Load (vector / pressure) | Applied to | Constraint |
|---|---|---|---|
| **LC2** vertical uplift | `(0, 0, +322)` N | U-bolt hole faces (or backing-plate seat) | Fix the chassis-cap seat ring + wedge-top ring (Ux=Uy=Uz) |
| **LC3** current | `(+14, 0, 0)` N, uniform on the wetted band `z` = 0–0.068 m | outer wedge surfaces, lower band | Fix U-bolt hole |
| **LC4** wave | `(+185, 0, 0)` N, uniform on the wetted float band `z` = 0–0.254 m | outer wedge surfaces | Fix U-bolt hole |
| **LC5** wave+current | `(+440, 0, 0)` N, uniform on the wetted float band | outer wedge surfaces | Fix U-bolt hole |
| **LC6** combined resultant | `(+490, 0, +322)` N at the U-bolt boss | U-bolt hole / backing plate | Fix chassis-cap seat ring |
| **LC7** load + moment | `(+490, 0, 0)` N at the U-bolt boss **+** `(0, +70, 0)` N·m couple on the chassis | U-bolt boss + chassis wall | Fix chassis-cap seat ring |
| **LC8** hydrostatic | 50.3 kPa inward normal | all sealed boundaries (chassis OD, both caps, O-ring land, gland bosses, U-bolt penetration) | Fix one cap face, or use inertial relief |
| **LC9** snap | `(+490, 0, +644)` N at the U-bolt boss | U-bolt hole / backing plate | Fix chassis-cap seat ring |
| **Service down-load** | `(0, 0, −200)` N (≈ handling + stood-on) | chassis-cap top face | Fix U-bolt hole |

**Two azimuths for every lateral case.** The 6-wedge ring has 60° symmetry; run the horizontal
load at **0°** (pointing into a wedge face — worst for that wedge's bolt group) and at **30°**
(pointing into a wedge-to-wedge seam / bolt line — worst for the seam and the chassis boss).
Those two bracket the pattern.

**Quasi-static impact screen (not a substitute for [SCO-71](https://linear.app/scout1/issue/SCO-71)).**
For a first look at a light grounding / hull bump, a localised **1–2 kN** point (or 25 mm patch)
load on one wedge outer face at the waterline (`z` ≈ 0.07 m) is a reasonable equivalent — but
real boat-strike survivability needs the dynamic/impact study, cross-checked against bench
impact tests.

**What is still `[E]`-blocked:** every LC3–LC9 number moves if the team picks a different
environmental design set. LC1 (catenary baseline) stays fully blocked on mooring scope `S` and
line unit weight `w_m` ([SCO-69](https://linear.app/scout1/issue/SCO-69)).

## Open items (mirrors the framework's §12)

1. **Mooring scope `S` and line unit weight `w_m`** — blocks LC1 only — [SCO-69](https://linear.app/scout1/issue/SCO-69).
2. **Environmental design set sign-off** (`d`, `H`, `T_w`, `U_c`, `U_wind`) — a *proposed* set is
   in [§ Recommended environmental design values](#recommended-environmental-design-values--proposed-needs-team-sign-off);
   LC3–LC9 are computed at it and must be re-run if the team revises it. This sign-off is
   [SCO-73](https://linear.app/scout1/issue/SCO-73)'s core deliverable.
3. **Complete deployed mass `m_b`** — Tier III of the [freeboard model](buoy-mass-displacement-and-freeboard-model.md#3-full-mass-budget)
   is still `[A]` pending [SCO-70](https://linear.app/scout1/issue/SCO-70); the LC2/LC6/LC9
   vertical component and the LC8 draft shift when it lands (light-build 322 N is the current
   design value).
4. **Final `C_D`, `C_M`, `C_A`** — the `Re`/`KC` values are now computed (§ Coefficient
   selection); pull the exact DNV-RP-C205 table entries for the final report rather than the
   `[A]` mid-range values used here.
5. **Linear-wave-theory validity** — Ursell ≈ 98 at the survival wave; a Stokes-2nd /
   stream-function recheck of `u_m`, `a_m` is a final-report item (framework §4.1).
6. **Per-component lever arms `r_CP,i`** — used mid-band / mid-draft estimates for LC7; tighten
   once the chassis/U-bolt geometry is fixed ([SCO-49](https://linear.app/scout1/issue/SCO-49),
   [SCO-69](https://linear.app/scout1/issue/SCO-69)).
