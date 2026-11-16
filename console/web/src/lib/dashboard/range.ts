// How far back the Dashboard looks: a few fixed spans or the whole history. Remembered per browser
// (localStorage, tolerant of blocked storage), like the page preferences.

import type { Reading } from "@/lib/api/types";

export type RangeId = "1d" | "7d" | "30d" | "90d" | "1y" | "all";

export interface RangeOption { id: RangeId; label: string; days: number | null; phrase: string }

export const RANGES: readonly RangeOption[] = [
  { id: "1d", label: "24 h", days: 1, phrase: "last 24 hours" },
  { id: "7d", label: "7 d", days: 7, phrase: "last 7 days" },
  { id: "30d", label: "30 d", days: 30, phrase: "last 30 days" },
  { id: "90d", label: "90 d", days: 90, phrase: "last 90 days" },
  { id: "1y", label: "1 y", days: 365, phrase: "last year" },
  { id: "all", label: "All", days: null, phrase: "all history" },
];

export const DEFAULT_RANGE: RangeId = "7d";
const STORAGE_KEY = "scout-console-dashboard-range";
const DAY_MS = 24 * 3600 * 1000;
/** Where "all history" asks from: before any S.C.O.U.T. buoy could have sent a reading. */
export const HISTORY_START = "2020-01-01T00:00:00Z";

export const rangeOption = (id: RangeId): RangeOption => RANGES.find((r) => r.id === id) ?? RANGES[1];

export function loadRange(): RangeId {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return RANGES.some((r) => r.id === saved) ? (saved as RangeId) : DEFAULT_RANGE;
  } catch {
    return DEFAULT_RANGE;
  }
}

export function saveRange(id: RangeId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage blocked (private window, strict settings): the choice lasts for this page only.
  }
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 19) + "Z";

/** The UTC bounds to ask the API for. */
export function requestBounds(id: RangeId, now: number): [string, string] {
  const days = rangeOption(id).days;
  return [days === null ? HISTORY_START : iso(now - days * DAY_MS), iso(now)];
}

/** Where the charts' time axis starts: the range's start, or for all history the oldest reading. */
export function windowStart(id: RangeId, now: number, readings: Record<number, Reading[]>): number {
  const days = rangeOption(id).days;
  if (days !== null) return now - days * DAY_MS;
  const oldest = Object.values(readings).flatMap((rows) => (rows.length ? [Date.parse(rows[0].timestamp_utc)] : []));
  return oldest.length ? Math.min(...oldest) : now - 7 * DAY_MS;
}

/** The time range a bay shows. */
export interface TimeWindow {
  from: number;
  now: number;
  /** "last 7 days", "all history"... */
  phrase: string;
  allHistory: boolean;
}

/** Where a buoy's own window starts: for all history its first reading (a buoy added later is not
 * owed packets from before it existed), otherwise the range's start. */
export function startFor(window: TimeWindow, rows: Reading[]): number {
  return window.allHistory && rows.length ? Date.parse(rows[0].timestamp_utc) : window.from;
}

export interface History { readings: Reading[]; truncated: boolean }

/** Every reading between `from` and `to`, oldest first, paging back through the API's newest-first
 * pages of `pageSize`. Stops after `maxPages` and says so, so a huge history cannot hang the page. */
export async function fetchHistory(
  fetchPage: (from: string, to: string) => Promise<Reading[]>, from: string, to: string, pageSize = 1000, maxPages = 50,
): Promise<History> {
  const seen = new Map<string, Reading>();
  let upTo = to;
  for (let page = 0; page < maxPages; page += 1) {
    const rows = await fetchPage(from, upTo);
    const before = seen.size;
    for (const row of rows) seen.set(`${row.record_seq}|${row.timestamp_utc}`, row);
    if (rows.length < pageSize || seen.size === before) return { readings: [...seen.values()].reverse(), truncated: false };
    // The page boundary is inclusive, so the oldest timestamp is asked for again and deduplicated.
    upTo = rows[rows.length - 1].timestamp_utc;
  }
  return { readings: [...seen.values()].reverse(), truncated: true };
}
