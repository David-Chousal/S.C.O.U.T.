import { describe, expect, test, vi } from "vitest";
import type { Reading } from "@/lib/api/types";
import { readingsInRange } from "./readings-store";

const at = (i: number) => new Date(Date.parse("2026-11-01T00:00:00Z") + i * 60_000).toISOString().slice(0, 19) + "Z";
const row = (i: number): Reading => ({ timestamp_utc: at(i), record_seq: String(i), temp_c: "25" });
const RANGE = { from: at(0), to: at(5000) };

/** A fake readings API over `count` rows: newest first, at most 1,000, within from..to. */
function fakeApi(count: number) {
  const all = Array.from({ length: count }, (_, i) => row(i));
  return vi.fn(async (_buoy: number, from: string, to: string) => ({
    readings: all.filter((r) => r.timestamp_utc >= from && r.timestamp_utc <= to).reverse().slice(0, 1000),
  }));
}

describe("readingsInRange", () => {
  test("one short page is returned oldest first", async () => {
    const read = fakeApi(3);
    const { rows, truncated } = await readingsInRange(1, RANGE, read);
    expect(rows.map((r) => r.record_seq)).toEqual(["0", "1", "2"]);
    expect(truncated).toBe(false);
    expect(read).toHaveBeenCalledTimes(1);
  });

  test("pages back through more than 1,000 readings without losing or repeating one", async () => {
    const read = fakeApi(2500);
    const { rows } = await readingsInRange(1, RANGE, read);
    expect(rows).toHaveLength(2500);
    expect(new Set(rows.map((r) => r.record_seq)).size).toBe(2500);
    expect(rows[0].record_seq).toBe("0");
  });
});
