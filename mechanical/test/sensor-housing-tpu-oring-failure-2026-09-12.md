# Turbidity Sensor Housing — Extended Submersion Failure, 2026-09-12

> **Summary** — John opened the turbidity sensor housing prototype after an extended
> submersion and found it **not waterproof**. The seal was a **TPU-printed O-ring** — a
> known, deliberate shortcut for this article, not the specified off-the-shelf AS568-137 ring
> — and is the suspected cause. The ring held reasonably well for roughly a week before
> meaningful water got in, which matters for how the failure reads (see
> [What this does and doesn't establish](#what-this-does-and-doesnt-establish)). **Decision:**
> no further housing submersion testing until a real, purchased O-ring is on hand — see
> [SCO-106](https://linear.app/scout1/issue/SCO-106).

---

## Method

Informal field/bench check, not the controlled indicator-paper method used in the
[2026-08-24 test](waterproofing-submersion-test-2026-08-24.md): the assembled housing was left
submerged, then opened and inspected. No moisture-indicator paper or duration log was set up
going in, so timing below is John's recollection ("almost exactly a week"), not a timestamped
start/stop.

**Seal:** a **TPU-printed O-ring**, used because it was easier to produce short-term — the same
deliberate shortcut as the [2026-08-24 bench test](waterproofing-submersion-test-2026-08-24.md#method),
not the specified off-the-shelf **AS568-137** ring. The formal prototype is intended to use the
purchased ring once it's sourced ([SCO-106](https://linear.app/scout1/issue/SCO-106)).

**Article:** the printed turbidity sensor-housing prototype (body ↔ cap joint, 3-bolt pattern
with an O-ring visible at the mating face) — assumed to be the current
[face-seal remodel](../cad/sensor-housing/README.md#face-seal-remodel--2026-08-29)
(`sensor-housing-body-face-seal` + `sensor-housing-sealed-cap-v2`) based on the photo, but not
independently confirmed against a specific STEP revision.

**Photo:** shared in chat, not yet saved to the repo — add it here once available (same gap the
2026-08-18 wedge cross-section fit-test photo had; see
[floatation/README.md](../cad/floatation/README.md)).

## Result

❌ **Fail** — water had gotten into the housing by the time it was opened.

**Nuance worth keeping, not smoothing over:** the ring was, in John's own assessment, **very
poor quality**, and yet the housing kept out *most* water for close to a week before failing
meaningfully. Read together, that's consistent with a **slow leak from an inconsistent seal**
(the printed ring's dimensional variability let some water past at a low rate) rather than an
immediate, wide-open failure — a materially different failure mode than the 2026-08-24 PETG
article, which failed outright on a stringy print. This test doesn't distinguish which of
those two failure modes actually happened here (no interim checks were done), but the
"held for most of a week, then failed" behavior is itself a data point worth recording as-is.

## Decision

**No further submersion testing on this housing until a real, off-the-shelf O-ring is on
hand.** John's reasoning: the TPU-printed ring's inconsistency is the leading suspect for this
failure, so further tests on printed-ring seals would keep re-testing the same confound rather
than validating the actual face-seal design. This directly reinforces why
[SCO-108](https://linear.app/scout1/issue/SCO-108) (the formal re-test) is written to require
the *specified* rings, not printed stand-ins, and why it's gated on
[SCO-106](https://linear.app/scout1/issue/SCO-106) (choose the elastomer and order).

## What this does and doesn't establish

- **Does:** add a second, independent data point (after the
  [2026-08-24 test](waterproofing-submersion-test-2026-08-24.md)) that a TPU-printed O-ring is
  an unreliable stand-in for the specified AS568-137 ring — this time on the current face-seal
  geometry, over a much longer duration (~1 week vs. ~30 hours), and failing rather than
  passing. Confirms the housing was actually put in water, not just designed and left
  untested (see the correction to `facts.md`'s "neither housing has been submersion-tested"
  claim, now stale for the sensor pod specifically).
- **Doesn't:** validate or invalidate the **face-seal design itself** — groove dimensions,
  squeeze %, and flange stiffness (the open [SCO-91](https://linear.app/scout1/issue/SCO-91)
  acceptance criteria) are still unverified, because the seal actually under test was a printed
  ring, not the specified one. Doesn't pin down whether the failure was a slow weep the whole
  time or held dry for most of the week and failed late — no interim inspection was done.
  Doesn't resolve the [O-ring manufacturing method decision](../../docs/hub/decision-log.md)
  (off-the-shelf, decided 2026-08-17) — it's a second point of informal evidence in the
  direction that decision already assumed, not new grounds to revisit it.

## Next steps

1. **Order the real AS568-137 (and AS568-043) O-rings** — [SCO-106](https://linear.app/scout1/issue/SCO-106),
   currently the blocker for any further housing submersion work.
2. Once the real ring is on hand, re-run the formal [SCO-108](https://linear.app/scout1/issue/SCO-108)
   re-test with a logged start/stop time and, ideally, an interim check partway through — this
   test's biggest gap was not knowing whether the failure was gradual or sudden.
3. Add the photo to this record once it's saved into the repo.
4. Confirm which STEP revision the tested article actually matches (assumed face-seal remodel
   above — worth a quick check against the physical part if there's any doubt).
