# Buoy Mass, Displacement, and Freeboard Model

> **Summary** — Whole-buoy synthesis: the complete as-deployed mass budget, the foam-filled
> flotation-wedge treatment the team asked for, fully-submerged displacement and reserve
> buoyancy for the assembled buoy, and the **floating-equilibrium freeboard model** (draft,
> waterline, freeboard, immersed fraction) with a mass-sensitivity sweep and the two panel-review
> failure cases (flooded chassis, one wedge lost). This document *consumes* the printed-shell
> sub-budget in [`mass-and-buoyancy-budget.md`](mass-and-buoyancy-budget.md) (the five real
> slicer weights, the per-part cavity and displacement volumes) and the Rev A component
> dimensions in [`../electronics-housing-packing-budget.md`](../electronics-housing-packing-budget.md),
> and it feeds the statics equations in
> [`structural-load-framework.md`](structural-load-framework.md) / [`force-budget.md`](force-budget.md).
> It does **not** cover CG / CB / metacentric height / righting — that is stability work
> ([SCO-80](https://linear.app/scout1/issue/SCO-80)), explicitly out of scope here. This is
> buoyancy and freeboard only.
>
> **Source drawings** — `chassis-floatation-bolted-v4-{wedge,wedge-cap,wedge-bottom,chassis,
> chassis-cap}.pdf` (John Ryan, 2026-08-22), in
> [`mechanical/cad/floatation/current/`](../../../mechanical/cad/floatation/current/).
> **Source weigh-in** — full five-part slicer weigh-in, 2026-08-24, in
> [`mechanical/test/print-weight-verification-2026-08-24.md`](../../../mechanical/test/print-weight-verification-2026-08-24.md).
> **Design basis** — [`../reviews/buoy-preliminary-design-panel-review-2026-08.md`](../reviews/buoy-preliminary-design-panel-review-2026-08.md)
> (fastener counts §3, failure-mode intent §5, open data §11).
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

1. **A printed part is re-weighed** → update [`mass-and-buoyancy-budget.md`](mass-and-buoyancy-budget.md)
   first (it is the living sub-budget), then re-run [§3](#3-full-mass-budget) Tier I and every
   total below it.
2. **SCO-70 lands** (real electronics list, real housing spec, real solar panel/mount, real
   stem/pod) → move those line items from Tier III / Tier II into Tier I with `[M]` tags and
   real masses, then re-solve [§7](#7-freeboard-model) and re-generate the [§8](#8-sensitivity-table)
   sweep. The nominal total mass is the input the freeboard model is most sensitive to.
3. **A foam product is chosen** → replace the `0.032 g/cm³` placeholder in [§2](#2-constants),
   re-run [§4](#4-foam-fill), update [`facts.md`](../../hub/facts.md).
4. **The vertical stack assumption ([§1](#1-scope-datum-and-the-single-biggest-geometric-assumption))
   is confirmed or corrected against the v4 assembly drawing** → this is the single largest
   modeling assumption; if the taper-zone height or the wedge-top elevation changes, re-derive
   the piecewise `V_disp(T)` in [§7.2](#72-displaced-volume-as-a-function-of-draft).
5. If any change moves the reserve-buoyancy or "over-floated" conclusion, log it in
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

Unit constants used throughout: **1 in = 0.0254 m [X]**, **1 in³ = 16.387064 cm³ [X]**,
**1 L = 61.023744 in³ [X]**, **1 kgf = 9.81 N [X]**, **1 lbf = 4.448222 N [X]**,
**1 N = 0.2248089 lbf [X]**.

---

## 1. Scope, datum, and the single biggest geometric assumption

**Geometry (all confirmed against the v4 dimensioned drawings, 2026-08-22):** the buoy is a
central sealed chassis cylinder with **six 60° flotation wedges** bolted around it; each wedge
carries a tapered **wedge bottom** (impact cap) beneath it and a thin **wedge cap** sealing its
top. Outer radius `R_outer = 9.000 in` → **outer diameter = 18.000 in** [M] (this settles the
"18 in vs 36 in" radius/diameter ambiguity flagged in the panel review §11 — the drawings give
radius 9.000 in directly). Inner radius `R_inner = 2.875 in` = chassis rim OD (Ø5.750) ÷ 2 [M].

**Keel datum:** `z = 0` at the **chassis bottom = the bottom of the wedge-bottom taper**. Draft
`T` is measured upward from `z = 0` (depth of the waterline below the keel).

**Vertical stack used by the freeboard model** — this is **the single biggest geometric
assumption in the whole model**, accepted from the drawing-alignment brief; alternative
alignments (e.g. wedge top flush with chassis top) are defensible from the drawings and would
shift the draft solution by up to ~0.4 in:

| `z` range (in) | Section | Cross-section presented to the water |
|---|---|---|
| 0.0 – 2.0 | wedge-bottom taper zone | 6 downward-narrowing frustums + Ø5.750 chassis core |
| 2.0 – 10.0 | **parallel 18-in float section** (the waterplane body) | full Ø18.000 in disc (6 foam wedges tile the R2.875–R9.000 annulus; chassis fills the inner disc) |
| 10.0 – 11.0 | chassis stub only | Ø5.750 in |
| 11.0 – ~12.0 | chassis cap + solar-mount standoffs | small, always above the waterline |
| ~12.5 – ~14 | solar panel on its 4-arm printed mount | above the buoy body |

This alignment is *conservative* for the reported "freeboard to wedge top" number because it
places the wedge top 1 in below the chassis top. If the v4 assembly elevation dimensions the
taper zone at 1.000 in rather than 2.000 in (the wedge-bottom drawing is flagged low-confidence
in [`mass-and-buoyancy-budget.md` §5](mass-and-buoyancy-budget.md#5-wedge-bottom)), the parallel
section starts at `z ≈ 1` and the nominal draft shifts to ~2.3 in — **the over-floated
conclusion does not change** in any of these variants.

---

## 2. Constants

| Quantity | Value | Tag |
|---|---|---|
| PETG density `ρ_PETG` | 1.27 g/cm³ | [L] |
| Seawater density `ρ_sw` | 1.025 g/cm³ = 1025 kg/m³ | [L] |
| Gravitational acceleration `g` | 9.81 m/s² | [L] |
| Flotation foam density `ρ_foam` | **0.032 g/cm³** (2 lb/ft³, generic closed-cell 2-part marine PU) | **[A] — placeholder, no product chosen** (panel review §11) |
| Foam density, sensitivity | 0.064 g/cm³ (4 lb/ft³) | [A] |
| Stainless 316 density `ρ_SS316` | 7.98 g/cm³ | [L] |
| Cable jacket density `ρ_jacket` | ~1.4 g/cm³ (PVC/PUR jacket) | [A] |
| Sector angle per wedge | 60° = π/3 rad | [X] — 6 wedges tile 360° |
| `R_outer` | 9.000 in | [M] |
| `R_inner` (chassis interface) | 2.875 in | [M] |
| Chassis height | 11.000 in | [M] |
| Chassis OD | 5.750 in (Ø5.750) | [M] |
| Wedge shell height | 8.000 in | [M] |
| Wedge-bottom taper height | ~2.000 in | [M], low confidence |

---

## 3. Full mass budget

Organized in three tiers by confidence. Every uncertain line carries **low / nominal / high**.
All masses in grams unless noted. `Total = Tier I + Tier II + Tier III`.

### Tier I — measured / near-certain

The five printed parts are physical slicer-scale measurements from the 2026-08-24 full weigh-in
(**Model** weight only, sacrificial support excluded), carried verbatim from
[`mass-and-buoyancy-budget.md`](mass-and-buoyancy-budget.md) §§3–8.

| Item | Unit (g) | Qty | Line (g) | Tag | Basis |
|---|---:|---:|---:|:--:|---|
| Chassis (printed shell) | 712.82 | 1 | 712.82 | [M] | slicer 2026-08-24, 235.20 m model filament |
| Chassis Cap (printed) | 89.79 | 1 | 89.79 | [M] | slicer 2026-08-24, 29.63 m |
| Wedge shell (printed) | 325.83 | 6 | 1954.98 | [M] | slicer 2026-08-24, 107.51 m (see wedge-weight sensitivity below) |
| Wedge Bottom (printed) | 181.21 | 6 | 1087.26 | [M] | slicer 2026-08-24, 59.79 m |
| Wedge Cap (printed) | 126.86 | 6 | 761.16 | [M] | slicer 2026-08-24, 41.86 m model |
| **Printed shell subtotal** | | | **4606.01** | [M] | `712.82 + 89.79 + 6·325.83 + 6·181.21 + 6·126.86` |
| Feather M0 + RFM95 (Adafruit 3178) | 5.8 | 1 | 5.8 | [M] | datasheet p.7; `hardware/datasheets/adafruit-feather-m0-radio-with-lora-radio-module.pdf` |
| **Tier I TOTAL** | | | **4611.81** | | ≈ **4.612 kg** |

Printed-shell arithmetic, in full:
```
Chassis      712.82 × 1 =  712.82
Chassis Cap   89.79 × 1 =   89.79
Wedge        325.83 × 6 = 1954.98
Wedge Bottom 181.21 × 6 = 1087.26
Wedge Cap    126.86 × 6 =  761.16
                          --------
                          4606.01 g = 4.60601 kg   [M]
```

> **Cross-check against the existing doc.** [`mass-and-buoyancy-budget.md` §9](mass-and-buoyancy-budget.md#9-aggregate--printed-shell-system)
> reports **5.494 kg** for the "whole shell system". That figure is **printed shell (4.606 kg) +
> the ~0.888 kg of foam fill folded into its wedge-module rows** — it is the *foam-filled shell,
> zero payload* case, not a bare shell. Its "+337.6 N net reserve" is likewise the foam-filled,
> zero-payload number. This document keeps printed shell (`[M]`, 4.606 kg) and foam (`[A]`,
> [§4](#4-foam-fill)) as separate line items so the payload build-up is explicit.

> **Wedge-weight sensitivity (carried, not re-litigated).** The Wedge was measured at
> **474.58 g** on 2026-08-21 and **325.83 g** on 2026-08-24 on the same nominal spec — ~31%
> apart, unreconciled (see [`mass-and-buoyancy-budget.md` §2](mass-and-buoyancy-budget.md#2-calibration-against-the-one-real-data-point--retired-2026-08-24)).
> The primary figure is **325.83 g** (most recent, per the living-doc convention). Substituting
> 474.58 g adds `6 × (474.58 − 325.83) = 6 × 148.75 = +892.5 g`, raising the printed shell to
> **5.499 kg** and every total below by ~0.89 kg. (The existing doc's 5.494 kg whole-shell figure
> is *not* this case — it is printed shell 4.606 kg at the 325.83 g wedge + 0.888 kg folded-in
> foam.)

### Tier II — estimated from repo data (a basis exists; the value is not yet measured)

| Item | Low | Nom | High | Tag | Basis |
|---|---:|---:|---:|:--:|---|
| Flotation foam, all 6 wedge modules (2 lb/ft³) | 890.3 | 890.3 | 890.3 | [A] | `6 × 4.637 L cavity × 0.032 g/cm³` — [§4](#4-foam-fill). Held constant across the mass columns; the density question is a separate sensitivity line (+0.89 kg at 4 lb/ft³) |
| Adalogger FeatherWing (Adafruit 2922) | 5 | 6 | 8 | [A] | ≈ same PCB as the Feather (5.8 g) + microSD socket + RTC crystal |
| Stacking headers (2 sets) + board misc | 3 | 5 | 6 | [A] | typical Feather stacking hardware |
| Charger/boost board (Adafruit PID 6106) | 8 | 12 | 15 | [A] | packing budget §1 assumes a ~51×25×10 mm board; only the bare-chip datasheet is in the repo (SCO-88) |
| SEN0189 turbidity adapter board | 12 | 17 | 22 | [A] | 38×28×10 mm measured board envelope (datasheet p.2); mass scaled from size |
| Internal wiring, 10k/20k divider, JST/connectors | 20 | 40 | 47 | [A] | packing-budget §1 "absorbed in margin" small parts |
| Chassis bottom end cap (printed, no-port) | 40 | 90 | 110 | [A] | `mechanical/cad/electronics-housing/electronics-housing-endcap-no-port.step` — the v4 chassis drawing set closes only the top; a printed bottom closure is assumed needed. Low bound = chassis closed by the drawing set (no separate part) |
| Solar mount (printed PETG, 4-arm bracket + central ring) | 200 | 320 | 450 | [A] | print family; ~3–4× the chassis-cap print mass |
| Fasteners: ~75 M4 SS bolts + washers/nuts + ~60 brass heat-set inserts | 150 | 210 | 300 | [A] | panel review §3: 9 bolts/module × 6 = 54, + chassis-cap (~6–8) + endcap (~6–8) + U-bolt nuts. Nominal `= (75 × 2.0) + (60 × 1.0) = 210` |
| Epoxy / adhesive (wedge-cap bonds, insert potting, U-bolt leg seal) | 80 | 130 | 200 | [A] | cured-mass estimate, panel review sealing scope |
| Antifouling film (Sea Hawk Smart Solution) + 2-part epoxy seal coat | 90 | 200 | 350 | [A] | cured film over ~0.7 m² of hull exterior |
| Cabling (hydrophone + sensor-string conductors) | 60 | 100 | 140 | [A] | 1–3 m at 20–35 g/m; mostly along the stem |
| **Tier II TOTAL** | **1558.3** | **2020.3** | **2538.3** | | ≈ **2.02 kg** nominal |

### Tier III — genuinely open placeholders (blocked on SCO-70 / ADR-0002 / unspecified parts)

| Item | Low | Nom | High | Tag | Basis |
|---|---:|---:|---:|:--:|---|
| Deployment battery, LiFePO₄ | 40 | 250 | 600 | [A] | **Real gap.** Final sizing pending the measured power budget (ADR-0002). EDD daily energy ~0.01 Wh/day is tiny; range = one 18650 LiFePO₄ (~40 g) to a small pack (~600 g). The Rev A 500 mAh LiPo (~10 g) is a bring-up stand-in, not deployment |
| Solar panel (marine, 5–20 W) | 300 | 700 | 1500 | [A] | not specified. Small semi-flexible (~300 g) to rigid framed 10–20 W (~1500 g) |
| Sensor stem (printed PETG, hex-socket top + perforated cylindrical body) | 250 | 400 | 600 | [A] | printed part, hangs just below the buoy. Air mass here; submerged net load handled in [§6](#6-submerged-appendages) |
| Sensor pod / turbidity housing (printed, dry + flood chamber) | 150 | 200 | 300 | [A] | printed part; submerged, flood chamber water-filled |
| Mooring hardware on the buoy (SS 316 U-bolt + backing plate + nuts) | 150 | 220 | 350 | [A] | through-bolted at the chassis bottom (panel review Action A1); at/near the keel |
| **Tier III TOTAL** | **890** | **1770** | **3350** | | ≈ **1.77 kg** nominal (`40+300+250+150+150` low, `600+1500+600+300+350` high) |

### Grand total

| Scenario | Tier I | Tier II | Tier III | **TOTAL mass** | **Weight `W = m·g`** |
|---|---:|---:|---:|---:|---:|
| **Low** | 4611.8 | 1558.3 | 890 | **7060 g ≈ 7.06 kg** | **69.3 N** (7.06 kgf / 15.6 lbf) |
| **Nominal** | 4611.8 | 2020.3 | 1770 | **8402 g ≈ 8.40 kg** | **82.4 N** (8.40 kgf / 18.5 lbf) |
| **High** | 4611.8 | 2538.3 | 3350 | **10500 g ≈ 10.50 kg** | **103.0 N** (10.50 kgf / 23.2 lbf) |

```
Nominal: 4611.8 + 2020.3 + 1770.0 = 8402.1 g  →  8.40 kg
W_nom = 8.402 kg × 9.81 m/s² = 82.42 N
```

Nominal composition: printed shell **4.606 kg (54.8%)**, foam **0.890 kg (10.6%)**, everything
else **2.906 kg (34.6%)**. The two widest single uncertainty bands in "everything else" are the
**solar panel** (0.30–1.50 kg) and the **battery** (0.04–0.60 kg) — together they account for
~1.8 kg of the ~3.5 kg low→high spread and both are blocked on decisions not yet made.

**Combined-sensitivity excursions** (all still inside the 6–14 kg freeboard sweep of [§8](#8-sensitivity-table)):

| Case | Total mass |
|---|---:|
| Nominal | 8.40 kg |
| Nominal + Wedge at 474.58 g | 9.29 kg |
| Nominal + foam at 4 lb/ft³ | 9.29 kg |
| Nominal + both | `8.402 + 0.892 + 0.890 = ` **10.18 kg** |
| High estimate + both sensitivities | ≈ 12.3 kg |

---

## 4. Foam fill

Per the explicit instruction: **for the mass budget, all six wedge modules are completely full
of flotation foam** = wedge-shell cavity + wedge-bottom cavity (foam poured into the assembled
wedge + wedge-bottom, no dividing floor).

### 4.1 Cavity volume per module — sanity-checked (envelope − wall)

**Wedge shell.** Outer envelope (annular sector), `R_o = 9.000`, `R_i = 2.875`, `h = 8.000`,
`θ = π/3`:
```
V_env = 0.5 · θ · (R_o² − R_i²) · h
      = 0.5 · (π/3) · (9.000² − 2.875²) · 8.000
      = 0.5 · 1.0471976 · (81.000000 − 8.265625) · 8.000
      = 0.5 · 1.0471976 · 72.734375 · 8.000
      = 304.67 in³
      = 304.67 × 16.387064 = 4992.6 cm³ = 4.9926 L     [X from M]
```
(Brief A rounds this to 304.8 in³ / 4.996 L; the precise value 304.67 in³ / 4.993 L is used
everywhere below.)

Wall material — thin-shell approximation, outer curved wall + inner curved wall + 2 flat radial
faces, each × wall thickness `t = 0.250 in` [M]:
```
outer curved:  (R_o · θ) · h · t = (9.000 · 1.0471976) · 8.000 · 0.250 = 18.85 in³
inner curved:  (R_i · θ) · h · t = (2.875 · 1.0471976) · 8.000 · 0.250 =  6.02 in³
2 radial faces: 2 · [(R_o − R_i) · h] · t = 2 · (6.125 · 8.000) · 0.250 = 24.50 in³
wall total = 18.85 + 6.02 + 24.50 = 49.37 in³ = 809 cm³     [A — depends on the 0.250 in reading]

Cavity_wedge = 304.67 − 49.37 = 255.30 in³ = 4183 cm³ ≈ 4.185 L     [A]   ✓ matches mass-and-buoyancy-budget.md §3
```

**Wedge bottom** (lower confidence — the drawing's stacked radii likely encode stepped internal
features this frustum model does not capture). Displacement envelope as an annular-sector
frustum, `h = 2.000 in`, top sector area `A₁`, base sector area `A₂ ≈ 0.20·A₁` [A]:
```
A₁ = 0.5 · (π/3) · (R_o² − R_i²) = 0.5 · 1.0471976 · (81.000000 − 8.265625) = 38.08 in²
     (R_i taken as 2.875 in, consistent with the wedge envelope above)
A₂ ≈ 0.20 · 38.08 = 7.62 in²     [A — genuinely a guess]

V_env = (h/3) · (A₁ + A₂ + √(A₁·A₂))
      = (2.000/3) · (38.08 + 7.62 + √(38.08 · 7.62))
      = 0.66667 · (38.08 + 7.62 + √290.17)
      = 0.66667 · (38.08 + 7.62 + 17.03)
      = 0.66667 · 62.73 = 41.82 in³ = 685.3 cm³ ≈ 0.686 L     [A]   ✓ matches mass-and-buoyancy-budget.md §5

wall material ≈ 234 cm³ [A, scaled from the wedge's per-height wall area]
Cavity_wb = 685.3 − 234 = 451 cm³ ≈ 0.452 L     [A]
```

> The alternative frustum takeoffs run 0.69–0.96 L for the wedge-bottom *displacement* depending
> on the assumed base area and taper model. The living doc's **0.686 L/ea** is adopted here for
> consistency with `facts.md` and the printed-shell sub-budget; the reconciliation of the three
> independent models converged on it as the mid-range value. If the taper height is 1.000 in
> rather than 2.000 in, both the displacement and the cavity roughly halve.

```
Cavity per module = Cavity_wedge + Cavity_wb = 4.185 + 0.452 = 4.637 L = 4637 cm³     [A]
```

### 4.2 Foam fill volume and mass

```
ρ_foam (2 lb/ft³) = (2 × 453.592 g) / (28316.85 cm³) = 907.185 / 28316.85 = 0.032037 g/cm³  ≈ 0.032

foam per module = V_cavity · ρ_foam = 4637 cm³ × 0.032037 g/cm³ = 148.55 g
                  (using the round 0.032: 4637 × 0.032 = 148.38 g)
all 6 modules   = 148.38 g × 6 = 890.3 g ≈ 0.890 kg     [A]
total foam volume = 4.637 L × 6 = 27.82 L
```

| Scenario | `ρ_foam` | Foam / module | **Foam × 6** |
|---|---:|---:|---:|
| **Nominal (2 lb/ft³)** | 0.032 g/cm³ | 148.38 g | **890.3 g** |
| **Sensitivity (4 lb/ft³)** | 0.064 g/cm³ | `4637 × 0.064 = 296.77 g` | **1780.6 g** (+890.3 g) |

Foam mass is held **constant** across the low/nominal/high mass columns of [§3](#3-full-mass-budget);
the density question is the separate sensitivity line above.

Closed-cell foam **does not absorb water**, so a foam-filled wedge module displaces its **full
outer envelope** (`4.993 + 0.686 = 5.679 L` per module) regardless of shell cracks — this is
what makes the foam load-bearing for the failure philosophy.

### 4.3 Failure-mode number — buoyancy of the foam ALONE (printed shell entirely gone)

If every PETG shell is cracked, punctured, or dissolved away and only the six foam cores remain
in seawater, Archimedes still applies to the foam blocks:
```
F_B,foam (per module) = ρ_sw · g · V_cavity − (m_foam · g)
                      = (1025 kg/m³ × 9.81 m/s² × 0.004637 m³) − (0.14838 kg × 9.81 m/s²)
                      = 46.63 N − 1.46 N
                      = 45.17 N net upward per module     (≈ 4.60 kgf / 10.2 lbf)

All 6 modules, foam alone = 45.17 × 6 = 271.0 N     (≈ 27.6 kgf / 60.9 lbf) net upward
```
4 lb/ft³ variant: `46.63 − (0.29677 × 9.81) = 46.63 − 2.91 = 43.72 N/module → 262.3 N` for six.

This is the quantified answer to the panel review's "a cracked wedge shell must retain useful
buoyancy" intent ([SCO-81](https://linear.app/scout1/issue/SCO-81)): with every printed shell
gone, the foam alone still lifts **~27.6 kgf — more than 3× the entire nominal 8.4 kg all-up
mass**. Matches [`mass-and-buoyancy-budget.md` §6](mass-and-buoyancy-budget.md#6-foam-fill-wedge--wedge-bottom-cavities)
(45.2 N / 271.2 N).

---

## 5. Whole-buoy displacement and buoyancy

```
F_B = ρ_sw · g · V_disp     [X]  (Archimedes)
W   = m · g                 [X]
ρ_sw = 1025 kg/m³ [L] ;  g = 9.81 m/s² [L]
```

### 5.1 Fully-submerged displaced volume of the assembled buoy

Every foam-filled, sealed, or solid element that displaces water when the buoy is pushed fully
under:

| Element | Each | Qty | Volume (L) | Tag | Derivation |
|---|---:|---:|---:|:--:|---|
| Wedge shell outer envelope (foam-filled → displaces full envelope) | 4.9926 L | 6 | 29.956 | [X from M] | `0.5·(π/3)·(9.000²−2.875²)·8.000 = 304.67 in³` each |
| Wedge Bottom (frustum displacement, foam-filled) | 0.686 L | 6 | 4.116 | [A] | annular-sector frustum, `h = 2.0 in`, from [§4.1](#41-cavity-volume-per-module--sanity-checked-envelope--wall) |
| Chassis (O-ring sealed; air + electronics inside → displaces full envelope) | 4.6808 L | 1 | 4.681 | [X from M] | `π · 2.875² · 11.000 = 285.64 in³` |
| Chassis Cap | 0.1596 L | 1 | 0.160 | [A] | `π · 2.875² · 0.375 = 9.74 in³` (0.375 in avg thickness) |
| Wedge Caps | folded into the wedge envelope (Task A permits treating displacement as negligible / included) | 6 | 0 | [A] | thin curved lids; ride above the waterline when floating anyway |
| **`V_disp,total`** | | | **38.912** | | `= 0.038912 m³` |

```
29.956 + 4.116 + 4.681 + 0.160 = 38.912 L     [X from M + A]
```
(The existing [`mass-and-buoyancy-budget.md` §9](mass-and-buoyancy-budget.md#9-aggregate--printed-shell-system)
gives 38.93 L — the 0.02 L difference is entirely the brief's rounded 4.996 L wedge envelope vs
the precise 4.9926 L used here.)

### 5.2 Maximum buoyant force (buoy fully submerged)

```
F_B,max = ρ_sw · g · V_disp,total
        = 1025 kg/m³ × 9.81 m/s² × 0.038912 m³
        = 10055.25 × 0.038912
        = 391.3 N
        = 391.3 / 9.81      = 39.9 kgf
        = 391.3 × 0.2248089 = 88.0 lbf
```

### 5.3 Net reserve buoyancy

```
Net reserve = F_B,max − W_total

Low mass   (7.06 kg):  W = 69.26 N  →  reserve = 391.3 − 69.3  = 322.0 N  (32.8 kgf / 72.4 lbf)
Nominal    (8.40 kg):  W = 82.42 N  →  reserve = 391.3 − 82.4  = 308.9 N  (31.5 kgf / 69.4 lbf)
High mass  (10.50 kg): W = 103.0 N  →  reserve = 391.3 − 103.0 = 288.3 N  (29.4 kgf / 64.8 lbf)
```

`F_B,max / W_nom = 391.3 / 82.4 = 4.75` — **the fully-submerged hull can support 4.75× the
entire nominal deployed weight.** ~79% of the hull's displaced volume is unused reserve at
nominal mass.

### 5.4 Reference cases (zero payload)

| Case | `W` | Reserve = `F_B,max − W` | Note |
|---|---:|---:|---|
| Foam-filled shell, no payload | `(4.606 + 0.890)·9.81 = 53.92 N` | **+337.4 N** | `mass-and-buoyancy-budget.md` §9 reports **+337.6 N** for the same case; the 0.2 N difference is the 391.3 vs 391.47 N rounding of `V_disp` |
| True bare shell, cavities sealed/air-filled, no foam | `4.606·9.81 = 45.19 N` | **+346.1 N** | |
| Bare shell, wedges open and flooded, **chassis still sealed** | `4.606·9.81 = 45.19 N` | ≈ **+33.6 N** | displacement collapses to the chassis+cap envelope (4.841 L) + PETG wall material (`3803 g / 1.27 = 2.99 L`) ≈ 7.84 L → `F_B ≈ 1025·9.81·0.00784 = 78.8 N`. Still positive with modest margin — the foam fill is what turns this thin margin into the ~+337 N of the foam-filled case above |
| Bare shell, wedges **and** chassis flooded | `4.606·9.81 = 45.19 N` | ≈ **−8.7 N** (sinks) | `V_disp = 4606 g / 1.27 = 3.63 L → F_B = 36.5 N < W`. The chassis O-ring seal is the single line between "floats on shell alone" and "sinks" once foam is discounted |

---

## 6. Submerged appendages

The **sensor stem, sensor pod, mooring hardware, and the external run of cabling** hang *below*
the hull. Their effect on the floating hull is `(weight − own displacement)`, applied as a
**downward point load** in the equilibrium — **not** added to the hull's displacement (that
would double-count).

| Appendage | Air mass (g, nom) | Method | Net downward (g) | Net (N) | Displacement credit (g) |
|---|---:|---|---:|---:|---:|
| Sensor stem | 400 | **[A]** perforated/flooded, modelled at **0.60 × air weight** net-down; conservative versus a solid-PETG estimate (`1 − ρ_sw/ρ_PETG = 1 − 0.807 = 0.19 ×`), chosen pending a stem solid-volume takeoff | 240.0 | 2.354 | 160.0 |
| Sensor pod | 200 | **[A]** flood chamber water-filled → near-neutral, **0.30 × air weight** net-down | 60.0 | 0.589 | 140.0 |
| Mooring U-bolt + backing plate | 220 | weight − SS316 displacement: `V = 220 / 7.98 = 27.6 cm³ → 28.3 g` | 191.7 | 1.881 | 28.3 |
| External cabling (~60 g of the 100 g run) | 60 | weight − jacket displacement (`ρ_jacket ≈ 1.4 g/cm³ → ~44 cm³ → 44 g`) | 16.0 | 0.157 | 44.0 |
| **Totals** | **880** | | **507.7** | **4.98** | **372.3** |

```
appendage displacement credit = 880 − 507.7 = 372.3 g ≈ 0.372 kg
waterplane-supported load (nominal) = m_total − 0.372 kg = 8.402 − 0.372 = 8.030 kg
```

This 0.372 kg credit is the only place appendages enter the freeboard solve. A **zero-credit**
variant (appendages given no displacement at all) is carried alongside every result and shifts
the nominal draft by only +0.09 in — immaterial against ~7 in of freeboard.

---

## 7. Freeboard model

Floating equilibrium: **weight of displaced seawater = total weight**, with the submerged
appendages resolved as the net downward load from [§6](#6-submerged-appendages). Unknown = draft
`T` (waterline height above the keel datum `z = 0`).

### 7.1 Waterplane area (parallel zone)

The six foam-filled wedges tile the full R2.875–R9.000 annulus and the chassis fills the inner
disc, so the waterplane in the parallel zone is a **solid 18-in circle**:
```
A_wp = π · R_outer²
     = π · (9.000 in)²  = π · 81.000 = 254.47 in²
     = π · (9.000 × 0.0254 m)²  = π · (0.2286)²  = π · 0.05225796 = 0.16417 m²
check: 254.47 in² × 6.4516 cm²/in² = 1641.7 cm² = 0.16417 m²   ✓

displaced volume per inch of parallel draft:
  254.47 in³ = 254.47 / 61.023744 = 4.170 L/in     (= 0.004170 m³/in)
```

### 7.2 Displaced volume as a function of draft

Chassis core area at any `z ≥ 0`: `A_chassis = π · 2.875² = 25.97 in²`.

**Taper zone, `0 ≤ T ≤ 2.0 in`** — chassis core cylinder + the 6 tapering wedge bottoms. The
wedge-bottom ring area grows from a small keel value to the full annulus at `z = 2`; modelled
**[A]** so that (a) it reaches the full R2.875–R9.000 annulus (`6 × 38.08 = 228.5 in²`) at
`z = 2 in` and (b) it integrates to the `4.116 L` full taper-zone wedge-bottom displacement from
[§5.1](#51-fully-submerged-displaced-volume-of-the-assembled-buoy). The implied keel-plane ring
area (~22.7 in² total) is smaller than a naive `6 × A₂ = 45.7 in²` because sector area varies
with the square of radius, not linearly with height:
```
V_disp(T) = A_chassis · T + V_wb,ring(0 → T)

full taper zone at T = 2.0 in:
  V_disp(2.0) = (25.97 in² · 2.0 in) + 4.116 L-equivalent
              = 51.94 in³ + 251.2 in³
              = 303.1 in³ = 4.967 L
              = 0.851 L (chassis lower 2 in) + 4.116 L (6 wedge bottoms)
```

**Parallel zone, `2.0 in < T ≤ 10.0 in`:**
```
V_disp(T) = 4.967 L + A_wp · (T − 2.0 in)
          = 4.967 + 4.170 · (T − 2.0)          [L, T in inches]

check at T = 10:  4.967 + 4.170 · 8 = 4.967 + 33.36 = 38.33 L
                  + chassis stub z=10→11 (25.97 in³ = 0.426 L) + chassis cap (0.160 L)
                  = 38.91 L = V_disp,total   ✓
```

### 7.3 Equilibrium solve at nominal mass

```
waterplane-supported load = m_total − appendage displacement credit = 8.402 − 0.372 = 8.030 kg
required displaced volume  V_req = 8.030 kg / 1.025 kg/L = 7.834 L

7.834 L  >  4.967 L (full taper zone)   →   solution lands in the PARALLEL zone

7.834 = 4.967 + 4.170 · (T − 2.0)
(7.834 − 4.967) / 4.170 = 2.867 / 4.170 = 0.688 in
T = 2.0 + 0.688 = 2.688 in  ≈  2.69 in  =  68.3 mm
```
Zero-credit variant: `V_req = 8.402 / 1.025 = 8.197 L → T = 2.0 + (8.197 − 4.967)/4.170 = 2.77 in`
(+0.09 in). The 2.69 in value is carried forward.

### 7.4 Freeboard results (nominal, all from the keel datum `z = 0`)

Every value in this table, in [§8](#8-sensitivity-table), and in [§9](#9-failure-mode-freeboard-panel-review-action-a3)
is a derived output tagged **[X from M+A]** — exact given the geometry, the [§1](#1-scope-datum-and-the-single-biggest-geometric-assumption)
vertical-stack assumption, and the [§6](#6-submerged-appendages) 0.372 kg appendage credit.

| Quantity | Value |
|---|---|
| **Draft `T`** | **2.69 in / 68.3 mm** |
| Waterline elevation | `z = 2.69 in` |
| Zone the solution lands in | parallel 18-in float section, 0.69 in above the taper break |
| **Freeboard to top of the 18-in float section** (`z = 10`): `10 − T` | **7.31 in / 185.7 mm** |
| Freeboard to top of the buoy body / chassis cap (`z ≈ 12`): `12 − T` | **9.31 in / 236.5 mm** |
| Parallel 18-in float section (`z = 2→10`, 8 in tall) — submerged fraction: `(T − 2)/8` | **0.086 → 8.6% wetted, 91.4% exposed** |
| Whole flotation body (`z = 0→10`, 10 in) — submerged fraction: `T/10` | **0.27** |
| Total buoy body height (`z = 0→12`, 12 in) — immersed fraction: `T/12` | **0.22** |

---

## 8. Sensitivity table — draft and freeboard vs total mass

`V_req = (m_total − 0.372) / 1.025` ; `T = 2.0 + (V_req − 4.967) / 4.170`. Appendage displacement
credit held at 0.372 kg [A]. All solutions land in the parallel zone.

| `m_total` (kg) | `m_eff` (kg) | `V_req` (L) | Draft `T` (in / mm) | FB to wedge top `10−T` (in / mm) | FB to buoy top `12−T` (in) | Parallel section immersed | Buoy-height immersed |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 6 | 5.63 | 5.49 | 2.13 / 54.0 | 7.88 / 200 | 9.88 | 1.6% | 17.7% |
| 7 | 6.63 | 6.47 | 2.36 / 59.9 | 7.64 / 194 | 9.64 | 4.5% | 19.7% |
| 8 | 7.63 | 7.44 | 2.59 / 65.9 | 7.41 / 188 | 9.41 | 7.4% | 21.6% |
| **8.40 (nom)** | **8.03** | **7.83** | **2.69 / 68.3** | **7.31 / 186** | **9.31** | **8.6%** | **22.4%** |
| 9 | 8.63 | 8.42 | 2.83 / 71.8 | 7.17 / 182 | 9.17 | 10.4% | 23.6% |
| 10 | 9.63 | 9.39 | 3.06 / 77.8 | 6.94 / 176 | 8.94 | 13.3% | 25.5% |
| 11 | 10.63 | 10.37 | 3.30 / 83.7 | 6.70 / 170 | 8.70 | 16.2% | 27.5% |
| 12 | 11.63 | 11.34 | 3.53 / 89.7 | 6.47 / 164 | 8.47 | 19.1% | 29.4% |
| 13 | 12.63 | 12.32 | 3.76 / 95.6 | 6.24 / 158 | 8.24 | 22.0% | 31.4% |
| 14 | 13.63 | 13.30 | 4.00 / 101.6 | 6.00 / 152 | 8.00 | 25.0% | 33.3% |

Across the **entire** 6–14 kg range the draft moves only ~1.9 in, the buoy never immerses more
than a quarter of its 18-in float section, and freeboard to the wedge top never drops below 6 in.

---

## 9. Failure-mode freeboard (panel review Action A3)

Worked changes in draft and freeboard for the two credible casualties. Both hold the nominal
8.40 kg build and the 0.372 kg appendage credit.

### 9.1 Flooded chassis (O-ring seal or gland fails)

The chassis stops contributing displacement, and water enters it up to the external waterline.
```
lost hull displacement       = 4.681 L      →  F_B,max drops to 1025·9.81·(0.038912 − 0.004681)
                                             = 1025·9.81·0.034231 = 344.2 N
reserve still = 344.2 − 82.4 = 261.8 N (26.7 kgf) — buoy still floats with large margin

freeboard solve, chassis giving zero displacement:
  taper-zone full      = 6 wedge bottoms only = 4.116 L   (chassis 0.851 L term removed)
  parallel-zone rate   = (254.47 − 25.97) in³/in = 228.50 in³/in = 3.745 L/in
  entrained water in the chassis up to the waterline (ID ≈ 5.55 in → 24.2 in²; column ≈ 3.3 in)
                       ≈ 80 in³ ≈ 1.31 L ≈ 1.31 kg added weight   [A, soft]
  m_eff = 8.030 + 1.31 = 9.34 kg  →  V_req = 9.11 L
  9.11 = 4.116 + 3.745·(T − 2)  →  (4.994)/3.745 = 1.334  →  T ≈ 3.33 in
```
**Flooded chassis: draft 2.69 → ~3.3 in, freeboard to wedge top 7.31 → ~6.7 in.** The buoy stays
afloat with ~6.7 in of freeboard; the ~1.3 kg entrained-water figure is a soft estimate.

### 9.2 One wedge module lost entirely (shell + cap + bottom + its foam)

```
mass removed = 325.83 + 126.86 + 181.21 + 148.38 = 782.3 g
m_total = 8.402 − 0.782 = 7.620 kg  →  m_eff = 7.620 − 0.372 = 7.248 kg  →  V_req = 7.071 L

displacement capacity with 5 wedges (spanning 300°):
  taper-zone full    = 5·0.686 + 0.851 = 4.281 L
  parallel-zone rate = (5/6)·(254.47 − 25.97) + 25.97 = 190.4 + 25.97 = 216.4 in³/in = 3.546 L/in
7.071 = 4.281 + 3.546·(T − 2)  →  (2.790)/3.546 = 0.787  →  T ≈ 2.79 in
```
**One wedge lost: draft 2.69 → ~2.79 in, freeboard to wedge top 7.31 → ~7.21 in.** The draft
barely moves, but flotation is now **asymmetric** (a 60° gap) → a static list/trim toward the
missing wedge. Quantifying that heel angle is CG/CB/GM work
([SCO-80](https://linear.app/scout1/issue/SCO-80)), not this model.

---

## 10. Interpretation

- **Is the "reasonable freeboard" design intent (panel review §3) met?** Yes — and then some. At
  nominal mass the buoy floats a Ø18-in body with only **2.69 in of draft**, showing **7.31 in
  of freeboard to the wedge top** and **9.31 in to the top of the chassis cap**, with the entire
  solar deck well clear of the water.

- **Is the buoy over-floated?** **Yes, substantially.** Only **8.6%** of the 18-in parallel float
  section is wetted (91% rides dry); the reserve buoyancy is **~309 N (31.5 kgf) against an
  8.4 kg build — a ~4.75:1 flotation margin.** Even the high-mass (10.5 kg) and combined-worst
  (12.3 kg) estimates leave ~29 kgf and ~28 kgf of reserve respectively. **The design problem is
  not achieving flotation — it is controlling waterline, freeboard, and (out of scope here) the
  center of gravity given how high the buoy rides.**

- **Consequences of riding this high.** *Downside:* a large windage moment arm (the solar panel
  sits ~9 in above the waterline), a lively "corky" heave/roll response to short nearshore chop
  because so little immersed volume resists heave, and five of the six wedges contributing
  windage and cost while doing almost no flotation work. *Upside:* the buoy is essentially
  unswampable — the margin absorbs biofouling mass gain, payload growth, a fully flooded chassis
  ([§9.1](#91-flooded-chassis-o-ring-seal-or-gland-fails)), and the loss of up to three wedge
  modules, all while staying afloat and recoverable.

- **What would it take to bring the waterline to mid-wedge (`T = 6 in`)?**
  ```
  V_disp(6) = 4.967 + 4.170 · (6 − 2) = 4.967 + 16.68 = 21.65 L
  required waterplane-supported mass = 21.65 L × 1.025 kg/L = 22.2 kg
  required total mass ≈ 22.2 + 0.372 ≈ 22.6 kg   →   ~14.2 kg of added ballast/payload over nominal
  ```
  Not reachable with any realistic payload growth. A softer target of `T = 4 in` (¼ of the float
  immersed) needs `V_disp(4) = 13.31 L → 13.64 kg waterplane-supported + 0.372 credit ≈ 14.0 kg
  total`, i.e. **+5.6 kg**. The realistic
  design levers are: **don't fill the wedges solid with foam** (this calc is mandated full-fill),
  **shrink or reduce the number of wedges**, and/or **add ~5–6 kg of low ballast in the chassis**
  (which also lowers CG — the panel review notes the architecture "preserves the option to add
  low ballast").

- **Stability caveat.** A very wide (18 in), very shallow-draft (2.7 in) disc has a large
  waterplane moment of inertia and therefore strong *initial* (metacentric) stability, but with
  a heavy, high solar panel and a light immersed volume it can snap-roll in waves, and the
  one-wedge-loss case ([§9.2](#92-one-wedge-module-lost-entirely-shell--cap--bottom--its-foam))
  introduces a static list. Full CG / CB / GM / righting-arm analysis is
  **[SCO-80](https://linear.app/scout1/issue/SCO-80), out of scope here** — this document is
  buoyancy and freeboard only.

---

## 11. Cross-section elevation (nominal draft)

Vertical scale ≈ 1 row per inch through the float section (approximate and non-uniform — the
chassis stub above `z = 10` is compressed). Waterline drawn at the computed nominal draft
`T = 2.69 in`. All `z` dimensions from the keel datum.

```
                              [====== SOLAR PANEL ======]        z ~= 12.5 - 14 in
                                  \        |        /            (semi-flexible / framed, ~0.7 kg nom)
                                    \      |      /   <- printed 4-arm PETG mount + ring
                                      \    |    /
                          ____________ [==|==] ____________       z = 11.0 - 12.0 in : chassis cap (Ø5.75)
   z = 12.0  --top of --> |            chassis stub           |   z = 10.0 - 11.0 in : O-ring lid + gland
             chassis cap  |          (Ø5.750 in only)         |
                          |                                   |
   z = 10.0  ------------ +===================================+  <-- TOP OF 18-in FLOAT SECTION
             ^            |####  ####  ####  ####  ####  ####  |          ^
             |            |####   6 foam-filled 60 deg     ####|          |
             |            |####      flotation wedges      ####|          | FREEBOARD to wedge top
   FB to     |            |####   (Ø18.000 in envelope)    ####|          |   = 10.00 - 2.69
   buoy top  |            |####  ####  ####  ####  ####  ####  |          |   = 7.31 in / 186 mm
   = 9.31 in |            |####  ####  ####  ####  ####  ####  |          v
             |            |####  ####  ####  ####  ####  ####  |
             v    ~~~~~~~~|####~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ####|~~~~~~~~~~~~~   S E A W A T E R
   z = 2.69  ~~ WATERLINE ~~  draft T = 2.69 in / 68.3 mm below keel datum  ~~~~~~~~~~~~~~~~~
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
   Draft T = 2.69 in  -> only the lowest 0.69 in of the 8-in parallel wedge section is wetted
                         (8.6%); the taper zone (z = 0 - 2 in) is fully submerged.
```

---

## 12. Open items — what is still blocked

| Item | Blocked on | Effect if it moves |
|---|---|---|
| Electronics list + masses, housing spec | [SCO-70](https://linear.app/scout1/issue/SCO-70) | Tier II/III → Tier I; re-solve §7, re-run §8 |
| Deployment battery sizing (40–600 g range) | [ADR-0002](../../decisions/0002-lifepo4-charging-path.md) power budget | widest single mass band after the solar panel |
| Solar panel + mount (0.3–1.5 kg) | not yet specified | second-widest mass band; also the dominant windage/CG item |
| Foam product density | panel review §11 | swap the 0.032 g/cm³ placeholder; ±0.89 kg at 4 lb/ft³ |
| Wedge weight (325.83 vs 474.58 g) | [`mass-and-buoyancy-budget.md` §11](mass-and-buoyancy-budget.md#11-open-items-to-close-before-this-stops-being-provisional) | ±0.89 kg on every total |
| Vertical stack / taper-zone height (2.0 vs 1.0 in) | v4 assembly elevation | ±0.4 in on nominal draft; conclusion unchanged |
| CG / CB / GM / righting, one-wedge-loss list angle | [SCO-80](https://linear.app/scout1/issue/SCO-80) | separate deliverable; this doc feeds it `m_total`, `V_disp`, `T` |
| Environmental design set + FEA load values | [SCO-73](https://linear.app/scout1/issue/SCO-73) | this doc supplies the geometry (`D`, `h_s`, `A_wp`) and mass; the FEA loads themselves are in [Force Budget](force-budget.md) |
