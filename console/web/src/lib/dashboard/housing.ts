// The housing seal, read from the SHT40's two packet flags. The %RH value itself stays on the SD
// card (ADR-0005), so the radio link carries only HUMIDITY_HIGH (at or above the buoy's humidity
// alert, the first sign of a leak) and HUMIDITY_FAIL (the sensor did not answer).

import type { Reading } from "@/lib/api/types";
import { codesIn } from "./metrics";

export type SealState = "sealed" | "high" | "failed" | "unknown";

export interface HousingSeal {
  state: SealState;
  /** When the current state began: the first reading of the newest unbroken run in range. */
  since: number | null;
  /** Readings in range that carried HUMIDITY_HIGH, and when the newest of them was. */
  highCount: number;
  lastHigh: number | null;
  readings: number;
}

function stateOf(row: Reading): SealState {
  const codes = codesIn(row);
  if (codes.includes("HUMIDITY_FAIL")) return "failed";
  return codes.includes("HUMIDITY_HIGH") ? "high" : "sealed";
}

/** A buoy's housing seal over its readings in range (oldest first). */
export function housingSeal(rows: Reading[]): HousingSeal {
  const states = rows.map((row) => ({ state: stateOf(row), t: Date.parse(row.timestamp_utc) }));
  // High history comes from the flag itself: a reading with both flags is "failed" but was still high.
  const highs = rows.filter((row) => codesIn(row).includes("HUMIDITY_HIGH")).map((row) => ({ t: Date.parse(row.timestamp_utc) }));
  const newest = states.at(-1);
  let start = states.length - 1;
  while (start > 0 && states[start - 1].state === newest?.state) start -= 1;
  return {
    state: newest?.state ?? "unknown",
    since: newest ? states[start].t : null,
    highCount: highs.length,
    lastHigh: highs.at(-1)?.t ?? null,
    readings: rows.length,
  };
}
