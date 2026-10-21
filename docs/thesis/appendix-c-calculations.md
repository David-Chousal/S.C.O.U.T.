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
