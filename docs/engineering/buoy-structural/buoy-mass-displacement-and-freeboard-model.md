# Buoy Mass, Displacement, and Freeboard Model

> **Summary** — Whole-buoy synthesis: the complete as-deployed mass budget, the foam-filled
> flotation-wedge treatment the team asked for, fully-submerged displacement and reserve
> buoyancy for the assembled buoy, and the **floating-equilibrium freeboard model** (draft,
> waterline, freeboard, immersed fraction) with a mass-sensitivity sweep and the two panel-review
> failure cases (flooded chassis, one wedge lost). This document *consumes* the printed-shell
> sub-budget in [`mass-and-buoyancy-budget.md`](mass-and-buoyancy-budget.md) and the Rev A
> component dimensions in
> [`../electronics-housing-packing-budget.md`](../electronics-housing-packing-budget.md),
> and it feeds the statics equations in
> [`structural-load-framework.md`](structural-load-framework.md) / [`force-budget.md`](force-budget.md).
> It does **not** cover CG / CB / metacentric height / righting — that is stability work
> ([SCO-80](https://linear.app/scout1/issue/SCO-80)), explicitly out of scope here. This is
> buoyancy and freeboard only.
>
> **Revision — v5 geometry (2026-09-09).** This document is now solved on the **v5 flotation
> geometry**: wedge shell **5.500 in** tall (was 8.000), chassis **8.500 in** (was 11.000),
> wedge walls thinned to **0.095 in outer / 0.063 in sides + web** (was 0.250 in uniform), outer
> radius R9.000 in unchanged — the [SCO-110](https://linear.app/scout1/issue/SCO-110) resize +
> the 2026-09-07 thin-wall pass. The prior v4 build (2026-08-29) is preserved verbatim in
> [§14](#14-prior-revision--v4-2026-08-29-build). **Headline shift: nominal mass 8.40 → ~7.59 kg,
> max buoyant force 391 → 286 N, net reserve 309 → ~212 N (4.75× → 3.84×), nominal draft
> 2.69 → 2.50 in, freeboard to the wedge top 7.31 → ~5.0 in.** The "substantially over-floated"
> conclusion is unchanged.
>
> ⚠️ **Tier I shell masses are geometric estimates.** No v5 re-slice exists yet
> ([SCO-110](https://linear.app/scout1/issue/SCO-110)'s one open acceptance box). The v5 wedge
> shell (~240 g) and chassis (~600 g) are computed from wall geometry, not measured — re-run
> [§3](#3-full-mass-budget) and everything below it when the real slice lands. The v5 wedge
> **displacement** and **cavity** are exact from geometry; only the printed mass is estimated.
>
> **Source geometry** — `chassis-floatation-bolted-v5-wedge.step` (John Ryan, 2026-09-08) in
> [`mechanical/cad/floatation/`](../../../mechanical/cad/floatation/) for the wedge; the v4
> `current/` chassis/cap drawings for parts not yet re-exported, scaled to the v5 heights.
> **Source weigh-in (v4 parts carried forward)** — full five-part slicer weigh-in, 2026-08-24, in
> [`mechanical/test/print-weight-verification-2026-08-24.md`](../../../mechanical/test/print-weight-verification-2026-08-24.md).
> **Design basis** — [`../reviews/buoy-preliminary-design-panel-review-2026-08.md`](../reviews/buoy-preliminary-design-panel-review-2026-08.md).
>
> Part of the [Knowledge Hub](../../hub/README.md) supporting engineering docs. Every value is
> tagged by provenance (see [§0](#0-provenance-legend)); **every calculation is shown start to
> finish** — no bare results. Numbers that are still blocked on
> [SCO-70](https://linear.app/scout1/issue/SCO-70) (Isabella's final electronics list + housing
> spec) and [ADR-0002](../../decisions/0002-lifepo4-charging-path.md) (battery sizing) are called
> out as such and carried as low / nominal / high ranges.
>
> **Proposed path** — `docs/engineering/buoy-structural/buoy-mass-displacement-and-freeboard-model.md`

## How to update this document

1. **The v5 re-slice lands** (real wedge + chassis weights) → replace the `[A]` estimates in
   [§3](#3-full-mass-budget) Tier I with `[M]` values, re-run every total below, re-solve
   [§7](#7-freeboard-model), regenerate the [§8](#8-sensitivity-table--draft-and-freeboard-vs-total-mass-v5) sweep.
2. **A printed part is re-weighed** → update [`mass-and-buoyancy-budget.md`](mass-and-buoyancy-budget.md)
   first (it is the living sub-budget), then re-run [§3](#3-full-mass-budget) Tier I and every
   total below it.
3. **SCO-70 lands** (real electronics list, real housing spec, real solar panel/mount, real
   stem/pod) → move those line items from Tier III / Tier II into Tier I with `[M]` tags and
   real masses, then re-solve [§7](#7-freeboard-model) and re-generate the [§8](#8-sensitivity-table--draft-and-freeboard-vs-total-mass-v5)
   sweep. The nominal total mass is the input the freeboard model is most sensitive to.
4. **A foam product is chosen** → replace the `0.032 g/cm³` placeholder in [§2](#2-constants),
   re-run [§4](#4-foam-fill), update [`facts.md`](../../hub/facts.md).
5. **The vertical stack assumption ([§1](#1-scope-datum-and-the-single-biggest-geometric-assumption))
   is confirmed or corrected against the v5 assembly** (taper-zone height, wedge-top elevation)
   → re-derive the piecewise `V_disp(T)` in [§7.2](#72-displaced-volume-as-a-function-of-draft-v5).
6. If any change moves the reserve-buoyancy or "over-floated" conclusion, log it in
   [`design-notes.md`](../../hub/design-notes.md) and update [`facts.md`](../../hub/facts.md).

---

## 0. Provenance legend

Same scheme as [`mass-and-buoyancy-budget.md` §0](mass-and-buoyancy-budget.md#0-provenance-legend)
and [`structural-load-framework.md` §0](structural-load-framework.md#0-provenance-legend):

| Tag | Meaning |
|---|---|
| **[M]** | Measured — read directly off a dimensioned drawing, datasheet, or a physical scale |
| **[L]** | Literature / material constant |
| **[X]** | Exact — true by definition or by geometry (6 wedges → 60° sectors; Archimedes) |
| **[A]** | Assumption — stated explicitly, not yet verified |
| **[C]** | Calibrated — corrected against a real measurement |
| **[X from M]** | Exact geometry / relation (X) evaluated on measured dimensions (M) |
| **[X from M+A]** | A derived output: exact given the geometry, the [§1](#1-scope-datum-and-the-single-biggest-geometric-assumption) stack assumption, and the [§6](#6-submerged-appendages) appendage credit |
| **[A geom]** | Estimated from wall/part geometry — a stand-in for a measurement that does not exist yet (the v5 shell masses) |

Unit constants used throughout: **1 in = 0.0254 m [X]**, **1 in³ = 16.387064 cm³ [X]**,
**1 L = 61.023744 in³ [X]**, **1 kgf = 9.81 N [X]**, **1 lbf = 4.448222 N [X]**,
**1 N = 0.2248089 lbf [X]**.

---

## 1. Scope, datum, and the single biggest geometric assumption

**Geometry (v5):** the buoy is a central sealed chassis cylinder with **six 60° flotation
wedges** bolted around it; each wedge carries a tapered **wedge bottom** (impact cap) beneath it
and a thin **wedge cap** sealing its top. Outer radius `R_outer = 9.000 in` → **outer diameter
= 18.000 in** [M] (unchanged from v4; the STEP confirms R9.000 in). Inner radius
`R_inner = 2.875 in` = chassis rim OD (Ø5.750) ÷ 2 [M] (unchanged — the SCO-110 resize was
height only).

**What changed in v5:** the wedge shell is **5.500 in** tall (was 8.000 — a 2.500 in cut,
STEP-confirmed 203.2 → 139.7 mm) and the chassis is **8.500 in** (was 11.000 — cut by the same
2.500 in, keeping the 1 in stub above the wedge top). Wedge walls thinned from 0.250 in uniform
to **0.095 in outer curved wall / 0.063 in radial sides + internal bracing web**. The
wedge-bottom impact cap, the wedge cap, and the chassis cap are **unchanged** (their geometry is
height-independent).

**Keel datum:** `z = 0` at the **chassis bottom = the bottom of the wedge-bottom taper**. Draft
`T` is measured upward from `z = 0`.

**Vertical stack used by the freeboard model** — this is **the single biggest geometric
assumption in the whole model**; the taper-zone height is carried from v4 at low confidence:

| `z` range (in) | Section | Cross-section presented to the water |
|---|---|---|
| 0.0 – 2.0 | wedge-bottom taper zone | 6 downward-narrowing frustums + Ø5.750 chassis core |
| 2.0 – 7.5 | **parallel 18-in float section** (the waterplane body, 5.5 in tall) | full Ø18.000 in disc (6 foam wedges tile the R2.875–R9.000 annulus; chassis fills the inner disc) |
| 7.5 – 8.5 | chassis stub only | Ø5.750 in |
| 8.5 – ~9.5 | chassis cap + solar-mount standoffs | small, always above the waterline |
| ~10 – ~11.5 | solar panel on its 4-arm printed mount | above the buoy body |

Alternative alignments (wedge top flush with chassis top, taper zone 1.0 in rather than 2.0 in)
are still defensible and would shift the draft solution by up to ~0.4 in — **the over-floated
conclusion does not change** in any of these variants (see [§8](#8-sensitivity-table--draft-and-freeboard-vs-total-mass-v5)).

---

## 2. Constants

| Quantity | Value | Tag |
|---|---|---|
| PETG density `ρ_PETG` | 1.27 g/cm³ | [L] |
| Seawater density `ρ_sw` | 1.025 g/cm³ = 1025 kg/m³ | [L] |
| Gravitational acceleration `g` | 9.81 m/s² | [L] |
| Flotation foam density `ρ_foam` | **0.032 g/cm³** (2 lb/ft³) — **US Composites #0204** chosen 2026-09-08 ([SCO-76](https://linear.app/scout1/issue/SCO-76)); datasheet density pending, generic 2 lb/ft³ carried | [A] |
| Foam density, sensitivity | 0.064 g/cm³ (4 lb/ft³) | [A] |
| Stainless 316 density `ρ_SS316` | 7.98 g/cm³ | [L] |
| Cable jacket density `ρ_jacket` | ~1.4 g/cm³ (PVC/PUR jacket) | [A] |
| Sector angle per wedge | 60° = π/3 rad | [X] — 6 wedges tile 360° |
| `R_outer` | 9.000 in | [M] |
| `R_inner` (chassis interface) | 2.875 in | [M] |
| **Chassis height (v5)** | **8.500 in** | [M] — STEP resize, SCO-110 |
| Chassis OD | 5.750 in (Ø5.750) | [M] |
| **Wedge shell height (v5)** | **5.500 in** | [M] — STEP 139.7 mm |
| **Wedge outer curved wall (v5)** | **0.095 in** (2.41 mm) | [M] — 2026-09-07 check, per John's narration |
| **Wedge inner/side walls + web (v5)** | **0.063 in** (1.60 mm) | [M] — same |
| Wedge-bottom taper height | ~2.000 in | [M], low confidence |

---

## 3. Full mass budget

Organized in three tiers by confidence. Every uncertain line carries **low / nominal / high**.
All masses in grams unless noted. `Total = Tier I + Tier II + Tier III`.

### Tier I — measured shell (v4 parts) + geometric estimates (v5 parts)

The wedge-bottom, wedge-cap, and chassis-cap are physical slicer-scale measurements from the
2026-08-24 weigh-in and are **unchanged in v5** (their geometry did not change). The **wedge
shell and chassis are v5 geometric estimates** — no re-slice exists yet.

| Item | Unit (g) | Qty | Line (g) | Tag | Basis |
|---|---:|---:|---:|:--:|---|
| Chassis (printed shell, v5) | ~600 | 1 | 600 | **[A geom]** | v4 measured 712.82 g scaled to 8.5 in: `712.82 × (0.30 + 0.70·8.5/11.0) = 599` |
| Chassis Cap (printed) | 89.79 | 1 | 89.79 | [M] | slicer 2026-08-24, unchanged in v5 |
| Wedge shell (printed, v5) | ~240 | 6 | 1440 | **[A geom]** | wall material `11.49 in³ = 188 cm³ × 1.27 g/cm³ = 239 g` ([§4.1](#41-cavity-volume-per-module-v5)); brackets the 168–273 g v5 slicing-pass range in [`floatation/README.md`](../../../mechanical/cad/floatation/README.md#thin-wall--dfm-bracing-web-iteration-v5--2026-09-07) |
| Wedge Bottom (printed) | 181.21 | 6 | 1087.26 | [M] | slicer 2026-08-24, unchanged in v5 |
| Wedge Cap (printed) | 126.86 | 6 | 761.16 | [M] | slicer 2026-08-24, unchanged in v5 |
| **Printed shell subtotal (v5)** | | | **3978.4** | [A geom] | `600 + 89.79 + 6·240 + 6·181.21 + 6·126.86` |
| Feather M0 + RFM95 (Adafruit 3178) | 5.8 | 1 | 5.8 | [M] | datasheet p.7 |
| **Tier I TOTAL (v5)** | | | **3984.2** | | ≈ **3.984 kg** (v4 was 4.612 kg) |

Printed-shell arithmetic, in full:
```
Chassis (v5 est) 600.00 × 1 =  600.00
Chassis Cap       89.79 × 1 =   89.79
Wedge (v5 est)   240.00 × 6 = 1440.00
Wedge Bottom     181.21 × 6 = 1087.26
Wedge Cap        126.86 × 6 =  761.16
                              --------
                              3978.21 g = 3.978 kg   [A geom]
```

> **Why the wedge shell drops from 325.83 g to ~240 g.** Two effects compound: the shell is
> 2.5 in shorter (5.5/8.0 = 0.6875×) *and* the walls went from 0.250 in / 15% gyroid to
> fully-dense 0.095 in + 0.063 in perimeters with no infill core. The v4 doc's 325.83 vs 474.58 g
> wedge discrepancy is now moot — neither v4 slice describes the v5 part. **This must be replaced
> with a real v5 slice** before the model stops being provisional.

### Tier II — estimated from repo data

| Item | Low | Nom | High | Tag | Basis |
|---|---:|---:|---:|:--:|---|
| Flotation foam, all 6 wedge modules (2 lb/ft³) | 709.6 | 709.6 | 709.6 | [A] | `6 × 3.696 L cavity × 0.032 g/cm³` — [§4](#4-foam-fill). v5 cavity is smaller than v4's (thinner walls add cavity, but the 2.5 in shorter shell removes more) — net −180 g of foam vs v4 |
| Adalogger FeatherWing (Adafruit 2922) | 5 | 6 | 8 | [A] | ≈ same PCB as the Feather + microSD socket + RTC crystal |
| Stacking headers (2 sets) + board misc | 3 | 5 | 6 | [A] | typical Feather stacking hardware |
| Charger/boost board (Adafruit PID 6106) | 8 | 12 | 15 | [A] | packing budget §1 |
| SEN0189 turbidity adapter board | 12 | 17 | 22 | [A] | 38×28×10 mm envelope, mass scaled from size |
| Internal wiring, 10k/20k divider, JST/connectors | 20 | 40 | 47 | [A] | packing-budget §1 small parts |
| Chassis bottom end cap (printed, no-port) | 40 | 90 | 110 | [A] | `electronics-housing-endcap-no-port.step`; low bound = chassis closed by the drawing set |
| Solar mount (printed PETG, 4-arm bracket + central ring) | 200 | 320 | 450 | [A] | print family; ~3–4× the chassis-cap print mass |
| Fasteners: ~75 M4 SS bolts + washers/nuts + ~60 brass heat-set inserts | 150 | 210 | 300 | [A] | panel review §3; nominal `= (75 × 2.0) + (60 × 1.0) = 210` |
| Epoxy / adhesive (wedge-cap bonds, insert potting, radial seam epoxy, U-bolt leg seal) | 80 | 130 | 200 | [A] | cured-mass estimate; v5 adds the epoxied radial ring seams |
| Antifouling film (Sea Hawk Smart Solution) + 2-part epoxy seal coat | 90 | 200 | 350 | [A] | cured film over ~0.6 m² of v5 hull exterior |
| Cabling (hydrophone + sensor-string conductors) | 60 | 100 | 140 | [A] | 1–3 m at 20–35 g/m |
| **Tier II TOTAL (v5)** | **1377.6** | **1839.6** | **2357.6** | | ≈ **1.84 kg** nominal (v4 was 2.02 kg) |

### Tier III — genuinely open placeholders (blocked on SCO-70 / ADR-0002 / unspecified parts)

Unchanged from v4 — none of these parts were touched by the resize.

| Item | Low | Nom | High | Tag | Basis |
|---|---:|---:|---:|:--:|---|
| Deployment battery, LiFePO₄ | 40 | 250 | 600 | [A] | final sizing pending the measured power budget (ADR-0002) |
| Solar panel (marine, 5–20 W) | 300 | 700 | 1500 | [A] | not specified |
| Sensor stem (printed PETG) | 250 | 400 | 600 | [A] | printed part below the buoy; net submerged load in [§6](#6-submerged-appendages) |
| Sensor pod / turbidity housing | 150 | 200 | 300 | [A] | printed; flood chamber water-filled |
| Mooring hardware on the buoy (SS 316 U-bolt + backing plate + nuts) | 150 | 220 | 350 | [A] | through-bolted at the chassis bottom |
| **Tier III TOTAL** | **890** | **1770** | **3350** | | ≈ **1.77 kg** nominal |

### Grand total (v5)

| Scenario | Tier I | Tier II | Tier III | **TOTAL mass** | **Weight `W = m·g`** |
|---|---:|---:|---:|---:|---:|
| **Low** | 3984.2 | 1377.6 | 890 | **6252 g ≈ 6.25 kg** | **61.3 N** (6.25 kgf / 13.8 lbf) |
| **Nominal** | 3984.2 | 1839.6 | 1770 | **7594 g ≈ 7.59 kg** | **74.5 N** (7.59 kgf / 16.7 lbf) |
| **High** | 3984.2 | 2357.6 | 3350 | **9692 g ≈ 9.69 kg** | **95.1 N** (9.69 kgf / 21.4 lbf) |

```
Nominal: 3984.2 + 1839.6 + 1770.0 = 7593.8 g  →  7.594 kg
W_nom = 7.594 kg × 9.81 m/s² = 74.50 N
```

Nominal composition: printed shell **3.978 kg (52.4%)**, foam **0.710 kg (9.3%)**, everything
else **2.906 kg (38.3%)**. The two widest single uncertainty bands are still the **solar panel**
(0.30–1.50 kg) and the **battery** (0.04–0.60 kg), both blocked on decisions not yet made — plus,
new in v5, the **~±60 g on the estimated wedge-shell mass** (`6 × ~10 g`) and **~±40 g on the
chassis estimate** until the re-slice.

**Combined-sensitivity excursions:**

| Case | Total mass |
|---|---:|
| Nominal | 7.59 kg |
| Nominal + foam at 4 lb/ft³ | `7.594 + 0.710 = ` **8.30 kg** |
| Nominal + wedge shell at the 273 g top of the v5 slice range | `7.594 + 6·0.033 = ` **7.79 kg** |
| High estimate + foam sensitivity | ≈ 10.4 kg |

---

## 4. Foam fill

Per the standing instruction: **all six wedge modules are completely full of flotation foam** =
wedge-shell cavity + wedge-bottom cavity (foam poured into the assembled wedge + wedge-bottom).
The v5 web has lightening holes, so the internal volume is one connected cavity.

### 4.1 Cavity volume per module (v5)

**Wedge shell.** Outer envelope (annular sector), `R_o = 9.000`, `R_i = 2.875`, `h = 5.500`,
`θ = π/3`:
```
V_env = 0.5 · θ · (R_o² − R_i²) · h
      = 0.5 · 1.0471976 · (81.000000 − 8.265625) · 5.500
      = 0.5 · 1.0471976 · 72.734375 · 5.500
      = 209.460 in³
      = 209.460 × 16.387064 = 3432.4 cm³ = 3.432 L     [X from M]
```
(v4 was 304.67 in³ / 4.993 L — the ratio is exactly 5.5/8.0 = 0.6875.)

Wall material — outer curved wall at `t_o = 0.095 in`, inner curved wall + 2 radial faces +
internal web at `t_s = 0.063 in`:
```
outer curved:  (R_o · θ) · h · t_o = (9.000 · 1.0471976) · 5.500 · 0.095 = 4.924 in³
inner curved:  (R_i · θ) · h · t_s = (2.875 · 1.0471976) · 5.500 · 0.063 = 1.043 in³
2 radial faces: 2 · [(R_o − R_i) · h] · t_s = 2 · (6.125 · 5.500) · 0.063 = 4.245 in³
internal web (spans R_i→R_o, full height, ~40% open): (6.125 · 5.500) · 0.063 · 0.60 = 1.273 in³
wall total = 4.924 + 1.043 + 4.245 + 1.273 = 11.486 in³ = 188.2 cm³     [A geom]

Cavity_wedge = 209.460 − 11.486 = 197.974 in³ = 3243.9 cm³ ≈ 3.244 L     [A]
```
(v4 cavity was 4.185 L. The thinner walls give back ~1 L of cavity per module, but the 2.5 in
shorter shell removes ~1.9 L — net −0.94 L.)

**Wedge bottom** — unchanged from v4: displacement envelope **0.686 L**, cavity **0.452 L** [A].

```
Cavity per module = Cavity_wedge + Cavity_wb = 3.244 + 0.452 = 3.696 L = 3696 cm³     [A]
```

### 4.2 Foam fill volume and mass

```
ρ_foam (2 lb/ft³) ≈ 0.032 g/cm³

foam per module = V_cavity · ρ_foam = 3696 cm³ × 0.032 g/cm³ = 118.3 g
all 6 modules   = 118.3 g × 6 = 709.6 g ≈ 0.710 kg     [A]
total foam volume = 3.696 L × 6 = 22.18 L
```

| Scenario | `ρ_foam` | Foam / module | **Foam × 6** |
|---|---:|---:|---:|
| **Nominal (2 lb/ft³)** | 0.032 g/cm³ | 118.3 g | **709.6 g** |
| **Sensitivity (4 lb/ft³)** | 0.064 g/cm³ | 236.5 g | **1419.3 g** (+709.6 g) |

Closed-cell foam **does not absorb water**, so a foam-filled wedge module displaces its **full
outer envelope** (`3.431 + 0.686 = 4.117 L` per module) regardless of shell cracks.

### 4.3 Failure-mode number — buoyancy of the foam ALONE (printed shell entirely gone)

```
F_B,foam (per module) = ρ_sw · g · V_cavity − (m_foam · g)
                      = (1025 × 9.81 × 0.003696) − (0.1183 × 9.81)
                      = 37.16 N − 1.16 N
                      = 36.00 N net upward per module     (≈ 3.67 kgf / 8.1 lbf)

All 6 modules, foam alone = 36.00 × 6 = 216.0 N     (≈ 22.0 kgf / 48.6 lbf) net upward
```

With every printed shell gone, the foam alone still lifts **~22 kgf — ~2.9× the entire nominal
7.59 kg all-up mass** (v4 was ~3.2×). The panel-review "a cracked wedge shell must retain useful
buoyancy" intent ([SCO-81](https://linear.app/scout1/issue/SCO-81)) is still met with margin.

---

## 5. Whole-buoy displacement and buoyancy

```
F_B = ρ_sw · g · V_disp     [X]  (Archimedes)
W   = m · g                 [X]
```

### 5.1 Fully-submerged displaced volume of the assembled buoy (v5)

| Element | Each | Qty | Volume (L) | Tag | Derivation |
|---|---:|---:|---:|:--:|---|
| Wedge shell outer envelope (foam-filled → displaces full envelope) | 3.432 L | 6 | 20.594 | [X from M] | `0.5·(π/3)·(9.000²−2.875²)·5.500 = 209.46 in³` each |
| Wedge Bottom (frustum displacement, foam-filled) | 0.686 L | 6 | 4.116 | [A] | unchanged from v4 |
| Chassis (O-ring sealed → displaces full envelope) | 3.617 L | 1 | 3.617 | [X from M] | `π · 2.875² · 8.500 = 220.72 in³` |
| Chassis Cap | 0.1596 L | 1 | 0.160 | [A] | `π · 2.875² · 0.375 = 9.74 in³` — unchanged |
| Wedge Caps | folded into the wedge envelope | 6 | 0 | [A] | thin lids; ride above the waterline anyway |
| **`V_disp,total`** | | | **28.487** | | `= 0.028487 m³` |

```
20.594 + 4.116 + 3.617 + 0.160 = 28.487 L     [X from M + A]
```
(v4 was 38.912 L. The drop is 6 shorter wedges −9.37 L and a shorter chassis −1.06 L.)

### 5.2 Maximum buoyant force (buoy fully submerged)

```
F_B,max = ρ_sw · g · V_disp,total
        = 1025 kg/m³ × 9.81 m/s² × 0.028487 m³
        = 10055.25 × 0.028487
        = 286.4 N
        = 286.4 / 9.81      = 29.2 kgf
        = 286.4 × 0.2248089 = 64.4 lbf
```
(v4: 391.3 N.)

### 5.3 Net reserve buoyancy

```
Net reserve = F_B,max − W_total

Low mass   (6.25 kg):  W = 61.3 N  →  reserve = 286.4 − 61.3  = 225.1 N  (22.9 kgf / 50.6 lbf)
Nominal    (7.59 kg):  W = 74.5 N  →  reserve = 286.4 − 74.5  = 211.9 N  (21.6 kgf / 47.6 lbf)
High mass  (9.69 kg):  W = 95.1 N  →  reserve = 286.4 − 95.1  = 191.3 N  (19.5 kgf / 43.0 lbf)
```

`F_B,max / W_nom = 286.4 / 74.5 = 3.84` — **the fully-submerged hull can support 3.84× the
entire nominal deployed weight** (v4 was 4.75×). At the high-mass estimate the ratio is
`286.4 / 95.1 = 3.01`. This matches the SCO-110 decision basis ("~3.9× nominal, ~2.9× high"),
which is what the resize was sized against. ~74% of the hull's displaced volume is still unused
reserve at nominal mass.

### 5.4 Reference cases (zero payload, v5)

| Case | `W` | Reserve = `F_B,max − W` | Note |
|---|---:|---:|---|
| Foam-filled shell, no payload | `(3.978 + 0.710)·9.81 = 46.0 N` | **+240.4 N** | printed shell + foam only |
| True bare shell, cavities air-filled, no foam | `3.978·9.81 = 39.0 N` | **+247.4 N** | |
| Bare shell, wedges open and flooded, **chassis sealed** | `3.978·9.81 = 39.0 N` | ≈ **+30.5 N** | displacement collapses to chassis+cap envelope (3.777 L) + PETG wall material (`3978 g / 1.27 = 3.13 L`) ≈ 6.91 L → `F_B ≈ 1025·9.81·0.00691 = 69.5 N`. Still positive, thinner than v4's ~+34 N — the foam fill is what turns this into the +240 N case above |
| Bare shell, wedges **and** chassis flooded | `3.978·9.81 = 39.0 N` | ≈ **−7.5 N** (sinks) | `V_disp = 3978 g / 1.27 = 3.13 L → F_B = 31.5 N < W`. The chassis O-ring seal is the line between "floats on shell alone" and "sinks" once foam is discounted |

---

## 6. Submerged appendages

**Unchanged from v4** — the resize did not touch the stem, pod, mooring hardware, or cabling.

The **sensor stem, sensor pod, mooring hardware, and the external run of cabling** hang *below*
the hull. Their effect on the floating hull is `(weight − own displacement)`, applied as a
**downward point load** in the equilibrium — **not** added to the hull's displacement.

| Appendage | Air mass (g, nom) | Method | Net downward (g) | Net (N) | Displacement credit (g) |
|---|---:|---|---:|---:|---:|
| Sensor stem | 400 | **[A]** perforated/flooded, modelled at **0.60 × air weight** net-down | 240.0 | 2.354 | 160.0 |
| Sensor pod | 200 | **[A]** flood chamber water-filled → **0.30 × air weight** net-down | 60.0 | 0.589 | 140.0 |
| Mooring U-bolt + backing plate | 220 | weight − SS316 displacement: `V = 220 / 7.98 = 27.6 cm³` | 191.7 | 1.881 | 28.3 |
| External cabling (~60 g of the 100 g run) | 60 | weight − jacket displacement (`ρ_jacket ≈ 1.4 g/cm³`) | 16.0 | 0.157 | 44.0 |
| **Totals** | **880** | | **507.7** | **4.98** | **372.3** |

```
appendage displacement credit = 880 − 507.7 = 372.3 g ≈ 0.372 kg
waterplane-supported load (nominal) = m_total − 0.372 kg = 7.594 − 0.372 = 7.222 kg
```

A **zero-credit** variant is carried alongside every result and shifts the nominal draft by only
+0.09 in — immaterial against ~5 in of freeboard.

---

## 7. Freeboard model

Floating equilibrium: **weight of displaced seawater = total weight**, with the submerged
appendages resolved as the net downward load from [§6](#6-submerged-appendages). Unknown = draft
`T` (waterline height above the keel datum `z = 0`).

### 7.1 Waterplane area (parallel zone)

**Unchanged from v4** — the outer radius did not change, so the waterplane in the parallel zone
is still a **solid 18-in circle**:
```
A_wp = π · R_outer² = π · (9.000 in)² = 254.47 in² = 0.16417 m²

displaced volume per inch of parallel draft:
  254.47 in³ = 254.47 / 61.023744 = 4.170 L/in     (= 0.004170 m³/in)
```

### 7.2 Displaced volume as a function of draft (v5)

Chassis core area at any `z ≥ 0`: `A_chassis = π · 2.875² = 25.97 in²`.

**Taper zone, `0 ≤ T ≤ 2.0 in`** — **unchanged from v4** (the wedge-bottom impact cap and the
lowest 2 in of the chassis are identical). Modelled so the wedge-bottom ring area reaches the
full R2.875–R9.000 annulus at `z = 2` and integrates to the 4.116 L full taper-zone
wedge-bottom displacement:
```
full taper zone at T = 2.0 in:
  V_disp(2.0) = (25.97 in² · 2.0 in) + 4.116 L-equivalent
              = 0.851 L (chassis lower 2 in) + 4.116 L (6 wedge bottoms)
              = 4.967 L
```

**Parallel zone, `2.0 in < T ≤ 7.5 in`** (the top is now 7.5 in, not 10 in):
```
V_disp(T) = 4.967 L + A_wp · (T − 2.0 in)
          = 4.967 + 4.170 · (T − 2.0)          [L, T in inches]

check at T = 7.5:  4.967 + 4.170 · 5.5 = 4.967 + 22.935 = 27.902 L
                   + chassis stub z=7.5→8.5 (25.97 in³ = 0.426 L) + chassis cap (0.160 L)
                   = 28.488 L ≈ V_disp,total (28.481)   ✓
```

### 7.3 Equilibrium solve at nominal mass

```
waterplane-supported load = m_total − appendage displacement credit = 7.594 − 0.372 = 7.222 kg
required displaced volume  V_req = 7.222 kg / 1.025 kg/L = 7.045 L

7.045 L  >  4.967 L (full taper zone)   →   solution lands in the PARALLEL zone

7.045 = 4.967 + 4.170 · (T − 2.0)
(7.045 − 4.967) / 4.170 = 2.078 / 4.170 = 0.498 in
T = 2.0 + 0.498 = 2.498 in  ≈  2.50 in  =  63.5 mm
```
Zero-credit variant: `V_req = 7.594 / 1.025 = 7.409 L → T = 2.0 + (7.409 − 4.967)/4.170 = 2.59 in`
(+0.09 in). The 2.50 in value is carried forward.

### 7.4 Freeboard results (nominal, all from the keel datum `z = 0`)

Every value here, in [§8](#8-sensitivity-table--draft-and-freeboard-vs-total-mass-v5), and in [§9](#9-failure-mode-freeboard-panel-review-action-a3)
is a derived output tagged **[X from M+A]** — exact given the geometry, the [§1](#1-scope-datum-and-the-single-biggest-geometric-assumption)
vertical-stack assumption, and the [§6](#6-submerged-appendages) 0.372 kg appendage credit.

| Quantity | Value |
|---|---|
| **Draft `T`** | **2.50 in / 63.5 mm** |
| Waterline elevation | `z = 2.50 in` |
| Zone the solution lands in | parallel 18-in float section, 0.50 in above the taper break |
| **Freeboard to top of the 18-in float section** (`z = 7.5`): `7.5 − T` | **5.00 in / 127 mm** |
| Freeboard to top of the buoy body / chassis cap (`z ≈ 9.5`): `9.5 − T` | **7.00 in / 178 mm** |
| Parallel 18-in float section (`z = 2→7.5`, 5.5 in tall) — submerged fraction: `(T − 2)/5.5` | **0.091 → 9.1% wetted, 90.9% exposed** |
| Whole flotation body (`z = 0→7.5`, 7.5 in) — submerged fraction: `T/7.5` | **0.33** |
| Total buoy body height (`z = 0→9.5`, 9.5 in) — immersed fraction: `T/9.5` | **0.26** |

---

## 8. Sensitivity table — draft and freeboard vs total mass (v5)

`V_req = (m_total − 0.372) / 1.025` ; `T = 2.0 + (V_req − 4.967) / 4.170`. Appendage displacement
credit held at 0.372 kg [A]. All solutions land in the parallel zone.

| `m_total` (kg) | `m_eff` (kg) | `V_req` (L) | Draft `T` (in / mm) | FB to wedge top `7.5−T` (in / mm) | FB to buoy top `9.5−T` (in) | Parallel section immersed | Buoy-height immersed |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 6 | 5.63 | 5.49 | 2.13 / 54.0 | 5.37 / 136 | 7.37 | 2.3% | 22.4% |
| 7 | 6.63 | 6.47 | 2.36 / 59.9 | 5.14 / 131 | 7.14 | 6.5% | 24.8% |
| **7.59 (nom)** | **7.22** | **7.05** | **2.50 / 63.5** | **5.00 / 127** | **7.00** | **9.1%** | **26.3%** |
| 8 | 7.63 | 7.44 | 2.59 / 65.8 | 4.91 / 125 | 6.91 | 10.8% | 27.3% |
| 9 | 8.63 | 8.42 | 2.83 / 71.8 | 4.67 / 119 | 6.67 | 15.1% | 29.8% |
| 10 | 9.63 | 9.39 | 3.06 / 77.7 | 4.44 / 113 | 6.44 | 19.2% | 32.2% |
| 11 | 10.63 | 10.37 | 3.30 / 83.7 | 4.20 / 107 | 6.20 | 23.6% | 34.7% |
| 12 | 11.63 | 11.34 | 3.53 / 89.7 | 3.97 / 101 | 5.97 | 27.8% | 37.2% |
| 13 | 12.63 | 12.32 | 3.76 / 95.6 | 3.74 / 95 | 5.74 | 32.0% | 39.6% |

Across the **entire** 6–13 kg range the draft moves only ~1.6 in, the buoy never immerses more
than a third of its 5.5-in float section, and freeboard to the wedge top never drops below
~3.7 in. The v5 buoy rides lower than v4 (5.0 vs 7.3 in freeboard at nominal) but is still
firmly over-floated across every plausible mass.

---

## 9. Failure-mode freeboard (panel review Action A3)

Worked changes in draft and freeboard for the two credible casualties. Both hold the nominal
7.59 kg build and the 0.372 kg appendage credit.

### 9.1 Flooded chassis (O-ring seal or gland fails)

```
lost hull displacement       = 3.617 L      →  F_B,max drops to 1025·9.81·(0.028487 − 0.003617)
                                             = 1025·9.81·0.024870 = 250.1 N
reserve still = 250.0 − 74.5 = 175.5 N (17.9 kgf) — buoy still floats with large margin

freeboard solve, chassis giving zero displacement:
  taper-zone full      = 6 wedge bottoms only = 4.116 L   (chassis 0.851 L term removed)
  parallel-zone rate   = (254.47 − 25.97) in³/in = 228.50 in³/in = 3.745 L/in
  entrained water in the chassis up to the waterline (ID ≈ 5.55 in → 24.2 in²; column ≈ 2.7 in)
                       ≈ 65 in³ ≈ 1.06 L ≈ 1.06 kg added weight   [A, soft]
  m_eff = 7.222 + 1.06 = 8.28 kg  →  V_req = 8.08 L
  8.08 = 4.116 + 3.745·(T − 2)  →  (3.964)/3.745 = 1.06  →  T ≈ 3.06 in
```
**Flooded chassis: draft 2.50 → ~3.1 in, freeboard to wedge top 5.00 → ~4.4 in.** The buoy stays
afloat with ~4.4 in of freeboard; the ~1.1 kg entrained-water figure is a soft estimate.

### 9.2 One wedge module lost entirely (shell + cap + bottom + its foam)

```
mass removed = 240 + 126.86 + 181.21 + 118.3 = 666.4 g
m_total = 7.594 − 0.666 = 6.928 kg  →  m_eff = 6.928 − 0.372 = 6.556 kg  →  V_req = 6.396 L

displacement capacity with 5 wedges (spanning 300°):
  taper-zone full    = 5·0.686 + 0.851 = 4.281 L
  parallel-zone rate = (5/6)·(254.47 − 25.97) + 25.97 = 190.4 + 25.97 = 216.4 in³/in = 3.546 L/in
6.396 = 4.281 + 3.546·(T − 2)  →  (2.115)/3.546 = 0.596  →  T ≈ 2.60 in
```
**One wedge lost: draft 2.50 → ~2.60 in, freeboard to wedge top 5.00 → ~4.90 in.** The draft
barely moves, but flotation is now **asymmetric** (a 60° gap) → a static list/trim toward the
missing wedge. Quantifying that heel angle is CG/CB/GM work
([SCO-80](https://linear.app/scout1/issue/SCO-80)), not this model.

---

## 10. Interpretation

- **Is the "reasonable freeboard" design intent (panel review §3) met?** Yes. At nominal mass
  the v5 buoy floats a Ø18-in body with **2.50 in of draft**, showing **5.00 in of freeboard to
  the wedge top** and **7.00 in to the top of the chassis cap**, with the solar deck well clear
  of the water. This is less freeboard than v4 (7.31 in) — the deliberate trade in the SCO-110
  resize — but still comfortably positive.

- **Is the buoy over-floated?** **Yes, still substantially.** Only **9.1%** of the 5.5-in
  parallel float section is wetted (91% rides dry); reserve buoyancy is **~212 N (21.6 kgf)
  against a 7.59 kg build — a ~3.84:1 flotation margin** (v4 was 4.75:1). Even the high-mass
  (9.69 kg) estimate leaves ~19.5 kgf of reserve (3.0:1). **The design problem is still not
  achieving flotation — it is waterline, freeboard, and (out of scope here) CG given how high
  the buoy rides.** Watch the language, though: the margin has eroded from "huge" to "healthy"
  (net reserve 309 → 212 N, ratio 4.75 → 3.84, freeboard-to-wedge-top now ~5 in of a 5.5-in
  section). A further wedge-height cut, or landing on the high-mass estimate (~3.2:1), moves this
  toward "comfortably over-floated" rather than "substantially." Nothing crosses that line yet.

- **Consequences of the v5 resize.** *Gained:* ~0.8 kg less mass, ~1 kg less print filament, and
  the solar panel/antenna sit 2.5 in lower — which lowers the windage moment arm and should
  lower CG (to be confirmed on [SCO-80](https://linear.app/scout1/issue/SCO-80)). *Given up:*
  2.3 in of freeboard and ~0.9× of reserve-buoyancy ratio. Still unswampable in the sense that
  matters — the margin absorbs biofouling gain, payload growth, a flooded chassis
  ([§9.1](#91-flooded-chassis-o-ring-seal-or-gland-fails)), and the loss of a wedge module.

- **What would it take to bring the waterline to mid-wedge (`T = 4.75 in`)?**
  ```
  V_disp(4.75) = 4.967 + 4.170 · (4.75 − 2) = 4.967 + 11.47 = 16.44 L
  required waterplane-supported mass = 16.44 L × 1.025 kg/L = 16.85 kg
  required total mass ≈ 16.85 + 0.372 ≈ 17.2 kg   →   ~9.6 kg of added ballast/payload over nominal
  ```
  Still not reachable with realistic payload growth, though closer than v4's +14 kg. A softer
  `T = 3.75 in` target needs ≈ +5.5 kg. The realistic levers remain: **don't fill the wedges
  solid with foam**, **shrink/reduce the wedges further**, and/or **add low chassis ballast**
  (which also lowers CG).

- **Stability caveat.** Same as v4 — a wide, shallow-draft disc has strong initial metacentric
  stability but can snap-roll in chop, and the one-wedge-loss case introduces a static list.
  Full CG / CB / GM / righting-arm analysis is **[SCO-80](https://linear.app/scout1/issue/SCO-80),
  out of scope here.** The v5 resize should help CG (lower deck) — that needs confirming, not
  assuming.

---

## 11. Cross-section elevation (nominal draft, v5)

Vertical scale ≈ 1 row per inch through the float section. Waterline drawn at the computed
nominal draft `T = 2.50 in`. All `z` dimensions from the keel datum.

```
                              [====== SOLAR PANEL ======]        z ~= 10 - 11.5 in
                                  \        |        /            (semi-flexible / framed, ~0.7 kg nom)
                                    \      |      /   <- printed 4-arm PETG mount + ring
                                      \    |    /
                          ____________ [==|==] ____________       z = 8.5 - 9.5 in : chassis cap (Ø5.75)
   z = 9.5  ---top of ---> |            chassis stub           |  z = 7.5 - 8.5 in : O-ring lid + gland
             chassis cap   |          (Ø5.750 in only)         |
   z = 7.5  ------------ +===================================+  <-- TOP OF 18-in FLOAT SECTION
             ^            |####  ####  ####  ####  ####  ####  |          ^
             |            |####   6 foam-filled 60 deg     ####|          | FREEBOARD to wedge top
   FB to     |            |####      flotation wedges      ####|          |   = 7.50 - 2.50
   buoy top  |            |####   (Ø18.000 in envelope,    ####|          |   = 5.00 in / 127 mm
   = 7.00 in |            |####     5.5 in tall in v5)     ####|          v
             |            |####  ####  ####  ####  ####  ####  |
             v    ~~~~~~~~|####~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ####|~~~~~~~~~~~~~   S E A W A T E R
   z = 2.50  ~~ WATERLINE ~~  draft T = 2.50 in / 63.5 mm below keel datum  ~~~~~~~~~~~~~~~~~
                          |####|  (chassis core Ø5.75 runs full height through the wedge ring)
   z = 2.0   ------------ | \####  wedge-bottom taper zone  ####/ |   z = 0.0 - 2.0 in
                          |   \####   6 impact caps,       ####/  |   (18-in dia at top,
   z = 0.0   ============ +-----\####  ~45 deg inward      ####/--+   narrowing toward keel)
             KEEL DATUM          \___________ | ___________/
             z = 0                            |
                                          [ U-BOLT ]   <- SS316 mooring point, through chassis bottom
                                              |
                                              |   <- printed sensor stem (perforated, floods;
                                             |||       hangs below the hull, ~0.40 kg air)
                                             |||
                                            [===]  <- sensor / turbidity pod (flood chamber,
                                            [pod]      near-neutral, ~0.20 kg air)

   LEFT: vertical dimensions from keel datum z = 0        RIGHT: freeboard callouts
   Draft T = 2.50 in  -> only the lowest 0.50 in of the 5.5-in parallel wedge section is wetted
                         (9.1%); the taper zone (z = 0 - 2 in) is fully submerged.
```

---

## 12. Open items — what is still blocked

| Item | Blocked on | Effect if it moves |
|---|---|---|
| **Real v5 wedge + chassis print weights** | [SCO-110](https://linear.app/scout1/issue/SCO-110) re-slice | Tier I `[A geom]` → `[M]`; re-solve §7, re-run §8. Expected effect small (shell is ~52% of nominal mass but the estimate is bracketed by the slice-pass range) |
| Electronics list + masses, housing spec | [SCO-70](https://linear.app/scout1/issue/SCO-70) | Tier II/III → Tier I; re-solve §7, re-run §8 |
| Deployment battery sizing (40–600 g range) | [ADR-0002](../../decisions/0002-lifepo4-charging-path.md) power budget | widest single mass band after the solar panel |
| Solar panel + mount (0.3–1.5 kg) | not yet specified | second-widest mass band; dominant windage/CG item |
| Foam product datasheet density | [SCO-76](https://linear.app/scout1/issue/SCO-76) (product chosen, datasheet pending) | swap the 0.032 g/cm³ placeholder; ±0.71 kg at 4 lb/ft³ |
| v5 dimensioned wedge PDF (confirm 0.095/0.063 walls, ~0.69 in bolt flange) | [SCO-110](https://linear.app/scout1/issue/SCO-110) | tightens the [§4.1](#41-cavity-volume-per-module-v5) wall-material estimate |
| Vertical stack / taper-zone height (2.0 vs 1.0 in) | v5 assembly elevation | ±0.4 in on nominal draft; conclusion unchanged |
| CG / CB / GM / righting, one-wedge-loss list angle | [SCO-80](https://linear.app/scout1/issue/SCO-80) | separate deliverable; this doc feeds it `m_total`, `V_disp`, `T` |
| Assembly-level ring-buckling FEA of the epoxied 6-wedge ring | [SCO-71](https://linear.app/scout1/issue/SCO-71) / [SCO-73](https://linear.app/scout1/issue/SCO-73) | confirms the thinned v5 walls survive external pressure with foam backing |

---

## 13. Method — reproducing or re-running this analysis

A routine re-run (one weight changed, SCO-70 lands, a new foam product) only needs to
re-evaluate the affected steps.

### Inputs and where they live

| Input | Source |
|---|---|
| Printed-part weights (wedge-bottom, wedge-cap, chassis-cap) | [`mass-and-buoyancy-budget.md`](mass-and-buoyancy-budget.md) §§3–9 — real slicer weigh-in, 2026-08-24 |
| **v5 wedge geometry** | `mechanical/cad/floatation/chassis-floatation-bolted-v5-wedge.step` + the 2026-09-07 wall-thickness check |
| **v5 chassis height** | [SCO-110](https://linear.app/scout1/issue/SCO-110) — 8.500 in; v5 chassis STEP not yet exported |
| Cavity volumes (foam) | [§4.1](#41-cavity-volume-per-module-v5) of this doc |
| Rev A component masses (Tier I/II) | [`../electronics-housing-packing-budget.md`](../electronics-housing-packing-budget.md) §1 |
| Densities, constants | §2 of this doc |
| Environmental design set (for the FEA loads) | [`force-budget.md`](force-budget.md) — signed off 2026-09-08, SCO-73 |

### The 6 steps

1. **Printed shell mass** — wedge-bottom + wedge-cap + chassis-cap are the 2026-08-24 measured
   values (unchanged). Wedge shell + chassis are **v5 geometric estimates** until the re-slice:
   wedge shell = wall material volume × 1.27 g/cm³; chassis = v4 712.82 g scaled to 8.5 in.
2. **Foam** — `cavity = envelope − wall` for the v5 wedge (§4.1) + the unchanged wedge bottom;
   `× 6 modules × ρ_foam`. Also the shell-gone failure number.
3. **Everything else** — tiered low/nominal/high (§3). Tier II foam line is the only one that
   changed from v4; Tier III is identical.
4. **Displacement** — foam-filled wedges + wedge bottoms + sealed chassis + caps each displace
   their **full envelope**; sum → `V_disp,total`; `F_B,max = ρ_sw·g·V_disp,total`.
5. **Freeboard** — waterplane `A_wp = π·R_outer²` (unchanged); piecewise `V_disp(T)` (taper zone
   `0–2 in` unchanged, parallel zone now `2–7.5 in` at `A_wp` per inch); appendages enter as
   `(weight − own displacement)` net-down; solve `ρ_sw·V_disp(T) = m_eff` for `T`; freeboard
   `= 7.5 in − T` (to wedge top) or `9.5 in − T` (to buoy top).
6. **Sensitivity sweep** — `T` and freeboard vs `m_total` over 6–13 kg (§8), then the two
   failure cases (§9).

Key conversions: `1 L = 61.0237 in³`, `1 in = 0.0254 m`, `1 in² = 6.4516 cm²`, `1 kgf = 9.81 N`.

### Verification depth — match it to the change

- **Full rebuild / a conclusion flips:** 3 independent derivations → reconcile → 2 adversarial
  checks → 2 audits. This is what the 2026-08-29 v4 build used.
- **Routine update** (one weight moved, SCO-70 lands, new foam product, env-set revised): one
  careful pass re-evaluating only the affected steps, plus **one** independent agent re-deriving
  the changed headline numbers. **The v5 rebuild (2026-09-09) used this depth** — the geometry
  change is mechanical (heights + wall thicknesses into formulas that did not change), so a
  single independent re-derivation of the headline numbers was the proportionate check.

### What triggers a re-run

v5 re-slice weights · SCO-70 lands · foam product datasheet · vertical-stack alignment confirmed
against the v5 assembly · environmental design set revised.

---

## 14. Prior revision — v4 (2026-08-29 build)

Preserved verbatim for the record. This is the model as it stood **before** the
[SCO-110](https://linear.app/scout1/issue/SCO-110) resize (wedge 8.000 in, chassis 11.000 in,
wedge walls 0.250 in uniform, 5-part slicer weigh-in). Superseded by §§1–13 above on 2026-09-09;
kept so the pre-resize numbers are not lost.

### v4 geometry

| Quantity | v4 value |
|---|---|
| Wedge shell height | 8.000 in |
| Chassis height | 11.000 in |
| Wedge wall thickness | 0.250 in uniform |
| Parallel float section | `z = 2.0 → 10.0 in` (8 in tall) |
| Buoy body top | `z ≈ 12 in` |

### v4 mass budget

| Scenario | Tier I | Tier II | Tier III | TOTAL mass | Weight |
|---|---:|---:|---:|---:|---:|
| Low | 4611.8 | 1558.3 | 890 | 7.06 kg | 69.3 N |
| **Nominal** | 4611.8 | 2020.3 | 1770 | **8.40 kg** | **82.4 N** |
| High | 4611.8 | 2538.3 | 3350 | 10.50 kg | 103.0 N |

v4 Tier I was 5 real slicer weights (printed shell 4.606 kg): Chassis 712.82, Chassis Cap 89.79,
Wedge 325.83 ×6, Wedge Bottom 181.21 ×6, Wedge Cap 126.86 ×6. v4 foam (2 lb/ft³, 4.637 L cavity
per module) = 890.3 g across 6 modules.

### v4 displacement, buoyancy, freeboard

| Quantity | v4 value |
|---|---|
| `V_disp,total` | 38.912 L |
| Max buoyant force `F_B,max` | 391.3 N (39.9 kgf) |
| Net reserve buoyancy (nominal) | 308.9 N (31.5 kgf) |
| `F_B,max / W_nom` | 4.75 |
| Nominal draft `T` | 2.69 in / 68.3 mm |
| Freeboard to wedge top (`10 − T`) | 7.31 in / 185.7 mm |
| Freeboard to buoy top (`12 − T`) | 9.31 in / 236.5 mm |
| Parallel float section wetted | 8.6% |
| Foam-alone buoyancy (shell gone), all 6 | 271.0 N (27.6 kgf) |

### v4 failure cases

- **Flooded chassis:** draft 2.69 → ~3.3 in, freeboard to wedge top 7.31 → ~6.7 in, reserve
  261.8 N.
- **One wedge lost:** draft 2.69 → ~2.79 in, freeboard to wedge top 7.31 → ~7.21 in; asymmetric
  60° gap → static list.

### v4 verification

Built and verified 2026-08-29 with a full multi-agent pass: 3 independent derivations → reconcile
→ 2 adversarial math+physics checks → 2 auditors (math, house-style). [PR #113](https://github.com/David-Chousal/S.C.O.U.T./pull/113).

### v4 → v5 delta summary

| Quantity | v4 | v5 | Δ |
|---|---:|---:|---:|
| Nominal all-up mass | 8.40 kg | 7.59 kg | −0.81 kg |
| `V_disp,total` | 38.91 L | 28.48 L | −10.43 L |
| Max buoyant force | 391 N | 286 N | −105 N |
| Net reserve (nominal) | 309 N | 212 N | −97 N |
| Reserve ratio | 4.75× | 3.84× | −0.91× |
| Nominal draft | 2.69 in | 2.50 in | −0.19 in |
| Freeboard to wedge top | 7.31 in | 5.00 in | −2.31 in |
| Float section wetted | 8.6% | 9.1% | +0.5 pt |

The conclusion — **substantially over-floated, waterline/CG is the real design problem, not
flotation** — survives the resize unchanged.
