# Skirving et al. 2020 — CoralTemp and the CRW heat-stress suite v3.1 (the MMM)

> Reading note · part of the [Knowledge Hub](../README.md) library.
> Source row: [`skirving-2020`](../sources.md#thermal-stress--coral-bleaching-dhw) · DOI [10.3390/rs12233856](https://doi.org/10.3390/rs12233856) · 🔓 open access (MDPI)

**What it says.** Documents the current (Version 3.1) operational CRW product suite built on the
**CoralTemp** daily global 5 km SST record. Critically for us, it defines the climatology products that
sit *upstream* of DHW: the **Monthly Mean (MM)** climatology and the **Maximum Monthly Mean (MMM)** — the
single warmest of the twelve climatological monthly means at a location — plus SST Anomaly, HotSpot, and
DHW. MMM is the reference temperature the whole bleaching-stress scale is measured against.

**Why it matters to SCOUT.** The `--mmm` argument in `run_telemetry.py` is *this* quantity. Getting it
right is the difference between a meaningful and a meaningless DHW: a wrong MMM shifts every HotSpot and
rescales thermal stress. For a Hawaii deployment, the MMM comes from the CRW virtual station nearest the
reef, not from SCOUT data. This note pins the provenance so the number in a config file is traceable to a
citable product rather than folklore.

**Caveat / how to use it.** MMM is defined on satellite SST; if SCOUT ever derives a *local* MMM from its
own loggers it must be labeled as a distinct, non-comparable climatology (needs years of data anyway).
Record the CRW station ID and product version alongside the MMM value in the site config.
