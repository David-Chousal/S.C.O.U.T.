# PG11 Gland Fit Coupon, Cap Gland Interface, 2026-11-02

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-24 · Partial |
| **Date, duration, who** | Run dates Not recorded (before the cap print of 2026-10-30 to 2026-11-01); record written 2026-11-02; John Ryan Myrdal |
| **Requirement tested** | Cap seals and glands stay dry (R-14), fit part only: room to tighten the glands and a wall thin enough for solid thread engagement |
| **Tracking issue** | [SCO-270](https://linear.app/scout1/issue/SCO-270) |
| **Record kind** | Retroactive (source: John's account and one photo, 2026-11-02) |

**Question.** Is there enough room around each PG11 gland to tighten the nut, and is the wall at the gland thin enough for a solid thread clamp? Retires the risk that the cap's gland interface cannot be assembled or does not clamp.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Room to tighten the nut (mm) | Wrench or hand on the printed coupon | Wrench clearance of 15 mm or more to any wall or boss, 30 mm or more centre to centre (intended design values, [housing README](../cad/electronics-housing/README.md)) | Coupon spacing values Not recorded; John designed the cap's gland spacing from these coupons | Not measured |
| Thread contact (wall at the gland, mm) | Fit by hand, visual | Wall of 3 to 4 mm: gland body thread engages and the nut seats (intended design value) | First wall too thick for a solid thread clamp, so it was thinned in the gland section after a test or two; final thickness Not recorded | Changed after test |

**How (3 to 5 lines).** Several small printed coupons: flat plates with three PG11-size holes, a raised border and a recessed gland section, printed in the same material as the cap (print settings Not recorded). Each coupon was fitted with a gland and the nut tightened by hand to check room and thread engagement. Between coupons the wall in the gland section was made thinner.

**Result.** After a test or two the wall in the gland section was thinned for more thread contact; the final coupon (photo) shows a thinner recessed centre inside a raised border. The cap's gland deck was designed from these coupons, and its glands later seated and clamped when the first cap was assembled ([RR-22](rr-22-housing-cap-assembly-and-gland-fit-2026-11-01.md)).

**Does not establish.**

- Any seal: no coupon was submerged; the seal is tested in [RR-23](rr-23-housing-cap-and-gland-seal-tests-2026-11-01.md).
- The wall thickness and spacing numbers: they were not recorded.

**Decision.** Good enough to proceed to the cap print and the seal tests. Record the final wall thickness and coupon dimensions when measured.

---

## Part A — Plan (write and date before the run)

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Show that the PG11 glands can be tightened in the cap's gland section and that the wall allows a solid thread clamp, before printing the full cap.

### A2. Hypothesis
If the gland section wall is 3 to 4 mm and the glands are at least 30 mm apart and 15 mm from any wall or boss, then each PG11 body threads into the wall, the nut seats, and a hand or wrench can tighten it, because the gland body thread is about 8 to 9 mm and the nut takes about 4 to 5 mm ([housing README](../cad/electronics-housing/README.md)).

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Wall thickness at the gland | mm | Not recorded | Not recorded | Not recorded | Not recorded |
| Room to tighten | mm / pass-fail | By hand or wrench on the coupon | n/a | n/a | n/a |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Wall thickness in the gland section | Thinner in each later coupon (values Not recorded) |
| Held fixed (controlled) | PG11 gland (lab stock, [facts.md](../../docs/hub/facts.md)), print material | Not recorded |
| Measured (dependent) | Thread contact and room to tighten | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Thread engagement | Present | PG11 seats and the nut engages on a 3 to 4 mm wall | Gland body thread about 8 to 9 mm, nut about 4 to 5 mm, grip range 2 to 4 mm | [Housing README](../cad/electronics-housing/README.md), [SCO-270](https://linear.app/scout1/issue/SCO-270) |
| M2 | Room to tighten | Present | 15 mm or more wrench room to any wall or boss; 30 mm or more centre to centre | Wrench and nut clearance | Housing README |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | Coupon CAD Not recorded; the cap that used the result: [cap STEP, sideways glands, 2026-10-30](../cad/electronics-housing/electronics-housing-cap-sideways-glands-2026-10-30.step) |
| Material and print settings | Not recorded |
| Configuration | Flat plate with three PG11-size holes, a raised border and a recessed gland section ([photo](gland-fit-coupon-2026-11-02-01.jpg)) |
| Conditions | Bench, by hand |
| Sample size and replication | Several coupons (count Not recorded), each thinner than the last |
| Control / reference article | None |
| Reference instrument or standard | PG11 gland from lab stock (brand and datasheet Not recorded) |
| Expected values | Gland seats; nut engages and tightens by hand |
| Before you start (go/no-go) | Not recorded |
| Data path | Photo; John's account |
| Stop and abort conditions | Not recorded |
| Safety | None beyond bench handling |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Wall too thick | The nut cannot engage the thread | Nut bottoms or does not start | Thin the wall in the gland section (done) |
| Wall too thin | The thread strips or the nut bottoms on the thread | Nut spins freely | Keep within 3 to 4 mm |
| Not enough wrench room | The nut cannot be tightened | Wrench hits a wall or boss | Keep 15 mm or more clearance |

### A7. Procedure

**Prerequisites checklist.** Not recorded (retroactive).

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Print a coupon with the gland section wall at the design thickness. | Wall thickness | 3 to 4 mm | Done (value Not recorded) |
| 2 | Fit a PG11 gland and tighten the nut by hand; check thread contact and room. | Observation | Seats; nut engages | Done: not enough thread contact on the first wall |
| 3 | Thin the wall in the gland section and reprint. | New thickness | More thread contact | Done (values Not recorded) |
| 4 | Repeat step 2 on the new coupon. | Observation | Solid clamp | Done |

### A8. Analysis plan
Compare each coupon with M1 and M2; thin the wall until the clamp is solid.

### A9. Curve required

None, fit check.

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| None | n/a | | |

Open questions: final wall thickness, hole diameter and spacing of the last coupon; print material and settings. Owner John.

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | Not recorded |
| Operator | John Ryan Myrdal |
| Ambient conditions | Bench, indoors |
| Instrument serials / IDs | Not recorded |

### B2. Raw data

| Time | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|
| Not recorded | Coupon 1 | Wall too thick for a solid thread clamp | 3 to 4 mm | Values Not recorded |
| Not recorded | Later coupon(s) | Wall thinned in the gland section: more thread contact | Solid clamp | Final coupon in the [photo](gland-fit-coupon-2026-11-02-01.jpg) |

### B3. Deviations

None recorded.

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 thread engagement | Solid clamp after thinning the wall; thickness Not recorded | Not recorded | Pass (qualitative) |
| M2 room to tighten | Spacing values Not recorded | Not recorded | Not measured |

**Overall:** Partial. The fit works after one wall change; the numbers were not recorded.

### C2. Curve and analysis
None.

### C3. Validity and limits

- Sources of error: no dimensions recorded; the account is John's.
- Does establish: the thinned gland section lets the PG11 thread clamp solidly.
- Does not establish: any seal, or the exact wall thickness and spacing.
- Not recorded or shortcut taken: coupon dimensions, material, print settings, number of coupons.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for the fit; the seal is tested in RR-23 |
| Design change driven by this test | Thinner wall in the gland section of the cap |
| Re-run needed? | No; record the final wall thickness |
| Next test | [RR-22](rr-22-housing-cap-assembly-and-gland-fit-2026-11-01.md) (assembly, done), [RR-23](rr-23-housing-cap-and-gland-seal-tests-2026-11-01.md) (seal, running) |
| Issues filed | [SCO-270](https://linear.app/scout1/issue/SCO-270) |

### C5. Evidence and traceability

- Photo: [final coupon, 2026-11-02](gland-fit-coupon-2026-11-02-01.jpg)
- Requirement R-14 → this test → [SCO-270](https://linear.app/scout1/issue/SCO-270); related: RR-22, RR-23

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
