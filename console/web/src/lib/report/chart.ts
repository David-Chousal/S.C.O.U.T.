// Chart geometry for report blocks, computed once and drawn twice: as DOM SVG on screen and as
// react-pdf Svg in the file. Ticks, padding and the gap rule are the dashboard's (plot.tsx, trace-bay.tsx).

import { niceTicks, padded, timeTicks } from "@/components/dashboard/plot";
import { path } from "@/components/dashboard/trace-bay";
import { AXIS_HEX } from "./palette";

export interface ChartPoint { t: number; v: number }
export interface ChartSeriesInput { label: string; color: string; points: ChartPoint[] }
export interface ChartReference { value: number; label: string; color: string }

export interface ChartGeometry {
  width: number;
  height: number;
  /** The plot area inside the axes. */
  left: number;
  right: number;
  top: number;
  bottom: number;
  yTicks: { y: number; label: string }[];
  xTicks: { x: number; label: string }[];
  series: { label: string; color: string; d: string }[];
  references: { y: number; label: string; color: string }[];
  legend: { label: string; color: string }[];
  axisColor: string;
}

export interface ChartInput {
  width: number;
  height: number;
  from: number;
  to: number;
  series: ChartSeriesInput[];
  references?: ChartReference[];
  digits: number;
  /** Lowest value the y axis must show (degree heating weeks start at 0). */
  floor?: number;
}

const PAD = { top: 10, right: 92, bottom: 22, left: 44 };

/** Null when there is nothing to draw: no series has a point. */
export function chartGeometry({ width, height, from, to, series, references = [], digits, floor }: ChartInput): ChartGeometry | null {
  const values = series.flatMap((s) => s.points.map((p) => p.v));
  if (values.length === 0) return null;
  const all = [...values, ...references.map((r) => r.value), ...(floor === undefined ? [] : [floor])];
  const [lo, hi] = padded([Math.min(...all), Math.max(...all)]);
  const y0 = floor === undefined ? lo : Math.max(floor, lo);
  const [left, right, top, bottom] = [PAD.left, width - PAD.right, PAD.top, height - PAD.bottom];
  const x = (t: number) => left + ((t - from) / (to - from || 1)) * (right - left);
  const y = (v: number) => top + (1 - (v - y0) / (hi - y0 || 1)) * (bottom - top);
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    width, height, left, right, top, bottom,
    yTicks: niceTicks([y0, hi], digits).map((t) => ({ y: round(y(t.value)), label: t.label })),
    xTicks: timeTicks(from, to).map((t) => ({ x: round(x(t.value)), label: t.label })),
    series: series.filter((s) => s.points.length > 0).map((s) => ({ label: s.label, color: s.color, d: path(s.points, x, y) })),
    references: references.map((r) => ({ y: round(y(r.value)), label: r.label, color: r.color })),
    legend: series.filter((s) => s.points.length > 0).map((s) => ({ label: s.label, color: s.color })),
    axisColor: AXIS_HEX,
  };
}
