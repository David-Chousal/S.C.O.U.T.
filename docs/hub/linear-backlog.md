# Linear Backlog — Proposed Issues

> **Summary** — A staging doc for **Linear issues that still need to be created**, written so a
> future session *with access to the `scout1` Linear workspace* can walk this list top to bottom
> and file each one with the right title, labels, owner, priority, and project. It mirrors the
> [Open Research Questions](research/open-questions.md), the open rows in [`facts.md`](facts.md)
> and [`decision-log.md`](decision-log.md#pending-decisions-not-yet-made), the blockers in
> [`status.md`](status.md), and the follow-on work implied by the 17 merged PRs.
>
> Part of the [Knowledge Hub](README.md). **As of 2026-08-14.**
>
> ⚠️ **Why this exists:** the authoring session's Linear MCP points at the Ekho corporate
> workspace, **not** SCOUT's `scout1`, so it could not create these directly. Nothing here is in
> Linear yet. When a row is filed, replace its **Linear** cell with the `SCO-##` link and, once
> all are filed, this doc can be retired (or kept as the creation record).

---

## How to file these (SCOUT Linear conventions)

From [CLAUDE.md → Linear conventions](../../CLAUDE.md) and [CONVENTIONS.md](../CONVENTIONS.md):

- **Workspace/team:** `S.C.O.U.T.` · one team · issue key **`SCO`**.
- **Title format:** `<area>: <imperative outcome>` — area ∈ `firmware hardware mechanical analytics docs research deploy`. Not a noun ("Temperature sensor"), not vague ("Fix the thing").
- **Discipline label (exactly one):**

  | Owner | Label | Scope |
  |---|---|---|
  | Isabella Rodriguez | `ece` | PCB, power, sensors, radio |
  | **David Chousal Cantu (me)** | `csen` | firmware, analytics, shore station |
  | John Ryan Myrdal | `geng` | hull, enclosure, mooring, deployment |
  | spans ≥2 / team-level | `cross-discipline` | needs coordination |

- **Type label (one):** `Feature` · `Bug` · `Improvement`.
- **Priority:** `Urgent` only if blocking someone *right now*; `High` for the current phase; most are `Medium`.
- **Project:** every issue belongs to exactly one phase project (Phase 0–6). Phase 0 (Kickoff, Aug 14 – Sep 4) holds the open design-alignment decisions.
- **Body template:** `Context` (1–2 sentences) · `Acceptance criteria` (checkboxes) · `Blocked by` (issue ID or "nothing") · `Source` (meeting/doc/ADR/PR).
- **On filing:** also add a row to [`decision-log.md`](decision-log.md) when the issue *records a decision*, and mirror any resolved open fact back into [`facts.md`](facts.md).

> **Pre-existing IDs to reconcile first:** [CLAUDE.md](../../CLAUDE.md) references **SCO-5 … SCO-9**
> as Phase-0 design-alignment issues that were "never closed." Several are already resolved:
> ADR-0001 / ADR-0003 and PRs #1-#8, and **SCO-6 (deployment depth) by PR #29** (depth revised to
> 2-7 m). **Check the board before creating** any of A1-A4 below; they may already exist under those
> IDs and just need updating or closing rather than re-filing.

---

## A. Open decisions & blockers — Phase 0 (file these first)

These are the items `status.md` names as blocking the most, and the rows `decision-log.md`/`facts.md`
explicitly mark "Needs a Linear issue."

### A1 · `hardware: decide the LiFePO₄ charging path on the Feather M0`
- **Label** `ece` · **Owner** Isabella · **Type** `Feature` · **Priority** `High` · **Project** Phase 0
- **Context** — Battery chemistry (LiFePO₄) and charge controller (BQ25570 MPPT) are chosen, but the actual charging path is undecided. `status.md` lists this as **blocker #1**.
- **Acceptance** — [ ] Charging topology decided and written into [ADR-0002](decisions/0002-lifepo4-charging-path.md) (status → Accepted); [ ] `facts.md` charge-controller row updated; [ ] unblocks battery/solar sizing + firmware battery thresholds.
- **Blocked by** — nothing · **Source** — [ADR-0002](decisions/0002-lifepo4-charging-path.md), `status.md` blocker #1

### A2 · `hardware: resolve the hydrophone part number (H2a-XLR vs H2dM)`
- **Label** `ece` · **Owner** Isabella · **Type** `Bug` (spec conflict) · **Priority** `High` · **Project** Phase 0
- **Context** — Diagram cites Aquarian **H2a-XLR**, EDD BOM specifies **H2dM**. `status.md` **blocker #2** — blocks the audio front-end design and the BOM order.
- **Acceptance** — [ ] One part chosen; [ ] BOM + diagram + [`facts.md`](facts.md) hydrophone row reconciled to it; [ ] [ADR-0003 related gaps](decisions/0003-single-point-sensing.md) updated.
- **Blocked by** — nothing · **Source** — `facts.md` open facts, `status.md` blocker #2, [README known-inconsistencies](../../README.md#known-inconsistencies)

### A3 · `hardware: decide dissolved-oxygen inclusion (V1.5 vs future)`
- **Label** `ece` · **Owner** Isabella · **Type** `Feature` · **Priority** `High` · **Project** Phase 0
- **Context** — DO is wanted (interviews, meeting notes) and listed V1.5 in sensor-selection, but absent from the EDD/BOM. `status.md` **blocker #3** — blocks closing the V1 sensor list.
- **Acceptance** — [ ] Decision recorded (V1.5 vs future) with rationale; [ ] `facts.md` DO row + sensor-selection updated; [ ] V1 sensor list closed.
- **Blocked by** — nothing · **Source** — `facts.md` open facts, `status.md` blocker #3

### A4 · `csen: decide on-board turbidity units — raw ADC/volts vs calibrated NTU`
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 0 → Phase 1
- **Context** — The CSV schema needs to know whether the buoy ships raw SEN0189 ADC/volts or calibrated NTU. Decision depends on the calibration research in **B7**.
- **Acceptance** — [ ] Units decided and fixed in [Data Schema](../engineering/data-schema.md); [ ] `facts.md` turbidity-units row resolved.
- **Blocked by** — **B7** (calibration research) · **Source** — [Data Schema open questions](../engineering/data-schema.md), `facts.md` open facts

---

## B. Research questions — mirror of [`open-questions.md`](research/open-questions.md)

Each open row becomes a `research` (or discipline) issue. Sources already gathered in
[`sources.md`](research/sources.md); notes in [`research/notes/`](research/notes/).

### B1 · `research: measure real over-saltwater LoRa range at 915 MHz`
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 4
- **Context** — Datasheet ~2 km is line-of-sight in air; packet cadence + shore-station siting depend on the real number at a sub-meter buoy antenna.
- **Acceptance** — [ ] Field range/PDR vs distance measured over saltwater at 915 MHz; [ ] result written to `facts.md` LoRa-range row.
- **Blocked by** — hardware bring-up · **Source** — open-questions; literature-bounded by `jovalekic-2018` / `gutierrez-gomez-2021` / `parri-2019`

### B2 · `mechanical: choose a biofouling mitigation approach for a 1+ year deployment`
- **Label** `geng` · **Owner** John · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 3 → 4
- **Context** — Stakeholder-flagged top risk (Shantz); wipers / copper / reef-safe coatings unresolved. *Mechanical* half only — the data half is **B3**.
- **Acceptance** — [ ] Mitigation approach selected with rationale + ADR/decision-log row.
- **Blocked by** — nothing · **Source** — open-questions, [Stakeholder Interviews](../research/stakeholder-interviews.md)

### B3 · `csen: detect biofouling sensor drift in the telemetry QC`
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 2
- **Context** — Fouled optical/turbidity sensors drift *monotonically* → mimics a real turbidity trend in `turbidity.py`. Addressable now in software.
- **Acceptance** — [ ] QARTOD-style flat-line / rate-of-change flags in `qc.py`; [ ] cross-signal consistency check; [ ] documented in telemetry methodology.
- **Blocked by** — nothing · **Source** — `manov-2004`, `qartod-optics-2017` (see [notes](research/notes/)) · related **B8**

### B4 · `mechanical: choose a reef-safe anchoring / mooring approach`
- **Label** `geng` · **Owner** John · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 3 → 5
- **Context** — Deployment system is as important as the sensors (Oliver); must not damage the reef it monitors. No approach chosen.
- **Acceptance** — [ ] Mooring/anchor concept selected + reef-safety rationale; [ ] decision-log row.
- **Blocked by** — nothing · **Source** — open-questions, Stakeholder Interviews

### B5 · `research: assess chlorophyll fluorometer feasibility vs cost`
- **Label** `ece` · **Owner** Isabella · **Type** `Feature` · **Priority** `Low` · **Project** later (V1.5+)
- **Context** — High NOAA interest (satellites struggle nearshore) but sensors are $2k+. Deferred, tracked so it isn't lost.
- **Acceptance** — [ ] Feasibility + cost note; [ ] V1.5-vs-future recommendation.
- **Blocked by** — nothing · **Source** — open-questions, Stakeholder Interviews

### B6 · `research: confirm US 915 MHz RF-band compliance for the Hawaii deployment`
- **Label** `cross-discipline` · **Owner** Team · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 5
- **Context** — Must confirm the FCC frequency-hopping / dwell-time constraint (the `adelantado-2017` 1% duty cycle is an EU rule) and any marine-deployment permitting.
- **Acceptance** — [ ] US 915 MHz ISM constraint documented; [ ] firmware TX cadence confirmed compliant.
- **Blocked by** — nothing · **Source** — open-questions, `adelantado-2017`

### B7 · `csen: calibrate SEN0189 turbidity to NTU`
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 1
- **Context** — Gates **A4** (CSV units) and quantitative use of the `sully-2020` Kd490 temp×turbidity interaction. Method available (`droujko-2022`): formazin ladder + ISO 7027 IR nephelometry — port the *method + caveat*, not coefficients (particle-directionality is site-dependent).
- **Acceptance** — [ ] Calibration curve for SCOUT's SEN0189; [ ] NTU→Kd490 note; [ ] feeds A4.
- **Blocked by** — nothing · **Source** — open-questions, `droujko-2022`, `sully-2020`

### B8 · `csen: design a drift reference for a single buoy`
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Low` · **Project** Phase 2
- **Context** — Detecting fouling drift needs something to compare against, but a lone buoy has no redundant sensor.
- **Acceptance** — [ ] Approach chosen (periodic wiped/covered reference reading vs cross-signal consistency).
- **Blocked by** — nothing · **Source** — open-questions, `manov-2004` · pairs with **B3**

### B9 · `csen: define the daily-packet delivery reliability strategy`
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 1 → 4
- **Context** — A lost 82-byte daily packet costs *timeliness*, not data (full record on flash) → soft requirement. Approach identified: strongest coding rate (CR 4/8) + blind repetition; avoid ACKed retransmit (avalanche).
- **Acceptance** — [ ] CR + repetition scheme implemented in firmware; [ ] confirmed in Phase 4 range tests.
- **Blocked by** — hardware bring-up · **Source** — open-questions, `ali-2024`, `carvalho-2021`

### B10 · `research: identify the nearest NOAA STR series to the Hawaii site`
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Low` · **Project** Phase 5
- **Context** — Supplies the in-situ temperature / DHW ground-truth comparator for validating SCOUT's record.
- **Acceptance** — [ ] Nearest STR station + DOI/landing page identified and recorded.
- **Blocked by** — site selection · **Source** — open-questions, `noaa-ncrmp-str`

### B11 · `hardware: measure sleep current against the <5 mA target`
- **Label** `ece` · **Owner** Isabella · **Type** `Improvement` · **Priority** `Medium` · **Project** Phase 1
- **Context** — `< 5 mA` is an analytical *target*, not a measurement; the real power budget (battery/solar sizing) depends on it. Firmware standby sleep now exists (PR #17) to measure against.
- **Acceptance** — [ ] Measured sleep current recorded in `facts.md`; [ ] feeds battery/solar sizing.
- **Blocked by** — **A1** (charging path), PR #17 · **Source** — `facts.md` open facts

---

## C. Implementation follow-ups from merged work (suggested)

Derived from the 17 merged PRs — natural next steps, not yet tracked. File the ones the team agrees on.

### C1 · `csen: bring up the real LoRa receiver on the shore station`
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `High` · **Project** Phase 1 → 2
- **Context** — PR #10 shipped a *simulated* LoRa→CSV path (codec, simulator, receiver, store). `status.md` marks the shore station 🔴 early, **blocked on radio bring-up**. Next: real RFM95 receive on the Raspberry Pi.
- **Acceptance** — [ ] Pi receives a real RFM95 packet, validates, and appends to the CSV store; [ ] matches the codec from PR #10.
- **Blocked by** — firmware TX (PR #16/#17) · **Source** — PR #10, [shore/](../../shore/), `status.md`

### C2 · `firmware: validate the Phase-1 SAMD21 drivers on real hardware`
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `High` · **Project** Phase 1
- **Context** — PRs #16/#17 scaffolded the SAMD21 firmware (verified packet codec, scheduler, drivers, state machine, real standby sleep). Next: validate DS18B20 / SEN0189 / RFM95 / PCF8523 on the actual Feather M0.
- **Acceptance** — [ ] Each driver verified on hardware; [ ] end-to-end sense→log→TX cycle on the bench.
- **Blocked by** — **A1** (power), hardware assembly · **Source** — PR #16, PR #17

### C3 · `analytics: fix the run_pipeline --audio_dir / hyphen flag inconsistency`
- **Label** `csen` · **Owner** David (me) · **Type** `Improvement` · **Priority** `Low` · **Project** any
- **Context** — `run_pipeline.py` uses `--audio_dir` (underscore) while other scripts use hyphens. [CLAUDE.md](../../CLAUDE.md) says this is known and **must not be "fixed" without an issue** — this is that issue.
- **Acceptance** — [ ] Flags made consistent (or documented as intentional) across `analytics/` CLIs.
- **Blocked by** — nothing · **Source** — [CLAUDE.md → Before committing](../../CLAUDE.md)

### C4 · `analytics: recover the missing Sesoko 201807 recording`
- **Label** `csen` · **Owner** David (me) · **Type** `Bug` · **Priority** `Low` · **Project** any
- **Context** — Session `201807` has 4 of 5 files; one recording failed to download. Pipeline tolerates it (median of what's present), but the archive is incomplete.
- **Acceptance** — [ ] File re-downloaded via `utils/download_sesoko.py`, or gap documented as permanent.
- **Blocked by** — nothing · **Source** — [README → Data](../../README.md#data)

---

## Reference: the merged PRs (for tagging / `Source` lines)

| PR | Date | Area | Summary |
|---|---|---|---|
| #1 | 2026-08-14 | docs | Resolve ADR-0001 (Feather M0 platform), reframe SCOUT as a platform, open ADR-0002 |
| #2 | 2026-08-14 | process | Require all changes to reach main via a PR |
| #3 | 2026-08-14 | process | Make auto-merge the PR convention (later reversed) |
| #4 | 2026-08-14 | process | Require PR review before merge (no auto-merge) |
| #5 | 2026-08-14 | csen | Define the on-board CSV data schema (v1) |
| #6 | 2026-08-14 | hardware | Adopt single-point sensing (ADR-0003); reconcile sensor counts |
| #7 | 2026-08-14 | docs | Reconcile depth, LoRa range, academic year, project name |
| #8 | 2026-08-14 | docs | Reconcile the EDD to single-sensor per ADR-0003 |
| #9 | 2026-08-14 | csen | Add Raspberry Pi shore-station reference |
| #10 | 2026-08-14 | csen | Simulated LoRa→CSV data path (codec, simulator, receiver, store) |
| #11 | 2026-08-14 | csen | Environmental-telemetry pipeline (QC, CRW DHW, trends, turbidity) |
| #12 | 2026-08-14 | docs | Establish the Knowledge Hub + reading notes |
| #13 | 2026-08-14 | csen | Live GitHub Pages telemetry dashboard + shore wiring |
| #14 | 2026-08-14 | ci | Deploy telemetry dashboard to GitHub Pages (Actions) |
| #15 | 2026-08-14 | docs | Consolidate coral/water-quality + networks research library |
| #16 | 2026-08-14 | csen | Firmware Phase-1 SAMD21 scaffold (codec, scheduler, drivers, state machine) |
| #17 | 2026-08-14 | csen | Real SAMD21 standby sleep (ArduinoLowPower + PCF8523 INT wake) |
| #18 | 2026-08-14 | csen | Firmware watchdog timer for autonomous hang recovery |
| #20 | 2026-08-14 | csen | Retain `record_seq`/`last_tx` across resets (no-init RAM) |
| #21 | 2026-08-14 | docs | Add all 16 open-access source PDFs to the public library |
| #22 | 2026-08-14 | csen | State-of-Health (SoH) field in the packet + CSV |
| #23 | 2026-08-14 | ci | Test workflow + cross-language packet-contract guard |
| #24 | 2026-08-14 | csen | Firmware adaptive transmission (battery-tiered graceful degradation) |
| #25 | 2026-08-14 | csen | Multi-buoy (fleet) telemetry backend, Phase A |
| #26 | 2026-08-14 | ci | PR governance checks, CODEOWNERS, PR template |
| #28 | 2026-08-14 | docs | Log the main-protection ruleset in the decision log |
| #29 | 2026-08-14 | mechanical | Revise deployment depth to 2-7 m (resolves SCO-6) |
| #30 | 2026-08-14 | ci | Make the pr-body check reject empty sections |
| #31 | 2026-08-14 | mechanical | Scaffold CAD subsystem folders |
| #32 | 2026-08-14 | mechanical | Import flotation and turbidity-housing CAD drawings |
| #33 | 2026-08-14 | assets | Add SCOUT logo files |
| #34 | 2026-08-14 | ci | Re-run PR checks on edit; hint on bold headings |

> **Count note:** **32 merged** as of this writing; PRs **#19** (this doc) and **#27** (telemetry
> site redesign) are still open. The repo is under active concurrent work, so re-run
> `gh pr list --state merged` before filing and append anything newer.
>
> **Landed since v1 of this doc, worth flagging for the filing session:**
> - **PR #22** merged the **State-of-Health (SoH) field** into the packet and CSV, so the packet
>   layout changed. Confirm [`facts.md`](facts.md) packet-size and the
>   [Data Schema](../engineering/data-schema.md) reflect it before filing anything that cites the old
>   82-byte figure.
> - **PR #29** revised **deployment depth to 2-7 m** (was 5-8 m) and is tied to **SCO-6**, so SCO-6
>   exists and is resolved. Reconcile the SCO-5..9 list against it (see the note up top).
> - **PRs #23, #26, #30, #34** added the CI governance now gating every PR: `pr-title`, `pr-body`
>   (five `##` sections, in order), `knowledge-hub`, `conventions`, plus the Python and firmware test
>   suites. Any PR the filing session opens must satisfy these.
> - **PRs #31, #32** scaffolded the mechanical CAD tree and imported the first drawings, so the
>   mechanical track (John, `geng`) is now active: **B2** (biofouling mitigation) and **B4** (mooring)
>   are freshly actionable.
>
> Firmware Phase-1 line = PRs **#16-#18, #20, #24** (scaffold, standby sleep, watchdog, retained
> state, adaptive transmission); on-hardware validation is tracked by **C2**. PR **#21** already
> dropped the open-access PDFs into `library/`, so the 🔓 rows in
> [`sources.md`](research/sources.md) now have their `Local` PDFs.

## Settled decisions — do **not** create tickets for these

Context so the filing session doesn't re-open closed calls (full ledger: [`decision-log.md`](decision-log.md)):

- **Build platform** = Feather M0 + RFM95 ([ADR-0001](decisions/0001-mcu-and-radio-selection.md)) — settled.
- **Single-point sensing** per modality; multi-depth string deferred ([ADR-0003](decisions/0003-single-point-sensing.md)) — settled.
- **Battery chemistry** = LiFePO₄ ([ADR-0002](decisions/0002-lifepo4-charging-path.md)) — settled; *only the charging path* is open (**A1**).
- **CSV schema v1**, **PR-review workflow**, **timeline re-baseline**, **platform reframing** — all settled via PRs #1–#8.
