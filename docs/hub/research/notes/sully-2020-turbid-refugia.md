# Sully & van Woesik 2020 — Turbid reefs moderate coral bleaching

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`sully-2020`](../sources.md#turbidity-sedimentation--water-quality) · DOI [10.1111/gcb.14948](https://doi.org/10.1111/gcb.14948) · 🔒 copyrighted (Wiley)

**What it says.** A Bayesian analysis of 3,694 global sites finds that **moderate turbidity buffers
corals against bleaching during thermal stress**. Sites with a light-attenuation coefficient Kd490
between **0.080 and 0.127 m⁻¹** bleached less at a given heat load, because reduced light lowers the
photo-oxidative stress that drives bleaching. About 12% of the world's reefs fall in this "moderating
turbidity" window, making some turbid nearshore reefs unexpected climate refugia.

**Why it matters to S.C.O.U.T.** This is the key reason S.C.O.U.T. should not treat temperature and turbidity as
two independent stress flags to be summed. The **interaction has a sign**: the same turbidity that is a
chronic stressor (Fabricius) can be *protective* during a marine heatwave. A health/stress score that
adds "high temp = bad" + "high turbidity = bad" will misread a moderately turbid reef surviving a
heatwave. S.C.O.U.T. is one of the few low-cost platforms that measures *both* signals at the same point and
time — exactly what's needed to resolve this interaction locally.

**Caveat / how to use it.** The metric is **Kd490 (diffuse attenuation of downwelling 490 nm light), not NTU**. S.C.O.U.T.'s turbidity sensor (the Grove 101020752, which measures near-IR beam attenuation and calibrates to FAU, not NTU — [SCO-12](https://linear.app/scout1/issue/SCO-12))
reports raw ADC, and there is no direct conversion to Kd490 (different wavelength, beam vs diffuse
attenuation) — a site-specific relation, e.g. against satellite Kd490 at the site, is the realistic route.
So this can't be applied quantitatively until the [turbidity calibration question](../open-questions.md)
is closed and that relation exists. For now it
sets the modeling stance (interaction term, not additive), not a numeric threshold.
