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
| [Mass and Buoyancy Budget](mass-and-buoyancy-budget.md) | **Living doc.** Weight, displacement, and buoyancy per printed part — supplies the framework's `m_b`/`V_disp` inputs. §12 carries the v5 shell revision |
| [Buoy Mass, Displacement, and Freeboard Model](buoy-mass-displacement-and-freeboard-model.md) | Whole-buoy synthesis: as-deployed mass budget, displacement, reserve buoyancy, and the floating-equilibrium freeboard solve. v5 is the live model; v4 preserved as §14 |
| [Force Budget](force-budget.md) | **Living doc.** Tracks the framework's actual computed load-case values. Carries the v4 FEA results and the v5 geometry reassessment (every load lower at v5) |
| [Stability Analysis](stability-analysis.md) | Roll/pitch stability of the deployed buoy — `KG`/`KB`/`BM`/`GM` ≈ 9.7 in, roll period ~0.6 s, one-wedge-lost ~3° list, mooring-load heel. [SCO-80](https://linear.app/scout1/issue/SCO-80) |
| [Impact / Boat-Strike Survivability](impact-survivability-analysis.md) | Energy-method bound on boat strike and handling drop — analytical half of [SCO-71](https://linear.app/scout1/issue/SCO-71); FEA + bench still owed |
| [Print Settings](print-settings.md) | Canonical wall-count/infill spec per printed part, with the FDM-literature rationale — feeds the effective-density math in the mass/buoyancy budget |

Closed-form structural checks live under [`mechanical/test/`](../../../mechanical/test/README.md)
— the [v5 wedge wall-thickness check](../../../mechanical/test/wedge-wall-thickness-structural-check-2026-09-07.md)
(stress) and the [v5 ring-buckling check](../../../mechanical/test/wedge-ring-buckling-check-2026-09-09.md)
(external-pressure stability) — alongside the Fusion FEA reports.

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
