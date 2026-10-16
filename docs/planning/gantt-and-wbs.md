# Gantt Chart and WBS — How It Works

> **Summary** — The team's task plan lives in one CSV. A script turns it into the Gantt chart
> and WBS PDF. Change the CSV (or ask Claude to resync it from Linear), rerun the script,
> commit the new PDF.
>
> Part of the [docs index](../README.md). Built for the Oct 18, 2026 course assignment.

## The pieces

| File | Role |
|---|---|
| [`wbs-tasks.csv`](wbs-tasks.csv) | The editable plan: one row per task or milestone |
| [`scripts/make_gantt.py`](../../scripts/make_gantt.py) | Reads the CSV and writes the PDF. Standard library only |
| [`gantt-fall-2026.pdf`](gantt-fall-2026.pdf) | The output submitted for the assignment |

## CSV columns

| Column | Meaning |
|---|---|
| `kind` | `task`, `milestone` or `deadline` (an external deadline) |
| `wbs` | WBS number: 1 project management, 2 electrical, 3 firmware and software, 4 mechanical, 5 deployment; `M` and `D` for milestones and deadlines |
| `linear` | Linear issue ID or IDs (`SCO-12`, or `SCO-18 / SCO-84` for a grouped task) |
| `task`, `owner`, `phase`, `status` | What, who, which project phase, Linear status |
| `start`, `end` | ISO dates; duration is calculated (calendar days, inclusive) |
| `depends_on` | Linear IDs this task waits for, space-separated. These mirror the issues' Linear "blocked by" relations exactly; drawn as arrows on the detail pages and listed after the arrow symbol in each label |
| `constraint` | The outside constraint: vendors, printer access, reviewers, SCU deadlines |
| `milestone` | The milestone the task completes, if any |
| `date_source` | `Linear due` (the end date equals the issue's Linear due date; a start is Linear's only if the issue has started), `estimated` (proposed or changed here, owner to confirm), `derived` (set by the assignment), `proposed` (John's proposed dates for another owner, shown with a purple dashed outline and **not** in Linear until that owner agrees), or `Linear` (an external deadline) |

## Updating it

1. Edit the CSV, or ask Claude to "resync the Gantt from Linear". Claude keeps Linear as the
   source for owners, statuses and due dates and marks everything else `estimated`.
2. Run `python3 scripts/make_gantt.py`. It needs Chrome to print the PDF; without Chrome it
   writes an HTML file you can print to PDF from any browser.
3. Open a PR with the CSV and the PDF together.

`make_gantt.py` checks the plan before it prints: it stops with an error if a dependency names a
task that is not in the chart, if a task ends before it starts, or if a task starts before a task it
depends on ends. A task already `In Progress` is exempt from the start rule and prints a warning.

## Scheduling rule (set 2026-10-07)

Each task that waits on another starts when the task blocking it ends, so linked tasks read as a staircase.
No two tasks share an identical start and end date, and tasks that are related by a dependency never sit inside
each other's range. John's own tasks carry the new dates in Linear (due dates) and in the chart. Isabella's tasks
show **proposed** dates in the chart only, until she agrees and Linear is updated. David's dates are unchanged.
The MVP target is **2026-12-04**, with 2026-12-11 as the hard limit before winter break.
