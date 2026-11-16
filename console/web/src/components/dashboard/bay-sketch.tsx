"use client";

import type { ReactNode } from "react";
import { BAY_KINDS, type BayConfig, type BayKind } from "@/lib/dashboard/layout";

/** Roughly how tall each kind is on the real board, in sketch rows, so the layout view keeps the
 * board's proportions while fitting on one screen. */
export const SKETCH_ROWS: Record<BayKind, number> = { readout: 1, trace: 2, fleet: 2, latest: 2, health: 3, heat: 3, metrics: 4 };

const line = (d: string) => <path key={d} d={d} />;

/** A small wireframe of what each kind shows: a figure, a line, a table, tiles. */
const GLYPHS: Record<BayKind, ReactNode> = {
  readout: <>{line("M6 22h20")}<rect x="6" y="8" width="26" height="9" rx="1" /></>,
  trace: <>{line("M4 26 L16 18 L26 22 L38 10 L50 14 L60 6")}{line("M4 28 L16 24 L28 26 L40 18 L60 16")}</>,
  fleet: <>{[6, 14, 22].map((y) => <g key={y}>{line(`M4 ${y}h34`)}{line(`M46 ${y}h4M52 ${y}h4M58 ${y}h2`)}</g>)}</>,
  latest: <>{[6, 13, 20, 27].map((y) => line(`M4 ${y}h56`))}{line("M22 4v25M40 4v25")}</>,
  health: <>{[4, 20, 36, 52].map((x) => <rect key={x} x={x} y="4" width="10" height="7" rx="1" />)}{[17, 23, 29].map((y) => line(`M4 ${y}h56`))}</>,
  heat: <>{line("M4 8h56")}<rect x="4" y="12" width="12" height="5" rx="1" />{line("M4 28 L20 24 L36 25 L48 18 L60 14")}</>,
  metrics: <>{[4, 22, 40].map((x) => [4, 18].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="16" height="11" rx="1" />))}</>,
};

/** A bay in Customize's layout view: its kind's wireframe and what it holds, at a proportional height. */
export function BaySketch({ bay }: { bay: BayConfig }) {
  return (
    <div className="sc-sketch" style={{ height: `calc(${SKETCH_ROWS[bay.kind]} * var(--sketch-row))` }}>
      <svg className="sc-sketch__glyph" viewBox="0 0 64 32" aria-hidden="true">{GLYPHS[bay.kind]}</svg>
      <span className="sc-sketch__desc">{BAY_KINDS[bay.kind].description}</span>
    </div>
  );
}
