"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import type { MetricForm, Reference } from "@/lib/dashboard/metric-profiles";
import type { Point } from "@/lib/dashboard/metrics";
import type { QcFlag } from "@/lib/dashboard/qc";

const W = 160;
const H = 36;
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
  /** The value scale, shared by every buoy in a tile so their lines compare. */
  domain: [number, number];
  form: MetricForm;
  /** The week's interquartile range, drawn as a band behind the line. */
  band?: [number, number];
  /** One QC flag per point: suspect and failed points are marked. */
  flags?: QcFlag[];
  references?: Reference[];
  /** The time range in words, for the accessible name. */
  phrase: string;
}

const tipTime = (t: number) => `${new Date(t).toISOString().slice(5, 16).replace("T", " ")} UTC`;

/** A sparkline for a stat tile over the chosen range: shared time axis, the tile's value scale, the IQR as a band,
 * suspect points ringed and failed points filled (QARTOD flags), counts as bars, and the
 * nearest reading on hover or from the arrow keys. */
export function Sparkline({ points, from, to, color, unit, digits, label, domain, form, band, flags, references = [], phrase }: SparklineProps) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length === 0) return null;
  const [lo, hi] = form === "bars" ? [Math.min(0, domain[0]), domain[1]] : domain;
  const x = (t: number) => PAD + ((t - from) / (to - from || 1)) * (W - 2 * PAD);
  const y = (v: number) => (hi === lo ? H / 2 : PAD + (1 - (v - lo) / (hi - lo)) * (H - 2 * PAD));
  const pct = (px: number, total: number) => `${(px / total) * 100}%`;
  const clamp = (v: number) => Math.min(hi, Math.max(lo, v));
  const line = points.map((p, i) => `${i === 0 || p.t - points[i - 1].t > GAP_MS ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  // A selection left over from a longer series (the range just changed) is dropped, never read past the end.
  const selected = hover !== null && hover < points.length ? hover : null;
  const marked = selected ?? points.length - 1;
  const flag = selected === null ? undefined : flags?.[selected];

  function onMove(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const t = from + ((event.clientX - box.left) / box.width) * (to - from);
    setHover(points.reduce((best, p, i) => (Math.abs(p.t - t) < Math.abs(points[best].t - t) ? i : best), 0));
  }

  // Keyboard equivalent of the hover: focus selects the newest reading, arrows step through them.
  function onKey(event: KeyboardEvent<SVGSVGElement>) {
    const current = selected ?? points.length - 1;
    const next = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: points.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setHover(Math.max(0, Math.min(points.length - 1, next)));
  }

  return (
    <span className={`sc-spark sc-spark--${form}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" tabIndex={0}
        aria-label={`${label}, ${phrase}. Use the left and right arrow keys to read each value.`}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}
        onFocus={() => setHover(points.length - 1)} onBlur={() => setHover(null)} onKeyDown={onKey}>
        {band && form !== "bars" && <rect className="sc-spark__band" x={PAD} width={W - 2 * PAD} y={y(band[1])} height={Math.max(1, y(band[0]) - y(band[1]))} />}
        {references.filter((r) => r.value >= lo && r.value <= hi).map((r) => (
          <line key={r.label} className="sc-spark__ref" x1={PAD} x2={W - PAD} y1={y(r.value)} y2={y(r.value)} vectorEffect="non-scaling-stroke" />
        ))}
        {form === "bars"
          ? points.map((p) => <line key={p.t} className="sc-spark__bar" x1={x(p.t)} x2={x(p.t)} y1={y(0)} y2={y(p.v)} style={{ stroke: color }} vectorEffect="non-scaling-stroke" />)
          : <path className="sc-spark__line" d={line} style={{ stroke: color }} vectorEffect="non-scaling-stroke" />}
      </svg>
      {/* Markers are HTML, so they stay round while the stretched SVG does not. */}
      {flags?.map((f, i) => (f.code === 1 || i >= points.length ? null : (
        <i key={points[i].t} className={`sc-spark__flag sc-spark__flag--${f.code === 4 ? "fail" : "suspect"}`} aria-hidden="true"
          style={{ left: pct(x(points[i].t), W), top: pct(y(clamp(points[i].v)), H) }} />
      )))}
      <i className="sc-spark__dot" aria-hidden="true"
        style={{ left: pct(x(points[marked].t), W), top: pct(y(clamp(points[marked].v)), H), background: color }} />
      {selected !== null && (
        <span className="sc-spark__tip" role="status">
          {points[selected].v.toFixed(digits)} {unit} · {tipTime(points[selected].t)}
          {flag && flag.code !== 1 && ` · ${flag.code === 4 ? "Fail" : "Suspect"}: ${flag.tests.join(", ")}`}
        </span>
      )}
    </span>
  );
}
