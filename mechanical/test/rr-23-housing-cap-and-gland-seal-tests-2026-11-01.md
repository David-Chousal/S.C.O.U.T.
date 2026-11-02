# Housing Cap Seal and PG11 Gland Seal Tests, 2026-11-01

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-23 · Running (Stage 1 started 2026-11-02 10:47 PST) |
| **Date, duration, who** | Part A locked 2026-11-02; run dates Not set (this week, see the weekly plan); 24 h per stage; John Ryan Myrdal |
| **Requirement tested** | Cap seals and glands stay dry (R-14); housing stays dry in salt water (R-12) |
| **Tracking issue** | [SCO-294](https://linear.app/scout1/issue/SCO-294); related [SCO-270](https://linear.app/scout1/issue/SCO-270), [SCO-293](https://linear.app/scout1/issue/SCO-293) |
| **Record kind** | Prospective |

**Question.** With the first assembled housing ([RR-22](rr-22-housing-cap-assembly-and-gland-fit-2026-11-01.md)), does the cap O-ring seal hold, and do the three PG11 glands hold, when submerged? Retires the risk that water reaches the dry chamber through the cap or the glands.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Stage 1: water inside, cap and glands with 3 printed pegs (towel and visual) | Dry paper towel, photo | Dry after 24 h just below the surface (weighted), fresh water | Not yet run | Not measured |
| Stage 2: water inside, glands with cable (towel and visual) | Dry paper towel, photo | Dry after 24 h just below the surface (weighted), fresh water | Not yet run | Not measured |
| Mass change of the closed housing (g) | Scale | Within scale resolution after each stage | Not yet run | Not measured |

**How and steps.** An initial screening test, deliberately simple: assemble the housing as built (O-ring in the cap, a dry paper towel inside, the three printed pegs clamped in the PG11 glands, which "work great" per John, 2026-11-02; [photo](housing-glands-with-pegs-2026-11-02-01.jpg)), put the whole thing in a tub just below the surface, held down with weights, for 24 h in fresh water, open it and look at the towel. Dry: go on to real cable (Stage 2) and plain salt water. Wet: do not guess; run the isolation tests in A6b, one leak path at a time.

**Result.** Not yet run.

**Does not establish.**

- Depth or pressure behavior ([SCO-177](https://linear.app/scout1/issue/SCO-177)).
- That a redesigned cap seals; this tests only the forced-thread cap from RR-22.
- That a gland seals on real cable from a pass with pegs: a rigid printed peg does not compress like a cable jacket, and it carries no conductors.

**Decision.** Run the Stage 1 dunk. Dry: Stage 2 with real cable, then plain salt water. Wet: the per-component isolation plan in A6b, and the cap fix goes to the next cap ([SCO-293](https://linear.app/scout1/issue/SCO-293)).

---

## Part A — Plan (write and date before the run)

### A1. Purpose and risk retired
The seal tests the team has run so far cover coupons, pods and an earlier housing ([RR-03](rr-03-bench-submersion-three-articles-2026-08-24.md), [RR-07](rr-07-sensor-housing-tpu-oring-soak-2026-09-12.md), [RR-18](rr-18-sensor-pod-petg-fresh-water-2026-10-21.md)). This is the first test of the current cap, its O-ring and PG11 glands. Stage 1 is a quick screen: the whole assembly with three printed pegs (John designed them on 2026-11-02) in place of cable, thrown in a tub. It is cheap and says only pass or leak. If it leaks, the deeper dive into each component and failure mode (A6b) starts from where the towel is wettest; if it is dry, Stage 2 repeats with real cable.

### A2. Hypothesis
If the assembled housing is submerged for 24 h in fresh water, then the paper towel inside stays dry in both stages, because the O-ring is compressed by the clamped cap and the glands compress on the cable. The forced bolt threads in the cap may be a leak path or may have lifted the sealing face; that is the main risk.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Water inside (towel dry or wet, wet area) | yes/no, photo | Paper towel, visual after opening | n/a | Judged by eye | n/a |
| Mass of the closed housing before and after | g | Scale | To be recorded | To be recorded | Not recorded |
| Submersion depth | m | Just below the surface (John, 2026-11-02); not measured as 0.3 m | To be recorded | To be recorded | Not recorded |
| Duration | h | Clock | 1 h | 1 h | n/a |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Stage (what is exposed): cap only, then cap and glands | 2 stages; then fresh to plain salt water |
| Held fixed (controlled) | Housing, cap, O-ring, screws and torque, depth (just below the surface, weighted), duration (24 h), towel placement, water temperature | Same assembly |
| Measured (dependent) | Towel dry or wet, mass change | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Cap and glands hold with pegs (Stage 1) | Present | Towel dry after 24 h just below the surface (weighted), fresh water | Screening depth: just below the surface. The R-12 benchmark is 0.3 m or deeper, so this stage alone does not close R-12 | [Requirements matrix R-12](../../docs/engineering/requirements-test-matrix.md) |
| M2 | Glands hold with real cable (Stage 2) | Present | Towel dry after 24 h just below the surface (weighted), fresh water | Screening depth as M1; the R-14 benchmark | [Requirements matrix R-14](../../docs/engineering/requirements-test-matrix.md) |
| M3 | Holds in plain salt water | Present | Towel dry after 24 h in plain salt water, then 1 week | R-12: salt water, 24 h then 1 week | [Requirements matrix R-12](../../docs/engineering/requirements-test-matrix.md) |
| M4 | Mass does not rise | Plausible | Mass change within scale resolution | A rise means water got in, even if the towel looks dry | This plan |

Locked on: 2026-11-02 (John Ryan Myrdal), before the Stage 1 dunk. Any later change goes in the deviation log (B3), not over this text.

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | RR-22 assembly: [cap STEP](../cad/electronics-housing/electronics-housing-cap-sideways-glands-2026-10-30.step), [body STEP](../cad/electronics-housing/electronics-housing-body.step) |
| Material and print settings | Not recorded |
| Configuration | O-ring (AS568-247, ID 4.609 in × CS 0.139 in (117.07 × 3.53 mm), the largest ring in the assortment pack John bought earlier; logged in [facts.md](../../docs/hub/facts.md) and the [housing README](../cad/electronics-housing/README.md#current-seal--large-as568-247-o-ring-2026-10-16). The size came from a secondary chart, to confirm against a supplier table ([SCO-137](https://linear.app/scout1/issue/SCO-137)); elastomer of this pack ring Not recorded), 10 stainless torx screws into M4 heat-set inserts (torque Not recorded), 3 PG11 glands, each fitted in Stage 1 with a printed peg through its diaphragm hole |
| Gland (all three) | PG11 from the lab stock bag Navid supplied (brand and datasheet not recorded); logged nominal values: thread Ø18.6 mm, lid through hole Ø19.0 mm, cable range about 5 to 10 mm ([facts.md](../../docs/hub/facts.md), decision log 2026-10-29); glands point sideways from the raised gland deck on the cap (decision log 2026-10-30) |
| Closed housing mass before the test | 518 g, including hardware, pegs and the paper towel inside (John, 2026-11-02); scale model and resolution Not recorded |
| Water | Fresh water in a bucket separate from the RR-21 buoy float container (changed 2026-11-02, see B3) |
| Pegs installed | Seat well in all three glands, "work great" (John, 2026-11-02, dry fit); [photo](housing-glands-with-pegs-2026-11-02-01.jpg) |
| Gland pegs (3, printed; [gland peg STEP](../cad/electronics-housing/gland-peg-test-2026-11-02.step)) | Shaft 6.35 mm (0.250 in) diameter by 19.05 mm (0.750 in) long; head 10.16 mm (0.400 in) diameter, 6.35 mm (0.250 in) tall, 1.27 mm (0.050 in) 45° chamfers top and bottom; overall length 25.4 mm (1.000 in). Read from the STEP (file is in inches). Printed in PETG, 2 walls, 15% infill, with a handle (John, 2026-11-02); the file's "Steel" label is a CAD default. Method: each peg goes in from the outside through the gland's diaphragm hole, then the gland nut clamps it |
| Conditions | Fresh water first, room temperature, 1:1 scale model submerged just below the surface and held down with weights; then plain salt water mixed by mass (35 g per kg) |
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
| Housing floats and rises out of the water | Test not at depth | Top above the surface | Weights hold it just below the surface; check they stay put and record their mass |
| O-ring twisted or not seated | Leak at the cap | Wet towel near the rim | Reseat; log the finding |
| Forced threads lifted the cap or cracked it | Leak or crack | Gap at the cap; wet towel | Inspect the sealing face before the run; photograph |
| Gland nut under-tightened or cable too small | Leak at a gland | Wet towel near the glands | Check cable diameter against the gland range (Not recorded); retighten once, log it |
| Electronics inside | Not applicable | n/a | Test with the towel only, no electronics |
| Peg does not seal like a cable | Stage 1 passes but real cable leaks | Wet towel in Stage 2 | Treat Stage 1 as a cap and gland-body check only; Stage 2 is the gland verdict |
| Clamping crushes or ovalizes a PETG peg (2 walls, 15% infill) | Peg deforms, nut loosens, leak at the gland | Peg looks oval after clamping; nut turns easily; wet towel | Tighten to the same feel on all three, recheck at 1 h, record the condition of each peg afterwards |
| Peg shaft too small or too large for the diaphragm hole | Leak around the peg or a torn diaphragm | Wet towel near a gland; peg loose or hard to seat | Check the fit dry first; record which glands, replace the diaphragm if torn |
| Salt left on the housing | Corrosion of screws, crust | White residue | Rinse with fresh water and dry |

### A6b. If Stage 1 leaks: leak paths and isolation tests

Run only if Stage 1 is wet. Change one thing at a time and retest; each isolation test gets its own record (RR-24 onward) and Linear issue when it is run. Where the towel is wettest (photograph it) picks the first row.

| Candidate leak path | Why it could leak | How to isolate (one change) | What a result means |
|---|---|---|---|
| Cap O-ring face seal | O-ring twisted or not seated; sealing land lifted by the forced bolt threads (RR-22) | Reseat or replace the O-ring, thin film of grease, same screws and feel; retest | Dry: the O-ring seating was the cause. Still wet: the land is distorted or the path is elsewhere |
| Cap bolt holes and threads | The screws were forced through undersized holes, so threads are cut through the cap and may open a path along the screws | Seal the screw heads externally (for example a bead of sealant on each head) and retest | Dry: the bolt holes leak; the next cap's larger clearance holes need their own seal (O-ring or gasket washers) |
| Each of the 3 glands (body-to-cap thread and face) | The thread or the flat under the gland flange does not seal on a printed facet | Seal two glands externally and test the third; rotate which one is open | Wet only when one gland is open: that gland's thread or face is the path |
| Peg-to-gland diaphragm | The rigid peg does not compress the diaphragm like a cable | Compare a peg gland with a real-cable gland (Stage 2) | Wet with pegs, dry with cable: the peg interface, not the gland, leaked |
| Printed cap, gland deck and body walls (PETG layer porosity) | Layer lines wick water; thin walls or the sideways facets seep | Photograph where the towel is wettest; coat one suspected face with sealant and retest; or a bubble test (small air pressure, submerged) if a test port is added (Not built) | Dry after coating one face: that face is porous |
| Heat-set insert bosses in the body flange | The insert hole may reach the dry chamber and pass water along the screw | Check from the inside whether insert holes are blind (Not recorded); seal the screw heads as above | Insert holes open to the chamber would explain a leak at the screws |

### A7. Procedure

**Prerequisites checklist.**

- ☐ The assembled housing from RR-22, cap on, O-ring in place
- ☐ Dry paper towel, folded, weighed
- ☐ Three printed gland pegs ([gland peg STEP](../cad/electronics-housing/gland-peg-test-2026-11-02.step)), checked to fit each gland's diaphragm hole
- ☐ Real cable of the diameter the glands are meant for (diameter Not recorded)
- ☐ A tub of fresh water deep enough to cover the housing; weights to hold it just below the surface
- ☐ Scale, ruler, camera, clock
- ☐ Later, plain salt: the tub water mixed by mass (35 g per kg)

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Go/no-go checks; weigh the housing with the towel inside and the pegs installed. | Mass | Stable reading | ☐ |
| 2 | Stage 1: push a peg in from the outside through each gland's diaphragm hole, then clamp it by tightening the gland nut; close the cap. | Configuration photo, peg orientation | Pegs seated, nuts tight | ☐ |
| 3 | Throw it in: submerge just below the surface with the weights; record start time. | Time | Fully under | ☐ |
| 4 | Quick check at 1 h for streaming bubbles. | Observation | None | ☐ |
| 5 | After 24 h: remove, dry the outside, weigh, then open and inspect the towel; photograph it. | Mass, photo | Towel dry; mass unchanged (M1, M4) | ☐ |
| 6 | If wet: stop; go to A6b, starting with the row nearest the wettest spot. | Where it is wet | A named candidate path | ☐ |
| 7 | If dry: Stage 2: replace the pegs with real cable; new towel; close the cap; repeat steps 3 to 5. | Mass, photo | Towel dry (M2, M4) | ☐ |
| 8 | If both pass: repeat in plain salt water for 24 h, then continue to 1 week. | Mass, photo | Towel dry (M3) | ☐ |
| 9 | Rinse, dry, photograph; record the screws' and pegs' condition. | Photo | No crust, crack or oval peg | ☐ |

### A8. Analysis plan
Towel state and mass change per stage against M1 to M4. On a leak, record where the towel is wettest to point to the cap or a gland.

### A9. Curve required

None, pass/fail test. No quantitative curve: a leak rate would need a pressure or time series and is not part of this plan.

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| Jes Kuczenski | Not sent | | |

Open questions:

- Torque on the screws, cable diameter, and the elastomer of the pack O-ring: Not recorded. Owner John, before locking. The O-ring size (AS568-247) and screw count (10) are now recorded.
- Stage 1 runs just below the surface, not at 0.3 m, so it screens for leaks only. The 0.3 m R-12 mark and the R-13 depth ([SCO-177](https://linear.app/scout1/issue/SCO-177)) need a later, deeper run. Owner John.
- Weights used to hold it down: type and mass Not recorded. Owner John.
- Gland brand and datasheet are not known (the glands come from the lab stock bag Navid supplied, with a range of sizes; [facts.md](../../docs/hub/facts.md)). The logged PG11 values are nominal: thread Ø18.6 mm, lid hole Ø19.0 mm, cable range about 5 to 10 mm. Diaphragm hole size: Not recorded. Owner John, at the first dry fit.
- The peg handle: the STEP shows a 10.16 mm head only. If the printed pegs have a longer handle than the STEP, update the file or note the difference. Owner John.
- If Stage 1 leaks and the source is unclear, is a Stage 1b with the gland nuts sealed externally wanted? Owner John.
- Schedule: which days this week; the tub is also used for the float test on Mon and Tue. Owner John.

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | Start 2026-11-02 10:47 PST (John: housing put in the water; time recorded when the entry was made). End: due 24 h later, 2026-11-03 at the same time |
| Operator | John Ryan Myrdal |
| Ambient conditions | Indoors, room temperature (water temperature Not recorded) |
| Instrument serials / IDs | To be recorded |

### B2. Raw data

| Time | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|
| 10:47 PST 2026-11-02 | Stage 1 start | Housing (518 g dry, pegs in, towel inside) placed cap end down in a bowl of fresh water, held down with weights; the seal is fully submerged and the body stands above the water | Seal fully under | Water mass not weighed |

### B3. Deviations

| Time | What differed from A7 | Why | Effect on validity |
|---|---|---|---|
| 10:47 PST 2026-11-02 | Fresh water in a bucket separate from the buoy float tub (the plan had a shared tub); the water was not weighed | The housing test does not need the water mass; the float test uses its own container | None for this test. The float container's water is weighed Tuesday for the salt calculation |

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

- Photos, 2026-11-02 (Stage 1 setup in a bowl of fresh water): [wide](housing-dunk-rr-23-2026-11-02-01.jpg), [closer](housing-dunk-rr-23-2026-11-02-02.jpg), [closest](housing-dunk-rr-23-2026-11-02-03.jpg). They show the cap end down with the body standing above the water and the water level near the flange. John confirms the housing seal (cap, O-ring, glands) is fully submerged; the body walls are not under water, so this stage tests the cap end only
- Requirements R-12, R-14 → this test → [SCO-294](https://linear.app/scout1/issue/SCO-294); related: [RR-22](rr-22-housing-cap-assembly-and-gland-fit-2026-11-01.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
