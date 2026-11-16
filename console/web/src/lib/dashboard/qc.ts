// Automated quality control in the manner of IOOS QARTOD's real-time tests, so every value on
// the Overview carries a flag: 1 Pass, 3 Suspect, 4 Fail (QARTOD's flag scheme, after UNESCO
// 2013). Tests: gross range (sensor → Fail, site → Suspect), spike, rate of change, flat line, and
// clipped recordings for the acoustic columns. Limits live in metric-profiles.ts.

import type { MetricProfile } from "./metric-profiles";
import type { Point } from "./metrics";

export type QcCode = 1 | 3 | 4;
export type QcTest = "Sensor range" | "Site range" | "Spike" | "Rate of change" | "Flat line" | "Clipped recording";

export interface QcFlag { code: QcCode; tests: QcTest[] }

export interface QcResult {
  flags: QcFlag[];
  pass: number;
  suspect: number;
  fail: number;
  /** How many points each test flagged. */
  byTest: Partial<Record<QcTest, number>>;
}

// Neighbours more than a day and a bit apart are not compared (a gap, not a spike).
const NEIGHBOUR_MS = 26 * 3600 * 1000;
const RATE_SIGMAS = 3;
const MIN_RATE_POINTS = 8;

function standardDeviation(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
}

function grossRange(p: Point, profile: MetricProfile): QcTest | null {
  if (p.v < profile.sensor[0] || p.v > profile.sensor[1]) return "Sensor range";
  if (profile.expected && (p.v < profile.expected[0] || p.v > profile.expected[1])) return "Site range";
  return null;
}

function spikes(points: Point[], size: number): Set<number> {
  const hit = new Set<number>();
  for (let i = 1; i < points.length - 1; i += 1) {
    const [before, here, after] = [points[i - 1], points[i], points[i + 1]];
    if (after.t - before.t > 2 * NEIGHBOUR_MS) continue;
    // QARTOD's spike reference: the distance from the neighbours' mean, less half their own difference.
    if (Math.abs(here.v - (before.v + after.v) / 2) - Math.abs((after.v - before.v) / 2) > size) hit.add(i);
  }
  return hit;
}

function fastChanges(points: Point[]): Set<number> {
  const hit = new Set<number>();
  if (points.length < MIN_RATE_POINTS) return hit;
  // Only steps between neighbouring readings: a step across a silent gap is not a rate.
  const steps = points.slice(1).map((p, i) => ({ at: i + 1, step: p.v - points[i].v, near: p.t - points[i].t <= NEIGHBOUR_MS }))
    .filter((s) => s.near);
  if (steps.length < MIN_RATE_POINTS - 1) return hit;
  // QARTOD's rate-of-change test: a step larger than N standard deviations of the values.
  const sd = standardDeviation(points.map((p) => p.v));
  if (sd === 0) return hit;
  for (const { at, step } of steps) if (Math.abs(step) > RATE_SIGMAS * sd) hit.add(at);
  return hit;
}

function flatRuns(points: Point[], eps: number, count: number): Set<number> {
  const hit = new Set<number>();
  let start = 0;
  for (let i = 1; i <= points.length; i += 1) {
    const window = points.slice(start, i + 1).map((p) => p.v);
    const stillFlat = i < points.length && Math.max(...window) - Math.min(...window) <= eps;
    if (stillFlat) continue;
    if (i - start >= count) for (let k = start; k < i; k += 1) hit.add(k);
    start = i;
  }
  return hit;
}

/** Flag every point. `clipped` holds the times of recordings that clipped. */
export function qualityControl(points: Point[], profile: MetricProfile, clipped: ReadonlySet<number> = new Set()): QcResult {
  const spike = profile.spike === undefined ? new Set<number>() : spikes(points, profile.spike);
  const rate = fastChanges(points);
  const flat = profile.flat ? flatRuns(points, profile.flat.eps, profile.flat.count) : new Set<number>();
  const flags = points.map((p, i): QcFlag => {
    const range = grossRange(p, profile);
    const tests = [
      range,
      spike.has(i) ? "Spike" : null,
      rate.has(i) ? "Rate of change" : null,
      flat.has(i) ? "Flat line" : null,
      profile.clipAware && clipped.has(p.t) ? "Clipped recording" : null,
    ].filter((test): test is QcTest => test !== null);
    const code: QcCode = range === "Sensor range" ? 4 : tests.length ? 3 : 1;
    return { code, tests };
  });
  const byTest: Partial<Record<QcTest, number>> = {};
  for (const flag of flags) for (const test of flag.tests) byTest[test] = (byTest[test] ?? 0) + 1;
  return {
    flags, byTest,
    pass: flags.filter((f) => f.code === 1).length,
    suspect: flags.filter((f) => f.code === 3).length,
    fail: flags.filter((f) => f.code === 4).length,
  };
}

/** Plain words for a QC result. */
export function qcLabel(qc: Pick<QcResult, "suspect" | "fail">): string {
  if (qc.fail) return `${qc.fail} fail${qc.suspect ? ` · ${qc.suspect} suspect` : ""}`;
  return qc.suspect ? `${qc.suspect} suspect` : "QC pass";
}
