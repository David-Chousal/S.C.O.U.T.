// The dashboard layout model, adapted from COR's (csen174 lib/analytics/layout.ts): a view is a
// list of bays on the 12-column grid. Kinds and widths mirror console/worker/dashboards.js, which
// validates every saved layout; a test fails if the two disagree.

export type BayKind = "health" | "metrics" | "readout" | "trace" | "fleet" | "latest" | "heat";
export type Span = 3 | 4 | 6 | 8 | 12;

export interface BayConfig {
  id: string;
  kind: BayKind;
  span: Span;
  /** Readout and latest: which buoy. */
  buoy?: number;
  /** Readout and trace: which reading column. */
  variable?: string;
  /** Minimum height in pixels when someone set one: it adds room and never hides content, which
   * always grows the bay past it. Absent means the bay fits its content. */
  height?: number;
}

/** Bay heights snap to this step and stay inside these bounds (the worker checks the same). */
export const HEIGHT_STEP_PX = 20;
export const MIN_HEIGHT_PX = 120;
export const MAX_HEIGHT_PX = 2400;

/** A dragged or typed height snapped to the step and clamped to the bounds. */
export function snapHeight(raw: number): number {
  const stepped = Math.round(raw / HEIGHT_STEP_PX) * HEIGHT_STEP_PX;
  return Math.max(MIN_HEIGHT_PX, Math.min(MAX_HEIGHT_PX, stepped));
}

/** A stored view brought up to today's rules: a width its kind no longer allows snaps to the nearest
 * one it does (heat stress and fleet lost their narrowest widths because their tables did not fit). */
export function normalizeBays(bays: BayConfig[]): BayConfig[] {
  return bays.filter((bay) => BAY_KINDS[bay.kind]).map((bay) => (BAY_KINDS[bay.kind].spans.includes(bay.span) ? bay : { ...bay, span: snapSpan(bay.kind, bay.span) }));
}

/** Set a bay's height, or pass null to let it fit its content again. */
export function setHeight(bays: BayConfig[], id: string, height: number | null): BayConfig[] {
  return bays.map((bay) => {
    if (bay.id !== id) return bay;
    if (height !== null) return { ...bay, height: snapHeight(height) };
    return Object.fromEntries(Object.entries(bay).filter(([key]) => key !== "height")) as BayConfig;
  });
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
  health: { name: "Fleet status", description: "Headline numbers, then each buoy's link, battery, heat stress, commands and flags.", spans: [12], defaultSpan: 12, buoy: false, variable: false },
  metrics: { name: "Every metric", description: "Every measured number for every buoy, quality-checked, with trends.", spans: [6, 12], defaultSpan: 12, buoy: false, variable: false },
  readout: { name: "Readout", description: "One buoy's newest value of one metric.", spans: [3, 4, 6], defaultSpan: 3, buoy: true, variable: true },
  trace: { name: "Trend", description: "One metric for every buoy over the chosen time range.", spans: [6, 12], defaultSpan: 12, buoy: false, variable: true },
  fleet: { name: "Fleet", description: "When each buoy was last heard.", spans: [6, 12], defaultSpan: 6, buoy: false, variable: false },
  latest: { name: "Latest readings", description: "One buoy's newest readings, as a table.", spans: [6, 12], defaultSpan: 6, buoy: true, variable: false },
  heat: { name: "Heat stress", description: "NOAA bleaching alert and Degree Heating Weeks for every buoy.", spans: [12], defaultSpan: 12, buoy: false, variable: false },
};

/** Variables a readout or trend can show: the measured numbers. */
export const DASHBOARD_VARIABLES = ["temp_c", "turbidity_fau", "battery_v", "internal_humidity_pct", "internal_temp_c",
  "lvl_broad_cdb", "lvl_bio_cdb", "lvl_anthro_cdb", "ndsi_e4", "snap_count"] as const;

export function bayKey(bay: Pick<BayConfig, "kind" | "buoy" | "variable">): string {
  return [bay.kind, bay.buoy ?? "", bay.variable ?? ""].join(":");
}

/** The board everyone starts with, overview first and detail after: fleet status (what needs
 * attention), every metric as small multiples, the water-temperature trend, heat stress (SCO-314)
 * and the first buoy's latest readings. */
export function systemDefault(buoyIds: number[]): BayConfig[] {
  const first = buoyIds[0];
  return [
    { id: "health", kind: "health", span: 12 },
    { id: "metrics", kind: "metrics", span: 12 },
    { id: "trace-temp_c", kind: "trace", span: 12, variable: "temp_c" },
    { id: "heat", kind: "heat", span: 12 },
    ...(first === undefined ? [] : [{ id: `latest-${first}`, kind: "latest" as const, span: 12 as Span, buoy: first }]),
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

/** Give one bay a width; ignored unless the kind allows it. */
/** The allowed width closest to `raw` columns (ties go wider), as a resize drag snaps to. */
export function snapSpan(kind: BayKind, raw: number): Span {
  return BAY_KINDS[kind].spans.reduce((best, span) => (Math.abs(span - raw) <= Math.abs(best - raw) ? span : best));
}

export function setSpan(bays: BayConfig[], id: string, span: Span): BayConfig[] {
  return bays.map((bay) => (bay.id === id && BAY_KINDS[bay.kind].spans.includes(span) ? { ...bay, span } : bay));
}

/** Move a bay to `at`, an index among the other bays (the list without it), as a drop places it. */
export function placeBay(bays: BayConfig[], id: string, at: number): BayConfig[] {
  const moving = bays.find((bay) => bay.id === id);
  if (!moving) return bays;
  const others = bays.filter((bay) => bay.id !== id);
  const target = Math.max(0, Math.min(others.length, at));
  return [...others.slice(0, target), moving, ...others.slice(target)];
}

/** Add a bay of `kind` at `at` (the top by default), with an id no other bay has. */
export function addBay(bays: BayConfig[], kind: BayKind, options: { buoy?: number; variable?: string } = {}, at = 0): BayConfig[] {
  const info = BAY_KINDS[kind];
  const base = [kind, info.buoy ? options.buoy : null, info.variable ? options.variable : null].filter((p) => p !== null).join("-");
  const taken = new Set(bays.map((bay) => bay.id));
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
  const bay: BayConfig = { id, kind, span: info.defaultSpan, ...(info.buoy ? { buoy: options.buoy } : {}), ...(info.variable ? { variable: options.variable } : {}) };
  const target = Math.max(0, Math.min(bays.length, at));
  return [...bays.slice(0, target), bay, ...bays.slice(target)];
}

export function removeBay(bays: BayConfig[], id: string): BayConfig[] {
  return bays.filter((bay) => bay.id !== id);
}

export function isOnBoard(bays: BayConfig[], bay: Pick<BayConfig, "kind" | "buoy" | "variable">): boolean {
  const key = bayKey(bay);
  return bays.some((entry) => bayKey(entry) === key);
}
