# ADR-0010 — Acoustic Summary Over LoRa

- **Status:** 🟢 Accepted — 2026-10-25 (field set fixed; implementation in SCO-233, additions pending in SCO-234)
- **Date raised:** 2026-10-25 (David Chousal Cantu, after the 2026-10-23 weekly meeting)
- **Owners:** CS lead (David Chousal Cantu); ECE lead (Isabella Rodriguez) for the analog chain and the pending additions
- **Implements:** [SCO-233](https://linear.app/scout1/issue/SCO-233) · **Pending:** [SCO-234](https://linear.app/scout1/issue/SCO-234)

---

## Context

Raw audio never goes over LoRa ([EDD §10](../engineering/engineering-design-document.md),
Standing rule 2). At BW 500 kHz / SF12 / CR 4/8 the link carries about 732 bit/s, so a one-minute
clip would take about 8 hours of airtime
([power budget](../engineering/power-budget-update-2026-10-05.md)). The audio is stored on the SD
card, and the five acoustic indices (ACI, BI, NDSI, H, ADI) are computed on shore once the card is
recovered ([firmware README](../../firmware/README.md)): the Feather M0's 32 KB of SRAM cannot
hold a recording.

That left the dashboard with no acoustic signal at all between card recoveries. The 30-byte
packet carries only `audio_present`. The 2026-10-05 power budget had assumed "about 10 bytes/day
of band levels" over LoRa, but no field was ever defined. The packet has room: 30 B used against
a 140 B ceiling ([SCO-97](https://linear.app/scout1/issue/SCO-97)).

## Decision

**The buoy computes a short summary of each recording while the audio streams to the SD card, and
the next transmit slot carries it.** The summary has exactly these fields:

| Field | Type | Bytes | Meaning |
|---|---|---|---|
| `lvl_anthro_cdb` | i16 | 2 | RMS level, 0–200 Hz (boats), centi-dB re ADC full scale |
| `lvl_mixed_cdb` | i16 | 2 | RMS level, 200–1,000 Hz (fish) |
| `lvl_bio_cdb` | i16 | 2 | RMS level, 1–8 kHz (snapping shrimp) |
| `lvl_broad_cdb` | i16 | 2 | Broadband RMS level |
| `ndsi_e4` | i16 | 2 | (E_bio − E_anthro) / (E_bio + E_anthro) × 10,000 |
| `snap_count` | u16 | 2 | Impulses crossing a noise-relative threshold in the bio band, saturating |
| `clip_count` | u16 | 2 | Samples at or near the ADC rails, saturating |

That is **14 bytes**, taking the packet from 30 B to **44 B** in schema v3. Airtime per send goes
from 559 ms to 690 ms (`scripts/lora_airtime.py`), about 0.5% of the 13.3 mAh/day budget instead
of 0.4%.

- **The bands are the shore pipeline's bands**
  ([`acoustic_indices.py`](../../analytics/utils/acoustic_indices.py): ANTHRO 0–200, MIXED
  200–1,000, BIO 1,000–8,000 Hz), so the buoy and the shore describe the same parts of the
  spectrum.
- **The buoy's NDSI is an approximation.** It uses the same bio and anthro bands as the shore NDSI,
  but filtered time-domain energy rather than spectrogram power. It shows the trend; it is not
  the shore value.
- **Levels are relative (dBFS) until the analog chain is calibrated.** They can be converted to
  dB re 1 µPa later from the amplifier gain and the hydrophone sensitivity.
- **The SD card stays the ground truth.** The summary is a live indicator of reef activity, boat
  noise and hydrophone health, not a replacement for the shore indices.
- Field names, sizes and order are fixed by this ADR. Scaling constants (dB resolution, snap
  threshold and refractory window, the clip margin) are set during SCO-233 and recorded in
  `config.h` and the data schema.

## Ruled out

These do not go over LoRa, now or later on this hardware:

| Option | Why not |
|---|---|
| Full ACI on the buoy | It needs the frequency breakdown across many time slices of the recording. Borderline at best on a 48 MHz M0+ with no FPU and 32 KB SRAM |
| ADI and the PCA Acoustic Quality Score | They need the full set of indices, and the PCA compares many recordings against each other. Only possible on shore |
| Any compressed audio clip | One second at 22.05 kHz is about 22 KB, roughly 160 packets at our radio settings. Not feasible in airtime or energy |

## Pending

Two additions need bench data before they are accepted or rejected
([SCO-234](https://linear.app/scout1/issue/SCO-234), owner Isabella, with David):

- **256-point FFT bands.** 8–16 finer bands at 1 byte each, enough to estimate BI and spectral
  entropy. Unknown: whether the SAMD21 keeps up at 22,050 samples/s while writing to SD, and the
  extra current.
- **Quiet / typical / loud levels (L90 / L50 / L10).** About 6 bytes; separates background from
  events. Expected to fit easily.

## Consequences

- Packet and CSV schema go to **v3** (one `schema_version` for both, per
  [ADR-0005](0005-v1-sensing-payload.md)); `scout_packet`, `shore/scout_shore/packet.py`, the
  contract check, the shore schema and the dashboard change in lockstep.
- A new hardware-free firmware library computes the summary and is unit-tested off-target. A
  Python reference version produces its test vectors and is validated against the shore indices
  on the Sesoko recordings.
- The analog chain must pass the bio band: the anti-alias cutoff has to sit above 8 kHz and under
  the 11 kHz Nyquist of 22.05 kHz sampling. This is now a requirement on the amplifier choice
  ([SCO-216](https://linear.app/scout1/issue/SCO-216)).
- Open contradictions this decision depends on, not reconciled here and listed in SCO-233: the
  recording schedule (`config.h` vs the power budget vs the EDD), the sample rate (22.05 vs
  16 kHz), and the audio ADC (Feather 12-bit vs PCM1808).

## References

- [SCO-233](https://linear.app/scout1/issue/SCO-233), [SCO-234](https://linear.app/scout1/issue/SCO-234), [SCO-231](https://linear.app/scout1/issue/SCO-231)
- [Power Budget Update, 2026-10-05](../engineering/power-budget-update-2026-10-05.md)
- [Coral Bioacoustic Methodology](../analysis/coral-bioacoustic-methodology.md)
- [Data Schema](../engineering/data-schema.md)
