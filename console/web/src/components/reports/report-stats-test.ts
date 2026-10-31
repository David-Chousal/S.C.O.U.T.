import { describe, expect, test } from "vitest";
import { summarize } from "./report-stats";

const rows = [
  { temp_c: "26.0", battery_v: "3.31", flags: "" },
  { temp_c: "26.6", battery_v: "", flags: "LOW_BATT" },
  { temp_c: "x", battery_v: "3.29", flags: "" },
];

describe("summarize", () => {
  test("counts, min, mean and max per numeric variable, skipping blanks and text", () => {
    const [temp, battery] = summarize(rows, ["temp_c", "battery_v"]);
    expect(temp).toEqual({ column: "temp_c", count: 2, min: 26, mean: 26.3, max: 26.6 });
    expect(battery.count).toBe(2);
    expect(battery.mean).toBeCloseTo(3.3);
  });

  test("a variable with no numbers says so with nulls", () => {
    expect(summarize(rows, ["flags"])[0]).toEqual({ column: "flags", count: 0, min: null, mean: null, max: null });
  });
});
