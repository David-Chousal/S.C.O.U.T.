/* Heat stress per buoy, as the Dashboard, /api/v1, the email alerts and Fred read it (SCO-314,
 * ADR-0017). heat-stress.js does the science; this file reads D1 and shapes the reply.
 *
 * DHW on a day looks back 84 days, so a 12-week DHW trend needs 168 days of readings. At 1–3
 * transmits a day that is at most ~500 rows a buoy. */

import { DEFAULT_TX_COUNT } from "./fleet.js";
import { ALERT_LEVELS, alertIndex, bleachingThreshold, DHW_WINDOW_DAYS, heatStressFromRows } from "./heat-stress.js";
import { mmmOf } from "./mmm.js";

const DAY_MS = 24 * 3600 * 1000;
export const TREND_DAYS = DHW_WINDOW_DAYS;

const NO_MMM = "No MMM is set for this buoy, so heat stress cannot be computed. A member or admin sets it on " +
  "Settings → Buoys: look it up from NOAA Coral Reef Watch for the buoy's position, or enter it by hand.";

const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
const withLevel = (d) => ({ ...d, level: alertIndex(d.alert) });

async function rowsSince(db, buoyId, since) {
  const { results } = await db.prepare("SELECT row_json FROM readings WHERE buoy_id = ? AND timestamp_utc >= ? ORDER BY timestamp_utc")
    .bind(buoyId, since).all();
  return results.map((r) => JSON.parse(r.row_json));
}

/** One buoy's heat stress: its MMM, the state on its newest day, and the last 84 days. */
export async function buoyHeatStress(db, buoy, now = Date.now()) {
  const base = { buoy_id: buoy.buoy_id, label: buoy.label, mmm: mmmOf(buoy) };
  if (!base.mmm) return { ...base, threshold_c: null, current: null, series: [], summary: null, note: NO_MMM };
  const today = isoDay(now);
  const firstShown = isoDay(now - (TREND_DAYS - 1) * DAY_MS);
  const rows = await rowsSince(db, buoy.buoy_id, isoDay(now - (2 * TREND_DAYS) * DAY_MS));
  const samplesPerDay = buoy.tx_count_reported ?? DEFAULT_TX_COUNT;
  const { series } = heatStressFromRows(rows, base.mmm.value_c, samplesPerDay);
  const shown = series.filter((d) => d.day >= firstShown && d.day <= today).map(withLevel);
  const newest = shown[shown.length - 1] ?? null;
  const current = newest && { ...newest, days_old: Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${newest.day}T00:00:00Z`)) / DAY_MS) };
  const peak = shown.reduce((best, d) => (best === null || d.dhw > best.dhw ? d : best), null);
  const worst = shown.reduce((top, d) => Math.max(top, d.level), 0);
  return {
    ...base, threshold_c: bleachingThreshold(base.mmm.value_c), samples_per_day: samplesPerDay, current, series: shown,
    summary: { peak_dhw: peak?.dhw ?? 0, peak_dhw_day: peak?.day ?? null, peak_alert: ALERT_LEVELS[worst], days: shown.length,
      days_at_or_above_threshold: shown.filter((d) => d.sst !== null && d.sst >= bleachingThreshold(base.mmm.value_c)).length },
    note: current ? null : "No day in the last 12 weeks had enough trusted readings for a daily mean.",
  };
}

/** Every connected buoy (or one), in fleet order. */
export async function heatStressView(db, now = Date.now(), buoyId = null) {
  const statement = buoyId === null
    ? db.prepare("SELECT * FROM buoys WHERE disconnected_at IS NULL ORDER BY buoy_id")
    : db.prepare("SELECT * FROM buoys WHERE buoy_id = ?").bind(Number(buoyId));
  const { results } = await statement.all();
  const buoys = [];
  for (const buoy of results) buoys.push(await buoyHeatStress(db, buoy, now));
  return { window_days: DHW_WINDOW_DAYS, alert_levels: ALERT_LEVELS, generated_at: new Date(now).toISOString(), buoys };
}
