import { describe, expect, test, vi } from "vitest";
import type { Reading } from "@/lib/api/types";
import { fetchHistory, HISTORY_START, requestBounds, startFor, windowStart } from "./range";

const DAY = 24 * 3600 * 1000;
const NOW = Date.UTC(2026, 10, 15, 12);
const at = (ms: number) => new Date(ms).toISOString().slice(0, 19) + "Z";
const row = (seq: number, hoursAgo: number): Reading => ({ record_seq: String(seq), timestamp_utc: at(NOW - hoursAgo * 3600000) });

describe("dashboard time range", () => {
  test("fixed ranges ask from their start; all history asks from the beginning", () => {
    expect(requestBounds("30d", NOW)).toEqual([at(NOW - 30 * DAY), at(NOW)]);
    expect(requestBounds("all", NOW)[0]).toBe(HISTORY_START);
  });

  test("all history starts the axis at the oldest reading, and each buoy at its own first", () => {
    const readings = { 1: [row(1, 200), row(2, 10)], 2: [row(1, 50)] };
    expect(windowStart("all", NOW, readings)).toBe(NOW - 200 * 3600000);
    const window = { from: NOW - 200 * 3600000, now: NOW, phrase: "all history", allHistory: true };
    expect(startFor(window, readings[2])).toBe(NOW - 50 * 3600000);
    expect(startFor({ ...window, allHistory: false }, readings[2])).toBe(window.from);
  });

  test("history pages back through newest-first pages, deduplicating the shared boundary", async () => {
    const all = Array.from({ length: 25 }, (_, i) => row(i, 25 - i)).reverse(); // newest first
    const page = vi.fn(async (_from: string, to: string) => all.filter((r) => r.timestamp_utc <= to).slice(0, 10));
    const history = await fetchHistory(page, HISTORY_START, at(NOW), 10);
    expect(history.readings.map((r) => r.record_seq)).toEqual(Array.from({ length: 25 }, (_, i) => String(i)));
    expect(history.truncated).toBe(false);
  });

  test("a page that brings nothing new stops the paging instead of looping", async () => {
    const page = vi.fn(async (_from: string, to: string) => Array.from({ length: 10 }, (_, i) => ({ record_seq: `${to}-${i}`, timestamp_utc: to })));
    const history = await fetchHistory(page, HISTORY_START, at(NOW), 10, 3);
    expect(history.truncated).toBe(false);
    expect(page).toHaveBeenCalledTimes(2);
  });

  test("a history longer than the page budget is cut and says so", async () => {
    const all = Array.from({ length: 100 }, (_, i) => row(i, 100 - i)).reverse();
    const page = vi.fn(async (_from: string, to: string) => all.filter((r) => r.timestamp_utc <= to).slice(0, 10));
    const history = await fetchHistory(page, HISTORY_START, at(NOW), 10, 3);
    expect(history.truncated).toBe(true);
    expect(history.readings).toHaveLength(28);
  });
});
