// Shared formatting: every time is UTC (the buoy and the shore keep UTC), every estimate says so.

import type { Buoy, CountState, Estimates, LifeRow } from "./api/types";

export function utc(ms: number | null | undefined): string {
  if (!ms) return "—";
  return `${new Date(ms).toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

/** A time in this browser's zone, labelled with the zone so it is never mistaken for UTC. */
export function local(ms: number | null | undefined, timeZone?: string): string {
  if (!ms) return "—";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23", timeZoneName: "short",
  }).formatToParts(new Date(ms));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")} ${get("timeZoneName")}`;
}

/** When a buoy was last heard from. A buoy whose clock lost power stamps its rows with a time
 * it cannot vouch for, so its own timestamp is not shown; when the row arrived is. */
export function lastHeard(buoy: Pick<Buoy, "clock_lost" | "reported_at" | "last_seen_at">): number | null {
  return buoy.clock_lost ? buoy.last_seen_at : buoy.reported_at;
}

export function newestPacket(buoy: Pick<Buoy, "clock_lost" | "reported_at" | "last_seen_at">, when: (ms: number | null) => string): string {
  return buoy.clock_lost ? `buoy clock lost · last heard ${when(buoy.last_seen_at)}` : `newest packet ${when(buoy.reported_at)}`;
}

export function plural(count: number, word: string, many = `${word}s`): string {
  return `${count} ${count === 1 ? word : many}`;
}

export function lifeFor(estimates: Estimates, txPerDay: number, cells: number, listenWindow = false) {
  const rows = listenWindow ? estimates.with_listen_window : estimates.without_listen_window;
  const pick = (scenario: LifeRow["scenario"]) =>
    rows.find((row) => row.scenario === scenario && row.tx_per_day === txPerDay && row.cells === cells);
  return { best: pick("best"), pessimistic: pick("pessimistic") };
}

export function months(row: LifeRow | undefined): string {
  return row ? `${row.months.toFixed(1)} mo` : "—";
}

/** How a count state reads as a signal meter: bars plus a word, never colour alone. */
export const COUNT_SIGNAL: Record<CountState, { state: "ok" | "stale" | "failed" | "off"; lit: number; word: string; detail: string }> = {
  confirmed: { state: "ok", lit: 4, word: "Confirmed", detail: "The buoy reports the count you asked for." },
  default: { state: "ok", lit: 4, word: "Default", detail: "Nothing requested; the buoy runs its default 3 a day." },
  pending: { state: "stale", lit: 2, word: "Pending", detail: "Waiting for the buoy's next packet to report the new count." },
  unreported: { state: "stale", lit: 1, word: "Pending", detail: "The buoy has not reported a count yet." },
  rejected: { state: "failed", lit: 1, word: "Rejected", detail: "The buoy refused the last command (its packet carried CMD_REJECTED)." },
};
