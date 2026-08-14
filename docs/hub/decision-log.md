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
| 2026-08-14 | docs | Reframed SCOUT as a nearshore monitoring **platform**, not a single-purpose reef buoy | [MVP System Overview](../overview/mvp-system-overview.md) |
| 2026-08-14 | process | Restructured the repo into the multi-discipline layout (`docs/`, `firmware/`, `hardware/`, …) | commit — repo restructure |
| 2026-08-13 | analytics | Initial bioacoustic pipeline: 5 indices → session-local PCA → Acoustic Quality Score | [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md) |

---

## Pending decisions (not yet made)

Mirrors the open rows in [`facts.md`](facts.md#open-facts-deliberately-not-settled-yet) and the
open items in the [Decision Matrix](../research/systems-decision-matrix.md). Listed here so a
reader sees settled and unsettled in one place. When one resolves, move it into the log above.

| Raised | Area | Decision needed | Where it's tracked |
|---|---|---|---|
| 2026-08-14 | hardware | LiFePO₄ charging path on the Feather M0 | [ADR-0002](../decisions/0002-lifepo4-charging-path.md) 🟡 Open |
| 2026-08-14 | hardware | Hydrophone part number (H2a-XLR vs H2dM) | Needs a Linear issue (`ece`) |
| 2026-08-14 | hardware | Dissolved oxygen: V1.5 or future | Needs a Linear issue (`ece`) |
| 2026-08-14 | csen | Turbidity units — raw ADC/volts vs NTU calibration | [Data Schema open questions](../engineering/data-schema.md) |
