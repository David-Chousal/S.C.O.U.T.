# Split Wedge-Bottom Print, Prusa Mini vs Larger Printer, 2026-09-23

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-08 · Partial |
| **Date, duration, who** | 2026-09-23 to 2026-09-24, John Ryan Myrdal |
| **Requirement tested** | Parts can be printed reliably at the planned rate |
| **Tracking issue** | [SCO-111](https://linear.app/scout1/issue/SCO-111) |
| **Record kind** | Retroactive (source: [wedge-bottom-split-print-2026-09-23.md](wedge-bottom-split-print-2026-09-23.md)) |

**Question.** Can the lean v5 wedge bottom be split into 30° halves and printed on a Prusa Mini? Retires the risk that parts cannot be printed reliably.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Print completes to spec first time | Visual | Part prints to spec first time | Mini: failed repeatedly; larger printer printed wedges well | Mini Fail / larger printer Pass |

**How.** Split the wedge bottom radially into two 30° halves (butt joint, no key), started half 1 on a Prusa Mini while the medium Prusa ran on a feeder workaround and the large printer was offline.

**Result.** The Mini failed every attempt (bed adhesion, Z calibration off, spaghetti). The larger printer printed wedges well after PTFE-tube feed resistance was fixed.

**Does not establish.**

- Whether a split wedge bottom is structurally and leak-tight acceptable (join method not decided).
- Printed mass or settings for the half: not recorded.

**Decision.** One-piece wedge bottom stays the baseline; whether to keep the split is undecided ([SCO-111](https://linear.app/scout1/issue/SCO-111)).

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Find out whether the printing bottleneck (a full wedge bottom takes over a day) can be relieved by splitting the part for smaller printers.

### A2. Hypothesis
If the wedge bottom is split in two, then each half prints reliably on the Prusa Mini, because it is half the size.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Print outcome | pass / fail | Visual inspection of the print | Binary | Not quantified | Not recorded |
| Printed mass of half | g | Not recorded | Not recorded | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Printer (Mini vs larger printer); part (half vs whole) | 2 printers |
| Held fixed (controlled) | Wedge-bottom CAD (lean v5) | Settings: Not recorded |
| Measured (dependent) | Print success, failure mode | See C1 |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Part prints to spec first time | No failed attempts | Register benchmark | [Register](risk-reduction-register.md) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Part | Lean v5 wedge bottom split into two 30° halves, radial butt joint |
| Printers | EPIC lab Prusa Mini; medium Prusa (feeder bypassed); large printer (offline then back) |
| Material / settings | Not recorded |
| Sample size | Several attempts on the Mini; count not recorded |
| Safety | None |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Split the CAD at the 60° segment centre. | Cut location | Not recorded |
| 2 | Print half 1 on the Prusa Mini. | Settings, time | Not recorded |
| 3 | Inspect on 2026-09-24; retry as needed. | Outcome | Not recorded |
| 4 | Print wedges on the larger printer after feed fix. | Outcome | Not recorded |

### A8. Analysis plan
Binary print outcome by printer.

### A9. Curve required

None, pass/fail test.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Start / end | 2026-09-23 to 2026-09-24 |
| Operator | John Ryan Myrdal |
| Printer state | Medium Prusa on workaround; large printer offline until the power-supply swap |
| Instrument IDs | Not recorded |

### B2. Raw data

Observations: nozzle drag and feed resistance on the first layers (09-23); repeated Mini failures from bed adhesion and Z calibration (09-24).

### B3. Deviations

Plan was the Mini; it failed, so wedges were moved to the larger printer.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 Mini prints first time | Failed repeatedly | — | Fail |
| M1 larger printer | Printed wedges well | — | Pass |

**Overall:** Partial: Mini fails, larger printer passes.

### C2. Curve and analysis
Cause on the Mini: bed adhesion and Z calibration; larger printer fixed by clearing PTFE-tube feed resistance.

### C3. Validity and limits

- Sources of error: lab printer state.
- Does establish: the Mini is not a reliable route for this part.
- Does not establish: that a split part is acceptable.
- Not recorded: Mini settings and print time, printed mass, how the halves would join.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes: use the larger printer, one-piece part |
| Design change driven by this test | None; split not adopted |
| Re-run needed? | No |
| Next test | RR-13 |
| Issues filed | [SCO-111](https://linear.app/scout1/issue/SCO-111), [SCO-114](https://linear.app/scout1/issue/SCO-114) |

### C5. Evidence and traceability

- Source narrative: [wedge-bottom-split-print-2026-09-23.md](wedge-bottom-split-print-2026-09-23.md)
- Photo: [prusa-mini-print-failure-2026-09-24.jpg](prusa-mini-print-failure-2026-09-24.jpg)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
