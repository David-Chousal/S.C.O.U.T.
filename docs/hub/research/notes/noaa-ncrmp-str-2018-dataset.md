# NOAA NCRMP Subsurface Temperature Recorder (STR) network — data source

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`noaa-ncrmp-str`](../sources.md#in-situ-temperature-reference-data) · DOI [10.7289/v5ks6pv2](https://doi.org/10.7289/v5ks6pv2) · 🔓 public dataset (NOAA NCEI)

**What it says.** NOAA's National Coral Reef Monitoring Program has run **subsurface temperature recorders
on reefs across the U.S. Pacific** — American Samoa, CNMI, the Pacific Remote Islands, and the main and
northwestern Hawaiian Islands — using high-accuracy Sea-Bird loggers at fixed depths (roughly 5/15/25 m),
sampling every 1–20 min and published as hourly-averaged, gap-padded time series, with records spanning
2005–2024 depending on site.

**Why it matters to SCOUT.** Two concrete uses. (1) **Ground truth / validation**: a co-located or nearby
STR record is the reference SCOUT's own in-situ temperature — and its derived DHW — can be checked against,
and the Hawaiian-archipelago subset overlaps SCOUT's intended deployment region. (2) **A quality bar**: it
shows the accuracy class (Sea-Bird) and cadence the reef-science community treats as trustworthy, framing
how SCOUT must characterize its low-cost DS18B20 to be taken seriously as ground truth.

**Caveat / how to use it.** It is a **dataset, not a method** — cite it as a data source, and confirm the
specific Hawaii-site STR series (and its exact DOI/landing page) before using one as SCOUT's comparator.
STRs measure at depth on the reef; match depth and averaging window before comparing to a SCOUT buoy
reading.
