"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

/** A daily line chart for the heat-stress bay, drawn by the same rules as the trend bay
 * (trace-bay.tsx): the line's end is labelled, hover shows a crosshair and readout, the pen
 * lifts across silence of more than 26 hours, and every chart can be read as a table.
 * Reference lines (MMM, MMM + 1 °C, the DHW alert floors) are labelled at the right edge. */

export interface DayPoint { day: string; value: number | null }
export interface Reference { value: number; label: string; tone: "annotation" | "muted" }

const HEIGHT = 200;
const PAD = { top: 12, right: 92, bottom: 24, left: 44 };
const DAY_MS = 24 * 3600 * 1000;
// Same rule as the trend bay: only silence past a day and a bit is a gap. Daily points sit 24 h
// apart, so one missing day (48 h) lifts the pen.
const GAP_MS = 26 * 3600 * 1000;
const noon = (day: string) => Date.parse(`${day}T12:00:00Z`);

interface DayChartProps {
  points: DayPoint[];
  label: string;
  unit: string;
  color: string;
  references: Reference[];
  /** Lowest value the y axis must show (DHW starts at 0). */
  floor?: number;
  digits: number;
  ariaLabel: string;
}

function ticks(min: number, max: number): number[] {
  const step = (max - min) / 3 || 1;
  return [0, 1, 2, 3].map((i) => min + step * i);
}

export function DayChart({ points, label, unit, color, references, floor, digits, ariaLabel }: DayChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const element = box.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const present = points.filter((p): p is { day: string; value: number } => p.value !== null).map((p) => ({ t: noon(p.day), v: p.value }));
  if (present.length === 0) return <p className="sc-help">No daily {label.toLowerCase()} in the last 12 weeks.</p>;
  const values = [...present.map((p) => p.v), ...references.map((r) => r.value), ...(floor === undefined ? [] : [floor])];
  const [lo, hi] = [Math.min(...values), Math.max(...values)];
  const padY = (hi - lo) * 0.08 || 1;
  const y0 = floor === undefined ? lo - padY : Math.max(floor, lo - padY);
  const y1 = hi + padY;
  const t0 = noon(points[0].day);
  const t1 = Math.max(noon(points[points.length - 1].day), t0 + DAY_MS);
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * (width - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - y0) / (y1 - y0)) * (HEIGHT - PAD.top - PAD.bottom);
  const d = present.map((p, i) => `${i === 0 || p.t - present[i - 1].t > GAP_MS ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const nearest = (t: number) => present.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
  const last = present[present.length - 1];
  // An 84-day series starts 83 days back, so "12w ago" sits a day before its first point.
  const weeks = [12, 8, 4, 0].filter((w) => t1 - w * 7 * DAY_MS >= t0 - DAY_MS);

  function onMove(event: PointerEvent<SVGSVGElement>) {
    const left = event.currentTarget.getBoundingClientRect().left;
    const t = t0 + ((event.clientX - left - PAD.left) / (width - PAD.left - PAD.right)) * (t1 - t0);
    setHover(Math.max(t0, Math.min(t1, t)));
  }

  const hovered = hover === null ? null : nearest(hover);
  return (
    <div className="sc-trace" ref={box}>
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={ariaLabel} onPointerMove={onMove} onPointerLeave={() => setHover(null)}
        style={{ height: HEIGHT }}>
        <g className="sc-trace__grid">{ticks(y0, y1).map((v) => <line key={v} x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} />)}</g>
        <g className="sc-trace__axis">
          {ticks(y0, y1).map((v) => <text key={v} x={PAD.left - 6} y={y(v) + 4} textAnchor="end">{v.toFixed(digits)}</text>)}
          {weeks.map((w) => <text key={w} x={x(t1 - w * 7 * DAY_MS)} y={HEIGHT - 6} textAnchor="middle">{w === 0 ? "latest" : `${w}w ago`}</text>)}
        </g>
        {references.map((r) => (
          <g key={r.label} className={`sc-heat-ref sc-heat-ref--${r.tone}`}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(r.value)} y2={y(r.value)} />
            <text x={width - PAD.right + 6} y={y(r.value) + 4}>{r.label}</text>
          </g>
        ))}
        <path className="sc-trace__line" d={d} style={{ stroke: color }} />
        <text className="sc-trace__end" x={x(last.t) + 6} y={y(last.v) - 8}>{last.v.toFixed(digits)} {unit}</text>
        {hovered && (
          <g>
            <line className="sc-trace__cross" x1={x(hovered.t)} x2={x(hovered.t)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
            <circle className="sc-trace__dot" cx={x(hovered.t)} cy={y(hovered.v)} r={4} style={{ fill: color }} />
          </g>
        )}
      </svg>
      {hovered && (
        <div className="sc-trace__tip" style={{ left: Math.min(x(hovered.t) + 12, width - 180) }}>
          <b>{new Date(hovered.t).toISOString().slice(0, 10)} UTC</b>
          <div>{label}: {hovered.v.toFixed(digits)} {unit}</div>
        </div>
      )}
      <details>
        <summary className="sc-help">Show as a table</summary>
        <table className="sc-table">
          <thead><tr><th scope="col">Day (UTC)</th><th scope="col" className="n">{label} ({unit})</th></tr></thead>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.day}><td className="sc-audit-table__when">{p.day}</td><td className="n">{p.value === null ? "—" : p.value.toFixed(digits)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
