import { describe, expect, test } from "vitest";
import type { Reading } from "@/lib/api/types";
import { delivery, digitsFor, durationLabel, issues, metricStats, pointsFor, restarts, signed } from "./metrics";

const T0 = Date.UTC(2026, 10, 10);
const HOUR = 3600 * 1000;
const row = (hours: number, fields: Record<string, string>): Reading => ({
  record_seq: String(hours), timestamp_utc: new Date(T0 + hours * HOUR).toISOString().slice(0, 19) + "Z", ...fields,
});

describe("dashboard metrics", () => {
  test("blank cells are skipped, not read as zero", () => {
    expect(pointsFor([row(0, { temp_c: "" }), row(1, { temp_c: "26.1" }), row(2, {})], "temp_c")).toEqual([{ t: T0 + HOUR, v: 26.1 }]);
  });

  test("stats give the week's range and the change from the reading closest to a day earlier", () => {
    const stats = metricStats(pointsFor([row(0, { temp_c: "25.0" }), row(8, { temp_c: "25.5" }), row(24, { temp_c: "26.0" })], "temp_c"));
    expect(stats).toMatchObject({ min: 25, max: 26, mean: 25.5, count: 3, change: 1 });
  });

  test("no change is claimed when nothing was read within 6 hours of a day earlier", () => {
    expect(metricStats(pointsFor([row(0, { temp_c: "25" }), row(12, { temp_c: "26" })], "temp_c"))?.change).toBeNull();
  });

  test("delivery counts packets once against the reported transmit count, defaulting to 3 a day", () => {
    const rows = [row(0, {}), row(0, {}), row(8, {})];
    expect(delivery(rows, { tx_count_reported: 2 })).toEqual({ received: 2, expected: 14, ratio: 2 / 14 });
    expect(delivery(rows, { tx_count_reported: null }).expected).toBe(21);
  });

  test("a restart is uptime that went down between readings", () => {
    expect(restarts([row(0, { uptime_s: "100" }), row(8, { uptime_s: "200" }), row(16, { uptime_s: "5" })])).toBe(1);
  });

  test("issues count every flag and SOH bit, current and severe first", () => {
    const list = issues([row(0, { flags: "SD_RETRY|TURBIDITY_RANGE", soh: "" }), row(8, { flags: "SD_RETRY", soh: "" }), row(16, { flags: "", soh: "LORA_INIT_FAIL" })]);
    expect(list.map((i) => [i.code, i.count, i.current])).toEqual([["LORA_INIT_FAIL", 1, true], ["SD_RETRY", 2, false], ["TURBIDITY_RANGE", 1, false]]);
  });

  test("labels read plainly", () => {
    expect(durationLabel(3 * 86400 + 4 * 3600)).toBe("3 d 4 h");
    expect(durationLabel(8 * 60)).toBe("8 min");
    expect(signed(0.42, 2)).toBe("+0.42");
    expect(signed(-1.3, 1)).toBe("−1.3");
    expect(signed(0.001, 1)).toBe("±0.0");
    expect(digitsFor([row(0, { battery_v: "3.71" })], "battery_v")).toBe(2);
  });
});
