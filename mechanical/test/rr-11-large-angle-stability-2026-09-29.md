# Large-Angle Stability and Self-Righting Calculation, 2026-09-29

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-11 · Pass |
| **Date, duration, who** | 2026-09-28 to 2026-09-29, John Ryan Myrdal |
| **Requirement tested** | Buoy rights itself from any angle |
| **Tracking issue** | [SCO-82](https://linear.app/scout1/issue/SCO-82), [SCO-125](https://linear.app/scout1/issue/SCO-125) |
| **Record kind** | Retroactive (source: [risk-reduction register RR-11](risk-reduction-register.md) and the [buoy-stability calculator](../simulations/buoy-stability/README.md)) |

**Question.** Is the buoy stable upside down, and does a ballast arm fix it? Retires the risk that the buoy capsizes and stays capsized.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Righting behaviour from any angle | STEP-geometry righting-arm calculator | Rights itself from any angle | v5 fails (stable inverted); v6 with a 24 in ballast arm passes | v5 Fail / v6 Pass |

**How.** Computed the righting-arm curve from the STEP geometry. v5 was stable inverted; v6 adds a 24 in 316 pipe ballast arm (~2.6 kg encapsulated lead), 1.5 in wedge-bottom caps, a flange housing and a chassis printed at 6 walls / 25% gyroid (808 g).

**Result.** v5 capsizes stably. v6 self-rights from any angle in the calculator.

**Does not establish.**

- A physical tilt test (planned, [SCO-171](https://linear.app/scout1/issue/SCO-171)).
- Lead against the reef permit ([SCO-136](https://linear.app/scout1/issue/SCO-136)).
- LC7 for the mooring collar ([SCO-135](https://linear.app/scout1/issue/SCO-135)).

**Decision.** Change adopted: v6 with ballast arm. Next: physical self-righting tilt test from 90° and 180° ([SCO-171](https://linear.app/scout1/issue/SCO-171)).

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Check large-angle stability, which the small-angle stability analysis did not cover.

### A2. Hypothesis
If the buoy is rotated to any angle, then it returns upright, because the centre of buoyancy and the ballast produce a positive righting arm at every angle.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Righting arm vs heel angle | m vs degrees | Calculator (`buoy_stability.py`) on STEP geometry | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Design iteration (v5, v6) and heel angle | 0–180° |
| Held fixed (controlled) | Mass budget, water density | See calculator |
| Measured (dependent) | Righting arm, equilibrium angles | See C1 |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Righting arm positive over the full heel range | Rights itself from any angle | Register benchmark | [Register](risk-reduction-register.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Model | STEP geometry of v5 and v6 assemblies |
| Tool | [`mechanical/simulations/buoy-stability/`](../simulations/buoy-stability/README.md) |
| Sample size | Not applicable (calculation) |
| Safety | None |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Load STEP geometry and mass properties. | Inputs | Not recorded |
| 2 | Compute the righting-arm curve. | Curve | Not recorded |
| 3 | Add the ballast arm; recompute. | Curve | Not recorded |

### A8. Analysis plan
Inspect the sign of the righting arm across 0–180°.

### A9. Curve required

Righting-arm curve (GZ vs heel angle) from the calculator. Validation against a physical tilt test is not yet done.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Run date | 2026-09-28 / 2026-09-29 |
| Operator | John Ryan Myrdal (with Claude) |
| Tool | buoy-stability calculator |
| Results | `mechanical/simulations/buoy-stability/results/` |

### B2. Raw data

See the calculator results folder.

### B3. Deviations

None recorded.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 rights from any angle, v5 | Stable inverted | — | Fail |
| M1 rights from any angle, v6 | Rights from any angle | — | Pass |

**Overall:** v5 fails; v6 passes in the calculation.

### C2. Curve and analysis
Source: [Stability §12](../../docs/engineering/buoy-structural/stability-analysis.md#12-large-angle-stability-capsize-and-self-righting-ballast--2026-09-29), [Ballast Arm and Mount](../../docs/engineering/buoy-structural/ballast-arm-and-mount.md).

### C3. Validity and limits

- Sources of error: calculation only; the calculator is not validated against a tilt test.
- Does establish: the v5 problem and a candidate fix.
- Does not establish: physical self-righting.
- Not recorded here: numeric angles and arm lengths (see calculator).

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Not until the tilt test passes |
| Design change driven by this test | v6: ballast arm, 1.5 in caps, flange housing, 6-wall chassis |
| Re-run needed? | After design changes |
| Next test | Self-righting tilt test [SCO-171](https://linear.app/scout1/issue/SCO-171) |
| Issues filed | [SCO-135](https://linear.app/scout1/issue/SCO-135), [SCO-136](https://linear.app/scout1/issue/SCO-136) |

### C5. Evidence and traceability

- [Buoy-stability calculator](../simulations/buoy-stability/README.md)
- [Stability analysis §12](../../docs/engineering/buoy-structural/stability-analysis.md)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
