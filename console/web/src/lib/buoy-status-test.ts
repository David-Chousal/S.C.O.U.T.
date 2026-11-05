import { describe, expect, test } from "vitest";
import { buoyHealth, longestGapMs, slotsInUse } from "./buoy-status";

const BASE = [600, 29400, 58200];
const HOUR = 3600 * 1000;
const MIDNIGHT = Date.UTC(2026, 10, 4);

describe("buoy status", () => {
  test("slots follow the count and the phase", () => {
    expect(slotsInUse(BASE, 3, 0)).toEqual([600, 29400, 58200]);
    expect(slotsInUse(BASE, 2, 1)).toEqual([600 + 3600, 58200 + 3600]);
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
});
