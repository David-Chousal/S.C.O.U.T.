# Parri et al. 2019 — LPWAN at Sea (offshore LoRaWAN from buoy-height antennas)

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`parri-2019`](../sources.md#lora--lpwan-over-seawater) · DOI [10.3390/s19143239](https://doi.org/10.3390/s19143239) · 🔓 open access (MDPI Sensors)

**What it says.** An offshore field test of a LoRaWAN sensor node transmitting to shore gateways, with the
node antenna at **two realistic buoy elevations — 2.1 m and 3.5 m above sea level** — quantifying delivery
performance versus distance and spreading factor. It is the rare study that measures LoRaWAN in exactly
the deployment geometry SCOUT will use, rather than from a mast or hilltop.

**Why it matters to SCOUT.** This is the closest published analog to SCOUT's actual shore link and the
bridge between the two earlier LoRa notes: it grounds [`jovalekic-2018`](jovalekic-2018-lora-seawater.md)'s
optimism and [`gutierrez-gomez-2021`](gutierrez-gomez-2021-lora-near-surface.md)'s low-antenna penalty in a
real marine LoRaWAN result. It gives a concrete prior for what SCOUT should expect at ~2 km and what raising
the antenna a meter buys — directly useful for setting the Phase 4 range-test expectations and shore-antenna
siting.

**Caveat / how to use it.** European 868 MHz LoRaWAN, and antenna heights slightly above a low buoy deck —
so treat its numbers as an informative prior, not a spec. SCOUT's 915 MHz, sub-meter-antenna case still
needs its own [Phase 4 measurement](../open-questions.md).
