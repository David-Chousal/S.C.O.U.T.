# Environmental Telemetry Methodology

> **Summary** — The science behind the environmental-telemetry pipeline: how SCOUT's
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

## 2. Daily aggregation

DHW and trends operate on **daily** values. Each UTC day is reduced to a mean temperature, but
**only if at least 50 % of the day's samples are present** — a half-empty day would otherwise
inject a biased daily mean straight into the heat-accumulation total. Days below that floor keep
their place on the calendar (so gaps stay visible) but contribute no temperature. Turbidity is
reduced to a daily **median** (robust to spikes) and battery to a daily **minimum** (the
worst-case for power planning).

## 3. Thermal stress — NOAA Coral Reef Watch

SCOUT uses NOAA Coral Reef Watch's (CRW) operational thermal-stress framework, the community
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
mean-absolute-deviation fallback when the MAD degenerates), flagging positive excursions above a
3.5 modified-z threshold (Iglewicz & Hoaglin 1993). Detection runs on the **raw per-sample**
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
- Mann, H. B. (1945). Nonparametric tests against trend. *Econometrica* 13(3), 245–259.
  https://doi.org/10.2307/1907187
