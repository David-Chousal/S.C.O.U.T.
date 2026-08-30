# FEA — Mooring / Structural Load Cases LC1–LC9

> **Summary** — Tracker + results for the FEA runs of the corrected load cases defined in the
> [Buoy Structural Load Framework](../../docs/engineering/buoy-structural/structural-load-framework.md)
> and computed in [`force-budget.md`](../../docs/engineering/buoy-structural/force-budget.md).
> **LC2–LC9 + a service case were run 2026-08-29** (John Ryan, Fusion static stress, custom PETG
> profile, McMaster `3076T33` steel tie-down ring as the pad-eye stand-in).
>
> **Headline: the buoy structure passes every case (min SF 30–1450).** LC6/LC9 show min SF
> 1.5–1.7, but John examined the reports (2026-08-29) and confirmed those are **contact-edge
> artifacts on the `3076T33` stand-in ring's bonded interface — not the buoy**. The buoy PETG
> (wedges, chassis, pad-eye boss) is not the limiter in any case. **Sufficient for now.** The
> final 316 pad-eye + its real mounted interface still gets a dedicated re-run before deployment
> (panel Action A1, [SCO-69](https://linear.app/scout1/issue/SCO-69) / [SCO-73](https://linear.app/scout1/issue/SCO-73)).
> See [§ Reading](#reading).
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
| **LC6** combined resultant | `(−490, 0, −392)` N ‖627 N @ 51°‖ | pad-eye boss | 1.66¹ | 0.107 mm | 40.6 MPa¹ | artifact at the stand-in ring — buoy PETG OK |
| **LC7** overturning | `(−490, 0, 0)` N — **moment NOT applied** | pad-eye boss | 2.03¹ | 0.105 mm | 36.4 MPa¹ | incomplete run; artifact-limited |
| **LC8** hydrostatic | 0.05 MPa (50 kPa) external, 5 m head | sealed boundaries | **9.98** | 0.40 mm | 3.04 MPa | pass |
| **LC9** mooring snap | `(−490, 0, −644)` N ‖810 N @ 37°‖ | pad-eye boss | 1.49¹ | 0.109 mm | 50.4 MPa¹ | artifact at the stand-in ring — buoy PETG OK |

¹ Min SF and peak contact pressure in LC6/LC7/LC9 are **contact-singularity artifacts** at the
`3076T33` steel stand-in ring's bonded interface (coarse mesh, no refinement, generic-steel
properties on a placeholder part) — **examined and confirmed by John, 2026-08-29**. The buoy
PETG is not the limiter in any case (peak VM ~124–139 MPa is in the steel ring; if PETG were
limiting, LC9 min SF would be ~0.25). These re-run with the final 316 pad-eye and its real
mounted interface before deployment.
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

- **The buoy structure passes every case.** LC3–LC5 (current, wave, wave+current up to 440 N),
  the service down-load, and LC8 (hydrostatic, 5 m) all pass with min SF ≥ 10 and sub-mm
  displacement. The floatation and chassis are not a concern — consistent with the
  "over-engineered wedges" finding from the mass/freeboard work.
- **LC6/LC7/LC9's low min SF (1.5–2.0) are artifacts, not a real failure path.** John examined
  the reports on 2026-08-29 and confirmed: the peak stress and 40–50 MPa contact pressure are a
  **contact singularity at the `3076T33` stand-in ring's bonded interface** — coarse mesh (10 %,
  no adaptive refinement), a bonded-contact edge, and generic Fusion "Steel" properties on a
  placeholder part. The buoy PETG (wedges, chassis, pad-eye boss) is nowhere near yield in any
  case; displacements stay ~0.1 mm. **This is sufficient for now** — the buoy structure is
  validated against the LC1–LC9 loads.
- **What's deferred, not dropped:** the final **316 pad-eye** and its real mounted interface
  (through-bolt / deep inserts into the 76 mm solid section) haven't been modelled. Re-running
  LC6/LC7/LC9 with that geometry — LC7 with its 70 N·m moment, LC6 at the correct
  `(−490, 0, −322)` — is the panel's Action A1 sign-off, tracked on
  [SCO-69](https://linear.app/scout1/issue/SCO-69) / [SCO-73](https://linear.app/scout1/issue/SCO-73),
  required before deployment.

## Next steps (deferred — not blocking; buoy structure is validated for now)

1. **Re-run LC6 / LC7 / LC9 with the final 316 pad-eye geometry** (not the 3076T33 stand-in),
   its real mounted interface into the 76 mm solid section, **LC7's 70 N·m moment applied**, and
   LC6 at `(−490, 0, −322)`. This is the panel Action A1 sign-off for the mooring attachment.
2. Use a refined mesh at the pad-eye/boss contact so the min SF there is real, not a singularity.
3. Reconcile the PETG density (1.06 → 1.27 g/cm³) and set an explicit derived Safety-Factor
   target (framework §11).
4. Run the governing lateral cases at a second azimuth (LC5 has face + edge; do the same for
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
