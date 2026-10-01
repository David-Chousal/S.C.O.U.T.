# Mechanical Prototype & Risk-Reduction Test Register

> **Summary** — One list of every mechanical prototype and risk-reduction test S.C.O.U.T. has run
> or plans to run: what risk each test retires, what kind of prototype it uses, the pass
> benchmark, and the result. Set up 2026-10-01 at the request of Jes Kuczenski (GENG advisor),
> who asked for testing to be layered and benchmarked before results are read
> ([meeting 2026-09-30](../../docs/planning/meeting-notes.md)).
>
> Part of [`mechanical/test/`](README.md). Detailed write-ups stay in their own records; this
> page is the index. Benchmarks are **provisional** until
> [SCO-139](https://linear.app/scout1/issue/SCO-139) sets them, and the stage plan comes from
> [SCO-140](https://linear.app/scout1/issue/SCO-140).

## How to use this page

- **Add a row before the test runs**, with its benchmark, then fill in the result afterwards.
  A test whose pass mark is written down after the result isn't a test.
- **Prototype type:** *coupon* (a small piece testing one feature), *looks-like* (form and
  fit), *works-like* (function), or *analysis* (closed-form or FEA, no hardware).
- **IDs are permanent.** `RR-NN`, numbered in order and never reused.

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
| RR-12 | 2026-10-01 | **Short sensor-housing coupon, face seal with a purchased O-ring** | The face-seal groove leaks with a real ring (RR-07 failed with a printed one) | coupon | Dry paper towel inside after **24 hr at ≥ 0.3 m in ~35 ppt salt water**, then 1 week | Printing | [record](sensor-housing-oring-coupon-2026-10-01.md), [SCO-108](https://linear.app/scout1/issue/SCO-108) |
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
