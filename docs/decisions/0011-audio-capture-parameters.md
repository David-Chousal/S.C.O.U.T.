# ADR-0011 — Audio Capture Parameters

- **Status:** 🟢 Accepted — 2026-10-25
- **Date raised:** 2026-10-25 (David Chousal Cantu)
- **Owners:** CS lead (David Chousal Cantu) for the firmware; ECE lead (Isabella Rodriguez) for the
  analog chain
- **Implements:** [SCO-231](https://linear.app/scout1/issue/SCO-231) (capture path),
  [SCO-235](https://linear.app/scout1/issue/SCO-235) (shore sample rate)
- **Resolves:** the schedule, sample-rate and audio-ADC contradictions found in
  [SCO-233](https://linear.app/scout1/issue/SCO-233)

---

## Context

Nothing on the buoy recorded audio. Capture ([SCO-231](https://linear.app/scout1/issue/SCO-231))
sat in Backlog behind the amplifier choice ([SCO-216](https://linear.app/scout1/issue/SCO-216)),
and the hydrophone (the Aquarian H2dM, chosen 2026-10-12 in
[SCO-8](https://linear.app/scout1/issue/SCO-8)) has not been bought: the order waits on funding
([SCO-158](https://linear.app/scout1/issue/SCO-158)). Meanwhile three documents gave
three different answers to how the buoy should record:

| Question | `config.h` | [Power budget 2026-10-05](../engineering/power-budget-update-2026-10-05.md) | [EDD](../engineering/engineering-design-document.md) | Build plan |
|---|---|---|---|---|
| Schedule | 3 clips/day, 00/08/16 UTC | midnight 5 × 1 min + dusk 5 × 1 min + weekly 24 h diel day | three 60 s clips/day | midnight 5×, dusk 5×, weekly diel day |
| Sample rate | — | 22.05 kHz | 16 kHz | 22.05 kHz |
| Audio ADC | — | PCM1808 (I²S) | PCM1808 (I²S) | Feather 12-bit ADC on A2 |

Separately, the shore pipeline claimed to analyse audio at 22.05 kHz but did not:
`acoustic_indices.load_audio` passed `sr=22050` to `maad.sound.load`, which ignores it, so every
shore index was computed at the file's own 44.1 kHz.

## Decision

Decided by David, 2026-10-25:

1. **Schedule: one 60 s clip at 00:00, 08:00 and 16:00 UTC, every day.** This is what the
   firmware already did and what the EDD says. Each clip sits 10 minutes before a transmit slot
   (00:10, 08:10, 16:10), so every packet carries the summary of the clip just before it
   ([ADR-0010](0010-acoustic-summary-over-lora.md)). Audio runs only in NORMAL power mode.
2. **Sample rate: 22.05 kHz, mono, 16-bit WAV.** Nyquist at 11.025 kHz keeps the 1–8 kHz bio
   band whole with room for an anti-alias filter between 8 and 11 kHz. 16 kHz is dropped.
3. **Audio ADC: the Feather M0's 12-bit SAMD21 ADC on A2**, behind a 3.3 V preamp powered
   through the A3 gate. The PCM1808 stays in the EDD as the ESP32-C3 production-target design
   only (Standing rule 3); it is not on the build.
4. **Shore indices are computed at 22.05 kHz too.** `load_audio` now resamples (polyphase), so
   the shore pipeline and the buoy analyse the same band-limited signal.

The capture path is built to these values (`firmware/src/drivers/audio_capture.h`): TC3 clocks
the ADC through the event system at 48 MHz / 2,177 = 22,048.7 Hz (59 ppm slow; the file says
22,050), DMA fills a ring of four 2,048-sample blocks, and the main loop feeds each block to the
acoustic summary and appends it to `/AUDIO/YYYYMMDD/HHMMSSZ.WAV` as 16-bit PCM. A clip that
drops a single sample is reported as no recording.

## Consequences

- **Less audio energy and storage.** 180 s/day instead of the power budget's 806 s: about
  **2.8 mAh/day** for audio instead of 16.9 (*estimate*: ≈ 56 mA while recording without the
  PCM1808), and **7.9 MB/day** (≈ 2.9 GB/year) instead of 35.5 MB/day. Recomputed in the
  [power budget's 2026-10-25 update](../engineering/power-budget-update-2026-10-05.md).
- **Given up:** the power budget's method had **several clips per window**, so a session median
  could reject the one clip in five spoiled by rain or a boat, plus a **dusk window** (fish
  choruses peak around dusk, [`staaterman-2014`](../hub/research/sources.md)) and a weekly
  **diel day**. Three single clips a day have none of these: one bad clip moves that day's
  numbers, and dusk is not sampled. If the field data needs them, adding clips is a config
  change (`AUDIO_HOURS_UTC`, `ACOUSTIC_CLIP_SECONDS`), at the energy cost above.
- **12-bit dynamic range** (~72 dB) instead of the PCM1808's 24-bit. The amplifier gain
  ([SCO-216](https://linear.app/scout1/issue/SCO-216)) has to put the reef's level well inside
  it; the summary's clip counter reports when it does not.
- **SRAM:** the 16 KB DMA ring takes the build from 6.8 KB to 23.2 KB of 32 KB.
- **CPU:** the summary was estimated at 48–57% of the M0 at 22,050 Hz; capture adds the PCM
  conversion and SD writes on top. Must be measured on the bench before deployment.
- **Shore results regenerated.** Resampling to 22.05 kHz changes every index's absolute value
  (BI roughly ×4 because bins are half as wide); the longitudinal verdict is unchanged
  (STAGNANT, PC1 τ = −0.143, p = 0.71). See the
  [methodology note](../analysis/coral-bioacoustic-methodology.md#sample-rate-sco-235).
- **Still open, not decided here:** the amplifier ([SCO-216](https://linear.app/scout1/issue/SCO-216))
  and its anti-alias corner, and buying the hydrophone and amplifier
  ([SCO-158](https://linear.app/scout1/issue/SCO-158)). Until they arrive the capture code is
  compiled and unit-tested but has never run.

## Alternatives considered

| Option | Why not |
|---|---|
| Power budget's schedule (midnight 5 + dusk 5 + weekly diel day) | Better ecology, but ~4.5× the audio energy and storage, and the transmit slots would need a rule for which of several clips to summarise. Kept as the documented upgrade if three clips a day prove too thin |
| 3 clips/day plus a weekly diel day | A middle ground; deferred until the first field data shows whether diel coverage is needed |
| 16 kHz | Nyquist at 8 kHz sits on the bio band's upper edge, so the band would have to shrink and the anti-alias filter could not be built without cutting into it |
| PCM1808 over I²S | 24-bit range, but a 5 V analog supply, ≈ 21 mA more while recording, a board change and I²S firmware; the build plan already chose the Feather ADC |
| Keep the shore pipeline at the file's native rate | Would leave the shore and the buoy analysing different bandwidths, and the code would keep claiming a rate it does not use |

## References

- [SCO-231](https://linear.app/scout1/issue/SCO-231), [SCO-235](https://linear.app/scout1/issue/SCO-235), [SCO-233](https://linear.app/scout1/issue/SCO-233), [SCO-216](https://linear.app/scout1/issue/SCO-216), [SCO-8](https://linear.app/scout1/issue/SCO-8)
- [ADR-0010 — Acoustic Summary Over LoRa](0010-acoustic-summary-over-lora.md)
- [Power Budget Update, 2026-10-05](../engineering/power-budget-update-2026-10-05.md)
- [Electronics Build and Test Plan](../engineering/electronics-build-and-test-plan.md)
- [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md)
