# Notion Sync Queue

> **Summary** — Repo changes that still need mirroring into Notion. Staged here for sessions
> whose Notion connector can't reach the S.C.O.U.T. workspace; a session with direct access
> (confirmed working 2026-08-17) should just push the change directly and log it in **Done**
> below, rather than adding a queue entry that then needs a second session to clear it. Each
> entry names the target page, what changed, and — where the content needs reshaping for
> Notion — the paste-ready text.
>
> Part of the [Knowledge Hub](README.md). **As of 2026-08-17.**
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
> **Entry 5 is new and not yet mirrored.**

### 5 · Live Dashboard — multi-page site restructure · ⏳ not yet in Notion

- **Notion page** — Engineering → *Live Dashboard*
- **Source** — [`docs/engineering/live-dashboard.md`](../engineering/live-dashboard.md)
- **What changed** — while clearing entry 4 (below), found the Notion page describes an old
  **single self-contained static page**, but the source now documents a **six-page site**
  (Home/Technology/Science/Analytics/Fleet/About). Landed "The site" table and the sensor-health
  section (entry 4's actual ask) directly, but the **`### The Fleet page` section (lines 67+ in
  the source) is still unmirrored** — the network-overview page, tile grid, per-buoy drill-down.
  Worth a dedicated pass since it's a whole page the Notion doc doesn't know exists yet.

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

---

## Done

Move entries here with the date they were pasted, so the queue shows what has actually been
mirrored rather than silently emptying.

| Entry | Mirrored on | By |
|---|---|---|
| Root **S.C.O.U.T.** page — status table (telemetry, dashboard, firmware, shore, mechanical), platform reframing to a nearshore monitoring platform, packet size 82 → 30 bytes in the architecture diagram, three new Known-inconsistency rows | 2026-08-15 | Claude session, direct connector write |
| **1 · Telemetry Methodology** — §1a QARTOD tests and §1b biofouling drift screen added in full; §4 rewritten with the Turbidity polarity paragraph (it still said "flagging **positive** excursions", i.e. the pre-PR-#54 inverted science); two Limitations bullets and two references (Manov 2004, IOOS QARTOD 2017) added. All links rewritten to Notion URLs | 2026-08-16 | Claude session |
| **2 · Data Schema** — `record_seq` row gained the idempotency-key note; `turbidity_adc` row updated; new **Turbidity polarity** section with the clear/turbid table and a red callout stating the non-inverting requirement for ECE | 2026-08-16 | Claude session |
| **3 · Decision Log — the gap entry 3 left open.** All 17 rows missing since 2026-08-14 (2026-08-15 through 2026-08-17: chatbot launch, SEN0189 polarity fix, Linear 12-state workflow, CAD reconciliation against PRs #58–60, ADR-0003 flag-and-resolution, QARTOD/CR-4/8/CI decisions) inserted at the top of the Log table | 2026-08-17 | Claude session, direct connector write |
| **4 · Live Dashboard — sensor health section**, plus "The site" multi-page table (the page was still describing an old single-page dashboard). See new queue entry 5 for the Fleet-page section this did *not* cover | 2026-08-17 | Claude session, direct connector write |
| **3 · Knowledge Hub (partial)** — **Project Status** page fully refreshed (telemetry, dashboard, firmware, shore, mechanical rows; SCO-47 added as a fourth blocker; mechanical chokepoint called out). See the note in entry 3 for what has no Notion target | 2026-08-16 | Claude session |
