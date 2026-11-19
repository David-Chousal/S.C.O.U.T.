import type { Block } from "../document";
import { keyFiguresView, timeSeriesView } from "./figures";
import { alertsView, buoyHealthView, heatStressView } from "./fleet";
import { readingsTableView, summaryTableView } from "./tables";
import { imageView, textView, titleView } from "./text";
import type { BlockView, ViewContext } from "./types";

/** A block's view model: what it shows, as plain data both renderers draw from. */
export function buildView(block: Block, ctx: ViewContext): BlockView | null {
  switch (block.kind) {
    case "title": return titleView(block, ctx);
    case "text": return textView(block, ctx);
    case "keyFigures": return keyFiguresView(block, ctx);
    case "timeSeries": return timeSeriesView(block, ctx);
    case "summaryTable": return summaryTableView(block, ctx);
    case "readingsTable": return readingsTableView(block, ctx);
    case "heatStress": return heatStressView(block, ctx);
    case "buoyHealth": return buoyHealthView(block, ctx);
    case "alerts": return alertsView(block, ctx);
    case "pageBreak":
    case "divider": return { kind: block.kind };
    case "image": return imageView(block, ctx);
  }
}

export type { BlockView, ViewContext } from "./types";
