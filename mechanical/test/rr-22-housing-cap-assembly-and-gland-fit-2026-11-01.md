# Electronics Housing Cap Assembly and Gland Fit, 2026-11-01

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-22 · Partial |
| **Date, duration, who** | 2026-11-01, duration Not recorded, John Ryan Myrdal |
| **Requirement tested** | Cap seals and glands stay dry (R-14), fit part only: heat-set inserts, cap bolts, PG11 gland seating |
| **Tracking issue** | [SCO-270](https://linear.app/scout1/issue/SCO-270); redesign [SCO-293](https://linear.app/scout1/issue/SCO-293) |
| **Record kind** | Retroactive (source: John's account and three photos on 2026-11-01) |

**Question.** Does the first printed housing assemble: heat-set inserts in the body flange, the cap bolted down on the O-ring, and three PG11 cable glands threaded into the cap? Retires the risk that the cap and gland CAD does not fit when printed.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Heat-set inserts seated in the body flange | Soldering iron, visual | All seat flush | Done; count Not recorded | Pass (observation) |
| Cap bolts pass through the cap holes | Screws and driver | Screw drops through without cutting threads | Holes too narrow; screws forced through and cut threads in the cap | Fail |
| Cap clamps on the O-ring | Hand tool | Cap draws down evenly | Clamping achieved with the forced screws | Pass with workaround |
| PG11 glands thread into the cap | Hand | Seat and nut engages on the 3 to 4 mm wall | Glands threaded in; seating and nut engagement Not recorded | Not measured |

**How.** Heat-set inserts pressed into the printed body's flange with a soldering iron, O-ring placed, cap screwed down with stainless torx screws, three PG11 glands threaded into the printed gland block on the cap ([cap STEP](../cad/electronics-housing/electronics-housing-cap-sideways-glands-2026-10-30.step)). A paper towel is inside for the leak test (RR-23).

**Result.** Assembled and clamped, but the cap's bolt holes were dimensioned too narrow, so the screws were forced through and cut their own threads in the cap. The cap is double-threaded: forced threads on top, heat-set insert threads below. No water test yet.

**Does not establish.**

- That the cap seals: nothing was submerged. The forced threads and any distortion of the sealing face are untested.
- Gland fit numbers (hole and wall dimensions, nut engagement): Not recorded.

**Decision.** Change X and re-run: enlarge the cap's bolt clearance holes in the next cap ([SCO-293](https://linear.app/scout1/issue/SCO-293)); waterproof-test this cap this week ([RR-23](rr-23-housing-cap-and-gland-seal-tests-2026-11-01.md)).

---

## Part A — Plan (write and date before the run)

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Show that the first printed cap and housing assemble as designed, so the seal tests can start. Retires the risk that the cap, bolt and gland geometry does not fit.

### A2. Hypothesis
If the cap's bolt holes are clearance holes and the gland bores match PG11, then the cap bolts down on the O-ring without forcing and the glands seat, because the CAD dimensions follow the hardware.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Cap bolt hole diameter | mm | Not recorded | Not recorded | Not recorded | Not recorded |
| Screw size (thread, length) | mm | Not recorded | Not recorded | Not recorded | Not recorded |
| Assembly observations | n/a | Visual, photos | n/a | n/a | n/a |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | None (single assembly) | n/a |
| Held fixed (controlled) | Design: body, cap, O-ring, screws, glands | Single build |
| Measured (dependent) | Fit of bolts and glands, clamping | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Cap bolts pass through the holes | Present | Screw drops through without cutting threads | Clearance holes are the design intent | [SCO-270](https://linear.app/scout1/issue/SCO-270) |
| M2 | Glands seat and nut engages | Present | PG11 seats and nut engages on the 3 to 4 mm wall | Gland fit coupon criterion | [SCO-270](https://linear.app/scout1/issue/SCO-270) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | [Cap STEP, sideways glands, 2026-10-30](../cad/electronics-housing/electronics-housing-cap-sideways-glands-2026-10-30.step); body [STEP](../cad/electronics-housing/electronics-housing-body.step) |
| Material and print settings | Grey print, material and settings Not recorded (PETG assumed elsewhere in the repo) |
| Configuration | O-ring in the cap, stainless torx screws into heat-set inserts, 3 PG11 glands in the side wall of the gland block; screw count and torque Not recorded |
| Conditions | Bench, room temperature |
| Sample size and replication | 1 assembly |
| Control / reference article | None |
| Reference instrument or standard | Not recorded |
| Expected values | Screws drop through; glands seat; nut engages |
| Before you start (go/no-go) | Not recorded |
| Data path | Photos, John's account |
| Stop and abort conditions | Not recorded |
| Safety | Soldering iron for the inserts (burn risk); hazard form [SCO-211](https://linear.app/scout1/issue/SCO-211) |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Bolt hole narrower than the screw | Screw cuts its own thread, cap cracks or distorts, sealing face lifts | Hard to turn, plastic swarf, uneven gap | Clearance holes; a first-layer allowance; test-fit with a screw before the print is used |
| Inserts crooked or over-melted | Weak or tilted thread | Insert not flush, tilted screw | Press square, keep heat short |
| Forced threads damage the sealing land | Leak path | Wet towel after a soak | RR-23 stage 1 inspects and tests it |

### A7. Procedure

**Prerequisites checklist.** Not recorded (retroactive).

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Heat-set inserts into the body flange with a soldering iron ([photo](housing-cap-assembly-2026-11-01-03.jpg)). | Insert count | Flush | Done |
| 2 | Thread the cable glands into the cap's gland block. | Fit | Seat and nut engages | Done (fit values Not recorded) |
| 3 | Place the O-ring, set the cap, start the screws. | Hole fit | Screws drop through | Done: holes too narrow |
| 4 | Force the screws through, cutting threads in the cap; tighten to clamp. | Clamp | Even clamping | Done |

### A8. Analysis plan
Compare each step with its expected result; record workarounds.

### A9. Curve required

None, fit check. A leak curve does not apply until the seal tests.

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | 2026-11-01, times Not recorded |
| Operator | John Ryan Myrdal |
| Ambient conditions | Bench, indoors |
| Instrument serials / IDs | Not recorded |

### B2. Raw data

| Time | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|
| Not recorded | Cap bolt holes | Too narrow for the screws | Clearance | Dimensioning error in the CAD |
| Not recorded | Cap screws | Forced through, cut threads in the cap | Clean pass | "A lot of work" |
| Not recorded | Cap clamp | Clamped | Even draw-down | Double threading: cap (forced) and insert (heat-set) |
| Not recorded | Glands | Threaded into the cap | Seat, nut engages | Values Not recorded |

Photos: [assembled](housing-cap-assembly-2026-11-01-01.jpg), [cap off, glands on the block](housing-cap-assembly-2026-11-01-02.jpg), [inserts going into the body flange](housing-cap-assembly-2026-11-01-03.jpg).

### B3. Deviations

| Time | What differed from A7 | Why | Effect on validity |
|---|---|---|---|
| Step 3 to 4 | Screws forced through the cap holes | Holes too narrow (dimensioning error) | Cap threads are not as designed; a leak test result applies to this cap only |

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 screws drop through | Holes too narrow, forced | Fail by design | Fail |
| M2 glands seat, nut engages | Threaded in; values Not recorded | — | Not measured |

**Overall:** Partial. It assembles and clamps with a workaround; the bolt-hole CAD is wrong.

### C2. Curve and analysis
None.

### C3. Validity and limits

- Sources of error: no dimensions recorded; the account is from memory of the day.
- Does establish: the cap and body assemble and clamp, inserts seat, glands thread in.
- Does not establish: any seal, or whether the forced threads harmed the sealing face.
- Not recorded: bolt hole and screw dimensions, screw count and torque, gland fit numbers, cap weight, print material and settings.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | No: the bolt holes must grow |
| Design change driven by this test | Larger cap bolt clearance holes ([SCO-293](https://linear.app/scout1/issue/SCO-293)), merged with the SMA bulkhead and D-cell bay changes ([SCO-162](https://linear.app/scout1/issue/SCO-162)) |
| Re-run needed? | Yes, with the next cap |
| Next test | [RR-23](rr-23-housing-cap-and-gland-seal-tests-2026-11-01.md) on this cap |
| Issues filed | [SCO-293](https://linear.app/scout1/issue/SCO-293), [SCO-294](https://linear.app/scout1/issue/SCO-294) |

### C5. Evidence and traceability

- Photos: [01](housing-cap-assembly-2026-11-01-01.jpg), [02](housing-cap-assembly-2026-11-01-02.jpg), [03](housing-cap-assembly-2026-11-01-03.jpg)
- Requirement R-14 → this test → [SCO-270](https://linear.app/scout1/issue/SCO-270); related: [RR-23](rr-23-housing-cap-and-gland-seal-tests-2026-11-01.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
