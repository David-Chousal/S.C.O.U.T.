# Mechanical Prototype & Risk-Reduction Test Register

> **Summary** — One list of every mechanical prototype and risk-reduction test S.C.O.U.T. has run
> or plans to run: what risk each test retires, what kind of prototype it uses, the pass
> benchmark, and the result. Set up 2026-10-01 at the request of Jes Kuczenski (GENG advisor),
> who asked for testing to be layered and benchmarked before results are read
> ([meeting 2026-09-30](../../docs/planning/meeting-notes.md)).
>
> Part of [`mechanical/test/`](README.md). Detailed write-ups stay in their own records; this
> page is the index. Benchmarks are **provisional** until
> [SCO-139](https://linear.app/scout1/issue/SCO-139) sets them, and the stage plan is in the
> [Layered Test Protocol](../../docs/engineering/layered-test-protocol.md)
> ([SCO-140](https://linear.app/scout1/issue/SCO-140)).

## How to use this page

- **Add a row before the test runs**, with its benchmark, then fill in the result afterwards.
  A test whose pass mark is written down after the result isn't a test.
- **Prototype type:** *coupon* (a small piece testing one feature), *looks-like* (form and
  fit), *works-like* (function), or *analysis* (closed-form or FEA, no hardware).
- **IDs are permanent.** `RR-NN`, numbered in order and never reused.
- **Every test gets a record** in the [test record template](../../docs/engineering/test-record-template.md), named `rr-NN-subject-YYYY-MM-DD.md` in this folder. Write its Part A, with the pass mark, before the run.

The requirement-by-requirement view of every test, for all disciplines, is the [Requirements Test Matrix](../../docs/engineering/requirements-test-matrix.md). A new test adds a row there and one here.

## Records in the test-record format

Every test below has a record in the [Test Record Template](../../docs/engineering/test-record-template.md) format, with a one-page printable summary at the top. The older narrative records stay in this folder and are linked from each new record.

| ID | Test | Status | Record |
|---|---|---|---|
| RR-01 | Flotation Wedges and Bottom Caps — Side-Load FEA, 2026-08-17 | Pass | [`rr-01-flotation-side-load-fea-2026-08-17.md`](rr-01-flotation-side-load-fea-2026-08-17.md) |
| RR-02 | Print Weight Verification — Bolted-V4 Floatation Set, 2026-08-24 | Partial | [`rr-02-print-weight-verification-2026-08-24.md`](rr-02-print-weight-verification-2026-08-24.md) |
| RR-03 | Bench Submersion of Three Printed Housings, 2026-08-24 | Partial | [`rr-03-bench-submersion-three-articles-2026-08-24.md`](rr-03-bench-submersion-three-articles-2026-08-24.md) |
| RR-04 | Mooring and Structural Load-Case FEA, LC2–LC9 plus Service, 2026-08-29 | Pass | [`rr-04-mooring-load-case-fea-2026-08-29.md`](rr-04-mooring-load-case-fea-2026-08-29.md) |
| RR-05 | Wedge Wall-Thickness Structural Check (closed form), 2026-09-07 | Pass | [`rr-05-wedge-wall-thickness-check-2026-09-07.md`](rr-05-wedge-wall-thickness-check-2026-09-07.md) |
| RR-06 | Wedge Ring External-Pressure Buckling Check (closed form), 2026-09-09 | Pass | [`rr-06-wedge-ring-buckling-check-2026-09-09.md`](rr-06-wedge-ring-buckling-check-2026-09-09.md) |
| RR-07 | Sensor Housing One-Week Soak, TPU-Printed O-Ring, 2026-09-12 | Fail | [`rr-07-sensor-housing-tpu-oring-soak-2026-09-12.md`](rr-07-sensor-housing-tpu-oring-soak-2026-09-12.md) |
| RR-08 | Split Wedge-Bottom Print, Prusa Mini vs Larger Printer, 2026-09-23 | Partial | [`rr-08-wedge-bottom-split-print-2026-09-23.md`](rr-08-wedge-bottom-split-print-2026-09-23.md) |
| RR-09 | v5 FEA Re-Check and Ring Buckling, 2026-09-25 | Pass | [`rr-09-v5-fea-recheck-2026-09-25.md`](rr-09-v5-fea-recheck-2026-09-25.md) |
| RR-10 | Single-Wedge Drop Test, 2026-09-25 | Pass | [`rr-10-wedge-drop-2026-09-25.md`](rr-10-wedge-drop-2026-09-25.md) |
| RR-11 | Large-Angle Stability and Self-Righting Calculation, 2026-09-29 | Pass | [`rr-11-large-angle-stability-2026-09-29.md`](rr-11-large-angle-stability-2026-09-29.md) |
| RR-12 | Sensor Housing Coupon Run 1, Purchased O-Ring, 3 Bolts, 2026-10-01 | Fail | [`rr-12-sensor-housing-coupon-run-1-2026-10-01.md`](rr-12-sensor-housing-coupon-run-1-2026-10-01.md) |
| RR-13 | v5 Chassis Print on the Dedicated Printer, 2026-09-30 | In progress | [`rr-13-v5-chassis-print-2026-09-30.md`](rr-13-v5-chassis-print-2026-09-30.md) |
| RR-14 | Sensor Housing Coupon Run 2, PLA, 4 Bolts, Ribbed Cap, 2026-10-06 | Fail | [`rr-14-sensor-housing-coupon-run-2-2026-10-06.md`](rr-14-sensor-housing-coupon-run-2-2026-10-06.md) |
| RR-15 | Sensor Housing Coupon Run 3, 6 Bolts, Thicker Cap and Ribs, 2026-10-06 | Fail | [`rr-15-sensor-housing-coupon-run-3-2026-10-06.md`](rr-15-sensor-housing-coupon-run-3-2026-10-06.md) |
| RR-16 | Sensor Housing Coupon Run 4, Groove Matched to the Real Ring, 2026-10-08 | Planned | [`rr-16-sensor-housing-coupon-run-4-2026-10-08.md`](rr-16-sensor-housing-coupon-run-4-2026-10-08.md) |
| RR-17 | Dry Float of the Assembled Foam-Version Buoy in a Bin, 2026-10-16 | Partial | [`rr-17-assembled-buoy-bin-float-2026-10-16.md`](rr-17-assembled-buoy-bin-float-2026-10-16.md) |
| RR-18 | Sensor Pod Fresh-Water Seal Check, PETG, Inserts Pressed from Below, 2026-10-21 | Pass | [`rr-18-sensor-pod-petg-fresh-water-2026-10-21.md`](rr-18-sensor-pod-petg-fresh-water-2026-10-21.md) |
| RR-19 | Raw PETG Water Absorption Soak, Fresh then Salt, 2026-10-21 | Planned | [`rr-19-petg-water-absorption-soak-2026-10-21.md`](rr-19-petg-water-absorption-soak-2026-10-21.md) |
| RR-20 | Hang-Hole Static FEA, Through-Hole Floatation, 2026-10-30 | Pass (analysis only) | [`rr-20-hang-hole-fea-2026-10-30.md`](rr-20-hang-hole-fea-2026-10-30.md) |
| RR-21 | Tub Plain-Salt Water vs Santa Cruz Seawater, Float Waterline, 2026-11-01 | Planned | [`rr-21-tub-salt-substitute-vs-seawater-2026-11-01.md`](rr-21-tub-salt-substitute-vs-seawater-2026-11-01.md) |

## Tests run

| ID | Date | Test | Risk retired | Type | Benchmark | Result | Record |
|---|---|---|---|---|---|---|---|
| RR-01 | 2026-08-17 | Flotation side-load FEA (300 N) | Wedges and caps fail under side load | analysis | SF ≥ 4 | **Pass** — min SF 25.4 | [record](fea-floatation-side-load-2026-08-17.md) |
| RR-02 | 2026-08-24 | Print weight verification (all five v4 flotation parts) | Mass budget is wrong | manufacturing | Slicer mass within ~10% of measured | **Partial** — ~31% wedge discrepancy unreconciled | [record](print-weight-verification-2026-08-24.md) |
| RR-03 | 2026-08-24 | Bench submersion, 3 articles (TPU-printed O-rings) | Printed housings leak | coupon / looks-like | Dry inside after the soak | **Mixed** — PLA sensor housing passed (~30 hr); low-quality PETG print and electronics housing failed | [record](waterproofing-submersion-test-2026-08-24.md) |
| RR-04 | 2026-08-29 | Mooring load-case FEA LC2–LC9 + service | Hull fails under mooring, wave, current, snap loads | analysis | SF ≥ 4 | **Pass** — SF 10–1450 | [record](fea-mooring-load-cases.md) |
| RR-05 | 2026-09-07 | Wedge wall-thickness closed-form check | Thinned v5 walls overstressed | analysis | Stress within allowable | **Pass** on stress; internal web required | [record](wedge-wall-thickness-structural-check-2026-09-07.md) |
| RR-06 | 2026-09-09 | Wedge ring external-pressure buckling | Unfoamed ring buckles when submerged | analysis | SF ≥ 2 | **Bare fails** (SF 0.2–0.7); **foam-backed passes** (SF 3–5) | [record](wedge-ring-buckling-check-2026-09-09.md) |
| RR-07 | 2026-09-12 | ~1-week submersion, sensor housing with TPU-printed O-ring | Printed O-ring is good enough | works-like | Dry inside after 1 week | **Fail** — water got in. No more housing soaks until purchased rings are on hand | [record](sensor-housing-tpu-oring-failure-2026-09-12.md) |
| RR-08 | 2026-09-23 | Split wedge-bottom print, Prusa Mini vs larger printer | Parts can't be printed reliably | manufacturing | Part prints to spec first time | **Mini fails** (adhesion, Z); **larger printer passes** | [record](wedge-bottom-split-print-2026-09-23.md) |
| RR-09 | 2026-09-25 | v5 FEA re-check + ring buckling at v5 | v5 geometry change breaks load margins | analysis | SF ≥ ~3.5 | **Pass** — min real SF ~3.5 PETG unfoamed | [record](fea-mooring-load-cases.md#results--v5-re-check-2026-09-25) |
| RR-10 | 2026-09-25 | Single-wedge drop | Wedge cracks on handling or impact | coupon | No visible damage | **Pass** — 1 sample, height not recorded | [record](wedge-drop-test-2026-09-25.md) |
| RR-11 | 2026-09-29 | Large-angle stability calculation (STEP geometry) | Buoy stable upside down / capsizes | analysis | Rights itself from any angle | **v5 fails** (stable inverted) → **v6 with 24 in ballast passes** | [calculator](../simulations/buoy-stability/README.md) |

⚠️ **Not yet recorded:** John has run several informal "is the paper towel wet inside the
capsule" checks and more drop tests than RR-10. Add them as rows if dates and outcomes can be
recovered.

## In progress

| ID | Started | Test | Risk retired | Type | Benchmark (provisional) | Status | Tracks |
|---|---|---|---|---|---|---|---|
| RR-12 | 2026-10-01 | **Short sensor-housing coupon, face seal with a purchased O-ring** | The face-seal groove leaks with a real ring (RR-07 failed with a printed one) | coupon | Dry paper towel inside after **24 hr at ≥ 0.3 m in ~35 ppt salt water**, then 1 week | **Fail** 2026-10-06 — slightly damp at 24 hr; cap flexed between the 3 bolts, so the ring lost compression there | [record](sensor-housing-oring-coupon-2026-10-01.md), [SCO-108](https://linear.app/scout1/issue/SCO-108) |
| RR-14 | 2026-10-06 | **Sensor-housing coupon run 2: PLA, 4 bolts, ribbed cap, slightly larger ring** | Stiffening the cap closes the gap between the bolts that failed RR-12 | coupon | Dry paper towel inside after 24 hr at ≥ 0.3 m in ~35 ppt salt water | **Failed 2026-10-07: pod leaked** | [record](sensor-housing-oring-coupon-2026-10-01.md#run-2--2026-10-06-in-the-water-result-due-2026-10-07) |
| RR-15 | 2026-10-06 | **Sensor-housing coupon run 3: 6 evenly spaced bolts, thicker cap, thicker ribs** | Six bolts plus a stiffer cap close the gap between the bolts that opened in RR-12 and RR-14 | coupon | Dry paper towel inside after 24 hr at ≥ 0.3 m in ~35 ppt salt water | **Failed 2026-10-08: pod flooded completely** despite 6 bolts ([CAD](../cad/sensor-housing/sensor-housing-assembly-v9.step)) | [decision](../../docs/hub/decision-log.md) |
| RR-16 | 2026-10-08 | **Sensor-housing coupon run 4: groove cut for the real ring (3/16 in CS), 6 bolts, shorter body** | The ring and groove were mismatched in RR-15 (a 4.76 mm ring in a groove cut for a 2.62 mm one); a matched groove at about 28% squeeze seals | coupon | Dry paper towel inside after 24 hr at ≥ 0.3 m in ~35 ppt salt water | Body supplied 2026-10-08 ([CAD](../cad/sensor-housing/sensor-housing-body-short-v1.step)); not yet in the water | [record](sensor-housing-oring-coupon-2026-10-01.md#run-4--2026-10-08-matched-groove-body-supplied), [SCO-108](https://linear.app/scout1/issue/SCO-108) |
| RR-17 | 2026-10-16 | **Dry float of the assembled foam-version buoy in a bin** | The built buoy floats at the modelled waterline | looks-like | Freeboard within ±0.5 in of the model | **Floated well, leaked slightly** through the marine-epoxy seams. The buoy was built to rely on flotation foam and was tested empty (no foam) and without its outermost complete seam coats. Waterline and freeboard numbers not recorded | [SCO-170](https://linear.app/scout1/issue/SCO-170) |
| RR-18 | 2026-10-21 | **Sensor-pod fresh-water seal check: PETG print, heat-set inserts pressed from the bottom** | Printing in PETG and inserting from the bottom keeps the flange face flat, so clamping stays even around the ring | pod, no sensor | Dry paper towel inside after 24 hr submerged | **Passed 2026-10-21** (fresh water, negligible depth, no sensor) | [record](sensor-housing-petg-pass-2026-10-21.md), [SCO-91](https://linear.app/scout1/issue/SCO-91), [SCO-108](https://linear.app/scout1/issue/SCO-108) |
| RR-19 | 2026-10-21 | **Raw PETG water absorption soak, fresh then salt** | Uncoated PETG takes up water and gains mass with no leak, lowering the waterline and clouding leak tests | looks-like + coupons | Mass gain ≤ scale resolution after 24 hr fully submerged, fresh and ~35 ppt (provisional) | Not yet run | [plan](petg-water-absorption-soak-plan-2026-10-21.md), [SCO-219](https://linear.app/scout1/issue/SCO-219) |
| RR-20 | 2026-10-30 | Hang-hole static FEA, through-hole floatation (322 N each hole; 644 N one hole) | Hang holes tear out under the dock or boat load | analysis | SF ≥ 4 | **Pass** (analysis only) — min SF about 12.4; steel housing and coarse mesh limit it | [record](rr-20-hang-hole-fea-2026-10-30.md), [SCO-276](https://linear.app/scout1/issue/SCO-276) |
| RR-21 | 2026-11-01 | Tub plain-salt water vs Santa Cruz seawater (fresh, plain salt at 35 g per kg, seawater tentative) | Tub tests use a water that does not match the ocean, or waste money on salt | looks-like | Plain-salt freeboard within 0.1 in of seawater (proposed) | Not yet run | [record](rr-21-tub-salt-substitute-vs-seawater-2026-11-01.md), [SCO-292](https://linear.app/scout1/issue/SCO-292) |
| RR-13 | 2026-09-30 | v5 chassis print on the dedicated printer | Chassis can't be printed round and flat enough to seal | manufacturing | Seal faces flat and round within ±0.2 mm | Printing | [SCO-93](https://linear.app/scout1/issue/SCO-93) |

## Tests still to do

Ordered roughly by when the risk bites. Benchmarks are placeholders for
[SCO-139](https://linear.app/scout1/issue/SCO-139).

| Test | Risk retired | Type | Benchmark (placeholder) | Tracks |
|---|---|---|---|---|
| Saltwater capsules at 1, 2 and 3 wall layers, with and without marine sealant | Printed walls weep through layer lines | coupon | Dry after 1 week at ~35 ppt | [SCO-141](https://linear.app/scout1/issue/SCO-141) |
| Electronics housing AS568-043 fit check | Ring doesn't fit the printed groove | coupon | Seats without stretch > 3% or pinching | [SCO-106](https://linear.app/scout1/issue/SCO-106), [SCO-105](https://linear.app/scout1/issue/SCO-105) |
| Foam-fill trials on spare wedges | Foam voids, or expansion cracks the shell | coupon | No voids on sectioning, no shell cracks | [SCO-76](https://linear.app/scout1/issue/SCO-76) |
| Cable gland and epoxy-potted lead penetration | Leaks where cables enter the dry chamber | coupon | Dry after 1 week soak | [SCO-53](https://linear.app/scout1/issue/SCO-53), [SCO-144](https://linear.app/scout1/issue/SCO-144) |
| Assembled buoy float check: waterline and freeboard | Mass/freeboard model is wrong | looks-like | Freeboard within ±0.5 in of the 4.27 in model | [SCO-124](https://linear.app/scout1/issue/SCO-124) |
| Self-righting / tilt test from 90° and 180° | Buoy stays capsized | works-like | Rights itself unaided from any angle | [SCO-82](https://linear.app/scout1/issue/SCO-82), [SCO-125](https://linear.app/scout1/issue/SCO-125) |
| Drop test of the assembled ring with 1.5 in caps | Lean wedge-bottom cracks on launch | looks-like | No cracks; height, surface and orientation recorded | [SCO-71](https://linear.app/scout1/issue/SCO-71) follow-up |
| Proof load of the mooring attachment and ballast-arm root | Through-bolts or backing plate pull through PETG | works-like | Holds ~1.5× LC9 snap (~1.2 kN) with no permanent set | [SCO-82](https://linear.app/scout1/issue/SCO-82), [SCO-75](https://linear.app/scout1/issue/SCO-75) |
| Pressure test of the sealed housings to max site depth | Seals leak at 8 m | works-like | Dry at ≥ 8 m equivalent (~0.8 bar) for 24 hr | [SCO-82](https://linear.app/scout1/issue/SCO-82) |
| Long-duration soak of the integrated buoy, in parallel with other work | Slow leaks or water uptake over weeks | works-like | Internal humidity stable for 4+ weeks | [SCO-140](https://linear.app/scout1/issue/SCO-140) |
| Pool test (float, self-righting, LoRa through water) | Behaves differently in open water than in a bin | works-like | All of the above in one deployment | [SCO-143](https://linear.app/scout1/issue/SCO-143) |
