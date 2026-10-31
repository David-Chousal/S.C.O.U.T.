// The dashboard layout model, adapted from COR's (csen174 lib/analytics/layout.ts): a view is a
// list of bays on the 12-column grid. Kinds and widths mirror console/worker/dashboards.js, which
// validates every saved layout; a test fails if the two disagree.

export type BayKind = "readout" | "trace" | "fleet" | "latest";
export type Span = 3 | 4 | 6 | 8 | 12;

export interface BayConfig {
  id: string;
  kind: BayKind;
  span: Span;
  /** Readout and latest: which buoy. */
  buoy?: number;
  /** Readout and trace: which reading column. */
  variable?: string;
}

export interface SavedView {
  id: string;
  name: string;
  shared: boolean;
  bays: BayConfig[];
}

export interface BayKindInfo {
  name: string;
  description: string;
  spans: readonly Span[];
  defaultSpan: Span;
  buoy: boolean;
  variable: boolean;
}

export const DEFAULT_VIEW_ID = "default";
export const MAX_BAYS = 24;

export const BAY_KINDS: Record<BayKind, BayKindInfo> = {
  readout: { name: "Readout", description: "One buoy's newest value", spans: [3, 4, 6], defaultSpan: 3, buoy: true, variable: true },
  trace: { name: "Trend", description: "Every buoy over 7 days", spans: [6, 12], defaultSpan: 12, buoy: false, variable: true },
  fleet: { name: "Fleet", description: "When each buoy was last heard", spans: [4, 6, 12], defaultSpan: 6, buoy: false, variable: false },
  latest: { name: "Latest readings", description: "One buoy's newest readings", spans: [6, 12], defaultSpan: 6, buoy: true, variable: false },
};

/** Variables a readout or trend can show: the measured numbers. */
export const DASHBOARD_VARIABLES = ["temp_c", "turbidity_fau", "battery_v", "internal_humidity_pct", "internal_temp_c",
  "lvl_broad_cdb", "lvl_bio_cdb", "lvl_anthro_cdb", "ndsi_e4", "snap_count"] as const;

export function bayKey(bay: Pick<BayConfig, "kind" | "buoy" | "variable">): string {
  return [bay.kind, bay.buoy ?? "", bay.variable ?? ""].join(":");
}

/** The board everyone starts with: the first buoy's three main readouts, the water-temperature
 * trend, fleet freshness and the first buoy's latest readings. */
export function systemDefault(buoyIds: number[]): BayConfig[] {
  const first = buoyIds[0];
  const readouts: BayConfig[] = first === undefined ? [] : ["temp_c", "turbidity_fau", "battery_v"].map((variable) => ({
    id: `readout-${first}-${variable}`, kind: "readout", span: 4, buoy: first, variable,
  }));
  return [
    ...readouts,
    { id: "trace-temp_c", kind: "trace", span: 12, variable: "temp_c" },
    { id: "fleet", kind: "fleet", span: 6 },
    ...(first === undefined ? [] : [{ id: `latest-${first}`, kind: "latest" as const, span: 6 as Span, buoy: first }]),
  ];
}

export function moveBay(bays: BayConfig[], from: number, to: number): BayConfig[] {
  const target = Math.max(0, Math.min(bays.length - 1, to));
  if (from === target || from < 0 || from >= bays.length) return bays;
  const next = [...bays];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  return next;
}

/** The allowed width closest to `raw` (ties go wider). */
export function snapSpan(kind: BayKind, raw: number): Span {
  return BAY_KINDS[kind].spans.reduce((best, span) => (Math.abs(span - raw) <= Math.abs(best - raw) ? span : best));
}

export function resizeBay(bays: BayConfig[], id: string, raw: number): BayConfig[] {
  return bays.map((bay) => (bay.id === id ? { ...bay, span: snapSpan(bay.kind, raw) } : bay));
}

export function stepSpan(kind: BayKind, span: Span, direction: 1 | -1): Span {
  const spans = BAY_KINDS[kind].spans;
  const index = spans.indexOf(span);
  return spans[Math.max(0, Math.min(spans.length - 1, index + direction))];
}

export function addBay(bays: BayConfig[], kind: BayKind, options: { buoy?: number; variable?: string } = {}): BayConfig[] {
  const info = BAY_KINDS[kind];
  const base = [kind, info.buoy ? options.buoy : null, info.variable ? options.variable : null].filter((p) => p !== null).join("-");
  const taken = new Set(bays.map((bay) => bay.id));
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
  const bay: BayConfig = { id, kind, span: info.defaultSpan, ...(info.buoy ? { buoy: options.buoy } : {}), ...(info.variable ? { variable: options.variable } : {}) };
  return [bay, ...bays];
}

export function removeBay(bays: BayConfig[], id: string): BayConfig[] {
  return bays.filter((bay) => bay.id !== id);
}

export function isOnBoard(bays: BayConfig[], bay: Pick<BayConfig, "kind" | "buoy" | "variable">): boolean {
  const key = bayKey(bay);
  return bays.some((entry) => bayKey(entry) === key);
}
