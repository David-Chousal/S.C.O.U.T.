# Decision Log

> **Summary** — A reverse-chronological ledger of **every** decision the team makes, large or
> small. One line each, newest first, linking to where the decision is recorded in full. This
> is the fast index; the full "why" lives in the linked ADR, Linear issue, or doc.
>
> Part of the [Knowledge Hub](README.md).

---

## How this relates to ADRs and the Decision Matrix

Three surfaces, no overlap:

| Surface | Answers | Direction |
|---|---|---|
| **This log** | *What was decided, when, and where is it recorded?* | Backward — a ledger of settled calls |
| [Systems Decision Matrix](../research/systems-decision-matrix.md) | *What still needs deciding, who owns it, what research is needed?* | Forward — a worklist of open questions |
| [ADRs](../decisions/README.md) | *Why was this significant, hard-to-reverse call made, and what was rejected?* | Deep — full reasoning for the big ones |

**Every decision gets a row here** — even the small ones that would otherwise live only in a
Linear comment or a Granola transcript. Significant, hard-to-reverse ones **also** get an ADR;
this row then links to it. Routine ones link to the Linear issue or doc where they were made.

## How to add a row

Add to the top of the table. Keep it to one line. Use ISO dates. Area is one of
`firmware` `hardware` `mechanical` `analytics` `docs` `research` `deploy` `process`.

```
| 2026-08-20 | hardware | Chose PVC over HDPE for the hull on cost | [SCO-14](https://linear.app/scout1/issue/SCO-14) |
```

If it is significant enough for an ADR, write the ADR first, then link it here.

---

## Log

| Date | Area | Decision | Record |
|---|---|---|---|
| 2026-08-15 | cross-discipline | ✅ **Resolved (John Ryan): ADR-0003 stands.** The current build deploys one sensor per modality, multi-depth deferred. The sensor pod mechanical design is intentionally built to *enable* multi-depth scaling in a future revision — without activating it now — so the pod itself won't block that decision later. Resolves the conflict flagged below the same day | [Sensor Housing → Why build for scale now](../../mechanical/cad/sensor-housing/README.md#why-build-for-scale-now), [ADR-0003](../decisions/0003-single-point-sensing.md) |
| 2026-08-15 | cross-discipline | ⚠️ **Flagged, not resolved: multi-depth sensor stem vs. ADR-0003.** Mechanical (John Ryan) is actively building CAD for a multi-depth sensor stem, motivated by the NOAA stakeholder interviews (which explicitly call out temperature and turbidity stratification at depth). This conflicts with ADR-0003 (2026-08-14), which deferred multi-depth sensing to a future revision and deployed one sensor per modality at a single point. ADR-0003 lists wiring, power budget, and CSV schema as affected, so this needs a cross-discipline call (mechanical + CS/ECE), not a unilateral doc edit either way | [Sensor String Architecture](../engineering/sensor-string-architecture.md), [ADR-0003](../decisions/0003-single-point-sensing.md), [Stakeholder Interviews](../research/stakeholder-interviews.md) |
| 2026-08-15 | process | **Linear reconciled against PRs #40–#56.** Work completed without tickets is now filed retroactively as Done (SCO-41–SCO-46) and the open gaps those PRs raised are filed and assigned (SCO-47–SCO-51). Retroactive filing is preferred over leaving the ledger silent: an untracked completed change is indistinguishable from one that never happened | [SCO-41](https://linear.app/scout1/issue/SCO-41)–[SCO-51](https://linear.app/scout1/issue/SCO-51), [status.md](status.md) |
| 2026-08-15 | csen | **SEN0189 polarity settled: a higher `turbidity_adc` is CLEARER water.** The datasheet is explicit ("the output value will decrease when in liquids with a high turbidity") and the firmware does not invert. `turbidity.py` had it backwards and was reporting each day's clearest water as a sediment plume; `drift.py`'s clean-water reading sat on the wrong tail (10th → 90th percentile); the shore simulator generated events as ADC rises. All three fixed. **The analog front end must stay non-inverting** ([SCO-47](https://linear.app/scout1/issue/SCO-47) — no ADR yet; ADR-0002 is the charging path, not this) | [Data Schema → Turbidity polarity](../engineering/data-schema.md), [facts.md](facts.md), [datasheet](https://media.digikey.com/pdf/data%20sheets/dfrobot%20pdfs/sen0189_web.pdf) |
| 2026-08-15 | process | Notion table rule now keys on **how the content gets there**, not on a format: convert to table blocks for an **API** push, leave Markdown pipes intact for an **import/paste**. CLAUDE.md and CONVENTIONS.md had read as contradictory, and following either on the wrong path breaks the table | [CLAUDE.md → Notion conventions](../../CLAUDE.md#notion-conventions) |
| 2026-08-15 | csen | Daily-packet delivery = **CR 4/8 + blind repetition** (3 copies in NORMAL, 1 in CONSERVE, spaced with widening gaps), never ACKed retransmit. Shore deduplicates on `(buoy_id, record_seq)`. Spreading factor stays **SF7**: the stock CR 4/8 presets force SF12, whose ~2.2 s airtime would overrun the TX budget and the 400 ms FCC dwell limit that [SCO-19](https://linear.app/scout1/issue/SCO-19) is still open on | [SCO-21](https://linear.app/scout1/issue/SCO-21), [firmware/README](../../firmware/README.md), `ali-2024` · `carvalho-2021` |
| 2026-08-15 | csen | The firmware target build is now compiled in CI (`pio run -e feather_m0`). The native env excludes `src/` and never includes CMSIS, so it structurally could not catch the three breakages that had accumulated on `main` | [ci.yml](../../.github/workflows/ci.yml) |
| 2026-08-15 | analytics | Adopted QARTOD flat-line + rate-of-change per channel, and screen biofouling drift via the **daily clean-water reading** (90th percentile — originally 10th, corrected the same day once the SEN0189 polarity was settled) cross-checked against the non-optical temperature channel. Rate-of-change runs on temperature only — on turbidity it flagged ~12% of the shore sample, i.e. weather, not faults | [Telemetry Methodology §1a–1b](../../analysis/telemetry-methodology.md), [SCO-16](https://linear.app/scout1/issue/SCO-16) |
| 2026-08-14 | process | Branch + PR is absolute for every repo change, no exceptions — no direct commits to `main` regardless of size | [CLAUDE.md § Absolute blocker](../../CLAUDE.md#-absolute-blocker--never-commit-or-push-anything-that-violates-conventionsmd) |
| 2026-08-14 | process | Installed and authenticated the **`gh` CLI**, replacing the compare-URL workaround for opening PRs. Auth lives in the macOS keyring; `GITHUB_TOKEN` must never be exported, as `gh` prefers it over the keyring | [CONVENTIONS → Two repo gotchas](../CONVENTIONS.md) |
| 2026-08-14 | process | Filed the [Linear Backlog](linear-backlog.md) as 18 issues (SCO-10–SCO-27); reconciled the pre-existing SCO-5/7/9 to Done against already-settled decisions (ADR-0001, PR #7) | [linear-backlog.md](linear-backlog.md) |
| 2026-08-14 | mechanical | Revised deployment depth to **2–8 m** (was 5–8 m), confirmed against the actual Hawaii site by the field/mechanical lead | [SCO-6](https://linear.app/scout1/issue/SCO-6) |
| 2026-08-14 | process | Protected `main` with the "Protect main" ruleset: PR-only, the six required checks, conversation resolution, blocked force-push and deletion; owner keeps an Always-bypass | [ruleset settings](https://github.com/David-Chousal/S.C.O.U.T./settings/rules/20865742) |
| 2026-08-14 | process | CI enforces the PR conventions — title format, five-section body, Knowledge-Hub touch, and a conventions lint (filenames · forbidden files · markdown · source registry); `main` protection ruleset to follow | [pr-checks.yml](../../.github/workflows/pr-checks.yml) |
| 2026-08-14 | process | Knowledge Hub established: canonical facts, decision log, status journal, research library | [Hub README](README.md) |
| 2026-08-14 | docs | Reconciled the EDD requirements to single-sensor per ADR-0003 | commit `73d31ef` (PR #8) |
| 2026-08-14 | docs | Reconciled depth (5–8 m), LoRa range (~2 km), academic year (2026–2027), and project name | commit `d496bc2` (PR #7) |
| 2026-08-14 | hardware | Adopted **single-point sensing** per modality; multi-depth string deferred | [ADR-0003](../decisions/0003-single-point-sensing.md) (PR #6) |
| 2026-08-14 | csen | Defined the on-board CSV data schema v1 (firmware ↔ analytics contract) | [Data Schema](../engineering/data-schema.md) (PR #5) |
| 2026-08-14 | process | Every change reaches `main` through a **reviewed PR**; dropped auto-merge | [CONVENTIONS → PRs](../CONVENTIONS.md#pull-requests) (PR #4) |
| 2026-08-14 | process | PRs require a structured description (DATE · What Changed · Open questions · Open tasks) | [CONVENTIONS → PRs](../CONVENTIONS.md#pull-requests) (PR #1) |
| 2026-08-14 | hardware | **LiFePO₄** chosen as battery chemistry; specific charging path left open | [ADR-0002](../decisions/0002-lifepo4-charging-path.md) |
| 2026-08-14 | hardware | **Feather M0 + RFM95** confirmed as build platform; ESP32-C3 + SX1262 the future PCB target | [ADR-0001](../decisions/0001-mcu-and-radio-selection.md) |
| 2026-08-14 | process | Adopted `CONVENTIONS.md` as the naming/placement/format reference | [CONVENTIONS.md](../CONVENTIONS.md) |
| 2026-08-14 | process | Re-baselined the project timeline to Aug 2026 – May 2027 (Phases 0–6) | [Team Timeline](../planning/team-timeline.md) |
| 2026-08-14 | docs | Reframed S.C.O.U.T. as a nearshore monitoring **platform**, not a single-purpose reef buoy | [MVP System Overview](../overview/mvp-system-overview.md) |
| 2026-08-14 | process | Restructured the repo into the multi-discipline layout (`docs/`, `firmware/`, `hardware/`, …) | commit — repo restructure |
| 2026-08-13 | analytics | Initial bioacoustic pipeline: 5 indices → session-local PCA → Acoustic Quality Score | [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md) |

---

## Pending decisions (not yet made)

Mirrors the open rows in [`facts.md`](facts.md#open-facts-deliberately-not-settled-yet) and the
open items in the [Decision Matrix](../research/systems-decision-matrix.md). Listed here so a
reader sees settled and unsettled in one place. When one resolves, move it into the log above.

| Raised | Area | Decision needed | Where it's tracked |
|---|---|---|---|
| 2026-08-14 | hardware | LiFePO₄ charging path on the Feather M0 | [ADR-0002](../decisions/0002-lifepo4-charging-path.md) 🟡 Open, [SCO-10](https://linear.app/scout1/issue/SCO-10) |
| 2026-08-14 | hardware | Hydrophone part number (H2a-XLR vs H2dM) | [SCO-8](https://linear.app/scout1/issue/SCO-8) |
| 2026-08-14 | hardware | Dissolved oxygen: V1.5 or future | [SCO-11](https://linear.app/scout1/issue/SCO-11) |
| 2026-08-14 | csen | Turbidity units — raw ADC/volts vs NTU calibration | [Data Schema open questions](../engineering/data-schema.md), [SCO-13](https://linear.app/scout1/issue/SCO-13) |
