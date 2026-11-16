"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

export interface Scale { x: (value: number) => number; y: (value: number) => number; width: number; height: number }
export interface Tick { value: number; label: string }

interface PlotProps {
  height: number;
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: Tick[];
  yDigits: number;
  ariaLabel: string;
  /** Called with the x value under the pointer, or null when it leaves. */
  onHover?: (x: number | null) => void;
  children: (scale: Scale) => ReactNode;
}

const PAD = { top: 10, right: 16, bottom: 24, left: 52 };

/** Four round-number ticks across a range. */
export function niceTicks([lo, hi]: [number, number], digits: number): Tick[] {
  const step = (hi - lo) / 3 || 1;
  return [0, 1, 2, 3].map((i) => lo + step * i).map((value) => ({ value, label: value.toFixed(digits) }));
}

const DAY_MS = 24 * 3600 * 1000;

/** Five ticks across a time window, labelled by hour, day or month to suit its length (UTC). */
export function timeTicks(from: number, to: number): Tick[] {
  const span = to - from;
  const label = (t: number) => {
    const iso = new Date(t).toISOString();
    if (span <= 2 * DAY_MS) return `${iso.slice(11, 13)}:00`;
    return span <= 400 * DAY_MS ? iso.slice(5, 10) : iso.slice(0, 7);
  };
  return [0, 1, 2, 3, 4].map((i) => from + (span * i) / 4).map((value) => ({ value, label: label(value) }));
}

/** Pads a value range by 8% each side (or ±1 when flat), for breathing room inside the axes. */
export function padded([lo, hi]: [number, number]): [number, number] {
  const pad = (hi - lo) * 0.08 || Math.abs(lo) * 0.01 || 1;
  return [lo - pad, hi + pad];
}

/** An SVG plot with recessive grid and axes on one common scale; the caller draws the marks. */
export function Plot({ height, xDomain, yDomain, xTicks, yDigits, ariaLabel, onHover, children }: PlotProps) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const element = box.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const [x0, x1] = xDomain;
  const [y0, y1] = yDomain;
  const x = (v: number) => PAD.left + ((v - x0) / (x1 - x0 || 1)) * (width - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - y0) / (y1 - y0 || 1)) * (height - PAD.top - PAD.bottom);

  function onMove(event: PointerEvent<SVGSVGElement>) {
    if (!onHover) return;
    const left = event.currentTarget.getBoundingClientRect().left;
    const value = x0 + ((event.clientX - left - PAD.left) / (width - PAD.left - PAD.right)) * (x1 - x0);
    onHover(Math.max(x0, Math.min(x1, value)));
  }

  return (
    <div className="sc-plot" ref={box}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} onPointerMove={onMove} onPointerLeave={() => onHover?.(null)}>
        <g className="sc-trace__grid">{niceTicks(yDomain, yDigits).map((t) => <line key={t.value} x1={PAD.left} x2={width - PAD.right} y1={y(t.value)} y2={y(t.value)} />)}</g>
        <g className="sc-trace__axis">
          {niceTicks(yDomain, yDigits).map((t) => <text key={t.value} x={PAD.left - 6} y={y(t.value) + 4} textAnchor="end">{t.label}</text>)}
          {xTicks.map((t) => <text key={t.value} x={x(t.value)} y={height - 6} textAnchor="middle">{t.label}</text>)}
        </g>
        {children({ x, y, width, height })}
      </svg>
    </div>
  );
}
