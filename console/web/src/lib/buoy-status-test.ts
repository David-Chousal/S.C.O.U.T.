import { describe, expect, test } from "vitest";
import { batteryTier, buoyHealth, longestGapMs, monthsLeft, nextTransmit, onPackLabel, slotsInUse, untilLabel, utcClock } from "./buoy-status";

const BASE = [600, 29400, 58200];
const HOUR = 3600 * 1000;
const MIDNIGHT = Date.UTC(2026, 10, 4);

describe("buoy status", () => {
  test("slots follow the count and the phase", () => {
    expect(slotsInUse(BASE, 3, 0)).toEqual([600, 29400, 58200]);
    expect(slotsInUse(BASE, 2, 1)).toEqual([600 + 3600, 58200 + 3600]);
  });

  test("the next transmission is the next slot, rolling over midnight", () => {
    const at = nextTransmit(slotsInUse(BASE, 3, 0), MIDNIGHT + 9 * HOUR);
    expect(utcClock(at!)).toBe("16:10 UTC");
    expect(nextTransmit([600], MIDNIGHT + 1 * HOUR)).toBe(MIDNIGHT + 24 * HOUR + 600 * 1000);
    expect(untilLabel(MIDNIGHT + 16 * HOUR + 10 * 60000, MIDNIGHT + 9 * HOUR)).toBe("in 7 h 10 min");
  });

  test("silence is normal up to the longest gap between slots", () => {
    expect(longestGapMs(slotsInUse(BASE, 3, 0))).toBe(8 * HOUR);
    expect(longestGapMs(slotsInUse(BASE, 2, 0))).toBe(16 * HOUR);
    expect(longestGapMs(slotsInUse(BASE, 1, 0))).toBe(24 * HOUR);
  });

  test("live, late, silent and not heard", () => {
    const slots = slotsInUse(BASE, 3, 0);
    const now = MIDNIGHT + 20 * HOUR;
    expect(buoyHealth(now - 2 * HOUR, slots, now).word).toBe("Live");
    expect(buoyHealth(now - 12 * HOUR, slots, now).word).toBe("Late");
    expect(buoyHealth(now - 30 * HOUR, slots, now).word).toBe("Silent");
    expect(buoyHealth(null, slots, now).word).toBe("Not heard");
  });

  test("months left is the estimate minus time on the pack, never below zero", () => {
    const life = { scenario: "best" as const, tx_per_day: 3, cells: 2, mah_per_day: 16, days: 1466, months: 48.2 };
    expect(monthsLeft(life, 0)!.toFixed(1)).toBe("48.2");
    expect(monthsLeft(life, 366 * 86400)!.toFixed(1)).toBe("36.1");
    expect(monthsLeft(life, 5000 * 86400)).toBe(0);
    expect(monthsLeft(life, null)).toBeNull();
    expect(onPackLabel(3 * 86400 + 5)).toBe("3 d");
  });

  test("the battery tier follows the buoy's own thresholds", () => {
    expect(batteryTier(3.58, 3200, 3100).word).toBe("Normal");
    expect(batteryTier(3.15, 3200, 3100).word).toBe("Conserve");
    expect(batteryTier(3.05, 3200, 3100).word).toBe("Critical");
  });
});
