# Test Record Template

> **Summary** — One format for every S.C.O.U.T. test, built around what the advisors asked on
> 2026-10-21 ([SCO-221](https://linear.app/scout1/issue/SCO-221)): say what you measure, what
> counts as success, and how you test it, then show the curve that proves the result, and know
> when it is good enough to stop redesigning. Every record opens with a **one-page summary**
> that can be printed and shared on its own; the full method, data and analysis follow it.
>
> Part of [`docs/engineering/`](.). Mechanical tests are indexed in the
> [risk-reduction register](../../mechanical/test/risk-reduction-register.md); the stage plan is
> the [Layered Test Protocol](layered-test-protocol.md).

---

## Rules

1. **Part A (planning) is written and dated before the test runs.** A pass mark written after the
   result is not a test. Part A is locked on a date, and any later change goes in the deviation
   log (§C3), never over the original text.
2. **One metric, one verdict.** Every row of the result table answers a metric locked in Part A.
   A result with no metric is an observation, not a verdict.
3. **Change one thing at a time.** Name what you vary (§A4). Everything else is held fixed and
   listed, so a pass or fail can be traced to one cause.
4. **Name the curve.** A test that needs a curve says which one: the calibration curve (reading
   vs a known standard) or the validation curve (model vs measurement). "It registered water" is
   not a result.
5. **Say when to stop.** Every record ends with one of: *good enough, stop*, *change X and
   re-run*, or *blocked on Y*.
6. **Retroactive records** (tests run before this format) mark every field that was not written
   down at the time as `Not recorded`. Never fill a gap from memory or inference. The header
   names the source of what is known.
7. **Print rule.** The one-page summary must fit one printed US Letter page, portrait. If it does
   not fit, cut words, not fields.

## Template

File name: `<discipline>/test/rr-NN-subject-YYYY-MM-DD.md`. `NN` is the next free ID in the
[risk-reduction register](../../mechanical/test/risk-reduction-register.md). The CI check
(`check_conventions.py`) fails a PR whose test record lacks the one-page summary or Parts A, B, C.

```markdown
# <Subject> — <Test name>, YYYY-MM-DD

## One-page summary

| | |
|---|---|
| **Test ID / status** | RR-NN · Pass / Fail / Partial / Planned / Superseded |
| **Date, duration, who** | YYYY-MM-DD, N hr, name |
| **Requirement tested** | requirement ID or sentence ([SCO-139](https://linear.app/scout1/issue/SCO-139)) |
| **Tracking issue** | [SCO-NNN](https://linear.app/scout1/issue/SCO-NNN) |
| **Record kind** | Prospective · Retroactive (source: …) |

**Question.** One sentence: what are we trying to find out, and what risk does it retire?

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| | | | | Pass / Fail / Not measured |

**How (3 to 5 lines).** Article, key conditions, duration, sample size.

**Result.** Two sentences with the numbers. Photo or curve if it fits.

**Does not establish.** One to three bullets.

**Decision.** Good enough, stop · Change X and re-run · Blocked on Y. Next test or issue.

---

## Part A — Plan (write and date before the run)

### A1. Purpose and risk retired
Why the test exists and what is wrong if it is skipped.

### A2. Hypothesis
"If <condition>, then <measurable outcome>, because <mechanism>."

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | | |
| Held fixed (controlled) | | |
| Measured (dependent) | | |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|
| M1 | | | | |

Locked on: YYYY-MM-DD.

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | STEP, drawing or commit |
| Material and print settings | |
| Configuration | seal, fasteners, torque, inserts, wiring |
| Conditions | water type and salinity, depth, temperature, load, voltage |
| Sample size and replication | N articles, repeats per article |
| Control / reference article | |
| Stop and abort conditions | |
| Safety | hazards and the form that covers them |

### A7. Procedure

Numbered steps another person could repeat, each with a time, a value to record, and a check
that it happened.

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | | | ☐ |

### A8. Analysis plan
How the data become a verdict: calculation, fit, comparison to the metric.

### A9. Curve required

| Curve | Axes and units | Standard or model compared against | Range to cover | Acceptance for the fit |
|---|---|---|---|---|

Write `None, pass/fail test` and say why when no curve applies.

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | |
| Operator | |
| Ambient conditions | |
| Instrument serials / IDs | |

### B2. Raw data

| Time | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|

### B3. Deviations

| Time | What differed from A7 | Why | Effect on validity |
|---|---|---|---|

`None` if the procedure was followed exactly.

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 | | | Pass · Fail · Not measured |

**Overall:** Pass · Fail · Partial, in one sentence.

### C2. Curve and analysis

The curve (image or table), the fit, its range and error, and how it compares to the model or
standard. Any outlier and what was done with it.

### C3. Validity and limits

- **Sources of error:** …
- **What this does establish:** …
- **What this does not establish:** …
- **Not recorded or shortcut taken:** …

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes (why) · No (what is missing) |
| Design change driven by this test | |
| Re-run needed? | |
| Next test | ID or issue |
| Issues filed | SCO-… |

### C5. Evidence and traceability

- Photos: `rr-NN-subject-YYYY-MM-DD-NN.jpg`
- Data files, CAD, reports: links
- Requirement → this test → tracking issue → related records: links
```

## Where each advisor ask lands

| The advisors asked for | Where |
|---|---|
| What you will measure | A3, one-page summary |
| What counts as success | A5 (locked first) |
| How you will test it | A6 and A7 |
| The curve that proves the result | A9 and C2 |
| Know when to stop redesigning | C4 |
| A table per requirement for [SCO-221](https://linear.app/scout1/issue/SCO-221) | the [Requirements Test Matrix](requirements-test-matrix.md); the one-page summary's header and measurement table roll up into it, and every new test adds its row |
