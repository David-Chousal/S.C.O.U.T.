import { describe, expect, test } from "vitest";
import { effectiveVariables, formatWhen, isOverridden, resolveRange, type ReportVariables } from "./variables";

const NOW = Date.parse("2026-11-18T12:30:45.678Z");
const REPORT: ReportVariables = { buoys: [1, 2], range: { preset: "7d", from: "2026-11-01", to: "2026-11-05" }, zone: "utc" };

describe("resolveRange", () => {
  test("a preset counts back from now, to the second", () => {
    expect(resolveRange({ preset: "24h", from: "", to: "" }, NOW, "utc")).toEqual({ from: "2026-11-17T12:30:45Z", to: "2026-11-18T12:30:45Z" });
  });

  test("a custom range covers whole UTC days", () => {
    expect(resolveRange({ preset: "custom", from: "2026-11-01", to: "2026-11-05" }, NOW, "utc"))
      .toEqual({ from: "2026-11-01T00:00:00Z", to: "2026-11-05T23:59:59Z" });
  });
});

describe("effectiveVariables", () => {
  test("a block without an override takes the report's variables", () => {
    expect(effectiveVariables(REPORT, {})).toEqual(REPORT);
  });

  test("an override replaces only what it sets", () => {
    const range = { preset: "24h" as const, from: "", to: "" };
    expect(effectiveVariables(REPORT, { range })).toEqual({ ...REPORT, range });
    expect(effectiveVariables(REPORT, { buoys: [2] }).buoys).toEqual([2]);
  });

  test("isOverridden is true only when the block sets something", () => {
    expect(isOverridden({})).toBe(false);
    expect(isOverridden({ buoys: [1] })).toBe(true);
  });
});

test("formatWhen writes UTC as YYYY-MM-DD HH:MM", () => {
  expect(formatWhen("2026-11-18T07:05:00Z", "utc")).toBe("2026-11-18 07:05");
});

test("a custom range with a cleared day falls back to the last 7 days instead of throwing", () => {
  expect(resolveRange({ preset: "custom", from: "", to: "2026-11-05" }, NOW, "utc")).toEqual(resolveRange({ preset: "7d", from: "", to: "" }, NOW, "utc"));
});
