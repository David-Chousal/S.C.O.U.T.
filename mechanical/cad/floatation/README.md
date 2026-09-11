# Floatation

CAD models for the buoy's hull and flotation structure.

## `current/` — the active bolted-wedge v4 design

Everything else in this folder is historical iteration (v1–v9, Outer Octagon, the pre-caps v3
bolted/integrated pass) — see [Design iteration history](#design-iteration-history) below.
**[`current/`](current/) holds only the design that's actually being built right now**, so
there's no ambiguity about which files in this folder to open. Moved here 2026-08-21 once
dimensioned drawings existed for the whole set.

Dimensioned drawings for the **current bolted-wedge v4 design** (2026-08-22), paired with their
matching STEP exports:

- [`current/chassis-floatation-bolted-v4-wedge.pdf`](current/chassis-floatation-bolted-v4-wedge.pdf) / `.step` — the main wedge shell
- [`current/chassis-floatation-bolted-v4-wedge-cap.pdf`](current/chassis-floatation-bolted-v4-wedge-cap.pdf) / `.step` — wedge cap
- [`current/chassis-floatation-bolted-v4-wedge-bottom.pdf`](current/chassis-floatation-bolted-v4-wedge-bottom.pdf) / `.step` — wedge bottom
- [`current/chassis-floatation-bolted-v4-chassis.pdf`](current/chassis-floatation-bolted-v4-chassis.pdf) / `.step` — central chassis body
- [`current/chassis-floatation-bolted-v4-chassis-cap.pdf`](current/chassis-floatation-bolted-v4-chassis-cap.pdf) / `.step` — chassis cap

These five drawings are the source data for the mass/buoyancy calculation in
[Buoy Mass and Buoyancy Budget](../../../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md).

**Weigh-in complete, 2026-08-24** — all five parts now have real slicer-measured weights,
retiring the earlier calibration-factor estimate for the parts that didn't have their own
slicer data yet. Full per-part detail: [`mechanical/test/print-weight-verification-2026-08-24.md`](../../test/print-weight-verification-2026-08-24.md).

**When a newer design supersedes this one:** move `current/`'s contents out to a version-stamped
name at the top level of this folder (matching the `-v3`/`-v9` pattern already used for history),
then move the new design's files into a fresh `current/`. Don't let `current/` silently become
stale — the whole point of the name is that it's always trustworthy.

> **⚠️ A v5 revision is in progress and not yet in `current/` (updated 2026-09-08).** John Ryan
> has reduced the wedge to 5.5 in ([SCO-110](https://linear.app/scout1/issue/SCO-110)), thinned
> the walls to 0.095 in (outer) / 0.063 in (sides), and added an internal bracing web — see
> [Thin-wall + DFM bracing-web iteration (v5)](#thin-wall--dfm-bracing-web-iteration-v5--2026-09-07)
> below.
>
> **The v5 wedge STEP is now committed** at
> [`chassis-floatation-bolted-v5-wedge.step`](chassis-floatation-bolted-v5-wedge.step) (top
> level, matching the `-v3` in-progress pattern — **not** in `current/` yet). A **lean v5 wedge
> bottom** drawing is also committed at
> [`chassis-floatation-bolted-v5-wedge-bottom.pdf`](chassis-floatation-bolted-v5-wedge-bottom.pdf)
> (2026-09-10 — see [Lean wedge bottom (v5)](#lean-wedge-bottom-v5--2026-09-10)). Still pending
> before `current/` rotates: the **v5 chassis and cap re-exports**, a **dimensioned PDF** for
> the wedge (confirming the ~0.69 in inner bolt flange survived), the **wedge-bottom STEP
> export**, and a real re-slice for weights (wedge **and** the lean wedge bottom). `current/`
> still holds the complete v4 set until then.

## Drawings (historical)

2D drawing exports of the three-part flotation body (v1–v9 concept, superseded — kept as
history, see [design-notes.md](../../../docs/hub/design-notes.md)):

- `floatation-top.pdf` — top cap
- `floatation-shell.pdf` — mid shell
- `floatation-bottom.pdf` — bottom cap

These are PDF drawing exports only, with no matching STEP export — unlike `current/`'s
drawings, which are paired. Per
[CONVENTIONS.md → File formats](../../../docs/CONVENTIONS.md#file-formats), CAD should also carry
its **native source + a STEP export**; these predate that being consistently followed.

## Design iteration history

Narrated by John Ryan (field/mechanical lead). Native source is Onshape; only STEP exports are
committed here per [CONVENTIONS.md](../../../docs/CONVENTIONS.md#file-formats).

**Concept arc:**
1. Initially considered a large CNC-machined or fabricated foam ring — wide, low profile.
2. Moved to a composite approach borrowing from surfboard construction: thin **PETG**
   3D-printed structural supports, injected flotation foam around them, marine
   antifouling epoxy/coating on top.
3. Early iterations tried single-print sections — scaling to full buoy size became difficult
   to print and handle.
4. Settled on **snap-fit components across multiple prints** — assembled with adhesives plus
   mechanical (printed) fasteners, avoiding the single-print size ceiling.

**Manufacturing approach.** Deliberately restricted to **in-house additive manufacturing**
(3D printing) rather than outsourced large-scale processes (injection molding, CNC) — those are
expensive at capstone/small-batch volume. Printing in-house saves material and cost, and keeps
iteration fast. Fit was validated by printing test components in **PLA at 1/4, 1/2, and 1:1
scale** before committing a design to full-scale, final-material (PETG) prints.

**Iterations, oldest to newest** — the numbering below is John Ryan's own concept order (file
timestamps were unreliable since everything was bulk re-exported from Onshape on the same day):

| # | File(s) | Notes |
|---|---|---|
| 1 | `floatation-v1.step` | Earliest concept |
| 2 | `floatation-v2.step` | |
| 3 | `floatation-v3-snap-concept.step` | First snap-fit concept |
| 4 | `floatation-v4-hollow-snap-concept.step` | Hollowed to cut material/print time |
| 5 | `floatation-v5-{top,middle,bottom}-section.step` | Split into 3 printed sections — this is the single-print-scaling attempt referenced above |
| 6 | `floatation-v6-symmetrical-top-section.step` | Symmetrical revision of the top section |
| 7 | `floatation-v7-octagon-{bottom,dfm}.step` | Octagonal geometry; `dfm` = design-for-manufacturing pass |
| 8 | `floatation-v8-single-connector-{chassis,part2}.step` | Snap assembly, single chassis connector |
| 9 | `floatation-v9-three-connector-{chassis,part2}.step`, `floatation-v9-bottom-{chassis,part2}.step` | Snap assembly, three chassis connector points — most recent iteration |

**Resolved, 2026-08-17:** none of v1–v9 is the final design — the bolted variant of the
wedge-based DFM/V3 family below was chosen instead. Treat v1–v9 as historical iteration, not a
build spec. It's still not confirmed whether any of these numbered iterations correspond
directly to the three-part (`top`/`shell`/`bottom`) design in the PDF drawings above, or
whether that's a separate, later pass — that reconciliation is still open on
[SCO-48](https://linear.app/scout1/issue/SCO-48).

## Wedge-based design (DFM/V3) — a separate concept from v1–v9

Two more recent Part Studios, found in the Onshape document's `With Tolerances > DFM > V3`
folder, represent a **different floatation approach** from the v1–v9 history above — not a
continuation of that numbering.

- **`chassis-floatation-integrated-v3-part{1,2,3}.step`** ("Master V3") — individual
  **floatation wedges snap into keyholes shared with adjacent wedges**, forming a ring around
  the central electronics-housing chassis cylinder, mechanically inserted and locked before the
  foam fill (below). **Tried and dropped, 2026-08-17** — see "Bolted variant chosen" below.
- **`chassis-floatation-bolted-v3-part{1,2}.step`** ("Master V3 Copy 1") — no snap/keyhole
  locking; **heat-set inserts in the chassis cylinder and bolts alone** hold the wedges in
  place. **This is the chosen variant** (2026-08-17).

**Field-replaceability.** Each wedge can be swapped out on-site without disturbing the others —
a deployment/maintenance advantage over a monolithic shell, and worth carrying into the
project's lifecycle analysis (fewer full-buoy replacements, cheaper field service).

### Bolted variant chosen — 2026-08-17

**Decision (John Ryan):** the design moves forward as the **bolted** wedge variant — heat-set
inserts in the chassis, bolts alone, no snap/keyhole locking. This corrects and completes the
2026-08-17 SCOUT Weekly meeting summary in
[`decision-log.md`](../../../docs/hub/decision-log.md), which recorded the bolted+foam choice
but predates the bottom caps below and stated the FEA safety-factor figure without the caveat
that it's a provisional test criterion, not an established target (both fixed here).

**What changed from the snap/keyhole (Master V3) design, and why:**

- **Bottom caps added**, one under each wedge, giving the floatation a thicker bottom section
  specifically for impact protection (grounding, drops, boat strikes at the waterline).
- **Print settings**: gyroid infill with many wall layers, for both the wedges and the bottom
  caps.
- **Foam fill retained.** The wedge cavities are still injected with expanding flotation foam
  after assembly — buoyancy, structure, and waterproofing-by-redundancy (a punctured wedge
  doesn't flood) in one step. Foam fill was never specific to the snap/keyhole variant; it
  applies to the bolted assembly too.
- **Radial printed webs between wedges**, inspired by surfboard stringer construction — thin
  printed sheets that resist bending the same way a stringer resists a board's flex. This is
  the source of the "I-beam" framing in the meeting write-up: not a literal I-beam, a stringer
  analogy for a thin panel under a bending moment.
- **Why bolted, not snap/keyhole:** print testing on the morning of 2026-08-17 tried to
  integrate the new bottom caps into the same body print as the wedges, using the snap/keyhole
  design's previously-working keyhole slide-in function. It didn't work as expected — the
  bottom-cap integration added complexity the keyhole slide relied on not having. The simpler
  bolted + heat-set-insert approach avoids that failure mode entirely, which is consistent with
  (though not the sole stated reason for) the decision to drop the mechanical-interlock
  prototype in favor of bolting plus epoxy.

**Not yet closed on [SCO-48](https://linear.app/scout1/issue/SCO-48):** the family choice
(bolted wedge over snap/keyhole and over Outer Octagon) is settled, but the issue's other
acceptance criteria are still open — reconciling against the three-part `top`/`shell`/`bottom`
PDF drawings, and checking buoyancy against the loaded electronics weight (itself waiting on
[SCO-49](https://linear.app/scout1/issue/SCO-49), housing dimensions).

**Print material still open.** PETG remains the current default; ABS and ASA are under
consideration (with SLA and nylon also flagged for comparison at the 2026-08-17 SCOUT Weekly).
One sample per material is planned — see [SCO-64](https://linear.app/scout1/issue/SCO-64). The
first FEA pass (below) used ABS material properties for the study; that is not a build-material
decision.

**First FEA pass — 2026-08-17.** Static side-load study (300 N) on the floatation wedges +
bottom caps: minimum safety factor 25.4 against a **provisional SF ≥ 4 pass/fail check used
for this study only** — not yet a validated target, since max expected loads haven't been
derived from first principles yet. Full results and next steps:
[`mechanical/test/fea-floatation-side-load-2026-08-17.md`](../../test/fea-floatation-side-load-2026-08-17.md).

### Cross-section fit-test print, and a validation-target pivot — 2026-08-18

**Print test (John Ryan).** Printed a cross-section of the bolted wedge — sliced to include
only a single row of the heat-set-insert bolt pattern rather than a full wedge — to check the
bolted fit against the chassis cylinder without spending the filament on a full-height piece.
Photo: `assets/photos/bolted-wedge-cross-section-fit-test-2026-08-18.jpg` (pending — file to
be added once available; see [SCO-48](https://linear.app/scout1/issue/SCO-48) for status).

**Weight datapoint.** Slicer estimate for a full-size wedge at current wall/infill settings:
**~300 g each**. This is the input the still-open buoyancy check on
[SCO-48](https://linear.app/scout1/issue/SCO-48) needs (checked against the loaded electronics
weight); logged canonically in
[`facts.md`](../../../docs/hub/facts.md#mechanical--deployment).

**Validation-target pivot.** Read against the 2026-08-17 FEA pass above (minimum safety factor
25.4 against a provisional SF ≥ 4 check), John Ryan judged the current bolted-wedge design
**over-engineered** — more structure than the buoy needs, at the cost this project is trying to
hold. Rather than continue optimizing toward an arbitrary safety-factor number, the target
becomes **impact survivability at controlled cost**: the buoy should tolerate real-world
impacts (grounding, drops, and ideally a direct boat strike) without losing function, without
requiring the SF≥4 margin used only as this study's placeholder pass/fail bar. Two verification
tracks are planned — FEA impact/drop-load simulation, and bench impact/load tests on printed
wedge or member samples, results cross-checked against each other. Tracked as
[SCO-71](https://linear.app/scout1/issue/SCO-71); see also
[`mechanical/test/README.md`](../../test/README.md) and
[`design-notes.md`](../../../docs/hub/design-notes.md).

### Chassis cap + wedge cap added — 2026-08-20

**New parts (John Ryan, modeled 2026-08-19).** Two new caps join the bolted wedge assembly:

- **Chassis cap** — a central cap over the chassis cylinder that extends slightly over the top
  of each wedge. Whether its outer diameter is **larger than the chassis** or **flush with the
  chassis** is not yet decided.
- **Wedge cap** — press-fits and is epoxied into the top of each wedge, sealing the foam cavity
  before fill.

**Assembly sequence idea.** Epoxy the wedge cap into each wedge first, then inject expanding
flotation foam into the wedge. The small gap where the chassis cap overlaps the top of the
wedge gives the foam somewhere to overflow as it expands — trimmed flush afterward for a clean
fit. This is the same role **flash** plays in injection molding (the excess material a mold
deliberately lets escape at a parting line or vent, trimmed off after the part sets) — a
useful term if searching for how others handle this kind of controlled-overflow fit.

**Open — cable routing.** Sensor/harness cables need to exit through the chassis cap and drape
down the side of the buoy; not yet decided whether that's a **channel down the side of one
wedge** or a **direct through-hole in the middle of one wedge**.

**Open — solar mount interface.** Likely mounts directly to the chassis cap via screws, with
slight clearance spacers between the buoy top and the solar panel. Not yet modeled against
[`solar-mount/solar-mount.step`](../solar-mount/solar-mount.step) — see
[SCO-54](https://linear.app/scout1/issue/SCO-54).

**Files added:**

- `current/chassis-floatation-bolted-v4-chassis.step` — updated chassis cylinder (heat-set insert
  geometry revised from `-v3-part1`)
- `current/chassis-floatation-bolted-v4-wedge.step` — wedge body (geometry unchanged from `-v3-part2`,
  re-exported alongside the new caps as part of the same assembly pass)
- `current/chassis-floatation-bolted-v4-wedge-bottom.step` — first CAD for the bottom cap under each
  wedge described in "Bolted variant chosen" above (impact protection at the waterline)
- `current/chassis-floatation-bolted-v4-wedge-cap.step` — the wedge cap described above
- `current/chassis-floatation-bolted-v4-chassis-cap.step` — the chassis cap described above

**Not yet closed on [SCO-53](https://linear.app/scout1/issue/SCO-53):** this is the first CAD
pass at the cable-gland cap revision that issue tracks, but the cable-routing and OD questions
above are still open, and the acceptance criteria (gland count fixed against the final sensor
set, sealing approach, submersion test) aren't addressed yet.

### Thin-wall + DFM bracing-web iteration (v5) — 2026-09-07

**Narrated by John Ryan.** Following the 5.5-in wedge / 8.5-in chassis resize
([SCO-110](https://linear.app/scout1/issue/SCO-110), decided 2026-09-03), John ran a series of
slicing passes to take mass out of the wedge shell — *"light and not to waste filament."*

**What changed:**

- **Height** — wedge and chassis both cut by the same amount until the wedge reached **5.5 in**.
- **Walls thinned iteratively**, re-sliced each pass (model weights ~168 g to ~273 g across the
  passes, vs. 325.83 g for v4). Went past "too thin," walked it back. **Landed at: outer curved
  wall 0.095 in (2.41 mm), radial side walls 0.063 in (1.60 mm).** At a 0.42 mm line width both
  are now **fully-dense perimeter shells with no infill core** — a change from v4's "3–4 walls +
  15 % gyroid."
- **Closed the previously-open cavity and added an internal bracing web** with lightening
  cutouts ("cavities / pod holes").

**Why the web — DFM, and it matters.** As an open shell, the thin side walls stood as tall,
unsupported fins joined only along the outer curved wall. At 1.6 mm and 5.5 in tall they
**flexed during printing** under the toolhead's own acceleration forces, which **broke
first-layer bed adhesion** and left surface artifacts on the prints. Connecting the walls with
an internal web braces the part stiff enough that the first layer stays down. The same web also
does structural work — it halves the free span of every wall panel and adds a third shear web
to the wedge-to-chassis load path — so **the DFM fix and the structural fix are the same
change**. This is the model DFM outcome: recognise the limit of what FDM can hold flat against
the bed, and brace the geometry rather than fight the process.

**Structural check — [`mechanical/test/wedge-wall-thickness-structural-check-2026-09-07.md`](../../test/wedge-wall-thickness-structural-check-2026-09-07.md):**

- **Outer wall 0.095 in — accepted as the floor.** SF 7.3 on yield under the 50.3 kPa (5 m)
  hydrostatic case; buckling suppressed by foam backing + the web + caps. Do not thin further.
- **Side walls 0.063 in — accepted.** John confirmed the assembly: the six wedges are **exactly
  60°**, the **radial seams are epoxied**, and **foam is poured after the wedges are bolted
  into the ring**. That makes them an epoxied closed monocoque ring — each side wall sees no
  through-thickness service pressure, the bonded 3.2 mm seam is a compression-ring path and a
  stiff composite stringer, and the foam-fill pressure is reacted by the bonded neighbour. Web
  stays mandatory (it fixed the print).
- **The epoxied 6-wedge ring is the primary structure; foam is required backing** against
  local/asymmetric loads (a single bare panel is marginal on external-pressure buckling — the
  bonded ring is much stiffer, but that needs an assembly-level buckling FEA to confirm). Foam
  must be in before any submersion until that FEA is run.
- **Bolt loads stay on the ~0.69 in inner flange**, never the thin walls — confirm the flange
  survived the v5 redesign once the STEP is exported.
- **Impact ([SCO-71](https://linear.app/scout1/issue/SCO-71)) is now more wall-thickness
  sensitive** and must be re-checked before the spec is frozen.

#### STEP exported — 2026-09-08

`chassis-floatation-bolted-v5-wedge.step` was exported and committed. Geometry read from the
STEP against the v4 wedge it supersedes:

| | v4 (`current/`) | v5 (new) |
|---|---|---|
| Height (Z) | 203.2 mm (8.00 in) | **139.7 mm (5.50 in)** — the SCO-110 resize |
| Outer radius extent (X) | 228.6 mm (R9.000 in) | 228.6 mm — **unchanged** (18 in buoy OD) |
| Wedge chord (Y) | 198.0 mm | 199.2 mm — unchanged |
| B-rep faces / circles | 20 / 14 | **36 / 26** — the added internal web + lightening holes |

**John's narration (2026-09-08):** *"shorter, thinner, with filled area between flanges with
holes for material saving and flexion around chassis and chassis access."* The web that closed
the open cavity (2026-09-07) is now also shaped as a **compliant, perforated panel spanning
between the bolt flanges** — the holes let it (a) save filament and (b) **flex to seat around
the chassis** and give **service access to the chassis** without a rigid interference fit. This
is a functional addition on top of the 2026-09-07 DFM/structural web.

⚠️ **Wall thicknesses (0.095 in / 0.063 in) and the ~0.69 in inner bolt flange are per John's
narration and the [2026-09-07 check](../../test/wedge-wall-thickness-structural-check-2026-09-07.md)
— not independently confirmed from this tessellated STEP.** A dimensioned PDF is still needed to
verify them and to close [SCO-110](https://linear.app/scout1/issue/SCO-110).

**Still to do:** v5 chassis + cap re-exports and a dimensioned wedge PDF (then rotate
`current/`), re-slice for real weights, run the
[SCO-110](https://linear.app/scout1/issue/SCO-110) mass / freeboard recompute, and add an
**assembly-level buckling FEA of the epoxied 6-wedge ring** to
[SCO-71](https://linear.app/scout1/issue/SCO-71) / [SCO-73](https://linear.app/scout1/issue/SCO-73)
scope. Check the first six-wedge dry-fit seats on the chassis without forcing (6 × exactly 60°
has no designed clearance).

### Lean wedge bottom (v5) — 2026-09-10

**Narrated by John Ryan.** The first wedge bottom was printed today off the existing (v4-era)
geometry. It was on track to consume far more filament than the part needs — the wedge bottom
is a non-structural impact/waterline cap, not a solid block — so John stopped it, re-modelled a
**lean** version in Onshape (Part Studio / drawing titled *"Lean Wedge Bottom"*), and set the
smaller part printing. **It is printing successfully as of this entry.**

**What changed, and why:**

- **Much less material.** The deep v4 trough was cut back to a shallow 60° segment tray — the
  cavity floor moved outward to **~R6.13 in inner wall / R6.25 in cavity arc** (inner fillet
  R2.881 in), against the unchanged **R9.000 in** outer radius (18 in buoy OD). Walls are
  **0.120 in** outer curved, **0.077 in** radial sides, floor ~**0.114 in**. Explicitly a
  "waste significantly less filament" pass, continuing the same intent as the 2026-09-07
  thin-wall wedge iteration.
- **Registration tabs on the top rim.** Several small tabs stand proud of the top edge so the
  wedge shell **seats firmly over the wedge bottom** rather than floating on a flat butt joint —
  positive location during the bolt-up + epoxy assembly.
- **Two bolt holes** carried through the outer face (into the chassis heat-set pattern / wedge,
  consistent with the bolted variant).

**Drawing:** [`chassis-floatation-bolted-v5-wedge-bottom.pdf`](chassis-floatation-bolted-v5-wedge-bottom.pdf)
(John Ryan, 2026-09-10, scale 1:3, inches). Committed at the top level of this folder, matching
the `-v5` in-progress pattern — **not** in `current/` yet.

**Still owed** (⚠️ the STEP export and a full dimensioned view — the PDF is a partial drawing,
plan + isometric, with **no height dimensioned and no mass**):

- **STEP export** paired with the PDF, per
  [CONVENTIONS.md → File formats](../../../docs/CONVENTIONS.md#file-formats).
- **Re-slice for real weight.** The v4 wedge bottom was 181.21 g (slicer, 2026-08-24); the lean
  part is materially lighter and its foam cavity is smaller. Until the re-slice lands, the mass
  and displacement figures in
  [Mass and Buoyancy Budget](../../../docs/engineering/buoy-structural/mass-and-buoyancy-budget.md)
  §§3–9 and §12, the
  [Freeboard Model](../../../docs/engineering/buoy-structural/buoy-mass-displacement-and-freeboard-model.md),
  the [Stability Analysis](../../../docs/engineering/buoy-structural/stability-analysis.md), and
  the [Impact Survivability Analysis](../../../docs/engineering/buoy-structural/impact-survivability-analysis.md)
  still carry the **v4 wedge bottom** (181.21 g, 0.452 L cavity, gyroid-filled thick cap) and
  are superseded on that part pending the slice.
- **Re-spec its print settings** in [Print Settings](../../../docs/engineering/buoy-structural/print-settings.md)
  (currently "same as v4 wedge, not yet re-specced for v5") and **re-check the handling-drop
  case** ([SCO-71](https://linear.app/scout1/issue/SCO-71)) — Scenario C in the impact analysis
  leans on this cap being the thick part of the shell.
- **Confirm the tabs seat** the wedge on the first dry stack-up.

## Outer Octagon — a separate, distinct design

`outer-octagon-shell.step` and `outer-octagon-bottom.step` (Onshape: `With Tolerances > Outer
Octagon > Main` / `Bottom`) are a **separate floatation concept from Master V3** — confirmed by
John Ryan, not a source/derivative relationship. It's a ribbed octagonal shell with a bottom
cap, sized around the same central chassis cylinder cutout. **Not chosen, 2026-08-17** — the
bolted wedge-based design above was selected instead; kept here as historical iteration like
v1–v9.

**Native source:** see [`mechanical/cad/README.md`](../README.md#native-source) — one Onshape
document covers the whole project, not a separate one per subsystem.
