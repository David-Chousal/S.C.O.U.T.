# Turbidity Pod PLA Fit Test, Second Print, 2026-11-06

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-30 · Pass (qualitative; fit only, no seal or water) |
| **Date, duration, who** | Run date Not recorded (reported 2026-11-06); duration Not recorded; John Ryan Myrdal |
| **Requirement tested** | Sensor fits the pod body and penetrator (supports R-12; not a seal test) |
| **Tracking issue** | [SCO-176](https://linear.app/scout1/issue/SCO-176) (final pod soak, fit comes first) |
| **Record kind** | Retroactive (source: John's account and two photos, 2026-11-06) |

**Question.** Does the real turbidity sensor fit inside the PLA test pod John drew and printed, with a tight fit to the penetrator? Retires the risk that the final pod is printed to dimensions the sensor does not fit.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Sensor fits in the cavity (yes/no) | Visual, by hand | Sensor seats fully in the cavity | It fit on the second print (John) | Pass (qualitative) |
| Fit to the penetrator (feel) | By hand | Tight, no slop | "Great tight fit" (John); no clearance measured | Pass (qualitative) |

**How (3 to 5 lines).** The pod parts were drawn in CAD and printed in PLA only to check the fit with the real sensor. The first print did not fit (what was wrong was not recorded); the second print did. The sensor was seated in the cavity and the penetrator piece by hand. No cable exit is modelled yet, no O-ring or epoxy was used, and no water was involved.

**Result.** On the second print the sensor fit inside the cavity and fit tightly to the penetrator (John, 2026-11-06). Photos show the three printed pieces (body, cap, penetrator) and the sensor seated in the penetrator piece.

**Does not establish.**

- Any dimension or clearance: nothing was measured, and the first print's failure is Not recorded.
- Sealing, strength or heat behaviour: PLA only, dry, no cable exit.
- That the final PETG print will fit the same way (PETG shrinks differently from PLA).

**Decision.** Fit is good enough to go ahead to the next pod revision with a cable exit. Record the sensor-to-bore clearances when the final pod is drawn, then soak it ([SCO-176](https://linear.app/scout1/issue/SCO-176)).

---

## Part A — Plan (write and date before the run)

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Show that the real turbidity sensor fits the pod geometry before the pod is printed in its final material.

### A2. Hypothesis
If the pod cavity and penetrator are printed to the CAD dimensions, then the sensor seats fully and holds tight at the penetrator, because they were drawn around the sensor's own dimensions.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Sensor fits the cavity | yes/no | Visual, by hand | n/a | Judged by eye | n/a |
| Fit to the penetrator | feel | By hand | n/a | Judged by hand | n/a |
| Clearance | mm | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Print iteration | First print, second print |
| Held fixed (controlled) | Sensor, material (PLA) | Same sensor; print settings Not recorded |
| Measured (dependent) | Fit | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Sensor seats in the cavity | Present | Seats fully by hand | A pod the sensor does not fit is useless | John's account, [SCO-176](https://linear.app/scout1/issue/SCO-176) |
| M2 | Fit to the penetrator | Present | Tight, no slop | Epoxy needs a close fit to hold | John's account |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | Turbidity pod fit pieces (CAD file name and revision Not recorded) |
| Material and print settings | PLA; settings Not recorded |
| Configuration | Body, cap and penetrator piece; no cable exit, no O-ring, no epoxy |
| Conditions | Dry, by hand, indoors |
| Sample size and replication | Two prints (first failed, second passed) |
| Control / reference article | The real sensor itself |
| Reference instrument or standard | None |
| Expected values | Sensor seats; tight at the penetrator |
| Before you start (go/no-go) | Not recorded |
| Data path | John's account and photos 01 and 02 in this folder |
| Stop and abort conditions | Not recorded |
| Safety | None beyond normal printing |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Sensor too tight, forced in | Damaged sensor or board | Cracking or binding | Do not force it; reprint |
| Sensor loose | Poor epoxy hold | Slop by hand | Reprint tighter |

### A7. Procedure

**Prerequisites checklist.** Not recorded (retroactive).

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Print the pod pieces in PLA. | Settings | Parts print | Done (settings Not recorded) |
| 2 | Seat the sensor in the cavity and penetrator piece by hand. | Fit | Seats, tight | First print: did not fit; second: fit |

### A8. Analysis plan
Pass or fail by hand and eye. Measure clearances when the final pod is drawn.

### A9. Curve required
None.

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| None | n/a | | |

Open questions: what was wrong with the first print and what changed; which clearances were used; the cable exit. Owner John.

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | Not recorded |
| Operator | John Ryan Myrdal |
| Ambient conditions | Not recorded |
| Instrument serials / IDs | None |

### B2. Raw data

| Time | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|
| Not recorded | First print | Did not fit (reason Not recorded) | Seats in the cavity | Implied by "second try" |
| Not recorded | Second print | Sensor fit in the cavity; tight fit to the penetrator | Seats, tight | Photos 01 and 02 |

### B3. Deviations

| Time | What differed from the plan | Why | Effect on validity |
|---|---|---|---|
| Not recorded | The first print failed and a second was needed | Not recorded | None; the second print is the one judged |

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 sensor seats in cavity | It fit (second print) | Not recorded | Pass (qualitative) |
| M2 tight fit to penetrator | "Great tight fit" | Not recorded | Pass (qualitative) |

**Overall:** Pass for fit. No seal, water or cable-exit result.

### C2. Curve and analysis
None produced.

### C3. Validity and limits

- Sources of error: no measurements; the account is John's.
- Does establish: the second PLA print holds the sensor with a tight fit.
- Does not establish: clearances, sealing, PETG fit, or the cable exit.
- Not recorded or shortcut taken: dates, print settings, sensor part number, first-print failure, clearances.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning the fit? | Yes for the body and penetrator; cable exit still to model |
| Design change driven by this test | The second print's geometry becomes the base for the final pod |
| Re-run needed? | Only to record clearances when the final pod is drawn |
| Next test | Final pod soak ([SCO-176](https://linear.app/scout1/issue/SCO-176)) |
| Issues filed | None |

### C5. Evidence and traceability

- John's account, 2026-11-06
- Photos: [`turbidity-pod-pla-fit-rr-30-2026-11-06-01.jpg`](turbidity-pod-pla-fit-rr-30-2026-11-06-01.jpg) (the three printed pieces and the sensor seated in the penetrator piece), [`turbidity-pod-pla-fit-rr-30-2026-11-06-02.jpg`](turbidity-pod-pla-fit-rr-30-2026-11-06-02.jpg) (the sensor's connector side)
- Requirement R-12 (pod stays dry) → this fit test is a prerequisite → [SCO-176](https://linear.app/scout1/issue/SCO-176)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
