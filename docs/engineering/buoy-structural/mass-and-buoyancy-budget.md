# Buoy Mass and Buoyancy Budget

> **Summary** — **Living document.** Mass, displacement, and buoyancy for every printed part,
> kept current as the design evolves. **As of 2026-08-24, all five parts have real
> slicer-measured weights** — every part's weight is now the actual printed value, not a
> calculated approximation (see [§2](#2-calibration-against-the-one-real-data-point--retired-2026-08-24)
> for how the calculated method compared once real data existed for everything). Provides
> the `m_b` and `V_disp` inputs the
> [Buoy Structural Load Framework](structural-load-framework.md) has been waiting on — see
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
> in [`mechanical/cad/floatation/current/`](../../../mechanical/cad/floatation/current/) — the
> subfolder holding only the design actually being built right now.
>
> **Source weigh-in** — real slicer weights for all five parts, 2026-08-24: see
> [`mechanical/test/print-weight-verification-2026-08-24.md`](../../../mechanical/test/print-weight-verification-2026-08-24.md).
>
> Part of the [Knowledge Hub](../../hub/README.md)'s supporting engineering docs. Answers
> [SCO-74](https://linear.app/scout1/issue/SCO-74). Does **not** answer
> [SCO-73](https://linear.app/scout1/issue/SCO-73) (FEA load cases) — those still need
> environmental design values (`H`, `T`, current, wind) that this doc doesn't touch; see
> [Force Budget](force-budget.md).

## How to update this document

1. Slice or weigh a part. Use the slicer's **Model** weight only — support material is
   sacrificial and removed before the part is used, so it's excluded from the part's real
   weight.
2. Find that part's section (§3–§8), mark the old **Weight (used)** row superseded (strikethrough,
   keep it for the record), and add the new one with the real value, the date, and the source.
3. If a new real weight disagrees with a still-standing real weight for the same part (not just
   the geometric estimate), flag it explicitly per [Standing Rule 1](../../../CLAUDE.md#standing-rules) —
   don't silently pick one. See [§2](#2-calibration-against-the-one-real-data-point--retired-2026-08-24)
   for the live example (Wedge, 2026-08-21 vs. 2026-08-24).
4. Re-run [§9](#9-aggregate--printed-shell-system)'s totals with the updated numbers.
5. If a part's real weight changes the overall reserve-buoyancy conclusion, log that in
   [`design-notes.md`](../../hub/design-notes.md) and update [`facts.md`](../../hub/facts.md).

---

## 0. Provenance legend

Same convention as the [Buoy Structural Load Framework](structural-load-framework.md#0-provenance-legend):

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
| Flotation foam density | 0.032 g/cm³ (2 lb/ft³, generic closed-cell 2-part marine PU) | **[A] — placeholder.** No product is specified yet ([review §11](../reviews/buoy-preliminary-design-panel-review-2026-08.md#11-open-data-needed-for-the-next-review)); swap this in the moment a product is chosen |
| Nozzle line width | 0.42 mm/wall pass | [A] |
| Sector angle per wedge | 60° (π/3 rad) | [X] — 6 wedges tile 360° |
| Outer radius `R_outer` | 9.000 in | [M] — consistent across the Wedge, Wedge Cap, and Wedge Bottom drawings |
| Inner radius `R_inner` (chassis interface) | 2.875 in — chassis rim OD (Ø5.750) ÷ 2 | [M] |

**Resolves a review open item:** `R_outer` = 9.000 in confirms the buoy's overall diameter is
**18 in**, not 36 in — the review's [§11](../reviews/buoy-preliminary-design-panel-review-2026-08.md#11-open-data-needed-for-the-next-review)
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

## 2. Calibration against the one real data point — retired 2026-08-24

**History (kept for the record):** the original ~300 g Wedge slicer figure (2026-08-18) predated
the formal [print-structure decision](../../hub/decision-log.md) (2026-08-21) and used different
settings, so it wasn't comparable. A re-slice on 2026-08-21, run with the current decided print
settings, gave **474.58 g** for the Wedge (155.36 m filament, 11h8m print time) — about 1.18×
below this doc's geometric method (559 g). That 1.18× factor was then applied to the Wedge Cap
and Wedge Bottom, which had no slicer data of their own yet (Chassis and Chassis Cap are a
different, near-solid geometry the wedge-shell calibration never transferred to; they stayed
raw).

**Retired 2026-08-24 — all five parts now have their own real slicer weights**, from a full
weigh-in of the current bolted-v4 design (screenshots and per-part detail in
[`mechanical/test/print-weight-verification-2026-08-24.md`](../../../mechanical/test/print-weight-verification-2026-08-24.md)).
The shared calibration factor no longer applies to anything — every part below uses its own
**[M]** measured weight directly. Two things are worth flagging rather than silently absorbing:

- **The Wedge's own weight moved from 474.58 g (2026-08-21) to 325.83 g (2026-08-24)** — a ~31%
  drop, on the same nominal print spec (3–4 walls, ~15% gyroid, PETG) with no change logged in
  [`print-settings.md`](print-settings.md) or [`decision-log.md`](../../hub/decision-log.md) in
  between. This isn't reconciled here — it needs a look (actual wall/infill used on each print,
  scale vs. slicer-estimate, or a CAD revision between the two dates) before either number is
  trusted over the other. **This doc uses the newer (2026-08-24) measurement** as the most
  current data point per its own "living document" convention, not because the discrepancy is
  understood.
- **Final part weight = the slicer's Model weight, support excluded.** Two parts (Chassis, Wedge
  Cap) printed with support material; support is sacrificial and removed before the part is
  used, so it's excluded from the weights below even though the slicer's "Total" figure includes
  it.

## 3. Wedge (shell)

| Input | Value | Tag |
|---|---|---|
| Height | 8.000 in | [M] |
| Wall thickness | 0.250 in (from the R9.000/R8.750 pairing) | [M] |
| Walls / infill | 3–4 walls (avg 3.5), ~15% gyroid | [M] — per [2026-08-21 print-structure decision](../../hub/decision-log.md) |

Outer envelope volume (annular sector, buoyancy-relevant):
`V = 0.5 * θ * (R_outer² − R_inner²) * h = 0.5 * (π/3) * (81 − 8.266) * 8 = 304.8 in³ = 4.996 L`

Wall surface area (thin-shell approx — outer curved + inner curved + 2 flat sides):
`75.4 + 24.1 + 98.0 = 197.5 in²` → wall volume `= 197.5 * 0.250 = 49.37 in³ = 809 cm³`

Effective solid fraction (§1 method, 3.5 walls, 0.25 in wall, 15% infill) = **0.544**
→ effective solid volume = `809 × 0.544 = 440 cm³` → **weight (raw) = 559 g**

| Result | Value | Tag |
|---|---|---|
| Weight (raw geometric) | 559 g | [A] |
| Weight (superseded) | ~~300 g~~ — 2026-08-18, different/undecided print settings, no longer comparable | [M] |
| Weight (superseded) | ~~474.58 g~~ — 2026-08-21 slicer measurement; unexplained ~31% drop against the 2026-08-24 re-weigh below, see [§2](#2-calibration-against-the-one-real-data-point--retired-2026-08-24) | [M] |
| **Weight (used)** | **325.83 g** | **[M] — slicer, 2026-08-24, full weigh-in (107.51 m filament, no support material)** |
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
| Weight (superseded, calibrated ÷1.178) | ~~65.4 g~~ | [C] |
| **Weight (used)** | **126.86 g** | **[M] — slicer, 2026-08-24 (41.86 m model filament, 2.01 m support — support removed and excluded, part-only weight)** |

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
| Weight (superseded, calibrated ÷1.178) | ~~136.7 g~~ | [C] |
| **Weight (used)** | **181.21 g** | **[M] — slicer, 2026-08-24 (59.79 m filament, no support material)** |
| Cavity volume (empty shell, before foam) | envelope − wall = 686 − 234 = **452 cm³ = 0.452 L** | [A] — combined with the Wedge's own cavity in [§6](#6-foam-fill-wedge--wedge-bottom-cavities) |
| Displacement | 0.686 L | [A] |
| Buoyant force | 0.686 × 1.025 × 9.81 = **6.9 N** | [A] |

## 6. Foam fill (Wedge + Wedge Bottom cavities)

The question isn't just "how much does the foam weigh" — it's also **what does the foam alone
provide if the printed shell around it is damaged**, since that's the explicit design
requirement from the [panel review](../reviews/buoy-preliminary-design-panel-review-2026-08.md#5-individual-reviewer-responses)
(a cracked wedge shell should not remove its buoyancy). Both are computed here.

### Foam choice — what "ideal" means for this application

The foam's only job is buoyancy (the printed shell carries structure), so "ideal" means the
**lowest density that's still a reliable, readily available closed-cell 2-part marine
pour-foam** — every gram of foam density is buoyancy given back. **2 lb/ft³ (0.032 g/cm³)**
is used here: it's close to the practical floor for 2-part closed-cell PU flotation foam —
commercial marine dock-flotation foam is commonly sold at exactly this density, since lower
densities (~1.5–1.8 lb/ft³) start trading away cell strength and long-term water-absorption
resistance. **Still [A] — no product is chosen yet** ([review §11](../reviews/buoy-preliminary-design-panel-review-2026-08.md#11-open-data-needed-for-the-next-review)); swap in the
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
| Wall thickness | **Not dimensioned on this sheet.** Used the [print-structure decision](../../hub/decision-log.md)'s chassis spec directly: 6 walls × 0.42 mm = 2.52 mm (0.0992 in) | [A] — a decided target, not a drawing measurement |

At 2.52 mm, the wall is *exactly* 6 wall-loops thick with no room for an infill core —
effective fraction = **1.0** (fully solid walls, consistent with the U-bolt-region reasoning
that drove that spec in the first place).

Outer envelope `= π × 2.875² × 11 = 285.6 in³ = 4.681 L`. Wall volume (thin cylindrical shell)
`= 2π × 2.875 × 11 × 0.0992 = 19.71 in³ = 323 cm³` → **weight (raw geometric) = 410 g** — this
was always the shell only, no electronics/battery, which still aren't in these drawings; the
real weight below is likewise shell-only.

| Result | Value | Tag |
|---|---|---|
| Weight (raw geometric) | 410 g | [A] |
| **Weight (used)** | **712.82 g** | **[M] — slicer, 2026-08-24 (235.20 m model filament, 1.12 m support — support removed and excluded, part-only weight)** |
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
(near-solid part; the geometric model's estimate was never comparable to the hollow Wedge
geometry the old calibration factor came from — see the real weight below).

| Result | Value | Tag |
|---|---|---|
| Weight (raw geometric) | 134 g | [A] |
| **Weight (used)** | **89.79 g** | **[M] — slicer, 2026-08-24 (29.63 m filament, no support material)** |

**The raw-geometric model missed high on the Chassis (410 g vs. 712.82 g measured, +74%) and
missed low on the Chassis Cap (134 g vs. 89.79 g measured, −33%)** — in opposite directions, on
parts with no shared calibration basis to begin with (§2 never applied the wedge-shell factor to
either). Confirms these were always genuinely independent unknowns until measured, not a case of
one correctable systematic bias.

## 9. Aggregate — printed shell system

Using the **real measured weights** (§§3–8, all five parts now [M], including the combined
foam fill from §6, still [A]) and each part's own displacement:

| | Weight | Displacement | Buoyant force | Net (buoyancy − weight) |
|---|---|---|---|---|
| One wedge module (wedge + cap + bottom + foam) | 325.83 + 126.86 + 181.21 + 148 = **781.9 g** | 4.996 + 0.686 = **5.682 L** | 57.13 N | **+49.46 N** |
| **All 6 wedge modules** | 4.691 kg | 34.09 L | 342.79 N | **+296.77 N** |
| Chassis + chassis cap | 712.82 + 89.79 = **802.61 g** | 4.841 L | 48.68 N | **+40.80 N** |
| **Whole shell system** | **5.494 kg** (12.11 lb) | **38.93 L** | **391.47 N** | **+337.57 N (≈34.41 kgf / 75.9 lbf)** |

**What this means:** the printed shell + foam system alone can carry ~34.4 kg of everything
else — electronics, battery, solar mount, mooring hardware — before the buoy goes neutrally
buoyant. Still a large margin relative to a realistic payload (battery + electronics is
plausibly a few kg).

**Notable:** despite every individual part's weight moving substantially against its previous
figure (Wedge −31%, Wedge Cap +94%, Wedge Bottom +33%, Chassis +74%, Chassis Cap −33%), the
**whole-shell total lands at 5.494 kg — within 4 g of the previous 5.49 kg estimate**, and net
reserve buoyancy is effectively unchanged (+337.57 N vs. +337.5 N). The wedge-family weight
coming in lighter and the chassis-family weight coming in heavier happened to largely cancel
out; this is a numerical coincidence of this specific data set, not a reason to expect future
revisions to self-cancel the same way.

Separately, [§6](#6-foam-fill-wedge--wedge-bottom-cavities) shows the foam alone (shell fully
gone) still provides ~28 kgf net across all six wedges — the quantified version of the "a
cracked wedge should retain useful buoyancy" design intent, unaffected by this update since it
depends on cavity volume, not shell weight.

## 10. What this doesn't unlock yet

> **See also** — [Buoy Mass, Displacement, and Freeboard Model](buoy-mass-displacement-and-freeboard-model.md)
> *consumes* this doc (the five shell weights, the per-part cavity/displacement volumes) and
> extends it to the **whole deployed buoy**: the full as-deployed mass budget (electronics,
> battery, solar, stem, pod, mooring hardware, fasteners, coating — estimated pending
> [SCO-70](https://linear.app/scout1/issue/SCO-70)), the assembled-buoy displacement, and the
> floating-equilibrium **freeboard model** (nominal draft ~2.69 in, ~7.31 in freeboard to the
> wedge top, buoy substantially over-floated). This doc stays the printed-shell sub-budget.

This gives the [Buoy Structural Load Framework](structural-load-framework.md) its `m_b`
and `V_disp` inputs (tagged `[M]` there, "not yet available until parts finalized" — no longer
true for the shell, though electronics/battery/mooring-hardware mass still needs
[SCO-70](https://linear.app/scout1/issue/SCO-70)). It does **not** unlock the force equations
themselves ([SCO-73](https://linear.app/scout1/issue/SCO-73)) — those still need environmental
design values (`H`, `T`, current speed, wind speed, all tagged `[E]`, none chosen yet) and
mooring scope/line weight, independent of anything in this doc.

## 11. Open items to close before this stops being provisional

- **Wedge weight discrepancy (474.58 g → 325.83 g, 2026-08-21 vs. 2026-08-24)** — new, unresolved
  as of this update. Same nominal print spec, ~31% different result, no logged settings or CAD
  change in between. Needs the actual print records (slicer profile used each time, physical
  scale check) before either figure is trusted as the "true" wedge weight rather than just the
  most recent one.
- **Wedge Bottom geometry** — lower confidence than the other parts; worth a second read
  against the actual CAD, not just this drawing's dimension callouts. (The raw-geometric model's
  161 g estimate vs. 181.21 g measured is a reasonably close 13% miss despite that low
  confidence — worth understanding why before leaning on the geometric method elsewhere.)
- **Foam product density/expansion ratio** — currently a generic placeholder (0.032 g/cm³);
  swap in the real number once a product is chosen.
- **Chassis wall thickness** — not dimensioned on the drawing; used the decided print spec
  as a stand-in. Should be an explicit drawing dimension once [SCO-75](https://linear.app/scout1/issue/SCO-75)
  finalizes the chassis print structure. The 74% miss between the raw-geometric estimate (410 g)
  and the measured weight (712.82 g) is consistent with this — an undimensioned wall assumption
  feeding straight into a volume calculation.
- **Electronics, battery, solar mount, mooring hardware mass** — none of this is in these five
  drawings; still blocked on [SCO-70](https://linear.app/scout1/issue/SCO-70).

**Closed by this update:** the shared 1.178× calibration factor is retired — all five parts now
carry their own real slicer weight (see [§2](#2-calibration-against-the-one-real-data-point--retired-2026-08-24)).
