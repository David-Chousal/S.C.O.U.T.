import type { Block } from "../document";
import { readingsTableView, summaryTableView } from "./tables";
import type { BlockView, ViewContext } from "./types";

/** A block's view model, or null for a block with nothing to draw from data (handled by kind). */
export function buildView(block: Block, ctx: ViewContext): BlockView | null {
  switch (block.kind) {
    case "summaryTable": return summaryTableView(block, ctx);
    case "readingsTable": return readingsTableView(block, ctx);
    default: return null;
  }
}

export type { BlockView, ViewContext } from "./types";
