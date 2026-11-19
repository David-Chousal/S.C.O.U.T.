import type { BlockOfKind } from "../document";
import { fillFields, type MergeValues } from "../merge-fields";
import { effectiveVariables, formatDay, formatWhen, rangeLabel, resolveRange, zoneLabel, apiTime } from "../variables";
import type { TextView, TitleView, ViewContext } from "./types";

/** The merge-field values for a block, from its own (or the report's) buoys and range. */
export function mergeValues(block: { override: BlockOfKind<"text">["override"] }, ctx: ViewContext): MergeValues {
  const vars = effectiveVariables(ctx.report, block.override);
  const range = resolveRange(vars.range, ctx.now, vars.zone);
  return {
    title: ctx.title,
    buoys: vars.buoys.map(ctx.buoyLabel).join(", ") || "No buoys",
    from: formatDay(range.from, vars.zone),
    to: formatDay(range.to, vars.zone),
    period: rangeLabel(range, vars.zone),
    zone: zoneLabel(vars.zone),
    made: `${formatWhen(apiTime(ctx.now), vars.zone)} ${zoneLabel(vars.zone)}`,
  };
}

export function titleView(block: BlockOfKind<"title">, ctx: ViewContext): TitleView {
  const values = mergeValues(block, ctx);
  return {
    kind: "title",
    title: ctx.title,
    subtitle: fillFields(block.options.subtitle, values),
    lines: [values.buoys, `${values.period} (${values.zone})`, `Made ${values.made}`],
  };
}

export function textView(block: BlockOfKind<"text">, ctx: ViewContext): TextView {
  const filled = fillFields(block.options.text, mergeValues(block, ctx));
  return { kind: "text", style: block.options.style, paragraphs: filled.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) };
}
