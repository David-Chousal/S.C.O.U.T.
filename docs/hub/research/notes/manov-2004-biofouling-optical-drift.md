# Manov, Chang & Dickey 2004 — Biofouling drift of moored optical sensors

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`manov-2004`](../sources.md#data-quality--sensor-integrity) · DOI [10.1175/1520-0426(2004)021<0958:MFRBOM>2.0.CO;2](https://doi.org/10.1175/1520-0426(2004)021%3C0958:MFRBOM%3E2.0.CO;2) · 🔒 copyrighted (AMS)

**What it says.** The foundational field study of how biofouling corrupts moored **optical** sensors. A
biofilm only micrometers thick on an optical window is enough to bias readings, and the effect grows over
weeks-to-months as colonization advances — **desensitizing the instrument and producing a slow signal
drift, worst in turbid, productive water**. Its detection strategy is the durable contribution: compare a
suspect sensor's time series against complementary/redundant measurements to separate genuine
environmental variability from instrument drift.

**Why it matters to S.C.O.U.T.** This is the specific, quantified failure mode that threatens S.C.O.U.T.'s
turbidity signal over a 1+ year unattended deployment — and it's the exact risk Dr. Shantz flagged in the
[stakeholder interviews](../../../research/stakeholder-interviews.md). The danger for S.C.O.U.T. is subtle: fouling
drift is **monotonic**, so it will masquerade as a real turbidity *trend* and be picked up by the
Mann-Kendall test in [`turbidity.py`](../../../../analytics/telemetry/turbidity.py). The paper's message —
never trust a single fouled optical channel; cross-check against an independent signal — is a design
requirement for S.C.O.U.T.'s QC, not a nicety.

**Caveat / how to use it.** The study uses higher-end oceanographic instruments and open-ocean moorings;
S.C.O.U.T.'s low-cost SEN0189 will foul *faster* in shallow nearshore water, not slower. The cross-comparison
method assumes a reference S.C.O.U.T. may not have at a lone buoy — so it argues for building in a drift check
(e.g. a periodic wiped/covered reference reading, or cross-signal consistency) rather than assuming clean
turbidity. Mitigation *hardware* (copper, wipers) is the GENG lane and deliberately out of scope here.
