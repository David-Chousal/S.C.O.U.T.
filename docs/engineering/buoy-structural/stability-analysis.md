# Buoy Stability Analysis

> **Summary** — Transverse (roll) and longitudinal (pitch) stability of the deployed S.C.O.U.T.
> buoy on the **v5 geometry**: vertical centre of gravity (`KG`), centre of buoyancy (`KB`),
> metacentric radius (`BM`), metacentric height (`GM`), the small-angle righting behaviour, the
> natural roll period, the one-wedge-lost damaged case, and the heel the buoy takes under the
> peak mooring/environmental load. This is the analysis
> [SCO-80](https://linear.app/scout1/issue/SCO-80) tracks and that the
> [freeboard model](buoy-mass-displacement-and-freeboard-model.md) §10 explicitly deferred.
>
> **Inputs consumed:** the v5 mass budget and freeboard solution from
> [`buoy-mass-displacement-and-freeboard-model.md`](buoy-mass-displacement-and-freeboard-model.md)
> (nominal mass 7.749 kg, draft `T` = 2.53 in, `V_disp` at equilibrium 7.20 L, waterplane a
> solid Ø18 in circle) and the v5 geometry from
> [SCO-110](https://linear.app/scout1/issue/SCO-110).
>
> **Headline:** the buoy has a very large metacentric height (**`GM` ≈ 9.7 in / 0.25 m**) — it
> is emphatically self-righting and follows wave slopes without difficulty, but it is a *stiff*
> body with a **~0.6 s natural roll period** (high accelerations in short chop). Losing one
> flotation wedge produces only a **~3° static list**. Under the peak combined
> mooring/environmental load the static overturning moment exceeds the bare hydrostatic righting
> capacity, so the buoy **heels into the flow under load** — sustained (current-only) heel is
> ~6°; the wave-driven peak heel needs the coupled mooring analysis or the physical tilt test
> ([SCO-82](https://linear.app/scout1/issue/SCO-82)) to bound.
>
> ⚠️ **Provisional** on the same inputs as the freeboard model: the v5 shell masses are
> geometric estimates pending the re-slice, and the Tier III component masses (battery, solar
> panel, stem, pod) are estimates pending [SCO-70](https://linear.app/scout1/issue/SCO-70). The
> **wedge bottoms** carry the measured lean v5 part (207.06 g each, 2026-09-25 —
> [SCO-111](https://linear.app/scout1/issue/SCO-111)); it came out *heavier* than v4, and being low
> in the stack it lowers `KG` slightly. §§1–4 are updated; §§5+ scale with `GM` and `V_disp`,
> both of which moved < 2% (`GM` 9.73 → 9.56 in), so their conclusions stand unchanged.
> Component vertical positions (`z_i`) below are first-pass estimates from the CAD layout — they
> tighten once real component placement is in the model.
>
> **Proposed path** — `docs/engineering/buoy-structural/stability-analysis.md`

## 0. Provenance legend

Same scheme as the companion buoy-structural docs.

| Tag | Meaning |
|---|---|
| **[M]** | Measured from CAD / drawing / scale |
| **[X]** | Exact — geometry or a defining relation |
| **[L]** | Literature / material constant |
| **[A]** | Assumption — stated explicitly |
| **[A geom]** | Estimated from part geometry — stand-in for a measurement not yet taken |
| **[X from M+A]** | Derived output: exact given the geometry, the mass estimates, and the stated `z_i` |

Datum: **`z = 0` at the keel** — the chassis bottom / bottom of the wedge-bottom taper, the same
datum as the [freeboard model §1](buoy-mass-displacement-and-freeboard-model.md#1-scope-datum-and-the-single-biggest-geometric-assumption).
All heights `KG`, `KB`, `KM` are measured up from there. The sensor stem and pod hang **below**
`z = 0` (negative `z`).

Unit note: worked in inches for consistency with the drawings, converted to SI for the period
and moment results. `1 in = 0.0254 m`.

---

> ⚠️ **Superseded in part by [§12](#12-large-angle-stability-capsize-and-self-righting-ballast--2026-09-29)
> (2026-09-29).** A STEP-geometry re-run moved the waterline into the wedge-bottom taper, corrected
> the mass budget, and computed the full `GZ` curve. Main findings: nominal `GM` ≈ 7.0 in (not 9.6),
> vanishing angle ≈ 90°, and **the buoy is stable upside down.** §8's assumption that form stability
> balances the LC7 moment does not hold. §§1–9 are kept as the prior revision.

## 1. Vertical centre of gravity — `KG`

The buoy is treated as a rigid body: the printed PETG sensor stem is stiff, so the sensor pod
hanging ~13.5 in below the keel is genuine pendant ballast, not a free pendulum. `KG` is the
mass-weighted mean height of every component.

### 1.1 Component masses and heights

Masses are the v5 nominal budget from the
[mass model §3](buoy-mass-displacement-and-freeboard-model.md#3-full-mass-budget). Heights `z_i`
are the centroid of each group above the keel, estimated from the
[cross-section §11](buoy-mass-displacement-and-freeboard-model.md#11-cross-section-elevation-nominal-draft-v5)
vertical stack (wedge-bottom taper `z` 0–2 in, parallel float section `z` 2–7.5 in, chassis
`z` 0–8.5 in, chassis cap `z` 8.5–9.5 in, solar deck `z` ≈ 10–11.5 in).

| Group | Mass (g) | `z_i` (in) | Basis for `z_i` | `m·z` (g·in) |
|---|---:|---:|---|---:|
| Chassis shell | 600 | 4.10 | Ø5.75 cylinder `z` 0–8.5, near-uniform wall, small extra at the mooring boss | 2460 |
| Chassis cap | 89.8 | 9.00 | lid + clamp, `z` 8.5–9.5 | 808 |
| 6 wedge shells | 1440 | 4.75 | `z` 2–7.5, near-uniform | 6840 |
| 6 wedge bottoms | 1242 | 1.10 | tapered frustums, `z` 0–2, mass toward the wide top | 1367 |
| 6 wedge caps | 761 | 7.40 | thin lids at the wedge top | 5631 |
| Feather M0 stack | 5.8 | 4.0 | inside the chassis, mid-height | 23 |
| Flotation foam | 710 | 4.30 | wedge cavity 3.244 L @ `z` 4.75 + wedge-bottom cavity 0.452 L @ `z` 1.1, per module | 3053 |
| Small electronics (Adalogger, charger, turbidity adapter, headers, wiring) | 80 | 3.0 | low in the chassis, near the battery | 240 |
| Chassis bottom end cap | 90 | 0.20 | closes the chassis base | 18 |
| Solar mount (4-arm bracket + ring) | 320 | 10.0 | above the chassis cap | 3200 |
| Fasteners (~75 M4 + ~60 inserts) | 210 | 3.5 | wedge bolts on the ~0.69 in inner flange (`z` ~3), lid bolts (`z` ~9), pad-eye (`z` 0) | 735 |
| Epoxy / adhesive | 130 | 4.5 | radial seams `z` 2–7.5, cap bonds `z` 7.4, U-bolt `z` 0 | 585 |
| Antifouling film + seal coat | 200 | 3.8 | over the wetted hull exterior, wedges + wedge bottoms | 760 |
| Cabling (hydrophone + sensor string) | 100 | −2.0 | mostly along the stem, below the keel | −200 |
| Deployment battery | 250 | 2.5 | low in the chassis (ballast position) | 625 |
| Solar panel | 700 | 11.0 | on the mount, well above the deck | 7700 |
| Sensor stem | 400 | −6.0 | perforated PETG tube hanging below the keel, ~12 in long | −2400 |
| Sensor pod | 200 | −13.5 | at the bottom of the stem | −2700 |
| Mooring pad-eye + backing plate | 220 | 0.0 | through-bolted at the chassis bottom = the keel | 0 |
| **Totals** | **7749** | | | **28745** |

### 1.2 `KG`

```
KG = Σ(m·z) / Σm = 28745 / 7749 = 3.71 in = 0.0942 m     [X from M+A]
```

Two reference values worth carrying:

- **Hull-only `KG`** (excluding the stem, pod, and the external cabling run — i.e. the floating
  body without its pendant): `KG_hull = (28745 + 2400 + 2700 + 180) / (7749 − 400 − 200 − 60)
  = 34025 / 7089 = 4.80 in = 0.122 m`. The pendant pulls the composite `KG` down by 1.09 in.
- **The single largest destabilising item is the solar panel + mount** (1020 g at `z` ≈ 10.3 in,
  contributing 10 900 g·in — 38% of the total moment from 13% of the mass). The single largest
  stabilising item is the **sensor pod + stem** (600 g at `z` ≈ −8.5 in, −5100 g·in).

**Sensitivity.** `KG` is most sensitive to the solar-panel mass and height and to the pod/stem
depth. A ±50% swing on the solar panel (0.35–1.05 kg) moves `KG` by ∓0.4 in; doubling the pod
mass to 0.4 kg moves `KG` down 0.35 in. None of these threatens the stability margin
([§4](#4-metacentric-height--gm)) — `GM` stays above 8 in across the whole plausible range.

---

## 2. Centre of buoyancy — `KB`

`KB` is the centroid of the **submerged volume** at the nominal draft `T` = 2.53 in. The
submerged shape is the piecewise `V_disp(T)` from the
[freeboard model §7.2](buoy-mass-displacement-and-freeboard-model.md#72-displaced-volume-as-a-function-of-draft-v5):

| Sub-volume | Volume (L) | Centroid `z` (in) | Basis |
|---|---:|---:|---|
| Wedge-bottom taper zone, 6 wedge bottoms (`z` 0–2) | 4.116 | 1.25 | frustums narrowing downward → centroid above mid-height |
| Chassis core, lower 2 in (`z` 0–2) | 0.851 | 1.00 | uniform cylinder segment |
| Parallel float zone (`z` 2–2.53) | 2.230 | 2.27 | uniform disc slice |
| **Submerged total** | **7.197** | | |

```
KB = (4.116·1.25 + 0.851·1.00 + 2.230·2.27) / 7.197
   = (5.145 + 0.851 + 5.062) / 7.197
   = 11.058 / 7.197
   = 1.54 in = 0.0390 m     [X from M+A]
```

The submerged volume (7.20 L) matches the freeboard model's `V_req` of 7.197 L — a consistency
check on the equilibrium.

---

## 3. Metacentric radius — `BM`

```
BM = I_wp / V_disp     [X]
```

**Waterplane second moment of area `I_wp`.** In the parallel zone the six foam-filled wedges
tile the full R2.875–R9.000 annulus and the chassis fills the inner disc, so the waterplane is a
**solid Ø18 in circle** ([freeboard model §7.1](buoy-mass-displacement-and-freeboard-model.md#71-waterplane-area-parallel-zone)).
About any diameter (the roll axis):

```
I_wp = π D⁴ / 64 = π · (18.000 in)⁴ / 64 = π · 104976 / 64 = 5152.8 in⁴     [X from M]
```

**Displaced volume** `V_disp` = 7.197 L = 439.2 in³ (`7197 cm³ / 16.387 cm³·in⁻³`).

```
BM = 5152.8 in⁴ / 439.2 in³ = 11.73 in = 0.298 m     [X from M+A]
```

This is the dominant term and it is huge — a direct consequence of the wide, shallow-draft disc
form (`BM ∝ D⁴ / V`, and `V` is small because the buoy barely sits in the water).

---

## 4. Metacentric height — `GM`

```
KM = KB + BM = 1.54 + 11.73 = 13.27 in     [X from M+A]
GM = KM − KG = 13.27 − 3.71 = 9.56 in = 0.243 m     [X from M+A]
```

| Quantity | Value |
|---|---|
| `KG` | 3.71 in (0.094 m) |
| `KB` | 1.54 in (0.039 m) |
| `BM` | 11.73 in (0.298 m) |
| `KM` | 13.27 in (0.337 m) |
| **`GM`** | **9.56 in (0.243 m)** |
| Hull-only `GM` (no pendant) | 13.27 − 4.80 = 8.47 in (0.215 m) |

**Interpretation.** Any positive `GM` means the buoy is statically stable in the upright
position; a typical small craft targets `GM` on the order of a few percent of the beam
(≈ 0.5–1 in here). S.C.O.U.T.'s `GM` is **~10 in — an order of magnitude more than needed.**
The buoy cannot be made to float other than upright by any realistic payload shift, and it
follows the slope of the design wave (max slope `πH/L` = `π·1.2/25.55` = 0.148 rad = **8.5°**)
with a righting moment to spare (see [§6](#6-small-angle-righting-and-the-design-wave)).

The cost of this much stiffness is a very short roll period ([§5](#5-natural-roll-period)) —
"corky" motion and high angular accelerations in short nearshore chop. This was already
anticipated qualitatively in the [freeboard model §10](buoy-mass-displacement-and-freeboard-model.md#10-interpretation);
this section quantifies it.

---

## 5. Natural roll period

```
T_roll = 2π · k / √(g · GM)     [X]  (small-amplitude, undamped)
```

`k` = roll radius of gyration about the longitudinal axis through `G`. For a uniform disc about
a diameter `k = R/2 = 4.5 in`; the real buoy has mass concentrated away from the axis — the
solar deck ~10 in up and the pod ~13.5 in down — which raises `k`. Estimating from the §1 mass
distribution, the mean-square height spread about `KG` gives **`k` ≈ 5.5 in = 0.140 m [A]**
(dominated by the pod and the solar panel; refine once real component placement is modelled).

```
T_roll = 2π · 0.140 / √(9.81 · 0.247)
       = 0.880 / √2.423
       = 0.880 / 1.557
       = 0.57 s     [X from M+A]
```

**`T_roll` ≈ 0.6 s** (bracket 0.5–0.7 s for `k` = 4.5–6.5 in).

The design wave period is `T_w` = 6 s — **~10× the roll period.** The buoy is far from roll
resonance (which would need wave energy near 0.6 s, i.e. ~0.5 m wavelength ripples that carry
negligible energy). In the design sea state the buoy quasi-statically follows the instantaneous
water surface slope. The practical consequences:

- **No dynamic roll amplification** — heel stays near the wave-slope value (~8.5° peak).
- **High vertical and angular accelerations** in steep short chop — a snap response. Relevant to
  the mounting of the solar panel and any loosely-retained internal component (fasteners,
  connectors, battery restraint), and to the hydrophone noise floor (self-noise from rig
  motion). Not a stability problem; a component-retention and data-quality note.

---

## 6. Small-angle righting and the design wave

For heel angles below deck-edge immersion the wall-sided approximation holds:

```
GZ(φ) ≈ GM · sin φ
Righting moment  M_R(φ) = W · GZ(φ) = W · GM · sin φ
```

`W` (nominal) = 7.594 kg · 9.81 = **74.5 N**. `W · GM` = 74.5 · 0.247 = **18.4 N·m** (the
maximum small-angle righting moment coefficient).

**Deck-edge and keel angles** (where the wall-sided formula starts to break down):

```
high-side keel emerges:   tan φ = T / R = 2.50 / 9.00  → φ = 15.5°
low-side deck immerses:    tan φ = FB / R = 5.00 / 9.00 → φ = 29.1°
```

**Against the design wave slope (8.5°):**

```
M_R(8.5°) = 74.5 · 0.247 · sin(8.5°) = 74.5 · 0.247 · 0.1478 = 2.72 N·m
```

The heeling moment from riding a wave slope is `W · GM · sin(θ_slope)` by the same relation
(the buoy simply aligns to the local "apparent vertical"), so the buoy tracks the slope with the
full 18.4 N·m coefficient available — it is nowhere near its small-angle limit. **Wave-slope
following is a non-issue.**

**Large-angle / range of stability.** Past ~15–29° the immersing wedge and emerging keel change
the waterplane and the wall-sided formula no longer applies. Two effects then dominate and both
are favourable: (a) the disc form means the low edge picks up a large buoyant "wedge" at a big
lever arm as it immerses — strong form stability; (b) the pod pendant adds
`W_pod · L_pendant · sin φ` = `(0.2·9.81)·(13.5·0.0254)·sin φ` = 0.673·sin φ N·m, small but
always restoring. A precise `GZ(φ)` curve to the angle of vanishing stability needs the heeled
hydrostatic integration (cross-curves), which is beyond a hand calculation — it is deferred to
the CAD/hydrostatics tool or the physical tilt test ([SCO-82](https://linear.app/scout1/issue/SCO-82)).
Given the `GM` and the form, the range of positive stability is confidently **> 90°**; the buoy
is effectively self-righting from any knock-down.

---

## 7. Damaged stability — one flotation wedge lost

The [freeboard model §9.2](buoy-mass-displacement-and-freeboard-model.md#9-failure-mode-freeboard-panel-review-action-a3)
established that losing one wedge module (shell + cap + bottom + its foam, 665 g) raises the
draft only ~0.1 in but **"introduces an asymmetric 60° flotation gap → a static list … quantifying
that heel angle is stability work."** Here it is.

The lost wedge sits at sector-centroid radius `r` ≈ 6.0 in (mass) / ≈ 5.5 in (its wetted
buoyant volume), taking the gap direction as `+y`.

**Transverse shift of `G`** (removing 0.665 kg at `+y`, `r` = 6.0 in, from `M` = 7.594 kg):
```
Δy_G = −(0.665 · 6.0) / 7.594 = −0.525 in   (G moves toward the intact side)
```

**Transverse shift of `B`** (removing ~1.03 L of submerged volume at `+y`, `r` = 5.5 in, from
`V` = 7.05 L — the parallel-zone wetted slice for that wedge ≈ 0.35 L plus its fully-submerged
wedge bottom ≈ 0.68 L):
```
Δy_B = −(1.03 · 5.5) / (7.05 − 1.03) = −5.67 / 6.02 = −0.941 in   (B moves toward the intact side)
```

`B` shifts further toward the intact side than `G` does, so in the upright damaged condition
there is a residual couple `W · (Δy_G − Δy_B)` that heels the buoy **toward the gap** until the
righting moment balances it. Damaged weight `W_d` = (7.594 − 0.665)·9.81 = 68.0 N.

```
Heeling couple  M_h = W_d · (Δy_G − Δy_B) = 68.0 · (−0.525 − (−0.941)) in·N
                    = 68.0 · 0.416 in · 0.0254 m/in
                    = 0.719 N·m   (toward the gap)
```

Damaged `GM`: losing a 60° sector of the outer waterplane cuts `I_wp` by roughly
`(1 − cos³)`-weighted ~14%, so `BM_d` ≈ 10.3 in; `KG` shifts up ~0.1 in (the lost wedge mass was
below `KG`). `GM_d` ≈ 13.5·(10.3/11.97) approx → **`GM_d` ≈ 8.4 in = 0.213 m [A]**.

```
Equilibrium list:  W_d · GM_d · sin θ = M_h
                   sin θ = 0.719 / (68.0 · 0.213) = 0.719 / 14.48 = 0.0497
                   θ = 2.8°     [X from M+A]
```

**One wedge lost → ~3° static list toward the gap**, with the draft up only ~0.1 in. The huge
`GM` absorbs the asymmetry almost completely — the buoy is visibly but marginally leaning, still
well within its stability range, and still floating with ~4.9 in of freeboard on the low side.
Losing a **second adjacent** wedge roughly doubles both the heeling couple and the trim; a rough
extrapolation gives ~6–7° list and still positive stability, but that case should be run
explicitly if it becomes a design driver.

---

## 8. Heel under the mooring / environmental load

The [force budget](force-budget.md) LC7 gives a static overturning moment about the keel
pad-eye of **≈ 42 N·m at the v5 geometry** (70 N·m at v4 — see
[force budget § v5 geometry reassessment](force-budget.md)). This arises because the
environmental drag acts on the wetted float band at `z` ≈ 0.10 m while the mooring line's
horizontal reaction acts at the pad-eye at `z` = 0 — a bow-down couple that pitches the
downstream edge into the water.

**The bare hydrostatic righting capacity is `W · GM` ≈ 18.4 N·m** (nominal) — **less than the
42 N·m LC7 moment.** So under the *peak* combined load the buoy cannot be held near-upright by
metacentric righting alone; it heels into the flow until the immersing downstream edge (form
stability, not captured by `GM`) supplies the balance. A hand calculation cannot bound that
angle — it is a coupled buoy-plus-mooring equilibrium with a changing waterplane.

What *can* be said precisely:

- **Sustained heel is governed by current alone** (LC3, ~11 N at v5), because the wave and
  wave+current peaks are oscillatory at `T_w` = 6 s ≫ the 0.6 s roll period — the buoy pitches
  during each wave passage and recovers between waves, it does not hold the peak angle.
  ```
  LC3 couple  ≈ 11 N · 0.05 m = 0.55 N·m
  sin θ = 0.55 / (74.5 · 0.247) = 0.030  →  θ ≈ 1.7°
  ```
  **Sustained current heel ≈ 2°** — negligible. (v4 figure was ~6° using the higher v4 drag and
  a coarser lever arm; v5 is lower on both.)

- **Peak transient heel** (during a design-wave crest with aligned current) is the open item.
  The disc has enormous edge reserve buoyancy — the downstream half can immerse several inches
  before deck-edge immersion at 29° — so the buoy very likely rides through the crest at a
  large but recoverable angle without downflooding (freeboard to the wedge top is 5.0 in, and
  the chassis lid is another 2 in above that). **Confirming this — the maximum transient heel,
  and that the chassis lid never goes under — is deferred to the coupled mooring analysis and
  the physical tilt / proof-load test ([SCO-82](https://linear.app/scout1/issue/SCO-82),
  [SCO-69](https://linear.app/scout1/issue/SCO-69)).**

- **Design implication:** lowering the drag lever arm (the shorter v5 float section already
  helped) and/or moving the mooring attachment is the lever if the transient heel comes back
  unacceptable. The 2.5 in reduction in the exposed float section from the SCO-110 resize cut
  the LC7 moment from 70 to ~42 N·m — a real, quantified benefit of that decision.

---

## 9. Results summary

| Quantity | Value | Note |
|---|---|---|
| `KG` (deployed, nominal) | 3.71 in / 0.094 m | pendant pulls it 1.1 in below the hull-only value |
| `KB` | 1.54 in / 0.039 m | |
| `BM` | 11.73 in / 0.298 m | wide shallow disc — `BM ∝ D⁴/V` |
| **`GM`** | **9.56 in / 0.243 m** | ~10× a typical adequacy target |
| Natural roll period `T_roll` | ~0.6 s | ≪ `T_w` = 6 s → no resonance, but snappy motion |
| Design-wave slope | 8.5° | followed with full righting margin |
| Deck-edge immersion / keel emergence | 29° / 15.5° | wall-sided formula valid below these |
| Range of positive stability | > 90° (est.) | precise `GZ` curve deferred to CAD hydrostatics / tilt test |
| **One wedge lost — static list** | **~3°** | draft up ~0.1 in; still well within range |
| Sustained heel under current (LC3) | ~2° | negligible |
| Peak transient heel under LC5/LC7 | **open** | `W·GM` (18 N·m) < LC7 moment (42 N·m) → heels into the flow; bound via coupled analysis + tilt test |

---

## 10. Open items

| Item | Effect | Tracked by |
|---|---|---|
| Real v5 shell weights | `KG`, `KB` shift; `GM` conclusion robust (large margin) | [SCO-110](https://linear.app/scout1/issue/SCO-110) re-slice |
| Tier III component masses + real vertical placement | `KG` and `k` (roll gyradius) firm up | [SCO-70](https://linear.app/scout1/issue/SCO-70) |
| Large-angle `GZ(φ)` curve / angle of vanishing stability | confirms range of stability and knock-down recovery | CAD hydrostatics / cross-curves, or the tilt test |
| Maximum transient heel under the peak wave+current load | confirms no lid downflooding, no capsize | coupled mooring analysis, [SCO-82](https://linear.app/scout1/issue/SCO-82) physical tilt / proof-load test |
| Roll radius of gyration `k` | tightens `T_roll` (currently `[A]` at 5.5 in) | real component placement in CAD |
| Two-adjacent-wedges-lost case | if it becomes a design driver | run explicitly against this method |

## 11. Method — re-running this analysis

1. **`KG`** — rebuild the [§1.1](#11-component-masses-and-heights) table with current masses
   (from the [mass model §3](buoy-mass-displacement-and-freeboard-model.md#3-full-mass-budget))
   and current `z_i` (from CAD once real placement exists); `KG = Σmz / Σm`.
2. **`KB`** — centroid of the submerged `V_disp(T)` piecewise volume at the current equilibrium
   draft (from the [freeboard model §7](buoy-mass-displacement-and-freeboard-model.md#7-freeboard-model)).
3. **`BM`** — `I_wp / V_disp`; `I_wp = πD⁴/64` while the waterplane stays a solid Ø18 in disc.
4. **`GM` = `KB` + `BM` − `KG`**; `T_roll = 2π k / √(g·GM)`.
5. **Damaged case** — transverse `Δy_G`, `Δy_B` from the removed wedge; `sin θ = W(Δy_G−Δy_B)/(W·GM_d)`.
6. **Mooring-load heel** — compare the LC7 moment ([force budget](force-budget.md)) to `W·GM`;
   if LC7 > `W·GM`, the sustained (current-only) heel is the reportable number and the transient
   peak is an open item.

A routine re-run (a mass changed, SCO-70 lands) only needs steps 1, 4, 5. A full re-derivation
is warranted only if the waterplane stops being a solid disc (e.g. a freeboard change that
brings the waterline into the taper zone) or the hull form changes.

---

## 12. Large-angle stability, capsize, and self-righting ballast — 2026-09-29

**Method.** The hull is taken from the committed STEP files. The wedge-bottom outer profile was
meshed (gmsh/OpenCASCADE) and matches the 2026-09-25 envelope measurement within 0.6%. The v5
wedge measures 168.7 cm³ solid, with its centroid at 5.75 in. The hull runs z 0–3.0 in for the
wedge-bottom taper (R 6.29 → 9.00 in, 45°), z 3.0–8.5 in for the Ø18 in wedge section, and z 8.5–9.0 in
for the housing flange and lid.
`GZ(φ)` is computed at constant displacement by voxel integration (2 mm grid) from 0 to 180°.
It reproduces `GM·sinφ` at small angles (5°: 0.58 vs 0.62 in). Submerged appendages (stem, pod,
hydrophone, mooring hardware, external cable) enter both the equilibrium and the moment balance at
**net-down weight**, i.e. weight minus their own buoyancy. The §1 method used their full mass for
`KG`, which overstated their ballast effect.

**Mass-budget corrections against [freeboard model §3](buoy-mass-displacement-and-freeboard-model.md#3-full-mass-budget)**
(nominal 7.749 → **8.19 kg**):

| Change | Δ (g) | Basis |
|---|---:|---|
| Flange-style electronics housing added (it had no line) | +385 | Geometry at 3/16 in walls, PETG, print-settings effective density; range 330–490 |
| Chassis cap and chassis bottom end cap removed | −180 | Housing flange + lid is now the chassis top closure; v4 chassis STEP has an integral floor |
| Wedge shell 240 → 214 g each | −155 | STEP solid 168.7 cm³ × 1.27 g/cm³ |
| Foam 710 → 834 g | +124 | STEP cavities 6 × (3.262 + 1.084 L) at 2 lb/ft³ |
| Projected electronics: audio board 25, sled 40, leak sensor 2, glands 18, antenna 30, hydrophone element 150 | +265 | [A] placeholders |
| Battery and boards moved into the housing (z ≈ 4.3–5.2 in); SEN0189 board moved to the pod | 0 | Placement |

⚠️ **Unreconciled:** the v4 chassis STEP is 2535 cm³ solid. At the [print-settings](print-settings.md)
chassis spec (6 walls, 25–30% gyroid) that implies ~1.6 kg, but the 2026-08-24 slicer weigh-in
recorded 712.82 g. This is carried as the high case (~1.38 kg for v5) until the v5 chassis re-slice.

**Results (current v5, full 3 in caps):**

| | Low | **Nominal** | High |
|---|---|---|---|
| Mass | 6.43 kg | **8.19 kg** | 12.61 kg |
| Draft / freeboard to wedge top | 2.17 / 6.33 in | **2.56 / 5.94 in** | 3.50 / 5.00 in |
| `KG` / `KB` / `BM` | 4.53 / 1.17 / 10.99 in | **4.74 / 1.41 / 10.44 in** | 4.88 / 1.98 / 7.26 in |
| **`GM`** | 7.63 in | **7.12 in** | 4.36 in |
| Max `GZ` / righting moment | 2.70 in / 4.1 N·m | **2.46 in at ~40° / 4.8 N·m** | 2.05 in / 6.1 N·m |
| **Vanishing angle** | 93° | **~90°** | 86° |

**Findings.**

1. **The buoy is stable inverted.** `GZ` stays negative from ~90° to 180°, and 180° is a stable
   equilibrium. Righting it from inverted takes ~5.6 J; capsizing it from upright takes ~4.8 J. A
   capsize should be treated as mission-ending.
2. **Form stability cannot balance the LC7 moment.** The maximum hydrostatic righting moment is
   ~4.8 N·m, against the ~42 N·m LC7 static overturning moment. This contradicts §8. Either LC7 is
   too conservative as a static load (it is oscillatory at 6 s), or the buoy is pulled down at the
   crest. Resolving it needs [SCO-82](https://linear.app/scout1/issue/SCO-82).
3. **Wedge-cap height** (with +1 kg electronics and a 1.5 kg panel as the growth case):

   | Caps | Mass | Freeboard | `GM` (growth) | Vanishing | Keel emerges at |
   |---|---|---|---|---|---|
   | Full, 3 in | 8.19 kg | 5.96 in | 7.0 (5.4) in | 90° | 22° |
   | Half, 1.5 in (est. 700 g) | 7.44 kg | 5.20 in | 9.5 (6.6) in | 87° | 13° |
   | None (flat bottom, chassis −3 in) | 6.57 kg | 4.07 in | 11.9 (8.4) in | 88° | 9° |

   Cap height does not fix capsize. Smaller caps lower everything above them, which improves `GM`
   and growth margin, at a cost in freeboard and impact/slam protection.
4. **Keel-level ballast and the keel-attached mooring pull do not self-right.** A load at z ≈ 0
   has too short a lever. Even 8 kg only moves the vanishing angle to ~120–125°.
5. **Deep ballast does.** Minimum lead for positive `GZ` from 5° to 178°, with half caps and the
   stem extended at 30 g/in to reach the lead:

   | Lead depth below keel | 6 in | 13.5 in | 20 in | **24 in** | 30 in | 36 in | 48 in |
   |---|---|---|---|---|---|---|---|
   | Lead (kg) | 7.83 | 4.41 | 3.09 | **2.58** | 2.02 | 1.64 | 1.03 |
   | Buoy total (kg) | 15.2 | 11.9 | 10.7 | **10.3** | 10.0 | 9.8 | 9.5 |
   | Freeboard (in) | 3.54 | 4.26 | 4.51 | **4.60** | 4.70 | 4.75 | 4.83 |

   Lead × depth ≈ 50–60 kg·in throughout. Returns diminish past ~30 in, where the longer stem
   eats the saving. At a 2 m site, depth past ~36 in risks seabed contact at a wave trough.

**Decision (tentative, 2026-09-29): the ballast stem is developed to 24 in below the keel.**
With half caps this means ~2.6 kg of lead and a ~10.3 kg buoy that self-rights from any angle.
Cap height and the lead mass are still open.

**Open items from this section:** the v5 chassis re-slice (the mass discrepancy above); the
stem/joint bending check with 2.6 kg at 24 in under design-wave and LC9 loads; the mooring
attachment point; site depth at low water ([SCO-96](https://linear.app/scout1/issue/SCO-96));
a buoyant-solar-mount alternative (not modelled); and committing the calculator script so this
section can be re-run from the repo.
