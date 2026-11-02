# Housing Cap Seal and PG11 Gland Seal Tests, 2026-11-01

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-23 · Planned |
| **Date, duration, who** | Planned 2026-11-01; run dates Not set (this week, see the weekly plan); 24 h per stage; John Ryan Myrdal |
| **Requirement tested** | Cap seals and glands stay dry (R-14); housing stays dry in salt water (R-12) |
| **Tracking issue** | [SCO-294](https://linear.app/scout1/issue/SCO-294); related [SCO-270](https://linear.app/scout1/issue/SCO-270), [SCO-293](https://linear.app/scout1/issue/SCO-293) |
| **Record kind** | Prospective |

**Question.** With the first assembled housing ([RR-22](rr-22-housing-cap-assembly-and-gland-fit-2026-11-01.md)), does the cap O-ring seal hold, and do the three PG11 glands hold, when submerged? Retires the risk that water reaches the dry chamber through the cap or the glands.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Stage 1: water inside, cap seal (towel and visual) | Dry paper towel, photo | Dry after 24 h fully submerged, fresh water | Not yet run | Not measured |
| Stage 2: water inside, glands with cable (towel and visual) | Dry paper towel, photo | Dry after 24 h fully submerged, fresh water | Not yet run | Not measured |
| Mass change of the closed housing (g) | Scale | Within scale resolution after each stage | Not yet run | Not measured |

**How and steps.** Same assembled housing, O-ring in the cap, a dry paper towel inside. Stage 1: gland bores blocked so only the cap seal is tested; submerge below 0.3 m for 24 h; open and inspect the towel. Stage 2: the three glands carry real cable (or a sealed dummy), cap sealed; same 24 h; inspect. If either passes, repeat in plain salt water, then extend to one week.

**Result.** Not yet run.

**Does not establish.**

- Depth or pressure behavior ([SCO-177](https://linear.app/scout1/issue/SCO-177)).
- That a redesigned cap seals; this tests only the forced-thread cap from RR-22.

**Decision.** Run Stage 1, then Stage 2. A leak sends the fix to the next cap ([SCO-293](https://linear.app/scout1/issue/SCO-293)).

---

## Part A — Plan (write and date before the run)

### A1. Purpose and risk retired
The seal tests the team has run so far cover coupons, pods and an earlier housing ([RR-03](rr-03-bench-submersion-three-articles-2026-08-24.md), [RR-07](rr-07-sensor-housing-tpu-oring-soak-2026-09-12.md), [RR-18](rr-18-sensor-pod-petg-fresh-water-2026-10-21.md)). This is the first test of the current cap, its O-ring and PG11 glands. Splitting it in two stages traces any leak to the cap or the glands.

### A2. Hypothesis
If the assembled housing is submerged for 24 h in fresh water, then the paper towel inside stays dry in both stages, because the O-ring is compressed by the clamped cap and the glands compress on the cable. The forced bolt threads in the cap may be a leak path or may have lifted the sealing face; that is the main risk.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Water inside (towel dry or wet, wet area) | yes/no, photo | Paper towel, visual after opening | n/a | Judged by eye | n/a |
| Mass of the closed housing before and after | g | Scale | To be recorded | To be recorded | Not recorded |
| Submersion depth | m | Ruler to the top of the housing | To be recorded | To be recorded | Not recorded |
| Duration | h | Clock | 1 h | 1 h | n/a |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Stage (what is exposed): cap only, then cap and glands | 2 stages; then fresh to plain salt water |
| Held fixed (controlled) | Housing, cap, O-ring, screws and torque, depth (at least 0.3 m), duration (24 h), towel placement, water temperature | Same assembly |
| Measured (dependent) | Towel dry or wet, mass change | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Cap seal holds (Stage 1) | Present | Towel dry after 24 h at 0.3 m or deeper, fresh water | The R-12 benchmark | [Requirements matrix R-12](../../docs/engineering/requirements-test-matrix.md) |
| M2 | Glands hold (Stage 2) | Present | Towel dry after 24 h at 0.3 m or deeper, fresh water | The R-14 benchmark | [Requirements matrix R-14](../../docs/engineering/requirements-test-matrix.md) |
| M3 | Holds in plain salt water | Present | Towel dry after 24 h in plain salt water, then 1 week | R-12: salt water, 24 h then 1 week | [Requirements matrix R-12](../../docs/engineering/requirements-test-matrix.md) |
| M4 | Mass does not rise | Plausible | Mass change within scale resolution | A rise means water got in, even if the towel looks dry | This plan |

Locked on: Not yet locked. Lock this section (date it here) before step 1.

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | RR-22 assembly: [cap STEP](../cad/electronics-housing/electronics-housing-cap-sideways-glands-2026-10-30.step), [body STEP](../cad/electronics-housing/electronics-housing-body.step) |
| Material and print settings | Not recorded |
| Configuration | O-ring (size and material Not recorded), stainless torx screws (count and torque Not recorded), 3 PG11 glands |
| Conditions | Fresh water first, room temperature; then plain salt water mixed by mass (35 g per kg) |
| Sample size and replication | 1 assembly; Stage 1 and Stage 2 run in order, not in parallel |
| Control / reference article | None; Stage 1 isolates the cap |
| Reference instrument or standard | Dry paper towel placed on the floor of the dry chamber; photo of its state at close |
| Expected values | Towel dry; mass unchanged |
| Before you start (go/no-go) | O-ring seated and not twisted; sealing faces clean and dry; towel dry and weighed; all screws tight to the same feel; closed housing weighed |
| Data path | Photos and a handwritten sheet; enter into B2 the same day |
| Stop and abort conditions | Bubbles streaming from the housing; visible water inside on a quick check at 1 h |
| Safety | Water on the floor, carrying the filled tub; hazard form [SCO-211](https://linear.app/scout1/issue/SCO-211) |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Housing floats and rises out of the water | Test not at depth | Top above the surface | Weigh it down or hold it below the surface with a clamp; record the depth |
| O-ring twisted or not seated | Leak at the cap | Wet towel near the rim | Reseat; log the finding |
| Forced threads lifted the cap or cracked it | Leak or crack | Gap at the cap; wet towel | Inspect the sealing face before the run; photograph |
| Gland nut under-tightened or cable too small | Leak at a gland | Wet towel near the glands | Check cable diameter against the gland range (Not recorded); retighten once, log it |
| Electronics inside | Not applicable | n/a | Test with the towel only, no electronics |
| Salt left on the housing | Corrosion of screws, crust | White residue | Rinse with fresh water and dry |

### A7. Procedure

**Prerequisites checklist.**

- ☐ The assembled housing from RR-22, cap on, O-ring in place
- ☐ Dry paper towel, folded, weighed
- ☐ Blanking plugs or sealed dummy rods for the gland bores (type Not recorded)
- ☐ Real cable of the diameter the glands are meant for (diameter Not recorded)
- ☐ A tub of fresh water at least 0.3 m deeper than the housing; a way to hold it down
- ☐ Scale, ruler, camera, clock
- ☐ Later, plain salt: the tub water mixed by mass (35 g per kg)

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Go/no-go checks; weigh the housing with the towel inside. | Mass | Stable reading | ☐ |
| 2 | Stage 1: block the gland bores; close the cap. | Configuration photo | Sealed | ☐ |
| 3 | Submerge below 0.3 m in fresh water; record start time and depth. | Time, depth | Fully under | ☐ |
| 4 | Quick check at 1 h for streaming bubbles. | Observation | None | ☐ |
| 5 | After 24 h: remove, dry the outside, weigh, then open and inspect the towel. | Mass, photo | Towel dry; mass unchanged (M1, M4) | ☐ |
| 6 | Stage 2: fit the three glands with real cable; replace the towel; close the cap. | Configuration photo | Sealed | ☐ |
| 7 | Repeat steps 3 to 5. | Mass, photo | Towel dry (M2, M4) | ☐ |
| 8 | If both pass: repeat Stage 1 and Stage 2 together in plain salt water for 24 h, then continue to 1 week. | Mass, photo | Towel dry (M3) | ☐ |
| 9 | Rinse, dry, photograph; record the screws' condition. | Photo | No crust or crack | ☐ |

### A8. Analysis plan
Towel state and mass change per stage against M1 to M4. On a leak, record where the towel is wettest to point to the cap or a gland.

### A9. Curve required

None, pass/fail test. No quantitative curve: a leak rate would need a pressure or time series and is not part of this plan.

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| Jes Kuczenski | Not sent | | |

Open questions:

- O-ring size and material, screw count and torque, cable diameter, gland range: all Not recorded. Owner John, before locking.
- Is 24 h at 0.3 m the right first mark, or should Stage 1 go straight to the R-13 depth ([SCO-177](https://linear.app/scout1/issue/SCO-177))? Owner John.
- How are the gland bores blocked in Stage 1? Owner John.
- Schedule: which days this week; the tub is also used for the float test on Mon and Tue. Owner John.

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | To be recorded |
| Operator | John Ryan Myrdal |
| Ambient conditions | To be recorded |
| Instrument serials / IDs | To be recorded |

### B2. Raw data

Not yet run.

### B3. Deviations

Not yet run.

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 cap seal | Not yet run | — | Not measured |
| M2 glands | Not yet run | — | Not measured |
| M3 salt water | Not yet run | — | Not measured |
| M4 mass | Not yet run | — | Not measured |

**Overall:** Planned.

### C2. Curve and analysis
Not yet run.

### C3. Validity and limits

- Does establish: nothing yet.
- Will not establish: depth behavior, long-term sealing, or a redesigned cap.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Not yet known |
| Design change driven by this test | Feeds the next cap ([SCO-293](https://linear.app/scout1/issue/SCO-293)) |
| Re-run needed? | Not yet run |
| Next test | Pressure test ([SCO-177](https://linear.app/scout1/issue/SCO-177)) |
| Issues filed | [SCO-294](https://linear.app/scout1/issue/SCO-294) |

### C5. Evidence and traceability

- Requirements R-12, R-14 → this test → [SCO-294](https://linear.app/scout1/issue/SCO-294); related: [RR-22](rr-22-housing-cap-assembly-and-gland-fit-2026-11-01.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
