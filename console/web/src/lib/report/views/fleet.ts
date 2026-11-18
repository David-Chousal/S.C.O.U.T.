import { ALERT_LEVELS } from "@/lib/api/types";
import { chartGeometry } from "../chart";
import type { BlockOfKind } from "../document";
import { ANNOTATION_HEX, seriesHex } from "../palette";
import { effectiveVariables, formatWhen, resolveRange, apiTime, zoneLabel } from "../variables";
import type { BuoySection, HeatSection, HeatStressBlockView, Remote, TableBlockView, TableView, ViewContext } from "./types";

const num = (value: number | null | undefined, digits: number, unit = "") => (value === null || value === undefined ? "—" : `${value.toFixed(digits)}${unit}`);
const NOON = (day: string) => Date.parse(`${day}T12:00:00Z`);

/** A remote read that has not landed becomes one section saying so. */
function notReady<T>(remote: Remote<T>, heading: string): BuoySection<never> | null {
  if (remote.status === "loading") return { heading, note: "", status: "loading", message: "Loading…", body: null };
  if (remote.status === "failed") return { heading, note: "", status: "failed", message: remote.error, body: null };
  return null;
}

export function heatStressView(block: BlockOfKind<"heatStress">, ctx: ViewContext): HeatStressBlockView {
  const vars = effectiveVariables(ctx.report, block.override);
  const range = resolveRange(vars.range, ctx.now, vars.zone);
  const waiting = notReady(ctx.heat, "Heat stress");
  if (waiting || ctx.heat.status !== "ready") return { kind: "heatStress", sections: waiting ? [waiting] : [], footnote: "" };
  const heat = ctx.heat.data;
  const sections = vars.buoys.map((id, index): BuoySection<HeatSection> => {
    const heading = ctx.buoyLabel(id);
    const buoy = heat.buoys.find((b) => b.buoy_id === id);
    if (!buoy?.mmm) return { heading, note: "", status: "empty", message: buoy?.note ?? "No MMM set for this buoy, so heat stress cannot be worked out.", body: null };
    const days = buoy.series.filter((d) => d.day >= range.from.slice(0, 10) && d.day <= range.to.slice(0, 10));
    const now = buoy.current;
    const facts: TableView = {
      headers: ["MMM", "Water today", "Hot spot", "DHW", "Alert level"], numeric: [true, true, true, true, false], widths: [1, 1, 1, 1, 1.6],
      rows: [[num(buoy.mmm.value_c, 2, " °C"), num(now?.sst, 2, " °C"), num(now?.hotspot, 2, " °C"), num(now?.dhw, 1, " °C-wk"), now?.alert ?? "—"]],
    };
    const chart = block.options.charts ? chartGeometry({
      width: ctx.contentWidth, height: 140, from: Date.parse(range.from), to: Date.parse(range.to), digits: 1, floor: 0,
      series: [{ label: `${heading} DHW`, color: seriesHex(index), points: days.map((d) => ({ t: NOON(d.day), v: d.dhw })) }],
      references: [{ value: 4, label: "Alert 1 at 4", color: ANNOTATION_HEX }],
    }) : null;
    const peak = buoy.summary ? `peak ${buoy.summary.peak_dhw.toFixed(1)} °C-wk, worst ${buoy.summary.peak_alert}` : "";
    return { heading, note: peak, status: "ready", message: "", body: { facts, chart } };
  });
  return { kind: "heatStress", sections, footnote: `NOAA Coral Reef Watch method; levels run ${ALERT_LEVELS[0]} to ${ALERT_LEVELS.at(-1)}. Generated ${heat.generated_at.slice(0, 16).replace("T", " ")} UTC.` };
}

export function buoyHealthView(block: BlockOfKind<"buoyHealth">, ctx: ViewContext): TableBlockView {
  const vars = effectiveVariables(ctx.report, block.override);
  const range = resolveRange(vars.range, ctx.now, vars.zone);
  const zone = zoneLabel(vars.zone);
  const rows = vars.buoys.map((id) => {
    const buoy = ctx.fleet.find((b) => b.buoy_id === id);
    const entry = ctx.readings(id, range);
    const last = entry.status === "ready" ? entry.rows.at(-1) : undefined;
    const reading = (c: string, unit: string) => (entry.status === "loading" ? "Loading…" : last?.[c] ? `${last[c]} ${unit}` : "—");
    return [ctx.buoyLabel(id), reading("battery_v", "V"), reading("internal_humidity_pct", "%"),
      buoy?.last_seen_at ? formatWhen(apiTime(buoy.last_seen_at), vars.zone) : "Never", buoy?.settings_state ?? "—"];
  });
  const table: TableView = { headers: ["Buoy", "Battery", "Housing humidity", `Last heard (${zone})`, "Settings"],
    numeric: [false, true, true, false, false], widths: [1.4, 1, 1.2, 1.6, 1], rows };
  const section: BuoySection<TableView> = rows.length === 0
    ? { heading: "Buoy health", note: "", status: "empty", message: "Pick at least one buoy.", body: null }
    : { heading: "Buoy health", note: "Battery and humidity from each buoy's newest reading in the range", status: "ready", message: "", body: table };
  return { kind: "buoyHealth", sections: [section], footnote: "" };
}

export function alertsView(block: BlockOfKind<"alerts">, ctx: ViewContext): TableBlockView {
  const waiting = notReady(ctx.alerts, "Alerts in range");
  if (waiting || ctx.alerts.status !== "ready") return { kind: "alerts", sections: waiting ? [waiting] : [], footnote: "" };
  const vars = effectiveVariables(ctx.report, block.override);
  const range = resolveRange(vars.range, ctx.now, vars.zone);
  const [from, to] = [Date.parse(range.from), Date.parse(range.to)];
  const fired = ctx.alerts.data
    .filter((a) => a.at >= from && a.at <= to && (a.buoy_id === null || vars.buoys.includes(a.buoy_id)) && (block.options.includeTests || a.kind !== "test"))
    .sort((a, b) => a.at - b.at);
  const table: TableView = { headers: [`When (${zoneLabel(vars.zone)})`, "Buoy", "Alert", "Email"], numeric: [false, false, false, false], widths: [1.3, 1, 3, 0.9],
    rows: fired.map((a) => [formatWhen(apiTime(a.at), vars.zone), a.buoy_id === null ? "All" : ctx.buoyLabel(a.buoy_id), a.summary, a.status]) };
  const section: BuoySection<TableView> = fired.length === 0
    ? { heading: "Alerts in range", note: "", status: "empty", message: "No alerts in this range.", body: null }
    : { heading: "Alerts in range", note: `${fired.length} sent to you`, status: "ready", message: "", body: table };
  return { kind: "alerts", sections: [section], footnote: "Alerts the console emailed to you; it keeps 90 days." };
}
