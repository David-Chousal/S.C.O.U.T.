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
| 3 | The DTS route needs the **measured** 6 dB bandwidth ≥ 500 kHz. A BW500 LoRa signal sits close to its nominal 500 kHz. Is the margin a real concern? | We rely on the grant's test report having measured it | Low — we cannot measure it |
| 4 | +11 or +12 dBm? The grant is 11.6 dBm; the test report carries ±2.80 dB uncertainty | +11, for margin against part-to-part variation | Medium |
| 5 | Does the certified figure limit **conducted** output, with the antenna cap limiting what's radiated? | Yes: stay ≤ the certified conducted power **and** use an antenna of the tested type at ≤ 2.15 dBi | Medium |
| 6 | Does the §15.23 home-built exemption apply? Are commercial modules "a kit"? Is a capstone at a research site "personal use"? | Probably applies to the prototype; it ends if S.C.O.U.T. is ever marketed | Low |
| 7 | The shore station only **receives**. Does the 2.15 dBi cap apply to it, or can it use a high-gain antenna? | Not to a receive-only device: the cap governs emissions, and the shore emits nothing intentionally. It applies again the moment the shore transmits (ACKs, configuration) | Medium |
| 8 | Is the power spectral density limit (§15.247(e), 8 dBm / 3 kHz) a concern? | No: +11 dBm over 500 kHz averages ≈ −11 dBm / 3 kHz, about 19 dB inside | High (modelled) |

## Primary sources we could not read

- **Semtech AN1200.26**, "LoRa and FCC Part 15.247: Measurement Guidance" (2019): only
  secondary summaries.
- **Semtech AN1200.62**, "Best Practices for FCC" (2021): the Mouser PDF returned a bot-check
  page.

If the reviewer has either, they are the most likely source of a correction, especially for
question 3. Both are registered in [`sources.md`](../hub/research/sources.md#regulatory--rf-compliance).

## After the review

Record each answer as a comment on [SCO-104](https://linear.app/scout1/issue/SCO-104) and in the
[decision log](../hub/decision-log.md). If any answer changes a canonical value (power, bandwidth,
antenna), update [`facts.md`](../hub/facts.md) and the firmware.
