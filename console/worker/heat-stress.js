/* NOAA Coral Reef Watch thermal stress (SCO-314, ADR-0017): a line-for-line port of
 * analytics/telemetry/bleaching.py and the daily mean in aggregate.py, which stay the reference.
 * test/heat-stress-test.js checks this file against the fixture the Python generates
 * (analytics/telemetry/tests/fixtures/heat-stress-cases.json).
 *
 *   HotSpot   HS = max(0, daily SST − MMM)
 *   threshold MMM + 1 °C
 *   DHW       Σ(HS ≥ 1 °C over the trailing 84 calendar days) / 7, in °C-weeks
 *   alert     CRW Bleaching Alert Area scale with Levels 3–5 (2023-12-15); Warning and above need a
 *             current HotSpot ≥ 1 °C
 *
 * One deliberate difference, documented in ADR-0017: the Python's 50 % coverage floor counts a
 * day's samples against 48 (the SD log's 30-minute cadence). The console only sees the 1–3 rows a
 * day the buoy transmits, so the floor counts against that day's transmit count instead: the
 * highest `tx_count` its trusted rows carry, or the caller's fallback when none carries one. The
 * rule is the same; only the expected sample count differs. Pure: no D1, no fetch. */

export const BLEACHING_THRESHOLD_OFFSET_C = 1.0;
export const HOTSPOT_MIN_C = 1.0;
export const DHW_WINDOW_DAYS = 84;
export const MIN_COVERAGE = 0.5;
// qc.TEMP_PLAUSIBLE_C and model.CLOCK_VALID_FROM in the Python.
export const TEMP_PLAUSIBLE_C = [-5.0, 45.0];
export const CLOCK_VALID_FROM = "2020-01-01T00:00:00Z";

// Ordered least to most severe; the index is the numeric severity the alert rules store.
export const ALERT_LEVELS = ["No Stress", "Bleaching Watch", "Bleaching Warning", "Alert Level 1", "Alert Level 2",
  "Alert Level 3", "Alert Level 4", "Alert Level 5"];
const [NO_STRESS, WATCH, WARNING] = ALERT_LEVELS;
// DHW floors, most severe first: the first floor the DHW reaches wins.
const DHW_ALERTS = [[20.0, ALERT_LEVELS[7]], [16.0, ALERT_LEVELS[6]], [12.0, ALERT_LEVELS[5]], [8.0, ALERT_LEVELS[4]],
  [4.0, ALERT_LEVELS[3]]];

const DAY_MS = 24 * 3600 * 1000;
const round = (value, places) => Number(value.toFixed(places));

export const bleachingThreshold = (mmm) => mmm + BLEACHING_THRESHOLD_OFFSET_C;
export const hotspot = (sst, mmm) => Math.max(0.0, sst - mmm);
export const alertIndex = (alert) => ALERT_LEVELS.indexOf(alert);

/** CRW alert level from the current HotSpot and DHW (bleaching.alert_level). */
export function alertLevel(hs, dhw) {
  if (hs <= 0.0) return NO_STRESS;
  if (hs < HOTSPOT_MIN_C) return WATCH;
  for (const [floor, level] of DHW_ALERTS) if (dhw >= floor) return level;
  return WARNING;
}

/** Is this row's time trustworthy (model.has_valid_clock)? RTC_LOST or a pre-2020 stamp is not. */
export function hasValidClock(row) {
  if (String(row.flags || "").split("|").includes("RTC_LOST")) return false;
  return String(row.timestamp_utc || "") >= CLOCK_VALID_FROM;
}

function plausibleTemp(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= TEMP_PLAUSIBLE_C[0] && value <= TEMP_PLAUSIBLE_C[1] ? value : null;
}

/** The transmit count a row reports (1–3), or null when it carries none. */
function recordedTxCount(row) {
  const count = Number(row.tx_count);
  return row.tx_count !== "" && row.tx_count !== null && row.tx_count !== undefined && [1, 2, 3].includes(count) ? count : null;
}

/** Schema rows → one entry per UTC day that has rows (aggregate.aggregate_daily, temperature part).
 * temp_mean is null when the day's valid samples fall below MIN_COVERAGE of the day's transmit
 * count: the highest count its trusted rows report, else `samplesPerDay`. A buoy whose count
 * changed keeps each past day judged by the count it ran that day. */
export function aggregateDaily(rows, samplesPerDay) {
  const byDay = new Map();
  for (const row of rows.filter(hasValidClock)) {
    const day = row.timestamp_utc.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, { temps: [], count: null });
    const entry = byDay.get(day);
    const temp = plausibleTemp(row.temp_c);
    if (temp !== null) entry.temps.push(temp);
    const count = recordedTxCount(row);
    if (count !== null) entry.count = Math.max(entry.count ?? 0, count);
  }
  return [...byDay.keys()].sort().map((day) => {
    const { temps, count } = byDay.get(day);
    const coverage = Math.min(temps.length / (count ?? samplesPerDay), 1.0);
    const mean = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
    return { day, temp_mean: mean !== null && coverage >= MIN_COVERAGE ? round(mean, 3) : null, temp_n: temps.length,
      coverage: round(coverage, 3) };
  });
}

const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

/** Sparse [day, sst] pairs → a gap-free calendar from the first to the last day, gaps as null. */
function fillCalendar(daily) {
  if (daily.length === 0) return [];
  const ordered = [...daily].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const byDay = new Map(ordered);
  const out = [];
  for (let day = ordered[0][0]; day <= ordered[ordered.length - 1][0]; day = addDays(day, 1)) {
    out.push([day, byDay.has(day) ? byDay.get(day) : null]);
  }
  return out;
}

/** HotSpot, DHW and alert for each calendar day (bleaching.assess_thermal_stress). Days with no
 * data add nothing to DHW; window_coverage says how complete each day's 84-day window was. */
export function assessThermalStress(daily, mmm, windowDays = DHW_WINDOW_DAYS) {
  const calendar = fillCalendar(daily);
  const hotspots = calendar.map(([, sst]) => (sst === null ? null : hotspot(sst, mmm)));
  return calendar.map(([day, sst], i) => {
    const window = hotspots.slice(Math.max(0, i - windowDays + 1), i + 1);
    const accumulated = window.reduce((sum, hs) => (hs !== null && hs >= HOTSPOT_MIN_C ? sum + hs : sum), 0);
    const dhw = accumulated / 7.0;
    const present = window.filter((hs) => hs !== null).length;
    const hsToday = hotspots[i];
    const alert = hsToday === null ? NO_STRESS : alertLevel(hsToday, dhw);
    return { day, sst, hotspot: hsToday, dhw: round(dhw, 3), alert, window_coverage: round(present / windowDays, 3) };
  });
}

/** The deployment-level rollup (bleaching.summarize). */
export function summarize(series, mmm) {
  const threshold = bleachingThreshold(mmm);
  const peak = series.reduce((best, d) => (best === null || d.dhw > best.dhw ? d : best), null);
  const peakAlert = series.reduce((worst, d) => (alertIndex(d.alert) > alertIndex(worst) ? d.alert : worst), NO_STRESS);
  return {
    mmm, threshold, peak_dhw: peak ? peak.dhw : 0.0, peak_dhw_day: peak ? peak.day : null, peak_alert: peakAlert,
    days_at_or_above_threshold: series.filter((d) => d.sst !== null && d.sst >= threshold).length, n_days: series.length,
  };
}

/** Readings → daily means → thermal series, the way pipeline.analyze chains them. */
export function heatStressFromRows(rows, mmm, samplesPerDay) {
  const daily = aggregateDaily(rows, samplesPerDay);
  const sst = daily.filter((d) => d.temp_mean !== null).map((d) => [d.day, d.temp_mean]);
  const series = assessThermalStress(sst, mmm);
  return { daily, series, summary: summarize(series, mmm) };
}
