// Robust statistics for the Overview: median and IQR rather than mean and SD (environmental data
// is skewed and spiky), and trends as a Theil–Sen slope with a Mann–Kendall test. Both run within
// each UTC hour of the day and are combined (the Seasonal Kendall approach, with the transmit slot
// as the "season"), so a buoy that always samples at the same hours cannot fake a trend out of
// its daily cycle. References: Sen 1968; Hirsch, Slack & Smith 1982; Helsel et al. 2020 (USGS).

import type { Point } from "./metrics";

const DAY_MS = 24 * 3600 * 1000;
const HOUR_MS = 3600 * 1000;
/** Fewer readings than this and a trend test means little. */
export const MIN_TREND_POINTS = 8;
const SIGNIFICANCE = 0.05;

/** Linear-interpolated quantile (type 7, R's default) of unsorted values. */
export function quantile(values: number[], q: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

export interface Spread { median: number; q1: number; q3: number }

export function spread(values: number[]): Spread {
  return { median: quantile(values, 0.5), q1: quantile(values, 0.25), q3: quantile(values, 0.75) };
}

/** Standard normal CDF (Abramowitz & Stegun 7.1.26, error under 1.5e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** The readings grouped by the UTC hour they were taken in. */
function bySlot(points: Point[]): Point[][] {
  const groups = new Map<number, Point[]>();
  for (const p of points) {
    const hour = Math.floor((p.t % DAY_MS) / HOUR_MS);
    groups.set(hour, [...(groups.get(hour) ?? []), p]);
  }
  return [...groups.values()].map((g) => [...g].sort((a, b) => a.t - b.t));
}

function tieTerm(values: number[]): number {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.values()].reduce((sum, t) => sum + t * (t - 1) * (2 * t + 5), 0);
}

export type TrendDirection = "rising" | "falling" | "steady" | "too few";

export interface Trend {
  /** Theil–Sen slope, units per day. */
  slopePerDay: number;
  /** Two-sided Mann–Kendall p-value. */
  p: number;
  n: number;
  direction: TrendDirection;
}

/** Seasonal Theil–Sen slope and Seasonal Mann–Kendall test, with each UTC hour as a season. */
export function trend(points: Point[]): Trend {
  const n = points.length;
  if (n < MIN_TREND_POINTS) return { slopePerDay: 0, p: 1, n, direction: "too few" };
  const slopes: number[] = [];
  let s = 0;
  let variance = 0;
  for (const group of bySlot(points)) {
    const m = group.length;
    for (let i = 0; i < m; i += 1) {
      for (let j = i + 1; j < m; j += 1) {
        const dv = group[j].v - group[i].v;
        s += Math.sign(dv);
        if (group[j].t > group[i].t) slopes.push(dv / ((group[j].t - group[i].t) / DAY_MS));
      }
    }
    variance += (m * (m - 1) * (2 * m + 5) - tieTerm(group.map((p) => p.v))) / 18;
  }
  if (slopes.length === 0) return { slopePerDay: 0, p: 1, n, direction: "too few" };
  // Every season all ties: nothing changes, so there is no trend to test.
  if (variance <= 0) return { slopePerDay: 0, p: 1, n, direction: "steady" };
  const z = s > 0 ? (s - 1) / Math.sqrt(variance) : s < 0 ? (s + 1) / Math.sqrt(variance) : 0;
  const p = 2 * (1 - normalCdf(Math.abs(z)));
  const slopePerDay = quantile(slopes, 0.5);
  const direction: TrendDirection = p >= SIGNIFICANCE || slopePerDay === 0 ? "steady" : slopePerDay > 0 ? "rising" : "falling";
  return { slopePerDay, p, n, direction };
}

/** Days until a value of `latest` reaches `floor` at the trend's rate; null unless it is significantly falling. */
export function daysTo(floor: number, latest: number, slope: Trend): number | null {
  if (slope.direction !== "falling" || latest <= floor) return null;
  return (latest - floor) / -slope.slopePerDay;
}

/** Share of the expected readings that arrived, 0–1. */
export function completeness(count: number, expected: number): number {
  return expected > 0 ? Math.min(1, count / expected) : 0;
}

/** Mean value by UTC hour of day: the diel cycle. */
export function dielMeans(points: Point[]): { hour: number; mean: number; n: number }[] {
  return bySlot(points).map((group) => ({
    hour: Math.floor((group[0].t % DAY_MS) / HOUR_MS),
    mean: group.reduce((sum, p) => sum + p.v, 0) / group.length,
    n: group.length,
  })).sort((a, b) => a.hour - b.hour);
}
