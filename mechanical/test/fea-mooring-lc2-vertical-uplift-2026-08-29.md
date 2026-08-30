# FEA — LC2 Mooring Vertical Uplift, 2026-08-29

> **Summary** — First run of the corrected [FEA load cases](../../docs/engineering/buoy-structural/force-budget.md#computed-load-cases).
> **LC2** = the taut-line vertical uplift the mooring / pad-eye sees if the buoy is pulled fully
> under: **322 N straight down (−Z) at the attachment**, chassis heat-set region fixed. Run in
> Autodesk Fusion (2704.1.53) with a **custom PETG material profile** (see below) and a
> **McMaster 3076T33 steel tie-down ring** as the attachment part. Full interactive report:
> [`fea-mooring-lc2-vertical-uplift-2026-08-29.html`](fea-mooring-lc2-vertical-uplift-2026-08-29.html).
>
> **Remaining load cases LC3–LC9 are not yet run** — tracked in
> [`fea-mooring-load-cases.md`](fea-mooring-load-cases.md); John Ryan is running and will upload
> them (top priority).

---

## Setup

| | |
|---|---|
| Tool | Autodesk Fusion (2704.1.53), Static Stress study "LC2" (Fusion report title "L2 / Studies") |
| Model | Heat-set attachment Part 1:1, Part 2:1–6, Part 3:1–6 (the chassis / wedge heat-set region) + `3076T33_Tie-Down Ring:1` |
| Load case | **LC2** — `Force2` = **322.00 N**, vector **X 0 / Y ~0 / Z −322.00 N** (straight down) — matches [`force-budget.md` LC2](../../docs/engineering/buoy-structural/force-budget.md#lc2--taut-line-vertical-uplift--322-n-vertical-at-the-u-bolt) (the net reserve buoyancy at the light build) |
| Constraint | `Fixed2` — Ux/Uy/Uz fixed at the chassis heat-set reference |
| Contacts | 33 bonded sets across the heat-set parts and the tie-down ring |
| Mesh | Parabolic solids, **114,564 nodes / 62,994 elements**, 10 % element size, curved elements, 60° max turn angle |
| Convergence | 0 adaptive refinement steps, 20 % results-convergence tolerance (baseline accuracy) |

### Materials

**PETG — custom profile** (John Ryan, built in Fusion 2026-08-29):

| Property | Value | Note |
|---|---|---|
| Density | **1.060×10⁻⁶ kg/mm³ (1.06 g/cm³)** | ⚠️ **carried over from the 2026-08-17 ABS profile — PETG is ~1.27 g/cm³.** Immaterial for this static case (gravity is negligible next to the 322 N load), but reconcile before any mass-relevant study. The [mass budget](../../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md) uses 1.27 g/cm³ |
| Young's Modulus | 2240 MPa | same as the 2026-08-17 ABS run |
| Poisson's Ratio | 0.38 | |
| **Yield Strength** | **35.00 MPa** | conservative for PETG (published ~50 MPa) — raised from the ABS profile's 20 MPa |
| **Ultimate Tensile Strength** | **45.00 MPa** | raised from the ABS profile's 29.6 MPa |
| Thermal conductivity | 1.60×10⁻⁴ W/(mm·K) | |
| Thermal expansion | 8.57×10⁻⁵ /K | |
| Specific heat | 1500 J/(kg·K) | |

**Steel** (the 3076T33 tie-down ring, Fusion generic): E 210 GPa, ν 0.30, yield 207 MPa, UTS
345 MPa, ρ 7.85 g/cm³. A stand-in — the real part is being specified on
[SCO-69](https://linear.app/scout1/issue/SCO-69) (316 for the build; 3076T33 is a steel
tie-down ring used here the same way 304 stood in for the U-bolt geometry earlier).

## Results

| Result | Min | Max |
|---|---|---|
| Safety factor | **7.53** | 196,602 (local/singularity) |
| Von Mises stress | 1.8×10⁻⁴ MPa | **27.49 MPa** |
| 1st principal stress | −2.70 MPa | 34.07 MPa |
| Normal ZZ | −14.38 MPa | 32.21 MPa |
| **Total displacement** | 0 mm | **0.012 mm** |
| Reaction force (Z, max nodal) | — | 31.97 N |
| Contact pressure | 0 MPa | 12.55 MPa |
| Equivalent strain | 0 | 4.0×10⁻⁴ |

**Reading:** the attachment is **very stiff and low-stress at LC2** — 12 µm peak displacement,
min SF 7.5, peak von Mises ~27 MPa (in the steel ring; the PETG stays well below its 35 MPa
yield). This is a comfortable pass against any conventional structural target (SF ≥ 2–4).

> **Flagged:** Fusion's Guided-Results banner reads *"the design is expected to bend permanently
> or break"* — which is **inconsistent with the reported min SF of 7.53** and the 12 µm
> displacement. Most likely the study's Safety-Factor *target* is set unusually high, or it is
> Fusion's canned below-target guidance rendering regardless. The raw numbers pass. Worth
> confirming the SF target setting on the next run so the banner matches the result.

## What this does and doesn't establish

- **Does:** confirms the mooring attachment region does not come close to yielding under the
  322 N taut-line vertical uplift (LC2), at the custom PETG profile.
- **Doesn't:** cover LC3–LC9 (current, wave, combined, overturning moment, hydrostatic, snap) —
  those are the load cases that actually load the attachment *laterally* and with a moment, and
  LC9 (the ~810 N snap) is the governing one. Doesn't use the final pad-eye part (3076T33 is a
  stand-in). Doesn't reconcile the 1.06 vs 1.27 g/cm³ PETG density. Uses a stress singularity
  (SF max 196,602) that inflates the reported SF range — read the min, not the max.

## Next steps

1. **LC3–LC9** — run and upload (top priority). Especially **LC9 snap (~810 N at 37° from
   vertical)** and **LC6/LC7** (combined + overturning moment) — LC2 alone is not sufficient to
   sign off the attachment.
2. Reconcile the PETG density (1.06 → 1.27 g/cm³) and confirm the yield/UTS against a PETG
   datasheet or a printed-coupon tensile test.
3. Set an explicit, derived Safety-Factor target (framework §11) so the Guided-Results verdict
   is meaningful.
4. Swap the 3076T33 stand-in for the final 316 pad-eye once chosen ([SCO-69](https://linear.app/scout1/issue/SCO-69)).
