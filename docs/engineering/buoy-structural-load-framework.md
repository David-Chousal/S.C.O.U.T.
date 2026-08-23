# Buoy Structural Load Framework

> **Summary** — Formalized, corrected force and moment equations for FEA structural load cases
> on the SCOUT buoy hull, central chassis, and mooring shackle/U-bolt. Every input and result is
> labeled by provenance (measured, chosen design value, literature coefficient, exact relation,
> wave-theory result, or conservative assumption) so the final report can defend each number.
> Formulas are kept in plain-text form (not LaTeX) so they can be copied directly into a
> spreadsheet or Fusion's FEA study setup.
>
> **Source document** — Derived from a ChatGPT-drafted load-calculation summary
> (`SCOUT_Buoy_FEA_Load_Summary.pdf`, John Ryan, 2026-08-20). Reviewed against
> [ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md) and standard references;
> corrections and rationale are called out inline as **Correction** notes.
>
> Part of the [Knowledge Hub](../hub/README.md)'s supporting engineering docs. Feeds the FEA
> work tracked on [SCO-71](https://linear.app/scout1/issue/SCO-71) (impact survivability) and
> the buoyancy check on [SCO-48](https://linear.app/scout1/issue/SCO-48).
>
> **2026-08-21 update** — the `m_b`/`V_disp` inputs below (tagged `[M]`, "not yet available
> until parts are finalized") are now partially available: [Buoy Mass and Buoyancy Budget](buoy-mass-and-buoyancy-budget.md)
> computes them for the printed shell from dimensioned drawings (electronics/battery/mooring
> hardware still pending [SCO-70](https://linear.app/scout1/issue/SCO-70)). The actual computed
> values for each load case in [§10](#10-corrected-fea-load-cases) are tracked as they become
> available in [Force Budget](force-budget.md), not in this doc — this one stays the equations
> and their derivations.

---

## 0. Provenance legend

Every value below is tagged with one of these codes, per the labeling scheme this framework
itself recommends for the senior-design report:

| Tag | Meaning |
|---|---|
| **[M]** | Measured from the actual built/CAD geometry — not yet available until parts are finalized |
| **[E]** | Environmental design input — a value the team chooses (design wave, current, wind) |
| **[L]** | Literature coefficient — sourced from a citable reference, not assumed |
| **[X]** | Exact equilibrium or vector relationship — true by definition, no approximation |
| **[W]** | Linear (Airy) wave-theory result — exact within that theory's own assumptions |
| **[A]** | Conservative modeling assumption — a deliberate simplification, stated explicitly |

An **[A]** tag is not a weakness — it means the simplification is named so a reviewer can judge
whether it's conservative enough, not silently baked into a number.

---

## 1. Required inputs

Corrected from the source draft — `A_air` and the mooring-scope inputs were used in later
formulas but never listed here.

| Variable | Meaning | Tag |
|---|---|---|
| `D` | Buoy diameter | [M] |
| `h_s` | Submerged height / draft | [M] |
| `h_ch`, `R1`, `R2` | Chamfer/frustum geometry | [M] |
| `m_b` | Complete deployed buoy mass | [M] |
| `A_air` | Above-water projected frontal area (solar panel + upper body, normal to wind) | [M] — **added; missing from the source draft's input list despite being used in §6** |
| `H`, `T` | Design wave height and period | [E] |
| `d` | Water depth at the deployment site | [M]/[E] — use the shallowest expected depth for conservatism |
| `U_c` | Design current speed | [E] |
| `U_wind` | Design wind speed | [E] |
| `d_m`, `L_m` | Mooring-line diameter and submerged length | [M] |
| `S` | Mooring scope (total line length, anchor to buoy) | [M] — **added; required for the corrected §8 catenary baseline** |
| `w_m` | Mooring line submerged unit weight (weight per unit length in water) | [M]/[L] — depends on chosen line (synthetic rope vs. chain, [ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md)); rope is near-neutrally buoyant, chain is not — **added** |
| `C_D`, `C_M`, `C_A` | Hydrodynamic drag, inertia, and added-mass coefficients | [L] — see §3.1 for how to select these, not just "appropriate cylinder data" |
| `r_CP,i` | Lever arm from shackle to the resultant of *each* lateral load component `i` (current, wave, wind — not one shared value) | [M] — **corrected from a single shared `r_CP`; see §9** |

---

## 2. Geometry and buoyancy — unchanged, verified correct

```
V_cyl = (pi D^2 / 4) h_s                                    [X]
V_ch = (pi h_ch / 3)(R1^2 + R1 R2 + R2^2)                    [X]
V_disp = sum of all submerged volumes                        [X]
F_B = rho_w g V_disp                                          [X]   Archimedes' principle
W = m_b g                                                      [X]
```

Use **rho_w ≈ 1025 kg/m³** for seawater and **g = 9.81 m/s²** [L]. These are standard constants,
not assumptions — no correction needed here. (Note: the source draft wrote `V_cyl` in terms of a
bare `h`; corrected to `h_s` to match the input table.)

---

## 3. Current drag — unchanged formula, added coefficient-selection method

```
F_D = 0.5 rho_w C_D A_p |U| U          [X] form, [L] coefficient
A_p approximately D h_s                 [A]   vertical-cylinder projected area
```

### 3.1 Correction — how to actually select C_D (and C_M, C_A in §5)

The source draft said "select `C_D` from appropriate cylinder/body data" without a method. That
defers the real work — coefficient selection needs two dimensionless numbers, not a single
lookup:

- **Reynolds number** (steady current flow): `Re = U_c D / nu`, where `nu` is the kinematic
  viscosity of seawater. Use **nu ≈ 1.0–1.1 × 10⁻⁶ m²/s** at ~20 °C, ~35 g/kg salinity — order
  of magnitude confirmed against Sharqawy et al. (2010)
  ([`sharqawy-2010`](../hub/research/sources.md#structural--hydrodynamic-loads-fea)); **pull the
  exact table value for the final report** rather than citing this range as final — flagged
  **[A]** until then.
- **Keulegan–Carpenter number** (oscillatory wave flow): `KC = u_m T / D`, where `u_m` is the
  wave-induced horizontal velocity amplitude at the depth of interest (from §4's `u_w`). Smooth
  circular-cylinder `C_D`/`C_M` vs. KC curves are tabulated in DNV-RP-C205
  ([`dnv-rp-c205`](../hub/research/sources.md#structural--hydrodynamic-loads-fea)) — the standard
  offshore-engineering source, and should be cited directly for whatever `C_D`, `C_M` values go
  in the final report, not read off a generic steady-flow "cylinder drag" table. Steady-flow and
  oscillatory-flow coefficients are genuinely different regimes; using a steady-flow `C_D` for the
  wave-drag term is a common first-pass error this framework avoids by naming `Re` for §3 and
  `KC` for §5 as separate lookups.

**Open item:** exact `C_D`, `C_M`, `C_A` values cannot be finalized until `D`, `U_c`, `H`, `T`
are set — this is why they stay **[L]**-tagged placeholders here rather than numbers. Tracked in
[open-questions.md](../hub/research/open-questions.md).

---

## 4. Wave kinematics — Linear (Airy) wave theory, unchanged formulas, added validity check

```
omega = 2 pi / T                                                              [X]
omega^2 = g k tanh(k d)                                                       [W]  dispersion relation, solve numerically for k
L = 2 pi / k                                                                  [X]
u_w(z,t) = (H omega / 2)[cosh(k(z+d))/sinh(kd)] cos(kx - omega t)             [W]
a_w(z,t) = (H omega^2 / 2)[cosh(k(z+d))/sinh(kd)] sin(kx - omega t)          [W]
```

`z` is measured from the mean water surface (`z = 0`) down to the seabed (`z = -d`); verified
`a_w = du_w/dt` — the two formulas are internally consistent.

### 4.1 Correction — check the design wave against linear theory's validity limits before trusting these

Linear wave theory assumes small-amplitude, non-breaking waves. It was applied here with no
validity check, which matters specifically for SCOUT: the deployment depth is 2–8 m
([`facts.md`](../hub/facts.md)), shallow water directly adjacent to a reef — exactly where storm
waves are most likely to shoal and steepen toward breaking, and exactly where linear theory is
weakest.

**Two checks to run once `H`, `T`, `d` are chosen [E]:**

1. **Theory selection via Ursell number:** `Ur = H L^2 / d^3`. A large `Ur` in shallow water
   means linear theory is a poor fit and a higher-order theory (Stokes, stream-function) should
   replace it — this is the standard criterion in wave-theory selection guidance
   ([`wave-theory-selection`](../hub/research/sources.md#structural--hydrodynamic-loads-fea)) [L].
2. **Breaking-limit check (Miche criterion):** `H_max approximately 0.142 L tanh(k d)`. If the
   chosen design `H` exceeds this at the site depth, the wave has already broken before reaching
   the buoy and linear kinematics no longer apply — a different (breaking-wave/slamming) load
   model is needed, which §11 already correctly excludes from this framework's scope [L].

Until both checks are run against real design values, treat `u_w`/`a_w` outputs as **[A]**
conservative-order-of-magnitude estimates, not validated final-report numbers.

---

## 5. Wave + current hydrodynamic load — Morison equation, corrected for phase and draft

For a moving buoy, relative velocity:

```
u_r = U_c + u_w - u_b                                    [X]
F_D = 0.5 rho_w C_D A_p |u_r| u_r                         [X] form
F_I = rho_w V (C_M a_f - C_A a_b)                          [X] form — correct "independent flow field" Morison formulation
```

The inertia term is right as written: `C_M` (total inertia coefficient, `= 1 + C_A`) applies to
fluid acceleration `a_f`, while `C_A` (added-mass coefficient alone) applies as a reaction to the
body's own acceleration `a_b`. This is a detail a lot of first-pass models get wrong; the source
draft had it right.

**Stationary-body conservative simplification** (documented assumption, appropriate for a
first-pass structural check — `u_b = a_b = 0`):

```
F_hydro(t) approximately 0.5 rho_w C_D A_p |U_c + u_w(t)| (U_c + u_w(t)) + rho_w C_M V a_w(t)   [A]
```

### 5.1 Correction — peak drag and peak inertia do not occur at the same phase — sweep it

The source draft evaluated this at one unstated instant. Drag is largest where velocity peaks
(`cos` term at phase 0); inertia is largest where acceleration peaks (`sin` term, 90° later) —
they cannot both be at their individual maximum at the same time, so naively summing the two
peak values overstates the true worst case, while evaluating at one arbitrary single phase can
understate it.

**Corrected procedure:** define phase `phi = kx - omega t` and, at the buoy's fixed location
(`x = 0`), sweep `phi` over one full cycle:

```
F_hydro(phi) = 0.5 rho_w C_D A_p |U_c + u_w(phi)| (U_c + u_w(phi)) + rho_w C_M V a_w(phi)
                                                                for phi in [0, 2 pi)
F_hydro,max = max over phi of |F_hydro(phi)|              [A]   the correct design load,
                                                                 not the sum of individual peaks
```

This is a simple numerical sweep (e.g. 36–72 phase steps in a spreadsheet), not a new equation —
it's a correction to *how* the existing formulas get combined.

### 5.2 Correction — evaluate over the draft, not at one representative depth

`u_w(z,t)` and `a_w(z,t)` vary with depth `z`, but the combined formula above uses one `A_p` and
one velocity value — implicitly evaluating at a single depth (unstated in the source draft,
presumably `z = 0`, the free surface). Two acceptable options, in increasing accuracy:

- **Level 1 (fast, conservative):** evaluate at `z = 0` (free surface) — velocity is largest
  there, so this over-predicts force on the rest of the draft. Acceptable for an early structural
  check; state it explicitly as **[A]** if used in the final report.
- **Level 2 (accurate, for the report's final numbers):** integrate over the submerged height
  once geometry is fixed:

```
F_D,wave(t) = 0.5 rho_w C_D D  integral from z=-h_s to 0 of  |u_w(z,t)| u_w(z,t) dz
F_I(t)      = rho_w C_M (pi D^2/4)  integral from z=-h_s to 0 of  a_w(z,t) dz
```

  Evaluate numerically (Simpson's rule over a handful of `z`-stations) — straightforward once
  `D`, `h_s` are measured.

---

## 6. Mooring-line drag and wind — formula unchanged, added missing definitions and a flow-angle caveat

```
F_line approximately 0.5 rho_w C_D,line d_m L_m U_r^2      [A]
F_wind = 0.5 rho_air C_D,air A_air U_wind^2                [X] form
```

Use **rho_air ≈ 1.225 kg/m³** at sea level, standard conditions [L]. `A_air` is now listed in §1
— it was used here but omitted from the source draft's input table.

**Correction — flow angle:** `F_line` as written is only exactly valid for current flowing
*normal* to the mooring line. For a slender cylinder (the line) in oblique flow, drag scales with
the velocity component normal to the line's axis, not the full current magnitude (the
"independence principle" for slender bodies) [L]. If the current direction varies with depth
relative to the line's catenary shape, resolve `U_r` into its normal component per line segment
before applying this formula, or segment the line and sum as the source draft already recommends
for depth-varying current.

Wind's overturning-moment contribution (noted here in the source draft) is folded into the
corrected moment calculation in §9, not left as a side note.

---

## 7. Hydrostatic pressure — unchanged, verified correct

```
p(h) = rho_w g h        [X]
```

Apply as a distributed pressure on the electronics housing, caps, walls, and other submerged
pressure boundaries — never as a point load. No correction needed; this was already right.

---

## 8. Mooring static baseline — corrected: taut-line assumption conflicts with the chosen mooring design

### 8.1 Correction — the source draft's baseline assumes a taut mooring; SCOUT's mooring is slack

The source draft's static case (`F_net,static = F_B - W`, described as what "a nearly vertical
mooring sees") models a taut vertical line, where the full excess buoyancy shows up directly as
line tension. But [ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md) explicitly
sites the anchor "with enough **swing radius** that the mooring line cannot drag across or
agitate the reef through the tide/current cycle" — that describes a slack/catenary mooring, not
a taut one. Under a slack scope, calm-water tension is governed by the line's own catenary
geometry and submerged weight, not by the buoy's full net buoyancy.

Using the taut-line formula as a literal calm-water baseline would **overstate** the true resting
tension. Two corrected cases replace the single original one:

### 8.2 LC-A — Slack-mooring calm-water baseline (catenary, the physically correct resting state)

For a line hanging under its own submerged weight (standard mooring catenary — see Faltinsen
(1990) [`faltinsen-1990`](../hub/research/sources.md#structural--hydrodynamic-loads-fea) or the
accessible derivation at
[`thenavalarch-catenary`](../hub/research/sources.md#structural--hydrodynamic-loads-fea)):

```
y(x) - y0 = c cosh((x - x0) / c),    c = T_H / w_m           [X]  catenary form
```

where `T_H` is the horizontal tension component (constant along the line) and `w_m` is the
line's submerged unit weight [M]/[L]. Vertical tension at the buoy end grows with how much line
is actually lifted off the seabed, which depends on scope `S` versus depth `d` — a generous
scope-to-depth ratio (as ADR-0004's swing-radius requirement implies) keeps most of the line on
the seabed and buoy-end tension low.

**This case cannot be evaluated numerically yet** — it needs the actual chosen scope `S` and
line unit weight `w_m`, neither of which is finalized (mooring hardware CAD hasn't started,
[SCO-17](https://linear.app/scout1/issue/SCO-17) consequences). Tracked as an open input in
[open-questions.md](../hub/research/open-questions.md). Treat as **informational** until then —
it's the physically correct resting state, but not yet the number to run in FEA.

### 8.3 LC-B — Upper-bound vertical tension (taut-line assumption, kept as a conservative structural check)

```
F_net approximately F_B - W        [A]   relabeled, not a literal calm-water value
```

This is the same formula the source draft proposed, but re-scoped: it represents the tension the
line *would* see if pulled fully taut and vertical — a real, physically meaningful condition
during a large storm-surge or peak-load event when the catenary straightens, not the buoy's
resting state. Keeping it as an explicit **conservative upper bound** for the shackle/U-bolt
structural check is legitimate and useful; calling it "static baseline" was the error, not the
number itself.

---

## 9. Resolve the shackle load — corrected: moment must sum per-component lever arms

```
F_H = sum over i of F_H,i          [X]   sum of all horizontal environmental load components
                                          (current, wave, wind)
F_V approximately F_B - W          [A]   (§8.3 upper bound, or the §8.2 catenary result once available)
T_shackle = sqrt(F_H^2 + F_V^2)    [X]
theta = atan(F_H / F_V)            [X]
```

### 9.1 Correction — M_shackle must sum moments per load component, not one shared lever arm

The source draft used `M_shackle approximately F_H r_CP` with a single `r_CP` for whatever `F_H`
sums to. But wind acts high — through the solar panel and above-water body — while current and
wave drag act through the submerged draft. Different physical lever arms. Lumping them into one
`F_H` and one `r_CP` will mis-state the moment unless `r_CP` happens to be a correctly-weighted
average, which the source draft never defined. Corrected:

```
M_shackle = sum over i of (F_H,i * r_CP,i)        [X]
```

where each component (`current`, `wave`, `wind`) is summed with **its own** lever arm from the
shackle to that component's line of action — `r_CP,current`, `r_CP,wave` at roughly mid-draft or
the depth-integrated centroid from §5.2, `r_CP,wind` at the solar-panel/above-water centroid.
This is the same total-force bookkeeping as before, just not collapsed into a single lever arm
before summing.

The shackle/chassis interface should be checked for combined axial loading, shear, and bending —
unchanged conclusion from the source draft, still correct.

---

## 10. Corrected FEA load cases

Renumbered from the source draft's LC1–LC8 to insert the split calm-water case (§8) and thread
the phase-sweep (§5.1) and per-component moment (§9.1) corrections through. Original numbering
noted in parentheses for traceability.

| Case | Apply in FEA | Primary check | Status |
|---|---|---|---|
| LC1 (was: part of LC1) | Slack-mooring calm-water catenary tension (§8.2) | Baseline shackle/U-bolt tension, informational | **Blocked** — needs scope `S`, line unit weight `w_m` |
| LC2 (was: LC1) | Upper-bound taut-line vertical tension (§8.3) | Conservative shackle/U-bolt tension bound | Ready once `m_b`, `V_disp` are measured |
| LC3 (was: LC2) | Current-only lateral load | Chassis bending and attachment shear | Ready once `U_c`, `C_D` (Re-based) are set |
| LC4 (was: LC3) | Wave drag + inertia, **phase-swept per §5.1** | Environmental structural load | Needs `H`, `T`, `d` chosen + breaking check (§4.1) passed |
| LC5 (was: LC4) | Wave + current, aligned, **phase-swept** | Conservative horizontal load | Same prerequisites as LC4 |
| LC6 (was: LC5) | Resultant `F_H`, `F_V` at shackle | Combined attachment stress | Needs LC2–LC5 resolved |
| LC7 (was: LC6) | `F_H` plus overturning moment, **per-component lever arms per §9.1** | Central chassis / shackle junction | Needs `r_CP,i` per component, not one shared value |
| LC8 (was: LC7) | Hydrostatic pressure | Housing and cap strength | Ready once `h_s` is measured — independent of the other cases |
| LC9 (was: LC8) | Amplified combined case | Design-margin / sensitivity check | Run last, after LC2–LC7 |

---

## 11. Recommended calculation sequence (corrected)

1. Measure final buoy geometry and mass [M]. Calculate draft/displaced volume, verify static
   buoyancy.
2. **Decide mooring scope `S` and line material/unit weight `w_m`** [M] — new step, required to
   resolve §8's split calm-water/upper-bound cases. Coordinate with the still-open
   [SCO-17](https://linear.app/scout1/issue/SCO-17) mooring CAD work.
3. Choose normal and severe design values for wave height, period, water depth, current, wind
   [E].
4. **Check the design wave against Ursell number and Miche breaking criteria (§4.1)** — new step,
   before trusting any downstream wave kinematics.
5. Solve the dispersion relation for `k`; calculate wave velocity/acceleration through the draft.
6. Calculate wave/current hydrodynamic loading **with a phase sweep (§5.1)**, not a single-instant
   evaluation; use depth-integration (§5.2 Level 2) once geometry allows. Calculate line drag and
   wind load.
7. Determine `F_H` (summed per component), `F_V`, `T_shackle`, and **`M_shackle` as a sum of
   per-component `F_i * r_CP,i` (§9.1)**.
8. Apply the loads as the LC1–LC9 FEA cases in §10.
9. Run the amplified combined case (LC9) to understand sensitivity and design margin.
10. Compare peak von Mises stress, displacement, local bearing/pullout stress, and factor of
    safety.

**Unchanged from the source draft, still correct guidance:** do not use a simple single-term
heave equation or a generic slamming equation as a primary SCOUT design load — floating-body
heave dynamics and water-entry impact need more detailed hydrodynamics or validated
testing/simulation. Treat them as later sensitivity/advanced analyses
([SCO-71](https://linear.app/scout1/issue/SCO-71) already scopes impact testing separately, by
design, not as an extension of this framework).

For the senior-design report, label every value with the provenance tags from §0 — measured,
environmental design input, literature coefficient, exact relationship, linear-wave-theory
result, or conservative assumption.

---

## 12. Open items before real numbers can be run

Tracked in full in [open-questions.md](../hub/research/open-questions.md):

1. **Mooring scope `S` and line unit weight `w_m`** — blocks §8.2's catenary baseline; depends on
   finalizing mooring hardware ([SCO-17](https://linear.app/scout1/issue/SCO-17)).
2. **Final `C_D`, `C_M`, `C_A` sourcing** — needs `Re` and `KC` computed from real geometry and
   chosen design environmental values, then pulled from DNV-RP-C205 (§3.1), not assumed.
3. **Design wave `H`, `T` values** — not yet chosen; needed before the §4.1 validity checks can
   even run.
4. **Per-component lever arms `r_CP,i`** — needs the chassis/shackle geometry finalized (depends
   on [SCO-49](https://linear.app/scout1/issue/SCO-49), housing dimensions).

---

## 13. References

- U.S. Army Corps of Engineers. *Coastal Engineering Manual*, EM 1110-2-1100 —
  [`usace-cem`](../hub/research/sources.md#structural--hydrodynamic-loads-fea). Buoyancy/statics,
  linear wave theory, and breaking-wave criteria basis.
- DNV. *Recommended Practice DNV-RP-C205: Environmental Conditions and Environmental Loads* —
  [`dnv-rp-c205`](../hub/research/sources.md#structural--hydrodynamic-loads-fea). Morison
  equation, `C_D`/`C_M` vs. Keulegan–Carpenter number.
- Sharqawy, M.H., Lienhard, J.H., Zubair, S.M. (2010). "Thermophysical properties of seawater: a
  review of existing correlations and data." *Desalination and Water Treatment*, 16(1–3):354–380.
  [doi](https://doi.org/10.5004/dwt.2010.1079) —
  [`sharqawy-2010`](../hub/research/sources.md#structural--hydrodynamic-loads-fea). Seawater
  kinematic viscosity for Reynolds-number calculation.
- "A guide for selecting periodic water wave theories — Le Méhauté (1976)'s graph revisited." —
  [`wave-theory-selection`](../hub/research/sources.md#structural--hydrodynamic-loads-fea). Ursell
  number / wave-theory validity regions.
- Faltinsen, O.M. (1990). *Sea Loads on Ships and Offshore Structures*. Cambridge University
  Press — [`faltinsen-1990`](../hub/research/sources.md#structural--hydrodynamic-loads-fea).
  Catenary mooring-line statics.

Full metadata (access status, links) in the
[Source Registry](../hub/research/sources.md#structural--hydrodynamic-loads-fea).
