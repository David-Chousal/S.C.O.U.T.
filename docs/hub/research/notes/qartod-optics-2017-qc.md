# IOOS QARTOD 2017 — Real-time QC for optical (turbidity) data

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`qartod-optics-2017`](../sources.md#data-quality--sensor-integrity) · DOI [10.25923/v9p8-ft24](https://doi.org/10.25923/v9p8-ft24) · 🔓 open (NOAA / U.S. IOOS)

**What it says.** The U.S. IOOS QARTOD (Quality Assurance/Quality Control of Real-Time Oceanographic Data)
standard for optical observations — turbidity, chlorophyll fluorescence, backscatter. It specifies a
battery of automated real-time flags (gross range, spike, rate-of-change, flat-line/"stuck sensor",
timing/gap, climatology) and names **biofouling and calibration drift as the central data-quality
challenges** the QC is meant to surface. Data get standard flags (pass / not-evaluated / suspect / fail).

**Why it matters to SCOUT.** This is the off-the-shelf standard SCOUT's [`qc.py`](../../../../analytics/telemetry/qc.py)
should implement, and adopting it is what makes SCOUT's data *credible and interoperable* with the reef-
science community rather than a bespoke pipeline. Concretely: the **flat-line and rate-of-change tests
catch a stuck or drifting fouled sensor**, and the standard flag vocabulary gives every downstream
consumer a shared meaning. It converts "we should detect biofouling" into a named, implementable checklist
that pairs directly with [`manov-2004`](manov-2004-biofouling-optical-drift.md)'s cross-comparison idea.

**Caveat / how to use it.** QARTOD is real-time **gross** QC — it *flags* suspect data, it does not
*correct* drift; delayed-mode recalibration and the turbidity→NTU work ([`droujko-2022`](droujko-2022-turbidity-sensor.md))
are still needed. Thresholds (gross range, spike size) must be set per SCOUT site and sensor, and there are
sibling QARTOD manuals for temperature that apply to the DS18B20 channel.
