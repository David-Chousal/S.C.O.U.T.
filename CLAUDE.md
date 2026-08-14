# CLAUDE.md — S.C.O.U.T. Project Operating Manual

**This file is read automatically at the start of every Claude session pointed at this repo.**
It is the shared contract for how the SCOUT team works across GitHub, Linear, Notion, and
Granola. Follow it without being asked.

If you are a team member reading this directly: you do not need to memorize it. Your Claude
already has it. What you need to know is in [Working with your Claude](#working-with-your-claude).

---

## The project

**S.C.O.U.T.** (Santa Clara Oceanic Utilities Transmitter) — a low-cost, solar-powered marine
buoy for long-term coral reef and nearshore water quality monitoring. Santa Clara University
Senior Design Capstone, 2026–2027.

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
| **Granola** | Raw meeting capture — recordings, transcripts, live notes | ❌ **no connector** |

**Links**

- GitHub — https://github.com/David-Chousal/S.C.O.U.T.
- Linear — https://linear.app/scout1 (workspace `S.C.O.U.T.`, one team: `S.C.O.U.T.`)
- Notion — root page **S.C.O.U.T.** 🛰️ https://app.notion.com/p/3bc74433b5738130a4bff44f8396ec78
- Granola — https://notes.granola.ai

### Granola has no Claude connector

There is no Granola MCP server. Claude **cannot** read Granola notes, and must never claim
to have read them. Granola content reaches the rest of the stack only when a human pastes it
in or Granola's own Notion export pushes it. If a meeting outcome matters, it must be
restated in Notion or Linear — otherwise it does not exist to the team or to Claude.

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

State plainly what you did and did not do. A skipped step reported is fine; a skipped step
hidden is not.

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
| Diagrams, presentations | `assets/` | Linked from Notion |
| Tasks, bugs, roadmap, milestones | **Linear** | — |
| Meeting recordings & transcripts | **Granola** | Decisions extracted → Linear/Notion |
| Raw hydrophone audio (~7 GB) | Local + original dataset source | **Never** committed |

**Source of truth for documentation is the repo**, not Notion. Notion is the reading surface
because two of three teammates are not in the code daily. When the two disagree, the repo
wins — unless the user says the Notion edit is newer, in which case back-port it to `docs/`
and say so.

---

## Linear conventions

Workspace `S.C.O.U.T.` · one team, `S.C.O.U.T.` · statuses: `Backlog` `Todo` `In Progress`
`Done` `Canceled` `Duplicate`.

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

Existing: `Feature` `Bug` `Improvement`. Always add **exactly one discipline label** so each
lead can filter to their own work — create these if they do not exist yet: `ece` `csen`
`geng` `cross-discipline`.

### Priority

`Urgent` only for something blocking another person right now. `High` for the current phase.
`Medium`/`Low` for later phases. Most issues are Medium — resist inflating.

### Projects

Map Linear projects to the phases in [docs/planning/team-timeline.md](docs/planning/team-timeline.md)
— Phase 0 through Phase 6. Every issue belongs to a phase project. Create these if absent.

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
- **Tables must be Notion table blocks**, not Markdown pipe tables. Notion's API does not
  parse pipe syntax; converting is Claude's job, not the user's.
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

### Repo gotchas

- **`git push origin main` is blocked** by a local pre-bash hook that reads it as a force
  push. Use plain `git push` (upstream is already tracked).
- **`gh` CLI is not installed.** Use `git` over SSH; SSH auth to GitHub is configured and
  working. Do not suggest `gh` commands.
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
3. **The MCU/radio choice is open** and blocks firmware, PCB layout, and the power budget.
   See [ADR-0001](docs/decisions/0001-mcu-and-radio-selection.md). Do not write firmware
   against a specific toolchain until it is resolved.
4. **Cite sources in docs.** Anything asserting a scientific fact gets a DOI or link.
5. **Report failures plainly.** If tests fail, show the output. If a step was skipped, say so.

---

## Working with your Claude

For teammates who are not living in this repo daily. You do not need to write code to use any
of this.

**Point Claude at the repo** (open this folder in Claude Code, or clone it first). It reads
this file automatically and knows the whole project.

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

**What it cannot do:** read Granola. Paste those notes in.
