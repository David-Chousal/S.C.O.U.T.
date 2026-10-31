"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Buoy, Reading } from "@/lib/api/types";
import { VARIABLES, variableLabel } from "@/lib/variables";

/** Series colours in a fixed order, keyed to each buoy's place in the fleet list (so a buoy keeps
 * its colour when others are filtered out). The order was chosen with the dataviz validator:
 * Tideline's series-3 and series-4 next to each other fail deuteranopia (ΔE 4.8); this order
 * passes adjacent-pair CVD separation (ΔE ≥ 9) in both themes. */
const SERIES_ORDER = [1, 3, 5, 2, 4];
export const seriesColor = (index: number) => `var(--series-${SERIES_ORDER[index % SERIES_ORDER.length]})`;

const HEIGHT = 220;
const PAD = { top: 12, right: 72, bottom: 24, left: 44 };
// A buoy transmits 1-3 times a day (SCO-198), so only silence past a day and a bit is a real gap.
const GAP_MS = 26 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;

interface Series { buoy: Pick<Buoy, "buoy_id" | "label">; index: number; points: { t: number; v: number }[] }

function seriesFor(buoys: Pick<Buoy, "buoy_id" | "label">[], readings: Record<number, Reading[]>, variable: string): Series[] {
  return buoys.map((buoy, index) => ({
    buoy, index,
    points: (readings[buoy.buoy_id] ?? []).map((r) => ({ t: Date.parse(r.timestamp_utc), v: Number(r[variable]) }))
      .filter((p) => Number.isFinite(p.v)),
  })).filter((s) => s.points.length > 0);
}

/** A path that lifts the pen across gaps of more than 26 hours, so a silent buoy shows as a gap. */
function path(points: { t: number; v: number }[], x: (t: number) => number, y: (v: number) => number): string {
  return points.map((p, i) => `${i === 0 || p.t - points[i - 1].t > GAP_MS ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
}

function ticks(min: number, max: number): number[] {
  const step = (max - min) / 3 || 1;
  return [0, 1, 2, 3].map((i) => min + step * i);
}

export function TraceBay({ buoys, readings, variable, now }: { buoys: Pick<Buoy, "buoy_id" | "label">[]; readings: Record<number, Reading[]>; variable: string; now: number }) {
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

  const series = seriesFor(buoys, readings, variable);
  const unit = VARIABLES[variable]?.unit ?? "";
  if (series.length === 0) return <p className="sc-help">No {variableLabel(variable).toLowerCase()} readings in the last 7 days.</p>;
  const values = series.flatMap((s) => s.points.map((p) => p.v));
  const [lo, hi] = [Math.min(...values), Math.max(...values)];
  const padY = (hi - lo) * 0.08 || 1;
  const [y0, y1, t0, t1] = [lo - padY, hi + padY, now - 7 * DAY_MS, now];
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * (width - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - y0) / (y1 - y0)) * (HEIGHT - PAD.top - PAD.bottom);
  const nearest = (s: Series, t: number) => s.points.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));

  function onMove(event: PointerEvent<SVGSVGElement>) {
    const left = event.currentTarget.getBoundingClientRect().left;
    const t = t0 + ((event.clientX - left - PAD.left) / (width - PAD.left - PAD.right)) * (t1 - t0);
    setHover(Math.max(t0, Math.min(t1, t)));
  }

  return (
    <div className="sc-trace" ref={box}>
      {series.length > 1 && (
        <ul className="sc-legend" aria-label="Buoys">
          {series.map((s) => <li key={s.buoy.buoy_id}><i style={{ background: seriesColor(s.index) }} />{s.buoy.label}</li>)}
        </ul>
      )}
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={`${variableLabel(variable)} over the last 7 days`}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <g className="sc-trace__grid">{ticks(y0, y1).map((v) => <line key={v} x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} />)}</g>
        <g className="sc-trace__axis">
          {ticks(y0, y1).map((v) => <text key={v} x={PAD.left - 6} y={y(v) + 4} textAnchor="end">{v.toFixed(Math.abs(y1 - y0) < 5 ? 2 : 0)}</text>)}
          {[7, 5, 3, 1].map((d) => <text key={d} x={x(now - d * DAY_MS)} y={HEIGHT - 6} textAnchor="middle">{d}d ago</text>)}
        </g>
        {series.map((s) => <path key={s.buoy.buoy_id} className="sc-trace__line" d={path(s.points, x, y)} style={{ stroke: seriesColor(s.index) }} />)}
        {series.length <= 4 && series.map((s) => {
          const last = s.points[s.points.length - 1];
          return <text key={s.buoy.buoy_id} className="sc-trace__end" x={x(last.t) + 6} y={y(last.v) + 4}>{s.buoy.label}</text>;
        })}
        {hover !== null && (
          <g>
            <line className="sc-trace__cross" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
            {series.map((s) => { const p = nearest(s, hover); return <circle key={s.buoy.buoy_id} className="sc-trace__dot" cx={x(p.t)} cy={y(p.v)} r={4} style={{ fill: seriesColor(s.index) }} />; })}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="sc-trace__tip" style={{ left: Math.min(x(hover) + 12, width - 180) }}>
          <b>{new Date(hover).toISOString().slice(5, 16).replace("T", " ")} UTC</b>
          {series.map((s) => { const p = nearest(s, hover); return <div key={s.buoy.buoy_id}>{s.buoy.label}: {p.v} {unit}</div>; })}
        </div>
      )}
      <details>
        <summary className="sc-help">Show as a table</summary>
        <table className="sc-table">
          <thead><tr><th scope="col">Buoy</th><th scope="col">Taken (UTC)</th><th scope="col" className="n">{variableLabel(variable)} ({unit})</th></tr></thead>
          <tbody>
            {series.flatMap((s) => s.points.slice(-10).map((p) => (
              <tr key={`${s.buoy.buoy_id}-${p.t}`}><th scope="row">{s.buoy.label}</th><td className="sc-audit-table__when">{new Date(p.t).toISOString().slice(0, 16).replace("T", " ")}</td><td className="n">{p.v}</td></tr>
            )))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
