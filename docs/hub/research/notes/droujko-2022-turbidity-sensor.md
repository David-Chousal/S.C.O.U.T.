# Droujko & Molnar 2022 — Open-source low-cost in-situ turbidity sensor

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`droujko-2022`](../sources.md#turbidity-sedimentation--water-quality) · DOI [10.1038/s41598-022-14228-4](https://doi.org/10.1038/s41598-022-14228-4) · 🔓 open access (Scientific Reports)

**What it says.** Builds and field-tests a DIY optical turbidity sensor for river monitoring, with a full
calibration workflow against **formazin** standards, and reports achievable accuracy for a component cost
in the tens of dollars. It documents the practical failure mode of cheap nephelometry: **formazin scatters
light uniformly, but natural sediment does not** — scattering directionality depends on particle size and
shape, so a formazin-calibrated NTU reading does not map cleanly onto field turbidity from real sediment.

**Why it matters to SCOUT.** This is the how-to and the caveat for SCOUT's own turbidity path (SEN0189). It
gives a concrete calibration recipe (formazin dilution ladder, ISO 7027 IR nephelometry at ~850–880 nm) to
attack the open turbidity→NTU question, and it names exactly why the answer is site-dependent — the
particle-size/directionality problem — which is why field turbidity should be reported with its calibration
provenance, not as an absolute truth.

**Caveat / how to use it.** Freshwater river sediment, a different sensor build than SEN0189 — port the
*method and the caveat*, not the coefficients. Any SCOUT NTU calibration must be tied to the actual Hawaii
sediment/optics and re-checked for biofouling drift over a deployment.
