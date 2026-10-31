import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import estimates from "../../../worker/battery-life.json";
import { freshness } from "@/components/stations/stations-board";
import type { Estimates } from "./api/types";
import { lastHeard, lifeFor, months, newestPacket, plural, utc } from "./format";
import { can, needs } from "./session";

const HOUR = 3600 * 1000;

describe("format", () => {
  test("times are UTC to the minute", () => {
    expect(utc(Date.UTC(2026, 9, 26, 7, 33, 59))).toBe("2026-10-26 07:33 UTC");
    expect(utc(null)).toBe("—");
  });

  test("plural picks the right word", () => {
    expect(plural(1, "person", "people")).toBe("1 person");
    expect(plural(3, "person", "people")).toBe("3 people");
  });

  test("lifeFor reads the shared battery-life export", () => {
    const life = lifeFor(estimates as Estimates, 3, 2);
    expect(life.best?.days).toBeGreaterThan(life.pessimistic?.days ?? Infinity);
    expect(months(life.best)).toMatch(/^\d+\.\d mo$/);
    expect(months(undefined)).toBe("—");
  });
});

describe("station freshness", () => {
  const now = Date.UTC(2026, 9, 26, 12);
  test("never, live, stale, silent", () => {
    expect(freshness(null, now, 9 * HOUR).word).toBe("Never");
    expect(freshness(now - 8 * HOUR, now, 9 * HOUR).state).toBe("ok");
    expect(freshness(now - 10 * HOUR, now, 9 * HOUR).state).toBe("stale");
    expect(freshness(now - 25 * HOUR, now, 9 * HOUR).state).toBe("failed");
  });
});

describe("session roles mirror the Worker", () => {
  test("every action needs the same role as console/worker/roles.js says", () => {
    // vitest runs from console/web.
    const worker = readFileSync(resolve(process.cwd(), "../worker/roles.js"), "utf8");
    const pairs = [...worker.matchAll(/"([a-z.]+)": "(guest|member|admin)"/g)].map((m) => [m[1], m[2]]);
    expect(pairs.length).toBeGreaterThan(5);
    for (const [action, role] of pairs) expect(needs(action as Parameters<typeof needs>[0])).toBe(role);
  });

  test("guests change nothing; members change settings; admins everything", () => {
    expect(can("guest", "settings.write")).toBe(false);
    expect(can("member", "settings.write")).toBe(true);
    expect(can("member", "devices.write")).toBe(false);
    expect(can("admin", "users.disable")).toBe(true);
  });
});

describe("a buoy whose clock was lost", () => {
  const good = { clock_lost: 0, reported_at: Date.UTC(2026, 2, 1), last_seen_at: Date.UTC(2026, 2, 5) };
  const lost = { ...good, clock_lost: 1 };

  test("is judged by when its row arrived, not by its own timestamp", () => {
    expect(lastHeard(good)).toBe(good.reported_at);
    expect(lastHeard(lost)).toBe(lost.last_seen_at);
  });

  test("says so instead of showing a time it cannot vouch for", () => {
    expect(newestPacket(good, utc)).toBe("newest packet 2026-03-01 00:00 UTC");
    expect(newestPacket(lost, utc)).toBe("buoy clock lost · last heard 2026-03-05 00:00 UTC");
  });
});
