# Buoy Structural Engineering

> **Summary** — The buoy's structural/mechanical engineering docs, grouped together because
> they cite each other constantly: load equations, mass/buoyancy, force tracking, and print
> settings all feed one another. Split out from `docs/engineering/` on 2026-08-21 once there
> were four of them sitting flat next to unrelated docs (data schema, shore station, live
> dashboard) — the same reasoning that gave [`../reviews/`](../reviews/) its own folder.
>
> Part of [`docs/engineering/`](../). See [CONVENTIONS.md](../../CONVENTIONS.md) for the
> project's general file-placement rules.

## Contents

| Doc | What it's for |
|---|---|
| [Structural Load Framework](structural-load-framework.md) | The equations — force/moment formulas for FEA load cases on the hull, chassis, and mooring shackle. Provenance-tagged, corrected from a drafted load summary |
| [Mass and Buoyancy Budget](mass-and-buoyancy-budget.md) | **Living doc.** Weight, displacement, and buoyancy per printed part — supplies the framework's `m_b`/`V_disp` inputs |
| [Force Budget](force-budget.md) | **Living doc.** Tracks the framework's actual computed load-case values as their inputs (environmental design values, mooring hardware, full component mass) become available |
| [Print Settings](print-settings.md) | Canonical wall-count/infill spec per printed part, with the FDM-literature rationale — feeds the effective-density math in the mass/buoyancy budget |

## How these relate

`structural-load-framework.md` holds equations, not numbers — it's the derivation. The two
"living doc" files are where real numbers get filled in as inputs arrive; re-read them, not the
framework, for the current state of any given load case or part's mass. `print-settings.md` is
upstream of the mass/buoyancy budget (its wall/infill spec drives the effective-density
calculation there) and downstream of the [design panel review](../reviews/buoy-preliminary-design-panel-review-2026-08.md)
(which flagged the chassis print structure as underspecified without giving numbers).

Design-review PDFs that informed this work live in [`../reviews/`](../reviews/), not here —
that folder is scoped to panel-review write-ups generally, not just buoy-structural ones, so it
stays separate even though today it only holds one.
