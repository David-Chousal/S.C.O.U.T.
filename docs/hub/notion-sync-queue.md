# Notion Sync Queue

> **Summary** — Repo changes that still need mirroring into Notion. Staged here for sessions
> whose Notion connector can't reach the S.C.O.U.T. workspace; a session with direct access
> (confirmed working 2026-08-17) should just push the change directly and log it in **Done**
> below, rather than adding a queue entry that then needs a second session to clear it. Each
> entry names the target page, what changed, and — where the content needs reshaping for
> Notion — the paste-ready text.
>
> Part of the [Knowledge Hub](README.md). **As of 2026-08-29.**
>
> This is a **queue, not a record.** Once an entry is pasted into Notion, tick it and delete its
> payload. The `docs/` file is always the source of truth ([CONVENTIONS → Notion
> mirroring](../CONVENTIONS.md#notion-mirroring)); anything duplicated here is a snapshot that
> goes stale the moment the source changes. If an entry has been sitting long enough that the
> source moved on, re-derive it from the source rather than pasting what is below.

---

## How to clear this queue

1. Open the Notion page named in the entry.
2. Paste the payload (or copy the named sections straight from the `docs/` file).
3. **Fix the links.** This is the part that does not survive a copy-paste: repo files use
   relative Markdown links, and per [CLAUDE.md → Notion conventions](../../CLAUDE.md) links
   between Notion pages must be **Notion URLs**, so a reader in Notion stays in Notion. Every
   payload below marks these `[text](→ Notion: Page Name)`.
4. Tick the entry's checkbox and delete its payload.

**Tables:** everything in this queue reaches Notion by paste or import, so leave the Markdown
pipe tables exactly as they are — Notion's importer converts them to real table blocks. The
full rule, including why a push through the Notion **API** needs the opposite treatment, is in
[CLAUDE.md → Notion conventions](../../CLAUDE.md#notion-conventions).

---

## Pending

> **Entries 1–4 cleared 2026-08-17**, including the Decision Log gap entry 3 left open (all
> 17 missing rows, 2026-08-15 through 2026-08-17, now mirrored). Payloads are retained below
> only as a record of what was mirrored; delete them on the next pass.
> **Entries 5 and 6 are not mirrored.** Both carry paste-ready payloads and both add sibling
> sections to the same Notion page (Engineering → *Live Dashboard*), so clear them in one visit:
> a paste each, not a derivation.

### 5 · Live Dashboard — multi-page site restructure · ⏳ not yet in Notion

- **Notion page** — Engineering → *Live Dashboard*
- **Source** — [`docs/engineering/live-dashboard.md`](../engineering/live-dashboard.md)
- **What changed** — while clearing entry 4 (below), found the Notion page describes an old
  **single self-contained static page**, but the source now documents a **six-page site**
  (Home/Technology/Science/Analytics/Fleet/About). Landed "The site" table and the sensor-health
  section (entry 4's actual ask) directly, but the **`### The Fleet page` section (lines 67+ in
  the source) is still unmirrored** — the network-overview page, tile grid, per-buoy drill-down.
  Worth a dedicated pass since it's a whole page the Notion doc doesn't know exists yet.
- **Payload written 2026-08-18** by a session whose Notion connector authenticates to a
  different workspace (the S.C.O.U.T. root page 404s for it). The paste-ready text is below, so
  clearing this needs a Notion paste, not another derivation pass.

**Where it goes:** as a new `### The Fleet page` section on the Notion page, immediately after
the *"Design iteration — where the polarity note ended up"* subsection and before
*"Why static, not a live server"*. It is a sibling of *"Sensor health is shown next to the data
it affects"*, not a child of it.

> **Paste from the source file.** The section is already correct Markdown in
> [`live-dashboard.md`](../engineering/live-dashboard.md) under `### The Fleet page` — copy it
> from there rather than from a duplicate that can drift. Only the two links below need editing
> on paste; there are no Notion-to-Notion links in this section.

| Link in the source | Replace with |
|---|---|
| the `fleet_web.py` link (relative repo path) | point it at `https://github.com/David-Chousal/S.C.O.U.T./blob/main/analytics/telemetry/fleet_web.py` — repo file, no Notion counterpart |
| the `fleet.py` link (relative repo path) | point it at `https://github.com/David-Chousal/S.C.O.U.T./blob/main/analytics/telemetry/fleet.py` — same |

**Also check while you are on the page:** the *"The site"* table landed on 2026-08-17 with all
six rows, so the Fleet row should already be there. If it is missing, the table needs the row
`Fleet · fleet/ · Network overview — a tile per buoy, drilling into each buoy's dashboard`
before this section will make sense to a reader.

### 6 · Live Dashboard — three sections become sticky splits · ⏳ not yet in Notion

- **Notion page** — Engineering → *Live Dashboard*
- **Source** — [`docs/engineering/live-dashboard.md`](../engineering/live-dashboard.md)
- **What changed** — three list sections moved from card grids to a shared sticky split
  (heading holds still on the left, entries scroll past on the right): Home's *What it
  measures*, Technology's *The subsystems*, and Science's *Listening to the reef*. The source
  gained a new `### The sticky split: long lists scroll past a heading that holds still`
  section recording why, the shared rules, the two per-section judgement calls, and the
  `ch`-unit trap that cost a round trip.
- **Queued 2026-08-24** by a session whose Notion connector authenticates to the Ekho workspace,
  not S.C.O.U.T. (re-tested with `notion-fetch id="self"`; the S.C.O.U.T. root still 404s).

**Where it goes:** as a new `### The sticky split: long lists scroll past a heading that holds
still` section on the Notion page, immediately after the *"Design iteration — where the polarity
note ended up"* subsection and **before** the Fleet-page section that entry 5 adds. It is a
sibling of *"Sensor health is shown next to the data it affects"*, not a child of it.

> **Paste from the source file** rather than from a duplicate that can drift. The section
> contains no links, so nothing needs rewriting on paste — this one is a clean copy. It does
> contain a bullet list, which pastes into Notion as real list blocks with no help needed.

**Clear entries 5 and 6 in the same pass.** Both add sibling sections to the same Notion page,
in the order sticky split → Fleet, so doing them together is one visit instead of two.

- **Also queued** — a new row in Hub → *Design Iteration Notes*, if that page exists in Notion.
  Copy the `2026-08-24 | analytics | Public site — three list sections become sticky splits`
  row from [`design-notes.md`](design-notes.md). Per entry 3's note, the Notion Hub has only three
  sub-pages (*Canonical Facts*, *Decision Log*, *Project Status*), so this row likely has
  **nowhere to go** — skip it rather than inventing a page, and leave the structural gap
  recorded in entry 3 as the thing to actually decide.

### 4 · Live Dashboard — sensor health on the Analytics page · ✅ mirrored 2026-08-17

- **Notion page** — Engineering → *Live Dashboard*
- **Source** — [`docs/engineering/live-dashboard.md`](../engineering/live-dashboard.md)
- **From** — [SCO-51](https://linear.app/scout1/issue/SCO-51)
- **What changed** — one new subsection, *"Sensor health is shown next to the data it affects"*,
  after the authored-vs-data-driven paragraph. Explains why the biofouling verdict renders both
  as a status card **and** as a rationale note under the turbidity chart, and that the turbidity
  legend now states the polarity. **Extended 2026-08-16**: also carries why `insufficient data`
  is deliberately unstyled, and a *"Design iteration"* sub-subsection on the panel-head wrapping
  that only a browser pass caught.
- **Link to rewrite on paste** — `[Data Schema → Turbidity polarity](data-schema.md)` →
  `(→ Notion: On-Board CSV Data Schema)`. The `drift.py` link is a repo path with no Notion
  counterpart; leave it as plain text or point it at GitHub.

### 1 · Telemetry Methodology — two new sections · ✅ mirrored 2026-08-16

- **Notion page** — Analysis → *Environmental Telemetry Methodology*
- **Source** — [`docs/analysis/telemetry-methodology.md`](../analysis/telemetry-methodology.md)
- **From** — [PR #45](https://github.com/David-Chousal/S.C.O.U.T./pull/45) (merged 2026-08-15)
- **What changed** — two new subsections under §1 Quality control (§1a QARTOD tests, §1b drift
  screen), two new references, and two new bullets under Limitations. **Revised again by
  [PR #54](https://github.com/David-Chousal/S.C.O.U.T./pull/54)**: §1b now uses the 90th
  percentile (was 10th), §4 gained a *Polarity* subsection, and one Limitations bullet changed.
  Copy §1a, §1b, §4 and Limitations wholesale rather than diffing.

**Where it goes:** immediately after the existing §1 Quality control paragraph, before
§2 Daily aggregation.

> **Paste from the source file.** §1a and §1b run ~60 lines and are already correct Markdown in
> [`telemetry-methodology.md`](../analysis/telemetry-methodology.md) — copy them from there
> rather than from a duplicate that can drift. The only edits needed on paste are the three
> links below.

| Link in the source | Replace with |
|---|---|
| `[stakeholder interviews](../research/stakeholder-interviews.md)` (§1b) | `[stakeholder interviews](→ Notion: Stakeholder Interviews)` |
| `[Data Schema → Turbidity polarity](../engineering/data-schema.md)` (§1b and §4) | `[Data Schema → Turbidity polarity](→ Notion: On-Board CSV Data Schema)` |
| `[ADR-0002](../decisions/0002-lifepo4-charging-path.md)` (§1b) | `[ADR-0002](→ Notion: ADR-0002 LiFePO₄ Charging Path)` |
| `SCO-20`, `SCO-19`, `SCO-12` etc. in prose | Leave as plain text, or link to the Linear issue — these are not Notion pages |

> **Revised 2026-08-15** after [PR #54](https://github.com/David-Chousal/S.C.O.U.T./pull/54). The
> earlier version of this table listed two `[Open questions]` links; the polarity fix replaced
> both, and §4 gained a polarity subsection. This is the staleness the header warns about —
> re-derive from the source if this entry sits much longer.

Also append to the page's **References** section:

- Manov, D. V., Chang, G. C. & Dickey, T. D. (2004). Methods for reducing biofouling of moored
  optical sensors. *Journal of Atmospheric and Oceanic Technology* 21(6), 958–968.
  https://doi.org/10.1175/1520-0426(2004)021%3C0958:MFRBOM%3E2.0.CO;2
- U.S. Integrated Ocean Observing System (2017). *Manual for Real-Time Quality Control of
  In-Situ Optical Observations.* https://doi.org/10.25923/v9p8-ft24

### 2 · Data Schema — `record_seq` is now an idempotency key · ✅ mirrored 2026-08-16

- **Notion page** — Engineering → *On-Board CSV Data Schema*
- **Source** — [`docs/engineering/data-schema.md`](../engineering/data-schema.md)
- **From** — [PR #49](https://github.com/David-Chousal/S.C.O.U.T./pull/49) (merged 2026-08-15)
- **What changed** — one table row. In the field table, the `record_seq` description gains:

  > With `buoy_id` it is the **idempotency key** the shore station deduplicates on — the buoy
  > sends each daily packet several times without acknowledgement, and the copies must collapse
  > to one row.

  Edit that single cell in the Notion table block; do not re-import the whole table.

  **Also from [PR #54](https://github.com/David-Chousal/S.C.O.U.T./pull/54):** the
  `turbidity_adc` row changed (example `512` → `3300`, plus a "higher count is clearer
  water" note), and a whole new **Turbidity polarity** subsection was added after the
  optional-columns list — including a two-row table and a callout stating the
  non-inverting requirement on the analog front end. That callout matters to ECE, so it
  should land in Notion where Isabella will see it.

### 3 · Knowledge Hub pages — routine updates · ✅ partially mirrored 2026-08-16

- **Notion page** — Decisions → *Hub* (whichever pages mirror the Hub files)
- **From** — PRs [#45](https://github.com/David-Chousal/S.C.O.U.T./pull/45) and
  [#49](https://github.com/David-Chousal/S.C.O.U.T./pull/49)
- **What changed** — ordinary append-style updates; copy each file's changed rows across:

| Repo file | Change |
|---|---|
| [`decision-log.md`](decision-log.md) | 3 new settled rows (QARTOD + drift screen; CR 4/8 + blind repetition; firmware target build gated in CI) and 1 new pending row (SEN0189 polarity) |
| [`research/open-questions.md`](research/open-questions.md) | Biofouling data-integrity row moved to **Answered**; daily-packet delivery row moved to **implemented**; new **SEN0189 polarity** row added as Open |
| [`status.md`](status.md) | Telemetry, firmware, and shore-station rows updated |
| [`journal/2026-08-15.md`](journal/2026-08-15.md) · [`journal/2026-08-15-firmware-link.md`](journal/2026-08-15-firmware-link.md) | Two new dated snapshots — add both as sub-pages under the journal |
| [`linear-backlog.md`](linear-backlog.md) | New **section D** (staged, not-yet-filed items) and delivery records on B3/B9 |

If the Hub is mirrored as a single Notion page rather than one page per file, paste these as
sections under matching headings and keep the file names visible so the mapping stays obvious.

> **What was actually mirrored, 2026-08-16.** The Notion Hub has exactly three sub-pages —
> *Canonical Facts*, *Decision Log*, *Project Status*. **Project Status** was refreshed in full.
> **`journal/`, `research/open-questions.md`, and `linear-backlog.md` have no Notion counterpart
> at all**, so those rows in the table above have nowhere to go. That is a structural gap, not a
> backlog item: either those pages get created in Notion, or the Hub mirror is openly scoped to
> the three surfaces that exist. Worth deciding rather than re-queueing every PR.
>
> **Second structural gap, found 2026-08-24.** Same pattern, different files:
> [`docs/engineering/buoy-structural/mass-and-buoyancy-budget.md`](../engineering/buoy-structural/mass-and-buoyancy-budget.md)
> and [`docs/engineering/buoy-structural/force-budget.md`](../engineering/buoy-structural/force-budget.md)
> have **no Notion page of their own** — confirmed via `notion-search`, no false negative. Their
> content reaches Notion only secondhand, as links out to GitHub from *Canonical Facts* (Mass &
> buoyancy budget row) and *Design Notes* (the 2026-08-24 weigh-in row). That's workable while the
> docs are short, but both are explicitly living/running documents that will keep growing as real
> FEA loads and measured weights land — at some point a reader in Notion will want the full worked
> math, not just a link out. Same choice as the `journal/` gap: either give them Notion pages now,
> or make the link-out-only scope a deliberate, written decision instead of an accumulating
> default. Not fixed here — flagging so it doesn't silently repeat on the next mechanical PR.

---

### 7 · ADR-0006 — Rev A battery chemistry · ⏳ not yet in Notion

- **Notion page** — Decisions → *ADR index* (and a new ADR-0006 page if each ADR is mirrored individually)
- **Source** — [`docs/decisions/0006-rev-a-battery-chemistry.md`](../decisions/0006-rev-a-battery-chemistry.md)
- **What changed** — new ADR recording the Rev A prototype's LiPo + external bq25185 power path.
  Also touches **ADR-0002** (a References entry pointing here), the **ADR index**, and
  **`facts.md`**, whose battery row split into a *deployment* row (LiFePO₄, unchanged) and a
  *Rev A prototype* row (LiPo).
- **The point that must survive the mirror** — ADR-0006 is **prototype scope only**. It does not
  close ADR-0002 or SCO-10, and LiFePO₄ remains the canonical deployment chemistry. A reader who
  takes away "the battery is LiPo now" has read it wrong, so keep the scoping caveats intact
  rather than trimming them for brevity.
- **Links to rewrite on paste** — the `0002-lifepo4-charging-path.md`, `0001-...`, and `facts.md`
  links become Notion URLs; `hardware/**` paths have no Notion counterpart, so leave them as
  text or point at GitHub.

### 9 · Whole-buoy mass / freeboard model + FEA loads · ⏳ not yet in Notion

- **Notion pages** — Hub → *Canonical Facts* (Mechanical & deployment table + Open facts),
  Hub → *Decision Log* (Pending decisions), Hub → *Project Status* (Mechanical design row),
  Hub → *Design Notes* (new top row). Engineering has **no page** for the new doc or for
  `force-budget.md` (see the structural-gap note under entry 3).
- **Source** — [`buoy-mass-displacement-and-freeboard-model.md`](../engineering/buoy-structural/buoy-mass-displacement-and-freeboard-model.md)
  (new), [`force-budget.md`](../engineering/buoy-structural/force-budget.md) (LC2–LC9 now computed).
- **What changed** —
  - *Canonical Facts*: the "Mass & buoyancy budget" row was renamed to "…printed shell
    (measured)" and a **new row** added — "Whole-buoy mass, freeboard & FEA loads": ~8.40 kg
    nominal, ~309 N reserve, nominal draft ~2.69 in / ~7.31 in freeboard, buoy **substantially
    over-floated**; LC2 +322 N, LC5 ~440 N, LC8 50.3 kPa, LC9 ~810 N. New **Open fact** row for
    the environmental design set (proposed, not signed off).
  - *Decision Log*: new **Log** row `2026-08-29 | geng | Mooring attachment hardware type:
    through-bolted 316 stainless pad-eye` (chosen over U-bolt / cable loop / bonded eye /
    cross-pin), **and** a new *Pending decisions* row `2026-08-29 | geng | Environmental design
    set for the structural FEA`.
  - *Canonical Facts → Open facts*: "Mooring/sensor-string attachment hardware" row updated —
    type chosen (pad-eye), part/sizing still open.
  - *Project Status → Mechanical design*: appended the 2026-08-29 paragraph; "As of" → 2026-08-29.
  - *Design Notes*: two new top rows — `2026-08-29 | mechanical | Mooring attachment — pad-eye
    chosen (trade study)` and `2026-08-29 | mechanical | Whole-buoy mass / freeboard model +
    FEA design loads`.
- **The point that must survive the mirror** — the FEA loads LC3–LC9 are computed at a
  **proposed** environmental design set that the team has **not** signed off (that sign-off is
  SCO-73). A reader who takes "the FEA loads are settled" has read it wrong.
- Paste the *Design Notes* and *Canonical Facts* rows straight from the source files. Links to
  the two `buoy-structural/` docs become GitHub blob URLs (neither has a Notion page).

### 8 · Project Status — Electrical design row is stale · ⏳ not fixed here

- **Notion page** — Hub → *Project Status*
- **Found while** doing the electronics-housing packing-budget sync below (2026-08-25) — the
  page's **Electrical design** row still reads "Build platform decided; wiring/PCB pending,"
  while [`status.md`](../../docs/hub/status.md)'s row has grown substantially since (Rev A
  ERC-clean, PID 6106 5V rail confirmed, `PIN_TURBIDITY` fix, SCO-83/SCO-84 gaps, bring-up parts
  order). Same gap shape as the earlier structural-gap notes above — flagged so it doesn't read
  as current when a teammate checks Notion, not silently left to drift further.
- **Scoped out of today's sync** — only the Mechanical design row's packing-analysis sentence and
  the page's "As of" date were touched this pass. A full Electrical design row resync is a
  separate, deliberate pass, not a byproduct of an unrelated PR.

---

## Done

Move entries here with the date they were pasted, so the queue shows what has actually been
mirrored rather than silently emptying.

| Entry | Mirrored on | By |
|---|---|---|
| **Canonical Facts** — Enclosure dimensions row updated in place with the first-pass packing-analysis range (~⌀100×110–130mm, still not finalized — PID 6106 dims and antenna routing open). **Project Status** — Mechanical design row's Detail cell gained the packing-analysis sentence; "As of" date bumped to 2026-08-25 | 2026-08-25 | Claude session, direct connector write |
| **Canonical Facts** — Flotation row rewritten in place (325.83 g/wedge shell, slicer-measured 2026-08-24, replacing the stale ~300 g 2026-08-18 estimate; unresolved 474.58 g vs 325.83 g discrepancy noted per Standing Rule 1). New **Mass & buoyancy budget** row added to the settled Mechanical & deployment table (previously missing entirely) — ~5.49 kg / ~38.9 L / ~337.6 N net reserve buoyancy, positioned after Flotation and before Print structure, matching the repo table order. **Project Status** — mechanical design row's `~300 g/wedge weight logged` sentence replaced with the five-part real-weigh-in summary and a link to the budget doc; "As of" date bumped to 2026-08-24. **Design Notes** — new top-of-log row, `2026-08-24 \| mechanical \| Floatation weigh-in — all five parts now measured`, inserted above the existing 2026-08-21 print-structure row (the page had no 2026-08-24 row yet despite the queue's entry 6 assuming one might). **Root S.C.O.U.T. page** — checked; its mechanical status line is already generic (no wedge weight or buoyancy figure cited), so left unchanged. `mass-and-buoyancy-budget.md` and `force-budget.md` links written as GitHub blob URLs (including the anchored `#2-calibration-...` link) — confirmed via `notion-search` that neither doc has a Notion page; see the new structural-gap note above | 2026-08-24 | Claude session, direct connector write |
| **Team Meeting Notes** — new `2026-08-24 — SCOUT Weekly` section appended (Decisions, Reported, Raised, Flagged — unresolved, Next steps), mirroring [`docs/planning/meeting-notes.md`](../planning/meeting-notes.md#2026-08-24--scout-weekly) | 2026-08-25 | Claude session, direct connector write |
| **Decision Log** — two new rows for the biofouling decision (approach chosen, then Sea Hawk Smart Solution picked as the specific product, reef-safety over Home Depot convenience). **Canonical Facts** — new Biofouling mitigation row in the settled Mechanical & deployment table | 2026-08-18 | Claude session, direct connector write |
| **Decision Log** — new corrected row for the bolted-wedge floatation + bottom-cap decision, inserted above the incomplete SCOUT Weekly row it corrects. **Canonical Facts** — Flotation row rewritten in place (bottom caps, SF≥4 caveat); two new Open facts rows (print material, mooring attachment hardware). **Project Status** — Mechanical design row updated (O-ring/mooring now shown Done, floatation family chosen, SCO-68/69 added to Blocked-on), "As of" date bumped to 2026-08-17 to match the source. **Root S.C.O.U.T. page** — Mechanical design status line rewritten to match the current `README.md` line (was still listing O-ring/mooring as open; both are Done) | 2026-08-18 | Claude session, direct connector write |
| Root **S.C.O.U.T.** page — status table (telemetry, dashboard, firmware, shore, mechanical), platform reframing to a nearshore monitoring platform, packet size 82 → 30 bytes in the architecture diagram, three new Known-inconsistency rows | 2026-08-15 | Claude session, direct connector write |
| **1 · Telemetry Methodology** — §1a QARTOD tests and §1b biofouling drift screen added in full; §4 rewritten with the Turbidity polarity paragraph (it still said "flagging **positive** excursions", i.e. the pre-PR-#54 inverted science); two Limitations bullets and two references (Manov 2004, IOOS QARTOD 2017) added. All links rewritten to Notion URLs | 2026-08-16 | Claude session |
| **2 · Data Schema** — `record_seq` row gained the idempotency-key note; `turbidity_adc` row updated; new **Turbidity polarity** section with the clear/turbid table and a red callout stating the non-inverting requirement for ECE | 2026-08-16 | Claude session |
| **3 · Decision Log — the gap entry 3 left open.** All 17 rows missing since 2026-08-14 (2026-08-15 through 2026-08-17: chatbot launch, SEN0189 polarity fix, Linear 12-state workflow, CAD reconciliation against PRs #58–60, ADR-0003 flag-and-resolution, QARTOD/CR-4/8/CI decisions) inserted at the top of the Log table | 2026-08-17 | Claude session, direct connector write |
| **4 · Live Dashboard — sensor health section**, plus "The site" multi-page table (the page was still describing an old single-page dashboard). See new queue entry 5 for the Fleet-page section this did *not* cover | 2026-08-17 | Claude session, direct connector write |
| **3 · Knowledge Hub (partial)** — **Project Status** page fully refreshed (telemetry, dashboard, firmware, shore, mechanical rows; SCO-47 added as a fourth blocker; mechanical chokepoint called out). See the note in entry 3 for what has no Notion target | 2026-08-16 | Claude session |
