# S.C.O.U.T. Conventions

The reference for "where does this go?" and "what do I call it?"

**Companion files:** [CLAUDE.md](../CLAUDE.md) is how we operate across tools.
[README.md](../README.md) is what the project is. This file is how we name and place things.

---

## The 60-second version

| I have… | It goes… | Named like… |
|---|---|---|
| A task, bug, or decision to make | Linear | `firmware: implement DS18B20 read function` |
| A written document | `docs/<section>/` + mirrored to Notion | `sensor-selection.md` |
| Firmware or analysis code | `firmware/` or `analytics/` | `acoustic_indices.py` |
| A schematic or PCB file | `hardware/` | `power-board-v1.kicad_sch` |
| A CAD model or drawing | `mechanical/` | `hull-cross-section.step` |
| A diagram or photo | `assets/diagrams/` or `assets/photos/` | `sensor-string-architecture.png` |
| A big decision with tradeoffs | `docs/decisions/` as an ADR | `0002-battery-chemistry.md` |
| Meeting notes | Granola → decisions extracted to Linear/Notion | — |
| Raw hydrophone audio | **Nowhere in git.** Local disk only | — |

When in doubt: **ask Claude, don't guess.** A misplaced file is harder to find than a missing one.

---

## Naming

### The one rule that matters most

**Lowercase, hyphens, no spaces.** Everywhere — files, folders, branches.

```
✅ sensor-string-architecture.md
✅ hull-cross-section-v2.step
❌ Sensor String Architecture.md
❌ Hull Cross Section V2.STEP
❌ "Senior Design "        ← this actually happened; the trailing space broke tooling
```

Spaces break shell commands, get URL-encoded into `%20` in links, and behave differently on
Mac vs. Windows vs. Linux. Trailing spaces are invisible and cost real debugging time.

### The project's name

Write the name **S.C.O.U.T.** — with the periods — in all prose: documentation, the website,
READMEs, ADRs, commit and PR descriptions, and comments. It expands, once, to **Santa Clara
Oceanic Utilities Transmitter**. Never introduce a third spelling (`Scout`, a bare `SCOUT` in a
sentence, or `S.C.O.U.T` without the trailing period).

The compact form **`SCOUT`** is reserved for **identifiers**, where periods are invalid or
awkward:

| `SCOUT` (compact) is correct in | Example |
|---|---|
| Buoy IDs — part of the packet contract | `SCOUT-01` |
| Code symbols — C macros, packages, variables | `SCOUT_PACKET_H`, `scout_shore` |
| File and branch names | `scout-mark.png`, `docs/stylize-scout-name` |
| The Linear workspace slug | `scout1` |

Rule of thumb: **if a human reads it as a word, it's `S.C.O.U.T.`; if a machine parses it as a
token, it's `SCOUT`.** This is the same consistency the August 2026 audit was chasing when it
found three different expansions of the acronym in circulation.

### Files

| Kind | Pattern | Example |
|---|---|---|
| Documents | `kebab-case.md` | `stakeholder-interviews.md` |
| Dated documents | `kebab-case-YYYY-MM.md` | `project-update-2026-07.md` |
| ADRs | `NNNN-kebab-case.md` | `0001-mcu-and-radio-selection.md` |
| Python | `snake_case.py` | `acoustic_indices.py` |
| Firmware (C/C++) | `snake_case.c` / `.h` | `sensor_read.c` |
| CAD / schematics | `part-name-vN.ext` | `enclosure-endcap-v3.step` |
| Diagrams | `descriptive-name.png` | `power-block-diagram.png` |
| Photos | `subject-YYYY-MM-DD.jpg` | `submersion-test-2026-11-30.jpg` |

Python uses `snake_case` because that's the language convention and linters expect it.
Everything else uses `kebab-case`. Don't mix them inside one directory.

### Versions

Use `-v2`, `-v3` in the filename **only for physical artifacts** — CAD, schematics, board
revisions — where an old version stays meaningful because a physical thing was built from it.

**Never version documents or code this way.** Git already does that.

```
✅ enclosure-endcap-v3.step        physical part, v2 exists in the lab
❌ engineering-design-doc-v2.md    use git history
❌ run_pipeline_final_FINAL.py     please no
```

### Folders

Lowercase, hyphens, singular unless the folder inherently holds a set:

```
docs/decisions/        plural — holds many decisions
assets/diagrams/       plural — holds many diagrams
firmware/              singular — one firmware
```

---

## Where things live

```
S.C.O.U.T./
├── README.md              What SCOUT is. Start here.
├── CLAUDE.md              How we operate across tools.
├── LICENSE                MIT.
├── docs/
│   ├── CONVENTIONS.md     This file.
│   ├── overview/          Project vision, MVP definition, status updates
│   ├── engineering/       Design document, sensor selection, architecture
│   ├── research/          Stakeholder interviews, decision matrix
│   ├── analysis/          Bioacoustic methodology and citations
│   ├── planning/          Timeline, meeting notes, administrative
│   └── decisions/         Architecture Decision Records (ADRs)
├── analytics/             Coral bioacoustic pipeline (Python) — working
├── firmware/              Buoy embedded software — not started
├── hardware/              Schematics, PCB, wiring — not started
├── mechanical/            CAD, hull, mooring — not started
├── assets/
│   ├── diagrams/          Architecture and block diagrams
│   ├── photos/            Build and field photos
│   └── presentations/     Slide decks
└── data/                  Raw audio archive — excluded from git
```

Each discipline folder has its own README describing scope and what it's blocked on. Read that
before adding your first file there.

### Which section does my document go in?

| If it… | Section |
|---|---|
| Explains what S.C.O.U.T. is or reports status | `overview/` |
| Specifies how something is built | `engineering/` |
| Captures input from outside the team | `research/` |
| Describes data methodology or results | `analysis/` |
| Is a schedule, meeting record, or form | `planning/` |
| Records a decision with alternatives considered | `decisions/` |

---

## File formats

### Use these

| For | Format | Why |
|---|---|---|
| Documents | Markdown `.md` | Diffable, reviewable, imports to Notion |
| Tabular data | CSV | Universal, diffable, no vendor lock |
| Diagrams | PNG | Lossless, crisp lines and text |
| Photos | JPG | Smaller for photographic content |
| CAD | Native source **+ exported STEP** | STEP opens in any CAD package |
| Schematics | Native source **+ exported PDF** | PDF is readable without the EDA tool |
| Firmware | `.c` / `.h` / `.ino` | — |

Always commit **both** the native source and a neutral export for CAD and schematics. The
source is editable; the export is what a teammate (or a future team) can actually open without
buying software.

### Never commit these

| Never | Why | Instead |
|---|---|---|
| `.docx`, `.xlsx` | Binary, undiffable, drifts from repo | Write in Markdown |
| `.wav` outside the sample session | The archive is ~7 GB | Local disk; see [README](../README.md#data) |
| Secrets, API keys, tokens | Public repo, permanent history | Environment variables |
| `.DS_Store`, `Thumbs.db` | OS noise | Already in `.gitignore` |
| Build artifacts, `__pycache__` | Regenerable | Already in `.gitignore` |
| Files over ~50 MB | GitHub warns at 50, blocks at 100 | Ask first — there's usually a better way |

We converted ten Word and Excel files to Markdown in August 2026 precisely because nobody could
see what changed between versions. Don't reintroduce that.

**Exception:** `assets/presentations/SCOUT-Proposal.pptx` is kept because slide decks convert
badly. New decks may live there too — but their *content* (the argument, the numbers) belongs in
a Markdown doc as well, or it becomes unreachable.

---

## Writing documents

### Structure

Every document in `docs/` opens the same way:

```markdown
# One H1, matching the filename

> **Summary** — One or two sentences on what this is and why it exists.
>
> **Source document** — `original-file.docx`   ← only if converted from something

---

## First real section
```

One H1 per file — Notion uses it as the page title. Headings nest properly (`##` before `###`;
never skip a level).

### Markdown rules

| Do | Don't |
|---|---|
| GFM pipe tables | HTML `<table>` — Notion's importer chokes on it |
| Relative links: `[EDD](engineering/engineering-design-document.md)` | Absolute paths or bare URLs to our own files |
| Fenced code blocks with a language tag | Indented code blocks |
| `**bold**` for emphasis | ALL CAPS |

Keep lines under ~100 characters. It makes diffs readable — a one-word change shows as one
changed line instead of one changed paragraph.

### Notion mirroring

Every `docs/` file has a Notion counterpart, and **the repo is the source of truth.** If you
edit in Notion, say so in your next Claude session and it will back-port the change. If the two
disagree and nobody says otherwise, the repo wins.

Do not create a Notion page with no repo counterpart — except scratch agendas and shared lists,
which go under Planning and should say on the page that they're Notion-only.

---

## Git, for people who don't live in git

You do not need to be fluent. You need four commands and one habit.

```bash
git pull                      # get everyone's latest work — do this first, always
git add .                     # stage your changes
git commit -m "message"       # save them with a description
git push                      # send them up
```

**The habit:** `git pull` before you start, `git push` when you stop. Most conflicts come from
skipping the first one.

> ### 🚦 Everything reaches `main` through a Pull Request — always
>
> Even a one-line doc fix. **Do not commit on `main` and `git push`** — direct pushes to
> `main` are blocked (a hook reads them as a force push), so you'll just get rejected and
> stuck. Branch first, push the branch, open a PR. The flow that always works:
>
> ```bash
> git switch -c docs/my-change          # 1. branch — see Branches for naming
> git add . && git commit -m "docs: …"  # 2. commit — see Commit messages
> git push -u origin HEAD               # 3. push the branch (not main)
> #                                       4. open a PR — see Pull requests — then merge
> ```

If you'd rather not use the terminal at all, [GitHub Desktop](https://desktop.github.com/) does
all four with buttons, and you can drag files straight into it. That is a completely legitimate
way to work on this project — nobody is going to judge your workflow.

### Commit messages

```
<type>(<scope>): <what changed and why>
```

Types: `feat` `fix` `docs` `refactor` `test` `chore`
Scope: the discipline folder — `firmware` `hardware` `mechanical` `analytics` `docs`

```
✅ docs(mechanical): add mooring hardware specs from vendor quote
✅ fix(analytics): correct NDSI band exclusion for fish chorus range
❌ update
❌ stuff
❌ asdf
```

Explain **why** when it isn't obvious. The diff already shows what changed; it can't show what
you were thinking.

### Branches

```
<discipline>/<short-description>
```

```
firmware/ds18b20-read
mechanical/endcap-oring-redesign
docs/reconcile-deployment-depth
```

**Always branch.** Every change — even a one-line doc fix — reaches `main` through a PR, never
by pushing to `main` directly (it's blocked; see [Two repo gotchas](#two-repo-gotchas)).

### Pull requests

**All work merges through a PR — there is no direct-to-`main` path.** Branch → commit → push
the branch → open a PR → **review** → merge. Every PR needs both of the following:

**A title** in the commit-message format — `<type>(<scope>): <summary>`, using the same types
and scopes as [Commit messages](#commit-messages). Example: `docs: resolve ADR-0001`.

**A description** with these four sections, in this order. Explain the *why* — the diff
already shows the *what*.

- **DATE** — the date the PR was opened (`YYYY-MM-DD`).
- **What Changed and Why** — a summary of the decisions made and the changes that follow from
  them.
- **Open questions** — anything still undecided that a reviewer should weigh in on. Write
  `None` if there are none.
- **Open tasks** — follow-up work this PR does *not* cover (a new ADR to resolve, a
  measurement to take, a downstream doc to update). Write `None` if there are none.
- **Knowledge Hub** — which [Hub](hub/README.md) surfaces this PR updated (decision log, facts,
  status/journal, sources, open questions), or `Hub: no relevant surface` if genuinely none
  apply. **This section is mandatory and required on every PR** — see
  [CLAUDE.md → Standing rule 7](../CLAUDE.md#standing-rules). A PR that changed a fact or a
  decision without a matching Hub update should be sent back.

Copy this template:

```markdown
## DATE
YYYY-MM-DD

## What Changed and Why
- …

## Open questions
- …

## Open tasks
- …

## Knowledge Hub
- Updated: decision-log.md · facts.md · status.md + journal · research/sources.md
  (list only what this PR touched, or write "Hub: no relevant surface")
```

**Fill in every section — a heading with no content under it is not enough.** Put the *why*
inside **What Changed and Why**, not in a paragraph above the sections. The `pr-body` check
rejects a section left as a bare `-` or the template's comment hint; write `None` for an empty
**Open questions** / **Open tasks**, and `Hub: no relevant surface` for **Knowledge Hub** when
none apply.

**Open for review; merge only after approval — never auto-merge.** A PR is opened to be
reviewed, not merged on creation. Leave it open until a teammate has looked at it, then merge
manually: the **Merge pull request** button, or `gh pr merge <n> --merge --delete-branch`.

When an agent (Claude) opens a PR, it **stops there** — it does not merge on its own. It merges
only when a human explicitly asks it to (a follow-up "merge it"), or a human merges the PR
directly.

### Two repo gotchas

**Direct pushes to `main` are blocked.** A local hook reads `git push origin main` as a force
push and rejects it. This is intentional — `main` only moves via a merged PR. Push your branch
(`git push -u origin HEAD`) and open a PR instead; never try to push to `main` directly.

**`gh` (the GitHub CLI) is not installed.** Use `git` over SSH, which is configured and working.
If a guide online tells you to run `gh something`, that won't work here.

---

## Linear

Full conventions live in [CLAUDE.md](../CLAUDE.md#linear-conventions). The short version:

**Title:** `<area>: <imperative outcome>` — `hardware: measure sleep current against <5 mA target`

**Every issue gets:**
- One type label — `Feature` `Bug` `Improvement`
- One discipline label — `ece` `csen` `geng` `cross-discipline`
- A phase project (Phase 0–6)
- A due date, so it shows on the roadmap

**`On Deck`** marks what's queued next without moving it out of Backlog.

**Body template:**

```markdown
**Context** — why this exists, one or two sentences.

**Acceptance criteria**
- [ ] Concrete, checkable outcome

**Blocked by** — issue ID, or "nothing"
**Source** — meeting date, doc section, or ADR
```

Create an issue for anything over ~30 minutes, anything blocking someone else, or anything
you'd forget by next week. Don't create issues for trivial fixes you do inline.

---

## Engineering data

Consistency here prevents the kind of contradiction that cost us an audit.

| Quantity | Unit | Write it as |
|---|---|---|
| Temperature | °C | `26.4 °C` |
| Depth, length | m | `5–8 m` |
| Current | mA / µA | `4.6 mA`, `300 µA` |
| Voltage | V | `3.3 V` |
| Frequency | Hz / kHz / MHz | `915 MHz`, `22.05 kHz` |
| Power | mW / W | `120 mW` |
| Energy | mWh / Wh | `2400 mWh` |
| Data size | bytes / KB / MB | `82 bytes` |
| Mass | g / kg | `5.8 g` |

**Space between number and unit.** `5 m`, not `5m`. Exception: `°` and `%` attach directly —
`26.4°`, `40%`.

**Dates are ISO 8601:** `2026-08-14`. Never `08/14/26` — that reads as August 14 in the US and
14 August elsewhere, and we deploy in Hawaii with a dataset from Japan.

**Ranges use an en-dash:** `5–8 m`, `2026-08-14 – 2027-05-28`.

**Don't invent precision.** If the datasheet says ±0.5 °C, don't report 26.437 °C. Round to
what you actually measured.

**Always state the assumption.** "~40 mA (datasheet typical, unverified)" is useful.
"40 mA" alone is a number someone will build a power budget on.

---

## Citing sources

Anything asserting a scientific or technical fact needs a source.

```markdown
> Lin, T.H., Akamatsu, T., Sinniger, F., & Harii, S. (2021). "Exploring coral reef
> biodiversity via underwater soundscapes." *Biological Conservation*, 253:108901.
> [https://doi.org/10.1016/j.biocon.2020.108901](https://doi.org/10.1016/j.biocon.2020.108901)
```

DOI links preferred — they don't rot. For components, link the manufacturer's page, not a
reseller listing (those disappear). Strip tracking parameters like `?utm_source=` from URLs.

For stakeholder input, cite the person and date: *(Dr. Hannah Barkley, NOAA, Summer 2026)*.

---

## Decisions and disagreements

### When you decide something significant

Write an ADR in `docs/decisions/`. "Significant" means expensive to reverse, contested between
people or documents, or constraining more than one subsystem. Battery chemistry: ADR. Which
brand of zip tie: not an ADR.

Copy the format from [0001](decisions/0001-mcu-and-radio-selection.md): context, options with
honest pros *and* cons, the decision, consequences, references. Number sequentially. **Never
delete an ADR** — supersede it, so the reasoning survives.

### When two documents disagree

**Surface it. Do not quietly pick one.**

Tell Claude and it will file an issue and flag every affected document. Silent reconciliation is
how we ended up with five contradictions running for months — including a BOM that disagreed
with our own timeline about which microcontroller we were buying.

Open contradictions are tracked in [README.md](../README.md#known-inconsistencies).

---

## Meetings

Granola records. It does **not** store decisions — we do, elsewhere.

**Before:** whoever calls the meeting drops an agenda in Notion under Planning and links the
relevant Linear issues.

**During:** let Granola record. Don't take parallel notes.

**Within 24 hours:** paste the Granola summary to Claude. It extracts decisions into ADRs or
Linear comments, action items into assigned Linear issues, and appends a dated entry to
[meeting-notes.md](planning/meeting-notes.md).

**Claude cannot read Granola** — there's no connector. If you don't paste it, it doesn't exist
to the rest of the stack.

---

## FAQ

**I'm not a programmer. Can I still contribute?**
Yes. Most of this project is documents, CAD, and schematics. Use GitHub Desktop, or tell Claude
what you changed and let it handle the git side.

**Where do I put a file if none of the folders obviously fit?**
Ask Claude. If it genuinely doesn't fit, that's usually a sign the folder structure needs a new
home — worth a two-minute conversation rather than a guess.

**Can I edit documents in Notion instead of the repo?**
Yes — that's what Notion is for. Just mention it in your next Claude session so the repo gets
the change too. The repo is the copy that survives.

**I accidentally committed something big / secret. What now?**
Stop pushing and say so immediately. Both are fixable, but only before they spread. Rotating a
leaked key takes minutes; the same key sitting in public history for a week is a different
problem.

**Do I need to write an ADR for every decision?**
No. Only for ones that are hard to reverse or that other people's work depends on. Routine
choices go in the Linear issue where you made them.

**My Claude and my teammate's Claude gave different answers.**
That means something isn't written down. Tell one of them — the fix is a convention added here,
not a habit of asking twice.

**Something in this file is wrong or missing.**
Change it. It's a repo file like any other. If the convention itself is wrong, that's worth a
team conversation first — but if it's just unclear or incomplete, improve it.

---

## Why this file exists

In August 2026 we audited the project and found ten documents with names that didn't match their
contents, a folder whose trailing space broke shell tooling, a 799-line script claiming to
convert a file it never opened, three different expansions of the S.C.O.U.T. acronym, and five
factual contradictions across documents — including two different microcontrollers and two
different hydrophones in a BOM we were about to order from.

None of that came from anyone being careless. It came from three people working in parallel with
no shared answer to "where does this go and what do I call it?"

This file is that answer.
