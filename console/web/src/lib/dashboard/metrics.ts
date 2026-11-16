// The numbers behind the Overview's Fleet status and Every metric bays. Pure functions over a
// buoy's last 7 days of readings (oldest first), so they test without a clock or a DOM.
// Columns, flags and SOH bits follow shore/scout_shore/schema.py and packet.py.

import type { Buoy, Reading } from "@/lib/api/types";

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** How far from exactly 24 h earlier a reading may be and still count as "a day ago". */
const DAY_AGO_TOLERANCE_MS = 6 * HOUR_MS;
/** What a buoy runs when it has not reported a count (firmware default, SCO-198). */
export const DEFAULT_TX_PER_DAY = 3;

export interface MetricGroup {
  name: string;
  columns: readonly string[];
}

/** Every measured number a reading carries, grouped by what it tells you about. */
export const METRIC_GROUPS: readonly MetricGroup[] = [
  { name: "Water", columns: ["temp_c", "turbidity_fau", "turbidity_v", "turbidity_adc"] },
  { name: "Soundscape", columns: ["lvl_broad_cdb", "lvl_bio_cdb", "lvl_anthro_cdb", "lvl_mixed_cdb", "ndsi_e4", "snap_count", "clip_count"] },
  { name: "Power and housing", columns: ["battery_v", "internal_temp_c", "internal_humidity_pct"] },
];

export interface Point { t: number; v: number }

/** One column as time-value points, skipping blanks (a blank is "not measured", never zero). */
export function pointsFor(rows: Reading[], column: string): Point[] {
  return rows.flatMap((row) => {
    const raw = row[column];
    if (raw === undefined || raw.trim() === "") return [];
    const v = Number(raw);
    const t = Date.parse(row.timestamp_utc);
    return Number.isFinite(v) && Number.isFinite(t) ? [{ t, v }] : [];
  });
}

export interface MetricStats {
  latest: Point;
  /** Latest minus the reading closest to 24 h before it; null when none is within 6 h of that. */
  change: number | null;
  min: number;
  max: number;
  count: number;
}

export function metricStats(points: Point[]): MetricStats | null {
  if (points.length === 0) return null;
  const latest = points[points.length - 1];
  const target = latest.t - DAY_MS;
  const dayAgo = points.slice(0, -1).reduce<Point | null>((best, p) => {
    const off = Math.abs(p.t - target);
    return off <= DAY_AGO_TOLERANCE_MS && (!best || off < Math.abs(best.t - target)) ? p : best;
  }, null);
  const values = points.map((p) => p.v);
  return {
    latest,
    change: dayAgo ? latest.v - dayAgo.v : null,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}

export interface Delivery { received: number; expected: number; ratio: number }

/** Readings a buoy's transmit count promises between `from` and `to` (Unix ms); at least one. */
export function expectedReadings(txPerDay: number | null, from: number, to: number): number {
  return Math.max(1, Math.round((txPerDay ?? DEFAULT_TX_PER_DAY) * (Math.max(0, to - from) / DAY_MS)));
}

/** Packets stored between `from` and `to` (Unix ms) against what the buoy's transmit count promises. */
export function delivery(rows: Reading[], buoy: Pick<Buoy, "tx_count_reported">, from: number, to: number): Delivery {
  // Stored readings are keyed on (record_seq, timestamp_utc): a cold start restarts record_seq.
  const received = new Set(rows.map((r) => `${r.record_seq}|${r.timestamp_utc}`)).size;
  const expected = expectedReadings(buoy.tx_count_reported, from, to);
  return { received, expected, ratio: expected ? Math.min(1, received / expected) : 0 };
}

/** Restarts seen in the window: uptime that went down between two consecutive readings. */
export function restarts(rows: Reading[]): number {
  const uptimes = pointsFor(rows, "uptime_s").map((p) => p.v);
  return uptimes.slice(1).filter((v, i) => v < uptimes[i]).length;
}

/** "3 d 4 h" / "5 h 12 min" / "8 min". */
export function durationLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const [d, h, m] = [Math.floor(minutes / 1440), Math.floor((minutes % 1440) / 60), minutes % 60];
  if (d) return `${d} d ${h} h`;
  return h ? `${h} h ${m} min` : `${m} min`;
}

export type IssueTone = "failed" | "caution";

/** What each flag and SOH bit means, and how much it matters. */
export const ISSUES: Record<string, { label: string; tone: IssueTone }> = {
  SD_RETRY: { label: "SD card write retried", tone: "caution" },
  TEMP_TIMEOUT: { label: "Temperature sensor timed out", tone: "failed" },
  TURBIDITY_RANGE: { label: "Turbidity out of range", tone: "caution" },
  BATT_LOW_SKIP_TX: { label: "Battery low, transmit skipped", tone: "failed" },
  RTC_LOST: { label: "Clock lost", tone: "caution" },
  POWER_CONSERVE: { label: "Power saving", tone: "caution" },
  HUMIDITY_HIGH: { label: "Housing humidity high", tone: "failed" },
  HUMIDITY_FAIL: { label: "Humidity sensor failed", tone: "failed" },
  CMD_REJECTED: { label: "Command rejected", tone: "caution" },
  FW_TRIAL: { label: "Firmware on trial", tone: "caution" },
  FW_ROLLED_BACK: { label: "Firmware rolled back", tone: "failed" },
  WATCHDOG_RESET: { label: "Watchdog reset", tone: "caution" },
  RTC_UNSET: { label: "Clock not set at boot", tone: "caution" },
  SD_INIT_FAIL: { label: "SD card failed", tone: "failed" },
  LORA_INIT_FAIL: { label: "Radio failed at boot", tone: "failed" },
};

export interface Issue { code: string; label: string; tone: IssueTone; count: number; current: boolean }

const codesIn = (row: Reading) => [row.flags, row.soh].flatMap((field) => (field ?? "").split("|")).filter(Boolean);

/** Every flag and SOH bit raised in the window: how many readings carried it, and whether the
 * newest one still does. Most severe and current first. */
export function issues(rows: Reading[]): Issue[] {
  const counts = new Map<string, number>();
  for (const row of rows) for (const code of codesIn(row)) counts.set(code, (counts.get(code) ?? 0) + 1);
  const latest = new Set(rows.length ? codesIn(rows[rows.length - 1]) : []);
  return [...counts].map(([code, count]) => ({
    code, count, current: latest.has(code),
    label: ISSUES[code]?.label ?? code,
    tone: ISSUES[code]?.tone ?? "caution",
  })).sort((a, b) => Number(b.current) - Number(a.current) || Number(b.tone === "failed") - Number(a.tone === "failed") || b.count - a.count);
}

/** The newest non-blank value of a text column, or null. */
export function latestText(rows: Reading[], column: string): string | null {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const value = rows[i][column];
    if (value && value.trim() !== "") return value;
  }
  return null;
}

/** "+0.42" / "−1.3" / "±0", at the given precision. */
export function signed(value: number, digits: number): string {
  const fixed = Math.abs(value).toFixed(digits);
  if (Number(fixed) === 0) return `±${fixed}`;
  return `${value > 0 ? "+" : "−"}${fixed}`;
}

/** Decimal places that suit a column's values: as many as the readings themselves carry, at most 3. */
export function digitsFor(rows: Reading[], column: string): number {
  const decimals = latestText(rows, column)?.split(".")[1];
  return decimals ? Math.min(3, decimals.length) : 0;
}
