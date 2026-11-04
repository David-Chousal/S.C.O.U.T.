# Small Test Chamber, Cap Face Seal Test, 2026-11-03

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-27 · Planned (Part A locked 2026-11-03) |
| **Date, duration, who** | Run dates Not set; 24 h per stage; John Ryan Myrdal |
| **Requirement tested** | Housing stays dry in salt water (R-12); cap seals (R-14) |
| **Tracking issue** | [SCO-293](https://linear.app/scout1/issue/SCO-293); related [SCO-294](https://linear.app/scout1/issue/SCO-294) |
| **Record kind** | Prospective |

**Question.** With a greased 5-5/8 in ID ring in a groove drawn for it, does the cap face seal keep water out of the small test chamber? Retires the risk that the face seal design leaks, which is how [RR-23](rr-23-housing-cap-and-gland-seal-tests-2026-11-01.md) failed.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Towel inside (dry or wet) | Dry paper towel, photo | Dry after 24 h just below the surface (weighted), fresh water | Not yet run | Not measured |
| Mass of the closed chamber (g) | Scale | Within scale resolution after the run | Not yet run | Not measured |
| Same, plain salt water (35 g per kg) | Towel, scale | Dry after 24 h, then 1 week | Not yet run | Not measured |

**How (3 to 5 lines).** Print the small chamber body and cap ([STEP files](../cad/electronics-housing/README.md#small-test-chamber-for-face-seal-testing-2026-11-03)), grease the ring, close the cap, put a dry towel inside and weigh it. Hold it just below the surface in fresh water for 24 h, then weigh and open it. If dry, repeat in plain salt water.

**Result.** Not yet run.

**Does not establish.**

- Depth or pressure behavior ([SCO-177](https://linear.app/scout1/issue/SCO-177)).
- That the full-size housing, glands or cable outlet seal: the chamber has no cable outlet.

**Decision.** Run it once the chamber is printed. Dry: carry the face-seal design to the full housing. Wet: isolate the cause as in Part A6b.

---

## Part A — Plan (write and date before the run)

_Written 2026-11-03 from John's design and results; locked by John Ryan Myrdal the same day, before the run._

### A1. Purpose and risk retired
[RR-23](rr-23-housing-cap-and-gland-seal-tests-2026-11-01.md) Stage 1 flooded through the cap face seal (518 g to 1113 g) with an ungreased ring. This test checks the redesigned face seal on its own, in a smaller print that uses less plastic and has no cable outlet, so a leak can only come from the face seal, the cap or the bolt holes.

### A2. Hypothesis
If the ring (5-5/8 in ID, 5-7/8 in OD) is greased and sits in a groove drawn for it (ID 5.625 in, OD 5.975 in, 0.175 in wide, 0.094 in deep, about 25% squeeze), then the towel stays dry for 24 h just below the surface, because the squeeze seals the face and the ring is seated against the groove's inner wall by the water pressure.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Towel dry or wet | yes/no, photo | Paper towel, visual | n/a | Judged by eye | n/a |
| Mass of the closed chamber | g | Scale | To be recorded | To be recorded | Not recorded |
| Ring ID, OD, cross-section | in | Calipers | To be recorded | To be recorded | Not recorded |
| Groove depth and width as printed | in | Calipers | To be recorded | To be recorded | Not recorded |
| Duration | h | Clock | 1 h | 1 h | n/a |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Water | Fresh, then plain salt (35 g per kg) |
| Held fixed (controlled) | Chamber and cap, ring, grease, screws and feel, depth (just below the surface, weighted), duration | Same assembly |
| Measured (dependent) | Towel state, mass change | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Face seal holds in fresh water | Present | Towel dry after 24 h just below the surface (weighted) | Screening depth; R-12 benchmark is 0.3 m or deeper, so this does not close R-12 alone | [Requirements matrix R-12](../../docs/engineering/requirements-test-matrix.md) |
| M2 | Mass does not rise | Plausible | Change within scale resolution | A rise means water got in even if the towel looks dry | This plan |
| M3 | Holds in plain salt water | Present | Towel dry after 24 h, then 1 week | R-12: salt water, 24 h then 1 week | Requirements matrix R-12 |

Locked on: 2026-11-03 (John Ryan Myrdal), before the run. Any later change goes in the deviation log (B3), not over this text.

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | [Body STEP](../cad/electronics-housing/electronics-housing-small-test-chamber-body-2026-11-03.step), [cap STEP](../cad/electronics-housing/electronics-housing-small-test-chamber-cap-2026-11-03.step) |
| Material and print settings | Not recorded |
| Configuration | Groove ID 5.625 in, OD 5.975 in, width 0.175 in, depth 0.094 in (read from the STEP); cap a plain 7.0 in circle with 10 holes of Ø0.177 in |
| O-ring | John's measure: 5-7/8 in OD, 5-5/8 in ID, cross-section 1/8 in by subtraction; elastomer and method Not recorded. Conflicts with the logged AS568-247 ([facts.md](../../docs/hub/facts.md)) |
| Grease | Applied to the ring; product Not recorded |
| Closed chamber mass before | Not recorded |
| Water | Fresh, then plain salt mixed by mass (35 g per kg) |
| Conditions | Room temperature, held just below the surface with weights |
| Sample size and replication | 1 chamber, one run per water |
| Control / reference article | None |
| Reference instrument or standard | Dry paper towel on the chamber floor, photo at close |
| Expected values | Towel dry; mass unchanged |
| Before you start (go/no-go) | Ring seated and not twisted, greased; sealing faces clean; towel dry and weighed; screws tightened to the same feel; chamber weighed |
| Data path | Photos and a handwritten sheet; enter into B2 the same day |
| Stop and abort conditions | Bubbles streaming from the chamber; water visible inside on a check at 1 h |
| Safety | Water on the floor; hazard form [SCO-211](https://linear.app/scout1/issue/SCO-211) |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Printed groove depth off by 0.01 to 0.02 in | Squeeze too low or too high | Calipers on the groove before the run; wet towel | Measure the groove; reprint if outside about 0.088 to 0.100 in |
| Ring size not as measured | Ring loose or stretched in the groove | Ring does not seat flat | Measure the ring first; log it |
| Ring twisted or pinched | Leak at the face | Wet towel near the rim | Reseat, log the finding |
| Chamber floats out of the water | Test not at depth | Top above the surface | Weights; record their mass |
| Layer porosity in PETG | Seepage through the walls | Wet towel away from the rim | Photograph where it is wettest |
| Salt left on the chamber | Crust | White residue | Rinse and dry |

### A6b. If it leaks: isolation tests

Run only if wet. Change one thing at a time; each isolation test gets its own record.

| Candidate leak path | Why | How to isolate | What a result means |
|---|---|---|---|
| Ring seating or size | Ring too big or small for the groove | Measure the ring and groove, reseat, retest | Dry: seating or size was the cause |
| Groove depth as printed | Squeeze outside the 20 to 30% band | Measure depth; reprint | Dry after reprint: depth was the cause |
| Bolt holes and threads | Water along the screws | Seal the screw heads externally and retest | Dry: the bolt path leaks |
| Printed walls | Layer lines wick water | Coat one suspected face and retest | Dry: that face is porous |

### A7. Procedure

**Prerequisites checklist.**

- ☐ Printed body and cap, groove measured with calipers
- ☐ Ring measured (ID, OD, cross-section) and greased
- ☐ Dry paper towel, weighed; scale, camera, clock
- ☐ Tub of fresh water and weights; later, plain salt by mass

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Measure the ring and groove; weigh the chamber with the towel. | Dimensions, mass | Groove depth about 0.094 in | ☐ |
| 2 | Grease the ring, seat it, close the cap, tighten the screws to the same feel. | Photo | Ring seated, not twisted | ☐ |
| 3 | Submerge just below the surface with weights; note the time. | Time | Fully under | ☐ |
| 4 | Check at 1 h for bubbles or water. | Observation | None | ☐ |
| 5 | After 24 h: dry the outside, weigh, open, photograph the towel. | Mass, photo | Dry; mass unchanged (M1, M2) | ☐ |
| 6 | If wet: go to A6b. If dry: repeat steps 2 to 5 in plain salt water, then continue to 1 week. | Mass, photo | Dry (M3) | ☐ |
| 7 | Rinse, dry, photograph. | Photo | No crust or crack | ☐ |

### A8. Analysis plan
Towel state and mass change against M1 to M3. On a leak, record where the towel is wettest.

### A9. Curve required

None, pass/fail test.

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| Jes Kuczenski | Not sent | | |

Open questions (owner John):

- Ring elastomer, grease product, print material and settings, weights used: Not recorded.
- Should a second chamber run with an ungreased ring as a control? Not planned.
- This does not test depth. The 0.3 m R-12 mark and [SCO-177](https://linear.app/scout1/issue/SCO-177) need a later, deeper run.

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | Not run |
| Operator | John Ryan Myrdal |
| Ambient conditions | Not recorded |
| Instrument serials / IDs | Not recorded |

### B2. Raw data

| Time | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|
| Not run | | | | |

### B3. Deviations

None yet.

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 face seal, fresh water | Not yet run | — | Not measured |
| M2 mass | Not yet run | — | Not measured |
| M3 salt water | Not yet run | — | Not measured |

**Overall:** Planned.

### C2. Curve and analysis
Not yet run.

### C3. Validity and limits

- Does establish: nothing yet.
- Will not establish: depth behavior, the glands or a cable outlet, or the full-size housing.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Not yet known |
| Design change driven by this test | Not yet known |
| Re-run needed? | Not yet run |
| Next test | Full housing with glands, then pressure ([SCO-177](https://linear.app/scout1/issue/SCO-177)) |
| Issues filed | [SCO-293](https://linear.app/scout1/issue/SCO-293), [SCO-294](https://linear.app/scout1/issue/SCO-294) |

### C5. Evidence and traceability

- Requirements R-12, R-14 → this test → [SCO-293](https://linear.app/scout1/issue/SCO-293); related: [RR-23](rr-23-housing-cap-and-gland-seal-tests-2026-11-01.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
