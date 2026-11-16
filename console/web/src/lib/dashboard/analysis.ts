// One buoy's analysis of one metric over the window: its points, quality flags, robust spread,
// trend and completeness. What every tile and the detail view read from.

import type { Reading } from "@/lib/api/types";
import { profileFor, type MetricProfile } from "./metric-profiles";
import { digitsFor, metricStats, pointsFor, type MetricStats, type Point } from "./metrics";
import { qualityControl, type QcResult } from "./qc";
import { spread, trend, type Spread, type Trend } from "./stats";

export interface MetricAnalysis {
  profile: MetricProfile;
  points: Point[];
  /** Latest and change cover every point (a failed newest value stays visible); min, max and count
   * cover only the points that did not fail QC, like the spread and trend. */
  stats: MetricStats;
  /** Median and quartiles of the usable points; null when every point failed QC. */
  spread: Spread | null;
  trend: Trend;
  qc: QcResult;
  digits: number;
}

/** Clipped samples above which a recording's acoustic values are suspect: about 0.01 % of a
 * 60 s recording at 22.05 kHz (ADR-0011). A few clipped samples barely move a band level. */
export const CLIP_LIMIT = 100;

/** The times of readings whose recording clipped more than CLIP_LIMIT samples. */
export function clippedTimes(rows: Reading[]): Set<number> {
  return new Set(pointsFor(rows, "clip_count").filter((p) => p.v > CLIP_LIMIT).map((p) => p.t));
}

/** Analyse one column of one buoy's rows; null when the column has no values. Trend and spread
 * use only points that did not fail QC, so one bad reading cannot drag them. */
export function analyse(rows: Reading[], column: string): MetricAnalysis | null {
  const points = pointsFor(rows, column);
  const stats = metricStats(points);
  if (!stats) return null;
  const profile = profileFor(column);
  const qc = qualityControl(points, profile, profile.clipAware ? clippedTimes(rows) : undefined);
  const usable = points.filter((_, i) => qc.flags[i].code !== 4);
  const values = usable.map((p) => p.v);
  return {
    profile, points, qc,
    stats: { ...stats, count: values.length, min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null },
    spread: values.length ? spread(values) : null,
    trend: trend(usable),
    digits: digitsFor(rows, column),
  };
}

/** The points that did not fail QC: what statistics and trend lines are drawn from. */
export function usablePoints(analysis: Pick<MetricAnalysis, "points" | "qc">): Point[] {
  return analysis.points.filter((_, i) => analysis.qc.flags[i].code !== 4);
}

/** A value at the analysis's precision, or a dash when there is none. */
export function fixed(value: number | null, digits: number): string {
  return value === null ? "—" : value.toFixed(digits);
}

/** Sen line through a buoy's points: the trend's slope through the median point (for drawing). */
export function senLine(points: Point[], slopePerDay: number): { from: Point; to: Point } | null {
  if (points.length < 2) return null;
  const dayMs = 24 * 3600 * 1000;
  const ts = points.map((p) => p.t).sort((a, b) => a - b);
  const intercepts = points.map((p) => p.v - (slopePerDay * p.t) / dayMs).sort((a, b) => a - b);
  const b = intercepts[Math.floor(intercepts.length / 2)];
  const at = (t: number) => ({ t, v: b + (slopePerDay * t) / dayMs });
  return { from: at(ts[0]), to: at(ts[ts.length - 1]) };
}
