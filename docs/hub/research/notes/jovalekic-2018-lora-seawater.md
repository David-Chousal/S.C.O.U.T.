# Jovalekić et al. 2018 — Experimental study of LoRa transmission over seawater

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`jovalekic-2018`](../sources.md#lora--lpwan-over-seawater) · DOI [10.3390/s18092853](https://doi.org/10.3390/s18092853) · 🔓 open access (MDPI Sensors)

**What it says.** Field measurements of LoRa point-to-point links over open seawater in two ISM bands
(**868 MHz and 434 MHz**), across spreading factors SF7/SF10/SF12 at BW = 125 kHz. Headline result:
**clear-LOS links are feasible to at least ~22 km** with low-cost rubber-duck antennas, and up to ~28 km
obstructed at 434 MHz with high-gain antennas. The authors conclude that propagation over seawater itself
"does not impose any problem" for LoRa — i.e. the sea surface is not the limiting factor.

**Why it matters to S.C.O.U.T.** Direct evidence that S.C.O.U.T.'s ~2 km design target is *conservative and very
achievable* in principle, which de-risks the shore-link concept and supports the once-a-day 30-byte
packet plan. It reframes the real range constraint: not seawater absorption, but **antenna height and
Fresnel-zone clearance** — which is precisely where a low buoy antenna is disadvantaged (see
[`gutierrez-gomez-2021`](gutierrez-gomez-2021-lora-near-surface.md)).

**Caveat / how to use it.** Their masts were elevated and the bands were 868/434 MHz — **S.C.O.U.T. runs
915 MHz (US ISM) from an antenna barely above the waterline**, so do not port the 22 km number directly.
Use it as the upper-bound sanity check and as justification for *measuring* real over-saltwater range in
Phase 4 rather than assuming datasheet line-of-sight. Answers part of the open
[LoRa-range question](../open-questions.md).
