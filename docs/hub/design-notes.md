# Design Iteration Notes

> **Summary** — Index of design-iteration narratives: the concepts tried, why, and what was
> learned, for parts of the project with a real iteration history worth preserving. This is the
> raw process record — [`facts.md`](facts.md) holds only the current settled values, and this
> surface is not itself a source of canonical facts.
>
> Part of the [Knowledge Hub](README.md).

---

The full narrative for each row lives with the actual work (usually a CAD/firmware folder's own
`README.md`), not duplicated here. This is the index, so the history is discoverable from one
place even though the detail is scattered across the repo.

## How to add a row

Add to the top of the table. Keep the summary to one or two lines — the full story belongs in
the linked doc, written up as it's told to you, not paraphrased away.

```
| 2026-08-20 | hardware | Power board | Tried buck converter X, switched to Y for efficiency at low load | [hardware/pcb/power/README.md](../../hardware/pcb/power/README.md) |
```

---

## Log

| Date | Area | Subsystem | Summary | Full notes |
|---|---|---|---|---|
| 2026-08-15 | mechanical | Floatation | Concept arc: CNC/foam ring → PETG composite (surfboard-style construction, injected foam, marine epoxy coating) → single-print sections (scaling problems) → snap-fit multi-print assembly (adhesive + mechanical fasteners). Manufacturing deliberately restricted to in-house additive only (outsourced molding/CNC too costly at capstone batch size); fit validated via PLA scale prints at 1/4, 1/2, and 1:1 before full-scale PETG. Final iteration not yet selected — v1 through v9 preserved as history. | [mechanical/cad/floatation/README.md](../../mechanical/cad/floatation/README.md) |
