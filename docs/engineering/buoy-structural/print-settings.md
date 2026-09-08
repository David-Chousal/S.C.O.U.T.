# Print Settings — Buoy Structural Parts

> **Summary** — Canonical wall-count and infill spec for every printed part of the buoy shell,
> with the reasoning behind each. **Provisional pending FEA** — derived from FDM/PETG
> structural-print literature, not yet checked against real load data
> ([SCO-73](https://linear.app/scout1/issue/SCO-73)). Feeds the effective-density calculations
> in [Buoy Mass and Buoyancy Budget](mass-and-buoyancy-budget.md).
>
> Part of the [Knowledge Hub](../../hub/README.md)'s supporting engineering docs. Logged as a
> decision in [`decision-log.md`](../../hub/decision-log.md) (2026-08-21); canonical value in
> [`facts.md`](../../hub/facts.md#mechanical--deployment).

---

## Shared print parameters

| Parameter | Value | Source |
|---|---|---|
| Layer height | 0.20 mm | Existing design basis — already in PETG's favorable range (0.12–0.20 mm) for interlayer bonding |
| Nozzle | 0.4 mm | Existing design basis |
| Line width per wall | ~0.42 mm | Standard for a 0.4 mm nozzle |
| Material | PETG | Existing design basis |
| Print orientation | Chosen deliberately so the mooring load path runs within layers (XY), not across them (Z) — PETG is meaningfully anisotropic; a 90° raster/layer angle can cut flexural strength >40% | [Research Library → PETG mechanical properties](../../hub/research/sources.md#petg-mechanical-properties--print-anisotropy) |

## Per-part spec

| Part | Walls | Infill | Effective wall thickness | Rationale |
|---|---|---|---|---|
| Wedge (shell) — **v5, 2026-09-07** | perimeters only | 0% (solid perimeters) | **outer curved wall 0.095 in / 2.41 mm (~6 passes); radial side walls + internal web 0.063 in / 1.60 mm (~4 passes) — sides go to 0.080 in only if wedges are foamed pre-assembly or the seam faces don't bear** | Non-primary, **foam-backed and now foam-dependent for the outer wall against external pressure** — see [wedge wall-thickness check, 2026-09-07](../../../mechanical/test/wedge-wall-thickness-structural-check-2026-09-07.md). The radial faces are paired face-to-face with the neighbouring wedge (six 60° wedges tile the annulus), so 0.063 in sides are adequate if the seam bears. Internal bracing web is **mandatory** (DFM: thin open walls flexed on the bed; also halves every panel span). Foam must be in before any submersion. Bolt loads on the ~0.69 in inner flange only |
| Wedge (shell) — v4 (superseded) | 3–4 | ~15% gyroid | ~1.2–1.6 mm (perimeters only, at 0.25 in CAD wall) | Non-primary, foam-backed — panel-review endorsed. Foam supplied redundant buoyancy if the shell was breached. Superseded by the v5 thin-wall row above |
| Wedge bottom cap | 3–4 | ~15% gyroid | Same as v4 wedge (not yet re-specced for v5) | Same family; carries the primary grounding/waterline impact role, so kept thicker than the v5 shell pending [SCO-71](https://linear.app/scout1/issue/SCO-71) |
| Wedge cap | 3–4 | ~15% gyroid | Same as v4 wedge | Same family, same reasoning; **vent during the foam pour** so fill pressure can't bow the thin v5 walls |
| **Any heat-set insert boss, on any part** | **Locally solid — no infill gaps** | **0% (fully solid locally)** | Boss OD ≥ 2× insert diameter | Insert pull-out strength depends on solid perimeters around the hole, not bulk infill density — infill contributes almost nothing to retention |
| Chassis (general body) | 6 | 25–30% gyroid | ~2.4–2.7 mm | Primary mooring-load structure — walls dominate FDM structural strength over infill; today's spec roughly doubles perimeter count vs. the wedge family |
| Chassis at the U-bolt/mooring boss | 8–10+ | Locally 100% solid | Full local thickness | Critical single-point-failure region (panel review) — bearing/pull-out load needs solid material, not infill |
| Chassis cap | 6 | 25–30% gyroid | ~2.4–2.7 mm (provisional) | Matches the chassis standard until [SCO-68](https://linear.app/scout1/issue/SCO-68) resolves whether it's load-bearing (top O-ring/fastener boundary) |

## Why walls, not infill

Wall count dominates infill for FDM structural strength — a print behaves like a hollow
tube/I-beam, where the shell carries load and infill mainly braces the shell against local
buckling:

- 2→5 wall loops: **+60% strength for +20% material**
- Infill 20%→80%: **+25% strength for +150% material** (sharply diminishing returns)

Full citations and what each was used for: [Research Library → FDM wall count vs. infill](../../hub/research/sources.md#fdm-wall-count-vs-infill--structural-strength).

## Effective-density conversion

For mass-budget purposes, a CAD-modeled wall of thickness `t` isn't uniformly solid at these
wall counts — walls are generated from both surfaces and the remaining core is filled at the
stated infill %:

```
solid_thickness    = min(2 * N * w, t)      N = wall count, w = line width (~0.42 mm)
core_thickness      = t - solid_thickness
effective_fraction  = (solid_thickness + core_thickness * infill%) / t
```

Full worked application per part: [Buoy Mass and Buoyancy Budget §1](mass-and-buoyancy-budget.md#1-constants-and-shared-geometry).

## Status

**Provisional.** The chassis family is not yet FEA-verified —
[SCO-75](https://linear.app/scout1/issue/SCO-75) (chassis print structure) and
[SCO-77](https://linear.app/scout1/issue/SCO-77) (fastener/insert strategy) track it, both
queued pending [SCO-73](https://linear.app/scout1/issue/SCO-73)'s FEA load cases.

**The v5 wedge wall spec** (2026-09-07) has a closed-form structural check —
[`wedge-wall-thickness-structural-check-2026-09-07.md`](../../../mechanical/test/wedge-wall-thickness-structural-check-2026-09-07.md):
the outer wall passes with margin foam-backed; the side walls at 0.063 in are adequate given
the paired face-to-face seam, going to 0.080 in only if wedges are foamed pre-assembly or the
seam faces don't bear. **Not yet FEA-verified, and not frozen** until the v5 STEP is exported
(seam design confirmed), the [SCO-110](https://linear.app/scout1/issue/SCO-110) mass recompute
is done, and [SCO-71](https://linear.app/scout1/issue/SCO-71) impact results exist. Update this file the
moment real load data changes any of the above.
