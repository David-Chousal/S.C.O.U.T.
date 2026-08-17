# Linear Backlog — Proposed Issues

> **Summary** — A staging doc for Linear issues, written so a session *with access to the
> `scout1` Linear workspace* could walk this list top to bottom and file each one with the right
> title, labels, owner, priority, and project. It mirrored the
> [Open Research Questions](research/open-questions.md), the open rows in [`facts.md`](facts.md)
> and [`decision-log.md`](decision-log.md#pending-decisions-not-yet-made), the blockers in
> [`status.md`](status.md), and the follow-on work implied by the merged PRs.
>
> Part of the [Knowledge Hub](README.md). **As of 2026-08-14.**
>
> ✅ **Filed 2026-08-14.** All 18 proposed issues below (A1, A3, A4, B1–B11, C1–C4) are now in
> Linear as **SCO-10 through SCO-27** — each row's heading carries its `SCO-##` link. A2 was not
> filed separately; it duplicates the pre-existing **SCO-8**. This doc is retained as the creation
> record rather than deleted; new backlog items go straight into Linear from here on, not into
> this file.
>
> ⏳ **One exception, staged 2026-08-15.** [Section D](#d-staged-not-yet-in-linear) holds items
> raised by a session that could not reach the `scout1` workspace. They are **not in Linear yet**
> and will not be picked up unless someone files them. File them, add the `SCO-##` link to the
> heading, and move the entry up into the record above. Use this section only when Linear is
> genuinely unreachable — otherwise file directly, as the note above says.

---

## How to file these (S.C.O.U.T. Linear conventions)

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

> **Pre-existing IDs, reconciled 2026-08-14:** [CLAUDE.md](../../CLAUDE.md) referenced **SCO-5 …
> SCO-9** as Phase-0 design-alignment issues that were "never closed." Resolution: **SCO-5** (MCU/
> radio) → Done, per ADR-0001 Accepted; **SCO-6** (deployment depth) → Done, per PR #29 (2–7 m);
> **SCO-7** (LoRa range figure) → Done, reconciled to ~2 km per PR #7, real-range *measurement*
> spun out as new issue **SCO-14**; **SCO-8** (hydrophone part) → still open, matches **A2** below,
> no duplicate filed; **SCO-9** (academic year) → Done, reconciled to 2026–2027 per PR #7.

---

## A. Open decisions & blockers — Phase 0 (file these first)

These are the items `status.md` names as blocking the most, and the rows `decision-log.md`/`facts.md`
explicitly mark "Needs a Linear issue."

### A1 · `hardware: decide the LiFePO₄ charging path on the Feather M0` — [SCO-10](https://linear.app/scout1/issue/SCO-10)
- **Label** `ece` · **Owner** Isabella · **Type** `Feature` · **Priority** `High` · **Project** Phase 0
- **Context** — Battery chemistry (LiFePO₄) and charge controller (BQ25570 MPPT) are chosen, but the actual charging path is undecided. `status.md` lists this as **blocker #1**.
- **Acceptance** — [ ] Charging topology decided and written into [ADR-0002](decisions/0002-lifepo4-charging-path.md) (status → Accepted); [ ] `facts.md` charge-controller row updated; [ ] unblocks battery/solar sizing + firmware battery thresholds.
- **Blocked by** — nothing · **Source** — [ADR-0002](decisions/0002-lifepo4-charging-path.md), `status.md` blocker #1

### A2 · `hardware: resolve the hydrophone part number (H2a-XLR vs H2dM)` — matches [SCO-8](https://linear.app/scout1/issue/SCO-8) (pre-existing, not re-filed)
- **Label** `ece` · **Owner** Isabella · **Type** `Bug` (spec conflict) · **Priority** `High` · **Project** Phase 0
- **Context** — Diagram cites Aquarian **H2a-XLR**, EDD BOM specifies **H2dM**. `status.md` **blocker #2** — blocks the audio front-end design and the BOM order.
- **Acceptance** — [ ] One part chosen; [ ] BOM + diagram + [`facts.md`](facts.md) hydrophone row reconciled to it; [ ] [ADR-0003 related gaps](decisions/0003-single-point-sensing.md) updated.
- **Blocked by** — nothing · **Source** — `facts.md` open facts, `status.md` blocker #2, [README known-inconsistencies](../../README.md#known-inconsistencies)

### A3 · `hardware: decide dissolved-oxygen inclusion (V1.5 vs future)` — [SCO-11](https://linear.app/scout1/issue/SCO-11)
- **Label** `ece` · **Owner** Isabella · **Type** `Feature` · **Priority** `High` · **Project** Phase 0
- **Context** — DO is wanted (interviews, meeting notes) and listed V1.5 in sensor-selection, but absent from the EDD/BOM. `status.md` **blocker #3** — blocks closing the V1 sensor list.
- **Acceptance** — [ ] Decision recorded (V1.5 vs future) with rationale; [ ] `facts.md` DO row + sensor-selection updated; [ ] V1 sensor list closed.
- **Blocked by** — nothing · **Source** — `facts.md` open facts, `status.md` blocker #3

### A4 · `csen: decide on-board turbidity units — raw ADC/volts vs calibrated NTU` — [SCO-13](https://linear.app/scout1/issue/SCO-13)
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 0 → Phase 1
- **Context** — The CSV schema needs to know whether the buoy ships raw SEN0189 ADC/volts or calibrated NTU. Decision depends on the calibration research in **B7**.
- **Acceptance** — [ ] Units decided and fixed in [Data Schema](../engineering/data-schema.md); [ ] `facts.md` turbidity-units row resolved.
- **Blocked by** — **B7** (calibration research) · **Source** — [Data Schema open questions](../engineering/data-schema.md), `facts.md` open facts

---

## B. Research questions — mirror of [`open-questions.md`](research/open-questions.md)

Each open row becomes a `research` (or discipline) issue. Sources already gathered in
[`sources.md`](research/sources.md); notes in [`research/notes/`](research/notes/).

### B1 · `research: measure real over-saltwater LoRa range at 915 MHz` — [SCO-14](https://linear.app/scout1/issue/SCO-14)
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 4
- **Context** — Datasheet ~2 km is line-of-sight in air; packet cadence + shore-station siting depend on the real number at a sub-meter buoy antenna.
- **Acceptance** — [ ] Field range/PDR vs distance measured over saltwater at 915 MHz; [ ] result written to `facts.md` LoRa-range row.
- **Blocked by** — hardware bring-up · **Source** — open-questions; literature-bounded by `jovalekic-2018` / `gutierrez-gomez-2021` / `parri-2019`

### B2 · `mechanical: choose a biofouling mitigation approach for a 1+ year deployment` — [SCO-15](https://linear.app/scout1/issue/SCO-15)
- **Label** `geng` · **Owner** John · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 3 → 4
- **Context** — Stakeholder-flagged top risk (Shantz); wipers / copper / reef-safe coatings unresolved. *Mechanical* half only — the data half is **B3**.
- **Acceptance** — [ ] Mitigation approach selected with rationale + ADR/decision-log row.
- **Blocked by** — nothing · **Source** — open-questions, [Stakeholder Interviews](../research/stakeholder-interviews.md)

### B3 · `csen: detect biofouling sensor drift in the telemetry QC` — [SCO-16](https://linear.app/scout1/issue/SCO-16) ✅ Done
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 2
- **Context** — Fouled optical/turbidity sensors drift *monotonically* → mimics a real turbidity trend in `turbidity.py`. Addressable now in software.
- **Acceptance** — [x] QARTOD-style flat-line / rate-of-change flags in `qc.py`; [x] cross-signal consistency check; [x] documented in telemetry methodology.
- **Blocked by** — nothing · **Source** — `manov-2004`, `qartod-optics-2017` (see [notes](research/notes/)) · related **B8**
- **Delivered** — [PR #45](https://github.com/David-Chousal/S.C.O.U.T./pull/45): QARTOD flat-line + rate-of-change per channel in [`qc.py`](../../analytics/telemetry/qc.py), a clean-water-floor drift screen in the new [`drift.py`](../../analytics/telemetry/drift.py) cross-checked against the non-optical temperature channel, and [Telemetry Methodology §1a–1b](../analysis/telemetry-methodology.md). Rate-of-change is temperature-only — on turbidity it flagged ~12% of the shore sample, i.e. weather rather than faults. Raised **D1** (SEN0189 polarity) on the way through.
- ⏳ **Linear still shows this open** — the status change needs a human with `scout1` access; it lands when PR #45 merges.

### B4 · `mechanical: choose a reef-safe anchoring / mooring approach` — [SCO-17](https://linear.app/scout1/issue/SCO-17)
- **Label** `geng` · **Owner** John · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 3 → 5
- **Context** — Deployment system is as important as the sensors (Oliver); must not damage the reef it monitors. No approach chosen.
- **Acceptance** — [ ] Mooring/anchor concept selected + reef-safety rationale; [ ] decision-log row.
- **Blocked by** — nothing · **Source** — open-questions, Stakeholder Interviews

### B5 · `research: assess chlorophyll fluorometer feasibility vs cost` — [SCO-18](https://linear.app/scout1/issue/SCO-18)
- **Label** `ece` · **Owner** Isabella · **Type** `Feature` · **Priority** `Low` · **Project** later (V1.5+)
- **Context** — High NOAA interest (satellites struggle nearshore) but sensors are $2k+. Deferred, tracked so it isn't lost.
- **Acceptance** — [ ] Feasibility + cost note; [ ] V1.5-vs-future recommendation.
- **Blocked by** — nothing · **Source** — open-questions, Stakeholder Interviews

### B6 · `research: confirm US 915 MHz RF-band compliance for the Hawaii deployment` — [SCO-19](https://linear.app/scout1/issue/SCO-19)
- **Label** `cross-discipline` · **Owner** Team · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 5
- **Context** — Must confirm the FCC frequency-hopping / dwell-time constraint (the `adelantado-2017` 1% duty cycle is an EU rule) and any marine-deployment permitting.
- **Acceptance** — [ ] US 915 MHz ISM constraint documented; [ ] firmware TX cadence confirmed compliant.
- **Blocked by** — nothing · **Source** — open-questions, `adelantado-2017`

### B7 · `csen: calibrate SEN0189 turbidity to NTU` — [SCO-12](https://linear.app/scout1/issue/SCO-12)
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 1
- **Context** — Gates **A4** (CSV units) and quantitative use of the `sully-2020` Kd490 temp×turbidity interaction. Method available (`droujko-2022`): formazin ladder + ISO 7027 IR nephelometry — port the *method + caveat*, not coefficients (particle-directionality is site-dependent).
- **Acceptance** — [ ] Calibration curve for S.C.O.U.T.'s SEN0189; [ ] NTU→Kd490 note; [ ] feeds A4.
- **Blocked by** — nothing · **Source** — open-questions, `droujko-2022`, `sully-2020`

### B8 · `csen: design a drift reference for a single buoy` — [SCO-20](https://linear.app/scout1/issue/SCO-20)
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Low` · **Project** Phase 2
- **Context** — Detecting fouling drift needs something to compare against, but a lone buoy has no redundant sensor.
- **Acceptance** — [x] Cross-signal consistency built (**B3**/PR #45 — turbidity floor vs the non-optical temperature channel); [ ] decide whether a periodic wiped/covered reference reading is still needed on top of it.
- **Blocked by** — nothing · **Source** — open-questions, `manov-2004` · pairs with **B3**
- **Narrowed 2026-08-15** — B3 delivered the cross-signal half of this, so the open question is no longer "which approach" but whether software cross-checking alone is enough without a physical clean reference. PR #45's screen is explicitly a *screen, not proof* for exactly this reason.

### B9 · `csen: define the daily-packet delivery reliability strategy` — [SCO-21](https://linear.app/scout1/issue/SCO-21) ✅ Firmware done, field confirmation pending
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 1 → 4
- **Context** — A lost 82-byte daily packet costs *timeliness*, not data (full record on flash) → soft requirement. Approach identified: strongest coding rate (CR 4/8) + blind repetition; avoid ACKed retransmit (avalanche).
- **Acceptance** — [x] CR + repetition scheme implemented in firmware; [ ] confirmed in Phase 4 range tests.
- **Blocked by** — hardware bring-up (field confirmation only) · **Source** — open-questions, `ali-2024`, `carvalho-2021`
- **Delivered** — [PR #49](https://github.com/David-Chousal/S.C.O.U.T./pull/49): CR 4/8 modem config, blind repetition in the new `scout_link` lib (3 copies NORMAL / 1 CONSERVE / 0 CRITICAL, widening gaps, watchdog-headroom guard), and shore-side dedupe on `(buoy_id, record_seq)` so the copies collapse to one row. SF left at 7 pending **B6**/[SCO-19](https://linear.app/scout1/issue/SCO-19). Keep this issue open until the Phase 4 range test measures the actual delivery gain (**B1**/[SCO-14](https://linear.app/scout1/issue/SCO-14)).

### B10 · `research: identify the nearest NOAA STR series to the Hawaii site` — [SCO-22](https://linear.app/scout1/issue/SCO-22)
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Low` · **Project** Phase 5
- **Context** — Supplies the in-situ temperature / DHW ground-truth comparator for validating S.C.O.U.T.'s record.
- **Acceptance** — [ ] Nearest STR station + DOI/landing page identified and recorded.
- **Blocked by** — site selection · **Source** — open-questions, `noaa-ncrmp-str`

### B11 · `hardware: measure sleep current against the <5 mA target` — [SCO-23](https://linear.app/scout1/issue/SCO-23)
- **Label** `ece` · **Owner** Isabella · **Type** `Improvement` · **Priority** `Medium` · **Project** Phase 1
- **Context** — `< 5 mA` is an analytical *target*, not a measurement; the real power budget (battery/solar sizing) depends on it. Firmware standby sleep now exists (PR #17) to measure against.
- **Acceptance** — [ ] Measured sleep current recorded in `facts.md`; [ ] feeds battery/solar sizing.
- **Blocked by** — **A1** (charging path), PR #17 · **Source** — `facts.md` open facts

---

## C. Implementation follow-ups from merged work (suggested)

Derived from the 17 merged PRs — natural next steps, not yet tracked. File the ones the team agrees on.

### C1 · `csen: bring up the real LoRa receiver on the shore station` — [SCO-24](https://linear.app/scout1/issue/SCO-24)
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `High` · **Project** Phase 1 → 2
- **Context** — PR #10 shipped a *simulated* LoRa→CSV path (codec, simulator, receiver, store). `status.md` marks the shore station 🔴 early, **blocked on radio bring-up**. Next: real RFM95 receive on the Raspberry Pi.
- **Acceptance** — [ ] Pi receives a real RFM95 packet, validates, and appends to the CSV store; [ ] matches the codec from PR #10.
- **Blocked by** — firmware TX (PR #16/#17) · **Source** — PR #10, [shore/](../../shore/), `status.md`

### C2 · `firmware: validate the Phase-1 SAMD21 drivers on real hardware` — [SCO-25](https://linear.app/scout1/issue/SCO-25)
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `High` · **Project** Phase 1
- **Context** — PRs #16/#17 scaffolded the SAMD21 firmware (verified packet codec, scheduler, drivers, state machine, real standby sleep). Next: validate DS18B20 / SEN0189 / RFM95 / PCF8523 on the actual Feather M0.
- **Acceptance** — [ ] Each driver verified on hardware; [ ] end-to-end sense→log→TX cycle on the bench.
- **Blocked by** — **A1** (power), hardware assembly · **Source** — PR #16, PR #17

### C3 · `analytics: fix the run_pipeline --audio_dir / hyphen flag inconsistency` — [SCO-26](https://linear.app/scout1/issue/SCO-26) · ⏭️ **next up**
- **Label** `csen` · **Owner** David (me) · **Type** `Improvement` · **Priority** `Low` · **Project** any
- **Context** — `run_pipeline.py` uses `--audio_dir` (underscore) while other scripts use hyphens. [CLAUDE.md](../../CLAUDE.md) says this is known and **must not be "fixed" without an issue** — this is that issue.
- **Acceptance** — [ ] Flags made consistent (or documented as intentional) across `analytics/` CLIs.
- **Blocked by** — nothing · **Source** — [CLAUDE.md → Before committing](../../CLAUDE.md)
- **⏭️ Next up (2026-08-16)** — with the drift/polarity/delivery work merged, this and **C4** are the only unblocked CSEN items left; everything else needs hardware. Add the **`On Deck`** workflow label in Linear ([CLAUDE.md → Labels](../../CLAUDE.md)) so the queue reflects it. Priority stays `Low` — cheap, not important.

### C4 · `analytics: recover the missing Sesoko 201807 recording` — [SCO-27](https://linear.app/scout1/issue/SCO-27) · ⏭️ **next up**
- **Label** `csen` · **Owner** David (me) · **Type** `Bug` · **Priority** `Low` · **Project** any
- **Context** — Session `201807` has 4 of 5 files; one recording failed to download. Pipeline tolerates it (median of what's present), but the archive is incomplete.
- **Acceptance** — [ ] File re-downloaded via `utils/download_sesoko.py`, or gap documented as permanent.
- **Blocked by** — nothing · **Source** — [README → Data](../../README.md#data)
- **⏭️ Next up (2026-08-16)** — paired with **C3** as the remaining unblocked CSEN work. Add the **`On Deck`** label in Linear. Note the acceptance criterion allows *documenting the gap as permanent* — if the source no longer serves the file, closing it that way is a real outcome, not a failure.

---

## D. Staged — now all filed

✅ **Filed 2026-08-17.** These were raised by sessions without `scout1` access. Each heading now
carries its `SCO-##`. Kept here as the derivation record, not as a queue.

**All of section D is now filed or closed.** D1 was resolved before it was ever filed and is
kept as a record; **D2 is [SCO-57](https://linear.app/scout1/issue/SCO-57)** and
**D3 is [SCO-58](https://linear.app/scout1/issue/SCO-58)** (filed 2026-08-17).

### D1 · `csen: resolve the SEN0189 ADC→turbidity polarity` — ✅ Resolved 2026-08-15 (never filed)
- **Label** `csen` · **Owner** David (me) · **Type** `Bug` (implementation vs. datasheet conflict) · **Priority** `High` · **Project** Phase 1
- **Context** — [`turbidity.py`](../../analytics/telemetry/turbidity.py) treats a **rising** `turbidity_adc` as dirtier water and flags only positive excursions. But the DFRobot SEN0189's analog output voltage **falls** as turbidity rises, and the firmware logs `analogRead` with no inversion ([`turbidity.h`](../../firmware/src/drivers/turbidity.h)). If the sensor behaves as its datasheet describes, the event detector is flagging the wrong tail — reporting the *clearest* water as sediment plumes. Nothing in the repo currently states the intended convention either way.
- **Why `High`** — it is a live correctness defect in analysis code that already feeds the public dashboard, and it is cheap to settle (one bench reading) alongside **B7**/[SCO-12](https://linear.app/scout1/issue/SCO-12). Not `Urgent`: the buoy is not deployed, so no real measurement is being misread yet. It must be right *before* Phase 4 data starts flowing.
- **Acceptance** — [ ] Polarity confirmed empirically (clear vs. visibly turbid water on the bench) and cross-checked against the DFRobot datasheet; [ ] the convention written into the [Data Schema](../engineering/data-schema.md) `turbidity_adc` row and [`facts.md`](facts.md); [ ] if inverted, `turbidity.py`'s excursion direction corrected with a regression test; [ ] the pending row in [`decision-log.md`](decision-log.md#pending-decisions-not-yet-made) moved to settled and the [`open-questions.md`](research/open-questions.md) row moved to Answered.
- **Blocked by** — nothing. The datasheet review can start now; the empirical confirmation rides along with **B7**'s formazin ladder rather than needing its own bench session.
- **Source** — [PR #45](https://github.com/David-Chousal/S.C.O.U.T./pull/45), [`open-questions.md`](research/open-questions.md), `manov-2004` drift work (**B3**/[SCO-16](https://linear.app/scout1/issue/SCO-16))
- **Note for the filer** — the biofouling drift screen delivered in PR #45 is deliberately **sign-agnostic**, so it stays correct whichever way this resolves. Only `turbidity.py` is at risk.

### D2 · `csen: surface biofouling drift state on the Fleet page` — ✅ [SCO-57](https://linear.app/scout1/issue/SCO-57)
- **Label** `csen` · **Owner** David (me) · **Type** `Feature` · **Priority** `Medium` · **Project** Phase 2 → 5
- **Context** — [SCO-51](https://linear.app/scout1/issue/SCO-51) put the drift verdict on the single-buoy Analytics page. The **Fleet** page ([`fleet_web.py`](../../analytics/telemetry/fleet_web.py)) is a separate renderer and shows no drift state at all, so a fouling buoy looks identical to a healthy one in the network view.
- **Why it matters more here, not less** — a lone buoy has no clean reference, which is why the screen is only a *screen* ([SCO-20](https://linear.app/scout1/issue/SCO-20)). A fleet does: one buoy whose clean-water reading sinks while its neighbours hold steady is close to the redundant comparison `manov-2004` actually asks for. This is arguably the cheapest partial answer to SCO-20 available — no extra hardware, just cross-buoy comparison of a number already computed.
- **Acceptance** — [ ] Each buoy tile carries its drift verdict; [ ] the rollup surfaces any buoy at `suspect`/`likely`; [ ] cross-buoy divergence in the clean-water reading is reported, or explicitly deferred with a reason.
- **Blocked by** — nothing technically; **low value until more than one buoy exists**. File it, then park it in `Backlog` rather than `On Deck`.
- **Source** — [PR #65](https://github.com/David-Chousal/S.C.O.U.T./pull/65) open questions · related **B8**/[SCO-20](https://linear.app/scout1/issue/SCO-20)

### D3 · `analytics: improve the PNG dashboard for presentations` — ✅ [SCO-58](https://linear.app/scout1/issue/SCO-58)
- **Label** `csen` · **Owner** David (me) · **Type** `Improvement` · **Priority** `Low` · **Project** any
- **Context** — [`dashboard.py`](../../analytics/telemetry/dashboard.py) renders the optional PNG dashboard (`--dashboard`) and omits the drift verdict that the web page now shows. Deliberately skipped in [PR #65](https://github.com/David-Chousal/S.C.O.U.T./pull/65): nothing in the Pages build uses it, so widening scope there would have been unrelated work.
- **Answered 2026-08-17 — the PNG stays.** It is still used for **presentations**; a slide needs a self-contained image, not a URL, so the static site does not replace it. "Retire it" is off the table and the issue is scoped as improvement instead.
- **Acceptance** — [ ] Drift verdict on the PNG with the same "screen, not proof" caveat; [ ] legibility pass at slide scale (fonts, contrast, figure size); [ ] `insufficient data` stays unstyled, matching the web dashboard; [ ] turbidity panel reflects the corrected polarity; [ ] a note in [live-dashboard.md](../engineering/live-dashboard.md) saying what the PNG is *for*, so nobody re-asks whether to retire it.
- **Blocked by** — nothing · **Source** — [PR #65](https://github.com/David-Chousal/S.C.O.U.T./pull/65) open tasks

---

## Reference: the merged PRs (for tagging / `Source` lines)

| PR | Date | Area | Summary |
|---|---|---|---|
| #1 | 2026-08-14 | docs | Resolve ADR-0001 (Feather M0 platform), reframe S.C.O.U.T. as a platform, open ADR-0002 |
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
| #33 | 2026-08-14 | assets | Add S.C.O.U.T. logo files |
| #34 | 2026-08-14 | ci | Re-run PR checks on edit; hint on bold headings |
| #35 | 2026-08-14 | docs | Standardize the S.C.O.U.T. wordmark across documentation |
| #36 | 2026-08-14 | ci | Accept common heading variants in the pr-body check |

> **Count note:** **34 merged** as of this writing; PRs **#19** (this doc) and **#27** (telemetry
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

## Filing status — reconciled 2026-08-15

A session on 2026-08-15 reached the `scout1` workspace and reconciled Linear against PRs
#40–#56. Everything staged in this document has now been filed; the sections below are kept as
the record of how the backlog was derived, not as a queue.

| Filed retroactively as **Done** | Covering |
|---|---|
| [SCO-41](https://linear.app/scout1/issue/SCO-41) | SEN0189 polarity corrected pipeline-wide (this was staged item **D1** — resolved by PR #54 before it was ever filed) |
| [SCO-42](https://linear.app/scout1/issue/SCO-42) | Firmware target build fixed and gated in CI (PR #49) |
| [SCO-43](https://linear.app/scout1/issue/SCO-43) | Shore CSV store made idempotent (PR #49) |
| [SCO-44](https://linear.app/scout1/issue/SCO-44) | Public multi-page website (PRs #27, #40, #43–#48, #50, #55) |
| [SCO-45](https://linear.app/scout1/issue/SCO-45) | Floatation CAD iteration history v1–v9 (PR #53) |
| [SCO-46](https://linear.app/scout1/issue/SCO-46) | Electronics housing dimensions corrected to TBD (PR #53) |

| Filed as **open** | Owner |
|---|---|
| [SCO-47](https://linear.app/scout1/issue/SCO-47) — SEN0189 analog front end must be non-inverting | Isabella (ece) |
| [SCO-48](https://linear.app/scout1/issue/SCO-48) — choose the final floatation iteration | John Ryan (geng) |
| [SCO-49](https://linear.app/scout1/issue/SCO-49) — decide electronics housing dimensions | John Ryan (geng) |
| [SCO-50](https://linear.app/scout1/issue/SCO-50) — document remaining CAD categories | John Ryan (geng) |
| [SCO-51](https://linear.app/scout1/issue/SCO-51) — surface the drift verdict on the dashboard | David (csen) |

### Second pass — PRs #58–#60 (mechanical CAD), reconciled 2026-08-16

| Filed retroactively as **Done** | Covering |
|---|---|
| [SCO-52](https://linear.app/scout1/issue/SCO-52) | Multi-depth pod vs ADR-0003 — flagged and resolved same day (PR #59) |

| Filed as **open** — all John Ryan (`geng`) | From |
|---|---|
| [SCO-53](https://linear.app/scout1/issue/SCO-53) — electronics housing cap needs a cable gland | PR #58 (explicitly "not yet a Linear issue") |
| [SCO-54](https://linear.app/scout1/issue/SCO-54) — refine stem and solar mount into current iterations | PR #60 |
| [SCO-55](https://linear.app/scout1/issue/SCO-55) — decide the O-ring manufacturing method | PR #60 |
| [SCO-56](https://linear.app/scout1/issue/SCO-56) — audit the Onshape "Initial Frame" folder | PR #60 |

**SCO-50** → Done: all five CAD categories delivered across PRs #58–#60, with the Onshape
share link satisfying the native-source rule that PR #60 clarified for cloud CAD tools.
**SCO-48** stays open with a comment — the candidate set grew from v1–v9 to include the
wedge-based Master V3 and Outer Octagon designs.

Also moved: **SCO-16** → Done (PR #45). **SCO-21** stays open with the firmware half recorded
as a comment, pending Phase 4 field confirmation. **SCO-15** and **SCO-18** were missing phase
projects and now have them.

## Settled decisions — do **not** create tickets for these

Context so the filing session doesn't re-open closed calls (full ledger: [`decision-log.md`](decision-log.md)):

- **Build platform** = Feather M0 + RFM95 ([ADR-0001](decisions/0001-mcu-and-radio-selection.md)) — settled.
- **Single-point sensing** per modality; multi-depth string deferred ([ADR-0003](decisions/0003-single-point-sensing.md)) — settled.
- **Battery chemistry** = LiFePO₄ ([ADR-0002](decisions/0002-lifepo4-charging-path.md)) — settled; *only the charging path* is open (**A1**).
- **CSV schema v1**, **PR-review workflow**, **timeline re-baseline**, **platform reframing** — all settled via PRs #1–#8.
