"use client";

import { useEffect, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { TILE_STEP_PX, type TileSize } from "@/lib/dashboard/tile-sizes";

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

/** Tile columns in the bay's grids now, kept current as they resize. Returns a callback ref for the
 * bay's root, so it measures whenever the root appears (the bay first renders a loading line). */
export function useTileColumns(): [number, (root: HTMLElement | null) => void] {
  const [columns, setColumns] = useState(1);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const grid = root?.querySelector<HTMLElement>(".sc-metrics__grid");
    if (!grid) return undefined;
    const measure = () => setColumns(Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length));
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [root]);
  return [columns, setRoot];
}

/** The height a tile's content needs: from its top to the bottom of its last line, plus padding. */
function contentHeight(tile: HTMLElement): number {
  const card = tile.firstElementChild;
  const last = card?.lastElementChild;
  if (!card || !last) return tile.offsetHeight;
  const style = getComputedStyle(card);
  return last.getBoundingClientRect().bottom - card.getBoundingClientRect().top + parseFloat(style.paddingBottom) + parseFloat(style.borderBottomWidth);
}

/** A height never below what the content needs: dragging past it stops snug against the last line. */
const fitted = (requested: number, natural: number) => Math.max(Math.ceil(natural), requested);

const KEYS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** A tile on the Every metric grid. By default it takes one column and its row's height; its
 * bottom-right corner resizes it in whole columns and 20 px steps (drag, or the arrow keys when
 * focused). Height goes down to snug against the last line and no further, so content is never
 * hidden. Double-click or Delete resets it. */
export function TileFrame({ tileKey, name, size, columns, onSize, moving, onMoveStart, onMoveKey, children }: TileFrameProps) {
  const [dragging, setDragging] = useState(false);
  const span = Math.min(size?.span ?? 1, columns);
  // Unsized, a tile stretches to its row. Given a height it keeps it (snug or taller), and
  // min-height: min-content means content that later grows still pushes it taller, never hidden.
  const style = { gridColumn: `span ${span}`, ...(size?.h ? { height: size.h, minHeight: "min-content", alignSelf: "start" } : {}) };

  function start(event: PointerEvent<HTMLSpanElement>) {
    const tile = event.currentTarget.parentElement;
    const grid = tile?.parentElement;
    if (event.button !== 0 || !tile || !grid) return;
    event.preventDefault();
    const box = tile.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    const column = (grid.getBoundingClientRect().width + gap) / columns;
    const natural = contentHeight(tile);
    const before = size ?? null;
    setDragging(true);
    const move = (pointer: globalThis.PointerEvent) => onSize({
      span: Math.max(1, Math.min(columns, Math.round((pointer.clientX - box.left + gap) / column))),
      h: fitted(pointer.clientY - box.top, natural),
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
    const tile = event.currentTarget.parentElement;
    if (!step || !tile) return;
    event.preventDefault();
    const natural = contentHeight(tile);
    const height = size?.h ?? tile.offsetHeight;
    onSize({ span: Math.max(1, Math.min(columns, span + step[0])), h: step[1] ? fitted(height + step[1] * TILE_STEP_PX, natural) : size?.h });
  }

  const readout = `${span} column${span === 1 ? "" : "s"}${size?.h ? ` · ${size.h} px tall` : ""}`;
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
