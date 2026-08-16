# Environmental Telemetry Methodology

> **Summary** — The science behind the environmental-telemetry pipeline: how S.C.O.U.T.'s
> temperature, turbidity, and battery records become quality-controlled daily series, NOAA
> Coral Reef Watch thermal-stress metrics (HotSpot, Degree Heating Weeks, bleaching alert
> levels), monotonic trends, and turbidity anomaly flags.
>
> Implementation: [`analytics/telemetry/`](../../analytics/telemetry). This is the environmental
> counterpart to the [Coral Bioacoustic Methodology](coral-bioacoustic-methodology.md).

---

## Scope and inputs

The pipeline consumes the CSV defined in the
[On-Board CSV Data Schema](../engineering/data-schema.md) — whether read from a retrieved SD
card or from the LoRa shore stream — and analyzes the **environmental** signals: water
temperature, turbidity, and battery state-of-health. Acoustic data is handled separately.

Per [ADR-0003](../decisions/0003-single-point-sensing.md) the buoy carries one temperature and
one turbidity sensor, so there is no depth dimension here — every series is single-point.

## 1. Quality control

Thermal-stress accumulation and trend tests are both biased by undetected gaps and bad
readings, so QC runs first and only *measures* — it never silently drops or interpolates data.
It reports: record count and span, **data completeness** against the expected 30-minute cadence
([EDD](../engineering/engineering-design-document.md)), gaps (any interval > 1.5 duty cycles)
and the implied missing-sample count, duplicate timestamps, physically implausible readings
(seawater temperature outside −5…45 °C; turbidity ADC outside 0…4095), and a tally of firmware
flags.

### 1a. Per-channel sensor tests (QARTOD)

Completeness and range checks catch missing or impossible data; they do not catch a sensor that
is failing while still reporting plausible numbers. Each channel therefore also gets the two
**IOOS QARTOD** tests aimed at the instrument rather than the water:

| Test | Catches | Thresholds |
|---|---|---|
| Flat-line | A stuck or saturated channel repeating one value | Suspect at 6 consecutive equal samples (≈ 3 h), fail at 12 (≈ 6 h) |
| Rate-of-change | A step too large to be physical, vs. the SD of a 25 h rolling window | Suspect beyond 3 σ |

QARTOD deliberately leaves both to the operator; the counts above are set for the 30-minute
cadence. Real reef water at the DS18B20's 0.0625 °C resolution can hold steady for an hour or
two overnight, so shorter flat-line counts would flag calm water as a broken sensor.

Rate-of-change runs on **temperature only**. Turbidity's excursions — runoff, resuspension —
are genuinely abrupt, so an n-sigma step rule flags weather rather than faults: on the 30-day
shore sample it marked ~12 % of turbidity samples and 0 % of temperature. Turbidity excursions
are already detected in §4 with a purpose-built robust statistic, so running both would
double-report the same events with weaker math. The turbidity channel keeps the flat-line test
(which catches a saturated fouled sensor) and the drift screen below. A sample the test could
not judge — the first sample, one following a gap, or a window too small or too flat to give a
usable spread — is reported as *not evaluated* rather than silently passed.

### 1b. Biofouling drift screen

Biofilm micrometers thick on an optical window biases a moored turbidity sensor, and the bias
grows over weeks (Manov et al. 2004). This is the failure mode
[stakeholder interviews](../research/stakeholder-interviews.md) flagged as the top risk for a
1+ year deployment, and it defeats every test above: each individual reading is in range,
unchanging, and smooth. Worse, the drift is **monotonic**, so it is indistinguishable from a
real creeping-turbidity trend to the Mann-Kendall test in §5 — which will report it as
`increasing` with high confidence.

The discriminator is the **daily clean-water reading**: the 90th percentile of each day's
turbidity samples, approximating the clearest water the sensor saw that day. A *high*
percentile because a higher ADC count is clearer water — see the polarity note in §4. Genuine
turbidity is *episodic*: events pull readings down and they settle back, leaving the day's
clearest reading where it was. Fouling instead moves that clearest reading itself, because a
coated window can no longer transmit clean water as clean. That series is tested for monotonic
change with the same Mann-Kendall machinery as everything else.

Following Manov et al.'s cross-comparison method, the daily temperature series is the
independent, non-optical reference — the DS18B20 is sealed and does not suffer optical-window
fouling. Verdicts:

| Verdict | Condition |
|---|---|
| Insufficient data | Fewer than 14 usable days — fouling is a weeks-scale process |
| No drift detected | The clean-water reading is stationary; variation is episodic |
| Suspect | It is marginally trending, **or** it trends while temperature also trends (a real regime change may explain it; one buoy cannot separate the two) |
| Likely | It trends while the reference channel is stationary — a shift with no environmental correlate |

**Detection stays direction-agnostic, but the direction is interpreted.** Fouling attenuates
light, so it drives the clean-water reading **down**; that is reported as *consistent with
fouling*. A *rise* is still flagged, because the analog front end is not yet designed
(tracked as SCO-47; ADR-0002 is the charging path, not this) and an inverting stage there would flip
the sign — but it is reported as *inconsistent with fouling*, pointing instead at a cleaned or
swapped sensor, a wiring change, or exactly that inverting front end.

This screen reports; it never corrects. It is a *screen*, not proof: a lone buoy carries no
clean reference sensor, so a genuine long-term turbidity change cannot be fully separated from
instrument drift. Closing that gap is tracked as SCO-20.

## 2. Daily aggregation

DHW and trends operate on **daily** values. Each UTC day is reduced to a mean temperature, but
**only if at least 50 % of the day's samples are present** — a half-empty day would otherwise
inject a biased daily mean straight into the heat-accumulation total. Days below that floor keep
their place on the calendar (so gaps stay visible) but contribute no temperature. Turbidity is
reduced to a daily **median** (robust to spikes) and battery to a daily **minimum** (the
worst-case for power planning).

## 3. Thermal stress — NOAA Coral Reef Watch

S.C.O.U.T. uses NOAA Coral Reef Watch's (CRW) operational thermal-stress framework, the community
standard for anticipating mass bleaching (Liu et al. 2014; Skirving et al. 2020).

- **MMM (Maximum Monthly Mean).** The warmest of the twelve climatological monthly-mean SSTs
  for the site. It is derived from a long baseline climatology (CRW's spans 1985–2012+), **not**
  from a short deployment, so it is a **required input** to the pipeline — supply the site's CRW
  MMM. For the Hawaii deployment, read it from the CRW 5 km product for the deployment cell.
- **Bleaching threshold** = MMM + 1 °C. Sustained temperature above this drives stress.
- **HotSpot** = max(0, daily SST − MMM): the positive thermal anomaly.
- **Degree Heating Weeks (DHW)** = the trailing-**12-week** (84-day) accumulation of daily
  HotSpots that are **≥ 1 °C**, in °C-weeks: `DHW = Σ(HotSpot ≥ 1 over 84 days) / 7`.
- **Bleaching Alert Level** (requires a *current* HotSpot ≥ 1 °C for Warning and above):

  | Level | Condition | Meaning |
  |---|---|---|
  | No Stress | HotSpot ≤ 0 | at/below MMM |
  | Bleaching Watch | 0 < HotSpot < 1 | warm, not yet stressful |
  | Bleaching Warning | HotSpot ≥ 1, DHW < 4 | stress accumulating |
  | Alert Level 1 | HotSpot ≥ 1, 4 ≤ DHW < 8 | significant bleaching likely |
  | Alert Level 2 | HotSpot ≥ 1, DHW ≥ 8 | severe bleaching + mortality likely |

**Caveats, stated plainly:**
- *Diurnal bias.* CRW builds daily SST from **nighttime** satellite retrievals to suppress skin
  warming. A shallow surface buoy sees a real diurnal cycle, so the daily-mean SST used here can
  run slightly warm relative to CRW. Prefer a nighttime daily aggregate for direct CRW
  comparison. The pipeline exposes daily coverage so this is auditable.
- *Gap bias.* DHW over a window with missing days sums only the days present, biasing it low;
  the pipeline reports each day's `window_coverage` so the bias is visible, not hidden.
- *MMM dependency.* Results are only as good as the supplied MMM.

## 4. Turbidity

The SEN0189 is **uncalibrated** (raw ADC/volts, not NTU — see the data-schema open questions),
so absolute water-quality thresholds are not defensible. The pipeline instead detects
**relative** turbidity events (runoff, resuspension, sediment plumes) against the deployment's
own robust baseline using the **Iglewicz–Hoaglin modified z-score** (median + MAD, with a
mean-absolute-deviation fallback when the MAD degenerates), flagging excursions beyond a 3.5
modified-z threshold (Iglewicz & Hoaglin 1993).

**Polarity — a dirtier reading is a lower number.** The SEN0189 measures transmittance, so its
output *falls* as turbidity rises: *"the output value will decrease when in liquids with a high
turbidity"* (DFRobot datasheet), with clear water (< 0.5 NTU) at ≈ 4.1 V. The firmware logs raw
`analogRead` with no inversion, so a sediment plume is a **dip** in `turbidity_adc`. Detection
therefore flags **negative** excursions. Until 2026-08-15 it flagged positive ones and was
reporting each day's clearest water as a plume; see
[Data Schema → Turbidity polarity](../engineering/data-schema.md) for the full convention and
the non-inverting requirement it places on the analog front end.

Detection runs on the **raw per-sample**
series, not the daily median, so short sub-daily events are not smoothed away. Converting to
NTU requires a calibration curve against turbidity standards — a documented follow-up.

## 5. Trends

Long-term drift in daily temperature and turbidity is tested with the **Mann-Kendall** test:
non-parametric (no normality assumption on environmental distributions), robust to outliers
(a single storm day won't swing it), and a direct test for a *monotonic* change — the shape
slow warming takes. Because environmental series are strongly autocorrelated (which inflates
naive significance), the **Hamed & Rao (1998)** autocorrelation-corrected variant is used when
`pymannkendall` is available; otherwise a self-contained, tie-corrected original test is used.
**Sen's slope** (1968) gives the magnitude (per day and per year). Statistical power is limited
early in a deployment — expect "no trend" or "marginal" until enough days accumulate.

## Implementation notes

The scientific core (QC, aggregation, DHW, turbidity, and a pure-Python Mann-Kendall + Sen's
slope) depends on **the Python standard library only**, so it runs and is unit-tested with no
scientific stack and can execute on a bare Raspberry Pi. `pymannkendall` (better trend test)
and `matplotlib` (dashboard) are optional accelerators.

## Limitations

- Short deployment baseline limits trend power and cannot itself establish an MMM.
- Turbidity is relative, not absolute (uncalibrated).
- Single-point sensing ([ADR-0003](../decisions/0003-single-point-sensing.md)) — no depth
  structure.
- Daily-mean vs CRW nighttime SST introduces a small warm bias in DHW.
- Biofouling drift is *screened*, not measured or corrected — with no clean reference sensor on
  a lone buoy, a genuine long-term turbidity change and instrument drift cannot be fully
  separated (SCO-20).
- Turbidity polarity is settled from the datasheet (higher ADC = clearer water) but has not yet
  been confirmed on a bench with the actual sensor and front end; that confirmation rides along
  with the NTU calibration in SCO-12.

## References

- Liu, G., Strong, A. E., Skirving, W., et al. (2014). Reef-scale thermal stress monitoring of
  coral ecosystems: new 5-km global products from NOAA Coral Reef Watch. *Remote Sensing*
  6(11), 11579–11606. https://doi.org/10.3390/rs61111579
- Skirving, W., Marsh, B., De La Cour, J., et al. (2020). CoralTemp and the Coral Reef Watch
  coral bleaching heat stress product suite version 3.1. *Remote Sensing* 12(23), 3856.
  https://doi.org/10.3390/rs12233856
- Hamed, K. H. & Rao, A. R. (1998). A modified Mann-Kendall trend test for autocorrelated data.
  *Journal of Hydrology* 204(1–4), 182–196. https://doi.org/10.1016/S0022-1694(97)00125-X
- Sen, P. K. (1968). Estimates of the regression coefficient based on Kendall's tau. *Journal
  of the American Statistical Association* 63(324), 1379–1389.
  https://doi.org/10.1080/01621459.1968.10480934
- Iglewicz, B. & Hoaglin, D. C. (1993). *How to Detect and Handle Outliers.* ASQC Quality Press.
- Manov, D. V., Chang, G. C. & Dickey, T. D. (2004). Methods for reducing biofouling of moored
  optical sensors. *Journal of Atmospheric and Oceanic Technology* 21(6), 958–968.
  https://doi.org/10.1175/1520-0426(2004)021%3C0958:MFRBOM%3E2.0.CO;2
- U.S. Integrated Ocean Observing System (2017). *Manual for Real-Time Quality Control of
  In-Situ Optical Observations.* https://doi.org/10.25923/v9p8-ft24
- Mann, H. B. (1945). Nonparametric tests against trend. *Econometrica* 13(3), 245–259.
  https://doi.org/10.2307/1907187
