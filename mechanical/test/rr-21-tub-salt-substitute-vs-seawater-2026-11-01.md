# Tub Plain-Salt Water vs Santa Cruz Seawater, Float Waterline, 2026-11-01

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-21 · Planned |
| **Date, duration, who** | Plain-salt part planned Mon 2026-11-02 to Tue 2026-11-03 (24 h float); seawater part tentative, Not set; John Ryan Myrdal |
| **Requirement tested** | Floats at the modelled waterline (R-17), here: does cheap plain salt give the same waterline as real seawater |
| **Tracking issue** | [SCO-292](https://linear.app/scout1/issue/SCO-292); runs with [SCO-172](https://linear.app/scout1/issue/SCO-172) |
| **Record kind** | Prospective |

**Question.** Does the same buoy float at the same waterline in cheap plain salt water (non-iodized or kosher NaCl, mixed by mass to 35 g per kg) as in real Santa Cruz seawater? Retires the risk that the tub float tests use a water that does not match the ocean (Jes Kuczenski's ask). John decided on 2026-11-01 to use plain salt for waterline tests, so the seawater comparison checks that choice and is tentative.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Salt mass vs target (g) | Scale | Within 1% of 35 g per kg of the weighed water mass | Not yet run | Not measured |
| Freeboard of the same buoy (in) | Ruler or calipers, fixed reference mark | Plain-salt water within 0.1 in of seawater (proposed, lock before the run) | Not yet run | Not measured |
| Reading spread across three marks (in) | Same | 0.05 in or less | Not yet run | Not measured |

**How and steps.** One assembled buoy, same ballast and payload throughout. Measure the tub's water mass, float the buoy in fresh water (control), dissolve salt in the same tub at 35 g per kg of solution, settle 15 min, read draft and freeboard at three marks, hold 24 h for the seam-leak check. If Santa Cruz seawater is collected, rinse the tub and repeat in seawater as collected. There is no salinity meter: salinity is set by mass and the seawater is not metered.

**Result.** Not yet run.

**Does not establish.**

- That plain salt equals seawater for anything but buoyancy: no magnesium, calcium or sulfate, so nothing about plastic absorption, seals, corrosion or fouling.
- The actual salinity of the seawater (not metered; typically near 35 ppt, lower near runoff or after rain).
- Anything about waves, currents or biofouling.

**Decision.** Run the plain-salt part with SCO-172 on Mon Nov 2. Add the seawater part only if the Santa Cruz trip happens.

---

## Part A — Plan (write and date before the run)

### A1. Purpose and risk retired
Pick the cheapest water that gives an honest waterline for the tub tests ([SCO-172](https://linear.app/scout1/issue/SCO-172), the model check in R-17). Real seawater is the reference because it is what the buoy floats in. Plain salt is the working choice (John, 2026-11-01); the seawater run quantifies the error, if any.

Salt: non-iodized or kosher salt from a grocery store; example [Morton Canning & Pickling Salt, 4 lb](https://www.walmart.com/ip/seort/10318924). Read the label: no iodine, no anti-caking agent. Record the product and the price paid (Not recorded yet). Instant Ocean is not used for this test.

### A2. Hypothesis
If the buoy is floated in fresh water, in plain salt water mixed to 35 g per kg, and (if collected) in Santa Cruz seawater, then the freeboard in plain salt water differs from seawater by 0.1 in or less, because buoyancy depends on water density and density at a given salinity is set mostly by the dissolved mass, not by which ions it is.

Expected size of the difference (estimate, to be checked, not a measurement): NaCl-only water at 35 g/kg is likely a fraction of a percent less dense than seawater of the same salinity, and the seawater's own salinity is unmetered (a few ppt either way is about 0.1% per ppt in density). Each moves the draft by a few hundredths of an inch at most.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Water mass in the tub | kg | Fill from a known container or weigh the filled tub minus the empty tub | To be recorded | To be recorded | Not recorded |
| Salt mass | g | Scale | To be recorded | To be recorded | Not recorded |
| Freeboard and draft | in | Ruler or calipers against a fixed mark on the buoy, three marks, mean | To be recorded | To be recorded | Not recorded |
| Water temperature | °C | Thermometer | To be recorded | To be recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Water type | Fresh (control), plain salt at 35 g per kg, Santa Cruz seawater (tentative) |
| Held fixed (controlled) | Buoy, payload and ballast, tub, water depth, settle time (15 min), rinse and dry between waters, water temperature within about 2 °C | Same buoy and mass throughout |
| Measured (dependent) | Freeboard and draft at three marks, water temperature, salt mass | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Salt mass is right | Present | Salt mass within 1% of 35 g per kg × (solution mass) | Scale resolution; 1% of 35 ppt is about 0.35 ppt, a few thousandths of an inch of draft (estimate) | This plan |
| M2 | Freeboard in plain salt vs seawater (if collected) | Accurate vs reference | Within 0.1 in of the seawater freeboard | One fifth of the ±0.5 in model tolerance in R-17, above the ruler resolution; proposed, John and Jes to confirm | [Requirements matrix R-17](../../docs/engineering/requirements-test-matrix.md) |
| M3 | Reading noise | Plausible | Three marks agree within 0.05 in | Sets the noise floor; if it fails, M2 cannot be judged | This plan |
| M4 | Fresh water is lower than the salt water | Plausible | Freeboard in fresh water is smaller than in salt water | Denser water floats the buoy higher; if not, something is wrong with the setup | Archimedes |
| M5 | Matches the model | Accurate vs reference | Plain-salt freeboard within ±0.5 in of the model's 4.27 in | The R-17 requirement | [SCO-172](https://linear.app/scout1/issue/SCO-172) |

Locked on: Not yet locked. Lock this section (date it here) before step 1 of the procedure.

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | The assembled buoy as floated in [RR-17](rr-17-assembled-buoy-bin-float-2026-10-16.md) (record which float, and the total mass) |
| Material and print settings | As built; do not recoat or change anything between waters |
| Configuration | Sealed, payload and ballast fixed; lid screws and glands as in RR-17 |
| Conditions | Room-temperature water; depth enough to float freely |
| Sample size and replication | 1 buoy; fresh then plain salt in the same tub; seawater run if collected |
| Control / reference article | Fresh water is the control; real seawater is the reference (tentative) |
| Reference instrument or standard | Seawater (tentative). No salinity meter: salinity comes from mass |
| Expected values | Fresh: lowest freeboard. Plain salt: freeboard near the model's 4.27 in ([SCO-172](https://linear.app/scout1/issue/SCO-172)) |
| Before you start (go/no-go) | Buoy dry outside and weighed (if mass changed since the last float, reweigh and stop to find out why). Tub clean, no residue. Salt label read: no iodine, no anti-caking agent |
| Data path | Handwritten sheet or a notes file in the repo, photographed ruler readings; enter into B2 the same day |
| Stop and abort conditions | Buoy leaks (weeping seam); water cloudy after stirring; seawater has visible growth or smell |
| Safety | Salt-water spills (slip), carrying buckets, tub weight. Seawater collection hazards below. Hazard form: [SCO-211](https://linear.app/scout1/issue/SCO-211) (signature pending) |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Iodized or anti-caking salt used | Cloudy water, extra additives | Cloudy solution, residue | Non-iodized or kosher salt only; read the label |
| Salt mass wrong (volume scoops, wrong water mass) | Salinity wrong by several ppt, no meter to catch it | Freeboard far from the model | Weigh the water and the salt; salt mass = water mass × 35/965; recheck the arithmetic before adding |
| Salt not fully dissolved | Layered water, low density at the top | Crystals on the bottom, freeboard drifts | Stir several minutes, circulate, wait for the 15 min settle |
| Seawater changes in the bucket | Growth, smell, cloudy water | Visible growth or odor | Collect within a day or two of the test; keep sealed and cool; discard and recollect if it changes |
| Harbor water diluted by rain or runoff | Salinity well below open ocean | Freeboard lower than the plain-salt run | Collect away from outfalls, not right after rain; record weather; read the result with that in mind |
| Salt on the buoy or hardware | Corrosion of metal parts, crystal crust | White residue | Rinse with fresh water and dry after the day's runs |
| Slippery rocks or surf at the collection site | Fall, injury | Wet or surging site | Collect from a pier or ramp, never alone, skip bad surf; check whether a sample needs any permit (Not recorded) |
| Disposal of salt water | Environmental or plumbing issue | n/a | Ask EHS and campus rules before pouring out (Not recorded); do not pour into storm drains |

### A7. Procedure

**Prerequisites checklist.**

- ☐ Non-iodized or kosher salt (about 4 lb boxes; amount set by the tub's water mass in step 2; [example](https://www.walmart.com/ip/seort/10318924))
- ☐ Scale for the salt; a way to weigh or measure the tub's water; thermometer; ruler or calipers
- ☐ Tub (two on hand), clean; towels; fresh water for rinsing
- ☐ For the seawater part (tentative): clean food-grade buckets or jugs with lids, rinsed with fresh water, labeled with date and site; enough volume to float the buoy in the tub (volume Not recorded)
- ☐ Camera for the ruler readings; the buoy weighed and its configuration recorded
- ☐ Hazard form signed or its scope confirmed ([SCO-211](https://linear.app/scout1/issue/SCO-211))

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Weigh the buoy dry; check the go/no-go items in A6. | Mass, date | Equal to the last float's mass | ☐ |
| 2 | Fill the tub with fresh water; measure the water mass. | kg of water | Plausible for the tub size | ☐ |
| 3 | Float the buoy in fresh water; settle 15 min; read draft and freeboard at three marks. | in at each mark, water temperature | The lowest freeboard (M4) | ☐ |
| 4 | Compute salt mass = water mass × 35/965 (for example 40 kg of water needs 1.45 kg of salt; 100 kg needs 3.63 kg). Weigh the salt. | Salt mass, arithmetic | Within 1% of target (M1) | ☐ |
| 5 | Dissolve the salt in the same tub, stirring until clear; settle 15 min; read draft and freeboard at three marks. | in at each mark | Higher than fresh; near 4.27 in (M5) | ☐ |
| 6 | Leave the buoy floating 24 h; check seams and hardware for weeping or leaks; read again. | Leak yes/no, in | No weeping at the seams | ☐ |
| 7 | Seawater part (tentative): rinse and dry the buoy and tub; fill with seawater as collected; settle 15 min; read at three marks. | in at each mark | Close to the plain-salt run (M2) | ☐ |
| 8 | Rinse and dry the buoy and hardware; photograph; weigh it again. | Mass | Equal to step 1 | ☐ |

### A8. Analysis plan
Mean freeboard per water over the three marks. Spread across marks against 0.05 in (M3). Fresh below salt (M4). Plain-salt freeboard against the model's 4.27 in (M5). If seawater was run, the difference from plain salt against 0.1 in (M2).

### A9. Curve required

| Curve | Axes and units | Standard or model compared against | Range to cover | Acceptance for the fit |
|---|---|---|---|---|
| Validation: freeboard vs salinity | Salinity (ppt, from mass) on x, freeboard (in) on y | The buoy stability model's freeboard | Fresh (0 ppt) and 35 ppt (plus seawater, plotted at an assumed 35 ppt, tentative) | Salt point within the ±0.5 in model tolerance in R-17 |

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| Jes Kuczenski (GENG advisor; asked for the seawater reference) | Not sent | | |

Open questions:

- Is 0.1 in the right tolerance for M2? Owner John with Jes, before locking.
- Tub water mass: measured Mon Nov 2 in step 2; salt mass computed from it. Owner John.
- Santa Cruz seawater trip: tentative for the weekend of Nov 7–8; may be dropped. Owner John.
- The pod seal soak ([SCO-176](https://linear.app/scout1/issue/SCO-176)) and the 4-week soak ([SCO-180](https://linear.app/scout1/issue/SCO-180)) use real seawater or a marina, not plain salt (John, 2026-11-01). Confirm the water for SCO-176. Owner John.

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
| M1 salt mass | Not yet run | — | Not measured |
| M2 plain salt vs seawater | Not yet run | — | Not measured |
| M3 reading noise | Not yet run | — | Not measured |
| M4 fresh lowest | Not yet run | — | Not measured |
| M5 vs model | Not yet run | — | Not measured |

**Overall:** Planned.

### C2. Curve and analysis
Not yet run.

### C3. Validity and limits

- Does establish: nothing yet.
- Will not establish: that plain salt matches seawater for material, seal, corrosion or fouling tests; the seawater's actual salinity.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Not yet known |
| Design change driven by this test | None expected; confirms the water for tub waterline tests |
| Re-run needed? | Not yet run |
| Next test | The 4-week soak in real seawater or at a marina ([SCO-180](https://linear.app/scout1/issue/SCO-180)) |
| Issues filed | [SCO-292](https://linear.app/scout1/issue/SCO-292) |

### C5. Evidence and traceability

- Requirement R-17 (floats at the modelled waterline) → this test → [SCO-292](https://linear.app/scout1/issue/SCO-292); related: [RR-17](rr-17-assembled-buoy-bin-float-2026-10-16.md), [RR-19](rr-19-petg-water-absorption-soak-2026-10-21.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
