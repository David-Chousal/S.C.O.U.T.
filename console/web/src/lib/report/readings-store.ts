"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import type { Reading } from "@/lib/api/types";
import type { ResolvedRange } from "./variables";

/** One buoy's readings over one range, oldest first. */
export type ReadingsEntry =
  | { status: "loading" }
  | { status: "failed"; error: string }
  | { status: "ready"; rows: Reading[]; truncated: boolean };

const PAGE = 1000;
/** A report never pulls more than this many readings for one buoy and range; the CSV holds the rest. */
export const MAX_REPORT_READINGS = 20_000;

const rowKey = (row: Reading) => `${row.timestamp_utc}|${row.record_seq}`;
const stepBack = (iso: string) => new Date(Date.parse(iso) - 1000).toISOString().slice(0, 19) + "Z";

/** Every reading in the range, paging back from `to` in 1,000-row pages (the API's limit), up to
 * MAX_REPORT_READINGS. Returned oldest first. */
export async function readingsInRange(buoy: number, range: ResolvedRange,
  read: typeof api.readingsBetween = api.readingsBetween): Promise<{ rows: Reading[]; truncated: boolean }> {
  const seen = new Map<string, Reading>();
  let to = range.to;
  for (;;) {
    const { readings } = await read(buoy, range.from, to);
    readings.forEach((row) => seen.set(rowKey(row), row));
    if (readings.length < PAGE) break;
    if (seen.size >= MAX_REPORT_READINGS) return { rows: ordered(seen).slice(-MAX_REPORT_READINGS), truncated: true };
    const oldest = readings[readings.length - 1].timestamp_utc;
    to = oldest === to ? stepBack(oldest) : oldest;
  }
  return { rows: ordered(seen), truncated: false };
}

function ordered(rows: Map<string, Reading>): Reading[] {
  return [...rows.values()].sort((a, b) => a.timestamp_utc.localeCompare(b.timestamp_utc) || Number(a.record_seq) - Number(b.record_seq));
}

export const readingsKey = (buoy: number, range: ResolvedRange) => `${buoy}|${range.from}|${range.to}`;

/** A cache of readings per (buoy, range) for the report preview. `get` starts a fetch the first
 * time a key is asked for and returns "loading" until it lands, so moving or restyling a block
 * never refetches, and a new range fetches once for every block that uses it. */
export function useReadingsStore() {
  const cache = useRef(new Map<string, ReadingsEntry>());
  const [, setVersion] = useState(0);

  const get = useCallback((buoy: number, range: ResolvedRange): ReadingsEntry => {
    const key = readingsKey(buoy, range);
    const hit = cache.current.get(key);
    if (hit) return hit;
    cache.current.set(key, { status: "loading" });
    readingsInRange(buoy, range).then(
      (result) => cache.current.set(key, { status: "ready", ...result }),
      (failure: unknown) => cache.current.set(key, { status: "failed", error: failure instanceof Error ? failure.message : "Could not load readings." }),
    ).finally(() => setVersion((v) => v + 1));
    return { status: "loading" };
  }, []);

  /** Drops failed entries so the next `get` fetches them again; loading and ready ones stay cached. */
  const retryFailed = useCallback(() => {
    for (const [key, entry] of cache.current) if (entry.status === "failed") cache.current.delete(key);
    setVersion((v) => v + 1);
  }, []);

  return { get, retryFailed };
}
