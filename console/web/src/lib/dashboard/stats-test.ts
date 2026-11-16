import { describe, expect, test } from "vitest";
import { completeness, dailyMedians, daysTo, dielMeans, normalCdf, quantile, spread, trend } from "./stats";

const DAY = 24 * 3600 * 1000;
const T0 = Date.UTC(2026, 10, 1);
/** Three readings a day at 02, 10 and 18 UTC, with a diel swing and a steady rise. */
const series = (days: number, perDay: number, swing = 0) =>
  Array.from({ length: days * 3 }, (_, i) => {
    const t = T0 + Math.floor(i / 3) * DAY + [2, 10, 18][i % 3] * 3600 * 1000;
    return { t, v: 26 + perDay * ((t - T0) / DAY) + swing * [0, 1, -1][i % 3] };
  });

describe("robust statistics", () => {
  test("quantiles interpolate like R's type 7", () => {
    expect(quantile([1, 2, 3, 4], 0.25)).toBe(1.75);
    expect(spread([5, 1, 3])).toEqual({ median: 3, q1: 2, q3: 4 });
  });

  test("the normal CDF is accurate", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
  });

  test("a steady rise is found and its Sen slope is the rate per day", () => {
    const result = trend(series(7, 0.1));
    expect(result.direction).toBe("rising");
    expect(result.slopePerDay).toBeCloseTo(0.1, 6);
  });

  test("a large daily cycle with no rise is not mistaken for a trend", () => {
    expect(trend(series(7, 0, 2)).direction).toBe("steady");
  });

  test("over long spans the trend runs on daily medians and still finds the rate", () => {
    const result = trend(series(60, 0.05, 2));
    expect(result.basis).toBe("daily medians");
    expect(result.direction).toBe("rising");
    expect(result.slopePerDay).toBeCloseTo(0.05, 2);
    expect(dailyMedians(series(2, 0, 2)).length).toBe(2);
  });

  test("a change in which transmit hours arrive is not mistaken for a trend", () => {
    // A fixed daily cycle (26 at 02:00, 28 at 10:00), but only 02:00 arrives for 15 days, then only 10:00.
    const early = Array.from({ length: 15 }, (_, d) => ({ t: T0 + d * DAY + 2 * 3600 * 1000, v: 26 }));
    const late = Array.from({ length: 15 }, (_, d) => ({ t: T0 + (15 + d) * DAY + 10 * 3600 * 1000, v: 28 }));
    const result = trend([...early, ...late]);
    expect(result.basis).toBe("daily medians");
    expect(result.direction).toBe("steady");
  });

  test("too few readings give no trend", () => {
    expect(trend(series(2, 0.1)).direction).toBe("too few");
  });

  test("days to a floor only when falling", () => {
    const falling = trend(series(7, -0.01));
    expect(daysTo(3.1, 3.5, falling)).toBeCloseTo(40, 3);
    expect(daysTo(3.1, 3.5, trend(series(7, 0.01)))).toBeNull();
  });

  test("completeness and diel means", () => {
    expect(completeness(15, 21)).toBeCloseTo(15 / 21);
    expect(dielMeans(series(2, 0, 2)).map((d) => [d.hour, d.mean])).toEqual([[2, 26], [10, 28], [18, 24]].map(([h, m]) => [h, expect.closeTo(m, 1)]));
  });
});
