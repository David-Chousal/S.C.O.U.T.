# Test Session Log, 2026-11-01 to 2026-11-02

> **Summary** — The full record of the 2026-11-01 and 2026-11-02 testing session: what was built and tested
> (RR-20 to RR-23), the methods, every decision and correction made along the way, and an index of all photos and
> files saved. Written so that someone who was not in the session can follow it. The test records themselves
> follow the [Test Record Template](test-record-template.md); this page ties them together.
>
> Part of [`docs/engineering/`](.); the records and photos live in [`mechanical/test/`](../../mechanical/test/README.md). Owner: John Ryan Myrdal (GENG).

---

## The four records

| Record | What | Status at end of 2026-11-02 |
|---|---|---|
| [RR-20](../../mechanical/test/rr-20-hang-hole-fea-2026-10-30.md) | Hang-hole static FEA, through-hole floatation | Pass (analysis only); limits recorded |
| [RR-21](../../mechanical/test/rr-21-tub-salt-substitute-vs-seawater-2026-11-01.md) | Raw floats in plain-salt water (24 h), weighted run, displacement comparison | Running; Part A locked 2026-11-02; 24 h read due 2026-11-03 about 11:00 |
| [RR-22](../../mechanical/test/rr-22-housing-cap-assembly-and-gland-fit-2026-11-01.md) | First housing and cap assembly, gland fit | Partial: cap bolt holes undersized, forced threads |
| [RR-23](../../mechanical/test/rr-23-housing-cap-and-gland-seal-tests-2026-11-01.md) | Cap and PG11 gland seal tests (initial dunk, then isolation plan if it leaks) | Running; Part A locked 2026-11-02; Stage 1 started 10:47, 24 h read due 2026-11-03 |

The reusable displacement tool, charts and running log are in
[`float-displacement/`](../../mechanical/simulations/buoy-stability/float-displacement/README.md) and
[`float-displacement-log.csv`](../../mechanical/test/float-displacement-log.csv).

## Timeline

| When | Event |
|---|---|
| 2026-11-01 | Weekly plan built; decisions: plain non-iodized or kosher salt for waterline tests (no Instant Ocean, no salinity meter), 4-week soak to move to real seawater over winter break, rope harness through the floatation holes (eye points and printed top attachments canceled), hang-hole FEA closed as RR-20 |
| 2026-11-01 | First housing and cap assembled; cap bolt holes found too narrow (RR-22); SCO-293 (cap redesign) and SCO-294 (seal tests) filed |
| 2026-11-02 | Gland pegs designed and printed (PETG, 2 walls, 15% infill); they seat well in all three glands; cap v2 CAD done (holes 3.40 to 4.50 mm, extended cable outlet), not printed until RR-23 reads |
| 2026-11-02 10:47 | RR-23 Stage 1 started: housing (518 g with pegs and towel) cap end down in a bowl of fresh water, seal fully submerged, weights holding it |
| 2026-11-02 11:00 | RR-21 salt added: 725 g (35 g per kg of 20 kg), measured by mass on a scale; floats in their own container, separate from the housing bowl |
| 2026-11-02 after 11:00 | Waterline readings (means of three): mushroom draft 1 1/16 in (held vertical by a side-only force), regular draft 1 11/16 in |
| 2026-11-02 11:40 | Weighted run: 429 g breadcrumb can in the center of each float's compartment, readings from the top: both about 4.5 in; can removed afterward, raw floats soak for 24 h |

## Decisions and changes made during the session

| Decision or change | Where recorded |
|---|---|
| RR-21 Part A locked 2026-11-02 after the first readings; M4 dropped (no fresh-water reading was taken); M3 replaced by a 24 h drift check; M5 moved to the weighted floats | RR-21 A5 |
| RR-23 Part A locked 2026-11-02; Stage 1 is a screening depth (just below the surface), not the R-12 0.3 m mark | RR-23 A5 |
| The housing and float tests use separate containers | RR-23 B3, RR-21 A6 |
| Seal fully submerged, body above the water (cap end tested) | RR-23 C5 |
| Cap v2 not printed until the RR-23 read | [Decision log](../hub/decision-log.md) |
| Unified test template (John's and Isabella's standards merged) | [Template](test-record-template.md) |

## Corrections made during the session

Kept so they are not lost.

| What was wrong | Correction |
|---|---|
| Regular float mass taken as 951 g (slicer value) | Weighed at about 1148 g |
| An early prediction used a body-of-revolution envelope that counted the open bore as displacing water | Replaced by the simulator's true 3D voxel hull; the bore above its floor does not displace water |
| The wrong STEP was first used for the regular float; the first mushroom STEP held part of the housing | The corrected mushroom ([Float.step](../../mechanical/cad/floatation/float-mushroom-corrected-2026-11-02.step)) and the regular float ([RegularFloat.step](../../mechanical/cad/floatation/float-regular-2026-11-02.step)) are used |
| Floats first mislabeled | Mushroom = the dome-shaped float that tilts when free; regular = the upright float with the engraved band |
| Facts already logged (gland type, O-ring size, M4 inserts) were first marked Not recorded | Cited from `facts.md` and the housing README |
| First "fresh-water reading required" for RR-21 | Dropped when no fresh reading had been taken |

## Open items

- 2026-11-03: read RR-23 (about 10:47) and RR-21 (about 11:00): freeboard and drift, seams, bores for water, weigh both floats bare.
- Mushroom: about 1.1 to 1.3 in shallower than predicted in both runs; check its overall height and base against the STEP, and plan a heavier-load run.
- Cap v2: print after the RR-23 result; decide the SMA bulkhead and D-cell bay merge ([SCO-162](https://linear.app/scout1/issue/SCO-162), [SCO-250](https://linear.app/scout1/issue/SCO-250)).
- Santa Cruz seawater comparison (RR-21 M2) tentative; soak and Hawaii dates not set.

## Photos and files

All photos were taken by John on 2026-11-02 unless noted. The O-ring pack photo mentioned in the session did not
arrive and is not saved. One blurry patio photo was not kept.

| File | What it shows |
|---|---|
| `housing-cap-assembly-2026-11-01-01.jpg` to `-03.jpg` | The first assembled housing and cap; the cap off with the gland block; heat-set inserts going into the body flange (RR-22) |
| `housing-glands-with-pegs-2026-11-02-01.jpg` | The three printed pegs clamped in the PG11 glands (RR-23) |
| `housing-dunk-rr-23-2026-11-02-01.jpg` to `-05.jpg` | RR-23 Stage 1: housing cap end down in a bowl of fresh water, body above the water, seal submerged, weights near the flange |
| `float-salt-test-2026-11-02-01.jpg` to `-10.jpg` | RR-21 floats in the clear tub in salt water: the upright regular float with its bore (side and engraved band at the waterline), the dome-shaped mushroom floating tilted, and a top-down view of both |
| `salt-mixing-rr-21-2026-11-02-01.jpg` to `-04.jpg` | Salt in the Home Depot mixing cup, water and salt being poured into the float tub |
| `mushroom-float-cross-section-2026-11-02.png`, `regular-float-cross-section-2026-11-02.png` | Section diagrams of the floats from the STEP files (unverified) |
| [`mushroom-displacement-chart.png`](../../mechanical/simulations/buoy-stability/float-displacement/mushroom-displacement-chart.png), [`regular-displacement-chart.png`](../../mechanical/simulations/buoy-stability/float-displacement/regular-displacement-chart.png) | The two displacement charts, kept running for future buoyancy tests |
| CAD: [`gland-peg-test-2026-11-02.step`](../../mechanical/cad/electronics-housing/gland-peg-test-2026-11-02.step), [`electronics-housing-cap-fixed-2026-11-02.step`](../../mechanical/cad/electronics-housing/electronics-housing-cap-fixed-2026-11-02.step), [`float-hang-holes-2026-11-01.step`](../../mechanical/cad/floatation/float-hang-holes-2026-11-01.step), the two float STEPs above | Gland peg, cap v2, the hang-hole float, and the two floats used in RR-21 |
