import type { BlockOfKind } from "../document";
import { fillFields, type MergeValues } from "../merge-fields";
import { effectiveVariables, formatDay, formatWhen, rangeLabel, resolveRange, zoneLabel, apiTime } from "../variables";
import { reportImageUrl } from "@/lib/api/client";
import type { ImageView, TextView, TitleView, ViewContext } from "./types";

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

const IMAGE_SHARE = { small: 0.33, medium: 0.6, full: 1 } as const;

/** The image at a share of the page's width, its height from the shape recorded at upload. */
export function imageView(block: BlockOfKind<"image">, ctx: ViewContext): ImageView {
  const { assetId, alt, caption, width, ratio } = block.options;
  // Fit the page both ways, leaving room for a caption, so a tall picture on a landscape page is never clipped.
  const room = (ctx.contentHeight ?? Infinity) - (caption ? 24 : 0) - 8;
  const w = Math.round(Math.min(ctx.contentWidth * IMAGE_SHARE[width], room / ratio));
  return { kind: "image", src: assetId ? reportImageUrl(assetId) : null, alt, caption, width: w, height: Math.round(w * ratio),
    message: assetId ? "" : "No image yet. Upload a PNG or JPEG in the block's options." };
}
