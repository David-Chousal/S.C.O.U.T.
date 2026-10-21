# Appendix C: Calculations, Models and Simulations (Mechanical)

> **Summary** — Every calculation, model and simulation done for the mechanical design of S.C.O.U.T., grouped by
> purpose: the environmental design basis and loads, finite-element runs, closed-form strength checks, buoyancy,
> stability, seals and packing, and the tools that automate them. Each entry gives the purpose, the method, the key
> inputs, the result and what it changed. Part of the [thesis working draft](README.md). Status: first draft from the
> repo records; numbers are quoted from the linked source documents and should be re-checked before submission.

**How to read this appendix.** The design changed during the project, and so did the analyses. Through 2026-10-14 the
float was a ring of six bolted wedges, foam-filled, with a lead ballast arm. On 2026-10-14 to 10-16 it became a single
printed float with no ballast stem, no foam and no lead. A mushroom-shaped float was explored on 2026-10-18 to 10-19.
Entries C.1 to C.5 for the wedge design are kept because their method and the lessons they gave carried forward. Each is
marked **(wedge design)** or **(printed float)**.

---

## C.1 Environmental design basis and load derivation

### C.1.1 Design environment

**Purpose.** Fix the loads every structural analysis uses. Signed off by John Ryan on 2026-09-08.

| Parameter | Survival (design) value | Basis |
|---|---|---|
| Water depth `d` | 2.0 m | Shallowest routine depth, giving the highest wave orbital velocity at the buoy |
| Wave height `H` | 1.2 m | Depth-limited (`H/d` ≈ 0.6, below the ~0.78 breaking limit) |
| Wave period `T_w` | 6 s | Local wind sea to moderate swell |
| Current `U_c` | 0.8 m/s | Reef-flat tidal and wind-driven flow |
| Wind `U_wind` | 22 m/s (~43 kt) | Strong gale; the buoy is recovered ahead of a forecast hurricane |
| Seawater density | 1025 kg/m³ | Standard |

Every input is tagged by provenance (measured, exact relation, literature, assumption) so each number can be defended.

**Source.** [Force Budget](../engineering/buoy-structural/force-budget.md), [Structural Load Framework](../engineering/buoy-structural/structural-load-framework.md).

### C.1.2 Load equations (structural load framework)

**Purpose.** Corrected force and moment equations for the finite-element load cases. The framework began as an
AI-drafted summary and was audited line by line; several errors were corrected (taut versus slack mooring, the phase of
peak drag and inertia, a single lever arm for the overturning moment).

**Method.**

```
Buoyancy              F_B = rho_w g V_disp                      (Archimedes)
Current drag          F_D = 0.5 rho_w C_D A_p |U| U
Wave kinematics       omega^2 = g k tanh(k d)                   (dispersion, solved for k)
                      u_w = (H omega / 2) [cosh(k(z+d)) / sinh(kd)] cos(kx - omega t)
                      a_w = (H omega^2 / 2) [cosh(k(z+d)) / sinh(kd)] sin(kx - omega t)
Wave + current        F_hydro(phi) = 0.5 rho_w C_D A_p |U_c + u_w(phi)| (U_c + u_w(phi))
                                     + rho_w C_M V a_w(phi)     (Morison equation)
                      design load = max over phase phi of |F_hydro(phi)|
Hydrostatic           p = rho_w g h
Shackle resultant     T = sqrt(F_H^2 + F_V^2),  theta = atan(F_H / F_V)
Overturning moment    M = sum_i (F_H,i * r_CP,i)                (a lever arm per load component)
Slack mooring         y - y0 = c cosh((x - x0) / c),  c = T_H / w_m   (catenary)
```

Drag and inertia peak at different phases, so the phase is swept over one full cycle instead of adding the peaks.
Coefficients are chosen from the Reynolds and Keulegan–Carpenter numbers. A validity check against linear theory flagged
an Ursell number near 98 for the design wave (shallow-water nonlinearity), so the wave loads are treated as a bound.

### C.1.3 Computed load cases (wedge design, then recomputed for v5)

| Case | Load | v4 | v5 |
|---|---|---|---|
| LC2 | Taut-line vertical uplift (`F_B − W`) | 322 N | 225 N |
| LC3 | Current drag | ~14 N | ~11 N |
| LC4 | Wave load, phase-swept | ~185 N | ~138 N |
| LC5 | Wave plus current (governing horizontal) | ~440 N | ~330 N |
| LC6 | Resultant at the shackle | 586 N at 57° | ~434 N at 59° |
| LC7 | Overturning moment about the pad eye | ~70 N·m | ~42 N·m |
| LC8 | Hydrostatic at 5 m | 50.3 kPa | 50.3 kPa |
| LC9 | Snap load (2× vertical) | 810 N at 37° | ~583 N at 40° |

Wind adds about 50 N, acting high. LC1 (slack-mooring catenary tension) stayed blocked on the mooring scope and line
weight. **Impact:** every v5 load is 10–30% lower than v4, so the v4 FEA bounds v5 for load adequacy and no full re-run
was needed.

---

## C.2 Finite-element analysis (Autodesk Fusion, static stress)

All runs used a custom PETG material profile (E 2240 MPa, ν 0.38, yield 35 MPa) unless noted.

### C.2.1 Floatation side load, 2026-08-17 **(wedge design)**

**Purpose.** First structural pass on the bolted-wedge floatation with bottom caps. **Load.** 300 N static side load.
**Result.** Minimum safety factor 25.4 and 0.23 mm maximum displacement, against a provisional criterion of SF ≥ 4.
**Impact.** Showed the design was far from its limit; later read as over-engineered, which led to thinning the walls.
**Source.** [Record](../../mechanical/test/fea-floatation-side-load-2026-08-17.md).

### C.2.2 Mooring and structural load cases LC2 to LC9, 2026-08-29 **(wedge design)**

**Purpose.** Run the loads from C.1.3 on the hull, chassis and pad eye, using a McMaster 3076T33 steel tie-down ring as
the pad-eye stand-in.

| Case | Load as run | Min SF | Max displacement |
|---|---|---|---|
| LC2 uplift | 322 N | 7.53 | 0.012 mm |
| LC3 current | 14 N | 1450 | 0.003 mm |
| LC4 wave | 185 N | 70.4 | 0.139 mm |
| LC5 wave plus current, wedge face | 440 N | 29.6 | 0.331 mm |
| LC5 wave plus current, wedge edge | 440 N | 65.0 | 0.093 mm |
| LC6 combined resultant | 627 N at 51° | 1.66 | 0.107 mm |
| LC7 overturning (moment not applied) | 490 N | 2.03 | 0.105 mm |
| LC8 hydrostatic | 50 kPa | 9.98 | 0.40 mm |
| LC9 snap | 810 N at 37° | 1.49 | 0.109 mm |

**Reading.** The buoy structure passed every case. The low factors in LC6, LC7 and LC9 sit at the contact interface of
the stand-in ring, which pivots about one small bonded face. They are a model artifact, confirmed by examining the
reports, and the PETG around the ring stayed low-stress. LC7 was exercised by hand instead: the worst of four 1/4-20
bolts carries 774 N, giving 38 MPa in the bolt (SF > 5), 3.2 MPa washer bearing on PETG (SF ≈ 11) and 2.6 MPa pull-through
shear (SF ≈ 7.7). **Source.** [Results](../../mechanical/test/fea-mooring-load-cases.md).

### C.2.3 v5 re-check, 2026-09-25 **(wedge design)**

Five runs on the lean v5 geometry at the v5 loads. Run in Fusion's stock ABS profile (yield 20 MPa) and re-based to PETG
as 35 / σ.

| Run | Case | Result |
|---|---|---|
| 1 | LC5 toward a seam, 330 N at 30° | Pass; 0.27 mm; SF ≥ ~8.8 |
| 2 | LC5, 369 N (12% over design) | Pass; SF ≥ ~7 |
| 3 | LC8 hydrostatic, 5 m | Pass; 5–10 MPa at mid-panel, SF 3.5–7 (unfoamed thin walls bend between supports) |
| 4 | LC9 snap plus LC7 moment | Pass; SF ≥ ~3 (moment entered with the wrong unit, so hand-checked) |
| 5 | Linear buckling of the wedge ring | Load multiplier 1.873, about 94 kPa (≈ 9.3 m) unfoamed; 4.7 m after a 0.5 imperfection knock-down |

**Impact.** The unfoamed ring is marginal at the 5 m test spec, so foam fill was structurally required for that design.
That requirement ended when the float changed (C.5.4).

---

## C.3 Closed-form strength, buckling and impact

### C.3.1 Wedge wall-thickness check, 2026-09-07 **(wedge design)**

**Purpose.** Check the thinned walls (outer 0.095 in, sides 0.063 in, 5.5 in tall) before committing to them.
**Method.** Thin-wall membrane stress and buckling, plus two loads the framework does not cover: foam-expansion pressure
and print and handling flex.

```
hoop stress under external pressure   sigma = p R / t = 50 300 x 0.2286 / 0.002413 = 4.77 MPa
safety factor on yield                SF = 35 / 4.77 = 7.3
free-ring buckling                    p_cr = E / (4 (1 - nu^2)) x (t/R)^3 = 770 Pa
```

**Result.** Strength is comfortable foam-backed (SF 7.3). Bare, buckling governs. It also found a design-for-manufacturing
issue: thin open walls flex on the print bed, so an internal bracing web became mandatory. **Source.**
[Check](../../mechanical/test/wedge-wall-thickness-structural-check-2026-09-07.md).

### C.3.2 Ring external-pressure buckling, 2026-09-09 **(wedge design)**

**Method.** Bending stiffness per unit width `D = E t³ / (12 (1 − ν²)) = 3.07 N·m`, edge-supported curved-panel buckling,
and a foam elastic-foundation term for the backed case. **Result.** Bare 0.095 in wall: SF ≈ 0.2–0.7 against 50.3 kPa.
Foam-backed: SF ≈ 3–5. This confirmed and quantified the rule "foam in before submersion". **Source.**
[Check](../../mechanical/test/wedge-ring-buckling-check-2026-09-09.md).

### C.3.3 Impact and boat-strike survivability **(wedge design)**

**Method.** Energy balance for two events, a low-speed boat strike at the waterline and a handling drop. Kinetic energy
is compared with the buoy's absorption capacity and converted to an equivalent static load. **Result.** A drifting boat
at 1–2 m/s transfers a few hundred joules, which the compliant mooring and the buoy's own inertia absorb. A direct strike
above about 1.5–2 m/s gives several kN to one wedge face and cracks the 0.095 in shell. The design accepted that, since
foam kept the buoyancy and a wedge was field-replaceable. **Bench check:** one printed wedge was dropped on 2026-09-25
with no deformation, which closed the impact work. **Source.**
[Analysis](../engineering/buoy-structural/impact-survivability-analysis.md),
[drop test](../../mechanical/test/wedge-drop-test-2026-09-25.md).

### C.3.4 Sensor-pod dry-chamber wall **(printed float)**

**Method.** Closed-form external-pressure buckling of the dry chamber. **Result.** A 2.0 mm solid wall gives SF ≈ 4.7 at
50.3 kPa (5 m) with no foam. It is not FEA-validated, and the cutout for the probe shaft is not bounded by the check.
**Source.** [Sensor Pod Packing Budget §6](../engineering/sensor-pod-packing-budget.md).

---

## C.4 Buoyancy, mass and freeboard

### C.4.1 Mass and buoyancy budget

**Purpose.** A mass and displacement figure for every printed part. **Method.** Slicer-measured weights for all five
parts of the v4 set, which retired a 1.178× calibration factor used for parts without slicer data. **Source.**
[Budget](../engineering/buoy-structural/mass-and-buoyancy-budget.md),
[print weights](../../mechanical/test/print-weight-verification-2026-08-24.md).

### C.4.2 Whole-buoy mass, displacement and freeboard model

**Method.** A complete as-deployed mass budget, fully submerged displacement and reserve buoyancy, then a floating
equilibrium solved by integrating the revolved hull profile until displaced weight equals buoyant force.

```
net reserve buoyancy   = F_B,max - W
floating equilibrium   : integral of rho_w g A(z) dz from the keel to the draft = W
draft, freeboard       : read from the solved waterline against the wedge top
```

**Results.**

| Version | Mass | Net reserve | Draft | Freeboard to wedge top | Margin |
|---|---|---|---|---|---|
| v4 (2026-08-29) | 8.40 kg | ~309 N | 2.69 in | 7.31 in | 4.75:1 |
| v5 (2026-09-09, lean wedge bottom later) | 7.59 kg, then 7.75 kg | ~212 N | 2.50 in, then 2.53 in | ~5.0 in | 3.84:1 |

A mass-sensitivity sweep and two failure cases from the design review were also run: a flooded chassis and one wedge
lost. In both the buoy stays afloat, so the design was judged substantially over-floated. **Source.**
[Model](../engineering/buoy-structural/buoy-mass-displacement-and-freeboard-model.md).

---

## C.5 Stability

### C.5.1 Small-angle stability **(wedge design)**

**Method.**

```
KG = sum(m_i z_i) / sum(m_i)                 (mass-weighted)
KB = centroid height of the displaced volume
BM = I_waterplane / V_disp = pi R^4 / (4 V)  (circular waterplane)
GM = KB + BM - KG
T_roll = 2 pi k / sqrt(g GM)                  (small amplitude, undamped)
```

**Result (v5).** GM 9.56 in, very stiff, with a roll period of about 0.6 s, roughly ten times shorter than the 6 s design
wave, so no resonance. Losing one wedge lists the buoy about 3°. **Source.**
[Stability Analysis](../engineering/buoy-structural/stability-analysis.md).

### C.5.2 Large-angle stability and capsize **(wedge design)**

**Method.** The hull taken from the committed STEP files and meshed (gmsh and OpenCASCADE). The righting arm `GZ(φ)` is
computed at constant displacement by voxel integration on a 2 mm grid from 0° to 180°. It reproduces `GM sin φ` at small
angles. Submerged appendages enter at net-down weight, weight minus their own buoyancy. **Result.** For the nominal 8.19
kg buoy, GM is 7.12 in, maximum GZ 2.46 in at about 40°, and the vanishing angle is about 90°. The buoy was stable
upside down. **Impact.** This found the capsize problem, which led to the 24 in ballast arm (about 2.6 kg of
encapsulated lead) and 1.5 in wedge-bottom caps, and a v6 assembly that self-rights from any angle. The lead was dropped
on 2026-10-16 with the move to the printed float. **Source.**
[§12](../engineering/buoy-structural/stability-analysis.md),
[Ballast Arm and Mount](../engineering/buoy-structural/ballast-arm-and-mount.md).

### C.5.3 Parametric studies **(wedge design)**

- **Ballast depth, cap comparison, housing-height sweep and regression check** against the earlier hand calculation.
  Results are dated in `mechanical/simulations/buoy-stability/results/2026-09-29/`.
- **Mooring attachment height, 2026-10-08.** Quasi-static heel against attachment height on the arm. The righting moment
  barely changes (about 21–22 N·m) but the heeling lever does. Attaching at the bottom of the stem is knocked down by
  34–48 N, while a collar 2.5 in below the keel needs about 215 N. Static hydrostatics only.
  [Study](../../mechanical/simulations/buoy-stability/studies/mooring-attachment-height/README.md).
- **Interactive stability explorer** for every iteration, and true cross-sections of each iteration sliced from the STEP
  files. [Calculator](../../mechanical/simulations/buoy-stability/README.md).

### C.5.4 Printed-float stability study and tip explorer, 2026-10-14 to 10-16 **(printed float)**

**Method.** The same hydrostatic solver run on the float's STEP geometry, treated as a body of revolution with sealed dry
chambers and no foam or ballast, with an interactive heel explorer. **Results (pod 4 in below the keel).**

| Quantity | v8 (1154 g float) | v9 (992 g float, cable channel) |
|---|---|---|
| Total mass | 3.03 kg | 2.87 kg |
| Draft / freeboard | 2.70 / 3.80 in | 2.56 / 3.94 in |
| GM | 1.43 in | 1.47 in |
| Max righting arm | 41 mm at 75° | 40 mm at ~70° |

It still self-rights, but the margin near inverted is thin (GZ about 1 mm at 178° for v8), and the hull shape, not the
mass, drives that. Lowering the pod raises GM from 1.20 in (at the keel) to 1.96 in (13.5 in below). Adding 2 kg still
leaves 2.1 in of freeboard. A physical tilt test from 180° is the follow-up. **Source.**
[Explorer README](../../mechanical/simulations/buoy-stability/printed-float-tip-explorer/README.md).

### C.5.5 Mushroom float concept, 2026-10-18 to 10-19 **(concept)**

**Method.** A 20-candidate parametric sweep, then a 24-candidate sweep with the neck shortened, using the same hydrostatic
solver and the repo mass budget. Candidate N03 was chosen: a domed cap (rim Ø8.66 in) narrowing to a neck (Ø5.20 in,
1.57 in long), 7.28 in tall, the electronics housing dropping in from the top. **Result.** About 2.61 kg, 4.80 in draft,
upright GM 2.29 in, and self-righting at every angle. A separate tilt explorer built with the printed-float mass stack
gave about 2.68 kg, 4.61 in draft and 1.7 in GM. The two differ, probably in center of gravity (it depends on component
placement), and are not yet reconciled. **Retention.** The sweep scripts were not saved; only the dimensioned drawing and
the explorer survive.

---

## C.6 Seals and packing

### C.6.1 O-ring face-seal sizing

**Method.** Static face-seal groove sized from the ring's cross-section for 20–30% squeeze and about 75% gland fill.

```
squeeze   = (CS - groove depth) / CS
gland fill = ring cross-section area / groove area
```

| Joint | Ring | Design |
|---|---|---|
| Sensor pod | AS568-137 (2.62 mm cross-section) | Face groove about 3.4 mm wide by 2.0 mm deep, 20–25% squeeze |
| Pod coupons | 3/16 in plumbing ring | 0.141 in deep by 0.262 in wide, 25% squeeze, about 75% fill |
| Electronics housing (2026-09-02) | AS568-043 | 22.9% squeeze, 75% fill, bolts outside the ring |
| Electronics housing (2026-10-16) | AS568-247 (ID 4.609 in, cross-section 0.139 in) | Flange-style housing |

A run that failed (RR-15) used a ring with a 4.76 mm cross-section in a groove cut for 2.62 mm, which is why the sizing is
checked against the actual part. **Source.**
[Sensor housing README](../../mechanical/cad/sensor-housing/README.md),
[coupon record](../../mechanical/test/sensor-housing-oring-coupon-2026-10-01.md).

### C.6.2 Submersion test series **(supports C.6.1)**

| Date | Article | Result |
|---|---|---|
| 2026-08-24 | PLA pod with TPU-printed ring, PETG print, electronics housing | Pod passed about 30 hr; PETG (low-quality print) and electronics housing failed |
| 2026-09-12 | Pod with TPU-printed ring, about 1 week | Failed; the poor ring held most water out first |
| 2026-10-08 | Coupon run RR-15, 6 bolts, mismatched ring | Flooded |
| 2026-10-21 | Pod, PETG, inserts pressed in from the bottom, design 2.5 | **Passed 24 hr** in fresh water (dry paper towel); salt water and pressure not yet tested |

**Finding.** Printing in PETG, and pressing the heat-set inserts from the bottom so they do not deform the flange face
and uneven the clamping, made the difference. **Source.**
[PETG pass](../../mechanical/test/sensor-housing-petg-pass-2026-10-21.md),
[register](../../mechanical/test/risk-reduction-register.md).

### C.6.3 Packing budgets

- **Electronics housing.** Real component dimensions from the datasheets, three cylindrical layouts, and the minimum
  diameter and length for each. Recommended about Ø100 mm by 110–130 mm; John fixed it at **4.4 in inside diameter by
  5 in tall** on 2026-10-08. Option C (three stacked printed discs on pillars) uses about 93 of 127 mm.
  [Budget](../engineering/electronics-housing-packing-budget.md).
- **Sensor pod.** The probe's mounting ears (44 mm diagonal) set the dry chamber at Ø52 mm or more, larger than the
  Ø31.5 mm bore first committed. Shaft penetration Ø24 mm; flood chamber at least Ø24 by 30 mm.
  [Budget](../engineering/sensor-pod-packing-budget.md).

---

## C.7 Software tools

| Tool | What it does | Where |
|---|---|---|
| `buoy_stability.py` | Hydrostatics and stability calculator: equilibrium, KG/KB/BM/GM, GZ curve | `mechanical/simulations/buoy-stability/` |
| `run_studies.py` | Runs every stability study and writes dated results | same |
| `iteration_sections.py` | True side-view cross-sections of every iteration from the STEP files | same |
| Stability and tip explorers | Interactive heel, tip-over and righting-arm views | `results/2026-09-29/`, `printed-float-tip-explorer/` |
| Mooring-height study | Quasi-static heel against attachment height | `studies/mooring-attachment-height/` |
| Fusion static-stress and buckling studies | The FEA runs in C.2 | `mechanical/test/` (HTML reports) |

The newest dated results folder is always the current answer. Older ones are kept as history.

---

## C.8 What each analysis changed

| Analysis | Design consequence |
|---|---|
| Floatation side-load FEA (C.2.1) | Showed the walls were over-built, leading to the thinning |
| Wedge wall and ring buckling checks (C.3.1, C.3.2) | Foam fill required before submersion; internal bracing web added |
| v5 load delta (C.1.3) | The v4 FEA bounds v5, so no full re-run |
| Capsize study (C.5.2) | Ballast arm and 1.5 in caps, then the move away from the wedge design |
| Printed-float study (C.5.4) | Chosen as the battery-only baseline; physical tilt test requested |
| Face-seal sizing and submersion tests (C.6) | Purchased rings, PETG, bottom-pressed inserts |
| Packing budgets (C.6.3) | Housing fixed at 4.4 in by 5 in; pod chamber enlarged |

---

## C.9 Worked examples

Each example substitutes the real inputs step by step. Inputs are tagged by provenance: **[M]** measured from CAD or a
scale, **[X]** an exact relation, **[L]** a literature value, **[A]** an assumption. Units are SI unless noted. The
sources are the linked analysis documents, and the same numbers are used there.

### C.9.1 Wave kinematics (linear Airy theory)

Design wave: `H` = 1.2 m, `T_w` = 6 s, depth `d` = 2 m **[A]**, `g` = 9.81 m/s².

```
omega = 2 pi / T_w = 2 pi / 6 = 1.0472 rad/s
omega^2 = 1.0966
dispersion: omega^2 = g k tanh(k d)  ->  1.0966 = 9.81 k tanh(2k)
   solved numerically: k = 0.2459 1/m
wavelength   L = 2 pi / k = 25.55 m
k d = 0.4918   sinh(kd) = 0.5117   cosh(kd) = 1.1234   coth(kd) = 2.1955
surface orbital velocity amplitude
   u_m = (H omega / 2) coth(kd) = (1.2 x 1.0472 / 2) x 2.1955 = 1.379 m/s
surface orbital acceleration amplitude
   a_m = (H omega^2 / 2) coth(kd) = (1.2 x 1.0966 / 2) x 2.1955 = 1.445 m/s^2
```

Validity checks, both flagged:

```
Ursell number   Ur = H L^2 / d^3 = 1.2 x 25.55^2 / 2^3 = 97.9
   far above ~26, so linear theory is outside its comfortable range. It is kept as a mildly
   conservative first pass; a Stokes second-order recheck is left for the final report.
Miche limit     H_max = 0.142 L tanh(kd) = 0.142 x 25.55 x 0.4555 = 1.65 m
   design H = 1.2 m < 1.65 m, so the wave does not break at 2 m depth.
```

### C.9.2 Drag and inertia coefficients

```
Current: Re = U_c D / nu = 0.8 x 0.4572 / 1.05e-6 = 3.48e5
   transition range; with fouling roughness take C_D = 1.2   [A]
Wave:    KC = u_m T_w / D = 1.379 x 6 / 0.4572 = 18.1
   smooth-cylinder curves at KC near 18 give C_D = 1.5, C_M = 1.8   [A]
```

### C.9.3 Environmental load cases (v4 wedge design)

Areas from the freeboard model: still-water frontal area `A_p,sw` = 0.0312 m² (0.035 m² at the survival draft); wave-crest
engulfment `A_p,crest` = 0.4572 × 0.254 = 0.1161 m²; submerged volume at the crest `V_sub,crest` ≈ 0.040 m³.

```
LC2 uplift (buoy pulled fully under a taut line)
   F_net = F_B,max - W
   nominal build:  391.3 - 82.4 = 308.9 N
   light build:    391.3 - 69.3 = 322.0 N      <- design value (lightest build = most uplift)

LC3 current drag
   F = 0.5 rho_w C_D A_p,sw U_c^2 = 0.5 x 1025 x 1.2 x 0.035 x 0.8^2 = 13.8 N

LC4 wave, Morison, phase-swept
   drag amplitude     F_D = 0.5 rho_w C_D A_p,crest u_m^2
                          = 0.5 x 1025 x 1.5 x 0.1161 x 1.379^2 = 169.6 N
   inertia amplitude  F_I = rho_w C_M V_sub a_m
                          = 1025 x 1.8 x 0.040 x 1.445 = 106.6 N
   sweep phi over one cycle: F(phi) = F_D cos(phi)|cos(phi)| - F_I sin(phi)
   maximum |F| = about 1.09 F_D = 185 N       (the drag peak governs; the 200 N sqrt-sum is too high)

LC5 wave plus current, aligned
   drag at the drag-peak phase uses (U_c + u_m) = 0.8 + 1.379 = 2.179 m/s
   F_D = 0.5 x 1025 x 1.5 x 0.1161 x 2.179^2 = 423.8 N
   plus ~107 N of inertia, 90 degrees out of phase  ->  phase-swept maximum about 440 N

Wind (C_D,air = 1.2, U_wind = 22 m/s, rho_air = 1.225)
   float ring    0.5 x 1.225 x 1.2 x 0.0849 x 484 = 30.2 N   at z = 0.161 m
   chassis stub  0.5 x 1.225 x 1.2 x 0.0048 x 484 =  1.7 N   at z = 0.28 m
   solar panel   0.5 x 1.225 x 1.2 x 0.05   x 484 = 17.8 N   at z = 0.36 m
   total 49.7 N, moment about the keel = 4.86 + 0.48 + 6.41 = 11.75 N m

LC6 resultant at the shackle
   F_H = 440 + 50 = 490 N        F_V = 322 N
   T = sqrt(490^2 + 322^2) = sqrt(343 784) = 586 N
   theta = atan(490 / 322) = 56.7 degrees from vertical

LC7 overturning moment about the U-bolt (a lever arm per component)
   current        14 N  x 0.05 m = 0.7 N m
   wave + current 440 N x 0.13 m = 57.2 N m
   wind                          = 11.75 N m
   M = 0.7 + 57.2 + 11.75 = 69.7 N m (about 70 N m)

LC8 hydrostatic pressure
   as floating:  p = 1025 x 9.81 x 0.0683 = 687 Pa (non-governing)
   test spec:    p = 1025 x 9.81 x 5.0 = 50 280 Pa = 50.3 kPa

LC9 snap load (a slack line going taut, amplification 2.0 on the vertical part)
   F_V = 322 x 2.0 = 644 N       F_H = 490 N (a heave event, not amplified)
   T = sqrt(490^2 + 644^2) = sqrt(654 836) = 809 N
   theta = atan(490 / 644) = 37.3 degrees from vertical
```

### C.9.4 Displacement, reserve buoyancy and draft (v5 wedge design)

```
Fully submerged displaced volume (each term is the full envelope, because the cavities are foam-filled or sealed)
   six wedge shells   6 x 3.432 L = 20.594 L     (each 0.5 x (pi/3) x (9.000^2 - 2.875^2) x 5.500 = 209.46 in^3)
   six wedge bottoms  6 x 0.686 L =  4.116 L
   chassis            pi x 2.875^2 x 8.500 = 220.72 in^3 = 3.617 L
   chassis cap        pi x 2.875^2 x 0.375 = 9.74 in^3 = 0.160 L
   V_disp,total = 20.594 + 4.116 + 3.617 + 0.160 = 28.487 L

Maximum buoyant force
   F_B,max = rho_sw g V = 1025 x 9.81 x 0.028487 = 286.4 N

Reserve at the nominal mass of 7.75 kg
   W = 7.75 x 9.81 = 76.0 N
   reserve = 286.4 - 76.0 = 210.4 N
   F_B,max / W = 286.4 / 76.0 = 3.77  (the hull can support 3.77 times its own deployed weight)

Floating equilibrium (weight of displaced water = weight of the buoy)
   waterplane-supported load = 7.749 - 0.372 (appendage credit) = 7.377 kg
   V_req = 7.377 / 1.025 = 7.197 L
   the taper zone (0 to 2 in) holds 4.967 L, so the waterline falls in the parallel zone:
   V(T) = 4.967 + A_wp (T - 2.0),  A_wp = pi x 9.000^2 = 254.47 in^2 = 4.170 L/in
   7.197 = 4.967 + 4.170 (T - 2.0)  ->  T = 2.0 + 2.230 / 4.170 = 2.535 in (64.4 mm)
   consistency check: the same volume matches the submerged total used for KB below (7.197 L)
```

### C.9.5 Small-angle stability (v5 wedge design)

```
KG   = sum(m z) / sum(m) = 28 745 / 7 749 = 3.71 in = 0.0942 m
KB   = (4.116 x 1.25 + 0.851 x 1.00 + 2.230 x 2.27) / 7.197
     = (5.145 + 0.851 + 5.062) / 7.197 = 1.54 in
I_wp = pi D^4 / 64 = pi x 18.000^4 / 64 = 5152.8 in^4         (solid 18 in waterplane)
V    = 7.197 L = 439.2 in^3
BM   = I_wp / V = 5152.8 / 439.2 = 11.73 in
KM   = KB + BM = 1.54 + 11.73 = 13.27 in
GM   = KM - KG = 13.27 - 3.71 = 9.56 in = 0.243 m

Roll period, radius of gyration k = 0.140 m [A]
   T_roll = 2 pi k / sqrt(g GM) = 2 pi x 0.140 / sqrt(9.81 x 0.247)
          = 0.880 / 1.557 = 0.57 s
   the design wave period is 6 s, ten times longer, so there is no roll resonance
```

**One wedge lost** (damaged stability): the lost wedge weighs 0.665 kg at 6.0 in, its wetted volume is about 1.03 L at 5.5
in, total mass 7.594 kg, submerged volume 7.05 L.

```
shift of G   dy_G = -(0.665 x 6.0) / 7.594 = -0.525 in
shift of B   dy_B = -(1.03 x 5.5) / (7.05 - 1.03) = -0.941 in
heeling couple  M_h = W_d (dy_G - dy_B) = 68.0 N x 0.416 in x 0.0254 = 0.719 N m   (toward the gap)
damaged GM   GM_d = 0.213 m [A]
equilibrium  sin(theta) = M_h / (W_d GM_d) = 0.719 / (68.0 x 0.213) = 0.0497  ->  theta = 2.8 degrees
```

### C.9.6 Wedge wall strength (hoop stress and side walls)

Outer wall: `t` = 2.413 mm, `R` = 228.6 mm, `E` = 2240 MPa, `ν` = 0.38, yield 35 MPa **[A]**, pressure 50.3 kPa.

```
hoop (circumferential) stress   sigma = p R / t = 50 300 x 0.2286 / 0.002413 = 4.77 MPa
safety factor on yield          SF = 35 / 4.77 = 7.3

side wall (1.60 mm, 139.7 mm span), simply supported plate, beta = 0.30
   unsupported, 50.3 kPa:  sigma = beta q b^2 / t^2 = 0.30 x 50 300 x 0.1397^2 / 0.0016^2 = 115 MPa
        3.3 times yield: a bare side wall cannot span 140 mm (this is not a service load: the faces are paired)
   with the web halving the span (b = 78 mm), 25 kPa foam-fill transient:
        sigma = 0.30 x 25 000 x 0.078^2 / 0.0016^2 = 17.8 MPa    SF = 2.0

seam bearing in the closed ring (two 1.6 mm walls back to back)
   hoop force per metre 11 500 N/m over thickness 1.60 mm:  11 500 / 0.0016 = 7.2 MPa   (trivial in compression)
```

### C.9.7 Buckling of the wedge ring under 50.3 kPa

```
bending stiffness   D = E t^3 / (12 (1 - nu^2)) = 2.24e9 x (2.413e-3)^3 / (12 x 0.8556) = 3.065 N m

free ring (lower bound)
   p_cr = E t^3 / (4 R^3 (1 - nu^2)) = 31.47 / (4 x 0.011944 x 0.8556) = 770 Pa
   SF = 770 / 50 300 = 0.015

edge-supported curved panel (arc b = 0.2394 m between the epoxied seams)
   Batdorf Z = (b^2 / (R t)) sqrt(1 - nu^2) = (0.05731 / 5.517e-4) x 0.925 = 96
   flat-plate bound, k = 4:  N_cr = 4 x 9.87 x 3.065 / 0.05731 = 2112 N/m
                             p_cr = N_cr / R = 2112 / 0.2286 = 9240 Pa    SF about 0.18
   curved-panel correction, 2 to 4 times:  p_cr = 18 to 37 kPa            SF about 0.4 to 0.7

foam-backed (foam modulus 10 MPa over an effective depth b/4 = 60 mm)
   k_f = 10e6 / 0.060 = 1.67e8 N/m^3
   N_cr,foundation = 2 sqrt(k_f D) = 2 sqrt(1.67e8 x 3.065) = 45 260 N/m
   p_cr,foundation = 45 260 / 0.2286 = 198 kPa
   total p_cr = (18 to 37) + 198 = 216 to 235 kPa        SF about 4.3 (range 3.3 to 4.9)
```

The bare wall does not pass; the foam does the structural work. The same relation, with a smaller radius, sized the
sensor-pod wall in C.9.9.

### C.9.8 Impact energy

```
kinetic energy   KE = 0.5 m v^2
   drift, heavy boat        0.5 x 1000 x 1.0^2 =  500 J
   nominal strike           0.5 x  800 x 1.5^2 =  900 J
   hard strike              0.5 x 1500 x 2.5^2 = 4700 J
   handling drop of the buoy from 1.5 m:  KE = m g h = 7.6 x 9.81 x 1.5 = 112 J

share that deforms the buoy (plastic contact, the boat does not rebound)
   buoy effective mass  m_b,eff = 7.6 x (1 + C_a) + entrained water = 7.6 x 1.7 + 3 = about 16 kg [A]
   E_def = KE x m_b,eff / (m_s + m_b,eff)
   nominal strike  900 x 16 / 816  = 18 J   (2.0%)
   hard strike    4700 x 16 / 1516 = 50 J   (1.1%)

absorption capacity at a 100 mm x 100 mm contact patch
   foam crush   E = sigma_c A d eta = 240e3 x (0.1 x 0.1) x 0.03 x 0.6 = 43 J
   PETG shell   k = 48 D / b^2 = 48 x 3.065 / 0.1^2 = 14 710 N/m
                E = 0.5 k delta^2 = 0.5 x 14 710 x 0.006^2 = 0.26 J      (the shell absorbs almost nothing)
   total pre-crack capacity about 45 to 65 J, set by the foam
```

The buoy is light compared with any boat, so a strike mostly shoves it sideways and the mooring line absorbs the rest
(400 N over 1 m of nylon stretch absorbs about 200 to 400 J). A hard direct strike delivers more than the shell holds and
cracks the wall, which the design accepted because the foam kept the buoyancy.

### C.9.9 Sensor-pod dry-chamber wall

Mean radius 27 mm, outer radius 28 mm, wall `t` = 2.0 mm, pressure 50.3 kPa, same PETG properties.

```
hoop stress   sigma = p R / t = 50 300 x 0.027 / 0.002 = 0.68 MPa     SF = 35 / 0.68 = 51 (not the limit)
buckling      p_cr = [E / (4 (1 - nu^2))] (t / R_o)^3
                   = [2240e6 / (4 x 0.8556)] x (0.002 / 0.028)^3
                   = 654.5 MPa x 3.64e-4 = 238.5 kPa
              SF = 238.5 / 50.3 = 4.7
sensitivity   because p_cr scales with (t/R)^3:  t = 1.5 mm gives SF 2.1;  t = 2.5 mm gives SF 9.2
```

No foam backs this chamber, so buckling governs. The check does not cover the Ø24 mm shaft cutout.

### C.9.10 O-ring squeeze and gland fill

```
ring cross-section  CS = 3/16 in = 0.1875 in
groove depth        0.141 in        groove width 0.262 in

squeeze    = (CS - depth) / CS = (0.1875 - 0.141) / 0.1875 = 24.8 percent    (target 20 to 30)
ring area  = pi CS^2 / 4 = pi x 0.1875^2 / 4 = 0.02761 in^2
groove area = depth x width = 0.141 x 0.262 = 0.03694 in^2
gland fill = 0.02761 / 0.03694 = 74.7 percent                                  (target about 75)
```

The failed run RR-15 shows why the check is made against the real part: a 4.76 mm ring in a groove cut for 2.62 mm.

### C.9.11 Mooring bolt group check (LC9 with the LC7 moment)

```
four 1/4-20 bolts on a 31.75 mm x 28.6 mm pattern, snap load vertical 450 N and a 42 N m moment
worst bolt = 450 / 4 + 42 / 0.03175 / 2 = 112.5 + 661.4 = 774 N
bolt stress about 38 MPa, SF above 5; washer bearing 3.2 MPa on PETG, SF about 11;
pull-through shear 2.6 MPa at a 5 mm wall, SF about 7.7
```

### C.9.12 Righting arm by voxel integration (method)

The stability calculator and the tip explorer find `GZ` the same way at each heel angle `φ`:

```
1. Voxelize the hull (a body of revolution from its STEP profile) on a 2-4 mm grid.
2. Rotate each voxel centre by phi:  z' = y sin(phi) + z cos(phi).
3. Fill the lowest voxels first until their volume equals the displaced volume V_req
   (constant displacement); the waterline is the z' of the last voxel filled.
4. B = centroid of the filled voxels.  G = (KG sin(phi) lateral, KG cos(phi) vertical), from the mass budget.
5. GZ = horizontal distance between B and G.  Positive means the buoy rights itself.
6. Repeat from 0 to 180 degrees; the vanishing angle is where GZ first crosses zero.
Check: at small angles the result must equal GM sin(phi). At 5 degrees the solver gave 0.58 in
against 0.62 in from the formula, which is within the voxel resolution.
```

### C.9.13 Mass budget and the vertical center of gravity (KG)

Print masses come from the slicer (D.5.1). For the v5 wedge-design buoy the budget lists each group's mass and its
centroid height above the keel `z`, then takes the mass-weighted mean.

```
printed shell from the v4 weigh-in:
   6 x (wedge 325.83 + wedge bottom 181.21 + wedge cap 126.86) + chassis 712.82 + chassis cap 89.79
   = 6 x 633.90 + 802.61 = 4606 g

KG = sum(m z) / sum(m)

   group                     m (g)    z (in)   m z (g in)
   chassis shell               600     4.10      2460
   chassis cap                89.8     9.00       808
   6 wedge shells             1440     4.75      6840
   6 wedge bottoms            1242     1.10      1367
   6 wedge caps                761     7.40      5631
   flotation foam              710     4.30      3053
   solar mount                 320    10.00      3200
   solar panel                 700    11.00      7700
   deployment battery          250     2.50       625
   sensor stem                 400    -6.00     -2400
   sensor pod                  200   -13.50     -2700
   (other groups: electronics, fasteners, epoxy, coatings, cabling, hardware)
   totals                     7749              28 745

KG = 28 745 / 7 749 = 3.71 in = 0.0942 m
```

Two checks come from the same table. The hull-only KG, without the stem, pod and cabling, is
`(28 745 + 2400 + 2700 + 180) / (7 749 - 400 - 200 - 60) = 34 025 / 7 089 = 4.80 in`, so the pendant lowers KG by 1.09 in.
The solar panel and mount were 38% of the total moment from 13% of the mass, which is part of why removing solar helped.

### C.9.14 Sustained heel under steady current

```
steady current drag (v5)      LC3 = 0.5 x 1025 x 1.2 x 0.0290 x 0.8^2 = 11.4 N   (about 11 N)
heeling couple about the keel   = 11 N x 0.05 m = 0.55 N m
righting moment per radian      = W GM = 74.5 N x 0.247 m = 18.4 N m
equilibrium   sin(theta) = 0.55 / 18.4 = 0.030     ->     theta = 1.7 degrees
```

The wave and wave-plus-current peaks last a fraction of the 6 s period and the roll period is 0.6 s, so the buoy pitches
through each wave and does not hold the peak angle. The sustained heel is about 2 degrees.

### C.9.15 Failure-case freeboard (flooded compartments)

For a bare printed shell of 4.133 kg, `W = 4.133 x 9.81 = 40.5 N`. Wall material displaces `4133 g / 1.27 g/cm3 = 3.25 L`.

```
chassis sealed, wedges open and flooded
   V = chassis and cap envelope 3.777 L + wall material 3.25 L = 7.03 L
   F_B = 1025 x 9.81 x 0.00703 = 70.7 N       reserve = 70.7 - 40.5 = +30.2 N     (floats)
chassis flooded too
   V = 3.25 L       F_B = 1025 x 9.81 x 0.003254 = 32.7 N      reserve = 32.7 - 40.5 = -7.8 N   (sinks)
```

The chassis seal is the line between floating and sinking. That is why the O-ring face seal and its tests carry so much
weight.

### C.9.16 Scaling the loads from v4 to v5

Each load is proportional to the area or volume it acts on, so the v5 loads are the v4 loads scaled by the new geometry
(draft 0.0683 to 0.0635 m, crest area 0.1161 to 0.0871 m², crest volume 0.040 to 0.0313 m³).

```
LC3 current     0.5 x 1025 x 1.2 x 0.0290 x 0.8^2 = 11.4 N        (v4: 13.8 N, area 0.035)
LC4 wave drag   169.6 N x (0.0871 / 0.1161) = 127 N, x 1.09 for the phase sweep = 139 N     (v4: 185 N)
LC5 wave + current   drag 423.8 N x 0.75 = 318 N plus inertia, phase-swept = about 330 N       (v4: 440 N)
LC2 uplift      F_B,max - W(light build, 6.41 kg) = 286.4 - 62.9 = 223.5 N; 225 N is used      (v4: 322 N)
```

Every load drops 10 to 30 percent, so the v4 FEA, which used the larger loads, bounds v5 and a full re-run was not needed.
The v5 snap load is scaled the same way: `F_V = 225 x 2 = 450 N`, `F_H = 371 N`, resultant 583 N at 40 degrees.

### C.9.17 Sizing the ballast: lead against depth

The self-righting requirement fixes the lead's moment, so the lead needed falls as the arm lengthens:

```
lead x depth = constant (about 50 to 60 kg in)
   13.5 in   4.41 kg x 13.5 = 59.5 kg in
   24 in     2.58 kg x 24   = 61.9 kg in      <- chosen depth
   30 in     2.02 kg x 30   = 60.6 kg in
```

Returns diminish past about 30 in, where the longer stem adds mass, and at a 2 m site a depth beyond about 36 in risks
touching the seabed at a wave trough. The root moment follows from the same product: about 55 to 60 N m at the LC9 snap,
which ruled out a printed PETG stem and led to a 316 stainless pipe. With 1.5 in caps and a 10 percent margin the lead
came to about 2.8 kg. The ballast was dropped on 2026-10-16 with the printed-float design; the method carries over.

### C.9.18 Mooring attachment height: knockdown force

The calculator moves the mooring hardware to each height, then finds the sustained horizontal force `H` that makes the
heeling couple equal the peak righting moment (about 21.5 N m at about 63 degrees heel).

```
heeling moment = H x arm x cos(heel)      peak righting moment M_max = 21.5 N m
knockdown force  H = M_max / arm           (cos(heel) is near 1 at small heel)

   keel pad-eye          arm 1.4 in  = 0.0356 m    H = 21.5 / 0.0356 = 604 N     (study: about 606 N)
   collar 2.5 in below   arm 3.9 in  = 0.0991 m    H = 21.5 / 0.0991 = 217 N     (about 215 N)
   mid-stem              arm 13.4 in = 0.340 m     H = 21.5 / 0.340  =  63 N     (about 64 N)
   stem bottom           arm 25.4 in = 0.645 m     H = 21.5 / 0.645  =  33 N     (about 34 N)
```

Steady 0.8 m/s current gives about 21 N of total drag, so the stem-bottom attachment is knocked down by ordinary
current and the collar, which needs about 215 N, is not.

### C.9.19 Packing budgets

```
Electronics housing, Method 1 (boards on edge, one slice each). Diameter = diagonal + 8 mm radial clearance.
   Feather + wing   diagonal = sqrt(51^2 + 23^2) = 55.9 mm  ->  63.9 mm
   PID 6106         diagonal = sqrt(51^2 + 25^2) = 56.8 mm  ->  64.8 mm   (governs)
   Battery          diagonal = sqrt(35^2 + 30^2) = 46.1 mm  ->  54.1 mm
   length = 22 + 10 + 5 (boards) + 2 x 6 (gaps) + 2 x 15 (end allowances) = 79 mm
   volume = pi x 32.5^2 x 79 = 262 000 mm^3 = 0.262 L

Sensor pod dry chamber
   adapter board diagonal = sqrt(28^2 + 10^2) = 29.7 mm
   but the probe's mounting ears span 44.0 mm; add about 4 mm per side for screw heads:  44.0 + 8 = 52 mm
   governing diameter about 52 mm, set by the probe's own ears and not by the board
```

The later 4.4 in by 5 in housing decision (C.6.3) is larger than this first-pass minimum; the budget compared three
layouts and the housing size was then fixed by John on 2026-10-08.

### C.9.20 From a load to a finite-element input

An FEA load has to be turned into the units and the application the software expects. Examples from the runs:

```
LC2   322 N axial, applied at the U-bolt hole faces, chassis insert region fixed
LC5   440 N horizontal, spread uniformly over the wetted float band (z = 0 to 0.254 m)
LC7   490 N at the pad eye plus a 70 N m couple about +Y.
      unit trap: 42 N m = 42 000 N mm. The v5 re-check entered 42 N mm, 1000 times too small,
      so the moment was not exercised and was closed by hand (C.9.11).
LC8   50.3 kPa inward on every sealed boundary (as a pressure, not a force)
safety factor on yield  SF = 35 MPa / sigma_max      (re-based to PETG from the ABS run: 35 / sigma)
```
