# Buoy Mass and Buoyancy Budget

> **Summary** — **Living document.** Mass, displacement, and buoyancy for every printed part,
> kept current as the design evolves. Right now every part's weight is a **calculated
> approximation** from dimensioned drawings — as parts get sliced, replace the calculated value
> in that part's table with the real slicer/scale weight (there's a **Measured** row waiting in
> each part's table) and re-run the totals in [§8](#8-aggregate--printed-shell-system). Provides
> the `m_b` and `V_disp` inputs the
> [Buoy Structural Load Framework](buoy-structural-load-framework.md) has been waiting on — see
> the companion [Force Budget](force-budget.md) for how those loads get resolved once
> environmental values are chosen. Print settings (walls/infill) referenced here have their own
> canonical spec in [Print Settings](print-settings.md).
>
> Every value is tagged by provenance (see [§0](#0-provenance-legend)) so it's clear what's
> measured, what's assumed, and what still needs the real component list. **Every mathematical
> calculation is shown in full** — nothing here is a bare result.
>
> **Source drawings** — `chassis-floatation-bolted-v4-{wedge,wedge-cap,wedge-bottom,chassis,
> chassis-cap}.pdf` (John Ryan, dated 2026-08-22), committed alongside the matching STEP files
> in [`mechanical/cad/floatation/`](../../mechanical/cad/floatation/).
>
> Part of the [Knowledge Hub](../hub/README.md)'s supporting engineering docs. Answers
> [SCO-74](https://linear.app/scout1/issue/SCO-74). Does **not** answer
> [SCO-73](https://linear.app/scout1/issue/SCO-73) (FEA load cases) — those still need
> environmental design values (`H`, `T`, current, wind) that this doc doesn't touch; see
> [Force Budget](force-budget.md).

## How to update this document

1. Slice or weigh a part.
2. Find that part's section (§3–§8) and fill in its **Measured** row with the real value and
   today's date.
3. If Measured differs meaningfully from Calculated, that part's row becomes the new anchor for
   the calibration factor in [§2](#2-calibration-against-the-one-real-data-point) — recompute it
   and re-apply to any part that still only has a calculated estimate.
4. Re-run [§9](#9-aggregate--printed-shell-system)'s totals with the updated numbers.
5. If a part's real weight changes the overall reserve-buoyancy conclusion, log that in
   [`design-notes.md`](../hub/design-notes.md) and update [`facts.md`](../hub/facts.md).

---

## 0. Provenance legend

Same convention as the [Buoy Structural Load Framework](buoy-structural-load-framework.md#0-provenance-legend):

| Tag | Meaning |
|---|---|
| **[M]** | Measured — read directly off a dimensioned drawing |
| **[X]** | Exact — true by definition (e.g. 6 wedges → 60° sectors) |
| **[L]** | Literature/material constant |
| **[A]** | Assumption — stated explicitly, not yet verified |
| **[C]** | Calibrated — corrected against a real measurement (see §2) |

## 1. Constants and shared geometry

| Quantity | Value | Tag |
|---|---|---|
| PETG density | 1.27 g/cm³ | [L] |
| Seawater density | 1.025 g/cm³ (1025 kg/m³) | [L] |
| Flotation foam density | 0.032 g/cm³ (2 lb/ft³, generic closed-cell 2-part marine PU) | **[A] — placeholder.** No product is specified yet ([review §11](reviews/buoy-preliminary-design-panel-review-2026-08.md#11-open-data-needed-for-the-next-review)); swap this in the moment a product is chosen |
| Nozzle line width | 0.42 mm/wall pass | [A] |
| Sector angle per wedge | 60° (π/3 rad) | [X] — 6 wedges tile 360° |
| Outer radius `R_outer` | 9.000 in | [M] — consistent across the Wedge, Wedge Cap, and Wedge Bottom drawings |
| Inner radius `R_inner` (chassis interface) | 2.875 in — chassis rim OD (Ø5.750) ÷ 2 | [M] |

**Resolves a review open item:** `R_outer` = 9.000 in confirms the buoy's overall diameter is
**18 in**, not 36 in — the review's [§11](reviews/buoy-preliminary-design-panel-review-2026-08.md#11-open-data-needed-for-the-next-review)
flagged this as ambiguous ("confirm whether 18 in is radius or diameter"); the drawings settle
it directly.

**Effective-density method for infill.** A slicer generates wall loops from both the outer and
inner surface of a modeled wall of thickness `t`; where those loops don't meet in the middle,
the remaining core is filled at the stated infill %. For `N` walls at line width `w`:

```
solid_thickness = min(2 * N * w, t)
core_thickness   = t - solid_thickness
effective_fraction = (solid_thickness + core_thickness * infill%) / t
```

This is a simplification (real slicers don't behave perfectly linearly), which is exactly why
§2 exists — to calibrate it against a real measurement rather than trust it blind.

## 2. Calibration against the one real data point

[`facts.md`](../hub/facts.md#mechanical--deployment) already records a **slicer-measured** wedge
weight of **~300 g** (2026-08-18) — real sliced geometry, not a hand calculation. Running this
doc's method on the Wedge shell (§3) gives **558 g**, about **1.86× high**.

Rather than present a method I know overshoots, the Wedge's own weight uses the slicer's 300 g
directly, and the **1.86× factor is applied to the other four parts**, which have no slicer
data yet. Every "calibrated" weight below is `raw ÷ 1.86`, tagged **[C]**. Re-run this the
moment real slicer weights exist for the other parts — the calibration factor is a stand-in,
not a law of physics.

## 3. Wedge (shell)

| Input | Value | Tag |
|---|---|---|
| Height | 8.000 in | [M] |
| Wall thickness | 0.250 in (from the R9.000/R8.750 pairing) | [M] |
| Walls / infill | 3–4 walls (avg 3.5), ~15% gyroid | [M] — per [2026-08-21 print-structure decision](../hub/decision-log.md) |

Outer envelope volume (annular sector, buoyancy-relevant):
`V = 0.5 * θ * (R_outer² − R_inner²) * h = 0.5 * (π/3) * (81 − 8.266) * 8 = 304.8 in³ = 4.996 L`

Wall surface area (thin-shell approx — outer curved + inner curved + 2 flat sides):
`75.4 + 24.1 + 98.0 = 197.5 in²` → wall volume `= 197.5 * 0.250 = 49.37 in³ = 809 cm³`

Effective solid fraction (§1 method, 3.5 walls, 0.25 in wall, 15% infill) = **0.544**
→ effective solid volume = `809 × 0.544 = 440 cm³` → **weight (raw) = 559 g**

| Result | Value | Tag |
|---|---|---|
| Weight (raw geometric) | 559 g | [A] |
| **Weight (used)** | **300 g** | **[M] — slicer, 2026-08-18** |
| Weight (measured, scale) | — *pending* | [M] |
| Cavity volume (empty shell, before foam) | envelope − wall = 304.8 − 49.4 = 255.4 in³ = **4.185 L** | [A] (depends on the wall-thickness reading; combined with Wedge Bottom's cavity in [§6](#6-foam-fill-wedge--wedge-bottom-cavities)) |
| Displacement (own footprint) | 4.996 L | [M] |
| Buoyant force (own footprint) | 4.996 L × 1.025 kg/L × 9.81 = **50.3 N** | [X] (Archimedes) |

## 4. Wedge Cap

| Input | Value | Tag |
|---|---|---|
| Footprint | Assumed to match the Wedge's opening (`R_inner`–`R_outer`, 60°) = 38.10 in² | [A] |
| Thickness | ~0.20 in (midpoint of the 0.135–0.265 range shown) | [A] |
| Walls / infill | 3–4 walls, ~15% gyroid (wedge family) | [M] |

Flat-plate volume `= 38.10 × 0.20 = 7.62 in³ = 125 cm³`. Effective fraction for a flat plate
(skin + core model, ~2 mm top/bottom skin) ≈ **0.485** → effective solid = `125 × 0.485 = 60.6
cm³` → **weight (raw) = 77 g**.

| Result | Value | Tag |
|---|---|---|
| Weight (raw) | 77 g | [A] |
| **Weight (calibrated, ÷1.86)** | **41 g** | [C] |
| Weight (measured, scale) | — *pending* | [M] |

## 5. Wedge Bottom

**Lower confidence than the other parts** — the drawing shows five stacked radii (R9.000,
R8.300, R5.800, R2.995, R2.881) that likely represent stepped internal features this
simplified frustum model doesn't capture. Treat these numbers as a rough bound, not a tight
estimate.

| Input | Value | Tag |
|---|---|---|
| Top opening | Matches Wedge/Cap footprint, 38.10 in² | [A] |
| Height | ~2.000 in (from the 45° taper geometry) | [M] |
| Bottom footprint | Estimated ~20% of top ≈ 7.62 in² | [A] — genuinely a guess |

Frustum volume `= h(A₁+A₂+√(A₁A₂))/3 = 2×(38.10+7.62+17.04)/3 = 41.8 in³ = 686 cm³ = 0.686 L`
(displacement). Wall volume (scaled from the Wedge's per-height wall area) ≈ 234 cm³ →
effective solid `= 234 × 0.544 = 127 cm³` → **weight (raw) = 161 g**.

| Result | Value | Tag |
|---|---|---|
| Weight (raw) | 161 g | [A] |
| **Weight (calibrated, ÷1.86)** | **87 g** | [C] |
| Weight (measured, scale) | — *pending* | [M] |
| Cavity volume (empty shell, before foam) | envelope − wall = 686 − 234 = **452 cm³ = 0.452 L** | [A] — combined with the Wedge's own cavity in [§6](#6-foam-fill-wedge--wedge-bottom-cavities) |
| Displacement | 0.686 L | [A] |
| Buoyant force | 0.686 × 1.025 × 9.81 = **6.9 N** | [A] |

## 6. Foam fill (Wedge + Wedge Bottom cavities)

The question isn't just "how much does the foam weigh" — it's also **what does the foam alone
provide if the printed shell around it is damaged**, since that's the explicit design
requirement from the [panel review](reviews/buoy-preliminary-design-panel-review-2026-08.md#5-individual-reviewer-responses)
(a cracked wedge shell should not remove its buoyancy). Both are computed here.

### Foam choice — what "ideal" means for this application

The foam's only job is buoyancy (the printed shell carries structure), so "ideal" means the
**lowest density that's still a reliable, readily available closed-cell 2-part marine
pour-foam** — every gram of foam density is buoyancy given back. **2 lb/ft³ (0.032 g/cm³)**
is used here: it's close to the practical floor for 2-part closed-cell PU flotation foam —
commercial marine dock-flotation foam is commonly sold at exactly this density, since lower
densities (~1.5–1.8 lb/ft³) start trading away cell strength and long-term water-absorption
resistance. **Still [A] — no product is chosen yet** ([review §11](reviews/buoy-preliminary-design-panel-review-2026-08.md#11-open-data-needed-for-the-next-review)); swap in the
real product's density/expansion-ratio the moment one is picked.

### Fill volume and weight

| | Cavity volume | Tag |
|---|---|---|
| Wedge (§3) | 4.185 L | [A] |
| Wedge Bottom (§5) | 0.452 L | [A] |
| **Total per wedge module** | **4.637 L = 4637 cm³** | |

```
foam_weight = V_cavity × rho_foam
            = 4637 cm³ × 0.032 g/cm³
            = 148.4 g per wedge module
```

| Result | Value | Tag |
|---|---|---|
| **Foam weight (per module)** | **148 g** | [A] |
| Foam weight (all 6 modules) | 148 × 6 = **890 g ≈ 0.89 kg** | [A] |

### Foam's own standalone buoyancy — the failure-mode number

If the PETG shell is fully gone (cracked, punctured, or dissolved away) and only the foam
block sits in seawater, it still displaces its own volume and still weighs only what it
weighs — Archimedes applies to the foam alone exactly as it does to the whole assembly:

```
F_B,foam = rho_sw × g × V_cavity − (foam_weight × g)
         = (1025 kg/m³ × 9.81 × 0.004637 m³) − (0.1484 kg × 9.81)
         = 46.62 N − 1.46 N
         = 45.2 N net upward, per wedge module, from foam alone
```

| Result | Value | Tag |
|---|---|---|
| **Net buoyant force, foam alone, per module** | **45.2 N (≈4.6 kgf / 10.2 lbf)** | [A] |
| **All 6 wedges, foam alone** | 45.2 × 6 = **271.2 N (≈27.7 kgf / 61 lbf)** | [A] |

That's the concrete number behind the panel review's failure-mode requirement: even in the
worst case where every printed shell is gone and only the foam remains, the foam alone still
provides ~28 kgf of net lift across the six wedges — a real, quantified answer for
[SCO-81](https://linear.app/scout1/issue/SCO-81) (buoyancy-under-failure verification), not
just a design intention.

## 7. Chassis (body)

| Input | Value | Tag |
|---|---|---|
| Height | 11.000 in | [M] |
| OD | 5.750 in (chassis rim) — assumed to hold for the full tube, not just the rim | [A] |
| Wall thickness | **Not dimensioned on this sheet.** Used the [print-structure decision](../hub/decision-log.md)'s chassis spec directly: 6 walls × 0.42 mm = 2.52 mm (0.0992 in) | [A] — a decided target, not a drawing measurement |

At 2.52 mm, the wall is *exactly* 6 wall-loops thick with no room for an infill core —
effective fraction = **1.0** (fully solid walls, consistent with the U-bolt-region reasoning
that drove that spec in the first place).

Outer envelope `= π × 2.875² × 11 = 285.6 in³ = 4.681 L`. Wall volume (thin cylindrical shell)
`= 2π × 2.875 × 11 × 0.0992 = 19.71 in³ = 323 cm³` → **weight = 410 g** (no slicer data to
calibrate against — this is the shell only, no electronics/battery, which aren't in these
drawings).

| Result | Value | Tag |
|---|---|---|
| Weight | 410 g | [A] |
| Weight (measured, scale) | — *pending* | [M] |
| Internal cavity (dry reserve) | 4.681 − 0.323 = **4.358 L** | [A] |
| Displacement (full envelope) | 4.681 L | [M]-derived |
| Buoyant force | 4.681 × 1.025 × 9.81 = **47.1 N** | [X] |

## 8. Chassis Cap

| Input | Value | Tag |
|---|---|---|
| OD | ≈5.750 in (assumed same as the bolt circle — no larger dimension is given) | [A] |
| Thickness | ~0.375 in average (steps from 0.500 to 0.250) | [A] |
| Walls / infill | 6 walls, ~27.5% gyroid (chassis family) | [M] |

Volume `= π × 2.875² × 0.375 = 9.74 in³ = 160 cm³`. Effective fraction (6 walls, 9.5 mm
thickness, 27.5% infill) = **0.659** → effective solid `= 105 cm³` → **weight (raw) = 134 g**
(near-solid part; no meaningful calibration basis since it's not comparable to the hollow
Wedge geometry the 1.86× factor came from — reported as raw).

| Result | Value | Tag |
|---|---|---|
| Weight | 134 g | [A] |
| Weight (measured, scale) | — *pending* | [M] |

## 9. Aggregate — printed shell system

Using the **used/calibrated** weights (§§3–8, including the combined foam fill from §6) and
each part's own displacement:

| | Weight | Displacement | Buoyant force | Net (buoyancy − weight) |
|---|---|---|---|---|
| One wedge module (wedge + cap + bottom + foam) | 300 + 41 + 87 + 148 = **576 g** | 4.996 + 0.686 = **5.682 L** | 57.1 N | **+51.5 N** |
| **All 6 wedge modules** | 3.46 kg | 34.09 L | 342.8 N | **+308.9 N** |
| Chassis + chassis cap | 0.544 kg | 4.841 L | 48.7 N | **+43.4 N** |
| **Whole shell system** | **4.00 kg** (8.8 lb) | **38.9 L** | **391.4 N** | **+352.2 N (≈35.9 kgf / 79.2 lbf)** |

**What this means:** the printed shell + foam system alone can carry ~36 kg of everything
else — electronics, battery, solar mount, mooring hardware — before the buoy goes neutrally
buoyant. That's a large margin relative to a realistic payload (battery + electronics is
plausibly a few kg), consistent with the 2026-08-18 finding that the floatation FEA safety
factor (25.4 against a target of 4) reads as over-engineered — now corroborated from the
buoyancy side as well as the structural side. Separately, [§6](#6-foam-fill-wedge--wedge-bottom-cavities)
shows the foam alone (shell fully gone) still provides ~28 kgf net across all six wedges — the
quantified version of the "a cracked wedge should retain useful buoyancy" design intent.

## 10. What this doesn't unlock yet

This gives the [Buoy Structural Load Framework](buoy-structural-load-framework.md) its `m_b`
and `V_disp` inputs (tagged `[M]` there, "not yet available until parts finalized" — no longer
true for the shell, though electronics/battery/mooring-hardware mass still needs
[SCO-70](https://linear.app/scout1/issue/SCO-70)). It does **not** unlock the force equations
themselves ([SCO-73](https://linear.app/scout1/issue/SCO-73)) — those still need environmental
design values (`H`, `T`, current speed, wind speed, all tagged `[E]`, none chosen yet) and
mooring scope/line weight, independent of anything in this doc.

## 11. Open items to close before this stops being provisional

- **Wedge Bottom geometry** — lower confidence than the other parts; worth a second read
  against the actual CAD, not just this drawing's dimension callouts.
- **Foam product density/expansion ratio** — currently a generic placeholder (0.032 g/cm³);
  swap in the real number once a product is chosen.
- **Chassis wall thickness** — not dimensioned on the drawing; used the decided print spec
  as a stand-in. Should be an explicit drawing dimension once [SCO-75](https://linear.app/scout1/issue/SCO-75)
  finalizes the chassis print structure.
- **Calibration factor (1.86×)** — derived from one data point (the Wedge). Get real slicer
  weights for the Wedge Cap, Wedge Bottom, Chassis, and Chassis Cap to replace it with
  per-part numbers.
- **Electronics, battery, solar mount, mooring hardware mass** — none of this is in these five
  drawings; still blocked on [SCO-70](https://linear.app/scout1/issue/SCO-70).
