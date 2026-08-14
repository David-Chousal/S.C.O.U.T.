# Gutiérrez-Gómez et al. 2021 — Near-surface LoRa P2P links over water

> Reading note · part of the [Knowledge Hub](../README.md) library.
> Source row: [`gutierrez-gomez-2021`](../sources.md#lora--lpwan-over-seawater) · DOI [10.3390/s21206872](https://doi.org/10.3390/s21206872) · 🔓 open access (MDPI Sensors)

**What it says.** A propagation study of LoRa P2P links with antennas placed **close to the water surface**
(near-surface measurements over semitropical rivers). Received power follows a log-normal distribution,
and **path loss increases as antenna height decreases** — the low-height regime is where links degrade.
It also notes that keeping antennas near the surface reduces interception/absorption by nearby vegetation.

**Why it matters to SCOUT.** This is the propagation regime SCOUT's *buoy* actually lives in — an antenna
a few tens of centimeters above the waterline, not on a mast. It supplies the missing counterweight to the
optimistic [`jovalekic-2018`](jovalekic-2018-lora-seawater.md) 22 km figure: over seawater the medium is
fine, but a low transmit antenna and marginal Fresnel-zone clearance are what will actually cap SCOUT's
range. Motivates raising the *shore* antenna to recover the link budget the buoy can't provide.

**Caveat / how to use it.** Measurements are over rivers/fresh water, not open saltwater, and the paper
notes there was little prior 915 MHz over-water LoRa data — so treat it as the qualitative model
(two-ray ground reflection, height-dominated path loss) rather than a saltwater lookup table. Together
with Jovalekić it defines the two ends of the range envelope SCOUT must measure in Phase 4.
