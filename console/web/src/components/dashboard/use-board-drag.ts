"use client";

import { useState, type PointerEvent, type RefObject } from "react";
import type { BayKind, Span } from "@/lib/dashboard/layout";

type BayOptions = { buoy?: number; variable?: string };

/** What is being dragged: a bay already on the board, or a new one from the library. The report
 * builder reuses this hook for its blocks, with its own kinds and options. */
export type DragSource<K = BayKind, O = BayOptions> =
  | { type: "bay"; id: string }
  | { type: "new"; kind: K; options: O };

export interface DragState<K = BayKind, O = BayOptions> {
  source: DragSource<K, O>;
  kind: K;
  label: string;
  span: Span;
  x: number;
  y: number;
  /** Where it would land: an index among the bays on the board (without the one moving), or null when off the board. */
  at: number | null;
}

// A press that moves less than this is a click, not a drag.
const THRESHOLD_PX = 5;

/** Which elements are drop slots: their data attribute, and whether they stack in one column (so
 * before/after is by row only). The dashboard's defaults are bays on its 12-column grid. */
export interface SlotOptions { attribute: string; column: boolean }
const BAY_SLOTS: SlotOptions = { attribute: "bay-id", column: false };
const datasetKey = (attribute: string) => attribute.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

/** The drop index under the pointer: before or after the bay it is over (by row for full-width
 * bays, by side otherwise), the end when below the last bay, unchanged over the placeholder. */
function dropIndex(grid: HTMLElement, x: number, y: number, previous: number | null, moving: string | null, options: SlotOptions): number | null {
  const selector = `[data-${options.attribute}]`;
  const idOf = (el: HTMLElement) => el.dataset[datasetKey(options.attribute)];
  const box = grid.getBoundingClientRect();
  const under = document.elementFromPoint(x, y);
  if (under?.closest("[data-drop-placeholder]")) return previous;
  if (x < box.left || x > box.right || y < box.top - 24 || y > box.bottom + 48) return null;
  // Indices count the slots that stay put: the moving one is lifted out once the drag starts. A
  // report block split across pages has a slot on each page, so ids are counted once each.
  const all = [...grid.querySelectorAll<HTMLElement>(selector)];
  const ids = [...new Set(all.map(idOf))];
  const staying = ids.filter((id) => id !== moving);
  const slot = under?.closest<HTMLElement>(selector);
  // Still over the slot being lifted (the first move): it stays where it was.
  if (slot && moving !== null && idOf(slot) === moving) return ids.indexOf(moving);
  if (!slot || !grid.contains(slot)) {
    const last = all.filter((s) => idOf(s) !== moving).at(-1)?.getBoundingClientRect();
    return !last || y > last.bottom ? staying.length : previous;
  }
  const rect = slot.getBoundingClientRect();
  const byRow = options.column || rect.width > box.width * 0.9;
  const before = byRow ? y < rect.top + rect.height / 2 : x < rect.left + rect.width / 2;
  return staying.indexOf(idOf(slot)) + (before ? 0 : 1);
}

/** Pointer drag-and-drop for the board: hold and move a bay (or a library entry) and a ghost
 * follows the pointer while a placeholder opens where it will land; release to drop, Escape or
 * releasing off the board to cancel. */
export function useBoardDrag<K = BayKind, O = BayOptions>(gridRef: RefObject<HTMLDivElement | null>,
  onDrop: (source: DragSource<K, O>, at: number) => void, slots: SlotOptions = BAY_SLOTS) {
  const [drag, setDrag] = useState<DragState<K, O> | null>(null);

  function start(source: DragSource<K, O>, kind: K, label: string, span: Span, event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const [startX, startY] = [event.clientX, event.clientY];
    let current: DragState<K, O> | null = null;

    const move = (pointer: globalThis.PointerEvent) => {
      if (!current && Math.hypot(pointer.clientX - startX, pointer.clientY - startY) < THRESHOLD_PX) return;
      pointer.preventDefault();
      const grid = gridRef.current;
      const at = grid ? dropIndex(grid, pointer.clientX, pointer.clientY, current?.at ?? null, source.type === "bay" ? source.id : null, slots) : null;
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
