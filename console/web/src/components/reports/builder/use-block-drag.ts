"use client";

import { useRef } from "react";
import { useBoardDrag, type DragSource } from "@/components/dashboard/use-board-drag";
import { createBlock, type BlockKind } from "@/lib/report/document";
import type { ReportAction } from "@/lib/report/reducer";

export type BlockDragSource = DragSource<BlockKind, Record<string, never>>;

/** The dashboard's pointer drag (use-board-drag), for report blocks: drag a block's handle, an
 * Outline row or a library entry, and drop it between blocks. Blocks stack in one column. */
export function useBlockDrag(dispatch: (action: ReportAction) => void, onSelect: (id: string) => void, attribute = "block-id") {
  const area = useRef<HTMLDivElement>(null);
  const drop = (source: BlockDragSource, at: number) => {
    if (source.type === "bay") {
      dispatch({ type: "move", id: source.id, to: at });
      onSelect(source.id);
      return;
    }
    const block = createBlock(source.kind);
    dispatch({ type: "add", block, at });
    onSelect(block.id);
  };
  const { drag, start } = useBoardDrag<BlockKind, Record<string, never>>(area, drop, { attribute, column: true });
  // The ref is returned apart from the drag state, so render code never reads a ref.
  return { area, pointer: { drag, start } };
}

/** The drag state and its start function, without the drop area's ref. */
export type BlockDrag = ReturnType<typeof useBlockDrag>["pointer"];
