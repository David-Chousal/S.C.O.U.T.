# Waterproofing — Submersion Test, 2026-08-24

> **Summary** — Bench submersion test of three printed housings: a PLA sensor housing sealed
> with a TPU-printed O-ring (**pass**), a PETG print of the same housing family at lower print
> quality (**fail**), and the electronics housing (**fail**, significant water ingress). Photo:
> [`sensor-housing-waterproofing-test-2026-08-24.jpg`](sensor-housing-waterproofing-test-2026-08-24.jpg).

---

## Method

A piece of high-absorption paper (plain toilet paper) was placed inside each housing as a
moisture indicator, the housing was sealed, and the assembly was left submerged in water.
Afterward, the housing was opened and the paper inspected — any dampness means the seal leaked;
a bone-dry sheet means it held. This is a pass/fail indicator method, not a quantitative leak
rate — it confirms whether water got in, not how much or how fast.

## Test articles and results

| # | Article | Seal | Duration | Result |
|---|---|---|---|---|
| 1 | Sensor housing, **PLA** | TPU-printed O-ring | ~30 hours | ✅ **Pass** — paper bone-dry, no moisture detected |
| 2 | Sensor housing, **PETG** (low print quality) | TPU-printed O-ring | Not recorded — **[A]** assumed same window as #1 unless corrected | ❌ **Fail** |
| 3 | Electronics housing | Rubber sealing washers at bolt joints (per design; see note below) | Not recorded — **[A]** assumed same window as #1 unless corrected | ❌ **Fail** — significant water ingress, more than a trace |

Article 1 (PLA housing, assembled) is the part shown in the photo: printed body with a black
O-ring visible at the joint, its cap, and the mounting screws removed alongside it.

## Hypotheses

**Article 2 (PETG, low quality print) — imperfect O-ring fit from print quality, not material.**
The printed TPU O-ring came out visibly **stringy** on this print. Working hypothesis: a
stringy/imperfect O-ring print doesn't seat evenly in its groove, so the seal fails on fit, not
on the seal concept itself — consistent with article 1 (a well-printed TPU O-ring, same concept)
passing cleanly. **Not yet confirmed** — this is a hypothesis from visual inspection at
disassembly, not an isolated variable test (article 1 and article 2 differ in both print quality
*and* base material, PLA vs. PETG, so this test alone can't separate "bad print" from "PETG vs.
PLA" as the cause).

**Article 3 (electronics housing) — no waterproof washers at the bolt penetrations.**
[`electronics-housing/README.md`](../cad/electronics-housing/README.md) documents the assembly
spec as sealing "via rubber sealing washers at the bolt joints," but the physical prototype
tested here **had no such washers** — the in-line bolts go straight into the cavity with bare
metal-on-print contact at each hole. Failure here was expected going in, not a surprise; this
test confirms it rather than discovers it. **Flagged, not yet resolved:** this is a real gap
between the documented design intent (rubber sealing washers) and what was actually built for
this test article — worth a look before assuming the *next* print will pass once washers are
added, since that's still unverified.

## What this does and doesn't establish

- **Does:** confirms a PLA + printed-TPU-O-ring seal can hold for ~30 hours submerged, at least
  once, with a low-fidelity indicator method. Confirms the electronics housing's current build
  (no bolt washers) leaks significantly, consistent with the documented design not yet being
  fully built out.
- **Doesn't:** isolate *why* the PLA article passed and the PETG one failed (print quality vs.
  material, per the hypothesis above — untested as separate variables). Doesn't establish a
  pass/fail seal method at the project's actual pressure target (this was a shallow bench
  submersion, not a pressure test — see [SCO-82](https://linear.app/scout1/issue/SCO-82) for the
  planned integrated waterproof/proof-load/tilt test). Doesn't quantify leak rate or test
  duration-to-failure for the two articles that failed. Doesn't resolve the standing
  [O-ring manufacturing method decision](../../docs/hub/decision-log.md) (off-the-shelf, chosen
  2026-08-17 specifically because *printed* O-rings were assumed porous/unreliable) — this
  result is a real counter-data-point worth weighing against that reasoning, not an automatic
  reversal of it. See [`facts.md`](../../docs/hub/facts.md#mechanical--deployment) for how this
  is flagged there.

## Next steps

1. Isolate print quality from material choice on the PETG article — reprint at the same quality
   as the PLA article that passed, retest, to see if the failure follows the print or the
   material.
2. Add the documented rubber sealing washers to a real electronics housing build and retest,
   rather than assuming the design-doc spec would have passed.
3. Record duration for future failed articles too, not just the pass — time-to-failure is useful
   data even on a fail.
4. Move toward a real pressure test (not just shallow submersion) once a housing passes this
   bench-level check consistently — [SCO-82](https://linear.app/scout1/issue/SCO-82).
