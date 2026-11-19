import { describe, expect, test } from "vitest";
import type { Reading } from "@/lib/api/types";
import { createBlock } from "../document";
import type { ReadingsEntry } from "../readings-store";
import { readingsTableView, sample, summaryTableView } from "./tables";
import type { ViewContext } from "./types";
import { ALERTS, FLEET, HEAT } from "./fixtures";

const row = (iso: string, temp: string): Reading => ({ timestamp_utc: iso, record_seq: iso, temp_c: temp, battery_v: "3.7" });
const ROWS = [row("2026-11-17T00:10:00Z", "27"), row("2026-11-17T00:40:00Z", "28"), row("2026-11-17T05:00:00Z", "29")];

function context(entries: Record<number, ReadingsEntry>, buoys = [1]): ViewContext {
  return {
    report: { buoys, range: { preset: "7d", from: "", to: "" }, zone: "utc" },
    now: Date.parse("2026-11-18T00:00:00Z"),
    buoyLabel: (id) => `Buoy ${id}`, title: "Weekly", contentWidth: 720, fleet: FLEET, heat: HEAT, alerts: ALERTS,
    readings: (id) => entries[id] ?? { status: "loading" },
  };
}
const ready = (rows: Reading[]): ReadingsEntry => ({ status: "ready", rows, truncated: false });

describe("summaryTableView", () => {
  test("one row per variable with count, min, mean and max", () => {
    const block = { ...createBlock("summaryTable", "s"), options: { variables: ["temp_c"] } };
    const view = summaryTableView(block, context({ 1: ready(ROWS) }));
    expect(view.sections[0].note).toBe("3 readings");
    expect(view.sections[0].body?.rows).toEqual([["Water temperature (°C)", "3", "27", "28", "29"]]);
  });

  test("a buoy still loading, failed or empty says so instead of a table", () => {
    const view = summaryTableView(createBlock("summaryTable"), context({ 2: { status: "failed", error: "Down" }, 3: ready([]) }, [1, 2, 3]));
    expect(view.sections.map((s) => [s.status, s.message])).toEqual([["loading", "Loading…"], ["failed", "Down"], ["empty", "No readings in this range."]]);
  });

  test("an override on the block picks its own buoys", () => {
    const block = { ...createBlock("summaryTable"), override: { buoys: [2] } };
    expect(summaryTableView(block, context({ 2: ready(ROWS) }, [1, 3])).sections.map((s) => s.heading)).toEqual(["Buoy 2"]);
  });
});

test("a buoy whose fetch hit the cap says its figures cover only part of the range", () => {
  const view = summaryTableView(createBlock("summaryTable"), context({ 1: { status: "ready", rows: ROWS, truncated: true } }));
  expect(view.sections[0].note).toBe("3 readings; incomplete: not every reading in the range could be loaded");
});

describe("readingsTableView", () => {
  test("lists readings in the report's zone and caps the rows", () => {
    const block = { ...createBlock("readingsTable"), options: { variables: ["temp_c"], sampling: "all" as const, rowCap: 2 } };
    const view = readingsTableView(block, context({ 1: ready(ROWS) }));
    expect(view.sections[0].body?.headers).toEqual(["Taken (UTC)", "Water temperature"]);
    expect(view.sections[0].body?.rows).toEqual([["2026-11-17 00:10", "27"], ["2026-11-17 00:40", "28"]]);
    expect(view.footnote).toBe("1 more readings are not shown here (limit 2 a buoy); the CSV holds them all.");
  });

  test("hourly sampling keeps the last reading in each hour", () => {
    expect(sample(ROWS, "hourly", "utc").map((r) => r.temp_c)).toEqual(["28", "29"]);
    expect(sample(ROWS, "daily", "utc").map((r) => r.temp_c)).toEqual(["29"]);
  });
});
