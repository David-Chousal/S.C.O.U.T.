# Self-Righting Tilt Test, Regular Buoy Body, 2026-11-06

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-29 · Pass (qualitative; regular buoy only) |
| **Date, duration, who** | Run date Not recorded (planned Thu 2026-11-05; reported 2026-11-06); duration Not recorded; John Ryan Myrdal |
| **Requirement tested** | Rights itself from any angle (R-18) |
| **Tracking issue** | [SCO-171](https://linear.app/scout1/issue/SCO-171) |
| **Record kind** | Retroactive (source: John's account, 2026-11-06) |

**Question.** Does the regular buoy body, released from a tilt in water, right itself unaided? Retires the risk that the buoy stays capsized.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Rights itself unaided from the tilt (yes/no) | Visual | Rights itself unaided (R-18, [Requirements matrix](../../docs/engineering/requirements-test-matrix.md)) | It self-righted (John). Angles used, number of releases and the water Not recorded | Pass (qualitative) |

**How (3 to 5 lines).** The regular buoy body was released from a tilt in water and watched for whether it righted itself. The mushroom float was left out of this test for now (John). The angles tested, the number of releases, the water (fresh or salt), the payload and the coating state were not written down.

**Result.** The regular buoy body self-righted (John, 2026-11-06: "worked great"). This is a pass on the matrix criterion for this one buoy, with no numbers behind it.

**Does not establish.**

- That the buoy rights itself from both 90° and 180° every time: which angles were used and how many releases Not recorded.
- The mushroom buoy, or the top attachment installed for the hung V1 test.
- That the result agrees with the stability calculator: the calculator inputs were not updated for this design (see the [requirements matrix](../../docs/engineering/requirements-test-matrix.md) note on R-18).

**Decision.** Good enough to close [SCO-171](https://linear.app/scout1/issue/SCO-171) for the regular buoy. A short repeat that records the angles, number of releases and conditions would turn this into a full pass of R-18; the mushroom and the top attachment are a separate run if they come back into scope.

---

## Part A — Plan (write and date before the run)

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Show that the buoy body rights itself unaided when tilted, before it goes on a dock or boat for the V1 hung tests.

### A2. Hypothesis
If the regular buoy body is released from a large tilt in water, then it rights itself unaided, because the righting moment at large angles is positive for this design (the [stability calculator](../simulations/buoy-stability/) result for the v5 design; not re-run for the current build).

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Rights itself unaided | yes/no | Visual | n/a | Judged by eye | n/a |
| Release angle | degrees | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Release angle | 90° and 180° planned ([SCO-171](https://linear.app/scout1/issue/SCO-171)); angles actually used Not recorded |
| Held fixed (controlled) | Buoy body (regular), water, payload, coating | Not recorded |
| Measured (dependent) | Whether it rights itself | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Rights itself unaided | Present | Rights itself unaided from the tilt | R-18 criterion | [Requirements matrix R-18](../../docs/engineering/requirements-test-matrix.md), [SCO-171](https://linear.app/scout1/issue/SCO-171) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | Regular buoy body; revision and print Not recorded |
| Material and print settings | Not recorded |
| Configuration | Regular buoy body; coating, payload and top attachment Not recorded; the mushroom float was not used |
| Conditions | Water in a bin or tub; type (fresh or salt) and depth Not recorded |
| Sample size and replication | Number of releases Not recorded |
| Control / reference article | None |
| Reference instrument or standard | Stability calculator (not re-run for this design) |
| Expected values | Rights itself from each tilt |
| Before you start (go/no-go) | Not recorded |
| Data path | John's account; no photos filed |
| Stop and abort conditions | Not recorded |
| Safety | Water on the floor |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Buoy stays capsized | Fails R-18 | It does not return upright | Record the angle and redesign |
| Water splash, wet floor | Slip | n/a | Mop the floor |

### A7. Procedure

**Prerequisites checklist.** Not recorded (retroactive).

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Float the regular buoy body in water. | Water, mass | Floats at its waterline | Done (details Not recorded) |
| 2 | Tilt it by hand to a large angle and release. | Angle | Rights itself | Done: it self-righted |
| 3 | Repeat from 90° and 180°, several times each. | Angles, count | Rights itself each time | Not recorded |

### A8. Analysis plan
Pass or fail on whether it rights itself; compare with the stability calculator once re-run for the current design.

### A9. Curve required

Validation curve (model vs test): the righting-arm (GZ) curve against the tilt result. Not produced; the calculator was not re-run for this design.

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| None | n/a | | |

Open questions: the angles used and number of releases; water, payload and coating state; the stability calculator re-run for the current design. Owner John.

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | Not recorded (planned Thu 2026-11-05) |
| Operator | John Ryan Myrdal |
| Ambient conditions | Not recorded |
| Instrument serials / IDs | None |

### B2. Raw data

| Time | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|
| Not recorded | Regular buoy body, released from a tilt | Self-righted (John: "worked great") | Rights itself unaided | Angle and count Not recorded |

### B3. Deviations

| Time | What differed from the plan | Why | Effect on validity |
|---|---|---|---|
| 2026-11-06 | The mushroom buoy was not tested; the plan in SCO-171 covered both designs | John is not using the mushroom for now | The result covers the regular buoy only |

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 rights itself unaided | It self-righted; angles and count Not recorded | Not recorded | Pass (qualitative) |

**Overall:** Pass for the regular buoy. R-18 stays Partial in the matrix: the mushroom and the top attachment were not tested, and the calculator was not re-run.

### C2. Curve and analysis
None produced.

### C3. Validity and limits

- Sources of error: no angles, counts or conditions recorded; the account is John's.
- Does establish: the regular buoy body righted itself when tilted in water.
- Does not establish: righting from every angle, repeatability, the mushroom, or agreement with the calculator.
- Not recorded or shortcut taken: date, angles, number of releases, water, payload, coating state, no photos.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for the regular buoy; no design change needed |
| Design change driven by this test | None |
| Re-run needed? | Optional short repeat that records angles and count; mushroom and top attachment only if they return to scope |
| Next test | Hung V1 rig ([SCO-249](https://linear.app/scout1/issue/SCO-249)) |
| Issues filed | None; [SCO-171](https://linear.app/scout1/issue/SCO-171) closed |

### C5. Evidence and traceability

- John's account, 2026-11-06 (no photos)
- Requirement R-18 → this test → [SCO-171](https://linear.app/scout1/issue/SCO-171); related: [RR-11](rr-11-large-angle-stability-2026-09-29.md) (calculation)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
