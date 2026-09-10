# Impact / Boat-Strike Survivability — Analytical Bound

> **Summary** — First-principles energy-method analysis of the two credible impact events for
> S.C.O.U.T.: a **low-speed boat strike** at the waterline, and a **handling drop**. It bounds
> the impact energy, the buoy's absorption capacity, and the equivalent static load, and states
> what the design does and does not survive. This is the analytical half of
> [SCO-71](https://linear.app/scout1/issue/SCO-71); the **dynamic/explicit FEA and the bench
> impact tests on printed samples are still owed** and are the real validation — this analysis
> sizes them and sets expectations.
>
> **Headline.** A drifting or slow-manoeuvring boat (≤ 1–2 m/s) glancing the buoy transfers on
> the order of a few hundred joules; the compliant nylon mooring and the buoy's own inertia +
> added mass absorb most of it by simply moving. A **direct** strike above ~1.5–2 m/s delivers
> an equivalent static load of several kN to one wedge face, which **will locally crack the v5
> 0.095 in wedge shell**. The design philosophy holds this as acceptable: the foam fill means a
> cracked wedge does not flood or lose buoyancy (foam alone still lifts ~216 N, ~2.9× the
> all-up weight), the epoxied ring does not collapse from one cracked panel, and the wedge is
> field-replaceable. **Function is retained; a wedge is sacrificed.** Handling drops onto the
> wedge-bottom impact caps are survivable; drops onto the thin sidewall are not — the handling
> procedure must specify setting the buoy down on its base.
>
> **Proposed path** — `docs/engineering/buoy-structural/impact-survivability-analysis.md`

## 0. Provenance

Same scheme as the companion buoy-structural docs (`[M]` measured, `[L]` literature, `[A]`
assumption, `[X]` exact). Energy method throughout; SI units.

Constants: `g` = 9.81 m/s²; seawater added-mass coefficient for a disc heaving/surging `C_a` ≈
0.5–1.0 `[L]`; PETG `E` = 2240 MPa, yield 35 MPa, somewhat ductile `[A]`; foam #0204 crush
stress `σ_c` ≈ 200–275 kPa (≈ 30–40 psi) `[A]` (design-notes 2026-09-08, datasheet pending
[SCO-76](https://linear.app/scout1/issue/SCO-76)).

---

## 1. Scenario definition

Boat strike is **not** one of the quasi-static LC1–LC9 mooring load cases
([force budget](force-budget.md)) — it is a transient contact event and is analysed separately
here, as the [force budget](force-budget.md#fea-load-application--fusion-static-stress-setup)
notes.

| Scenario | Striker | Closing speed | Basis |
|---|---|---|---|
| **A — drift contact** | small skiff / kayak / dinghy, 200–1000 kg | 0.3–1.0 m/s | wind/current push, no power; the most likely event on a reef flat |
| **B — slow manoeuvring strike** | skiff / RIB, 500–1500 kg | 1.0–2.5 m/s (~2–5 kt) | a boat idling near the buoy that misjudges — the design "boat strike" |
| **C — handling drop** | the buoy itself, 7.6 kg | fall 0.5–1.5 m | dropped during assembly, transport, or deployment |

Scenario C at speed: `v = √(2gh)` = 3.1–5.4 m/s at contact for `h` = 0.5–1.5 m.

## 2. Impact energy

### 2.1 Kinetic energy of the striker

```
KE = ½ m v²
```

| Case | `m` (kg) | `v` (m/s) | `KE` (J) |
|---|---:|---:|---:|
| A — drift, light | 300 | 0.5 | 38 |
| A — drift, heavy | 1000 | 1.0 | 500 |
| B — strike, nominal | 800 | 1.5 | 900 |
| B — strike, hard | 1500 | 2.5 | 4700 |
| C — drop 1.5 m | 7.6 | 5.4 | 112 (= `m g h`) |

### 2.2 Fraction that reaches the buoy structure

Not all `KE` deforms the buoy. For a free-floating body struck off a compliant mooring, the
contact partitions energy between (a) accelerating the buoy + its entrained water, (b)
stretching the mooring line, and (c) local deformation at the contact. A momentum balance for a
central strike (striker mass `m_s`, buoy effective mass `m_b,eff` = hull mass + added mass):

```
buoy effective mass  m_b,eff = m_hull (1 + C_a) + entrained water in the flooded stem/pod
                             ≈ 7.6 · 1.7 + ~3   ≈ 16 kg      [A]

energy retained as local deformation (perfectly plastic contact, striker not rebounding):
   E_def ≈ KE · m_b,eff / (m_s + m_b,eff)
```

| Case | `m_s` (kg) | `KE` (J) | `E_def` fraction | `E_def` (J) |
|---|---:|---:|---:|---:|
| A — drift heavy | 1000 | 500 | 16/1016 = 1.6% | 8 |
| B — strike nominal | 800 | 900 | 16/816 = 2.0% | 18 |
| B — strike hard | 1500 | 4700 | 16/1516 = 1.1% | 50 |

The buoy is **light relative to any boat**, so the strike mostly just shoves the buoy sideways —
`E_def` is 1–2% of `KE`, tens of joules. The mooring line then absorbs the shove: 3/8 in nylon
stretches ~15–30% at working loads, so a 400 N line tension over a 1 m stretch absorbs ~200–400 J
elastically — comfortably more than the shove energy of Cases A/B nominal. (This is also why
[ADR-0004](../../decisions/0004-reef-safe-anchoring-and-mooring.md) puts the shock compliance in
the line, not the buoy penetration.)

**For Scenario C (drop)** the buoy IS the mass, so `E_def` ≈ full `KE` ≈ 112 J, minus what the
landing surface and rebound take (~30–50%) → **~60–80 J into the structure.**

## 3. Buoy absorption capacity at the contact

Energy the wedge + foam can absorb before the shell fractures, for a ~100 mm × 100 mm contact
patch:

**Foam crush** (behind the wall, depth `d_c` before densification):
```
E_foam = σ_c · A_patch · d_c · η
       = 240e3 Pa · (0.1 · 0.1) m² · 0.03 m · 0.6
       = 43 J        [A]  (η = crush efficiency)
```

**PETG shell local bending to fracture** (0.095 in wall, patch ~100 mm, ductile-ish PETG,
deflection to crack ~5–8 mm):
```
E_shell ≈ ½ · k_wall · δ_f²  with k_wall ≈ 48 D / b² per the panel stiffness
        ≈ ½ · (48 · 3.065 / 0.1²) · (0.006)²
        ≈ ½ · 14 710 · 3.6e-5
        ≈ 0.26 J        [A]  — small; PETG panel is not a meaningful energy absorber in bending
```
(The shell contributes more through membrane stretching and tearing once it starts to fail —
order 5–20 J for a ~100 mm tear — but by then it is already cracked.)

**Total elastic/pre-crack absorption ≈ 45–65 J at the contact** (foam-dominated).

## 4. Outcome by scenario

| Scenario | `E_def` into structure | vs. ~50 J pre-crack capacity | Outcome |
|---|---:|---|---|
| **A — drift contact** | 5–15 J | well under | **No damage.** Foam absorbs it; buoy shoves off. |
| **B — strike, nominal (1.5 m/s)** | ~18 J | under, but close | **Marginal — likely a scuff / dent, possibly a hairline crack** in the outer wall. Foam intact, no flooding. |
| **B — strike, hard (2.5 m/s)** | ~50 J | at the limit | **Outer wedge wall cracks locally.** Foam core exposed but not lost (closed-cell, does not absorb water). |
| **C — drop onto a wedge bottom (1.5 m)** | 60–80 J | over the sidewall limit, but the impact cap is thicker | **Survivable** — the wedge-bottom impact cap is specifically gyroid-filled and many-walled for this; contact ~280 kPa over ~0.02 m² is within its capacity. |
| **C — drop onto the thin sidewall** | 60–80 J | 1.5× over | **Sidewall cracks.** Handling procedure must forbid this. |

### 4.1 Equivalent static load (for sizing the FEA screen)

If `E_def` is arrested over a stroke `δ` (foam crush + wall deflection + buoy motion, ~30–60 mm):

```
F_eq ≈ E_def / δ_arrest
```

| Case | `E_def` (J) | `δ` (m) | `F_eq` (kN) on one wedge face |
|---|---:|---:|---:|
| B — nominal | 18 | 0.04 | 0.45 |
| B — hard | 50 | 0.04 | 1.25 |
| C — drop | 70 | 0.02 | 3.5 |

This brackets the [force budget](force-budget.md#fea-load-application--fusion-static-stress-setup)'s
**"1–2 kN localised point / 25 mm patch" quasi-static impact screen** as a reasonable
first-look equivalent for a hard boat strike, and says the drop case (onto the sidewall) is
worse (~3.5 kN) — which is why the drop must land on the impact cap.

## 5. Why the design accepts wedge cracking

The [2026-08-18 validation-target pivot](../../hub/design-notes.md) set the goal as **"impact
survivability at controlled cost"** — *not* "no damage." A cracked wedge shell is an acceptable
outcome because every consequence of it is bounded and benign:

| Consequence of a cracked wedge | Why it's survivable |
|---|---|
| Loss of that wedge's shell buoyancy | The **closed-cell foam does not flood** — the wedge still displaces its full envelope. Even with the shell *entirely gone*, the six foam cores alone lift ~216 N ≈ 2.9× the 74 N all-up weight ([mass model §4.3](buoy-mass-displacement-and-freeboard-model.md#43-failure-mode-number--buoyancy-of-the-foam-alone-printed-shell-entirely-gone)). |
| Structural collapse of the ring | One cracked panel out of six bonded 60° segments — the epoxied ring redistributes; it does not unzip ([ring-buckling check](../../../mechanical/test/wedge-ring-buckling-check-2026-09-09.md)). |
| Water ingress to the electronics | The wedges are **outside** the sealed chassis — a cracked wedge is not a leak path to the PCB. |
| Permanent loss of function | Wedges are **field-replaceable** — swapped on the next service visit without disturbing the rest. |
| Stability | Losing a whole wedge module gives only a ~3° list ([stability §7](stability-analysis.md#7-damaged-stability--one-flotation-wedge-lost)); a cracked-but-present wedge is far less. |

The **v5 thinning makes the wedge *more* impact-vulnerable than v4** (0.095 in vs 0.250 in
outer wall) — this is a real, accepted trade against the ~1 kg mass saving. The mitigations
above are what make it acceptable; the trade should be revisited if the bench impact tests show
the cracks propagate into the bonded seams or the chassis.

## 6. What the FEA and bench tests must close

| Test | Purpose | Owner |
|---|---|---|
| Explicit/dynamic FEA, boat-strike (~1–2 kN, 25 mm patch, at the waterline on a wedge face and on a seam) | Confirm the crack stays local — does not run into the epoxied seam or reach the chassis | [SCO-71](https://linear.app/scout1/issue/SCO-71) |
| Bench impact / drop test on printed wedge samples (pendulum or drop rig, instrumented) | Real fracture energy and crack path for the v5 wall spec; validate the `~50 J` pre-crack capacity estimated in §3 | [SCO-71](https://linear.app/scout1/issue/SCO-71) |
| Drop test onto the wedge-bottom impact cap | Confirm the handling-drop case (Scenario C) survives on the cap | [SCO-71](https://linear.app/scout1/issue/SCO-71) |
| Foam #0204 crush-stress datasheet / coupon | Firm up `σ_c` (assumed 240 kPa) — drives the §3 absorption capacity | [SCO-76](https://linear.app/scout1/issue/SCO-76) |

## 7. Handling guidance (for the deployment procedure)

- **Set the buoy down on its base** (the wedge bottoms / chassis end cap), never on a wedge
  sidewall or the sensor stem.
- Lift by the chassis or a dedicated lifting point, not by the solar mast or the stem.
- Transport the wedges foam-filled where possible; a foam-empty wedge shell is fragile
  (§4, and it must not be submerged — [ring-buckling check](../../../mechanical/test/wedge-ring-buckling-check-2026-09-09.md)).
- Carry 1–2 spare wedge modules to the deployment site for field replacement.
