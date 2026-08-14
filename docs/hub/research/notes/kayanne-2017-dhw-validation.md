# Kayanne 2017 — Validating Degree Heating Weeks against real bleaching

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`kayanne-2017`](../sources.md#thermal-stress--coral-bleaching-dhw) · DOI [10.1007/s00338-016-1524-y](https://doi.org/10.1007/s00338-016-1524-y) · 🔒 copyrighted (Springer)

**What it says.** Tests DHW as a bleaching predictor against on-site historical bleaching observations at
eight northwestern-Pacific sites. Recorded bleaching years matched DHW **> 8 °C-weeks** well, and a
logistic fit gave a positive, monotonic relationship between DHW and bleaching probability — an empirical
check on the thresholds Liu et al. defined operationally.

**Why it matters to S.C.O.U.T.** It is the difference between "we implemented an index" and "the index
predicts the thing." It gives S.C.O.U.T. defensible confidence that a DHW derived from buoy temperature is
ecologically meaningful, and it justifies surfacing the 4/8 °C-week bands as alert levels in the telemetry
output rather than as arbitrary numbers. Northwestern Pacific is also a reasonable analog for the Hawaii
deployment climate.

**Caveat / how to use it.** Validation is against *satellite* DHW; a buoy's subsurface DHW may diverge,
and the paper (like the index) is tuned to mass-bleaching years, not sub-lethal stress. Treat crossing 4
°C-weeks as "watch," 8 as "expect bleaching," and always co-report the MMM and its source
([`skirving-2020`](skirving-2020-coraltemp-mmm.md)).
