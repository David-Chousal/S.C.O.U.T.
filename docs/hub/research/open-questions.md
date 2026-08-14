# Open Research Questions

> **Summary** — What SCOUT still needs to learn from outside the team, and what's been asked.
> A question lands here the moment someone says "we should look into…"; it leaves when the
> answer is captured in a doc and its sources are added to the [Source Registry](sources.md).
>
> Part of the [Knowledge Hub](README.md). This is the research counterpart to the
> [Systems Decision Matrix](../research/systems-decision-matrix.md) (which tracks *decisions*);
> this tracks the *research* those decisions are waiting on.

---

## Open

| Question | Why it matters | Owner | Status |
|---|---|---|---|
| Real over-saltwater LoRa range at 915 MHz | Packet cadence and shore-station siting depend on it; datasheet ~2 km is line-of-sight in air | David (CSEN) | Measured in Phase 4 |
| Biofouling mitigation for a 1+ year deployment | Flagged by stakeholders as a top risk; unresolved in the design | John (GENG) | Not started |
| Turbidity → NTU calibration for SEN0189 | Decides whether the CSV ships raw ADC or calibrated NTU | David (CSEN) | Not started |
| Reef-safe anchoring / mooring | Must not damage the reef it monitors; no approach chosen | John (GENG) | Not started |
| Chlorophyll fluorometer feasibility vs cost | NOAA interest is high (satellites struggle nearshore) but sensors are $2k+ | Isabella (ECE) | Deferred (V1.5+) |
| Regulatory / RF band compliance for Hawaii | 915 MHz ISM rules and any marine-deployment permitting | Team | Not started |

## Answered (moved to a doc)

When a question is answered, move it here with a link to the doc that captured it and confirm
its sources are in the [Source Registry](sources.md).

| Question | Answer lives in | Sources added |
|---|---|---|
| Which acoustic indices, and how to combine them? | [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md) | ✅ 7 index papers in [sources.md](sources.md) |
| How to detect multi-month acoustic trends robustly? | [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md) | ✅ Mann-Kendall papers in [sources.md](sources.md) |
| What do reef researchers actually need from SCOUT? | [Stakeholder Interviews](../research/stakeholder-interviews.md) | ✅ Cited by person + date |
