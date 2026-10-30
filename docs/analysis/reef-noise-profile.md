# Reef Noise Profile

> **Summary** — What a coral reef sounds like to the buoy's hydrophone, band by band: snapping
> shrimp, fish calls and choruses, and the background and human noise around them. Explains
> which of these the buoy's filters and acoustic summary are built to separate, where they
> overlap, and how to check the whole chain with synthetic signals before a real reef is
> available. Written for the 2026-11-04 advisor meeting
> ([SCO-263](https://linear.app/scout1/issue/SCO-263), asked for by Dr. Krishnan at the
> 2026-10-28 meeting).

---

## The short answer

The buoy records at **22,050 Hz**, so it hears **0 to 11 kHz**
([ADR-0011](../decisions/0011-audio-capture-parameters.md)). Inside that it splits sound into
three bands, the same three the shore pipeline uses
([methodology](coral-bioacoustic-methodology.md#frequency-band-model)):

| Band | Range | What dominates it on a reef | Used in |
|---|---|---|---|
| Anthropogenic | 0 – 200 Hz | Ship and engine noise; wind and wave noise; the low end of fish calls | NDSI α |
| Mixed | 200 – 1,000 Hz | Most fish calls and choruses; small-boat engines | Level only; kept out of NDSI |
| Biological | 1,000 – 8,000 Hz | Snapping shrimp; fish feeding scrapes | NDSI β, BI, snap count |

Snapping shrimp are the reason the biological band exists. They are the loudest and most
constant biological sound on a healthy shallow reef, so the buoy counts their snaps directly as
well as measuring the band's level.

## The sources, band by band

### Snapping shrimp (1 kHz and up)

- **What a snap is:** a single click, made when a bubble collapses at the claw. It is very short
  and **extremely broadband**, with energy from a few hundred hertz to **above 200 kHz**
  (Bohnenstiehl et al., 2016, citing Cato & Bell, 1992).
- **How loud:** peak-to-peak source levels of **183–189 dB re 1 µPa at 1 m** for
  *Synalpheus paraneomeris* in Kaneohe Bay (Au & Banks, 1998), which is the Hawaii site's own
  bay. This is among the loudest biological sound in the sea, which is why a cheap hydrophone
  can count it.
- **How often:** in an oyster-reef habitat, **1,500–2,000 snaps per minute in summer** and
  **under 100 per minute in January**; water temperature explained 65–86% of the variation in
  snap rate (Bohnenstiehl et al., 2016). On Caribbean reefs, snap rates show **strong day-night
  and lunar cycles** and differ between neighbouring reefs (Lillis & Mooney, 2018). On the
  Sesoko validation clips, the buoy's detector counts **26–70 snaps per second**
  ([validation](acoustic-summary-validation.md)).
- **What others detect them in:** Bohnenstiehl et al. (2016) band-pass **1.5–20 kHz** and count
  a snap above **120 dB re 1 µPa** (about the 90th percentile of background noise).

**Consequence for the buoy:** most of a snap's energy is above what the buoy can record. The
buoy only sees the **1–8 kHz** slice of each snap, and anything above 11 kHz that reaches the
ADC unfiltered will alias down into that slice (see [The analog filter](#the-analog-filter)).

### Fish calls and choruses (under 1 kHz)

- On west Hawaiʻi reefs, **45 of 96 resident fish species** made sounds. Most were single pulses
  or pulse trains under 100 ms long, spread **from under 100 Hz to 1,000 Hz**, with **peak
  frequencies between 100 and 300 Hz** (Tricas & Boyle, 2014).
- Some parrotfishes and triggerfishes make **feeding scrapes at 2–6 kHz**
  (Tricas & Boyle, 2014). These land in the buoy's biological band.
- Fish choruses follow day-night, lunar and seasonal cycles
  ([methodology](coral-bioacoustic-methodology.md#why-seasonal-bias-matters)).

### Background and human noise (mostly under 1 kHz)

- **Wind, waves and distant shipping** set the ocean's background noise, and much of it sits in
  the same low band as fish sound (Wenz, 1962; cited for exactly this overlap by Tricas &
  Boyle, 2014).
- **Large ships and machinery** concentrate below 200 Hz, which is why the anthropogenic band
  stops there (Duarte et al., 2021;
  [methodology](coral-bioacoustic-methodology.md#ndsi--normalized-difference-soundscape-index)).
- **Small outboard motors** spread above 1 kHz through propeller cavitation, and **rain** is
  broadband impulsive noise across the biological band; both can raise the biological level
  without any animal present ([methodology](coral-bioacoustic-methodology.md)).
- **On the buoy itself:** wave slap on the hull, the mooring line, and electrical noise from the
  board. These are not in the literature and have to be measured on our hardware.

## How the buoy uses this

The processing is fixed in [`config.h`](../../firmware/src/config.h) and matches the shore
reference [`acoustic_summary.py`](../../analytics/utils/acoustic_summary.py) bit for bit
([ADR-0010](../decisions/0010-acoustic-summary-over-lora.md)):

1. **DC blocker**, −3 dB at about 6.9 Hz: removes the preamp's mid-rail bias.
2. **Three band filters** (Butterworth biquads): a 4th-order low-pass at 200 Hz; a 200 Hz
   high-pass then a 1 kHz low-pass; a 1 kHz high-pass then an 8 kHz low-pass.
3. **Band levels** (dB) for each band and the broadband level, and **NDSI** from the
   biological and anthropogenic energies, leaving the mixed band out.
4. **Snap count** on the biological band: a sample above **8 times the running average** of the
   band (with an absolute floor so silence never counts), then a **3 ms** dead time so one snap
   with its ringing and echoes counts once. White noise never crosses 8 times its own mean, so
   the count is biological clicks, not hiss.
5. **Clip count:** samples within 16 ADC codes of either rail, so a too-hot gain is visible.

These 14 bytes ride in each transmit slot; the full WAV stays on the SD card.

## Where the bands overlap

These are known limits of a three-band design, written down so they are not rediscovered:

| Overlap | Effect | Status |
|---|---|---|
| Fish call peaks (100–300 Hz) straddle the 200 Hz anthropogenic edge | A loud fish chorus adds to α and pulls NDSI toward "human noise" | Open: see [Open questions](#open-questions) |
| Feeding scrapes (2–6 kHz) and rain sit in the biological band | Biological level and possibly the snap count rise without shrimp | Accepted; the triple-trigger in the [methodology](coral-bioacoustic-methodology.md) guards the shore indices |
| Small-boat cavitation above 1 kHz | Same as above | Accepted; it is what BI is meant to catch |
| Snap energy above 11 kHz | Aliases into the biological band unless filtered before the ADC | Depends on the analog filter, below |

## The analog filter

Dr. Krishnan's question was about **the hydrophone filter**. The digital bands above only
work if the analog stage in front of the ADC does two things:

- **Anti-aliasing:** roll off well before **11 kHz** (the Nyquist frequency at 22,050 Hz).
  Snaps carry energy far above 11 kHz, and without this filter that energy folds back into
  1–8 kHz and inflates both the biological level and the snap count.
- **Gain:** keep loud nearby snaps (up to about 189 dB re 1 µPa peak-to-peak at 1 m) from
  clipping the 12-bit ADC, while leaving quiet nights above the ADC's noise floor. The clip
  count reports when this is wrong.

The amplifier is being reused from the earlier team ([SCO-216](https://linear.app/scout1/issue/SCO-216));
its actual corner frequency and gain have to be read from its schematic or measured. That is an
ECE question, recorded below.

## Checking it with synthetic signals

The software is already checked this way: the Python reference and the firmware are run on the
same generated signals and must agree bit for bit
([`test_acoustic_summary.py`](../../analytics/utils/tests/test_acoustic_summary.py),
[`test_acoustic.cpp`](../../firmware/test/test_acoustic/test_acoustic.cpp)). Those tests show:

| Synthetic input | Expected | Shown by |
|---|---|---|
| Silence | No level, NDSI 0, no snaps | `test_silence_reads_as_silent_with_no_events` |
| Pure tones at 100, 500, 3,000 Hz | Each lands in its own band, at least 10 dB above the others | `test_pure_tone_lands_in_its_band` |
| 100 Hz vs 3 kHz tone | NDSI near −1 vs near +1 | `test_ndsi_follows_the_dominant_band` |
| An impulse every 200 samples | Every impulse counted once | `test_impulse_train_counts_each_impulse_once` |
| Two impulses 30 samples apart | Counted as one snap | `test_refractory_window_merges_close_impulses` |
| White noise alone | No snaps | `test_white_noise_alone_counts_no_snaps` |
| Full-scale square wave | Every sample clips | `test_full_scale_square_clips_every_sample` |

What is **not** yet checked is the hardware in front of the ADC. A bench test, once the
amplifier is built, would feed a signal generator into the amplifier input in place of the
hydrophone and read the summary from the serial log:

1. **Tone sweep, 50 Hz to 20 kHz:** band levels should follow the three bands, and anything
   above 11 kHz should be strongly attenuated. A tone at, say, 15 kHz that shows up in the
   biological band means the anti-alias filter is not doing its job.
2. **Click train** (short pulses at a known rate, e.g. 50 per second) over low-level noise: the
   snap count should equal the pulse count, and should stay at zero with the noise alone.
3. **Level ramp** up to clipping: the clip count should start where the amplifier output
   reaches the ADC rails, which gives the usable dynamic range.
4. **Recorded reef audio** played into the input: the summary should track the shore pipeline
   run on the same file, as in the [validation](acoustic-summary-validation.md).

This becomes a test record from the
[template](../engineering/test-record-template.md) when it is scheduled, with its pass marks
written before the run.

## Open questions

- **Does the reused amplifier filter before 11 kHz, and what is its gain?** Owner: ECE
  (Isabella), with [SCO-216](https://linear.app/scout1/issue/SCO-216).
- **Should the anthropogenic band's upper edge move below the fish-call peak?** Fish peaks at
  100–300 Hz overlap the 0–200 Hz band. Changing it changes the shore pipeline, the firmware
  filters and the validation together; not proposed here, only recorded.
- **What does the buoy itself add?** Hull slap, mooring noise and board noise need a recording
  from the hung-from-a-dock V1 test.

## References

> Au, W. W. L., & Banks, K. (1998). "The acoustics of the snapping shrimp *Synalpheus
> parneomeris* in Kaneohe Bay." *Journal of the Acoustical Society of America*, 103(1):41–47.
> [https://doi.org/10.1121/1.423234](https://doi.org/10.1121/1.423234)

> Bohnenstiehl, D. R., Lillis, A., & Eggleston, D. B. (2016). "The curious acoustic behavior of
> estuarine snapping shrimp: temporal patterns of snapping shrimp sound in sub-tidal oyster reef
> habitat." *PLoS ONE*, 11(1):e0143691.
> [https://doi.org/10.1371/journal.pone.0143691](https://doi.org/10.1371/journal.pone.0143691)

> Duarte, C. M., et al. (2021). "The soundscape of the Anthropocene ocean." *Science*,
> 371(6529):eaba4658. [https://doi.org/10.1126/science.aba4658](https://doi.org/10.1126/science.aba4658)

> Lillis, A., & Mooney, T. A. (2018). "Snapping shrimp sound production patterns on Caribbean
> coral reefs: relationships with celestial cycles and environmental variables." *Coral Reefs*,
> 37(2):597–607. [https://doi.org/10.1007/s00338-018-1684-z](https://doi.org/10.1007/s00338-018-1684-z)

> Tricas, T. C., & Boyle, K. S. (2014). "Acoustic behaviors in Hawaiian coral reef fish
> communities." *Marine Ecology Progress Series*, 511:1–16.
> [https://doi.org/10.3354/meps10930](https://doi.org/10.3354/meps10930)

> Wenz, G. M. (1962). "Acoustic ambient noise in the ocean: spectra and sources." *Journal of the
> Acoustical Society of America*, 34(12):1936–1956.
> [https://doi.org/10.1121/1.1909155](https://doi.org/10.1121/1.1909155)

Cato & Bell (1992) is cited through Bohnenstiehl et al. (2016) only; it is an Australian
defence technical report (MRL-TR-91-23) we have not read.
