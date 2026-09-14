# Sensor Housing

CAD models for the sensor/turbidity pod: mounting and housing for the sensors that sit
underwater on the sensor stem. Narrated by John Ryan (field/mechanical lead).

> ✅ **Resolved 2026-08-15 (John Ryan):** [ADR-0003](../../../docs/decisions/0003-single-point-sensing.md)
> stands — the current build deploys **one sensor per modality, single point**, multi-depth
> deferred. This pod is designed to enable multi-depth scaling later, not to deploy it now. See
> [Why build for scale now](#why-build-for-scale-now) below for the full reasoning.

## Drawings

- `turbidity-sensor.pdf` — turbidity sensor housing drawing

PDF drawing export only. Per
[CONVENTIONS.md → File formats](../../../docs/CONVENTIONS.md#file-formats), add the **native
source + a STEP export** alongside it when available. If this drawing is actually an electronics
schematic rather than a housing, it belongs under [`hardware/`](../../../hardware/) instead.

## System context

The buoy's electronics and floatation sit above the waterline; a solid **sensor stem** hangs
below it. Multiple cables run out of the top of the buoy — near where the solar panel and
LoRa/antenna equipment sit — down to the individual underwater sensors. This pod is one of
those sensor nodes.

Stakeholder input (NOAA researchers) is the driver: multiple temperature and turbidity readings
at different depths let the team observe **stratification** through the water column — see
[Stakeholder Interviews](../../../docs/research/stakeholder-interviews.md). The design also
targets **easy replaceability** — a fouled or failed pod should swap out without disturbing the
rest of the stem.

## Pod construction — dry/flood chamber

The pod splits into two chambers, epoxied together at a watertight interface:

- **Dry chamber** — holds the small board/chip/circuit that reads the turbidity probes. Never
  contacts water.
- **Flood chamber** — deliberately water-filled. The turbidity probes stick into it. It's
  shaped to **block ambient light around the probes** — avoiding light pollution in the
  turbidity reading — while still letting water flow through freely.

**Why this exists:** the hydrophone and temperature (thermometer) sensors are
**pre-waterproofed off-the-shelf** and don't need special housing. The turbidity probe
generally is **not** pre-waterproofed, which is what drives this chamber split.

**Iteration note:** an earlier version exposed the turbidity probes directly on the outside of
the cylindrical body wall (no flood chamber). The flood chamber was added specifically to
control ambient light exposure at the probe.

## Why build for scale now

**The decision, precisely:** the graded capstone build deploys one sensor per modality at one
point, per [ADR-0003](../../../docs/decisions/0003-single-point-sensing.md). Multi-depth
sensing is *not* being activated now. But the pod hardware is deliberately designed so that
adding depths later is a manufacturing problem, not a redesign problem.

**Why design for scale before it's needed.** The alternative — build one single-point pod now,
throw it away, and redesign a "real" multi-depth pod later if the team decides to pursue it —
wastes the iteration work this pod already represents (see the component table below: two full
top-cap and body revision lines, a threading pass, a flood-chamber redesign). Since
[manufacturing is in-house additive only](../floatation/README.md) — the
same constraint driving the floatation build — the *marginal* cost of producing a second or
third pod is low: it's more prints, not new tooling or a new mold. That only pays off, though,
if the pod design itself doesn't have to change to go from one instance to many. So the
iteration work here was spent making the pod a **self-contained, interchangeable module**:

- The **dry/flood chamber split with an epoxied interface** is a complete sensing module in
  itself — it doesn't need to know how many other pods exist on the stem, or where.
- The **threaded body variant** and the move away from a fixed-port design toward the current
  no-port body mean a pod attaches to the sensor cable the same way regardless of position
  along the stem — shallow, mid, or deep.
- This directly serves the **replaceability goal** from the stakeholder interviews: a design
  that swaps in and out easily at one depth is, by construction, a design that can be repeated
  at other depths without new engineering.

**What's deliberately *not* solved here.** Activating multi-depth for real is a cross-discipline
problem, not a mechanical one, and out of scope for this pod design:

- **Wiring/power** — multiple pods need multiplexed analog channels and a revised power budget;
  today's single-point wiring assumes one of each sensor.
- **Firmware** — the SAMD21's 32 KB SRAM and the current sampling loop assume one reading per
  modality per wake cycle, not N.
- **CSV schema** — [`data-schema.md`](../../../docs/engineering/data-schema.md) already reserves
  `temp_c_NN` multi-depth columns as a *future extension only*, per ADR-0003's own consequences
  section; they're not wired up.

So: the mechanical side is intentionally ahead of the electrical/firmware side. That's a
deliberate choice, not an oversight — it means that if/when the team decides to pursue
multi-depth in a future revision, the pod itself won't be the blocker.

## Current components

| File | Role | Status |
|---|---|---|
| [`sensor-housing-body-face-seal.step`](sensor-housing-body-face-seal.step) | Pod body, no port — **face-seal remodel, 2026-08-29** (see [below](#face-seal-remodel--2026-08-29)) | **Current** |
| [`sensor-housing-sealed-cap-v2.step`](sensor-housing-sealed-cap-v2.step) | Sealed cap — mates to the body across the AS568-137 static face-seal O-ring. **Spigot re-cut 2026-09-02** (see [below](#sealed-cap-spigot-tolerance-tweak--2026-09-02)) | **Current** |
| [`sensor-housing-sealed-cap.step`](sensor-housing-sealed-cap.step) | Sealed cap, first face-seal revision — **superseded 2026-09-02** by `-v2` | Iteration |
| [`sensor-housing-flood-chamber-cap.step`](sensor-housing-flood-chamber-cap.step) | Flood chamber cap — where the light-blocking geometry lives | Current (single version provided) |
| [`sensor-housing-o-ring.step`](sensor-housing-o-ring.step) | O-ring seal, modeled directly | Current |
| [`sensor-housing-body-current.step`](sensor-housing-body-current.step) | Pod body, no port — **superseded 2026-08-29** by the face-seal remodel | Iteration |
| [`sensor-housing-top-cap-current.step`](sensor-housing-top-cap-current.step) | Top cap — **superseded 2026-08-29** by `sensor-housing-sealed-cap.step` | Iteration |
| [`sensor-housing-body-no-port-threaded.step`](sensor-housing-body-no-port-threaded.step) | Pod body, no port, threaded variant | Iteration |
| [`sensor-housing-body-v1.step`](sensor-housing-body-v1.step) | Pod body, earlier revision (AS568-137 O-ring seal, ported) | Iteration |
| [`sensor-housing-top-cap-v1.step`](sensor-housing-top-cap-v1.step) | Top cap, earliest revision | Iteration |
| [`sensor-housing-top-cap-v2.step`](sensor-housing-top-cap-v2.step) | Top cap, second revision | Iteration |
| [`sensor-housing-top-cap-no-port.step`](sensor-housing-top-cap-no-port.step) | Top cap, no-port variant | Iteration |

Body sealing uses an **AS568-137 O-ring** (3/32" ≈ 2.62 mm cross-section). The design uses
**heat-set inserts on the inside diameter of the body cylinder** for the cap fastening. File
naming here is John Ryan's own designation ("current" vs. prior iterations) from the source
folder — not inferred, since (as with the [floatation iterations](../floatation/README.md))
bulk Onshape re-export timestamps aren't a reliable ordering signal.

> **Re-confirmed current, 2026-09-08.** John re-exported and sent the cap and body
> ("Sealed Cap2", "Body (No Port) — AS568-137 O-ring"). Both are **geometrically byte-identical**
> (normalised, entity-renumber-tolerant diff) to the committed
> [`sensor-housing-sealed-cap-v2.step`](sensor-housing-sealed-cap-v2.step) and
> [`sensor-housing-body-face-seal.step`](sensor-housing-body-face-seal.step) — only the export
> timestamp differs, so no new file was added. This is John treating the v2 cap (with the
> Ø31.496 mm spigot) and the face-seal body as his current parts. **The flood chamber is
> deliberately not in this set — John is re-speccing it** (see [below](#flood-chamber--being-re-specced-2026-09-08)).

## Face-seal remodel — 2026-08-29

**Change (John Ryan).** The body↔cap joint was reworked from the earlier arrangement into a
proper **static face seal**:

- **Uniform face-seal O-ring groove** — the AS568-137 O-ring now sits in a single continuous
  face groove with the mating faces designed to **fully touch** (metal-to-metal, or rather
  PETG-to-PETG, hard stop) at full assembly. The faces bottoming out sets the O-ring squeeze to
  a fixed, designed compression % rather than leaving it to fastener torque.
- **Reinforced flange faces** — the bolt flanges were stiffened so that **bolt-flange
  bowing/bending between the bolts does not locally reduce the O-ring compression**. On the
  prior design, tightening the 3 bolts could dish the flange inward at the bolts and lift it
  between them, so the seal squeeze varied around the circumference and dropped toward the
  minimum-compression points. The stiffer flange holds the groove face flat, keeping the
  compression % uniform all the way around.

**Geometry (read from the STEP, confirm against the drawing):** 3-bolt flange on a **Ø44.45 mm
(1.75") bolt circle**, ~Ø5.6 mm clearance holes; body ~57 mm tall, flange ~Ø54 mm; sealed cap
~12.7 mm thick with the matching 3-bolt pattern and the face groove (modelled as a torus,
~Ø31.75 mm centreline). ⚠️ The CAD groove torus reads a ~3.18 mm minor radius — larger than the
2.62 mm AS568-137 cross-section — so **confirm the groove width/depth against a face-seal groove
table for AS568-137** (typical: ~3.4 mm wide × ~2.0 mm deep for ~20–25 % squeeze) before print.

**FEA.** John built a **custom PETG material profile** in Fusion for the structural work (E
2240 MPa, ν 0.38, yield 35 MPa, UTS 45 MPa — see
[`../../../docs/engineering/buoy-structural/force-budget.md`](../../../docs/engineering/buoy-structural/force-budget.md)
for the profile and the density caveat). A face-seal / flange-bowing study on this housing is
the natural next FEA once the buoy mooring load cases (LC3–LC9) are done.

**Still open:** the exact AS568-137 face-groove dimensions (above); a submersion re-test of the
remodelled housing (the [2026-08-24 test](../../test/waterproofing-submersion-test-2026-08-24.md)
was on the prior design); heat-set insert size/depth for the 3 cap bolts.

Dimensions are TBD in CAD — a first-pass **formal packing analysis is now available**:
[Sensor Pod Packing Budget](../../../docs/engineering/sensor-pod-packing-budget.md). Headline:
the current committed body (~57 mm tall, ~Ø31.5 mm bore) is **undersized on diameter** against
the SEN0189 probe's own mounting-ear span — recommends growing the dry chamber to ≥Ø52 mm.
See [`docs/hub/facts.md`](../../../docs/hub/facts.md#mechanical--deployment).

**Native source:** see [`mechanical/cad/README.md`](../README.md#native-source) — one Onshape
document covers the whole project, not a separate one per subsystem.

## Sealed cap spigot tolerance tweak — 2026-09-02

The cap's **pilot spigot** — the short cylindrical land, 7.62 mm long, that locates the cap
inside the body bore — was reduced from **Ø31.75 mm (1.250") to Ø31.496 mm (1.240")**, a
0.254 mm (0.010") diameter cut. That is the **only** difference between
[`sensor-housing-sealed-cap.step`](sensor-housing-sealed-cap.step) and
[`sensor-housing-sealed-cap-v2.step`](sensor-housing-sealed-cap-v2.step) — every other surface,
the 3-bolt pattern, and the face groove are byte-identical between the two exports. The new
diameter matches the body's own Ø31.496 mm bore surface exactly, so the two now nominally
line-to-line rather than interfering.

Originally found by diffing the STEP exports rather than reported. **John re-sent this exact
cap as his current part on 2026-09-08**, so the Ø31.496 mm spigot is confirmed as intended.
Still open: whether 0.010" diametral clearance is enough for a clean printed fit — verify on
the next pod print.

The **body** was re-exported on the same day and is **geometrically unchanged** from the
committed [`sensor-housing-body-face-seal.step`](sensor-housing-body-face-seal.step) (identical
STEP `DATA` section), so no new body file was added.

## Waterproofing bench test — 2026-08-24

A PLA print of this housing, sealed with a **TPU-printed O-ring** (not the AS568-137 spec
above — printed rings were used on this test purely for speed, not as a deliberate comparison),
passed a ~30-hour bench submersion test dry. A PETG print of the same design at lower print
quality failed the same test — working hypothesis is a stringy, imperfectly-seated printed
O-ring on that print, not a PLA-vs-PETG material difference, but that's unconfirmed (the two
articles differ in both variables at once). Full record:
[`waterproofing-submersion-test-2026-08-24.md`](../../test/waterproofing-submersion-test-2026-08-24.md).

**Worth noting next to [the O-ring manufacturing decision](../../../docs/hub/decision-log.md)**
(2026-08-17: off-the-shelf, not printed, specifically because printed O-rings were assumed
porous/unreliable) — informal evidence in the same direction as reopening it, but this test
wasn't controlled to actually evaluate that question, so it doesn't resolve it either way. See
[`facts.md`](../../../docs/hub/facts.md#mechanical--deployment).

## Extended submersion failure — TPU O-ring, 2026-09-12

The housing was left submerged for roughly a week with a **TPU-printed O-ring** (a shortcut,
not the specified AS568-137 ring) and, on opening, **was not waterproof**. The ring — by John's
own assessment very poor quality — still kept out most water for most of that week before
failing meaningfully, so this reads as a slow leak from an inconsistent seal rather than an
immediate blow-out. **Decision: no further housing submersion testing until a real, purchased
O-ring is sourced** ([SCO-106](https://linear.app/scout1/issue/SCO-106)) — this test doesn't
validate or invalidate the face-seal design itself, since the ring under test wasn't the
specified one. Full record:
[`sensor-housing-tpu-oring-failure-2026-09-12.md`](../../test/sensor-housing-tpu-oring-failure-2026-09-12.md).

## Sensor-lead dry-chamber penetration — epoxy potting decided, 2026-09-13

**Decision (John Ryan):** where the turbidity sensor's leads cross from the flood chamber into
the dry chamber, seal that penetration with **epoxy potting**, not an O-ring. This is a
previously-undocumented gap — the dry/flood split above and the [O-ring manufacturing
decision](../../../docs/hub/decision-log.md) both predate a specific answer for this joint.

**Why epoxy, not an O-ring, for this specific joint:** an O-ring needs a smooth, round,
dimensionally-precise mating surface (shaft-in-bore or a machined groove) to get uniform
squeeze. A sensor lead is none of that — non-round, jacket/strand-dependent cross-section,
compressible — so squeeze would never be consistent, which is the same inconsistency that just
failed the [printed O-ring test above](#extended-submersion-failure--tpu-o-ring-2026-09-12),
just on a joint geometry where an O-ring was never going to work well regardless of print
quality. Epoxy potting is already the trusted method elsewhere in this build — the dry/flood
chamber halves are epoxied together, the flotation wedge ring seams are epoxied, and the
buoy's main cable exit is already specified as "IP68 cable glands, **marine epoxy**"
([`mechanical/README.md`](../README.md)).

**Execution requirements, not left as "just epoxy it":**

- **Anti-wicking geometry.** Pot inside a short boss/sleeve (~5–10 mm) around the penetration,
  not a flush pour through a thin wall — the dominant failure mode for a potted cable is water
  **wicking along the jacket/strands** past an intact plug, and bonded contact length is what
  stops that, not epoxy volume.
- **Surface prep on the cable jacket**, not just the PETG — lightly abrade and clean with
  isopropyl before potting. Epoxy-to-jacket adhesion is the actual weak point.
- **Strain relief outside the pour** (a tie-down or small printed clamp) so cable tension or
  flex loads the anchor, not the epoxy plug.
- **Marine-grade 2-part epoxy** (the family already spec'd for the cable entry above), not a
  fast 5-minute epoxy — more shrinkage, more brittle.

**Trade-off accepted:** the potted lead cannot be serviced without destroying the pot. Consistent
with the pod's own design intent — the **pod**, not the individual wire, is the field-replaceable
unit (see [Why build for scale now](#why-build-for-scale-now)).

## Formal dry/flood chamber packing analysis, 2026-09-13

Full analysis: [Sensor Pod Packing Budget](../../../docs/engineering/sensor-pod-packing-budget.md).
First real component-level packing pass for this pod, in the same spirit as the
[Electronics Housing Packing Budget](../../../docs/engineering/electronics-housing-packing-budget.md) —
sourced from the SEN0189's own manufacturer drawings (adapter board datasheet, and a probe-body
mechanical drawing pulled from DFRobot's official wiki and saved to
[`hardware/datasheets/dfrobot-sen0189-probe-dimension.png`](../../../hardware/datasheets/dfrobot-sen0189-probe-dimension.png)).

**Resolved a real contradiction in the process:** the
[Electronics Housing Packing Budget](../../../docs/engineering/electronics-housing-packing-budget.md)
had the SEN0189 adapter board listed as occupying volume in the *main* housing — silently
disagreeing with this README's own "dry chamber holds the small board" description since
2026-08-25. Confirmed with John: **the board lives here, in the pod.** The electronics housing
document is corrected (Methods 1–3 recomputed without it).

**Headline result: the current committed dry-chamber body is undersized on diameter.** The
probe's own mounting ears span 44 mm diagonally — bigger than the adapter board itself — and
that, not the board, governs the dry chamber's minimum diameter at **≥Ø52 mm**, against the
~Ø31.5 mm bore committed in the 2026-08-29 face-seal remodel. Full recommended set:

| Dimension | Recommended minimum |
|---|---|
| Dry chamber interior | Ø52 mm × 60 mm |
| Probe-shaft penetration (through the dry/flood wall) | Ø24 mm |
| Flood chamber interior | Ø24 mm × 30 mm, before the light-blocking baffle adds to it |
| Dry chamber wall thickness | 2.0 mm (0.079 in) — a real closed-form check: unlike the foam-backed wedge, this chamber has no backing, so buckling (not yield) governs; `SF` ≈4.7 at the 50.3 kPa / 5 m test pressure |
| Flood chamber wall thickness | 1.2–1.6 mm (0.05–0.06 in), print-integrity only — no net external pressure, water-filled both sides |

**One design choice surfaced, not resolved, by this analysis:** unlike the flexible lead
penetration above, the probe's own shaft *is* round and dimensionally consistent — so an O-ring
is mechanically viable there, and would let the probe be pulled for cleaning (its optical window
fouls) without destroying a potted joint. The analysis recommends epoxy anyway for consistency
with the pod-as-the-serviceable-unit design intent, but flags it as John's call, not a foregone
conclusion.

**Still open:** whether the probe's mounting ears bolt inside the dry-chamber cavity (driving it
to the full Ø52 mm) or against an internal bulkhead face instead — a CAD layout decision, not a
packing-math one. See the packing budget's own open items for the rest.

## Flood chamber — being re-specced (2026-09-08)

`sensor-housing-flood-chamber-cap.step` in this folder dates to **2026-08-15**, the original
dry/flood design — it has **not** been re-exported since the 2026-08-29 body face-seal remodel,
so it is not guaranteed to mate to the current body. **John is re-speccing the flood chamber**
and will export a new part. Until then, treat the committed flood-chamber cap as historical,
not current. Tracked with the housing seal work on
[SCO-91](https://linear.app/scout1/issue/SCO-91).

## Verify the housing against Isabella's turbidity sensor (2026-09-08)

**Task (John Ryan).** Examine the specific turbidity sensor Isabella has selected for the Rev A
build and confirm it physically fits this housing — probe diameter, body length, cable/connector
exit, and the depth it needs to sit into the flood chamber to stay in the light-blocked zone.
**Adapt the flood chamber and body around the real sensor** rather than the generic SEN0189
assumption the pod was first drawn to. This feeds the flood-chamber re-spec above and should be
resolved before the next full pod print. Needs a Linear issue (canonical fact: turbidity =
DFRobot SEN0189 ×1 per [`facts.md`](../../../docs/hub/facts.md#sensing-single-point-per-modality--see-adr-0003)
— confirm that is still the pick).
