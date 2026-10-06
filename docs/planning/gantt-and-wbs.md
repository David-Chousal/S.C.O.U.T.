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
| `depends_on` | Linear IDs this task waits for, space-separated; drawn as arrows on the detail pages |
| `constraint` | The outside constraint: vendors, printer access, reviewers, SCU deadlines |
| `milestone` | The milestone the task completes, if any |
| `date_source` | `Linear` (from the issue), `estimated` (proposed, owner to confirm), or `derived` |

## Updating it

1. Edit the CSV, or ask Claude to "resync the Gantt from Linear". Claude keeps Linear as the
   source for owners, statuses and due dates and marks everything else `estimated`.
2. Run `python3 scripts/make_gantt.py`. It needs Chrome to print the PDF; without Chrome it
   writes an HTML file you can print to PDF from any browser.
3. Open a PR with the CSV and the PDF together.

A task's dates should respect its dependencies: a task should not start before the tasks in
`depends_on` end, unless the row's constraint says why (work that started early).
