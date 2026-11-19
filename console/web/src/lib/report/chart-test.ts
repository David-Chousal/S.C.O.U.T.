import { describe, expect, test } from "vitest";
import { chartGeometry } from "./chart";

const DAY = 24 * 3600 * 1000;
const T0 = Date.parse("2026-11-10T00:00:00Z");
const base = { width: 600, height: 180, from: T0, to: T0 + 4 * DAY, digits: 1 };

describe("chartGeometry", () => {
  test("nothing to draw gives null, not an empty chart", () => {
    expect(chartGeometry({ ...base, series: [{ label: "A", color: "#000", points: [] }] })).toBeNull();
  });

  test("a series becomes one path inside the plot area, with ticks on both axes", () => {
    const g = chartGeometry({ ...base, series: [{ label: "A", color: "#111", points: [{ t: T0, v: 26 }, { t: T0 + DAY, v: 28 }] }] });
    expect(g?.series[0].d).toMatch(/^M44\.0,[\d.]+L/);
    expect(g?.yTicks).toHaveLength(4);
    expect(g?.xTicks).toHaveLength(5);
    expect(g?.legend).toEqual([{ label: "A", color: "#111" }]);
  });

  test("the pen lifts across a silence of more than 26 hours", () => {
    const g = chartGeometry({ ...base, series: [{ label: "A", color: "#111", points: [{ t: T0, v: 26 }, { t: T0 + 3 * DAY, v: 27 }] }] });
    expect(g?.series[0].d.match(/M/g)).toHaveLength(2);
  });

  test("a reading with no neighbour within 26 hours is drawn as a dot", () => {
    const g = chartGeometry({ ...base, series: [{ label: "A", color: "#111", points: [{ t: T0, v: 26 }, { t: T0 + 3 * DAY, v: 27 }, { t: T0 + 3 * DAY + 3600_000, v: 27.5 }] }] });
    expect(g?.dots).toHaveLength(1);
    expect(g?.dots[0].x).toBe(44);
  });

  test("a reference line widens the y range to stay in view", () => {
    const g = chartGeometry({ ...base, series: [{ label: "A", color: "#111", points: [{ t: T0, v: 26 }, { t: T0 + DAY, v: 27 }] }],
      references: [{ value: 30, label: "MMM", color: "#c54a05" }] });
    expect(g?.references[0].y).toBeGreaterThanOrEqual(g?.top ?? 0);
    expect(g?.references[0].y).toBeLessThan(g?.bottom ?? 0);
  });
});
