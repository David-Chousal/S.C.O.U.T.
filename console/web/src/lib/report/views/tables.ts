import { MAX_REPORT_READINGS } from "../readings-store";
import { summarize } from "../stats";
import { variableLabel, VARIABLES } from "@/lib/variables";
import type { Block, BlockOfKind, Sampling } from "../document";
import { effectiveVariables, formatWhen, resolveRange, zoneLabel, type ZoneChoice } from "../variables";
import type { BuoySection, Rows, TableBlockView, TableView, ViewContext } from "./types";

type SummaryBlock = BlockOfKind<"summaryTable">;
type ReadingsBlock = BlockOfKind<"readingsTable">;

const count = (n: number) => n.toLocaleString("en-US");
const fmt = (value: number | null) => (value === null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: 3 }));
export const withUnit = (c: string) => `${variableLabel(c)}${VARIABLES[c]?.unit ? ` (${VARIABLES[c].unit})` : ""}`;

/** One section per buoy in the block's variables, each from that buoy's readings. */
export function perBuoy<T>(block: Block, ctx: ViewContext, body: (rows: Rows) => { note: string; body: T | null }): BuoySection<T>[] {
  const vars = effectiveVariables(ctx.report, block.override);
  const range = resolveRange(vars.range, ctx.now, vars.zone);
  return vars.buoys.map((id) => {
    const heading = ctx.buoyLabel(id);
    const entry = ctx.readings(id, range);
    if (entry.status === "loading") return { heading, note: "", status: "loading", message: "Loading…", body: null };
    if (entry.status === "failed") return { heading, note: "", status: "failed", message: entry.error, body: null };
    if (entry.rows.length === 0) return { heading, note: "", status: "empty", message: "No readings in this range.", body: null };
    const made = body(entry.rows);
    const partial = entry.truncated ? `${made.note ? "; " : ""}only the newest ${count(MAX_REPORT_READINGS)}, the range holds more` : "";
    return { heading, status: "ready", message: "", ...made, note: made.note + partial };
  });
}

export function summaryTableView(block: SummaryBlock, ctx: ViewContext): TableBlockView {
  const columns = block.options.variables;
  const sections = perBuoy<TableView>(block, ctx, (rows) => ({
    note: `${count(rows.length)} readings`,
    body: {
      headers: ["Variable", "Readings", "Min", "Mean", "Max"],
      numeric: [false, true, true, true, true],
      rows: summarize(rows, columns).map((s) => [withUnit(s.column), String(s.count), fmt(s.min), fmt(s.mean), fmt(s.max)]),
    },
  }));
  return { kind: "summaryTable", sections, footnote: columns.length === 0 ? "Pick at least one variable." : "" };
}

/** The last reading in each hour or day (in the report's zone), or every reading. */
export function sample(rows: Rows, sampling: Sampling, zone: ZoneChoice): Rows {
  if (sampling === "all") return rows;
  const width = sampling === "hourly" ? 13 : 10;
  const last = new Map<string, Rows[number]>();
  rows.forEach((row) => last.set(formatWhen(row.timestamp_utc, zone).slice(0, width), row));
  return [...last.values()];
}

export function readingsTableView(block: ReadingsBlock, ctx: ViewContext): TableBlockView {
  const { variables: columns, sampling, rowCap } = block.options;
  const zone = effectiveVariables(ctx.report, block.override).zone;
  let hidden = 0;
  const sections = perBuoy<TableView>(block, ctx, (rows) => {
    const sampled = sample(rows, sampling, zone);
    const shown = sampled.slice(0, rowCap);
    hidden += sampled.length - shown.length;
    return {
      note: sampling === "all" ? `${count(rows.length)} readings` : `${count(sampled.length)} of ${count(rows.length)} readings, one ${sampling === "hourly" ? "an hour" : "a day"}`,
      body: {
        headers: [`Taken (${zoneLabel(zone)})`, ...columns.map(variableLabel)],
        numeric: [false, ...columns.map(() => true)],
        rows: shown.map((row) => [formatWhen(row.timestamp_utc, zone), ...columns.map((c) => row[c] || "—")]),
      },
    };
  });
  const footnote = hidden > 0 ? `${count(hidden)} more readings are not shown here (limit ${count(rowCap)} a buoy); the CSV holds them all.` : "";
  return { kind: "readingsTable", sections, footnote };
}
