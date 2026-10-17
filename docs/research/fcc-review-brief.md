# FCC Review Brief — 915 MHz LoRa Link

> **Summary** — A short packet for a qualified reviewer (Navid first; SCU ECE faculty or a
> compliance lab if needed) to check the team's FCC reading before the Hawaii deployment. It
> states what the radio does, what we concluded, and the specific questions we can't settle
> ourselves, each with our current answer so the reviewer can just say "right" or "wrong".
> Full analysis: [FCC 915 MHz Compliance](fcc-915-mhz-compliance.md).
> Tracked in [SCO-104](https://linear.app/scout1/issue/SCO-104), prepared 2026-10-16.
>
> **Not legal advice.** Everything below is a student engineering reading of published rules.

---

## The ask

About 30 minutes. Read the table and the questions below; tell us which answers are wrong. We
are not asking for a certification opinion, only whether the reasoning holds.

## The system

| Item | Value |
|---|---|
| Buoy radio | Adafruit Feather M0 RFM95 (PID 3178): RFM95C module, **FCC ID `2ASEORFM95C`**, Single Modular Approval, equipment class **DTS** |
| Modulation | LoRa, **BW500 / SF12 / CR4-8**, one fixed channel at 915.0 MHz, no hopping |
| Output power | **+11 dBm** conducted, set in firmware (grant certifies 0.0145 W = 11.6 dBm) |
| Antenna | Whip, ≤ 2.15 dBi (grant: tested antenna or similar with equal or lesser gain) |
| Airtime | ≈ 559 ms per frame; 3 slots a day × 3 repeats ≈ 5 s a day |
| Direction | **Buoy transmit-only.** Shore station receive-only, no ACKs |
| Shore radio | Feather ESP32-S3 + Adafruit LoRa Radio FeatherWing (RFM95W). Grant status not checked |
| Labelling | "Contains FCC ID: 2ASEORFM95C" engraved on the housing |
| Quantity / use | One or two buoys, not sold; university capstone, research deployment in Hawaii |

## What we concluded

The original firmware (BW125, +14 dBm, single channel) met **neither** §15.247 route: it was
below the 500 kHz minimum for digital modulation (§15.247(a)(2)) and did not hop across ≥ 50
channels (§15.247(a)(1)(i)). Moving to **BW500** meets the digital-modulation route without
hopping, matches the module's DTS grant, and raising the spreading factor to SF12 more than
recovers the sensitivity lost to the wider bandwidth. Power was cut to +11 dBm to sit under the
grant's 11.6 dBm.

## Questions, in priority order

| # | Question | Our current answer | Confidence |
|---|---|---|---|
| 1 | Does a single-channel 125 kHz LoRa carrier at +14 dBm satisfy neither §15.247 route? | Yes — neither. A compliance lab says the same ([Sunfire](https://www.sunfiretesting.com/LoRa-FCC-Certification-Guide/)) | High |
| 2 | Is BW500 / SF12 inside the `2ASEORFM95C` DTS grant, or does the grant only cover the modes the test lab actually measured? | Inside, as a DTS digital-modulation mode. We have not seen which SFs the test report covered | Medium |
| 3 | The DTS route needs the **measured** 6 dB bandwidth ≥ 500 kHz. Does a BW500 LoRa signal clear it, at SF12? | Yes. Semtech measured **635.1 kHz** for BW500 LoRa per ANSI C63.10 §11.8.1 (AN1200.62 Fig. 1), 27% over the floor. Their test used an SX126x at SF8; a LoRa chirp sweeps the full bandwidth at every SF, so we expect SF12 on the SX1276 to match | Medium-high — Semtech's measurement, not ours |
| 4 | +11 or +12 dBm? The grant is 11.6 dBm; the test report carries ±2.80 dB uncertainty | +11. The SX1276 PA_BOOST output steps in **1 dB** increments, so +12 is nominally *over* 11.6 and +11 is the highest setting under it; the output also drifts ±1 dB with supply and ±1 dB with temperature (SX1276 datasheet Table 9) | Medium-high |
| 5 | Does the certified figure limit **conducted** output, with the antenna cap limiting what's radiated? | Yes: stay ≤ the certified conducted power **and** use an antenna of the tested type at ≤ 2.15 dBi | Medium |
| 6 | Does the §15.23 home-built exemption apply? Are commercial modules "a kit"? Is a capstone at a research site "personal use"? | Probably applies to the prototype; it ends if S.C.O.U.T. is ever marketed | Low |
| 7 | The shore station only **receives**. Does the 2.15 dBi cap apply to it, or can it use a high-gain antenna? | Not to a receive-only device: the cap governs emissions, and the shore emits nothing intentionally. It applies again the moment the shore transmits (ACKs, configuration) | Medium |
| 8 | Is the power spectral density limit (§15.247(e), 8 dBm / 3 kHz) a concern? | No. Semtech measured a peak of 0.97 dBm / 3 kHz at 20.99 dBm total (AN1200.62 Fig. 4), i.e. peak PSD ≈ total − 20 dB. At +11 dBm that is ≈ −9 dBm / 3 kHz, about 17 dB inside | High |

## Primary sources

- **Read 2026-10-16:** [Semtech AN1200.62](../../hardware/datasheets/semtech-an1200-62-fcc-best-practices.pdf)
  ("Best Practices for FCC", Rev 1.0) and the [SX1276 datasheet Rev 7](../../hardware/datasheets/semtech-sx1276-77-78-79-lora-transceiver.pdf).
  They answer questions 3, 4 and 8 above and confirm the sensitivity gain: the datasheet gives
  **−123 dBm for BW125/SF7 and −130 dBm for BW500/SF12** at 915 MHz, a 7 dB improvement (we had
  modelled 6.5 dB).
- **Still unread:** Semtech AN1200.26, "LoRa and FCC Part 15.247: Measurement Guidance" (2019).
  AN1200.62 now covers the same measurements, so it matters less.

Both are registered in [`sources.md`](../hub/research/sources.md#regulatory--rf-compliance).
What the reviewer's judgement is still needed for: questions 2, 5, 6 and 7, which are about how
the rules and the grant apply, not about measurements.

## Outcome — reviewed 2026-10-16

**Navid reviewed the brief and answered every question in the team's favour** (relayed by David,
2026-10-16; [SCO-104](https://linear.app/scout1/issue/SCO-104) closed). Our current answers above
stand as the agreed reading:

- **Q2:** BW500/SF12 sits inside the `2ASEORFM95C` DTS grant.
- **Q5:** stay at or below the certified 11.6 dBm conducted, with an antenna of the tested type at
  ≤ 2.15 dBi.
- **Q6:** the §15.23 home-built exemption applies to the prototype (not once S.C.O.U.T. is marketed).
- **Q7:** a receive-only shore station is not bound by the 2.15 dBi cap.

**Q7 changed the same day.** [ADR-0008](../decisions/0008-over-the-air-firmware-updates.md)
(also 2026-10-16) makes the link two-way: the shore station will now transmit firmware and
settings. The favourable Q7 answer holds only for a receive-only antenna. Whatever the shore
transmits through must meet the transmit limits, and the shore's LoRa FeatherWing (RFM95W) needs
its own authorization checked. Tracked in [SCO-197](https://linear.app/scout1/issue/SCO-197).

## After the review

Record each answer as a comment on [SCO-104](https://linear.app/scout1/issue/SCO-104) and in the
[decision log](../hub/decision-log.md). If any answer changes a canonical value (power, bandwidth,
antenna), update [`facts.md`](../hub/facts.md) and the firmware.
