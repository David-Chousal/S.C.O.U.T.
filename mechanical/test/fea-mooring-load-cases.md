# FEA — Mooring / Structural Load Cases LC1–LC9

> **Summary** — Tracker + results for the FEA runs of the corrected load cases defined in the
> [Buoy Structural Load Framework](../../docs/engineering/buoy-structural/structural-load-framework.md)
> and computed in [`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md).
> **LC2–LC9 + a service case were run 2026-08-29** (John Ryan, Fusion static stress, custom PETG
> profile, McMaster `3076T33` steel tie-down ring as the pad-eye stand-in).
>
> **Headline: the wedges/hull are comfortably fine (min SF 30–1450); the mooring attachment is
> NOT — LC6 (combined) min SF 1.66 and LC9 (snap) min SF 1.49, both "expected to bend
> permanently or break" per Fusion.** See [§ Reading](#reading) below.
>
> Loads are at the *proposed* environmental design set (SCO-73 not yet signed off).
> Axes: **Z** = buoy vertical (up +), **X**/**Y** = horizontal.

## Results (2026-08-29)

| Case | Load **as run** | Applied to | min SF | max disp | max contact pressure | Fusion verdict |
|---|---|---:|---:|---:|---:|---|
| **LC2** taut-line uplift | `(0, 0, −322)` N | pad-eye ring | **7.53** | 0.012 mm | — | pass (banner artifact) |
| **LC3** current | `(0, 14, 0)` N | wetted hull band | **1450** | 0.003 mm | 0.02 MPa | pass — trivial (14 N) |
| **LC4** wave | 185 N horizontal | wetted float band | **70.4** | 0.139 mm | 0.46 MPa | pass |
| **LC5** wave+current, **face** | 440 N horizontal (`+Y`) | one wedge face | **29.6** | 0.331 mm | 1.09 MPa | pass |
| **LC5(2)** wave+current, **edge** | 440 N horizontal, `(−220, 381, 0)` | a wedge-to-wedge edge | **65.0** | 0.093 mm | 1.03 MPa | pass |
| **LC6** combined resultant | `(−490, 0, −392)` N ‖627 N @ 51°‖ | pad-eye boss | **1.66** | 0.107 mm | **40.6 MPa** | ⚠️ **"expected to bend permanently or break"** |
| **LC7** overturning | `(−490, 0, 0)` N — **moment NOT applied** | pad-eye boss | **2.03** | 0.105 mm | 36.4 MPa | borderline — "not expected to bend/break" |
| **LC8** hydrostatic | 0.05 MPa (50 kPa) external, 5 m head | sealed boundaries | **9.98** | 0.40 mm | 3.04 MPa | pass |
| **LC9** mooring snap | `(−490, 0, −644)` N ‖810 N @ 37°‖ | pad-eye boss | **1.49** | 0.109 mm | **50.4 MPa** | ⚠️ **"expected to bend permanently or break"** |
| **Service** down-load | `(0, 0, −200)` N | chassis-cap top | **290** | 0.018 mm | 0.14 MPa | pass — trivial |

Mesh (where reported): 114,564 nodes / 62,994 elements, parabolic. Material: custom PETG (E 2240
MPa, ν 0.38, yield 35 MPa, UTS 45 MPa; density 1.06 g/cm³ — carried from the old ABS profile,
should be 1.27) + Fusion generic steel (yield 207 MPa) for the 3076T33 ring.

Reports (embedded result-plot images stripped to keep the repo light — the tables/numbers are
intact; regenerate plots from the Fusion source if needed):

- [`fea-mooring-lc2-vertical-uplift-2026-08-29.html`](fea-mooring-lc2-vertical-uplift-2026-08-29.html) ([summary](fea-mooring-lc2-vertical-uplift-2026-08-29.md))
- [`fea-mooring-lc3-current-2026-08-29.html`](fea-mooring-lc3-current-2026-08-29.html)
- [`fea-mooring-lc4-wave-2026-08-29.html`](fea-mooring-lc4-wave-2026-08-29.html)
- [`fea-mooring-lc5-wave-current-face-2026-08-29.html`](fea-mooring-lc5-wave-current-face-2026-08-29.html)
- [`fea-mooring-lc5-wave-current-edge-2026-08-29.html`](fea-mooring-lc5-wave-current-edge-2026-08-29.html)
- [`fea-mooring-lc6-combined-2026-08-29.html`](fea-mooring-lc6-combined-2026-08-29.html)
- [`fea-mooring-lc7-overturning-2026-08-29.html`](fea-mooring-lc7-overturning-2026-08-29.html)
- [`fea-mooring-lc8-hydrostatic-2026-08-29.html`](fea-mooring-lc8-hydrostatic-2026-08-29.html)
- [`fea-mooring-lc9-snap-2026-08-29.html`](fea-mooring-lc9-snap-2026-08-29.html)
- [`fea-mooring-service-download-2026-08-29.html`](fea-mooring-service-download-2026-08-29.html)

## Reading

- **Hull / wedges are fine.** LC3–LC5 (current, wave, wave+current up to 440 N) and the service
  down-load all pass with min SF ≥ 30 and sub-mm displacement. The floatation structure is not
  the concern — consistent with the "over-engineered wedges" finding from the mass/freeboard work.
- **The mooring attachment is marginal-to-failing.** LC6 (combined 627 N as run) → **min SF
  1.66**; LC9 (snap 810 N) → **min SF 1.49**; both flagged "expected to bend permanently or
  break". LC7 (490 N horizontal, no moment) sits at **2.03**. Contact pressure at the
  ring/chassis interface hits **40–50 MPa** in LC6/LC9.
- **Where the limit is — not yet pinned.** Peak von Mises in LC6/LC9 is ~124–139 MPa, which is
  in range of the **steel tie-down ring** (207 MPa yield → SF ~1.5–1.7). Whether the real
  limiter is the steel ring, the PETG boss, or the contact interface needs the stress plot /
  per-component breakdown. The 3076T33 is a **stand-in** — re-run with the final **316 pad-eye**
  ([SCO-69](https://linear.app/scout1/issue/SCO-69)) before drawing a firm conclusion.
- **LC7 is incomplete as run** — the 70 N·m overturning moment was not applied, only the 490 N
  horizontal. The real LC7 will be worse.
- **LC6 used `Z = −392 N`** rather than the −322 N (nominal) / −644 N (snap) from `force-budget.md`
  — an intermediate value. Re-run LC6 at the doc's `(−490, 0, −322)` and confirm.
- **LC8 (hydrostatic, 5 m) passes** at min SF 9.98 — the sealed housing handles the depth spec.

## Next steps

1. **Re-run LC6 / LC7 / LC9 with the final 316 pad-eye geometry** (not the 3076T33 stand-in) and
   with **LC7's 70 N·m moment applied**. These are the cases that decide the mooring attachment.
2. Identify the LC6/LC9 hotspot (steel ring vs. PETG boss vs. contact) from the stress plot and
   address it — thicker boss, larger backing plate, load-spreading, or a stiffer ring.
3. Reconcile the PETG density (1.06 → 1.27 g/cm³) and set an explicit derived Safety-Factor
   target (framework §11) so the Fusion verdict is meaningful.
4. Run each governing lateral case at a second azimuth (LC5 has face + edge; do the same for
   LC6/LC9 once the geometry is final).

## Conventions for these runs

- **Material:** custom PETG profile (E 2240 MPa, ν 0.38, yield 35 MPa, UTS 45 MPa). Density
  1.06 g/cm³ (from the old ABS profile) — should be 1.27; immaterial for static cases but
  reconcile. Re-run governing cases for ABS / ASA per [SCO-64](https://linear.app/scout1/issue/SCO-64).
- **Attachment part:** McMaster `3076T33` steel tie-down ring is the stand-in; swap for the
  final 316 pad-eye ([SCO-69](https://linear.app/scout1/issue/SCO-69)).
- **Safety-factor target:** set an explicit derived target (framework §11).

## Upload workflow (when a run finishes)

1. Export the Fusion Studies Report as HTML → `mechanical/test/fea-mooring-lc<N>-<slug>-<date>.html`.
   Strip embedded base64 images before committing (keeps the repo light; tables/numbers stay).
2. Add / update the row in the Results table above.
3. Update [`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md)'s load-case
   status table.
4. If a result changes a structural conclusion, add a [`design-notes.md`](../../docs/hub/design-notes.md)
   row and a [`journal/`](../../docs/hub/journal/) snapshot.
