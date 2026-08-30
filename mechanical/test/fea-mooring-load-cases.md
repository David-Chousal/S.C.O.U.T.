# FEA — Mooring / Structural Load Cases LC1–LC9

> **Summary** — Tracker for the FEA runs of the corrected load cases defined in the
> [Buoy Structural Load Framework](../../docs/engineering/buoy-structural/structural-load-framework.md)
> and computed in [`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md).
> One row per case: the design load + direction to apply in Fusion, whether it has been run, and
> a link to its report. **LC2 is run (2026-08-29); LC3–LC9 are John Ryan's top priority to run
> and upload.**
>
> Loads are at the *proposed* environmental design set (SCO-73 not yet signed off) — see
> [`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md#recommended-environmental-design-values--proposed-needs-team-sign-off).
> Axes: **Z** = buoy vertical (up +), **X** = the aligned environmental direction, **Y** = transverse.

## Status

| Case | Design load & vector | Applied to | Constraint | Run? | Report |
|---|---|---|---|---|---|
| LC1 | Slack-mooring catenary tension | pad-eye | — | **Blocked** — needs mooring scope `S`, line unit weight `w_m` ([SCO-69](https://linear.app/scout1/issue/SCO-69)) | — |
| **LC2** | **322 N, `(0,0,−322)`** (taut-line vertical uplift) | pad-eye / tie-down ring | chassis heat-set region fixed | ✅ **2026-08-29** — min SF 7.53, 0.012 mm | [`fea-mooring-lc2-vertical-uplift-2026-08-29.md`](fea-mooring-lc2-vertical-uplift-2026-08-29.md) |
| LC3 | ~14 N, `(+14,0,0)` (current drag) | wetted hull band `z` 0–68 mm | fix pad-eye | ⏳ pending | — |
| LC4 | ~185 N, `(+185,0,0)` (wave, phase-swept) | wetted float band `z` 0–254 mm | fix pad-eye | ⏳ pending | — |
| LC5 | ~440 N, `(+440,0,0)` (wave + current aligned) | wetted float band | fix pad-eye | ⏳ pending | — |
| LC6 | `(+490,0,+322)` — ‖T‖ 586 N @ 57° from vertical | pad-eye boss | fix chassis-cap seat ring | ⏳ pending | — |
| LC7 | `(+490,0,0)` **+** 70 N·m about `+Y` (overturning) | pad-eye boss + chassis | fix chassis-cap seat ring | ⏳ pending | — |
| LC8 | 50.3 kPa external, inward normal (5 m water-equivalent) | all sealed boundaries | fix one cap face | ⏳ pending | — |
| **LC9** | `(+490,0,+644)` — ‖T‖ 810 N @ 37° from vertical (mooring snap) | pad-eye boss | fix chassis-cap seat ring | ⏳ pending — **governing case for the attachment** | — |
| Service | `(0,0,−200)` (handling / stood-on) | chassis-cap top | fix pad-eye | ⏳ pending | — |

**Run each lateral case at two azimuths** relative to the 6-wedge pattern — 0° (into a wedge
face) and 30° (into a wedge-to-wedge seam) — per
[`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md#fea-load-application--fusion-static-stress-setup).

## Conventions for these runs

- **Material:** the custom PETG profile (E 2240 MPa, ν 0.38, yield 35 MPa, UTS 45 MPa). Density
  currently 1.06 g/cm³ (carried from the old ABS profile) — should be 1.27; immaterial for
  static cases but reconcile it. Re-run governing cases for ABS / ASA per
  [SCO-64](https://linear.app/scout1/issue/SCO-64).
- **Attachment part:** a McMaster `3076T33` steel tie-down ring is the current stand-in; swap
  for the final 316 pad-eye once specified ([SCO-69](https://linear.app/scout1/issue/SCO-69)).
- **Safety-factor target:** set an explicit derived target (framework §11) so Fusion's
  Guided-Results verdict is meaningful — LC2's banner said "expected to break" against a min SF
  of 7.53, which is a target-setting artifact, not a real result.

## Upload workflow (when a run finishes)

1. Export the Fusion Studies Report as HTML → `mechanical/test/fea-mooring-lc<N>-<slug>-<date>.html`
2. Write a companion `.md` summary (setup, results table, reading, next steps) — copy the LC2
   file's structure.
3. Update this table's row and [`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md)'s
   load-case status table.
4. If a result changes a structural conclusion, add a [`design-notes.md`](../../docs/hub/design-notes.md)
   row and a [`journal/`](../../docs/hub/journal/) snapshot.
