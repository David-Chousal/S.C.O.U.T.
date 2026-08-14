# SCOUT — Coral Bioacoustic Waveform Analysis

**S**anta **C**lara **O**ceanic **U**tility **T**ransmitter

> This document covers the acoustic index pipeline used to assess coral reef health from passive hydrophone recordings. It is one component of the broader SCOUT system and does not describe the full sensor network, data ingestion, or transmission architecture.

---

## Executive Summary

SCOUT monitors coral reef health using passive acoustic recordings and five bioacoustic indices (ACI, BI, NDSI, H, ADI) computed from WAV files. Within a single recording session, recordings are ranked by a PCA-derived Acoustic Quality Score (PC1 of the five standardised indices — see [Reef Health Classification](#reef-health-classification)) and flagged for anthropogenic disturbances via z-score outlier detection. Across sessions, a single PC1 Mann-Kendall trend test — corrected for temporal autocorrelation — detects monotonic decline or recovery in reef acoustic signatures over months to years.

---

## Table of Contents

1. [Bioacoustic Indices](#bioacoustic-indices)
2. [Trend Detection](#trend-detection)
3. [Seasonal Normalization](#seasonal-normalization)
4. [Disturbance Detection](#disturbance-detection)
5. [Reef Health Classification](#reef-health-classification)
6. [Data Sources](#data-sources)
7. [Limitations](#limitations)
8. [Software Dependencies](#software-dependencies)

---

## Bioacoustic Indices

All five indices are computed from WAV files resampled to 22,050 Hz using the [scikit-maad](https://scikit-maad.github.io/) Python library. ACI, BI, and ADI use the amplitude spectrogram; NDSI uses the power spectral density; H uses both the raw signal (temporal entropy) and the amplitude spectrogram (spectral entropy).

### Frequency Band Model

A naive two-band split at 1,000 Hz is ecologically incorrect for coral reef systems. The vast majority of vocalizing reef fishes — groupers, damselfish, squirrelfish — call primarily between 100 Hz and 800 Hz (Tricas & Boyle, 2014; McWilliam et al., 2018), which directly overlaps the anthropogenic band used in the original NDSI formulation. Classifying this range as "anthropogenic" would cause a healthy spawning chorus at 400 Hz to drive NDSI down and falsely trigger the disturbance flag.

SCOUT uses a **three-zone spectrum model** following Duarte et al. (2021):

| Zone | Band | Dominant sources | Role in SCOUT |
|------|------|-----------------|---------------|
| **Anthropogenic** | 0 – 200 Hz | Heavy shipping, industrial machinery | NDSI α component |
| **Mixed** | 200 – 1,000 Hz | Reef fish calls *and* small-vessel engines | Excluded from NDSI; reserved for future fish-chorus index |
| **Biological** | 1,000 – 8,000 Hz | Snapping shrimp (*Alpheidae* spp.), high-frequency fish calls | NDSI β component; BI |

Excluding the mixed band from NDSI makes the index a contrast between *unambiguously anthropogenic* heavy-shipping noise and *unambiguously biological* invertebrate energy. The trade-off is reduced sensitivity to small outboard motors (whose engine harmonics concentrate in 200–1,000 Hz); this is addressed in the [Disturbance Detection](#disturbance-detection) section.

> [Duarte et al., 2021] — "The soundscape of the Anthropocene ocean" — *Science*, 371(6529):eaba4658 — [https://doi.org/10.1126/science.aba4658](https://doi.org/10.1126/science.aba4658)

> [Tricas & Boyle, 2014] — "Acoustic behaviors in Hawaiian coral reef fish communities" — *Marine Ecology Progress Series*, 511:1–16 — [https://doi.org/10.3354/meps10959](https://doi.org/10.3354/meps10959)

> [McWilliam et al., 2018] — "Limitations of passive acoustic monitoring for detecting sublethal effects of noise on fish behaviour" — *Marine Pollution Bulletin*, 136:405–413 — [https://doi.org/10.1016/j.marpolbul.2018.09.041](https://doi.org/10.1016/j.marpolbul.2018.09.041)

---

### ACI — Acoustic Complexity Index

**Definition**: ACI measures the degree of change in sound intensity across adjacent time windows within each frequency band of a spectrogram, then sums these changes across the recording. High variation in the intensity pattern — the hallmark of biological choruses — produces a high ACI. Constant-frequency anthropogenic sounds (engines, motors) produce low ACI because their intensity profile is smooth and repetitive.

$$\text{ACI} = \sum_{k} \sum_{t} \frac{|I_{k,t} - I_{k,t+1}|}{I_{k,\text{total}}}$$

**Ecological interpretation**: ACI is the strongest per-recording proxy for biological activity and reef biodiversity. Declining ACI over months is consistent with reduced species richness and acoustic niche filling — a pattern observed during reef degradation. ACI is robust to recording gain differences between sessions because it uses intensity *ratios* rather than absolute levels.

**Original paper**:
> [Pieretti et al., 2011] — "A new methodology to infer the singing activity of an avian community: The Acoustic Complexity Index (ACI)" — *Ecological Indicators*, 11(3):868–873 — [https://doi.org/10.1016/j.ecolind.2010.11.005](https://doi.org/10.1016/j.ecolind.2010.11.005)

---

### BI — Bioacoustic Index

**Definition**: BI integrates the mean sound pressure level within the biological frequency band (1–8 kHz) across time, producing a scalar measure of biological energy in the recording. Computed from the amplitude spectrogram as the area under the mean spectrum curve within the biological band.

**Ecological interpretation**: BI measures acoustic energy in the 1,000–8,000 Hz invertebrate-dominated band. At this frequency range, snapping shrimp (*Alpheidae* spp.) are the dominant source; BI is therefore primarily a proxy for snapping shrimp density, which correlates strongly with live coral cover and reef structural complexity. BI is intentionally limited to the invertebrate band — fish vocalizations (100–800 Hz) are not included — making it a cleaner indicator of reef structural health than a broadband energy measure. BI shows strong seasonal variation at Sesoko, peaking in the hot season (July–October) when water temperatures maximise invertebrate activity, and is used as secondary confirmation in disturbance detection.

**Original paper**:
> [Boelman et al., 2007] — "Multi-trophic invasion resistance in Hawaii: bioacoustics, field surveys, and airborne remote sensing" — *Ecological Applications*, 17(8):2137–2144 — [https://doi.org/10.1890/07-0004.1](https://doi.org/10.1890/07-0004.1)

---

### NDSI — Normalized Difference Soundscape Index

**Definition**: NDSI measures the ratio of biological-band energy to anthropogenic-band energy, normalized to the range [−1, +1]:

$$\text{NDSI} = \frac{\beta - \alpha}{\beta + \alpha}$$

where $\beta$ is integrated power in the biological band (1,000–8,000 Hz) and $\alpha$ is integrated power in the anthropogenic band (0–200 Hz). The 200–1,000 Hz mixed zone is excluded from both terms. NDSI = +1 indicates a purely biophonic soundscape; NDSI = −1 indicates a purely anthropophonic soundscape.

**Why 0–200 Hz for the anthropogenic band**: Large vessel engines and industrial machinery concentrate acoustic energy below 200 Hz (Duarte et al., 2021). The original NDSI formulation used 0–1,000 Hz, which captures this energy but also encompasses the primary vocal range of most reef fish (100–800 Hz; Tricas & Boyle, 2014). A large, healthy spawning chorus under the original definition would increase $\alpha$, suppress NDSI, and falsely trigger the disturbance alarm. By restricting $\alpha$ to 0–200 Hz, SCOUT ensures that fish choruses raise $\beta$ without inflating $\alpha$, preserving NDSI's meaning as a pollution indicator rather than a fish-activity indicator.

**Ecological interpretation**: NDSI is the primary indicator of heavy anthropogenic noise pressure. A healthy, undisturbed reef consistently achieves NDSI > 0. Sustained negative NDSI drift — even absent acute disturbance events — indicates chronic large-vessel traffic, proximity to industrial operations, or progressive reef simplification. Note that SCOUT's NDSI is intentionally less sensitive to small outboard motors than the classic formulation; see [Disturbance Detection](#disturbance-detection) for how BI compensates for this.

**Original paper**:
> [Kasten et al., 2012] — "The remote environmental assessment laboratory's acoustic library: An archive for studying soundscape ecology" — *Ecological Informatics*, 12:50–67 — [https://doi.org/10.1016/j.ecoinf.2012.01.003](https://doi.org/10.1016/j.ecoinf.2012.01.003)

---

### H — Acoustic Entropy

**Definition**: H is the product of two independent entropy measures:

$$H = H_t \times H_f$$

- **Temporal entropy** ($H_t$): Shannon entropy of the normalized energy envelope over time. Measures how evenly energy is distributed across time steps.
- **Spectral entropy** ($H_f$): Shannon entropy of the normalized mean power spectrum. Measures how evenly energy is distributed across frequency bins.

Both components range [0, 1]; $H$ ranges [0, 1]. A diverse biological soundscape has many sources active at different times and frequencies, producing high entropy. A degraded or noise-dominated soundscape concentrates energy in fewer temporal or spectral niches, lowering entropy.

**Ecological interpretation**: H captures overall soundscape complexity without targeting any specific frequency band. It is complementary to ACI: ACI measures temporal *variability within* frequency bins, while H measures the *distribution* of energy across bins and time. Together they capture different dimensions of the acoustic community structure.

**Original paper**:
> [Sueur et al., 2008] — "Rapid acoustic survey for biodiversity appraisal" — *PLOS ONE*, 3(12):e4065 — [https://doi.org/10.1371/journal.pone.0004065](https://doi.org/10.1371/journal.pone.0004065)

---

### ADI — Acoustic Diversity Index

**Definition**: ADI applies the Shannon diversity index to frequency bands, scoring each band as active if its mean amplitude exceeds a threshold, then computing:

$$\text{ADI} = -\sum_{i} p_i \ln(p_i)$$

where $p_i$ is the proportion of active bands occupied by band $i$.

**Ecological interpretation**: ADI measures the diversity of acoustic niches in use. A species-rich reef, with fish, shrimp, and invertebrates vocalizing across many different frequency ranges simultaneously, produces high ADI. Monodominant soundscapes (e.g., only snapping shrimp) or acoustically degraded sites produce low ADI. ADI is the most direct acoustic analogue to species richness within the soundscape ecology framework.

**Original paper**:
> [Villanueva-Rivera et al., 2011] — "A primer of acoustic analysis for landscape ecologists" — *Landscape Ecology*, 26(9):1233–1246 — [https://doi.org/10.1007/s10980-011-9636-9](https://doi.org/10.1007/s10980-011-9636-9)

---

## Trend Detection

### Why Mann-Kendall

Acoustic indices are non-normally distributed time series with heavy-tailed behaviour from occasional disturbance events. Standard approaches to trend detection — linear regression, Pearson correlation — assume normality and are vulnerable to outliers pulling slope estimates. SCOUT uses the **Mann-Kendall test** (Mann 1945; Kendall 1975) for three reasons:

1. **Non-parametric**: makes no assumption about the distribution of index values.
2. **Monotonic test**: directly answers the ecologically relevant question — "is this reef getting consistently worse or better over time?" — without assuming a specific functional form.
3. **Outlier robustness**: the test statistic $S$ counts the number of concordant vs. discordant pairs of observations. A single extreme outlier (a severe disturbance event) changes at most $n-1$ pairs, not the magnitude of deviation.

### Autocorrelation Correction (Hamed-Rao)

Standard Mann-Kendall assumes temporal independence between observations. Adjacent monthly recordings at the same reef site are almost certainly autocorrelated — a healthy month is likely followed by another healthy month. This inflates the Type I error rate of the uncorrected test (i.e., it finds trends that aren't there).

SCOUT uses the **modified Mann-Kendall test (Hamed & Rao 1998)**, which adjusts the variance of the S-statistic for the autocorrelation structure of the series, producing honest p-values. When the series is perfectly monotonic (a degenerate case where the autocorrelation correction produces numerical NaN), SCOUT falls back to the standard Mann-Kendall test via the `pymannkendall` library.

### Sen's Slope

The **rate of change** is estimated by Sen's slope — the median of all pairwise slopes between observations:

$$\hat{\beta} = \text{median}\left(\frac{x_j - x_i}{j - i}\right) \quad \forall\, j > i$$

Sen's slope is the standard companion estimator to the Mann-Kendall test. It shares the same outlier robustness properties because it uses the median rather than the mean of pairwise slopes. The slope is reported in units of *index-value change per session interval*.

### Significance Thresholds

| p-value | Label |
|---------|-------|
| < 0.05 | significant (increasing/decreasing) |
| 0.05 – 0.10 | marginal (marginal increasing/decreasing) |
| ≥ 0.10 | no trend |

**Statistical power caveat**: With $n = 8$ sessions, the Mann-Kendall test requires $|\tau| \geq 0.64$ for $p < 0.05$ (two-sided). This is a demanding threshold — it requires a near-perfectly monotonic sequence. Results classified as "no trend" should be interpreted cautiously: the absence of a statistically significant trend at $n = 8$ does not rule out a real but moderate decline. Power improves substantially beyond $n = 12$ sessions.

**Primary vs. diagnostic use**: SCOUT's overall reef classification is read directly from a *single* Mann-Kendall test on the PC1 Acoustic Quality Score (see [PC1 Mann-Kendall](#pc1-mann-kendall-primary-method)), not from these per-index results. A legacy tau-weighted voting scheme across ACI, BI, and NDSI (`classify_reef_trend`) is still computed and retained in the diagnostic output — it shows which indices are individually trending — but it no longer determines the overall trajectory label. Because ACI, BI, and NDSI are highly correlated (see [Index Correlation and Snapping Shrimp Dominance](#4-index-correlation-and-snapping-shrimp-dominance)), five simultaneous per-index Mann-Kendall tests are not independent evidence; the Bonferroni-corrected significance threshold per index would be $\alpha = 0.01$ if treated as independent tests, which is why they are reported for context only.

### Key References

> [Mann, 1945] — "Nonparametric tests against trend" — *Econometrica*, 13(3):245–259 — [https://doi.org/10.2307/1907187](https://doi.org/10.2307/1907187)

> [Sen, 1968] — "Estimates of the regression coefficient based on Kendall's tau" — *Journal of the American Statistical Association*, 63(324):1379–1389 — [https://doi.org/10.1080/01621459.1968.10480934](https://doi.org/10.1080/01621459.1968.10480934)

> [Hamed & Rao, 1998] — "A modified Mann-Kendall trend test for autocorrelated data" — *Journal of Hydrology*, 204(1–4):182–196 — [https://doi.org/10.1016/S0022-1694(97)00125-X](https://doi.org/10.1016/S0022-1694(97)00125-X)

> [Hussain & Mahmud, 2019] — "pyMannKendall: a python package for non parametric Mann Kendall family of trend tests" — *Journal of Open Source Software*, 4(39):1556 — [https://doi.org/10.21105/joss.01556](https://doi.org/10.21105/joss.01556)

---

## Seasonal Normalization

### Why Seasonal Bias Matters

Coral reef acoustic activity is not constant across the year. At Sesoko Island (~26°N), biological index values follow a strong seasonal cycle driven by sea surface temperature and species-specific reproductive and behavioral calendars:

- **Snapping shrimp** (*Alpheidae* spp.) — the dominant source of high-frequency reef noise — reduce snapping rate significantly in cooler months when water temperature drops below ~22°C. BI can be 40–65% lower in January than in August at the same healthy site.
- **Nocturnal fish choruses** peak during the summer spawning season (July–September in Okinawa) and are largely absent in winter.
- **Baiu (rainy season, May–June)** brings transitional acoustic patterns as water temperatures rise and summer species become active.

Without correction, a winter recording at a healthy reef will look statistically similar to a summer recording at a degraded reef — the seasonal amplitude shift swamps the health signal.

### Z-Score Normalization Within Season

SCOUT removes seasonal bias by z-scoring each index value *within its season group*:

$$z_{i} = \frac{x_i - \mu_{\text{season}(i)}}{\sigma_{\text{season}(i)}}$$

where $\mu_{\text{season}}$ and $\sigma_{\text{season}}$ are the mean and standard deviation of all sessions in the same season. A z-score of zero means "typical for this time of year." A downward trend in z-scores over time means the reef is performing *increasingly below its seasonal baseline* — a genuine health signal rather than a calendar artifact.

#### Okinawa Season Definitions

Standard northern-hemisphere temperate seasons (winter/spring/summer/fall) do not match the ecological calendar at Sesoko Island. SCOUT uses three biologically meaningful seasons:

| Season | Months | Ecological rationale |
|--------|--------|---------------------|
| **cool** | Nov – Apr | Lower SST; reduced shrimp and fish activity; lowest BI/ACI |
| **baiu** | May – Jun | Rainy season; rapid SST rise; transitional acoustic community |
| **hot** | Jul – Oct | Peak SST; spawning season; highest BI/ACI |

#### Fallback Behaviour

When a season group contains fewer than 2 sessions (insufficient to compute a within-group standard deviation), SCOUT falls back to full-dataset z-scoring using the mean and standard deviation across all sessions. For the 8-session baseline dataset (Aug 2017 – Jul 2018), all three season groups contain 2–3 sessions under the Okinawa calendar, so fallback is not triggered.

A minimum standard deviation floor is applied: $\sigma_{\text{season}} = \max(\sigma_{\text{season}}, 0.01 \times \sigma_{\text{dataset}})$. This prevents near-identical sessions within a season (e.g., two very similar baiu months) from producing artificially extreme z-scores through near-zero division.

### Limitations with < 2 Years of Data

- Each season's z-score baseline is computed from the same observations being tested (in-sample normalization). With $n = 2$ sessions in baiu, each observation contributes 50% to the group mean. This slightly compresses z-score deviations and means the seasonal correction is approximate.
- The seasonal baselines themselves are derived from a single year, so they do not yet represent a stable multi-year climatology for the site.
- Accuracy of the seasonal correction improves linearly with years of data accumulated. At $n \geq 3$ years ($\geq 6$ sessions per season), within-season baselines become reliable.

---

## Disturbance Detection

### Abiotic Contamination Filter

Before any disturbance or health analysis is applied, recordings must be screened for **abiotic contamination** — noise from wind and rain that is physically indistinguishable from anthropogenic disturbance at the index level.

#### Why this matters at 1.5 m depth

At shallow deployment depths, surface weather events dominate the spectrogram:

- **Rain** generates broadband impulsive noise across the full 1–8 kHz band, **artificially inflating BI** even though no biological source is present.
- **Wind-driven surface turbulence** produces low-frequency rumble and surface agitation, **suppressing ACI** by adding a temporally smooth noise floor that reduces the apparent complexity of the biological signal.
- Both effects corrupt NDSI and the PC1 health score in opposite directions simultaneously, producing physically meaningless index values that would bias the session baseline and the longitudinal trend.

#### Primary filter — weather station data

Recordings are cross-referenced against the nearest JMA (Japan Meteorological Agency) weather station observation within a ±30-minute window. Any recording coinciding with:

- **Wind speed > 15 knots**, or
- **Precipitation rate > 2 mm/hr**

is flagged as `abiotic_flag = True` with `abiotic_reason = 'weather_station'` and excluded from the session baseline before health scoring, disturbance detection, and longitudinal aggregation.

The 15-knot and 2 mm/hr thresholds were chosen to exclude events likely to produce surface acoustic energy above the noise floor of the biological band at 1.5 m depth, while retaining recordings taken during light breeze or drizzle that do not significantly affect deep-water acoustic profiles.

#### Fallback filter — acoustic heuristic

When weather station data is unavailable, SCOUT detects the characteristic abiotic signature acoustically. Rain and high wind produce a pattern that is rarely caused by biological activity:

| Signal | Direction | Mechanism |
|--------|-----------|-----------|
| BI | ↑ high z-score (> +1.5σ) | Broadband energy fills the 1–8 kHz band |
| ACI | ↓ low z-score (< −1.5σ, inverted) | Constant noise is temporally smooth → low complexity |
| H | ↑ high z-score (> +1.5σ) | Flat broadband spectrum → high entropy |

All three conditions must be met simultaneously. A healthy shrimp chorus raises BI but also raises ACI (highly variable snapping) and does not elevate H to the same degree, making the triple-trigger robust against false positives from biological activity.

> **Recommendation**: Weather station verification is strongly preferred over the acoustic heuristic. At Sesoko Island, JMA station data is publicly available via the JMA API and should be retrieved for all recording periods.

### Approach

SCOUT flags individual recordings as disturbance events when anthropogenic noise suppresses biological indices below their session-normal range. The two primary indicators are:

- **NDSI**: drops when heavy shipping or industrial noise elevates energy in the 0–200 Hz band, pushing the bio/anthro ratio negative. Because SCOUT restricts the anthropogenic band to 0–200 Hz, NDSI is specifically sensitive to *large-vessel* traffic rather than small outboards. This is intentional — it prevents healthy fish choruses (which produce energy in the 200–1,000 Hz range) from being misclassified as anthropogenic noise.
- **BI**: drops when any broadband noise source (including small outboard motors, whose propeller cavitation extends above 1,000 Hz) masks or suppresses snapping shrimp activity in the biological band. BI therefore provides complementary sensitivity to disturbances that may not be captured by the narrowed NDSI anthropogenic band.

Together, the NDSI + BI combination covers the full disturbance spectrum: NDSI catches large shipping events via the 0–200 Hz signature; BI catches smaller vessels via above-1 kHz masking. Neither alone is sufficient.

### Z-Score Detection

For each session of $n$ recordings:

$$z_{\text{NDSI},i} = \frac{\text{NDSI}_i - \bar{\text{NDSI}}}{\sigma_{\text{NDSI}}} \qquad z_{\text{BI},i} = \frac{\text{BI}_i - \overline{\text{BI}}}{\sigma_{\text{BI}}}$$

A recording is flagged as a disturbance event when either z-score falls below the detection threshold:

$$\text{disturbance\_detected}_i = (z_{\text{NDSI},i} < -2.0) \;\lor\; (z_{\text{BI},i} < -2.0)$$

### Threshold Rationale (−2.0σ)

Under a normal distribution, −2.0σ corresponds to approximately 2.3% of observations. With 20 recordings per session, this gives an expected false-positive rate of **0.46 recordings per session** on clean, undisturbed data. The previous threshold of −1.5σ (~6.7% per index, OR logic) produced 2–3 false flags per session, rendering the disturbance flag too noisy to be actionable.

The −2.0σ threshold is consistent with standard practice for acoustic anomaly detection in passive monitoring systems (Merchant et al., 2015).

### Disturbance Score

Each recording receives a continuous `disturbance_score` ∈ [0, 1] reflecting the combined strength of both signals:

$$\text{score}_i = 0.6 \times \text{clip}\!\left(\frac{-z_{\text{NDSI},i}}{2.0}, 0, 1\right) + 0.4 \times \text{clip}\!\left(\frac{-z_{\text{BI},i}}{2.0}, 0, 1\right)$$

**Weighting rationale (0.6 / 0.4)**:
- NDSI receives the higher weight because it captures *both* the drop in biological energy *and* the rise in anthropogenic energy simultaneously, making it a more complete disturbance signature than BI alone.
- BI contributes secondary confirmation. A boat passing at sufficient distance may primarily affect the low-frequency NDSI ratio while only marginally suppressing BI.
- A score of 1.0 corresponds to both indices simultaneously reaching −2.0σ, representing a strong, unambiguous disturbance event.

### Reference

> [Merchant et al., 2015] — "Measuring acoustic habitats" — *Methods in Ecology and Evolution*, 6(3):257–265 — [https://doi.org/10.1111/2041-210X.12330](https://doi.org/10.1111/2041-210X.12330)

---

## Reef Health Classification

SCOUT classifies reef health at two temporal scales.

### Per-Recording Classification (Within Session)

#### Why not heuristic weights?

The previous version of SCOUT used a weighted linear composite (ACI: 0.30, BI: 0.25, NDSI: 0.20, H: 0.15, ADI: 0.10). This approach has a fundamental flaw: ACI, BI, and NDSI are all dominated by snapping shrimp (*Alpheidae* spp.) activity in the 1–8 kHz band and are therefore highly intercorrelated. Assigning independent weights to correlated variables does not separate distinct ecological signals — it amplifies the dominant covariance structure (shrimp density) three times while suppressing the less-correlated indices (H, ADI) that carry distinct information about acoustic diversity and complexity. The composite was effectively a 75%-weighted snapping shrimp counter (Bradfer-Lawrence et al., 2019; Bohnenstiehl et al., 2018).

#### PCA-based Acoustic Quality Score

SCOUT replaces the weighted composite with the **first principal component (PC1)** of the five standardised indices. PCA finds the direction of maximum variance across the five indices without requiring arbitrary weight assignment, and naturally accounts for their covariance structure.

**Procedure:**

1. **Standardise** all five indices to zero mean and unit variance within the session, making them dimensionally comparable regardless of their native scales.

2. **Decompose** the standardised matrix via thin SVD:
$$\mathbf{X}_{\text{std}} = \mathbf{U} \boldsymbol{\Sigma} \mathbf{V}^\top$$

3. **Extract PC1 scores** as $\mathbf{u}_1 \sigma_1$ — each recording's coordinate along the dominant acoustic axis.

4. **Sign-correct**: SVD is sign-ambiguous. PC1 is flipped if necessary so that ACI, BI, and NDSI all load positively — ensuring higher `health_score` always corresponds to higher biological activity.

**Outputs per recording:**

| Column | Type | Description |
|--------|------|-------------|
| `health_score` | float | PC1 coordinate. Centred near 0; no fixed upper bound. Higher = healthier. |
| `health_label` | str | `improving` / `stagnant` / `declining` relative to session median ± 0.5σ |
| `pc1_variance_explained` | float | Fraction of total index variance captured by PC1. Values > 0.60 confirm strong index covariance (shrimp dominance). |
| `{idx}_loading` | float | PC1 loading for each index — shows which indices drive the score this session. |

**Classification** remains relative to the session PC1 distribution:

| Condition | Label |
|-----------|-------|
| score ≥ median + 0.5σ | `improving` |
| score ≤ median − 0.5σ | `declining` |
| otherwise | `stagnant` |

> **Important**: these labels are **session-local comparisons only**. PCA is fitted independently for each session. A recording labeled `improving` in one session may have lower absolute index values than one labeled `declining` in a different session. `health_score` and `health_label` must not be compared across sessions.

**References:**

> [Bradfer-Lawrence et al., 2019] — "Guidelines for the use of acoustic indices in environmental research" — *Methods in Ecology and Evolution*, 10(10):1796–1807 — [https://doi.org/10.1111/2041-210X.13254](https://doi.org/10.1111/2041-210X.13254)

> [Bohnenstiehl et al., 2018] — "Investigating the utility of ecoacoustic metrics in marine soundscapes" — *Journal of Ecoacoustics*, 2(2):R1156L — [https://doi.org/10.22261/JEA.R1156L](https://doi.org/10.22261/JEA.R1156L)

### Multi-Session Trend Classification (Longitudinal)

#### Why not vote across ACI, BI, and NDSI?

Running three separate Mann-Kendall tests and aggregating via a voting scheme has the same flaw as the old heuristic composite score: ACI, BI, and NDSI are correlated, all driven by snapping shrimp activity. Three votes from correlated tests are not three independent lines of evidence — a single shrimp population change moves all three simultaneously. A voting threshold also introduces an arbitrary tuning parameter with no statistical grounding.

#### PC1 Mann-Kendall (primary method)

SCOUT fits a **single global PCA** on the $n_{\text{sessions}} \times 5$ index matrix, projects each session onto PC1, and runs **one** modified Mann-Kendall test on that scalar time series. This eliminates the voting scheme and its threshold entirely.

**Procedure:**

1. **Fit global PCA** on all sessions pooled. All sessions share the same PC1 axis, making their scores directly comparable across time.

2. **Project** each session onto PC1 to obtain an *Acoustic Quality Score* per session.

3. **Seasonally z-score** the PC1 time series within Okinawa's three seasons (hot / baiu / cool) to remove natural amplitude cycles before testing.

4. **Run one MK test** (Hamed-Rao autocorrelation-corrected) on the PC1 series.

**Classification** is read directly from the single MK result — no threshold required:

| PC1 MK trend | Label |
|---|---|
| `decreasing` or `marginal decreasing` | `declining` |
| `increasing` or `marginal increasing` | `improving` |
| `no trend` | `stagnant` |

**Outputs reported:**

| Field | Description |
|-------|-------------|
| `var_explained` | Fraction of total index variance in PC1. Values > 0.60 confirm shrimp dominance. |
| `loadings` | Each index's contribution to PC1 — the ecological driver of the trend. |
| `tau` | Kendall's τ effect size [−1, +1]. |
| `p_value` | Autocorrelation-corrected p-value (Hamed-Rao 1998). |
| `slope` | Sen's slope in PC1 units per session interval. |

**Diagnostic output**: per-index MK results for all five indices are still computed and printed separately. They do not determine the overall classification but show *which* indices are changing — useful when the PC1 result needs ecological interpretation (e.g., to distinguish a BI-only drop from a broad ACI+BI+NDSI decline).

Both raw-PC1 and seasonally z-scored PC1 results are reported. The seasonally corrected result is the recommended primary output when ≥ 2 full years of data are available.

---

## Data Sources

### Sesoko Island Acoustic Dataset

All baseline analyses use passive acoustic recordings from **Sesoko Island, Okinawa, Japan** (~26°38'N, 127°52'E), a subtropical coral reef system in the East China Sea.

| Parameter | Value |
|-----------|-------|
| Site | Site A |
| Depth | 1.5 m |
| Recording window | 00:00 – 00:20 local time (midnight) |
| Files per session | 5 × 5-minute recordings |
| Sessions | 8 (Aug 2017 – Jul 2018) |
| Sample rate | 22,050 Hz (resampled from native) |
| Filename format | `SSK_Site_A_YYYYMMDD_HHMMSS.wav` |

**Why midnight recordings?** The Aug 2017 – Jul 2018 continuous-recording months provide both midnight and dusk data, but the earlier sessions (Jun–Jul 2017) recorded only at dusk. Using midnight gives a consistent time-of-day baseline across all 8 sessions, avoiding confounds from diel variation in reef acoustic activity.

> **Dataset citation**: Lin, T.H., Akamatsu, T., Sinniger, F., & Harii, S. (2023). *Coral Reef Soundscapes off Sesoko Island, Okinawa, Japan* [Data set]. Depositar. [https://data.depositar.io/en/dataset/coral-reef-sesoko](https://data.depositar.io/en/dataset/coral-reef-sesoko)
>
> **Associated data paper**: Lin, T.H., Akamatsu, T., Sinniger, F., & Harii, S. (2021). "Exploring coral reef biodiversity via underwater soundscapes." *Biological Conservation*, 253:108901 — [https://doi.org/10.1016/j.biocon.2020.108901](https://doi.org/10.1016/j.biocon.2020.108901)

### Soundscape Ecology Framework References

> [Pijanowski et al., 2011] — "Soundscape Ecology: The Science of Sound in the Landscape" — *BioScience*, 61(3):203–216 — [https://doi.org/10.1525/bio.2011.61.3.6](https://doi.org/10.1525/bio.2011.61.3.6)

> [Staaterman et al., 2014] — "Celestial patterns in marine soundscapes" — *Marine Ecology Progress Series*, 508:17–32 — [https://doi.org/10.3354/meps10911](https://doi.org/10.3354/meps10911)

> [Kennedy et al., 2010] — "Acoustic monitoring of habitat disturbance and recovery in coral reefs" — *Proceedings of the Royal Society B*, 277:969–977 — [https://doi.org/10.1098/rspb.2009.1969](https://doi.org/10.1098/rspb.2009.1969)

---

## Limitations

### 1. Single Year of Baseline Data

The longitudinal pipeline currently spans 8 months (Aug 2017 – Jul 2018), providing one data point per season under the Okinawa calendar. Key consequences:

- **Statistical power**: Mann-Kendall requires $|\tau| \geq 0.64$ for $p < 0.05$ at $n = 8$. Real moderate declines (e.g., 20% reduction in BI over 8 months) may not reach statistical significance. Absence of a significant trend is not evidence of reef stability; it reflects data scarcity.
- **Seasonal baselines are approximate**: With 2–3 sessions per season, each observation contributes substantially to the baseline used to normalize it. As SCOUT accumulates data, seasonal corrections converge toward reliable multi-year climatologies.
- **No inter-annual comparison**: The current dataset cannot distinguish a seasonal pattern from a genuine multi-year trend. A true monotonic decline would require at least 2–3 years of monthly recordings to achieve reliable detection.

### 2. Single Depth and Site

All data are from Site A at 1.5 m depth. This introduces several constraints:

- **Surface bias**: 1.5 m recordings are dominated by the snapping shrimp layer and surface-water fish communities. Deeper reef communities (coral base, cryptic fauna at 5–15 m) are not represented.
- **No spatial replication**: indices reflect local conditions at one point on the reef. Spatial heterogeneity in reef health (patchy bleaching, localized boat anchoring damage) will not be captured.
- **Depth comparison**: a multi-depth analysis — Site A (1.5 m) vs. Site B (20 m) — is implemented (`compare_sites.py`, `site_comparison.png`). It scores each site independently through the same PCA health-score and disturbance-detection pipeline and reports side-by-side index means, health-label distributions, and disturbance counts. It is a snapshot comparison, not a paired depth-controlled trend: the two sites are processed independently rather than as simultaneous same-session recordings, so observed differences may reflect depth-dependent acoustic propagation, site-specific ecology, or recording-date offsets rather than depth alone.

### 3. No Ground Truth Validation

SCOUT's health scores and trend labels have not yet been validated against independent reef health metrics (benthic surveys, fish counts, bleaching records). Specifically:

- The choice of which five indices feed the PCA (ACI, BI, NDSI, H, ADI) is based on literature review and expert judgement, not site-specific calibration.
- The `health_label` classification thresholds (±0.5σ from median) are heuristic.
- Disturbance detection has not been validated against annotated ground-truth boat passages or noise events.

Validation against co-located benthic transect surveys or remote sensing bleaching data would substantially increase the scientific credibility of the pipeline's outputs.

### 4. Index Correlation and Snapping Shrimp Dominance

ACI, BI, and NDSI are all strongly driven by snapping shrimp (*Alpheidae* spp.) activity in the 1–8 kHz band. As Bohnenstiehl et al. (2018) and Bradfer-Lawrence et al. (2019) note, multiple standard acoustic indices often act as redundant "shrimp counters" rather than independent ecological signals.

**What PCA addresses**: the per-session `health_score` now uses PC1, which correctly treats the shared shrimp-driven variance as a single dimension rather than triple-counting it. The `pc1_variance_explained` column quantifies how much of the total index variance collapses onto this first axis — values above 0.60 confirm the shrimp-dominance hypothesis for that session.

**What PCA does not address**: fish diversity information, encoded primarily in the 200–1,000 Hz mixed band, is not yet used in any SCOUT metric. PC1 still captures predominantly invertebrate (snapping shrimp) activity; a dedicated fish-chorus index derived from the mixed band would add an independent ecological dimension to PC1, partially decoupling the longitudinal trend signal from shrimp density alone. Per-index MK results remain in the diagnostic output and are still run as five correlated tests — but they no longer determine the overall classification, so the multiple-testing inflation is now a reporting concern rather than a methodological one.

**Roadmap — Fish-Chorus Index (200–1,000 Hz):** Two candidate metrics for when this work is ready:

- **Chorus Ratio (CR)**: ratio of time bins with chorus activity above a noise floor to total time bins within the 200–1,000 Hz band. Sensitive to diel and seasonal spawning events and requires no frequency-specific species identification. See Staaterman et al. (2014) for methodology.
- **Band-limited ACI (ACI_fish)**: the standard ACI algorithm applied only to the 200–1,000 Hz rows of the amplitude spectrogram, isolating the temporal complexity of fish calls from the invertebrate-dominated 1–8 kHz band.

Either metric would enter the PCA as a sixth, largely uncorrelated index, giving PC1 a genuine fish-diversity dimension alongside the existing invertebrate signal.

> [Staaterman et al., 2014] — "Celestial patterns in marine soundscapes" — *Marine Ecology Progress Series*, 508:17–32 — [https://doi.org/10.3354/meps10911](https://doi.org/10.3354/meps10911)

### 5. Abiotic Filter Dependency on External Data

The primary abiotic contamination filter requires weather station data co-located in time with each recording session. When this data is unavailable, the acoustic heuristic fallback is used, which has two limitations:

- It can only detect contamination that is extreme enough to move BI, ACI, and H all beyond ±1.5σ simultaneously within the session. Moderate rain (heavy drizzle, not downpour) may partially contaminate recordings without triggering all three conditions.
- It is a within-session z-score test, so if an entire session was recorded during sustained rain, all recordings shift together and none appear anomalous relative to each other. This is precisely the scenario where the acoustic heuristic fails and weather station data is essential.

For the current Sesoko Island dataset (midnight recordings, Aug 2017 – Jul 2018), weather data has not yet been integrated. All sessions should be treated as potentially susceptible to undetected abiotic contamination until JMA records for those nights are retrieved and cross-referenced.

### 6. Acoustic Index Sensitivity to Recording Conditions

All indices are sensitive to recording gain, hydrophone placement, and instrument noise. The pipeline assumes consistent recording conditions across sessions. Variation in hydrophone depth (even ±10 cm at 1.5 m) or recorder gain settings between deployment periods could introduce artificial trends unrelated to reef health. Gain-normalized BI (using a reference pressure level) would partially address this.

---

## Software Dependencies

| Library | Purpose | Reference |
|---------|---------|-----------|
| [scikit-maad](https://scikit-maad.github.io/) | Acoustic index computation | [Ulloa et al., 2021](https://doi.org/10.1111/2041-210X.13711) |
| [pymannkendall](https://github.com/mmhs013/pyMannKendall) | Modified Mann-Kendall tests | [Hussain & Mahmud, 2019](https://doi.org/10.21105/joss.01556) |
| [scipy](https://scipy.org/) | Signal processing, spectrograms | [Virtanen et al., 2020](https://doi.org/10.1038/s41592-019-0686-2) |
| [numpy](https://numpy.org/) | Numerical computation | [Harris et al., 2020](https://doi.org/10.1038/s41586-020-2649-2) |
| [pandas](https://pandas.pydata.org/) | Tabular data management | [McKinney, 2010](https://doi.org/10.25080/Majora-92bf1922-00a) |
| [matplotlib](https://matplotlib.org/) | Visualization | [Hunter, 2007](https://doi.org/10.1109/MCSE.2007.55) |

> Ulloa, J.S., Haupert, S., Latorre, J.F., Aubin, T., & Sueur, J. (2021). "scikit-maad: An open-source and modular toolbox for quantitative soundscape analysis in Python." *Methods in Ecology and Evolution*, 12(12):2334–2340. [https://doi.org/10.1111/2041-210X.13711](https://doi.org/10.1111/2041-210X.13711)

---

*Last updated: 2026-06-03. SCOUT is under active development. Methodology is subject to revision as additional data are collected and validation analyses are completed.*
