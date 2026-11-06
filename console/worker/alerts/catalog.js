/* What an alert rule may watch (SCO-301, ADR-0015): the numeric reading columns with their units
 * and hysteresis, the firmware flags, the presets, and validation of a rule from the tab.
 *
 * Preset numbers come from the firmware's remote-settings defaults (firmware/lib/scout_settings,
 * exported to buoy-config.json), never from here. Where the repo has no canonical number the
 * preset leaves the value empty and says so. */

import buoyConfig from "../buoy-config.json" with { type: "json" };

const remoteDefault = (key) => buoyConfig.remote.find((spec) => spec.key === key)?.default ?? null;

/** Labels and units match console/web/src/lib/variables.ts. `margin` is the hysteresis: a rule
 * that fired re-arms only once the value is back past the line by this much. */
export const METRICS = {
  temp_c: { label: "Water temperature", unit: "°C", margin: 0.2 },
  turbidity_fau: { label: "Turbidity", unit: "FAU", margin: 1 },
  turbidity_adc: { label: "Turbidity ADC", unit: "counts", margin: 10 },
  // The firmware's own minimum gap between power tiers (SCOUT_SET_MIN_TIER_GAP_MV, 50 mV).
  battery_v: { label: "Battery", unit: "V", margin: buoyConfig.tierGapMv / 1000 },
  internal_temp_c: { label: "Housing temperature", unit: "°C", margin: 0.5 },
  internal_humidity_pct: { label: "Housing humidity", unit: "%", margin: 2 },
  lvl_anthro_cdb: { label: "Sound level, human band", unit: "cdB", margin: 100 },
  lvl_mixed_cdb: { label: "Sound level, mixed band", unit: "cdB", margin: 100 },
  lvl_bio_cdb: { label: "Sound level, biological band", unit: "cdB", margin: 100 },
  lvl_broad_cdb: { label: "Sound level, broadband", unit: "cdB", margin: 100 },
  ndsi_e4: { label: "Soundscape index (NDSI)", unit: "×10⁻⁴", margin: 100 },
  snap_count: { label: "Snapping-shrimp snaps", unit: "count", margin: 1 },
  clip_count: { label: "Clipped samples", unit: "count", margin: 1 },
};

/** shore/scout_shore/packet.py FLAG_BITS, with what each means on screen. */
export const FLAGS = {
  BATT_LOW_SKIP_TX: "Battery too low to transmit",
  POWER_CONSERVE: "Conserving power",
  HUMIDITY_HIGH: "Housing humidity high",
  HUMIDITY_FAIL: "Humidity sensor failed",
  TEMP_TIMEOUT: "Temperature sensor timed out",
  TURBIDITY_RANGE: "Turbidity out of range",
  SD_RETRY: "SD card write retried",
  RTC_LOST: "Clock lost",
  CMD_REJECTED: "Settings command rejected",
};

const conserveMv = remoteDefault("conserve_mv");
const humidityPct = remoteDefault("humidity_alert_pct");

export const PRESETS = [
  { id: "battery-low", label: "Battery low", kind: "threshold", metric: "battery_v", op: "below",
    value: conserveMv === null ? null : conserveMv / 1000,
    source: "The firmware's default conserve threshold (scout_settings, conserve_mv)." },
  { id: "humidity-high", label: "Housing humidity high", kind: "threshold", metric: "internal_humidity_pct", op: "above",
    value: humidityPct,
    source: "The firmware's default humidity alert (scout_settings), a placeholder until the SCO-204 calibration." },
  { id: "water-warm", label: "Water temperature above", kind: "threshold", metric: "temp_c", op: "above", value: null,
    source: "The repo has no canonical temperature limit, so set your own." },
  { id: "buoy-silent", label: "Buoy silent", kind: "silence", metric: null, op: null, value: null,
    source: "No canonical number: Fleet calls a buoy silent after twice its longest gap between transmits plus an hour, " +
      "which is 18 h at three a day. Set your own." },
];

export const MAX_RULES = 20;
const MAX_HOURS = 24 * 14;

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

/** A rule body from the tab → the stored fields, or { error } in words. */
export function validRule(body) {
  const kind = body?.kind;
  const buoyId = body?.buoy_id === null || body?.buoy_id === undefined || body?.buoy_id === "" ? null : Number(body.buoy_id);
  if (buoyId !== null && !(Number.isInteger(buoyId) && buoyId >= 1 && buoyId <= 65535)) return { error: "Pick a buoy, or any buoy." };
  const remind = body?.remind_hours === null || body?.remind_hours === undefined || body?.remind_hours === "" ? null : Number(body.remind_hours);
  if (remind !== null && !(Number.isInteger(remind) && remind >= 1 && remind <= MAX_HOURS)) {
    return { error: `Remind every 1-${MAX_HOURS} hours, or not at all.` };
  }
  const enabled = body?.enabled === undefined ? 1 : body.enabled ? 1 : 0;
  const base = { buoy_id: buoyId, remind_hours: remind, enabled };
  if (kind === "threshold") {
    if (!Object.hasOwn(METRICS, body.metric)) return { error: "Pick a reading to watch." };
    if (!["above", "below"].includes(body.op)) return { error: "Pick above or below." };
    if (!isNumber(body.value)) return { error: `Give the threshold in ${METRICS[body.metric].unit}.` };
    return { ...base, kind, metric: body.metric, op: body.op, value: body.value };
  }
  if (kind === "flag") {
    if (!Object.hasOwn(FLAGS, body.metric)) return { error: "Pick a firmware flag to watch." };
    return { ...base, kind, metric: body.metric, op: null, value: null };
  }
  if (kind === "silence") {
    if (!(isNumber(body.value) && body.value >= 1 && body.value <= MAX_HOURS)) return { error: `Quiet for 1-${MAX_HOURS} hours.` };
    return { ...base, kind, metric: null, op: null, value: body.value };
  }
  return { error: "Pick what the alert watches: a reading, a flag, or the buoy going quiet." };
}

const trim = (n) => String(Math.round(n * 1000) / 1000);

/** "Battery below 3.2 V", "Flag: Clock lost", "Quiet for 18 h": the rule in words. */
export function describeRule(rule) {
  if (rule.kind === "threshold") {
    const metric = METRICS[rule.metric];
    return `${metric.label} ${rule.op} ${trim(rule.value)} ${metric.unit}`;
  }
  if (rule.kind === "flag") return `Flag: ${FLAGS[rule.metric]} (${rule.metric})`;
  return `Quiet for ${trim(rule.value)} h`;
}

/** A reading with its unit: "3.15 V". */
export function formatValue(rule, value) {
  if (rule.kind === "threshold") return `${trim(value)} ${METRICS[rule.metric].unit}`;
  if (rule.kind === "silence") return `${Math.round(value * 10) / 10} h without a packet`;
  return "Raised";
}

export const catalog = () => ({
  metrics: Object.entries(METRICS).map(([key, { label, unit }]) => ({ key, label, unit })),
  flags: Object.entries(FLAGS).map(([key, label]) => ({ key, label })),
  presets: PRESETS,
});
