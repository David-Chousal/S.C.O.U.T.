# CLAUDE.md — S.C.O.U.T. Project Operating Manual

**This file is read automatically at the start of every Claude session pointed at this repo.**
It is the shared contract for how the S.C.O.U.T. team works across GitHub, Linear, Notion, and
Granola. Follow it without being asked.

If you are a team member reading this directly: you do not need to memorize it. Your Claude
already has it. What you need to know is in [Working with your Claude](#working-with-your-claude).

> ### 📌 Read [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) before answering any question about
> naming, file placement, formats, git, units, or "where does this go?"
>
> **CONVENTIONS.md is the authoritative reference** for repo structure, naming rules, file
> formats, document structure, commit and branch names, engineering units, citation format, and
> the teammate FAQ. This file (CLAUDE.md) covers *how the team operates across tools*;
> CONVENTIONS.md covers *how things are named and placed*.
>
> When a teammate asks anything resembling:
> *"where do I put this?"* · *"what should I call it?"* · *"what format?"* ·
> *"how do I commit this?"* · *"can I edit in Notion?"* · *"do I need an ADR?"* ·
> *"what units?"* · *"how do I cite this?"*
>
> …answer **from CONVENTIONS.md**, cite the relevant section, and link it. Do not improvise a
> convention. If the answer genuinely isn't covered there, say so, give your best
> recommendation, and offer to add it to CONVENTIONS.md so the next person gets the same answer.

---

## 🚫 Absolute blocker — never commit or push anything that violates CONVENTIONS.md

**This overrides speed, convenience, and "the user didn't ask me to check this."** It applies
to every commit, on every branch, in every session — not just ones someone asked you to review.

Before any `git add` / `git commit` / `git push`, and before opening or updating a PR:

1. **Run the real check, don't eyeball it:**
   ```bash
   python3 .github/scripts/check_conventions.py --base origin/main
   ```
   This is the same script CI runs in `pr-checks.yml`. It catches bad filenames, forbidden
   file types, missing/duplicate H1s, HTML tables, and orphaned source-registry entries. If it
   exits non-zero, the FATAL lines tell you exactly what's wrong and where.
2. **If something violates convention, fix it — then say so.** Rename the file, move it,
   reformat the table, strip the offending content, correct the commit message. Never fix
   silently: state plainly what you changed and why, e.g. *"Renamed `Sensor Test.md` →
   `sensor-test.md` before committing — CONVENTIONS.md requires kebab-case."*
3. **If you can't safely fix it** — placement depends on a call only a teammate can make, the
   naming is genuinely ambiguous, the content itself needs human judgment — **do not commit or
   push it.** Stop, explain precisely what's wrong, and ask. Do not push it "to clean up later."
4. **Sync with `main` before you open the PR** — not after GitHub marks it conflicted:
   ```bash
   git fetch origin && git merge origin/main
   ```
   Branches drift while you work; one other PR merging is enough. Merging first surfaces the
   conflict while you still hold the context that makes it easy to resolve, instead of a day
   later in review. Re-run the conventions check afterwards.

   **Resolve conflicts by hand, and default to keeping both sides** in the append-only Hub
   files. Two rows in [`decision-log.md`](docs/hub/decision-log.md) are usually two *different*
   decisions — dropping one loses it permanently and silently, which is the exact drift the Hub
   exists to prevent. Deliberately not automated: a `merge=union` driver would resolve this
   file, but it would also silently duplicate two differently-worded rows about the same
   decision, and on [`open-questions.md`](docs/hub/research/open-questions.md) it would leave a
   row in **both** the Open and Answered tables when one is moved between them.

This is a second line of defense, not a duplicate of CI — the goal is to never hand a teammate
a red PR check in the first place. If `check_conventions.py` and your own read disagree, the
script wins; it is the authoritative, versioned check. Also verify PR title format
(`<type>(<scope>): <summary>`), the five-section PR body, and
[Standing rule 7](#standing-rules) (Knowledge Hub touch) before opening a PR — `pr-checks.yml`
gates on all three independently of the conventions script.

**Branch + PR, no exceptions, confirmed 2026-08-14.** Before your first `git add` in a
session, check `git branch --show-current`. If it says `main`, stop and create a branch first
— do not commit. This applies to every change regardless of size: a one-line typo fix goes
through a branch and a PR exactly like a multi-file feature. `git push` must never target
`main` directly, full stop; if a command you're about to run would do that, it is wrong,
not the exception. Open the PR yourself (title + the five-section body above) and leave it
for review — merging still requires an explicit human ask, per Standing Rule 6. Open it with
`gh pr create --base main --head <branch> --title '<type>(<scope>): <summary>' --body-file <file>`
(pass the body as a file — the five required `##` sections do not survive shell quoting well).
If `gh` is ever unavailable, fall back to the compare URL in a browser
(`https://github.com/David-Chousal/S.C.O.U.T./compare/main...<branch>?quick_pull=1`) rather
than skipping the step.

---

## The project

**S.C.O.U.T.** (Santa Clara Oceanic Utilities Transmitter) — a low-cost, solar-powered,
modular **nearshore environmental monitoring platform**: one buoy carrying many sensing
signals (temperature, turbidity, dissolved oxygen, and more), with coral-reef health as its
first application. Santa Clara University Senior Design Capstone, 2026–2027.

| Member | Discipline | Owns |
|---|---|---|
| Isabella Rodriguez | ECEN | Hardware — electrical design, PCB, power system |
| John Ryan Myrdal | GENG | Field & mechanical — buoy structure, deployment |
| David Chousal Cantu | CSEN | Software — firmware, data pipeline, shore station |

**Faculty advisors:** Jes Kuczenski · Navid Shaghaghi

Start with [README.md](README.md) for architecture and status. Full doc index at
[docs/README.md](docs/README.md).

---

## The stack

Four tools. Each has exactly one job. Do not duplicate an artifact across two of them.

| Tool | Job | Claude access |
|---|---|---|
| **GitHub** | Code, CAD, schematics, and the versioned source of truth for all documentation | ✅ via `git` + SSH |
| **Linear** | Every unit of work: tasks, bugs, decisions to make, roadmap | ✅ via MCP |
| **Notion** | Human-readable mirror of docs; where non-code teammates read and comment | ✅ via MCP |
| **Granola** | Raw meeting capture — recordings, transcripts, live notes | ✅ via MCP |

**Links**

- GitHub — https://github.com/David-Chousal/S.C.O.U.T.
- Linear — https://linear.app/scout1 (workspace `S.C.O.U.T.`, one team: `S.C.O.U.T.`)
- Notion — root page **S.C.O.U.T.** 🛰️ https://app.notion.com/p/3bc74433b5738130a4bff44f8396ec78
- Granola — https://notes.granola.ai

---

## Session start protocol

**Run this at the beginning of every session, before doing task work.** Do not skip it
because the user asked for something specific — do it first, briefly, then proceed.

1. **Check repo state** — `git status` and `git log --oneline -5`. Report uncommitted work or
   unpushed commits.
2. **Check Linear** — list issues in `In Progress` and `Todo`. Report what is open and what
   is stale (no update in >7 days).
3. **Ask the alignment question.** Verbatim intent, phrased naturally:

   > Before we start — has anything changed outside this repo since last time? Specifically:
   > any meetings in Granola, edits in Notion, or decisions made over text/in person that
   > aren't captured yet? I'll get them into Linear and the repo.

4. **Reconcile whatever they name** before starting new work. Untracked decisions are the
   single biggest failure mode on this project — the August 2026 audit found five separate
   contradictions across documents that had gone unnoticed for months.

If the user answers "nothing changed," proceed immediately. Do not belabor it.

## Session end protocol

Before ending a work session, verify and report:

- [ ] Code changes committed **and pushed**
- [ ] Docs changed in `docs/` mirrored to the corresponding Notion page
- [ ] Linear issues moved to their true status; new work captured as issues
- [ ] Any decision made this session written down as an ADR or a Linear comment — never left
      only in the chat transcript
- [ ] [Knowledge Hub](docs/hub/README.md) updated wherever relevant — decision log, facts,
      status/journal, sources (see [Standing rule 7](#standing-rules)). Every PR opened this
      session already carried its Hub updates

State plainly what you did and did not do. A skipped step reported is fine; a skipped step
hidden is not.

## Every message ends with a stack-sync nudge

Not just at session end — **every response** you send during a session, closes with a
one-line reminder to keep the stack in sync. Keep it to one line. Do not turn it into a
checklist or re-explain the four tools every time.

**If your response already did the syncing** (filed the Linear issue, updated the Notion
page, committed the doc), say what you updated instead of prompting for it:

> _Updated: SCO-14 created, `docs/hub/facts.md` revised. Notion mirror still pending — say
> the word and I'll push it._

**If it didn't**, use a light version of:

> _Anything here that should land in Linear, Notion, or Granola? Keep the stack synced._

Skip the line only for purely conversational exchanges that touched no file, tool, or fact —
answering "what does NDSI stand for?" doesn't need one. Everything else gets the nudge.

---

## Where things live

Route every artifact to exactly one home. When in doubt, this table wins.

| Artifact | Home | Mirror |
|---|---|---|
| Firmware, analysis code, scripts | `firmware/`, `analytics/` | — |
| Schematics, PCB, wiring diagrams | `hardware/` | — |
| CAD, hull drawings, mooring specs | `mechanical/` | — |
| Engineering & research documents | `docs/**.md` | Notion page |
| Architecture decisions | `docs/decisions/` | Notion → Decisions |
| Decisions (ledger), facts, status, sources | `docs/hub/` — the [Knowledge Hub](docs/hub/README.md) | Notion → Hub |
| Diagrams, presentations | `assets/` | Linked from Notion |
| Tasks, bugs, roadmap, milestones | **Linear** | — |
| Meeting recordings & transcripts | **Granola** | Decisions extracted → Linear/Notion |
| Raw hydrophone audio (~7 GB) | Local + original dataset source | **Never** committed |

**Source of truth for documentation is the repo**, not Notion. Notion is the reading surface
because two of three teammates are not in the code daily. When the two disagree, the repo
wins — unless the user says the Notion edit is newer, in which case back-port it to `docs/`
and say so.

→ **Naming rules, which `docs/` section to use, accepted file formats, and what must never be
committed are all in [CONVENTIONS.md](docs/CONVENTIONS.md).** Consult it before placing or
naming any new file.

---

## Linear conventions

Workspace `S.C.O.U.T.` · one team, `S.C.O.U.T.`, issue key **`SCO`** (issues read `SCO-12`) ·
statuses: `Backlog` `Todo` `In Progress` `Done` `Canceled` `Duplicate`.

### When to create an issue

Create one for anything that takes more than ~30 minutes, blocks another person, or would be
forgotten by next week. Do **not** create issues for trivial fixes done inline in the same
session — just do them and mention it.

### Title format

`<area>: <imperative outcome>`

Area is one of `firmware` `hardware` `mechanical` `analytics` `docs` `research` `deploy`.

```
firmware: implement DS18B20 read function
hardware: measure sleep current against <5 mA target
mechanical: pressure-test enclosure at 5 m water equivalent
docs: reconcile deployment depth (5–8 m vs ~30 m)
```

Not `Temperature sensor` (not an outcome). Not `Fix the thing` (not specific).

### Body template

```markdown
**Context** — why this exists, one or two sentences.

**Acceptance criteria**
- [ ] Concrete, checkable outcome
- [ ] Another one

**Blocked by** — issue ID, or "nothing"
**Source** — where this came from (meeting date, doc section, ADR)
```

### Labels

Type label (pick one): `Feature` `Bug` `Improvement`.

Discipline label (**always exactly one**, so each lead can filter to their own work):

| Label | Scope | Owner |
|---|---|---|
| `ece` | PCB, power system, sensors, radio | Isabella Rodriguez |
| `csen` | Firmware, analytics pipeline, shore station | David Chousal Cantu |
| `geng` | Hull, enclosure, mooring, deployment | John Ryan Myrdal |
| `cross-discipline` | Spans two or more, or is a team-level decision | Needs coordination |

Workflow label: **`On Deck`** — queued and ready to pick up next, nothing blocking it. Use it
to mark the short list of what comes next without moving issues out of `Backlog`. Remove it
when the issue moves to `In Progress`.

### Priority

`Urgent` only for something blocking another person right now. `High` for the current phase.
`Medium`/`Low` for later phases. Most issues are Medium — resist inflating.

### Projects

Seven phase projects mirror [docs/planning/team-timeline.md](docs/planning/team-timeline.md).
**Every issue belongs to exactly one.** Each project description carries that phase's
per-discipline work and exit criteria.

**Re-baselined 2026-08-14.** The project now runs **Aug 14, 2026 → May 28, 2027**.

| Project | Window | State |
|---|---|---|
| Phase 0 — Kickoff | Aug 14 – Sep 4, 2026 | In Progress |
| Phase 1 — Subsystem Bring-Up | Sep 7 – Oct 16, 2026 | Planned |
| Phase 2 — System Integration | Oct 19 – Nov 25, 2026 | Planned |
| Phase 3 — Enclosure & Waterproofing | Nov 30, 2026 – Jan 15, 2027 | Planned |
| Phase 4 — Field Prototype Deployment | Jan 18 – Feb 26, 2027 | Planned |
| Phase 5 — Hawaii Deployment Prep | Mar 1 – Mar 19, 2027 | Planned |
| Phase 6 — Hawaii Live Deployment | Mar 22 – May 28, 2027 | Planned |

These dates are mirrored in [docs/planning/team-timeline.md](docs/planning/team-timeline.md).
If one changes, change both in the same session.

Phase 0 is the only phase currently active — it holds the open design-alignment decisions
(SCO-5 through SCO-9) that were never closed during the original summer plan. Nothing
downstream should start until those land, particularly
[ADR-0001](docs/decisions/0001-mcu-and-radio-selection.md).

### Status discipline

Move to `In Progress` when work actually starts, not when it is planned. Anything in
`In Progress` for over a week without a comment gets flagged at session start.

---

## Notion conventions

Root page **S.C.O.U.T.** 🛰️ with six sections: Overview · Engineering · Research · Analysis ·
Planning · Decisions.

- **Every page mirrors a file in `docs/`.** Do not create a Notion page with no repo
  counterpart. If a doc genuinely belongs only in Notion (a scratch agenda, a shared list),
  put it under Planning and say so on the page.
- **One H1 per page** — Notion uses it as the page title.
- **Summary callout at the top** of every mirrored page, naming the source file.
- **Tables depend on how the content gets there** — the two paths are not the same, and
  treating them as one breaks a table either way:
  - **Pushing through the Notion API** (Claude writing a page directly): convert to **Notion
    table blocks**. The API does not parse pipe syntax, so a pasted pipe table lands as a
    literal block of `|` characters. Converting is Claude's job, not the user's.
  - **Importing or pasting a Markdown file** (a human moving a `docs/` file across): leave the
    **Markdown pipe tables alone** — Notion's importer converts them to real table blocks. Do
    not hand-convert them to HTML `<table>`, which the importer chokes on
    ([CONVENTIONS → Markdown rules](docs/CONVENTIONS.md)).
- **Cross-links between Notion pages use Notion URLs**, not GitHub links — teammates reading
  in Notion should stay in Notion.
- Nothing in Notion is authoritative on its own. If a Notion edit changes a fact, that change
  lands in `docs/` before the session ends.

---

## Granola conventions

Granola captures meetings. It does not store decisions — the team does, elsewhere.

**Before a meeting:** the person calling it drops an agenda in Notion under Planning and links
the relevant Linear issues.

**During:** let Granola record. Do not take parallel notes.

**Within 24 hours — the part that actually matters:**

1. Read the Granola summary.
2. Paste it (or its key points) to Claude.
3. Claude extracts and files:
   - **Decisions** → an ADR in `docs/decisions/` if architectural; otherwise a comment on the
     relevant Linear issue
   - **Action items** → Linear issues, assigned, with the meeting date in **Source**
   - **Open questions** → Linear issues labeled and marked `Backlog`
4. Append a dated entry to [docs/planning/meeting-notes.md](docs/planning/meeting-notes.md)
   with decisions and attendees — not a transcript.

A decision that lives only in a Granola transcript is not a decision. Nobody will find it.

---

## GitHub conventions

### Commits

Conventional commits: `feat|fix|docs|refactor|test|chore(scope): summary`. Scope is the
discipline directory (`firmware`, `analytics`, `docs`, `hardware`, `mechanical`).

Commit messages explain **why**, not what — the diff shows what.

### Branches

Work on a branch named for the Linear issue where practical (`firmware/ds18b20-read`). Never
commit directly to `main` for anything non-trivial.

→ Branch naming, the four-command git workflow for non-daily coders, and the GitHub Desktop
alternative are in [CONVENTIONS.md § Git](docs/CONVENTIONS.md#git-for-people-who-dont-live-in-git).

### Repo gotchas

- **`git push origin main` is blocked** by a local pre-bash hook that reads it as a force
  push. Use plain `git push` (upstream is already tracked).
- **`gh` CLI is installed and authenticated** (since 2026-08-14, token in the macOS keyring
  with `repo` scope). Use it for PRs, CI status, and issues. Git operations still go over SSH.
  Do **not** set `GITHUB_TOKEN` in the environment — `gh` prefers it over the keyring, so a
  stale or placeholder value silently breaks every `gh` command.
- **`gh` runs as `davidchousal`, which is *not* the repo owner.** The repo belongs to
  `David-Chousal`; `davidchousal` is a separate account with **push, not admin**
  (`gh api repos/David-Chousal/S.C.O.U.T. --jq .permissions` confirms it). Everyday work is
  unaffected — branches, PRs, CI status, issues all work. **Admin-only operations do not**:
  editing branch-protection rulesets, repo settings, or collaborators returns a bare
  `404 Not Found` rather than a permission error, because GitHub hides resources you cannot
  administer. A 404 on a write to something you can read is this, not a missing resource.
  Those changes go through the GitHub web UI signed in as `David-Chousal` — and GitHub will
  additionally demand a password (sudo mode) to save them, which **Claude must never type**;
  hand that step to a human.
- **Never commit `.wav` files** outside `analytics/data/longitudinal/201708_20170801/`. The
  full archive is ~7 GB. `.gitignore` enforces this — do not weaken it.
- Regenerate nothing under `analytics/data/processed/` without saying so; those figures are
  committed deliberately.

### Before committing

Confirm the code actually runs — not just that it imports or typechecks. For the analytics
pipeline that means executing it end to end:

```bash
cd analytics && python run_pipeline.py --audio_dir data/longitudinal/201708_20170801 --output /tmp/check.csv
```

Note `--audio_dir` uses an underscore while other scripts use hyphens. This inconsistency is
known and documented; do not "fix" it without an issue.

---

## Standing rules

1. **Never silently reconcile a contradiction.** Multiple documents disagree on hardware,
   depth, LoRa range, and hydrophone part number. When you find a conflict, surface it and
   record it — do not pick one and move on. See
   [Known inconsistencies](README.md#known-inconsistencies).
2. **Raw audio never goes over LoRa.** This is settled design, not an open question
   ([EDD §10](docs/engineering/engineering-design-document.md)). Bandwidth makes it
   infeasible; the buoy stores audio locally and transmits an 82-byte daily packet.
3. **The MCU/radio choice is settled** ([ADR-0001](docs/decisions/0001-mcu-and-radio-selection.md),
   accepted 2026-08-14): **Feather M0 + RFM95** is the confirmed build platform (Arduino
   SAMD21 core, RadioHead `RH_RF95`); ESP32-C3 + SX1262 is the documented future production
   PCB. Write firmware against the SAMD21 core. The EDD still describes the ESP32-C3 target —
   treat its power budget (§15–17) as production-target analysis, not the Feather build.
4. **Cite sources in docs.** Anything asserting a scientific fact gets a DOI or link.
5. **Report failures plainly.** If tests fail, show the output. If a step was skipped, say so.
6. **Everything reaches `main` through a reviewed PR.** Branch → commit → push the branch →
   open a PR with a conventional title (`<type>(<scope>): <summary>`) and the five-section
   description (DATE · What Changed and Why · Open questions · Open tasks · Knowledge Hub),
   then **stop and
   leave it open for review**. Merge only after a human review or when a human explicitly asks
   you to merge — never on your own initiative, and never auto-merge. Never push to `main`
   directly — it is blocked. See [CONVENTIONS.md → Pull requests](docs/CONVENTIONS.md#pull-requests).
7. **Every PR updates the Knowledge Hub — no exception, wherever relevant.** The
   [Knowledge Hub](docs/hub/README.md) is the always-current surface for what S.C.O.U.T. has decided,
   learned, and where it stands. **Before opening any PR**, check each Hub surface and update the
   ones this PR touches — this is not optional and not a follow-up task:
   - Decided anything? → row in [`decision-log.md`](docs/hub/decision-log.md) (+ an ADR if significant).
   - Changed a canonical value (depth, cost, platform, packet size, part…)? → update
     [`facts.md`](docs/hub/facts.md) **first**, then the docs that cite it.
   - Moved a subsystem's state? → update [`status.md`](docs/hub/status.md) and append a
     [`journal/`](docs/hub/journal/) snapshot.
   - Used or found an external source? → add it to
     [`research/sources.md`](docs/hub/research/sources.md) (PDF to the right library).
   - Answered or raised a research question? → update
     [`research/open-questions.md`](docs/hub/research/open-questions.md).
   - Captured a design-iteration narrative (concepts tried, why, what was learned)? → add a
     row to [`design-notes.md`](docs/hub/design-notes.md), linking to the full write-up.

   The PR's **Open tasks** section must state which Hub surfaces were updated, or explicitly
   "Hub: no relevant surface" if genuinely none apply. The default assumption is that at least
   one applies — a PR that touches nothing in the Hub is the exception, not the rule. A reviewer
   should reject a PR that changed a fact or a decision without updating the Hub.

---

## Working with your Claude

For teammates who are not living in this repo daily. You do not need to write code to use any
of this.

**Point Claude at the repo** (open this folder in Claude Code, or clone it first). It reads
this file automatically and knows the whole project.

**If you'd rather read than ask:** [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) answers where
files go, what to name them, which formats to use, how to commit, what units to write, and has
an FAQ aimed at exactly the questions you're likely to have. You don't have to — Claude will
answer from it — but it's there.

**Then just talk to it.** Useful things to say:

- *"We met this morning, here are the Granola notes: [paste]"* → it files decisions, creates
  Linear issues, updates the meeting log
- *"What's blocking me right now?"* → it checks Linear and tells you
- *"I decided to go with PVC over HDPE because of cost"* → it records the decision where it
  belongs
- *"Update the sensor doc — we're switching to the H2dM"* → it edits the repo and Notion, and
  flags every other doc that mentions the old part
- *"What's out of date?"* → it audits the stack for drift

**What it will ask you at the start of every session:** whether anything changed outside the
repo — meetings, Notion edits, decisions made in person. Answer honestly. That question is the
mechanism that keeps four tools from drifting apart, and it only works if you use it.
