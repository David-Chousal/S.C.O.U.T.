"use client";

import { useState, type PointerEvent, type RefObject } from "react";
import { snapSpan, type BayConfig, type Span } from "@/lib/dashboard/layout";

const GRID_COLUMNS = 12;

/** Drag a bay's right edge to resize it: the width snaps live to the nearest one its kind allows,
 * measured in grid columns from the bay's left edge. Escape puts the width back. */
export function useBayResize(gridRef: RefObject<HTMLDivElement | null>, onWidth: (id: string, span: Span) => void) {
  const [resizingId, setResizingId] = useState<string | null>(null);

  function startResize(bay: BayConfig, event: PointerEvent<HTMLElement>) {
    const grid = gridRef.current;
    const slot = event.currentTarget.closest("[data-bay-id]");
    if (event.button !== 0 || !grid || !slot) return;
    event.preventDefault();
    event.stopPropagation();
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    const column = (grid.getBoundingClientRect().width + gap) / GRID_COLUMNS;
    const left = slot.getBoundingClientRect().left;
    setResizingId(bay.id);

    const move = (pointer: globalThis.PointerEvent) => onWidth(bay.id, snapSpan(bay.kind, (pointer.clientX - left + gap) / column));
    const finish = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("keydown", onKey, true);
      setResizingId(null);
    };
    const onKey = (key: KeyboardEvent) => {
      if (key.key !== "Escape") return;
      key.stopPropagation();
      onWidth(bay.id, bay.span);
      finish();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("keydown", onKey, true);
  }

  return { resizingId, startResize };
}
