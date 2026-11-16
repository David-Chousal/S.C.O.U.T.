"use client";

import { useState, type PointerEvent } from "react";
import type { Point } from "@/lib/dashboard/metrics";

const W = 160;
const H = 32;
const PAD = 3;
// A buoy transmits 1-3 times a day, so only silence past a day and a bit lifts the pen (as TraceBay).
const GAP_MS = 26 * 3600 * 1000;

interface SparklineProps {
  points: Point[];
  /** The window's ends, Unix ms, so every sparkline on the board shares one time axis. */
  from: number;
  to: number;
  color: string;
  unit: string;
  digits: number;
  label: string;
  /** The value scale, shared by every buoy in a tile so their lines compare; defaults to this line's own range. */
  domain?: [number, number];
}

/** A 7-day line for a stat tile: shared time axis, the tile's value scale, the newest point marked,
 * and the nearest reading's value and time on hover. */
export function Sparkline({ points, from, to, color, unit, digits, label, domain }: SparklineProps) {
  const [hover, setHover] = useState<Point | null>(null);
  if (points.length === 0) return null;
  const values = points.map((p) => p.v);
  const [lo, hi] = domain ?? [Math.min(...values), Math.max(...values)];
  const x = (t: number) => PAD + ((t - from) / (to - from || 1)) * (W - 2 * PAD);
  const y = (v: number) => (hi === lo ? H / 2 : PAD + (1 - (v - lo) / (hi - lo)) * (H - 2 * PAD));
  const d = points.map((p, i) => `${i === 0 || p.t - points[i - 1].t > GAP_MS ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const last = points[points.length - 1];
  const marked = hover ?? last;

  function onMove(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const t = from + ((event.clientX - box.left) / box.width) * (to - from);
    setHover(points.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a)));
  }

  return (
    <span className="sc-spark">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${label}, last 7 days`}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <path d={d} style={{ stroke: color }} vectorEffect="non-scaling-stroke" />
      </svg>
      {/* An HTML dot, so it stays round while the stretched SVG does not. */}
      <i className="sc-spark__dot" aria-hidden="true"
        style={{ left: `${(x(marked.t) / W) * 100}%`, top: `${(y(marked.v) / H) * 100}%`, background: color }} />
      {hover && (
        <span className="sc-spark__tip" role="status">
          {hover.v.toFixed(digits)} {unit} · {new Date(hover.t).toISOString().slice(5, 16).replace("T", " ")} UTC
        </span>
      )}
    </span>
  );
}
