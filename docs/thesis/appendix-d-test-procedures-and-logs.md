# Appendix D: Test Procedures, Logs and Raw Data (Mechanical)

> **Summary** — The mechanical test program for S.C.O.U.T.: the layered strategy and the rules every test follows, the
> standard procedures, a chronological log of the eighteen tests run so far (RR-01 to RR-18) with the detailed records for
> the key ones, the raw print-weight data, and the stages still to run. Part of the
> [thesis working draft](README.md); the calculations behind the analysis tests are in
> [Appendix C](appendix-c-calculations.md). Status: first draft from the repo records; quoted values should be re-checked
> against the linked records before submission.

---

## D.1 Test strategy

### D.1.1 Layered testing

At the first joint advisor meeting (2026-09-30) the GENG advisor asked for testing in tiers, each with its own prototype
and a pass mark written **before** the test runs: not "100% waterproof" but "dry after 24 hours at 0.3 m". The program
follows that advice.

| Prototype type | Meaning | Cost of a failure |
|---|---|---|
| Coupon | A small piece testing one feature (a seal, a wall count, a lid) | Hours of print time |
| Looks-like | Right shape and mass, no working electronics | A print and an afternoon |
| Works-like | Working electronics inside a sealed buoy | Parts and weeks |
| Analysis | Closed-form or FEA, no hardware | None |

Cheap layers run first. A stage starts only once the layer below it has passed, except where a parallel run is noted.

### D.1.2 The risk-reduction register

Every test gets a permanent ID (`RR-NN`, never reused) and a row **before** it runs, with the risk it retires, the
prototype type and the benchmark. The result is filled in afterwards. A pass mark written after the result is not a test.
The register is the index; each detailed record stays in its own file.
Source: [Risk-Reduction Register](../../mechanical/test/risk-reduction-register.md),
[Layered Test Protocol](../engineering/layered-test-protocol.md).

---

## D.2 Standard procedures

### D.2.1 Waterproofing indicator test (paper towel)

Used for every housing and coupon seal test.

1. Measure and record the printed groove depth, width and inside diameter before assembly.
2. Put a dry sheet of high-absorption paper (toilet paper or a paper towel) inside as a moisture indicator.
3. Seat the O-ring (no lubricant, or silicone grease, recorded) and tighten the bolts evenly, recording the torque.
4. Submerge at 0.3 m or deeper in water mixed to about 35 ppt salinity (Instant Ocean), at room temperature.
5. At 24 hours, open the housing and inspect the paper. Any dampness means the seal leaked; a bone-dry sheet means it held.
6. If dry, continue to one week and inspect again.

**What the method shows.** It is a pass or fail indicator. It says whether water got in, not how much or how fast. The
first tests (2026-08-24) were fresh-water and did not log salinity, depth or torque; those became required fields from the
coupon series on.

### D.2.2 Print weight verification

Slice each part from its STEP file at the stated profile (wedge family 3–4 walls and about 15% gyroid; chassis family 6
walls and 25–30% gyroid), PETG, and record the slicer's model figure. Support material is recorded but excluded from the
weight used. Raw data in D.4.

### D.2.3 Finite-element runs

Fusion static-stress study, custom PETG profile, parabolic mesh, loads and constraints as listed in
[Appendix C, C.2](appendix-c-calculations.md#c2-finite-element-analysis-autodesk-fusion-static-stress). Each run is
exported as an HTML report and its numbers are copied into the record. Pass criterion: safety factor at least 4, relaxed
to about 3.5 for the thin-walled v5 re-check.

### D.2.4 Planned procedures (not yet run)

- **Ingress by weight** (SCO-141): weigh a PETG sample, submerge it (with and without coating), reweigh after 10–20 days.
  The weight gain is the water that got in. Small samples are acceptable; extrapolate by surface area.
- **Float and waterline** (stage 7): float the assembled buoy in a bin at about 35 ppt and compare waterline and
  freeboard with the model, within ±0.5 in.
- **Self-righting tilt** from 90° and 180°; **drop** of an assembled ring with the 1.5 in caps, recording height, surface
  and orientation for each drop; **pressure** to 8 m equivalent (about 0.8 bar) for 24 hours.
- **Humidity calibration**: add known quantities of water to a sealed chamber and record the sensor response.

---

## D.3 Test log

| ID | Date | Test | Type | Benchmark | Result |
|---|---|---|---|---|---|
| RR-01 | 2026-08-17 | Flotation side-load FEA (300 N) | analysis | SF ≥ 4 | **Pass**, min SF 25.4 |
| RR-02 | 2026-08-24 | Print weight, five v4 parts | manufacturing | Slicer within ~10% of measured | **Partial**, 31% wedge discrepancy unreconciled |
| RR-03 | 2026-08-24 | Bench submersion, three articles (TPU-printed rings) | coupon, looks-like | Dry inside | **Mixed**: PLA pod passed ~30 hr; low-quality PETG and electronics housing failed |
| RR-04 | 2026-08-29 | Mooring load-case FEA LC2–LC9 and a service case | analysis | SF ≥ 4 | **Pass**, SF 10–1450 (ring contact artifacts aside) |
| RR-05 | 2026-09-07 | Wedge wall-thickness check | analysis | Stress within allowable | **Pass** on stress; internal web required |
| RR-06 | 2026-09-09 | Ring external-pressure buckling | analysis | SF ≥ 2 | Bare **fails** (0.2–0.7); foam-backed **passes** (3–5) |
| RR-07 | 2026-09-12 | About 1-week soak, pod with TPU-printed ring | works-like | Dry after 1 week | **Fail** |
| RR-08 | 2026-09-23 | Split wedge-bottom print, Prusa Mini vs larger printer | manufacturing | Prints to spec first time | Mini **fails**; larger printer **passes** |
| RR-09 | 2026-09-25 | v5 FEA re-check and ring buckling | analysis | SF ≥ ~3.5 | **Pass**, min SF ~3.5 (PETG, unfoamed) |
| RR-10 | 2026-09-25 | Single-wedge drop | coupon | No visible damage | **Pass**, one sample, height not recorded |
| RR-11 | 2026-09-29 | Large-angle stability calculation | analysis | Rights from any angle | v5 **fails** (stable inverted); v6 with ballast **passes** |
| RR-12 | 2026-10-01 | Pod coupon run 1: purchased ring, 3 bolts | coupon | Dry at 24 hr, ≥ 0.3 m, ~35 ppt | **Fail** 2026-10-06, slightly damp |
| RR-13 | 2026-09-30 | v5 chassis print on the dedicated printer | manufacturing | Seal faces flat and round within ±0.2 mm | Printing at last record |
| RR-14 | 2026-10-06 | Pod coupon run 2: PLA, 4 bolts, ribbed cap, slightly larger ring | coupon | Same | **Fail** 2026-10-07, leaked |
| RR-15 | 2026-10-06 | Pod coupon run 3: 6 bolts, thicker cap and ribs | coupon | Same | **Fail** 2026-10-08, flooded |
| RR-16 | 2026-10-08 | Pod coupon run 4: groove matched to the 3/16 in ring, 6 bolts, shorter body | coupon | Same | Body supplied; result not recorded |
| RR-17 | 2026-10-16 | Dry float of the assembled foam-version buoy in a bin | looks-like | Freeboard within ±0.5 in of the model | Floated well, **leaked slightly** at the epoxy seams; waterline not recorded |
| RR-18 | 2026-10-21 | Pod, PETG, inserts pressed from the bottom, design 2.5 | works-like | Dry at 24 hr | **Pass**, fresh water, no sensor, negligible depth |

**Not yet recorded:** several informal "is the paper towel wet inside the capsule" checks, and drop tests beyond RR-10.

---

## D.4 Detailed records

### D.4.1 Bench submersion, 2026-08-24 (RR-03)

Three printed housings, each with a paper indicator and a **printed TPU O-ring** (a shortcut because printing was faster
than sourcing, not a comparison of printed against purchased rings).

| Article | Seal | Duration | Result |
|---|---|---|---|
| Sensor housing, PLA | TPU-printed ring | ~30 hr | **Pass**, paper bone-dry |
| Sensor housing, PETG (low print quality) | TPU-printed ring | not recorded | **Fail** |
| Electronics housing | Rubber washers specified at the bolts, **none fitted** | not recorded | **Fail**, significant ingress |

**Hypotheses.** The PETG ring printed visibly stringy and probably did not seat, but the PLA and PETG articles differ in
both print quality and material, so the test cannot separate the two. The electronics housing failed as expected, because
the washers its design called for were missing from the article. **Source.**
[Record](../../mechanical/test/waterproofing-submersion-test-2026-08-24.md).

### D.4.2 Pod soak with a TPU ring, 2026-09-12 (RR-07)

An informal soak of almost exactly one week with no moisture indicator or timestamped start and stop. The ring was a
printed TPU one, of poor quality in John's assessment. It kept most water out for most of the week, which reads as a slow
leak from an inconsistent seal and not an immediate failure. **Decision:** no further housing soaks until a purchased
O-ring is on hand. [Record](../../mechanical/test/sensor-housing-tpu-oring-failure-2026-09-12.md).

### D.4.3 Pod seal coupon series, 2026-10-01 to 10-08 (RR-12, RR-14, RR-15, RR-16)

A short coupon of the pod joint, sized for a purchased 3/16 in plumbing ring (groove 0.141 in deep by 0.262 in wide, 25%
squeeze, about 75% fill), tested by the D.2.1 procedure.

| Run | Change | What happened | Lesson |
|---|---|---|---|
| 1 (RR-12) | 3 bolts, flat cap, hand-tightened | Slightly damp at 24 hr; the cap flexed between the bolts, leaving a visible gap | The 3-bolt flat cap is not stiff enough to hold a face seal closed all the way round |
| 2 (RR-14) | PLA, 4 bolts, ribbed cap, slightly larger ring | Leaked | Stiffening alone did not fix it |
| 3 (RR-15) | 6 bolts, thicker cap and ribs | Flooded | The ring (4.76 mm cross-section) did not match a groove cut for a 2.62 mm ring |
| 4 (RR-16) | Groove cut for the real ring, about 28% squeeze, shorter body | Body supplied 2026-10-08; result not recorded | |

Groove measurements, torque and salinity were not recorded for the early runs, which is why D.2.1 now requires them.
[Record](../../mechanical/test/sensor-housing-oring-coupon-2026-10-01.md).

### D.4.4 PETG pod pass, 2026-10-21 (RR-18)

A dry paper towel inside the pod after 24 hours submerged in fresh water, with no sensor and negligible depth. Two changes
set it apart from the failed runs: **printing in PETG**, and **pressing the heat-set inserts in from the bottom** of the
flange, since from the top the hot inserts slightly deformed the flange face and reduced even clamping. It was the most
recent version, 2.5. Bolt count and torque were not recorded, and the photo shows eight inserts. This is a seal check, not
the salt-water or pressure validation. [Record](../../mechanical/test/sensor-housing-petg-pass-2026-10-21.md).

### D.4.5 Buoy assembly and sealing, 2026-10-06 and 10-07

New bottom sections were printed and the wedges, chassis and bottom caps assembled. Inside seams were glued with Gorilla
Glue, with painter's tape holding the parts while it cured. On 2026-10-07 J-B Weld two-part epoxy went on many outside
seams from a syringe. Eighteen photos record the assembly. The dry float (RR-17) later showed slight leaks at these seams.
Not recorded: print version, cure times, which seams were bonded, and whether any joint stays unbonded for service.
[Record](../../mechanical/test/buoy-assembly-2026-10-06.md).

### D.4.6 Wedge-bottom print, 2026-09-23 and 09-24 (RR-08)

A full wedge bottom takes over a day to print and the buoy needs six, while the medium lab Prusa had failed and the large
printer was offline. The lean wedge bottom was split into two 30° halves along a radial cut, and half one started on a
Prusa Mini. The Mini failed repeatedly (bed adhesion, Z calibration), while the larger printer printed wedges well once
PTFE-tube feed resistance was fixed. The one-piece part stays the baseline, since a seam adds a leak path to the impact
cap. [Record](../../mechanical/test/wedge-bottom-split-print-2026-09-23.md).

### D.4.7 Wedge drop, 2026-09-25 (RR-10)

One printed v5 wedge dropped; no visible deformation. One sample, informal, height not recorded. It was accepted as
enough to close the impact work together with the v5 FEA re-check.
[Record](../../mechanical/test/wedge-drop-test-2026-09-25.md).

---

## D.5 Raw data

### D.5.1 Print weights, 2026-08-24 (v4 floatation set, PETG)

| Part | Filament (model) | Weight (model) | Weight (support) | Print time |
|---|---|---|---|---|
| Chassis | 235.20 m | 712.82 g | 3.38 g | 10 h 47 min |
| Wedge | 107.51 m | 325.83 g | none | 6 h 23 min |
| Wedge bottom | 59.79 m | 181.21 g | none | 3 h 23 min |
| Chassis cap | 29.63 m | 89.79 g | none | 1 h 26 min |
| Wedge cap | 41.86 m | 126.86 g | 6.11 g | 2 h 18 min |

Six wedge sets and one chassis per buoy. **Unreconciled:** the wedge weighed 474.58 g on 2026-08-21 at the same nominal
settings, a 31% difference with no logged change. Check the sliced profile, a scale weighing and the CAD file.
[Record](../../mechanical/test/print-weight-verification-2026-08-24.md).

### D.5.2 Other raw data locations

- **FEA reports** (HTML, one per run): `mechanical/test/fea-*.html`. Numbers are summarized in Appendix C.
- **Photos:** assembly (18), J-B Weld (2), coupons and the pod tests, in `mechanical/test/`.
- **Stability calculator results:** `mechanical/simulations/buoy-stability/results/` (CSV, PNG and JSON, dated).

---

## D.6 Stages still to run

From the [Layered Test Protocol](../engineering/layered-test-protocol.md); the unit counts and dates there are a
proposal until the team confirms them.

| Stage | Benchmark | Tracks |
|---|---|---|
| Saltwater coupons at 1, 2 and 3 wall layers, with and without sealant | Dry after 1 week at ~35 ppt | SCO-141 |
| Drop of an assembled ring with the 1.5 in caps | No cracks; each drop recorded | SCO-173 |
| Float and self-righting in a bin | Freeboard within ±0.5 in; rights from 90° and 180° | SCO-171, SCO-172 |
| Pressure test of sealed housings | Dry at 8 m equivalent (~0.8 bar) for 24 hr | SCO-177 |
| Lid, antenna bulkhead and battery bay | Lid seals; feed-through dry | SCO-162 |
| Long soak of the integrated buoy | Humidity stable 4+ weeks; at least 95% of packets received | SCO-180, SCO-161 |
| Integrated MVP | Electronics in the floating buoy, sensors reading, packet received at the shore station | SCO-182 |
| Real-ocean flotation | Floats at the modelled waterline; self-rights; no leaks | SCO-183, SCO-184 |
| Prototype deployment and Hawaii | Per the permit route | SCO-143, SCO-195, SCO-164 |

The proof-load of the mooring attachment and the foam-fill trials were cancelled or deferred when the float design
changed on 2026-10-16.

---

## D.7 Lessons from the test program

- **Seal failures came from the joint, not the ring concept.** Flange flexing between bolts and a ring that did not match
  its groove each caused a failure, and fixing them made the face seal work.
- **Print material and process mattered.** PETG held where PLA with a printed ring had not, and inserting from the bottom
  kept the sealing face flat.
- **Record the conditions.** Early tests lacked salinity, depth, torque and groove measurements, which limits what they
  prove. The procedure in D.2.1 now requires them.
- **Benchmarks first.** The advisors' rule, a pass mark before the test, is what turns an informal check into a result.
