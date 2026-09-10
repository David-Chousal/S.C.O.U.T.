# Wedge Wall-Thickness Structural Check — 2026-09-07

> **Summary** — First-principles structural check of the **thinned flotation-wedge walls**
> (outer curved wall **0.095 in / 2.41 mm**, radial side walls **0.063 in / 1.60 mm**) John
> Ryan iterated to during the 2026-09-03→05 slicing passes, at the new 5.5-in wedge height
> ([SCO-110](https://linear.app/scout1/issue/SCO-110)). Runs the wedge-relevant load cases from
> [`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md) (LC3–LC5 wave/current,
> LC8 hydrostatic) plus two loads that framework doesn't cover — **foam-fill expansion pressure**
> and **print/handling flex** — as closed-form hand calculations.
>
> **Verdict:** the **outer wall at 0.095 in is acceptable and is the floor** — do not thin it
> further. The **side walls at 0.063 in are accepted** — each is paired face-to-face with the
> neighbouring wedge in an **epoxied closed ring** (John confirmed: exactly 60° wedges,
> epoxied seams, foamed after ring assembly — [§5.0](#50-the-radial-faces-are-paired--the-side-walls-are-not-isolated-panels)),
> so it sees no through-thickness service pressure and the bonded 3.2 mm seam is both a
> compression-ring path and a stiff stringer. The internal bracing web John added is
> **load-bearing and mandatory, not just a print aid**. The foam fill is retained as
> **required backing for the outer wall** (foam in before any submersion) — conservatively,
> pending an assembly-level buckling check now that the ring is bonded ([§8](#8-the-foam-and-the-failure-philosophy)).
>
> **[Rev 2, 2026-09-07]** — the side-wall recommendation was made conditional after John Ryan
> pointed out the radial faces are paired; see [§5.0](#50-the-radial-faces-are-paired--the-side-walls-are-not-isolated-panels)
> and [§5.5](#55-confirmed-by-john-2026-09-07).
>
> **[Rev 3, 2026-09-07 — resolves the side walls]** John confirmed all three
> [§5.5](#55-confirmed-by-john-2026-09-07) questions: each wedge is **exactly 60°** (faces tile
> in contact), the **seams are epoxied**, and **foam is poured after the wedges are bolted into
> the ring**. Together that makes the six wedges an **epoxied closed monocoque ring** — the
> radial seams are true 3.20 mm composite bonds carrying moment and tension, not just contact —
> and the foam-fill pressure is reacted by the neighbouring (already-bonded) wall.
> **→ The side walls at 0.063 in are accepted, no remaining conditions.** The 0.080 in
> alternative is moot. The internal bracing web stays mandatory (it fixed the print). The
> outer-wall foam requirement is retained conservatively pending an assembly-level buckling
> check — see [§8](#8-the-foam-and-the-failure-philosophy).
>
> **Not a substitute for FEA or the [SCO-71](https://linear.app/scout1/issue/SCO-71) impact
> test.** These are conservative closed-form bounds to answer "is this wall spec sane before
> committing print time," not a validated sign-off. Impact/boat-strike survivability is
> materially more sensitive to wall thickness now and is explicitly out of scope here.
>
> Part of the [Knowledge Hub](../../docs/hub/README.md)'s test records. Feeds
> [SCO-110](https://linear.app/scout1/issue/SCO-110) (wedge resize), informs
> [SCO-71](https://linear.app/scout1/issue/SCO-71) (impact) and
> [SCO-48](https://linear.app/scout1/issue/SCO-48) (final flotation iteration).

---

## 0. Provenance legend

Same scheme as the [Buoy Structural Load Framework §0](../../docs/engineering/buoy-structural/structural-load-framework.md#0-provenance-legend):
**[M]** measured / from a dimensioned drawing · **[E]** environmental design input · **[L]**
literature / material constant · **[X]** exact relation · **[A]** conservative modelling
assumption.

---

## 1. What changed, and why John changed it

### 1.1 The iteration, in John Ryan's words

1. **Height.** Reduced the wedge and chassis by the same amount until the wedge reached
   **5.5 in** (from 8.0 in); chassis follows to 8.5 in. Decided against the freeboard model —
   trades the 4.75× reserve-buoyancy margin for a still-comfortable ~3.9× and saves ~1 kg of
   print ([SCO-110](https://linear.app/scout1/issue/SCO-110), chat decision 2026-09-03).
2. **Then made it thinner.** Iteratively thinned the outer curved wall and the radial side
   walls, re-slicing each time (screenshots committed alongside this doc — model weights ran
   ~168 g to ~273 g across the passes vs. 325.83 g for the v4 wedge). Went past "too thin,"
   walked it back. **Landed at: outer wall 0.095 in, side walls 0.063 in.** Goal stated
   explicitly: *"light and not to waste filament."*
3. **Closed the open cavity and added an internal bracing web with lightening cutouts**
   ("cavities / pod holes"). **Reason — DFM, highlighted strongly below (§2).**

Video of the first print of the 5.5-in design: `video_2026-09-05_01-26-37.mp4` (John Ryan's
local machine, ~43 MB — not committed; see [§11](#11-artifacts)).

### 1.2 CAD status — the new geometry is NOT yet in the repo

The committed `current/` set is still `chassis-floatation-bolted-v4-*` (0.250 in wall, 8.0 in
height). The thin-wall + web revision exists only as slicer screenshots and John's description
as of this doc. **Action:** John exports `floatation-v5-*` STEP + a dimensioned PDF and rotates
`current/` per the [floatation README](../cad/floatation/README.md#current--the-active-bolted-wedge-v4-design)
convention. This check uses the dimensions John stated and the v4 drawing for everything
unchanged; **numbers here are provisional until the STEP confirms the geometry** (web position,
whether the 0.69-in bolt flange survived — see [§6](#6-bolt-attachment--unchanged-and-it-must-stay-that-way)).

---

## 2. Design-for-manufacturing finding — **this is the important part**

**The thin walls could not be printed reliably as an open shell.** As printed, the two radial
side walls stood as tall, unsupported, thin fins joined only along the outer curved wall, with
the cavity between them open toward the chassis end. At 0.063 in (1.6 mm) and 5.5 in tall, the
walls **flexed during printing** — under the toolhead's own acceleration/deceleration forces
(the torque and rapid direction changes an FDM gantry imparts to a compliant tall thin part) —
and that flex **broke first-layer bed adhesion**, producing surface artifacts and defects on
the prints.

**The fix: connect the previously-open walls with an internal bracing web** (with lightening
cutouts so it costs little mass and lets foam flow through during fill). This braces the side
walls against each other and against the outer wall, so the part is stiff enough during
printing that the first layer stays down and the walls track true.

This is textbook design-for-additive-manufacturing: a tall, thin, unsupported wall is at the
edge of what FDM can hold flat against the bed, and the process forces (nozzle motion, part
compliance, thermal) show up as **real geometric defects**, not just cosmetic ones.
**Recognising the limitation and adding a brace that turns three weak independent panels into
one connected, mutually-supporting structure is the correct response** — and, as §3–§5 below
show, the same web that fixes the print also does structural work (it halves the free span of
every wall panel and adds a third shear web to the wedge-to-chassis load path). **The DFM fix
and the structural fix are the same change.** That is the ideal outcome of a DFM pass and is
worth carrying forward as a design principle for the rest of the printed structure.

---

## 3. Inputs

### 3.1 Geometry (thin-wall wedge)

| Quantity | Value | Tag |
|---|---|---|
| Sector angle | 60° = π/3 rad | [X] — 6 wedges tile 360° |
| Outer radius `R_o` | 9.000 in = 228.60 mm | [M] — v4 drawing, unchanged |
| Inner radius `R_i` (chassis interface) | 2.875 in = 73.03 mm | [M] |
| Wedge shell height `h` | 5.5 in = 139.70 mm | [M] — [SCO-110](https://linear.app/scout1/issue/SCO-110) |
| **Outer curved wall thickness `t_o`** | **0.095 in = 2.413 mm** | [M] — John Ryan, 2026-09-05 |
| **Radial side wall thickness `t_s`** | **0.063 in = 1.600 mm** | [M] — John Ryan, 2026-09-05 |
| Internal bracing web thickness | assume = `t_s` = 1.600 mm | [A] — confirm from STEP |
| Radial wall span, `R_o − R_i` | 6.125 in = 155.58 mm | [X] |
| Outer wall arc length, one wedge, `R_o·θ` | 239.5 mm | [X] |
| Nozzle line width | 0.42 mm | [A] |

At 0.42 mm/pass: `t_o` = 5.7 passes → **5–6 fully-dense perimeters, no infill core**; `t_s` =
3.8 passes → **3–4 fully-dense perimeters, no infill core**. Both walls are now
**solid perimeter shells**, not the "walls + 15 % gyroid core" the v4 mass budget assumed — a
change to [`print-settings.md`](../../docs/engineering/buoy-structural/print-settings.md) (§7).

### 3.2 Material — custom PETG profile (John Ryan, Fusion, 2026-08-29)

| Property | Value | Tag |
|---|---|---|
| Young's modulus `E` | 2240 MPa | [L] — repo custom profile |
| Poisson's ratio `ν` | 0.38 | [L] |
| Yield strength `σ_y` | 35 MPa | [L] — conservative vs. published PETG ~50 MPa; confirm by coupon test |
| UTS | 45 MPa | [L] |
| Print-anisotropy caveat | a 90° raster/layer angle cuts flexural strength >40 % | [L] — [`sciencedirect-layer-orientation-petg`](../../docs/hub/research/sources.md#petg-mechanical-properties--print-anisotropy) |

Print orientation is chosen so the hoop/arc load path runs **within** layers (XY), not across
them ([`print-settings.md`](../../docs/engineering/buoy-structural/print-settings.md)) — the
favourable direction for every stress computed below.

### 3.3 Foam backing

| Property | Value | Tag |
|---|---|---|
| Closed-cell 2-part PU pour foam, 2 lb/ft³ | ρ ≈ 0.032 g/cm³ | [A] — placeholder, no product chosen (panel review §11) |
| Compressive strength | ~100–170 kPa | [A] — generic 2 lb/ft³ closed-cell PU; **needs the real product datasheet** |
| Compressive modulus `E_foam` | ~2–3.5 MPa | [A] — same |
| Constrained-rise fill pressure | ~15–35 kPa | [A] — generic for a closed mould/cavity; free-rise is ~3–14 kPa, a sealed cavity that slightly over-fills can reach 100 kPa+ |

### 3.4 Loads that reach a wedge wall

From [`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md) (proposed
survival environmental set, **not team-signed-off** — [SCO-73](https://linear.app/scout1/issue/SCO-73)):

| Load | Magnitude | Nature | Notes |
|---|---|---|---|
| LC3 current drag | ~14 N total over the 6-wedge wetted band | distributed, steady | trivial |
| LC4 wave (Morison, phase-swept) | ~185 N total | distributed, cyclic | |
| **LC5 wave + current, aligned** | **~440 N total** | distributed, cyclic | governing horizontal environmental load |
| **LC8 hydrostatic (5 m test)** | **50.3 kPa external** | uniform pressure | the [`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md) note already says the wedge is *"foam-backed, so net wall stress there is low"* — quantified below |
| Foam-fill expansion | ~15–35 kPa internal | uniform, one-time, pre-cure | **not in the framework** — added here |
| Handling / assembly | ~100–200 N point | local | |
| Impact / boat strike | 1–2 kN patch (screen) | local, transient | **[SCO-71](https://linear.app/scout1/issue/SCO-71) — out of scope here** |

LC5's 440 N spread over one wedge's full outer face (`A = R_o·θ·h = 0.2395 × 0.1397 =
0.03346 m²`, a conservative "all the load into one wedge" case) is an equivalent pressure of
**13.2 kPa**, cyclic. So the **governing distributed wall pressure is LC8's 50.3 kPa**, then
foam-fill (~25 kPa), then LC5 (~13 kPa).

---

## 4. Outer curved wall

### 4.1 Membrane stress under 50.3 kPa external (foam-backed, in service) — **PASS, SF 7.3**

Thin cylindrical-shell hoop (circumferential) stress:
```
σ_θ = p · R_o / t_o
    = 50 300 Pa × 0.2286 m / 0.002413 m
    = 4.77 MPa   (circumferential compression)              [X form, M inputs]

SF on yield = σ_y / σ_θ = 35 / 4.77 = 7.3
```
The stress runs circumferentially = within the print layers = the strong direction. **Comfortable
pass on strength.** (LC5's 13 kPa gives `σ_θ = 1.2 MPa`, SF 29 — non-governing.)

### 4.2 Buckling under external pressure — the wall is thin (`R/t = 94.7`)

Bare unstiffened long-cylinder critical external pressure:
```
p_cr = [E / (4(1 − ν²))] · (t_o / R_o)³
     = [2.24e9 / (4 × 0.8556)] · (0.002413 / 0.2286)³
     = 6.545e8 × (0.010556)³
     = 6.545e8 × 1.176e-6
     = 770 Pa                                                [X form, M inputs]
```
**That is 1.5 % of the 50.3 kPa test pressure.** As a bare, unstiffened long shell this
proportion buckles at ~1/65 of the load. Three things save it:

- **Edge support.** The panel is only 60° of arc (239.5 mm) held on both radial edges by the
  side walls, top/bottom by the caps, and — with John's web — split into two ~120 mm arc
  sub-panels. Curvature parameter for a sub-panel, `Z = (b²/(R t))√(1−ν²) = (0.120²/(0.2286 ×
  0.002413)) × 0.926 = 24.2`. At `Z ≈ 24` a simply-supported curved panel's critical
  compressive stress is roughly **3–8× the flat-plate value**. Flat-plate critical (k ≈ 4,
  b = 0.120 m): `σ_cr,flat = 4 · π²E / (12(1−ν²)) · (t/b)² = 3.5 MPa`. Curved: **≈ 10–28 MPa**
  → SF ≈ **2–6** against the 4.77 MPa applied membrane stress. Marginal-to-adequate **bare**.
- **Foam elastic foundation.** Even at a soft `E_foam = 2 MPa` over a ~50 mm bearing depth,
  foundation modulus `k ≈ 40 MN/m³`. Extra buckling resistance `≈ 2√(D·k)` where `D = E t_o³ /
  (12(1−ν²)) = 3.07 N·m` → `2√(3.07 × 4e7) ≈ 22 kPa` on top of the panel capacity — **and**
  the foam's own compressive strength (~100–170 kPa) exceeds 50 kPa, so the foam simply carries
  the external pressure as a bearing block. **Foam-backed, buckling is not a concern.**
- The 5.5-in height (down from 8.0) shortens the panel, raising every buckling coefficient.
- **Closed compression ring.** The six wedges tile at exactly 60° with **epoxied seams**
  (confirmed — [§5.5](#55-confirmed-by-john-2026-09-07)), so external pressure is carried
  circumferentially around a bonded closed ring, not by six independent panels — a materially
  stiffer path against external-pressure buckling. Quantifying it needs an assembly-level FEA
  ([§8](#8-the-foam-and-the-failure-philosophy)).

**Conclusion:** the outer wall is fine **foam-backed** (SF 7.3 strength, buckling suppressed).
**Bare — unfoamed, or foam degraded/detached — it is marginal** (buckling SF ≈ 2–6, leaning on
curvature + web + caps + the closed ring). See [§8](#8-the-foam-and-the-failure-philosophy).

### 4.3 Recommendation — **keep 0.095 in (2.41 mm), do not thin further**

Five-to-six fully-dense perimeters, curvature-stabilised, foam-backed. It is the floor.

---

## 5. Radial side walls (and the internal web)

### 5.0 The radial faces are paired — the side walls are not isolated panels

**Each wedge's radial side wall sits face-to-face against the neighbouring wedge's side wall.**
The six 60° wedges tile the R2.875–R9.000 annulus
([`buoy-mass-displacement-and-freeboard-model.md` §7.1](../../docs/engineering/buoy-structural/buoy-mass-displacement-and-freeboard-model.md#71-waterplane-area-parallel-zone)),
so at every wedge-to-wedge seam there are **two 1.60 mm walls back-to-back = 3.20 mm of PETG**,
and the assembled ring is the "surfboard stringer" the
[floatation README](../cad/floatation/README.md#bolted-variant-chosen--2026-08-17) describes.
This changes the side-wall picture in three ways — **how much depends on the seam design, which
the v5 STEP must confirm** (see [§5.5](#55-confirmed-by-john-2026-09-07)):

1. **No net out-of-plane service pressure.** A side wall's outboard face is pressed against the
   neighbour's wall, **not exposed to water**. In service the only differential across it is
   (foam cavity) − (whatever is in the seam) ≈ 0. The [§5.1](#51-out-of-plane-bending-as-a-plate--bare-full-span--fail-worst-case-not-a-service-load--see-50)
   "115 MPa fail at 50 kPa" was already a non-physical worst case; face-to-face pairing means
   it is not even a hypothetical to design against. **Through-thickness pressure bending is not
   a side-wall load case.**
2. **A closed compression ring, if the faces bear.** If the wedges tile in contact (each
   exactly 60°, or epoxied at the seam), external pressure on the outer walls is reacted
   **circumferentially**, passed wedge → seam → wedge around the full ring until it closes on
   itself. Seam bearing stress `≈ hoop force / (t_s · h) = 11 500 N/m · 0.1397 m / (0.00160 ·
   0.1397) = 7.2 MPa` — trivial for PETG in compression. A closed segmented ring is **far
   stiffer against external-pressure buckling than six independent curved panels**, which also
   softens the outer-wall caveat in [§4.2](#42-buckling-under-external-pressure--the-wall-is-thin-rt--947)
   and [§8](#8-the-foam-and-the-failure-philosophy) — *provided the ring
   actually closes*.
3. **A stiffer stringer.** The paired 3.20 mm double wall resists the ring ovalising under a
   side load (LC5). Just in contact: ≈ 2× one wall's bending stiffness. Epoxied at the seam:
   a true composite, ≈ 8× (stiffness ∝ t³). Either beats the isolated-wall assumption in
   [§5.3](#53-in-plane-shear-web-stringer-action-under-lc5--pass-with-load-sharing).

**The one case pairing does *not* automatically fix is the foam-fill transient**
([§5.2](#52-with-the-web-halving-the-span--pass-for-the-manufacturing-transient-sf--2)): whether
the neighbour wall is a reaction then depends on **assembly order** — wedges bolted into the
ring *before* foaming get the neighbour's support; wedges foamed *individually before* assembly
span alone.

### 5.1 Out-of-plane bending as a plate — bare, full span — **FAIL (worst case, not a service load — see [§5.0](#50-the-radial-faces-are-paired--the-side-walls-are-not-isolated-panels))**

Free span without the web: 155.6 mm radial × 139.7 mm tall, all 4 edges supported. Uniform
pressure `q`, max stress `σ = β q b² / t²`, short side `b = 139.7 mm`, `β ≈ 0.30` (SS,
a/b ≈ 1.11):
```
at q = 50.3 kPa:  σ = 0.30 × 50 300 × 0.1397² / 0.00160² = 115 MPa   → 3.3× over yield.  FAIL
at q = 25 kPa (foam-fill), full span: σ ≈ 57 MPa                      → 1.6× over yield.  FAIL
```
Peak deflection at 50 kPa would be ~9 mm. **A bare 1.6 mm side wall does not survive any
meaningful out-of-plane pressure over its full span.** This is exactly the flex John saw on the
print bed (toolhead forces ≪ 25 kPa-equivalent, but the wall is that compliant).

### 5.2 With the web halving the span — **PASS for the manufacturing transient, SF ≈ 2**

Web at ~mid-radius → sub-panel `b ≈ 78 mm`:
```
foam-fill, q = 25 kPa:  σ = 0.30 × 25 000 × 0.078² / 0.00160² = 17.8 MPa   → SF 2.0 on yield
```
Acceptable for a **one-time, pre-cure** manufacturing transient, and further mitigated by
**venting the wedge cap during the foam pour** so pressure never builds — and, if wedges are
bolted into the ring before foaming, by the neighbouring wall acting as a reaction
([§5.0](#50-the-radial-faces-are-paired--the-side-walls-are-not-isolated-panels)). In service
(foam cured, solid), the side walls see **no net out-of-plane pressure** — the outboard face is
against the neighbour wall, not water ([§5.0](#50-the-radial-faces-are-paired--the-side-walls-are-not-isolated-panels)).

### 5.3 In-plane shear web (stringer action) under LC5 — **PASS with load sharing**

The side walls carry the outer wall's share of the ~440 N lateral load back to the chassis
bolts (the "surfboard stringer" role from the
[floatation README](../cad/floatation/README.md#wedge-based-design-dfmv3--a-separate-concept-from-v1v9)).
```
worst case, all 440 N into one wedge:  V = 440 N,  d = 139.7 mm
shear flow q = V/d = 3150 N/m
τ = q / t_s = 3150 / 0.00160 = 1.97 MPa
   vs shear yield ≈ 0.577 × 35 = 20 MPa → SF 10 on shear strength.  PASS

shear buckling: τ_cr = k · π²E / (12(1−ν²)) · (t_s/h)²,  k ≈ 5.3,  h = 0.1397 m
             = 5.3 × 9.87 × 2.24e9 / 10.267 × (0.00160/0.1397)²
             = 1.50 MPa                                            → τ (1.97) > τ_cr (1.50):
             the 1.6 mm web shear-buckles IF the full 440 N goes into one wedge.
```
But 440 N never drives one wedge alone — the flow hits ~2–3 wedge faces, so per-wedge
`V ≈ 150–220 N` → `τ ≈ 0.7–1.0 MPa < τ_cr`. Foam fill stabilises the web against buckling
(elastic foundation), the internal web adds a third shear panel, **and the paired seam wall
gives a stiffer stringer** ([§5.0](#50-the-radial-faces-are-paired--the-side-walls-are-not-isolated-panels)).
**With realistic load sharing: pass.** The bare, single-wedge-takes-all, unpaired case is
marginal — but all three of those qualifiers have to be true at once.

### 5.4 Recommendation — **0.063 in (1.60 mm) is accepted**

The first draft recommended 0.080 in unconditionally; Rev 2 made it conditional; Rev 3 accepts
0.063 in outright. The two cases that ever pushed toward 0.080 in — the foam-fill transient
(§5.2) and single-wedge shear buckling (§5.3) — are both retired by the confirmed assembly
([§5.5](#55-confirmed-by-john-2026-09-07)):

- **No through-thickness service pressure** — the outboard face is against the neighbour wall,
  not water ([§5.0](#50-the-radial-faces-are-paired--the-side-walls-are-not-isolated-panels)).
- **Foam-fill transient** — foam is poured *after* the wedges are bolted into the ring, so the
  already-bonded neighbour wall reacts the fill pressure. Vent the cap during the pour anyway.
- **Shear / stringer** — epoxied seam = a true 3.20 mm composite stringer (~8× one wall's
  bending stiffness), plus foam stabilisation and load sharing.

The internal bracing web stays **mandatory** — it fixed the print (§2) and adds a shear panel.
Going thicker on the side walls would only add mass against John's "light, don't waste
filament" goal for no structural return.

### 5.5 Confirmed by John, 2026-09-07

| Question | Answer | Consequence |
|---|---|---|
| Do the radial faces contact? | **Yes — each wedge is exactly 60°**, the six tile 360° | Closed compression ring; faces bear |
| Are the seams epoxied? | **Yes** | Bonded 3.20 mm composite — the ring carries moment/tension across the joints, effectively **monocoque**, not segmented |
| Assembly order? | **Foam poured after the wedges are bolted into the ring** | Foam-fill pressure is reacted by the bonded neighbour wall, not spanned alone |

**Tolerance note (still worth a check on the first assembly):** 6 × exactly 60° with no
designed clearance means an FDM oversize print would bind before seating, an undersize one
opens seam gaps. The epoxy bond-line absorbs both (it is gap-filling, and slight interference
just seats the ring with mild preload — which is fine, even helpful, for the ring). Confirm the
first six-wedge dry-fit seats on the chassis without forcing; add ~0.1° relief per face if it
binds.

### 5.6 What the v5 STEP still needs to confirm

- The **~0.69 in inner bolt flange** survived the thinning pass (bolt loads must land there,
  not on the 1.60 mm walls — [§6](#6-bolt-attachment--unchanged-and-it-must-stay-that-way)).
- The **web position and thickness** (assumed = `t_s` here).

**If John holds 0.063 in on the sides:** acceptable **only** with all of — (a) web retained,
(b) foam fill quality-controlled on every unit, (c) wedge cap vented during the foam pour,
(d) [SCO-71](https://linear.app/scout1/issue/SCO-71) bench impact test passed at this spec. The
2.0 mm option removes the dependence on (b) and de-risks (a) and (c).

---

## 6. Bolt attachment — unchanged, and it must stay that way

The wedge bolts to the chassis through **heat-set inserts**. Per
[`print-settings.md`](../../docs/engineering/buoy-structural/print-settings.md), an insert boss
must be **locally solid with OD ≥ 2× insert diameter** (~6 mm for M4). **A 1.60 mm side wall
cannot host an insert.** The v4 wedge drawing carries the 6-hole pattern (1.0 / 3.0 / 3.0 in
spacing, 2 columns) on a **dedicated inner flange ~0.69 in (17.5 mm) thick**. Bolt bearing,
insert pull-out, and the entire wedge-to-chassis load path run through that flange, **never**
the thin walls.

**Action:** confirm from the v5 STEP that the ≥ 15 mm bolt flange survived the thinning pass.
If the redesign moved bolt holes into a thin wall, that is a blocking finding — flag it, do not
print.

---

## 7. Impact (SCO-71) — flagged, not resolved

The 2026-08-17 side-load FEA (min SF 25.4) was run at the **6.35 mm** wall and **does not
transfer** to 2.41 mm. Plate-bending puncture resistance scales ~`t²`; membrane/tear resistance
~`t`. A 2.41 mm outer wall is markedly less impact-tolerant than 6.35 mm. **Impact/boat-strike
survivability is now materially more sensitive to wall thickness** and must be checked by
[SCO-71](https://linear.app/scout1/issue/SCO-71)'s planned FEA impact case **and** bench impact
test **before this wall spec is frozen**. The separate (thicker) wedge-bottom cap still carries
the primary grounding/waterline-impact role.

---

## 8. The foam and the failure philosophy

At the v4 0.250 in wall, the design intent (panel review §5,
[`mass-and-buoyancy-budget.md` §6](../../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md#6-foam-fill-wedge--wedge-bottom-cavities))
was: **printed shell is self-supporting structure; foam is redundant buoyancy** so a cracked
wedge doesn't lose flotation.

At 0.095 in, a **single bare wedge panel** is marginal on external-pressure buckling (§4.2).
But the confirmed assembly ([§5.5](#55-confirmed-by-john-2026-09-07)) is an **epoxied closed
monocoque ring** — six 60° wedges, bonded radial seams, foamed after ring assembly — not six
loose panels. That ring is a genuinely different (and much stiffer) structure against uniform
external pressure. So the picture is:

- **Uniform external pressure (LC8, storm push-under):** the epoxied ring likely carries this
  as a ring, foam or no foam — **but that is not hand-calc territory**; it needs an
  assembly-level buckling FEA to confirm. Until that exists, **keep foam in before any
  submersion** as the conservative rule.
- **Asymmetric / point loads (wave slam on one face, impact, one flooded neighbour):** a bonded
  ring can still hinge or dimple locally. Here the **foam backing genuinely earns its place** —
  it's a distributed elastic foundation on every panel. This is the case where "foam is
  structural, not just buoyancy" holds regardless of the ring.
- **Still true:** a *cracked but foam-filled* wedge keeps its buoyancy (closed-cell foam
  doesn't flood) — the ~271 N "shell fully gone" number
  ([`mass-and-buoyancy-budget.md` §6](../../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md#6-foam-fill-wedge--wedge-bottom-cavities))
  is unaffected.

**Net:** downgrade the language from "the shell can't support itself" (Rev 1) to **"the epoxied
wedge ring is the primary structure; foam is required backing against local/asymmetric loads
and stays mandatory before submersion until an assembly-level buckling FEA is run."** Propagate
to [`facts.md`](../../docs/hub/facts.md), [`design-notes.md`](../../docs/hub/design-notes.md),
and the panel-review failure-mode language. An assembly-level buckling FEA of the epoxied
6-wedge ring is a worthwhile addition to [SCO-71](https://linear.app/scout1/issue/SCO-71) /
[SCO-73](https://linear.app/scout1/issue/SCO-73)'s scope.

---

## 9. Mass / buoyancy — directional only (full recompute is SCO-110)

Not recomputed here. Direction: wedge shell **lighter** (screenshots ~168–273 g vs. 325.83 g)
and **shorter** (5.5 vs 8.0 in cuts wedge envelope displacement ~31 %). Net effect on the
freeboard model is a **higher draft, still heavily over-floated** — [SCO-110](https://linear.app/scout1/issue/SCO-110)'s
own estimate keeps ~3.9× reserve at nominal mass. The internal web slightly reduces foam cavity
volume (minor; the lightening cutouts pass foam through). **No flotation showstopper.** The
real recompute — with real re-sliced weights — is [SCO-110](https://linear.app/scout1/issue/SCO-110)'s
acceptance criteria against
[`mass-and-buoyancy-budget.md`](../../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md)
and [`buoy-mass-displacement-and-freeboard-model.md`](../../docs/engineering/buoy-structural/buoy-mass-displacement-and-freeboard-model.md).

---

## 10. Recorded answer — wall thickness

| Wall | John's current | This check | Basis |
|---|---|---|---|
| **Outer curved wall** | 0.095 in (2.41 mm) | **Accept as the floor — 0.095 in.** Do not thin further. | SF 7.3 on yield under LC8 50.3 kPa (§4.1); buckling suppressed by foam + web + caps (§4.2); ~6 fully-dense perimeters |
| **Radial side walls + internal web** | 0.063 in (1.60 mm) | **Accepted — 0.063 in.** (Rev 3, after John confirmed the assembly.) | Each side wall is paired face-to-face with its neighbour in an **epoxied closed ring** — exactly 60° wedges, bonded seams, foamed after ring assembly (§5.5). No through-thickness service pressure; the bonded 3.2 mm seam is a compression-ring path and a stiff composite stringer; foam-fill pressure is reacted by the bonded neighbour. The cases that pushed toward 0.080 in (§5.2, §5.3) are retired. Web stays mandatory |
| **Inner bolt flange** | ~0.69 in (17.5 mm), from v4 | **Keep ≥ 0.60 in (15 mm) local solid.** Confirm it survived the v5 redesign (§6) | M4 heat-set insert boss rule |
| **Internal bracing web** | added | **Mandatory** — load-bearing (halves every panel span, adds a shear web), not just a print aid | §2, §4.2, §5.2 |

### Conditions attached to this verdict

1. **Internal bracing web is mandatory** on every wedge.
2. **The assembly must be built as confirmed** ([§5.5](#55-confirmed-by-john-2026-09-07)):
   exactly-60° wedges, **epoxied radial seams**, **foam poured after the wedges are bolted into
   the ring**. The 0.063 in side-wall acceptance depends on all three. Confirm the first
   six-wedge dry-fit seats on the chassis without forcing.
3. **Foam fill stays mandatory before any submersion or pressure test** — conservatively,
   pending an **assembly-level buckling FEA of the epoxied 6-wedge ring** (§8). Foam is
   genuinely load-bearing against local/asymmetric loads regardless of that FEA.
4. **Bolt loads on the thick inner flange only** — confirm from the v5 STEP (§6).
5. **[SCO-71](https://linear.app/scout1/issue/SCO-71) impact check** (FEA case + bench test) at
   this wall spec **before the spec is frozen** — §7.
6. Environmental loads used are the **proposed, not signed-off** set
   ([SCO-73](https://linear.app/scout1/issue/SCO-73)); re-check if the team revises them
   (headroom is large — LC5 would have to grow ~5× to threaten the outer wall on strength).
7. Re-run against the **v5 STEP** once exported — these numbers are provisional on the stated
   dimensions and the web position.

---

## 11. Artifacts

| Artifact | Location | Committed? |
|---|---|---|
| Slicer screenshots, thinning passes (7) | this PR, `mechanical/test/` — see PR description | pending — attach to the PR |
| First-print video (`video_2026-09-05_01-26-37.mp4`, ~43 MB) | John Ryan's local machine | **No** — large undiffable binary, no repo home for video ([CONVENTIONS → File formats](../../docs/CONVENTIONS.md#file-formats)); keep local, or extract key frames as JPG to `assets/photos/` if worth preserving |
| v5 STEP + dimensioned PDF | not yet exported | **pending — John**, then rotate `current/` |

---

## 12. Method — reproducing this check

Closed-form, ~1 hour. Load set from
[`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md) §"Computed load
cases"; geometry from the wedge drawing + John's stated wall thicknesses; PETG properties from
the custom Fusion profile. Formulas: thin-shell membrane `σ = pR/t`; long-cylinder external
buckling `p_cr = E/(4(1−ν²))·(t/R)³`; flat/curved panel buckling `σ_cr = kπ²E/(12(1−ν²))·(t/b)²`
with a curvature multiplier at `Z = (b²/Rt)√(1−ν²)`; plate bending `σ = βqb²/t²`; shear web
`τ = V/(d·t)` and `τ_cr` — all standard, e.g. Roark's *Formulas for Stress and Strain*
([`roark-8e`](../../docs/hub/research/sources.md#structural--hydrodynamic-loads-fea)) and
Timoshenko *Theory of Elastic Stability*. Re-run triggers: v5 STEP exported · foam product
chosen (real compressive strength/modulus) · [SCO-73](https://linear.app/scout1/issue/SCO-73)
environmental set signed off · [SCO-71](https://linear.app/scout1/issue/SCO-71) impact results.
