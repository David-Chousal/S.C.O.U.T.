# Wedge Drop Test — 2026-09-25

> **Summary** — John Ryan dropped a single printed v5 flotation wedge. It showed **no
> deformation**. John judged this sufficient to close the impact-validation work
> ([SCO-71](https://linear.app/scout1/issue/SCO-71)), together with the 2026-09-25 v5 FEA
> re-check. This is a one-sample, informal bench check, not a controlled impact test.
>
> Part of [`mechanical/test/`](README.md). Tracks [SCO-71](https://linear.app/scout1/issue/SCO-71).

## What was done

| Item | Value |
|---|---|
| Date | 2026-09-25 |
| Tester | John Ryan (GENG) |
| Specimen | One printed v5 flotation wedge, single part (not the assembled ring) |
| Drop height | Not recorded |
| Impact surface and orientation | Not recorded |
| Foam fill | Not recorded |
| Samples | 1 |
| Result | **No visible deformation, cracking, or delamination** |

## Reading

- **Pass**, on John's judgement as GENG lead. He finds one sample sufficient.
- It is consistent with the FEA: the lowest real buoy SF at v5 loads is ~3.5 (PETG), and every
  hull load case passes ([FEA results § v5 re-check](fea-mooring-load-cases.md#results--v5-re-check-2026-09-25)).
- **What it does not show.** It is one sample, and the height, surface, and orientation were
  not recorded, so the drop energy is unknown. It was one wedge, not the bolted-and-epoxied ring
  with the lean wedge bottom. So it is not a quantitative survivability target and not a
  boat-strike test. The [impact survivability analysis](../../docs/engineering/buoy-structural/impact-survivability-analysis.md)
  Scenario C (drop onto the base, lean wall section) was not specifically exercised.
- **The SF ≥ 4 placeholder** in this folder's [README](README.md) stays a study-only check. The
  team has accepted the v5 margins (min real SF ~3.5 unfoamed, higher with foam) plus this drop
  as sufficient, rather than deriving a formal SF target.

## If this is revisited

Record the drop height, surface, and orientation. Test a foam-filled wedge on its wedge bottom,
drop it onto the base, and use at least 3 samples. That would give the impact analysis a
measured energy to calibrate against.
