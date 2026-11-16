import { describe, expect, test } from "vitest";
import type { Reading } from "@/lib/api/types";
import { housingSeal } from "./housing";

const T0 = Date.UTC(2026, 10, 10);
const HOUR = 3600 * 1000;
const row = (hours: number, flags = ""): Reading => ({
  record_seq: String(hours), timestamp_utc: new Date(T0 + hours * HOUR).toISOString().slice(0, 19) + "Z", flags, soh: "",
});

describe("housing seal", () => {
  test("no readings means the seal is unknown", () => {
    expect(housingSeal([])).toMatchObject({ state: "unknown", since: null, highCount: 0, readings: 0 });
  });

  test("a buoy that never raised HUMIDITY_HIGH is sealed since its first reading in range", () => {
    expect(housingSeal([row(0), row(8), row(16)])).toMatchObject({ state: "sealed", since: T0, highCount: 0, lastHigh: null, readings: 3 });
  });

  test("humidity high in the newest packet is a leak warning, dated from when the run began", () => {
    const seal = housingSeal([row(0), row(8, "HUMIDITY_HIGH"), row(16, "LOW_BATTERY|HUMIDITY_HIGH")]);
    expect(seal).toMatchObject({ state: "high", since: T0 + 8 * HOUR, highCount: 2, lastHigh: T0 + 16 * HOUR });
  });

  test("a past high that cleared is sealed again but remembers the last high", () => {
    const seal = housingSeal([row(0, "HUMIDITY_HIGH"), row(8), row(16)]);
    expect(seal).toMatchObject({ state: "sealed", since: T0 + 8 * HOUR, highCount: 1, lastHigh: T0 });
  });

  test("a failed sensor cannot vouch for the seal, whatever else the packet says", () => {
    expect(housingSeal([row(0), row(8, "HUMIDITY_FAIL")])).toMatchObject({ state: "failed", since: T0 + 8 * HOUR });
  });
});
