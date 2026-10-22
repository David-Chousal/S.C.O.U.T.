# Advisor Progress Sheet

> **Summary** — A one-page HTML sheet the team brings to each weekly advisor meeting. It shows
> where the project stands against its phase exit criteria, not a list of tasks done. Built
> from Linear, git and the test register by the `advisor-progress-sheet` Claude skill, using
> [`template.html`](template.html).

---

## Why it exists

Week 3 grade feedback (2026-10-20): Dr. Krishnan asked for a more systematic team that
identifies next steps together; Dr. Kuczenski said progress is hard to tell from activities.
The sheet answers both by showing **movement on exit criteria with evidence**, and by greying
out work that moved nothing.

## What is on the page

| Block | Shows | Source |
|---|---|---|
| Headline stats | Phase time elapsed vs work done, milestones past target, blocked count | Linear |
| Phase Gantt | Seven phase bars, today line, milestone diamonds, work-done fill | Linear projects and milestones |
| Three lanes (ECEN, CSEN, GENG) | Exit criteria, moved this week with issue IDs, stuck, next steps | Linear, git, test register |
| Cross-lane handoffs | Who is waiting on whom | Linear blocking relations |
| Asks for the advisors | Decisions only the advisors can unblock | Linear `Needs Decision`, open ADRs |
| Activity, no status change | Work done that moved no criterion | Linear |

## Weekly run

1. The team agrees the **next steps** in its own meeting first. The skill records them; it
   does not invent them.
2. Prompt Claude: "make the advisor sheet". It reads Linear, writes the sheet from
   [`template.html`](template.html) with a fresh `DATA` block, and saves it outside the repo.
3. Open the HTML, check every item tagged `[inferred]`, print to one landscape page.

## Rules the skill follows

- Every line is backed by evidence: a Linear issue, a merged PR, a test-register row. Nothing
  invented. Unknown stays unknown.
- Phase percent is the average of its milestone progress. Say so on the page.
- A handoff is drawn only from a real Linear blocking relation; otherwise it is tagged
  `[inferred]`.
- Blocked items name what blocks them. If the relation is missing, the sheet says so.
- Late work is shown plainly. No softening.

## Known gaps

- Progress is issue completion, not measured results. Pull measured-vs-target values from the
  [test register](../../../mechanical/test/README.md) where one exists.
- No baseline ghost bar yet; it needs a saved snapshot of the original phase dates.
- Next steps are drafted from Linear until the team confirms them.

## Install the skill

The skill lives outside the repo, like the Weekly Activity Report skill:

```bash
mkdir -p ~/.claude/skills/advisor-progress-sheet
```

Then create `~/.claude/skills/advisor-progress-sheet/SKILL.md` with a name and description
header that points Claude at this README and `template.html`.
