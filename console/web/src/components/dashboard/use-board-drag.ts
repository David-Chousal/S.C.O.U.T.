"use client";

import { useState, type PointerEvent, type RefObject } from "react";
import type { BayKind, Span } from "@/lib/dashboard/layout";

/** What is being dragged: a bay already on the board, or a new one from the library. */
export type DragSource =
  | { type: "bay"; id: string }
  | { type: "new"; kind: BayKind; options: { buoy?: number; variable?: string } };

export interface DragState {
  source: DragSource;
  kind: BayKind;
  label: string;
  span: Span;
  x: number;
  y: number;
  /** Where it would land: an index among the bays on the board (without the one moving), or null when off the board. */
  at: number | null;
}

// A press that moves less than this is a click, not a drag.
const THRESHOLD_PX = 5;

/** The drop index under the pointer: before or after the bay it is over (by row for full-width
 * bays, by side otherwise), the end when below the last bay, unchanged over the placeholder. */
function dropIndex(grid: HTMLElement, x: number, y: number, previous: number | null): number | null {
  const box = grid.getBoundingClientRect();
  const under = document.elementFromPoint(x, y);
  if (under?.closest("[data-drop-placeholder]")) return previous;
  if (x < box.left || x > box.right || y < box.top - 24 || y > box.bottom + 48) return null;
  const slots = [...grid.querySelectorAll<HTMLElement>("[data-bay-id]")];
  const slot = under?.closest<HTMLElement>("[data-bay-id]");
  if (!slot || !grid.contains(slot)) {
    const last = slots.at(-1)?.getBoundingClientRect();
    return !last || y > last.bottom ? slots.length : previous;
  }
  const rect = slot.getBoundingClientRect();
  const fullWidth = rect.width > box.width * 0.9;
  const before = fullWidth ? y < rect.top + rect.height / 2 : x < rect.left + rect.width / 2;
  return slots.indexOf(slot) + (before ? 0 : 1);
}

/** Pointer drag-and-drop for the board: hold and move a bay (or a library entry) and a ghost
 * follows the pointer while a placeholder opens where it will land; release to drop, Escape or
 * releasing off the board to cancel. */
export function useBoardDrag(gridRef: RefObject<HTMLDivElement | null>, onDrop: (source: DragSource, at: number) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);

  function start(source: DragSource, kind: BayKind, label: string, span: Span, event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const [startX, startY] = [event.clientX, event.clientY];
    let current: DragState | null = null;

    const move = (pointer: globalThis.PointerEvent) => {
      if (!current && Math.hypot(pointer.clientX - startX, pointer.clientY - startY) < THRESHOLD_PX) return;
      pointer.preventDefault();
      const grid = gridRef.current;
      const at = grid ? dropIndex(grid, pointer.clientX, pointer.clientY, current?.at ?? null) : null;
      current = { source, kind, label, span, x: pointer.clientX, y: pointer.clientY, at };
      setDrag(current);
    };
    const finish = (commit: boolean) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", drop);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", onKey, true);
      if (commit && current && current.at !== null) onDrop(source, current.at);
      setDrag(null);
    };
    const drop = () => finish(true);
    const cancel = () => finish(false);
    const onKey = (key: KeyboardEvent) => {
      if (key.key !== "Escape") return;
      key.stopPropagation();
      cancel();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", drop);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", onKey, true);
  }

  return { drag, start };
}
