# Liu et al. 2014 — NOAA Coral Reef Watch 5 km Degree Heating Weeks

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`liu-2014`](../sources.md#thermal-stress--coral-bleaching-dhw) · DOI [10.3390/rs61111579](https://doi.org/10.3390/rs61111579) · 🔓 open access (MDPI)

**What it says.** Defines NOAA Coral Reef Watch's operational satellite thermal-stress chain at 5 km
resolution. The building blocks: a **HotSpot** = SST − MMM (Maximum Monthly Mean climatology), counted
only when it exceeds the local bleaching threshold of MMM + 1 °C; and **Degree Heating Weeks (DHW)** =
the accumulation of HotSpots ≥ 1 °C over a rolling **12-week** window, in units of °C-weeks. The paper
establishes the response thresholds used everywhere downstream: **DHW ≥ 4** → significant bleaching
likely, **≥ 8** → widespread bleaching with mortality of heat-sensitive corals, **≥ 12** → multi-species
mortality.

**Why it matters to S.C.O.U.T.** This is the exact algorithm S.C.O.U.T.'s telemetry `bleaching.py` implements from
in-situ temperature. The value S.C.O.U.T. adds is *where the satellite is weakest*: the 5 km product still
smears across a pixel and is degraded nearshore, so a buoy logging subsurface SST at the reef computes
DHW at the actual coral, at higher temporal density, and **ground-truths** the CRW virtual station for
that site — the "affordable ground-truth" role the NOAA interviewees pointed at.

**Caveat / how to use it.** DHW is *undefined without an MMM climatology* — that is why `run_telemetry.py`
requires `--mmm`. Source the site MMM from the CRW virtual-station product (see [`skirving-2020`](skirving-2020-coraltemp-mmm.md)),
not from S.C.O.U.T.'s own short record. The 1 °C threshold and the 4/8/12 bands are calibrated to satellite
*surface* temperature; a buoy measures a slightly different depth, so treat absolute DHW as indicative
until cross-checked against the co-located CRW pixel.
