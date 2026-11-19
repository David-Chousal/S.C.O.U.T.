import { describe, expect, test } from "vitest";
import type { Reading } from "@/lib/api/types";
import { createBlock } from "../document";
import type { ReadingsEntry } from "../readings-store";
import { timeSeriesView } from "./figures";
import { ALERTS, FLEET, HEAT } from "./fixtures";
import { buoyHealthView, heatStressView } from "./fleet";
import type { ViewContext } from "./types";

const ctx = (readings: Record<number, ReadingsEntry>, buoys = [1]): ViewContext => ({
  report: { buoys, range: { preset: "custom", from: "2026-11-14", to: "2026-11-16" }, zone: "utc" }, now: Date.parse("2026-11-18T12:00:00Z"),
  title: "T", contentWidth: 720, fleet: FLEET, heat: HEAT, alerts: ALERTS, buoyLabel: (id) => `Buoy ${id}`, readings: (id) => readings[id] ?? { status: "loading" },
});
const row = (iso: string, temp: string): Reading => ({ timestamp_utc: iso, record_seq: iso, temp_c: temp });

describe("figure views", () => {
  test("a blank cell is not drawn as zero", () => {
    const rows = [row("2026-11-15T00:00:00Z", "27"), row("2026-11-15T06:00:00Z", ""), row("2026-11-15T12:00:00Z", "28")];
    const view = timeSeriesView(createBlock("timeSeries"), ctx({ 1: { status: "ready", rows, truncated: false } }));
    expect(view.sections[0].body?.yTicks[0].label).not.toBe("0.0");
    expect(view.sections[0].body?.series[0].d.match(/L/g)).toHaveLength(1);
  });

  test("a chart from capped readings says so", () => {
    const rows = [row("2026-11-15T00:00:00Z", "27"), row("2026-11-15T12:00:00Z", "28")];
    expect(timeSeriesView(createBlock("timeSeries"), ctx({ 1: { status: "ready", rows, truncated: true } })).sections[0].note).toContain("not every reading");
  });

  test("the heat-stress peak is the peak of the days shown", () => {
    const view = heatStressView(createBlock("heatStress"), ctx({}));
    // The fixture's DHW climbs 0.3 a day from 2026-11-10; the 14th to the 16th peaks on the 16th.
    expect(view.sections[0].note).toBe("peak 1.8 °C-wk, worst Bleaching Watch");
  });

  test("buoy health is loading until every buoy's readings are in", () => {
    expect(buoyHealthView(createBlock("buoyHealth"), ctx({})).sections[0].status).toBe("loading");
    expect(buoyHealthView(createBlock("buoyHealth"), ctx({ 1: { status: "ready", rows: [], truncated: false } })).sections[0].status).toBe("ready");
  });
});

test("an empty chart from incomplete readings still says the readings are incomplete", () => {
  const view = timeSeriesView(createBlock("timeSeries"), ctx({ 1: { status: "ready", rows: [row("2026-11-15T00:00:00Z", "")], truncated: true } }));
  expect(view.sections[0].status).toBe("empty");
  expect(view.sections[0].note).toContain("not every reading");
});

test("a buoy whose readings failed is not shown as merely unmeasured", () => {
  const view = buoyHealthView(createBlock("buoyHealth"), ctx({ 1: { status: "failed", error: "Down" } }));
  expect(view.sections[0].status).toBe("failed");
  expect(view.sections[0].body?.rows[0][1]).toBe("Not loaded");
});
