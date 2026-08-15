# Open Research Questions

> **Summary** — What S.C.O.U.T. still needs to learn from outside the team, and what's been asked.
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
| Real over-saltwater LoRa range at 915 MHz | Packet cadence and shore-station siting depend on it; datasheet ~2 km is line-of-sight in air | David (CSEN) | Literature-bounded, measure in Phase 4 — [`jovalekic-2018`](sources.md#lora--lpwan-over-seawater) (~22 km LOS upper bound), [`gutierrez-gomez-2021`](sources.md#lora--lpwan-over-seawater) (height-limited lower bound), [`parri-2019`](sources.md#lora--lpwan-over-seawater) (buoy-height offshore analog) |
| Biofouling — mechanical mitigation for a 1+ year deployment | Flagged by stakeholders as a top risk; wipers / copper / reef-safe coatings unresolved | John (GENG) | Not started |
| SEN0189 ADC→turbidity polarity | Decides whether a rising `turbidity_adc` means clearer or dirtier water — currently `turbidity.py` assumes rising = dirtier, but the DFRobot SEN0189's output voltage *falls* as turbidity rises, and the firmware logs `analogRead` with no inversion. The event detector may therefore be flagging the wrong tail | David (CSEN) | **Open — newly raised.** Staged as [D1](../linear-backlog.md#d-staged-not-yet-in-linear) (⏳ not yet in Linear). Resolve on the bench during [SCO-12](https://linear.app/scout1/issue/SCO-12) calibration (a formazin ladder settles it directly); until then the drift screen in `drift.py` is deliberately sign-agnostic |
| Turbidity → NTU calibration for SEN0189 | Decides whether the CSV ships raw ADC or calibrated NTU; also gates applying the [`sully-2020`](sources.md#turbidity-sedimentation--water-quality) Kd490 temp×turbidity interaction quantitatively | David (CSEN) | Not started — method available: formazin ladder + ISO 7027 IR nephelometry per [`droujko-2022`](sources.md#turbidity-sedimentation--water-quality) (port method + caveat, not coefficients) |
| Reef-safe anchoring / mooring | Must not damage the reef it monitors; no approach chosen | John (GENG) | Not started |
| Chlorophyll fluorometer feasibility vs cost | NOAA interest is high (satellites struggle nearshore) but sensors are $2k+ | Isabella (ECE) | Deferred (V1.5+) |
| Regulatory / RF band compliance for Hawaii | 915 MHz ISM rules and any marine-deployment permitting | Team | Not started — port the duty-cycle *reasoning* from [`adelantado-2017`](sources.md#lora--lpwan-over-seawater) (EU 1% rule); confirm the US 915 MHz FCC frequency-hopping / dwell-time constraint |
| Drift reference at a lone buoy | Detecting fouling drift needs something to compare against, but a single buoy has no redundant sensor | David (CSEN) | Open — options: a periodic wiped/covered reference reading vs a cross-signal consistency check ([`manov-2004`](sources.md#data-quality--sensor-integrity)) |
| Daily-packet delivery reliability strategy | A lost 82-byte daily packet costs a day of *timeliness*, not data (full record is on flash) → requirement is soft | David (CSEN) | **Implemented** in firmware ([SCO-21](https://linear.app/scout1/issue/SCO-21)): CR 4/8 [`ali-2024`](sources.md#link-reliability--fec) + blind repetition [`carvalho-2021`](sources.md#link-reliability--fec), no ACKed retransmit, shore deduplicates. Still open: the over-the-air gain is unmeasured until the Phase 4 range test ([SCO-14](https://linear.app/scout1/issue/SCO-14)), and the SF choice is pinned to SF7 pending the FCC dwell-time answer ([SCO-19](https://linear.app/scout1/issue/SCO-19)) |
| Nearest NOAA STR series to the Hawaii site | Supplies the in-situ temperature / DHW ground-truth comparator for validation | David (CSEN) | Open — identify the station from the [`noaa-ncrmp-str`](sources.md#in-situ-temperature-reference-data) network |

## Answered (moved to a doc)

When a question is answered, move it here with a link to the doc that captured it and confirm
its sources are in the [Source Registry](sources.md).

| Question | Answer lives in | Sources added |
|---|---|---|
| Which acoustic indices, and how to combine them? | [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md) | ✅ 7 index papers in [sources.md](sources.md) |
| How to detect multi-month acoustic trends robustly? | [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md) | ✅ Mann-Kendall papers in [sources.md](sources.md) |
| What do reef researchers actually need from S.C.O.U.T.? | [Stakeholder Interviews](../research/stakeholder-interviews.md) | ✅ Cited by person + date |
| Biofouling — data integrity (sensor drift) | [Telemetry Methodology §1a–1b](../../analysis/telemetry-methodology.md) — QARTOD flat-line / rate-of-change in `qc.py` plus a clean-water-floor drift screen in `drift.py`, cross-checked against the non-optical temperature channel | ✅ [`manov-2004`](sources.md#data-quality--sensor-integrity), [`qartod-optics-2017`](sources.md#data-quality--sensor-integrity) |
