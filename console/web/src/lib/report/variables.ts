// The report-wide variables (buoys, date range, time zone) and how a block reads them
// (docs/engineering/console-report-builder-plan.md, "Variables: report-wide first").

export type RangePreset = "24h" | "7d" | "30d" | "custom";
/** `from` and `to` are calendar days (YYYY-MM-DD) and only matter for a custom range. */
export interface ReportRange { preset: RangePreset; from: string; to: string }
export type ZoneChoice = "utc" | "local";
export interface ReportVariables { buoys: number[]; range: ReportRange; zone: ZoneChoice }
/** What a block may set for itself instead of taking the report's. */
export interface BlockOverride { buoys?: number[]; range?: ReportRange }

export interface ResolvedRange { from: string; to: string }

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const PRESET_MS: Record<Exclude<RangePreset, "custom">, number> = { "24h": DAY_MS, "7d": 7 * DAY_MS, "30d": 30 * DAY_MS };

export const RANGE_OPTIONS: readonly { value: RangePreset; label: string }[] = [
  { value: "24h", label: "24 h" }, { value: "7d", label: "7 d" }, { value: "30d", label: "30 d" }, { value: "custom", label: "Custom" },
];

/** The API's timestamp form: UTC to the second, no milliseconds. */
export const apiTime = (ms: number) => new Date(ms).toISOString().slice(0, 19) + "Z";

/** A day's first or last second, in UTC or in this browser's zone. */
function dayEdge(day: string, end: boolean, zone: ZoneChoice): number {
  const clock = end ? "23:59:59" : "00:00:00";
  return zone === "utc" ? Date.parse(`${day}T${clock}Z`) : new Date(`${day}T${clock}`).getTime();
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A custom range whose two days are real calendar days. */
/** A real calendar day: 2026-02-31 parses (as March 3) but does not come back the same. */
const isDay = (day: string) => DAY.test(day) && Number.isFinite(Date.parse(`${day}T00:00:00Z`)) && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day;
/** A custom range whose two days are real calendar days, the first not after the last. */
export const isValidCustom = (range: ReportRange) => isDay(range.from) && isDay(range.to) && range.from <= range.to;

/** The range as API timestamps. Presets count back from `now`; a custom range covers whole days.
 * A custom range with a missing or invalid day falls back to the last 7 days rather than throwing. */
export function resolveRange(range: ReportRange, now: number, zone: ZoneChoice): ResolvedRange {
  if (range.preset === "custom" && !isValidCustom(range)) return resolveRange({ ...range, preset: "7d" }, now, zone);
  if (range.preset !== "custom") return { from: apiTime(now - PRESET_MS[range.preset]), to: apiTime(now) };
  return { from: apiTime(dayEdge(range.from, false, zone)), to: apiTime(dayEdge(range.to, true, zone)) };
}

/** The variables a block uses: the report's, with the block's own override on top. */
export function effectiveVariables(report: ReportVariables, override: BlockOverride | undefined): ReportVariables {
  return { ...report, buoys: override?.buoys ?? report.buoys, range: override?.range ?? report.range };
}

export const isOverridden = (override: BlockOverride | undefined) => Boolean(override?.buoys || override?.range);

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD HH:MM" in UTC or in this browser's zone. */
export function formatWhen(iso: string, zone: ZoneChoice): string {
  if (zone === "utc") return iso.slice(0, 16).replace("T", " ");
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "YYYY-MM-DD" in the chosen zone. */
export const formatDay = (iso: string, zone: ZoneChoice) => formatWhen(iso, zone).slice(0, 10);

/** The zone as people read it: "UTC", or the browser's zone name. */
export function zoneLabel(zone: ZoneChoice): string {
  return zone === "utc" ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
}

/** "2026-11-11 to 2026-11-18" for a range, in the chosen zone. */
export function rangeLabel(range: ResolvedRange, zone: ZoneChoice): string {
  return `${formatDay(range.from, zone)} to ${formatDay(range.to, zone)}`;
}
