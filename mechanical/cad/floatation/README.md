# Floatation

CAD models for the buoy's hull and flotation structure.

## Drawings

2D drawing exports of the three-part flotation body:

- `floatation-top.pdf` — top cap
- `floatation-shell.pdf` — mid shell
- `floatation-bottom.pdf` — bottom cap

These are PDF drawing exports only. Per
[CONVENTIONS.md → File formats](../../../docs/CONVENTIONS.md#file-formats), CAD should also carry
its **native source + a STEP export**; add those alongside these drawings when available.

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

**Not yet resolved:** which iteration (or combination) is final. John Ryan will designate the
final CAD selection in a follow-up; until then, treat all of the above as historical iteration,
not a build spec. It's also not yet confirmed whether any of these numbered iterations
correspond directly to the three-part (`top`/`shell`/`bottom`) design in the PDF drawings above,
or whether that's a separate, later pass — worth reconciling once the final iteration is picked.
