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

> **Unified standard (2026-11-01).** This template merges two standards so a test plan misses
> nothing either had. From the original template (John, mechanical): locked pass mark, one varied
> variable, named curve, stop decision, retroactive honesty, printable one-page summary. From the
> electronics protocols (Isabella, per [SCO-258](https://linear.app/scout1/issue/SCO-258) and the
> [bench plan](../planning/isabella-bench-plan-2026-10-29.html)): a one-page what/setup/steps/pass
> protocol, three-tier pass criteria (reading exists, is reasonable, matches a reference),
> readiness checks before power, a damage and failure-mode table, expected values per step,
> data path, parts and tools list, and advisor review before the run. Isabella's own protocol
> draft was not in the repo when this was merged; check it against this list and add anything it
> has that this does not ([SCO-258](https://linear.app/scout1/issue/SCO-258)).

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
8. **Check before you start.** List the go/no-go checks to run before power, immersion or load
   (§A6, "Before you start"), with the value you expect. A test that damages the article through
   a setup mistake is a failed setup, not a result.
9. **Name what can go wrong.** Every plan has a hazards and failure-modes table (§A6a): what
   could go wrong, what happens, how you would notice, and the fix. Include damage to the
   article and to the instruments, and the safety form that covers the work.
10. **Expected values and three tiers.** Each metric says which question it answers: is there a
    reading at all, is it reasonable, does it match the reference within a tolerance. Each
    procedure step says what you should see, so a surprise is noticed on the spot.
11. **Reviewed before the run.** Send Part A to the reviewer who owns the requirement (advisor
    or discipline lead) and log their feedback in §A10 before the run. Questions you cannot
    answer yourself go in §A10 too.

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

**How and steps (3 to 6 lines).** Article, setup, key conditions, duration, sample size, then the steps, one line each. This is the one-page protocol: what is tested, setup, steps, pass criteria.

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

| # | Metric | Check (Present · Plausible · Accurate vs reference · Other) | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | | | | | |

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
| Reference instrument or standard | what the reading is checked against, its resolution and last check |
| Expected values | what a healthy setup reads before and during the test (for example 3.3 V rail, 0 Ω short, waterline) |
| Before you start (go/no-go) | unpowered or dry checks and the value that means stop (for example 3V to GND must not beep) |
| Data path | how the data reaches the log: cable, port, baud, file, who records it |
| Stop and abort conditions | |
| Safety | hazards and the form that covers them |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| | | | |

Cover mistakes in setup (wrong pin, swapped wires, no antenna, wrong salinity), damage to the
article and instruments, and personal safety. Say what a spare part costs when that sets the
risk you are willing to take.

### A7. Procedure

**Prerequisites checklist.** Parts and quantities (with a link or part number), tools and
instruments, software or firmware (commit or build command), cables and adapters, consumables,
spares, space and time booked. Tick each before step 1.

Numbered steps another person could repeat, each with a time, a value to record, the value you
expect, and a check that it happened.

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | | | | ☐ |

### A8. Analysis plan
How the data become a verdict: calculation, fit, comparison to the metric.

### A9. Curve required

| Curve | Axes and units | Standard or model compared against | Range to cover | Acceptance for the fit |
|---|---|---|---|---|

Write `None, pass/fail test` and say why when no curve applies.

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| | | | |

Open questions for the reviewer, each with an owner and a date. A question that decides the
pass mark must be answered before Part A is locked.

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
| How you will test it | A6, A6a and A7 |
| The curve that proves the result | A9 and C2 |
| Know when to stop redesigning | C4 |
| An explicit protocol with acceptance criteria before any sensor test (Dr. Krishnan, 2026-10-28) | One-page summary, A5 check column, A6 go/no-go, A7 expected values, A10 review |
| A table per requirement for [SCO-221](https://linear.app/scout1/issue/SCO-221) | the [Requirements Test Matrix](requirements-test-matrix.md); the one-page summary's header and measurement table roll up into it, and every new test adds its row |
