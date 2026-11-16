import { describe, expect, test } from "vitest";
import type { Reading } from "@/lib/api/types";
import { analyse, clippedTimes, senLine } from "./analysis";

const T0 = Date.UTC(2026, 10, 1);
const HOUR = 3600 * 1000;
const row = (i: number, fields: Record<string, string>): Reading => ({
  record_seq: String(i), timestamp_utc: new Date(T0 + i * 8 * HOUR).toISOString().slice(0, 19) + "Z", ...fields,
});

describe("metric analysis", () => {
  test("a failed value is flagged but kept out of the median", () => {
    const rows = [26.0, 26.2, 126, 26.4, 26.6].map((v, i) => row(i, { temp_c: String(v) }));
    const result = analyse(rows, "temp_c");
    expect(result?.qc.fail).toBe(1);
    expect(result?.spread.median).toBeCloseTo(26.3);
  });

  test("acoustic values from a clipped recording are suspect", () => {
    const rows = [row(0, { lvl_bio_cdb: "-2500", clip_count: "0" }), row(1, { lvl_bio_cdb: "-2400", clip_count: "400" }), row(2, { lvl_bio_cdb: "-2450", clip_count: "12" })];
    expect([...clippedTimes(rows)]).toEqual([T0 + 8 * HOUR]);
    expect(analyse(rows, "lvl_bio_cdb")?.qc.flags[2].code).toBe(1);
    expect(analyse(rows, "lvl_bio_cdb")?.qc.flags[1].tests).toEqual(["Clipped recording"]);
  });

  test("a column with no values has no analysis", () => {
    expect(analyse([row(0, { temp_c: "" })], "temp_c")).toBeNull();
  });

  test("the Sen line spans the points at the trend's slope", () => {
    const line = senLine([{ t: 0, v: 1 }, { t: 24 * HOUR, v: 2 }, { t: 48 * HOUR, v: 3 }], 1);
    expect(line?.from.v).toBeCloseTo(1);
    expect(line?.to.v).toBeCloseTo(3);
  });
});
