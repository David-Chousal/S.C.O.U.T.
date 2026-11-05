/* What a buoy is doing now, worked out from what the console knows of its schedule: when it next
 * transmits, and whether it is alive and connected. Pure functions, so they test without a clock. */

import type { Buoy, RemoteSetting } from "@/lib/api/types";

const HOUR_MS = 3600 * 1000;
const DAY_S = 86400;
/** Slots each count uses (scout_tx_slot_mask): 1 → first, 2 → first and last, 3 → all. */
const SLOT_INDICES: Record<number, number[]> = { 1: [0], 2: [0, 2], 3: [0, 1, 2] };

/** The settings the buoy runs as far as the console can tell: what was asked once it has confirmed
 * it (or nothing was asked), otherwise the defaults with the count its packets report. */
export function runningSettings(buoy: Buoy, remote: RemoteSetting[]): Record<string, number> {
  const confirmed = buoy.settings_state === "confirmed" || buoy.settings_state === "default";
  const values = Object.fromEntries(remote.map((spec, i) =>
    [spec.key, confirmed && buoy.settings_wanted[i] !== undefined ? buoy.settings_wanted[i] : spec.default]));
  if (!confirmed && buoy.tx_count_reported) values.tx_count = buoy.tx_count_reported;
  return values;
}

/** The slots in use, as seconds after midnight UTC, in order. */
export function slotsInUse(slotsSod: number[], txCount: number, phaseH: number): number[] {
  return (SLOT_INDICES[txCount] ?? []).map((i) => (slotsSod[i] + phaseH * 3600) % DAY_S).sort((a, b) => a - b);
}

/** The next transmit slot strictly after `nowMs`, as Unix ms. */
export function nextTransmit(slots: number[], nowMs: number): number | null {
  if (slots.length === 0) return null;
  const dayStart = Math.floor(nowMs / 1000 / DAY_S) * DAY_S;
  for (const day of [dayStart, dayStart + DAY_S]) {
    for (const sod of slots) {
      const at = (day + sod) * 1000;
      if (at > nowMs) return at;
    }
  }
  return null;
}

/** "in 3 h 12 min" / "in 8 min". */
export function untilLabel(atMs: number, nowMs: number): string {
  const minutes = Math.max(0, Math.round((atMs - nowMs) / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `in ${h} h ${m} min` : `in ${m} min`;
}

/** "16:10 UTC". */
export function utcClock(atMs: number): string {
  const d = new Date(atMs);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}

/** The longest gap between two consecutive slots, in ms: how long silence is normal. */
export function longestGapMs(slots: number[]): number {
  if (slots.length <= 1) return DAY_S * 1000;
  return Math.max(...slots.map((sod, i) => ((slots[(i + 1) % slots.length] - sod + DAY_S) % DAY_S) || DAY_S)) * 1000;
}

export type Health = { state: "ok" | "stale" | "failed" | "off"; lit: number; word: string };

/** Is it alive and connected? Live while it has not missed a slot (with an hour's grace for a late
 * relay), Late after one missed gap, Silent after two, Not heard before its first packet. */
export function buoyHealth(lastHeardMs: number | null, slots: number[], nowMs: number): Health {
  if (!lastHeardMs) return { state: "off", lit: 0, word: "Not heard" };
  const age = nowMs - lastHeardMs;
  const gap = longestGapMs(slots) + HOUR_MS;
  if (age <= gap) return { state: "ok", lit: 4, word: "Live" };
  if (age <= 2 * gap) return { state: "stale", lit: 2, word: "Late" };
  return { state: "failed", lit: 1, word: "Silent" };
}
