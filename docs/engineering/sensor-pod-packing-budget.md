# Sensor Pod — Component Packing Budget

> **Summary** — First-pass geometric analysis of what the turbidity sensor pod's **dry chamber**
> and **flood chamber** each need to hold, and the diameter of the wall penetration between them
> that the probe's own body passes through. Same method and rigor as the
> [Electronics Housing Packing Budget](electronics-housing-packing-budget.md) — real component
> dimensions where a manufacturer source exists, every assumption tagged, every calculation shown
> in full. **Interior packing is a geometric estimate; [§6](#6-wall-thickness) adds a first-pass
> closed-form pressure/buckling check for the dry chamber wall, in the same spirit as the
> [wedge wall-thickness check](../../mechanical/test/wedge-wall-thickness-structural-check-2026-09-07.md)
> — not FEA, not a validated sign-off.**
>
> Feeds [`facts.md`](../hub/facts.md#mechanical--deployment)'s TBD dry/flood chamber dimensions
> and [`mechanical/cad/sensor-housing/README.md`](../../mechanical/cad/sensor-housing/README.md).
>
> **Resolves an open contradiction (2026-09-13):** the sensor-housing README says the dry
> chamber holds the SEN0189 adapter board; the
> [Electronics Housing Packing Budget](electronics-housing-packing-budget.md) also listed that
> same board as occupying volume in the main housing. Confirmed with John: **the adapter board
> lives here, in the sensor pod** — the electronics housing document has been corrected to
> remove it (see that document's own changelog note).

---

## 0. Provenance legend

Same convention as the [Buoy Mass and Buoyancy Budget](buoy-structural/mass-and-buoyancy-budget.md#0-provenance-legend)
and the [Electronics Housing Packing Budget](electronics-housing-packing-budget.md#0-provenance-legend):

| Tag | Meaning |
|---|---|
| **[M]** | Measured — read directly off a manufacturer datasheet/drawing on file in the repo |
| **[L]** | Literature — a well-established vendor standard not independently dimensioned here |
| **[A]** | Assumption — stated explicitly, not yet verified against the real part |
| **[X]** | Exact — true by definition (e.g. a stated margin constant) |

## 1. Component manifest

| Component | Dimensions | Tag | Source |
|---|---|---|---|
| SEN0189 adapter/driver board | 38 × 28 × 10 mm | **[M]** | `hardware/datasheets/dfrobot-sen0189-turbidity-sensor.pdf` p.2 |
| SEN0189 probe body — overall height | 34.1 ± 1 mm (1.343 ± 0.039 in) | **[M]** | `hardware/datasheets/dfrobot-sen0189-probe-dimension.png` (DFRobot's own mechanical drawing) |
| SEN0189 probe body — main collar OD (plan view) | Ø30.4 ± 0.4 mm (2 × R15.2 ± 0.2), Ø1.197 ± 0.016 in | **[M]** | same |
| SEN0189 probe body — upper shaft OD | Ø27.8 ± 0.2 mm (Ø1.094 ± 0.008 in) | **[M]** | same |
| SEN0189 probe body — lower shaft OD | Ø22.1 ± 0.2 mm (Ø0.870 ± 0.008 in) | **[M]** | same |
| SEN0189 probe body — mounting-ear span | 44.0 ± 0.5 mm (diagonal, ear hole to ear hole), 1.732 ± 0.020 in | **[M]** | same |
| SEN0189 probe + adapter, combined weight | 30 g | **[M]** | `hardware/datasheets/dfrobot-sen0189-turbidity-sensor.pdf` p.2 |
| Probe-to-adapter-board cable length | Not specified anywhere on file | **[A]** — assumed short (a few cm), since the drawing shows the adapter board's connector mounted directly at the probe's top face, not on a long flying lead | — |

**One interpretive step, flagged rather than silently assumed:** the probe drawing dimensions a
stepped shaft (Ø27.8 mm above, Ø22.1 mm below) but doesn't caption which section is meant to
pass through a mounting wall. Standard practice for a panel-mount sensor with this geometry is
insert tip-first from the dry side until the wider collar/ears seat against the panel — so this
document assumes **only the Ø22.1 mm lower shaft (and whatever is narrower at the tip itself,
undimensioned) passes through the penetration**, while the Ø27.8 mm section and the mounting-ear
collar stay on the dry side. **[A]** — confirm against the physical part before cutting the hole.

## 2. Margin constants

| Constant | Value | Tag | Purpose |
|---|---|---|---|
| Radial clearance (dry chamber, board fit) | 3 mm per side (6 mm on diameter) | **[A]** | Standoffs, wall clearance — tighter than the electronics housing's 8 mm since this is a much smaller cavity and the board is screwed/potted in place, not swapped |
| Axial clearance (dry chamber, board-to-cap and board-to-penetration) | 5 mm each end | **[A]** | Wire bend radius, cap clearance, epoxy-boss clearance |
| Penetration clearance (hole ID over shaft OD) | 1.0–1.5 mm on diameter | **[A]** | Epoxy fillet thickness around the probe shaft — same "give the bond real cross-section" logic as the [2026-09-13 lead-penetration decision](../hub/decision-log.md), just for a rigid round shaft instead of a cable |
| Flood-chamber standoff (probe tip to far wall) | 8 mm | **[A]** | Lets water actually flow past the sensing tip rather than trap it against a wall — the design brief's "block ambient light... while still letting water flow through freely" |

## 3. Dry chamber — sizing

The dry chamber holds the SEN0189 adapter board (38 × 28 × 10 mm) plus the probe's own collar/
ear assembly (since only the lower shaft crosses into the flood chamber — see §1).

**Diameter.** The board's 28 × 10 mm cross-section, oriented with its 38 mm length along the
chamber's axis:

```
Board cross-section diagonal = sqrt(28² + 10²) = sqrt(784 + 100) = sqrt(884) = 29.7 mm
+ 6 mm radial clearance (margin constant) = 35.7 mm
```

But the probe's own collar (Ø30.4 mm) and mounting ears (44 mm diagonal span) also have to fit
in the same chamber, and the ears govern:

```
Ear span 44.0 mm + clearance for two M-something screw heads (~4 mm each side, [A]) = ~52 mm
```

**Governing diameter: ~52 mm**, driven by the probe's own mounting ears, not the adapter board.
This is bigger than the current committed body's ~Ø31.5 mm bore (from the 2026-08-29 face-seal
remodel) — **the current CAD is undersized against the actual probe hardware** if the ears are
meant to bolt down inside the dry chamber. (An alternative that avoids growing the bore: mount
the probe's ears against the *outside* face of an internal bulkhead rather than free-floating
inside the cavity, with only the shaft entering the chamber proper. That changes what "diameter"
means here and is a CAD layout decision, not a packing-math one — flagged in §8.)

**Length.** Board (38 mm) + probe collar height above its shaft (~10–14 mm, reading the
drawing's 5.6 mm and remaining step dimensions together, **[A]**) + axial clearances (5 mm ×
2 ends):

```
38 + 12 (collar, [A]) + 10 (two 5 mm clearances) = 60 mm
```

## 4. Penetration — probe shaft through the dry/flood wall

Per the assumption in §1, the Ø22.1 mm lower shaft is what crosses the wall.

```
Hole diameter = 22.1 mm shaft + 1.0–1.5 mm clearance for the epoxy fillet = 23.1–23.6 mm
```

**Recommendation: Ø24 mm finished hole.** Round up from the bare-minimum 23.1–23.6 mm for print
tolerance — a hole printed exactly to a computed minimum on an FDM part usually comes out
undersized, not oversized, per this project's own print-tolerance experience (e.g. the sealed-cap
spigot needed a 0.254 mm cut to go from interfering to line-to-line).

**Sealing method:** epoxy potting, same reasoning as the [2026-09-13 lead-penetration
decision](../hub/decision-log.md) — but worth naming the trade-off explicitly here, because
unlike a flexible lead, **the probe shaft actually is round and dimensionally consistent**, so
an O-ring is mechanically viable at this specific joint if serviceability matters more than
simplicity. The turbidity probe's optical window is exactly the kind of thing that fouls and
needs periodic cleaning — an O-ring would let the probe be pulled and cleaned without destroying
a potted joint, where epoxy would not. Recommending epoxy anyway, for consistency with the
pod's own design intent (the **pod**, not its internal parts, is the field-replaceable/
serviceable unit) and because it avoids sourcing yet another O-ring size — but flagging this as
a real choice, not a foregone one, since it's the one penetration in this build where an O-ring
would actually work geometrically.

## 5. Flood chamber — sizing

Only the portion of the probe below the dry/flood wall occupies this chamber: the Ø22.1 mm shaft
and whatever narrows further to the sensing tip (undimensioned on the drawing beyond the two
shaft diameters given).

```
Probe protrusion into flood chamber ≈ overall height (34.1 mm) − collar height on dry side
                                        (~12 mm, [A]) ≈ 22 mm
Flood chamber depth = protrusion (22 mm) + standoff to far wall (8 mm, margin constant) = 30 mm
```

**Diameter:** must clear the Ø22.1 mm shaft with room for water to flow around it, not just past
it — recommend the same ~Ø24 mm minimum as the penetration itself, growing to whatever the
light-blocking baffle geometry needs on top of that (not computed here; that geometry is
John's own DFM work, not a packing question).

## 6. Wall thickness

**This is the one place the dry and flood chambers are genuinely different problems, not just
different sizes.** The dry chamber holds air against full external hydrostatic pressure — a real
net differential, same as every other sealed housing in this build. The flood chamber is
water-filled **inside and out by design** — pressure is balanced across its wall, so it never
sees a net external load. Sized very differently as a result.

### 6.1 Dry chamber — a real pressure-vessel check

Same design pressure and material profile as the [wedge wall-thickness
check](../../mechanical/test/wedge-wall-thickness-structural-check-2026-09-07.md): **50.3 kPa**
external (the project's standard 5 m hydrostatic test target, LC8) against the custom PETG
profile (`E` = 2240 MPa, `ν` = 0.38, yield 35 MPa). Using the dry chamber's own (much smaller)
radius — mean radius ≈ 27 mm for a candidate 2.0 mm wall on a ~52 mm-ID chamber:

```
Membrane hoop stress:  σ_θ = p·R/t = 50 300 × 0.027 / 0.002 = 0.68 MPa
                        SF on yield = 35 / 0.68 ≈ 51   → stress is not the limit here

External-pressure buckling (unstiffened long cylinder):
p_cr = [E / (4(1 − ν²))] · (t/R_o)³,  R_o ≈ 0.028 m
     = [2240e6 / (4 × 0.8556)] · (0.002/0.028)³
     = 654.5 MPa × 3.64e-4 = 238.5 kPa
SF = 238.5 / 50.3 ≈ 4.7
```

**Unlike the wedge, this chamber has no foam backing to suppress buckling — it has to stand on
its own**, so this check (not the membrane-stress one) is the one that actually governs, same
conclusion the wedge check reached for its own outer wall.

**Recommendation: 2.0 mm (0.079 in) wall, solid perimeters, no infill** — ~5 perimeter passes at
the project's standard 0.42 mm line width. Gives `SF` ≈ 4.7 on buckling, in the same ballpark as
the provisional `SF` ≥ 4 bar this project has used elsewhere as a sanity check before moving to
physical/impact validation. Because buckling resistance scales with `(t/R)³`, this small a
chamber gets comfortable margin from a thin wall — going to 1.5 mm drops `SF` to ≈2.1 (thinner
than recommended here); 2.5 mm would push `SF` to ≈9.2 for not much more material. 2.0 mm is the
reasonable middle, not a knife-edge minimum.

⚠️ **Not covered by this hand calc:** the Ø24 mm penetration hole is a large cutout relative to
this chamber's own diameter, and local stress/buckling behavior right at a cutout isn't
captured by the bare-tube formulas above — same category of gap the wedge check left for its own
impact case. Worth an FEA pass before this is treated as validated, not just plausible.

### 6.2 Flood chamber — no net pressure, print-integrity minimum only

No structural pressure case applies — recommend a plain FDM print-integrity minimum, the same
spec already used for other non-primary, non-pressure-bearing parts in this build (e.g. the
[wedge cap](../../mechanical/test/wedge-wall-thickness-structural-check-2026-09-07.md)):
**3–4 perimeters, ~1.2–1.6 mm (0.05–0.06 in)**, no infill needed. Sized for handling and
assembly robustness, not load.

## 7. Recommendation

| Dimension | Value (mm) | Value (in) | Basis |
|---|---|---|---|
| **Dry chamber — interior diameter** | **≥ 52 mm** (governed by the probe's mounting ears, not the adapter board) | **≥ 2.05 in** | §3 |
| **Dry chamber — interior length** | **≥ 60 mm** | **≥ 2.36 in** | §3 |
| **Penetration hole diameter** | **Ø24 mm** | **Ø0.945 in** (~15/16 in) | §4 |
| **Flood chamber — interior depth** | **≥ 30 mm** | **≥ 1.18 in** | §5 |
| **Flood chamber — interior diameter** | **≥ Ø24 mm**, plus whatever the light-blocking baffle adds | **≥ Ø0.945 in** | §5 |
| **Dry chamber wall thickness** | **2.0 mm** (SF ≈4.7 on buckling, no foam backing) | **0.079 in** | §6.1 |
| **Flood chamber wall thickness** | **1.2–1.6 mm** (print-integrity only — no net external pressure) | **0.05–0.06 in** | §6.2 |

mm is this document's working unit (the manufacturer drawings this is sourced from are metric);
in is given for CAD entry since the rest of this pod's own drawings are dimensioned in inches.

**Outer (tube) diameters, ID + 2×wall:**

| Dimension | Value (mm) | Value (in) |
|---|---|---|
| Dry chamber — outer diameter | 52 + 2×2.0 = **56 mm** | **2.205 in** |
| Flood chamber — outer diameter | 24 + 2×(1.2–1.6) = **26.4–27.2 mm** | **1.04–1.07 in** |

⚠️ **New finding: the dry chamber's tube OD (56 mm) is now bigger than the existing 3-bolt
flange (~Ø54 mm)** documented in the [face-seal remodel](../../mechanical/cad/sensor-housing/README.md#face-seal-remodel--2026-08-29).
Growing the bore isn't just a bore edit — **the end cap and its Ø44.45 mm bolt circle need to
grow too**, or the flange ends up narrower than the tube it's capping. Not sized here (the bolt
circle and O-ring groove are [SCO-91](https://linear.app/scout1/issue/SCO-91)'s own open items,
not a packing question) — flagged so it isn't discovered mid-CAD.

**This is a floor, not a target** — same caveat as the electronics housing document. It also
means **the current committed dry-chamber body (~57 mm tall, ~Ø31.5 mm bore) is undersized on
diameter** against the probe's own mounting-ear span, not just tight against the adapter board
as flagged on 2026-09-13. Length (57 mm vs. a 60 mm recommendation) is close enough to be a
rounding/margin question, not a redesign.

## 8. Open items

- **Mounting-ear layout is the real open question, not a packing number.** Whether the probe's
  ears bolt inside the dry-chamber cavity (driving the chamber to ~Ø52 mm) or against an internal
  bulkhead face (potentially keeping the chamber narrower, with only the shaft entering it) is a
  CAD layout decision this document can't make. Resolve before committing a diameter.
- **Collar height split (~12 mm assumed on the dry side)** is read from the drawing's 5.6 mm/
  16 mm callouts, not an authoritative single dimension — confirm against the physical part or a
  clearer view of the drawing.
- **Probe-to-adapter-board cable length** — not on file anywhere; matters for how much slack to
  route inside the dry chamber. Measure the physical part.
- **O-ring vs. epoxy for the probe-shaft penetration** — recommended epoxy in §4 for consistency,
  but flagged as a real trade-off against future probe serviceability (biofouling cleaning).
  John's call, not this document's.
- **Light-blocking baffle geometry** inside the flood chamber isn't modeled here — it's a DFM
  design question, not a packing-math one, and will add to the §5 diameter/depth floor.
- **Dry-chamber wall thickness (§6.1) is a hand calc, not FEA** — same caveat the wedge check
  carries. In particular, the Ø24 mm penetration cutout's local effect on buckling isn't bounded
  by the bare-tube formula used. Treat 2.0 mm as plausible, not validated, until checked.
- **The existing 3-bolt end-cap flange (~Ø54 mm) is now narrower than the recommended dry-chamber
  tube OD (56 mm).** Growing the bore forces the flange and its Ø44.45 mm bolt circle to grow
  too — not sized here, but it means this isn't a bore-only edit in CAD.
