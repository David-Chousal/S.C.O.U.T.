# Design System — Data Visualization

> **Summary** — How S.C.O.U.T. draws buoy telemetry honestly: colour scales, units, time axes,
> gaps, freshness, uncertainty, and the three-slots-a-day packet. Applies to the web dashboard
> (`analytics/telemetry/web.py`, `fleet_web.py`) **and** the matplotlib exports
> (`analytics/telemetry/dashboard.py`), which today use a separate Flat UI palette.
>
> **Status** — Proposed 2026-10-19. Part of [Design System](design-system.md).

---

## The honesty principle

The buoy samples every 30 minutes, keeps the full record on board, and sends **one 44-byte
packet with the latest reading in each of three fixed slots: 00:10, 08:10 and 16:10 UTC**
([`facts.md`](../hub/facts.md), `firmware/README.md`). Packets are repeated blindly and never
acknowledged, so some will be lost. The dashboard is republished per publish, not streamed.

Every chart therefore shows **what arrived, when it arrived, and what did not** — and never
implies a continuous stream. Concretely:

1. A point marker on every value that came off the radio.
2. Lines break at missing days. Only a **single** missing day between two measured days is
   bridged, by a faint dashed line labelled "Estimated"; longer gaps are never bridged.
3. Every chart and KPI carries a freshness line ("received 16:10 UTC") and the page carries
   its publish time.
4. The on-board record is described as the full record; the dashboard as a sample of it.
5. Sample (synthetic) data is always bannered.

## Colour use

### Which scale for which job

| Job | Scale | Why |
|---|---|---|
| One variable's line over time | Variable identity colour | Each variable keeps one colour site-wide |
| Temperature as a field (heat strip, calendar) | cmocean `thermal`, 0.00–0.88 | Perceptually uniform; the oceanographic convention for temperature |
| Turbidity as a field | cmocean `turbid`, 0.22–1.00, **dark = murkier** | Brown sediment metaphor; light end trimmed so it does not vanish on sand |
| Anomaly vs a baseline (e.g. vs MMM) | cmocean `balance`, centred on 0 | Diverging; the neutral midpoint is meant to dissolve into the canvas |
| Up to five unrelated series (acoustic indices) | Categorical (Okabe–Ito, re-lit) | CVD-safer, ≥ 3:1 on canvas |
| Bleaching alert level | NOAA alert ramp | NOAA's own semantics, extended to Level 5 |
| Instrument freshness | Status colours + glyphs | Quiet, never confused with reef alerts |

Rainbow and jet colour maps are never used ([Crameri et al. 2020](https://doi.org/10.1038/s41467-020-19160-7)).

### Variable identity

| Variable | Token | Hex | On canvas | Line style |
|---|---|---|---|---|
| Water temperature | `--data-temp` (cmocean `thermal` 0.50) | `#b15f82` | 3.95:1 | Solid 2 px |
| Turbidity | `--data-turb` (cmocean `turbid` 0.60) | `#8a5e3a` | 5.09:1 | Solid 2 px |
| Degree Heating Weeks | `--color-text` | `#2b2520` | 13.73:1 | Solid 2 px over alert bands |
| Battery, SoH (instrument health) | `--data-instrument` (`stone-700`) | `#534c45` | 7.66:1 | Dashed 2 px — instrument, not environment |
| Climatology / MMM reference | `stone-500` | `#867f78` | 3.58:1 | Dashed 1 px, direct-labelled |
| Bleaching threshold (MMM + 1 °C) | `alert-alert1` | `#d03929` | 4.43:1 | Dashed 1 px, direct-labelled |

Temperature is deliberately **not** red or orange: warm hues belong to the NOAA heat-stress scale,
so a temperature line in red would read as an alert on every normal day.

### Sequential and diverging stops (sampled from cmocean)

| Scale | 7 stops |
|---|---|
| `thermal` 0.00–0.88 | `#042333` `#21348a` `#664397` `#995889` `#d16a6f` `#f78c45` `#f9c842` |
| `turbid` 0.22–1.00 | `#cdb660` `#bd9345` `#a6753c` `#875c39` `#654734` `#43332a` `#221f1b` |
| `balance` 0.00–1.00 | `#181c43` `#0c5ebe` `#75aabe` `#f1eceb` `#d08b73` `#a52125` `#3c0912` |

Field charts (heat strips) always ship with a labelled colour bar and the numeric value on hover
and in the data table — colour is never the only channel.

### Categorical

| Token | Hex | On canvas |
|---|---|---|
| `--cat-1` blue | `#0068a7` | 5.39:1 |
| `--cat-2` vermillion | `#c54a05` | 4.38:1 |
| `--cat-3` green | `#158561` | 4.18:1 |
| `--cat-4` purple | `#9e497d` | 5.15:1 |
| `--cat-5` sky | `#3292b3` | 3.23:1 |

**Colour-vision check** (Machado et al. 2009 simulation, minimum pairwise ΔE in OKLab × 100):
normal 12.6 · protanopia 7.0 · deuteranopia 4.8 · tritanopia 4.6. Okabe–Ito's orange/yellow was
dropped because its vermillion–ochre pair collapsed to 2.8 under deuteranopia. Because 4.6–4.8
is distinguishable but close, **any chart with three or more categorical series must also use
direct labels at line ends and distinct dash patterns** (solid, 6-3, 2-2, 8-3-2-3, 1-3).

### Reef alert scale — NOAA Coral Reef Watch

Eight levels; Levels 3–5 were added by NOAA on 2023-12-15. Lightness falls monotonically from
Watch to Level 5, so the order survives greyscale printing and colour-vision deficiency.

| Level | Criterion | Fill | Label colour | Label contrast |
|---|---|---|---|---|
| No Stress | HotSpot ≤ 0 | `#9fc4da` | ink | 8.20 |
| Bleaching Watch | 0 < HotSpot < 1 | `#f0cf4c` | ink | 9.89 |
| Bleaching Warning | HotSpot ≥ 1, 0 < DHW < 4 | `#eb8e34` | ink | 6.09 |
| Alert Level 1 | HotSpot ≥ 1, 4 ≤ DHW < 8 | `#d03929` | foam | 4.78 |
| Alert Level 2 | HotSpot ≥ 1, 8 ≤ DHW < 12 | `#a5292b` | foam | 6.96 |
| Alert Level 3 | HotSpot ≥ 1, 12 ≤ DHW < 16 | `#861a51` | foam | 9.02 |
| Alert Level 4 | HotSpot ≥ 1, 16 ≤ DHW < 20 | `#5b1a69` | foam | 11.44 |
| Alert Level 5 | HotSpot ≥ 1, DHW ≥ 20 | `#351859` | foam | 14.41 |

Source: [NOAA CRW Bleaching Alert Area](https://coralreefwatch.noaa.gov/product/5km/index_5km_baa-max-365d.php).
The pipeline (`bleaching.py`) computes all eight levels since 2026-10-23
([SCO-212](https://linear.app/scout1/issue/SCO-212)); before that it stopped at Alert Level 2.

Where a level is set **as text** — a stat value, a verdict, a badge label on its 12% tint —
it uses `--alert-<level>-text`: the same hue darkened until it reads at ≥ 4.6:1 on the canvas,
the sunken canvas and its tint (No Stress `#496b7f`, Watch `#816200`, Warning `#a44d00`,
Alert 1 `#c1291b`; Levels 2–5 are already dark enough to use their fills).

In charts, alert levels appear as horizontal **bands** behind the DHW line (fill at 16% over the
plot ground) with the level name direct-labelled at the right edge. No Stress, Watch and Warning
swatches fall below 3:1 against the canvas, so their legend swatches carry a 1 px ink outline.

## Units and numbers

Follow [CONVENTIONS → Engineering data](../CONVENTIONS.md#engineering-data):

- Space between number and unit (`26.4 °C`, `3.71 V`, `30 bytes`); en dash for ranges.
- **Precision never exceeds the sensor.** DS18B20 is ±0.5 °C → one decimal. Daily means may
  carry one decimal; never two.
- **Turbidity is raw ADC counts** (`turbidity_adc`), and **higher counts mean clearer water**
  (the turbidity sensor measures transmittance). Every turbidity axis and readout states the direction:
  "ADC counts (higher = clearer)". When a field chart maps turbidity to colour, the scale is
  inverted so that darker = murkier. NTU appears only after calibration
  ([SCO-12](https://linear.app/scout1/issue/SCO-12)).
- Measured values are set in JetBrains Mono; the unit is set in the same face at
  `--color-text-subtle`.
- Missing is an en dash `–`, never `0`, never blank.

## Time

- **All timestamps are UTC** (ISO 8601 with `Z` in data, `16:10 UTC` in prose). The deployment
  is in Hawaii (UTC−10, no daylight saving): tooltips and the data table add local time in
  parentheses — `16:10 UTC (06:10 HST)` — but axes stay in UTC so they match the raw files.
- Dates are ISO 8601 (`2026-10-19`). Axis ticks: `Oct 19` at day scale, `00:10 / 08:10 / 16:10`
  at slot scale.
- **Slot gridlines.** At ≤ 7-day ranges, faint vertical gridlines mark the three daily slots so
  a missing packet is visible as an empty gridline.
- Time flows left to right; the most recent reading is at the right edge, never auto-scrolled.

## Missing packets and gaps

| Situation | Drawing |
|---|---|
| One or more slots with no packet | Line breaks (separate path segments). A hatched band (45°, 1 px `stone-400`, 6 px pitch) spans the gap, labelled "no packet" when wider than 40 px |
| Packet arrived but QC flagged *suspect* | Point drawn hollow; tooltip and table give the QARTOD test that flagged it |
| Packet arrived but QC flagged *fail* | Point drawn as ▲ in `--status-warning`; excluded from the line and from daily means |
| Duplicate copies of one packet | Collapsed by `(buoy_id, record_seq)` before drawing — one point |
| Data the buoy holds but has not sent (between slots) | Not drawn. The chart note says: "The buoy samples every 30 minutes; the full record is retrieved from the buoy." |

Never draw a solid line across a gap, never fill a gap with zero, never smooth over one
([Bocoup](https://bocoup.com/blog/showing-missing-data-in-line-charts),
[Datawrapper](https://www.datawrapper.de/academy/patchy-data)).

**The estimate rule (decided 2026-10-20).** A *single* missing day between two measured days is
bridged by a faint dashed line labelled "Estimated (one missing day)", over its hatched band: water
temperature at 2–8 m changes slowly, so the likely path is worth showing — as an estimate. Gaps of
two or more days are never bridged: a long silence is when a guess is most likely to be wrong (a
storm can cut the radio link and stir up the water at once), and the buoy's on-board record will
fill it with real values when retrieved. Estimates are **display only**: they never enter the
data table, Degree Heating Weeks or the trend test, which run on measured days alone
(`bleaching.py` already gives a missing day zero contribution and reports the window coverage).

**As built (step 6).** The dashboard plots one point per *day* (the daily aggregate), not per
packet, on a calendar-true axis: a day with no rows keeps its place. A day that had rows but fell
below the 50% coverage floor is a gap too, and the data table names why ("too few samples (12 of
48)"). Gap bands are HTML, beneath the plot, so a bridge stays visible; a band narrower than 12% of
the plot carries no label rather than a clipped one. QC suspect/fail markers per packet are not
drawn yet — the dashboard has only daily values — and wait for per-packet charts.

## Freshness

Freshness is judged against the **expected slot schedule**, not wall-clock seconds. It is
computed at publish time and labelled with that time; an optional inline script may refresh the
relative age in the reader's browser (no network request).

| Status | Rule | Display |
|---|---|---|
| ● Live | A valid packet arrived for the most recent expected slot (30 min grace for repeated copies) | "Received 16:10 UTC" |
| ◐ Stale | The last 1–2 expected slots have no packet | "Last packet 08:10 UTC · 1 slot missed" |
| ○ Offline | 3 or more consecutive slots missed (a full day) | "No packets since 2026-10-18 16:10 UTC" |
| ▲ Fault | The newest packet carries a SoH fault bit, a QC fail, or battery below threshold | "Packet received with a fault: low battery" |

Every dashboard page shows **"Published 2026-10-19 16:42 UTC"** next to the freshness row.

As built: a packet belongs to the first slot at or after its timestamp (`telemetry/freshness.py`).
If that slot is still ahead of the publish time — an imported on-board record, or a publish
between a sample and its slot — the line describes the reading by its own time instead of naming
a future slot. Slots before the first packet ever received are pre-deployment, not missed. A
static page cannot know how old it is when read; the publish time lets the reader work it out.

## Uncertainty

- Temperature readings carry the sensor's ±0.5 °C as a 12% `--data-temp` band around the line at
  ranges ≤ 7 days (where it is visually meaningful), and as `±0.5` in the readout everywhere.
- Daily means show the min–max range of the day's received readings as a light band, labelled
  with the count ("3 of 3 packets", "1 of 3 packets").
- Estimates and derived values (DHW, trend slopes) say so in the chart note, with the method
  linked (NOAA CRW; Modified Mann–Kendall).

## Sparklines (Fleet tiles)

56 px tall, no axes, last 14 days, line in the variable identity colour, the last reading as a
3 px dot, gaps broken exactly as in full charts. The value and its freshness are printed next to
the sparkline — the sparkline shows shape, never the number.

## Chart anatomy and type

| Element | Spec |
|---|---|
| Plot ground | `--color-surface-raised` inside a plate |
| Axis labels | `--mono-axis` (12 px), `--color-text-subtle` |
| Gridlines | Horizontal only, 1 px `--color-line`; slot gridlines as above |
| Lines | 2 px, round joins; points 3 px radius |
| Legend | Only with ≥ 2 series; prefer direct labels at line ends |
| Title | `h3`, sentence case, names the variable and the period: "Water temperature, last 14 days" |
| Unit | In the header, mono, subtle: "°C, daily mean" |

## Accessibility

- `<svg role="img" aria-labelledby>` with `<title>` and a `<desc>` that states the finding in a
  sentence, including gaps ("…two slots missed on Oct 17").
- Every chart has a "View data" `<details>` holding the same values as a table.
- Colour is never the only channel: alert levels are labelled, status has glyphs, categorical
  series have dashes and direct labels.
- No chart relies on hover; everything in a tooltip is also in the table.

## matplotlib exports

`dashboard.py` adopts the same tokens through a small style dict (no new dependency): canvas
`#f8f3ef`, ink `#2b2520`, the variable identity colours, cmocean only if it is already
installed (fall back to the sampled hex stops above), DejaVu Sans Mono for values. The Flat UI
colours (`#e74c3c`, `#2ecc71`, …) are removed so exports and the website match.
