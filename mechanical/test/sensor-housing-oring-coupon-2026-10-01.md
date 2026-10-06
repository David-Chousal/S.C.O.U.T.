# Sensor Housing O-Ring Coupon — 2026-10-01

> **Summary** — A shortened print of the turbidity sensor housing's flanged dry chamber and
> bolted cap, made only to test the face seal with a **purchased** O-ring. The last housing soak
> (RR-07, 2026-09-12) failed with a TPU-printed ring, and a real ring was the precondition for
> testing again. Register entry **RR-12** in the
> [risk-reduction register](risk-reduction-register.md).
>
> Part of [`mechanical/test/`](README.md). Tracks [SCO-108](https://linear.app/scout1/issue/SCO-108).

## Specimen

| Item | Value |
|---|---|
| Geometry | Shortened sensor-housing body: lower spigot, flared flange, flat cap held by 3 bolts (Fusion, 2026-10-01) |
| O-ring | Hardware-store plumbing ring, **ID 2-1/4 in × OD 2-5/8 in × 3/16 in (0.1875 in) section, measured** |
| Ring material | Not confirmed. Plumbing rings are usually nitrile (Buna-N). The design choice is silicone (decision 2026-09-08), so this tests the groove, not the final elastomer |
| Print material | PETG |

## Groove design (static face seal, external pressure)

| Dimension | Value | Basis |
|---|---|---|
| Groove depth | **0.141 in (3.57 mm)**, range 0.131–0.150 | 25% squeeze (20–30% range) |
| Groove width | **0.262 in (6.65 mm)**, range 0.255–0.270 | ~75% gland fill |
| Groove ID | **2.250 in (57.15 mm)** | Equal to ring ID, so the ring seats on the inner wall under external pressure |
| Groove OD | **2.774 in (70.46 mm)** | Groove ID + 2 × width |

The same 25% squeeze / ~75% fill targets as the AS568-142 design in the
[sensor housing README](../cad/sensor-housing/README.md). Two layout checks:

- The solid face between the Ø52 mm chamber and the groove ID is only ~2.6 mm. Print it solid.
- At the previous Ø74.4 mm bolt circle, the bolt holes would break into this groove. The bolt
  circle needs to be about Ø82 mm or larger (flange OD about Ø98 mm), depending on bolt size.
  Confirm against the CAD.

## Procedure

1. Caliper-check the printed groove depth, width and ID before assembly. Record actual values.
2. Dry paper towel inside, ring seated with no lubricant (or silicone grease, recorded), bolts
   torqued evenly.
3. Submerge at ≥ 0.3 m in salt water mixed to ~35 ppt, at room temperature.
4. Check at 24 hr. If dry, continue to 1 week.

## Pass benchmark (provisional, pending SCO-139)

Paper towel **dry at 24 hr**, and dry again at 1 week.

## Result

**Run 2026-10-06 — FAIL (slightly damp inside at 24 hr; not flooded).**

| Item | Value |
|---|---|
| Soak | 24 hr submerged, salt water (salinity and depth not recorded) |
| Lubricant | None (no grease) |
| Bolt torque | Not recorded (tightened by hand) |
| Fasteners | 3 stainless socket-head screws into brass heat-set inserts |
| Groove measurements | Not recorded |
| Outcome | Interior **slightly damp**, no standing water. Misses the "dry at 24 hr" benchmark |

**Observation (the cause of the leak, per John):** with the cap bolted down, the two faces
touched snugly **at each bolt**, but the cap **flexed between the bolts**, leaving a visible gap
between the faces midway between each pair of bolts. The ring was therefore compressed less, or
not at all, in those sections. The 3-bolt pattern on a flat cap is not stiff enough to hold the
face seal closed all the way round. The failure is in the joint stiffness, not in the ring or
the groove depth.

Not yet tested: whether more bolts, a thicker or ribbed cap, or a stiffer cap material closes
the gap. Candidates only — none chosen.

Photos (2026-10-06): [assembled](sensor-housing-oring-coupon-2026-10-06-assembled.jpg),
[side, gap visible between the bolts](sensor-housing-oring-coupon-2026-10-06-side.jpg),
[top](sensor-housing-oring-coupon-2026-10-06-top.jpg),
[body with the ring seated in the groove, 3 heat-set inserts](sensor-housing-oring-coupon-2026-10-06-body-groove.jpg).


## Run 2 — 2026-10-06 (in the water, result due ~2026-10-07)

Second coupon, changed in response to the run-1 flexing ([CAD](sensor-housing-oring-coupon-2026-10-06-run2-cad.jpg)).

| Item | Run 1 | Run 2 |
|---|---|---|
| Print material | PETG | **PLA** (PETG ran out — a stand-in, and it changes the stiffness) |
| Groove | ID 2.250 in, OD 2.774 in | Same |
| O-ring | 3/16 in section, ID 2-1/4 in | Slightly larger ring that still fits the groove (exact size not recorded) |
| Bolts | 3 | **4** |
| Cap | Flat | **Radial ribs on top**, 4, midway between the bolts |
| Lubricant / torque | None / not recorded | Not recorded |

**Early observation (dry, before the soak):** the cap **still flexes and flares between the bolts**,
though less than run 1. John's read: the ribs need to sit further out for even compression, and an
outer rim ring is under consideration.

**Confound to remember:** four things changed at once (material, ring size, bolt count, ribs), so
a pass or fail will not say which one mattered.

Photos (2026-10-06, before the soak; orange PLA, black ring, paper towel as the moisture indicator):
- Ring seated in the body groove, 4 brass heat-set inserts, towel inside:
  [view 1](sensor-housing-oring-coupon-2026-10-06-run2-ring-in-groove.jpg),
  [view 2](sensor-housing-oring-coupon-2026-10-06-run2-ring-in-groove-2.jpg),
  [blurred](sensor-housing-oring-coupon-2026-10-06-run2-ring-in-groove-blurred.jpg)
- [Cap top: 4 radial ribs and 4 bolt holes](sensor-housing-oring-coupon-2026-10-06-run2-cap-top-ribs.jpg)
- [Body with towel beside the cap](sensor-housing-oring-coupon-2026-10-06-run2-body-and-cap.jpg)
- Assembled, 4 bolts: [side](sensor-housing-oring-coupon-2026-10-06-run2-assembled-side.jpg),
  [side 2](sensor-housing-oring-coupon-2026-10-06-run2-assembled-side-2.jpg)
- [Assembled, held up: a dark seam line is visible between the cap and body flange](sensor-housing-oring-coupon-2026-10-06-run2-assembled-seam-gap.jpg)

_Result: pending (24 hr check)._
