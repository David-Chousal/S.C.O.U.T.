"use client";

import { useEffect, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { TILE_MAX_GROW_PX, TILE_STEP_PX, type TileSize } from "@/lib/dashboard/tile-sizes";

interface TileFrameProps {
  /** Which tile this is, for drag-to-reorder. */
  tileKey: string;
  name: string;
  size: TileSize | undefined;
  /** Tile columns the grid has right now; a tile never spans more. */
  columns: number;
  onSize: (size: TileSize | null) => void;
  /** Being dragged to a new place in its section. */
  moving: boolean;
  onMoveStart: (event: PointerEvent<HTMLElement>) => void;
  onMoveKey: (event: KeyboardEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}

/** The tile grid's narrowest column (overview.css: repeat(auto-fill, minmax(280px, 1fr))). */
const TILE_MIN_COLUMN_PX = 280;

/** Tile columns in the bay's grids now, kept current as they resize. Returns a callback ref for the
 * bay's root, so it measures whenever the root appears (the bay first renders a loading line). */
export function useTileColumns(): [number, (root: HTMLElement | null) => void] {
  const [columns, setColumns] = useState(1);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!root) return undefined;
    // Capacity from the bay's own width and the grid's track rule (auto-fill, 280 px minimum), not
    // from the grid's current tracks, which count extra tracks a wide tile creates and vanish with a section.
    const measure = () => {
      const grid = root.querySelector<HTMLElement>(".sc-metrics__grid");
      const gap = grid ? parseFloat(getComputedStyle(grid).columnGap) || 0 : 0;
      setColumns(Math.max(1, Math.floor((root.clientWidth + gap) / (TILE_MIN_COLUMN_PX + gap))));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [root]);
  return [columns, setRoot];
}

const KEYS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** A tile on the Every metric grid. By default it takes one column and is snug to its content, also
 * after the content changes. Its bottom-right corner resizes it in whole columns and adds up to
 * 240 px of height (drag, or the arrow keys when focused); the added height goes into the content,
 * so it never hides anything and snug is the floor. Double-click or Delete resets it. */
export function TileFrame({ tileKey, name, size, columns, onSize, moving, onMoveStart, onMoveKey, children }: TileFrameProps) {
  const [dragging, setDragging] = useState(false);
  const span = Math.min(size?.span ?? 1, columns);
  const grow = size?.grow ?? 0;
  // The tile is always its content's height; --grow makes that content taller (charts, row spacing).
  const style = { gridColumn: `span ${span}`, "--grow": `${grow}px` } as CSSProperties;
  const clampGrow = (value: number) => Math.max(0, Math.min(TILE_MAX_GROW_PX, value));

  function start(event: PointerEvent<HTMLSpanElement>) {
    const tile = event.currentTarget.parentElement;
    const grid = tile?.parentElement;
    if (event.button !== 0 || !tile || !grid) return;
    event.preventDefault();
    const box = tile.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    const column = (grid.getBoundingClientRect().width + gap) / columns;
    const snug = box.height - grow;
    const before = size ?? null;
    setDragging(true);
    const move = (pointer: globalThis.PointerEvent) => onSize({
      span: Math.max(1, Math.min(columns, Math.round((pointer.clientX - box.left + gap) / column))),
      grow: clampGrow(pointer.clientY - box.top - snug),
    });
    const finish = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("keydown", onKey, true);
      setDragging(false);
    };
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key !== "Escape") return;
      key.stopPropagation();
      onSize(before);
      finish();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("keydown", onKey, true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onSize(null);
      return;
    }
    const step = KEYS[event.key];
    if (!step) return;
    event.preventDefault();
    onSize({ span: Math.max(1, Math.min(columns, span + step[0])), grow: clampGrow(grow + step[1] * TILE_STEP_PX) });
  }

  const readout = `${span} column${span === 1 ? "" : "s"} · ${grow ? `+${grow} px` : "snug"}${grow === TILE_MAX_GROW_PX ? " (tallest)" : ""}`;
  return (
    <div className={["sc-tile", dragging && "is-sizing", moving && "is-moving"].filter(Boolean).join(" ")} style={style} data-sized={size ? "" : undefined} data-tile={tileKey}>
      {children}
      <button type="button" className="sc-tile__grip" aria-label={`Move the ${name} tile`} title="Drag to move within this section; arrow keys move it"
        onPointerDown={onMoveStart} onKeyDown={onMoveKey}>
        <svg viewBox="0 0 20 8" aria-hidden="true"><circle cx="4" cy="2" r="1.4" /><circle cx="10" cy="2" r="1.4" /><circle cx="16" cy="2" r="1.4" /><circle cx="4" cy="6" r="1.4" /><circle cx="10" cy="6" r="1.4" /><circle cx="16" cy="6" r="1.4" /></svg>
      </button>
      <span role="button" tabIndex={0} className="sc-tile__corner" aria-label={`Resize the ${name} tile (${readout})`}
        title="Drag to resize; double-click to reset" onPointerDown={start} onKeyDown={onKeyDown} onDoubleClick={() => onSize(null)} />
      {dragging && <span className="sc-tile__size" aria-hidden="true">{readout}</span>}
    </div>
  );
}
