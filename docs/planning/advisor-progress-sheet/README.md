# Advisor Progress Sheet

> **Summary** — A one-page HTML sheet the team brings to each weekly advisor meeting. It shows
> where the project stands against its phase exit criteria as pass, fail or untested with a
> measured target, not a list of tasks done. Built from Linear, git and the test register by
> the `advisor-progress-sheet` Claude skill, using [`template.html`](template.html).

---

## Why it exists

Week 3 grade feedback (2026-10-20): Dr. Krishnan asked for a more systematic team that
identifies next steps together and works through them; Dr. Kuczenski said progress is hard to
tell from activities. The sheet answers each directly:

| Feedback | What the sheet does |
|---|---|
| Systematic; team sets next steps together | The team sets next steps in a weekly sync **before** the sheet is made. Each has an owner and a done-when. The sheet scores last week's plan vs. what happened |
| Progress vs. activities | Each person's bullets state what was produced and which subsystem it advances, with a Linear issue or PR as evidence. A criteria chip shows pass / partial / untested counts against written targets |

## What is on the page

| Block | Shows | Source |
|---|---|---|
| Phase Gantt | Seven phase bars, today line, milestone diamonds, work-done fill | Linear projects and milestones |
| One block per person (Isabella, David, John Ryan) | A criteria chip (pass / partial / untested counts), then the four parts below | Linear, git, PRs, test register, each person's own line |
| Last week (2-4 bullets) | What they did in plain English, the 2-3 steps taken, what it produced, which subsystem or initiative it advances and why | Linear, PRs, git |
| Challenges | What is stuck and what it waits on | Linear blocking relations, `Needs Decision` |
| Next week | Tasks with owner and done-when | Linear `On Deck`, team sync |
| Plan vs. actual | One line per person scoring last week's commitments | Saved snapshot of last sheet |
| Asks for the advisors | Decisions only the advisors can unblock | Linear `Needs Decision`, open ADRs |

The advisor-feedback record lives in the table above, not on the sheet.

## Weekly run

1. **Team sync first (about 10 minutes).** The three of you set next steps by labelling Linear
   issues `On Deck` and agreeing an owner and a done-when for each. The skill never drafts the
   team's next steps as if they were agreed.
2. Prompt Claude: "make the advisor sheet". It asks each person for one line on what they did,
   cross-checks it against Linear, git and the test register, fills the `DATA` block in [`template.html`](template.html), and saves the sheet outside the repo.
3. **Save the commitments** from the sheet (one line each in
   `docs/planning/advisor-sheets/commitments-YYYY-MM-DD.md`) so next week's sheet can score
   them. This is how plan vs. actual works.
4. Open the HTML, check anything marked `suggested by sheet` or `[team to add]`, print to one
   landscape page.

## Rules the skill follows

- Every bullet carries evidence: a test-register row, a Linear issue or a merged PR, and states
  an outcome and a subsystem. Work that moved nothing is said plainly, not dressed up.
- Plain English: written for someone who has not seen Linear. 2-4 bullets per person.
- A criterion is **pass** only when a recorded test meets its written target. Partial means a
  test passed under easier conditions than the target; say which conditions. Untested means
  nothing recorded.
- Milestone percent is issue completion and is labelled so. It never stands in for a result.
- A handoff or blocker comes from a Linear relation. If a blocking issue is already Done, say
  so: the status may be stale and the real wait something else (for example a parts delivery).
- Next steps not confirmed by the team show a visible "not yet confirmed" banner.
- Late work is shown plainly. No softening.

## Known gaps

- Criteria are drafted from Linear milestones and the
  [risk-reduction register](../../../mechanical/test/risk-reduction-register.md). Benchmarks are
  provisional until [SCO-139](https://linear.app/scout1/issue/SCO-139) fixes them. Electronics
  criteria have no register yet; add one so ECEN results can be read the same way.
- Phase 2 criteria are drafted in [`phase-2-exit-criteria.md`](phase-2-exit-criteria.md) and
  need the team's edits before the sheet can use them.
- No baseline ghost bar on the Gantt yet; it needs a saved snapshot of the original dates.
- Whether the sheet satisfies the advisors is untested. Show the first one to both and ask.

## Install the skill

The skill lives outside the repo, like the Weekly Activity Report skill:

```bash
mkdir -p ~/.claude/skills/advisor-progress-sheet
```

Then create `~/.claude/skills/advisor-progress-sheet/SKILL.md` with a name and description
header that points Claude at this README and `template.html`.
