import { variableLabel, VARIABLES } from "@/lib/variables";
import { chartGeometry, type ChartSeriesInput } from "../chart";
import type { BlockOfKind, Stat } from "../document";
import { ANNOTATION_HEX, seriesHex } from "../palette";
import { summarize } from "../stats";
import { effectiveVariables, resolveRange } from "../variables";
import { perBuoy, plainSuperscripts } from "./tables";
import type { BuoySection, ChartsView, KeyFiguresView, Rows, Tile, ViewContext } from "./types";

const STAT_LABEL: Record<Stat, string> = { latest: "Latest", min: "Lowest", mean: "Mean", max: "Highest" };
const fmt = (value: number | null) => (value === null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: 2 }));
const unitOf = (c: string) => plainSuperscripts(VARIABLES[c]?.unit ?? "");

function latest(rows: Rows, column: string): number | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const value = Number(rows[i][column]);
    if (rows[i][column] !== "" && rows[i][column] !== undefined && Number.isFinite(value)) return value;
  }
  return null;
}

export function keyFiguresView(block: BlockOfKind<"keyFigures">, ctx: ViewContext): KeyFiguresView {
  const { variables, stat } = block.options;
  return {
    kind: "keyFigures",
    sections: perBuoy<Tile[]>(block, ctx, (rows) => ({
      note: "",
      body: summarize(rows, variables).map((s) => ({
        label: variableLabel(s.column),
        value: fmt(stat === "latest" ? latest(rows, s.column) : s[stat]),
        unit: unitOf(s.column),
        caption: STAT_LABEL[stat],
      })),
    })),
  };
}

/** Blank cells are "not measured": they are dropped before Number(), which would read them as 0. */
const points = (rows: Rows, column: string) => rows
  .filter((r) => r[column] !== "" && r[column] !== undefined)
  .map((r) => ({ t: Date.parse(r.timestamp_utc), v: Number(r[column]) }))
  .filter((p) => Number.isFinite(p.v));

/** One chart per variable across the block's buoys, or one per buoy per variable. MMM is drawn on
 * water temperature charts when thresholds are on and the buoy has one. */
export function timeSeriesView(block: BlockOfKind<"timeSeries">, ctx: ViewContext): ChartsView {
  const vars = effectiveVariables(ctx.report, block.override);
  const range = resolveRange(vars.range, ctx.now, vars.zone);
  const [from, to] = [Date.parse(range.from), Date.parse(range.to)];
  const entries = vars.buoys.map((id, index) => ({ id, index, entry: ctx.readings(id, range) }));
  const mmm = (id: number) => ctx.fleet.find((b) => b.buoy_id === id)?.mmm_c ?? null;
  const groups = block.options.perBuoy ? entries.map((e) => [e]) : [entries];
  const sections: BuoySection<ChartsView["sections"][number]["body"] & object>[] = [];
  for (const column of block.options.variables) {
    for (const group of groups) {
      const heading = `${variableLabel(column)}${unitOf(column) ? ` (${unitOf(column)})` : ""}${block.options.perBuoy ? `, ${ctx.buoyLabel(group[0].id)}` : ""}`;
      const pending = group.find((g) => g.entry.status === "loading");
      const failed = group.find((g) => g.entry.status === "failed");
      if (pending) { sections.push({ heading, note: "", status: "loading", message: "Loading…", body: null }); continue; }
      if (failed && failed.entry.status === "failed") { sections.push({ heading, note: "", status: "failed", message: failed.entry.error, body: null }); continue; }
      const series: ChartSeriesInput[] = group.map((g) => ({ label: ctx.buoyLabel(g.id), color: seriesHex(g.index),
        points: g.entry.status === "ready" ? points(g.entry.rows, column) : [] }));
      const refs = column === "temp_c" && block.options.thresholds
        ? [...new Set(group.map((g) => mmm(g.id)).filter((v): v is number => v !== null))].map((value) => ({ value, label: `MMM ${value} °C`, color: ANNOTATION_HEX }))
        : [];
      const partial = group.some((g) => g.entry.status === "ready" && g.entry.truncated) ? "only the newest 20,000 readings a buoy" : "";
      const chart = chartGeometry({ width: ctx.contentWidth, height: 180, from, to, series, references: refs, digits: column === "battery_v" ? 2 : 1 });
      sections.push(chart ? { heading, note: partial, status: "ready", message: "", body: chart } : { heading, note: "", status: "empty", message: "No readings in this range.", body: null });
    }
  }
  return { kind: "timeSeries", sections, footnote: block.options.variables.length === 0 ? "Pick at least one variable." : "" };
}
