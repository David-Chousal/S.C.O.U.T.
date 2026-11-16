"use client";

import { useState, type PointerEvent, type RefObject } from "react";
import { snapHeight, snapSpan, type BayConfig, type Span } from "@/lib/dashboard/layout";

const GRID_COLUMNS = 12;

export interface ResizeHandlers {
  onWidth: (id: string, span: Span) => void;
  onHeight: (id: string, height: number | null) => void;
}

/** Follows the pointer until release; Escape calls `undo` first. Cleans up either way. */
function follow(move: (pointer: globalThis.PointerEvent) => void, undo: () => void, done: () => void) {
  const finish = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    window.removeEventListener("keydown", onKey, true);
    done();
  };
  const onKey = (key: KeyboardEvent) => {
    if (key.key !== "Escape") return;
    key.stopPropagation();
    undo();
    finish();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", finish);
  window.addEventListener("pointercancel", finish);
  window.addEventListener("keydown", onKey, true);
}

/** Drag a bay's right edge to resize its width (snapping live to the widths its kind allows, in
 * grid columns from its left edge) or its bottom edge to set its height (snapping to 20 px).
 * Escape puts it back. */
export function useBayResize(gridRef: RefObject<HTMLDivElement | null>, handlers: ResizeHandlers) {
  const [resizing, setResizing] = useState<{ id: string; axis: "width" | "height" } | null>(null);

  function startWidth(bay: BayConfig, event: PointerEvent<HTMLElement>) {
    const grid = gridRef.current;
    const slot = event.currentTarget.closest("[data-bay-id]");
    if (event.button !== 0 || !grid || !slot) return;
    event.preventDefault();
    event.stopPropagation();
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    const column = (grid.getBoundingClientRect().width + gap) / GRID_COLUMNS;
    const left = slot.getBoundingClientRect().left;
    setResizing({ id: bay.id, axis: "width" });
    follow((pointer) => handlers.onWidth(bay.id, snapSpan(bay.kind, (pointer.clientX - left + gap) / column)),
      () => handlers.onWidth(bay.id, bay.span), () => setResizing(null));
  }

  function startHeight(bay: BayConfig, event: PointerEvent<HTMLElement>) {
    const body = event.currentTarget.closest(".sc-edit-card")?.querySelector(".sc-edit-card__body");
    if (event.button !== 0 || !body) return;
    event.preventDefault();
    event.stopPropagation();
    const top = body.getBoundingClientRect().top;
    setResizing({ id: bay.id, axis: "height" });
    follow((pointer) => handlers.onHeight(bay.id, snapHeight(pointer.clientY - top)),
      () => handlers.onHeight(bay.id, bay.height ?? null), () => setResizing(null));
  }

  return { resizing, startWidth, startHeight };
}
