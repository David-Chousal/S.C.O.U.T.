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

_Not yet run._
