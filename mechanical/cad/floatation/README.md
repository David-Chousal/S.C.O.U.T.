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

**When a newer design supersedes this one:** move `current/`'s contents out to a version-stamped
name at the top level of this folder (matching the `-v3`/`-v9` pattern already used for history),
then move the new design's files into a fresh `current/`. Don't let `current/` silently become
stale — the whole point of the name is that it's always trustworthy.

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

## Outer Octagon — a separate, distinct design

`outer-octagon-shell.step` and `outer-octagon-bottom.step` (Onshape: `With Tolerances > Outer
Octagon > Main` / `Bottom`) are a **separate floatation concept from Master V3** — confirmed by
John Ryan, not a source/derivative relationship. It's a ribbed octagonal shell with a bottom
cap, sized around the same central chassis cylinder cutout. **Not chosen, 2026-08-17** — the
bolted wedge-based design above was selected instead; kept here as historical iteration like
v1–v9.

**Native source:** see [`mechanical/cad/README.md`](../README.md#native-source) — one Onshape
document covers the whole project, not a separate one per subsystem.
