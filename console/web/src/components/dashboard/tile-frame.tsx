"use client";

import { useEffect, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from "react";
import { TILE_STEP_PX, type TileSize } from "@/lib/dashboard/tile-sizes";

interface TileFrameProps {
  name: string;
  size: TileSize | undefined;
  /** Tile columns the grid has right now; a tile never spans more. */
  columns: number;
  onSize: (size: TileSize | null) => void;
  children: ReactNode;
}

/** Tile columns in a grid now, kept current as it resizes. */
export function useTileColumns(ref: RefObject<HTMLElement | null>): number {
  const [columns, setColumns] = useState(1);
  useEffect(() => {
    const grid = ref.current?.querySelector<HTMLElement>(".sc-metrics__grid");
    if (!grid) return undefined;
    const measure = () => setColumns(Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length));
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [ref]);
  return columns;
}

/** The height a tile's content needs: from its top to the bottom of its last line, plus padding. */
function contentHeight(tile: HTMLElement): number {
  const card = tile.firstElementChild;
  const last = card?.lastElementChild;
  if (!card || !last) return tile.offsetHeight;
  const style = getComputedStyle(card);
  return last.getBoundingClientRect().bottom - card.getBoundingClientRect().top + parseFloat(style.paddingBottom) + parseFloat(style.borderBottomWidth);
}

/** A minimum height only when it adds room; at or below what the content needs it is dropped. */
const minimum = (requested: number, natural: number) => (requested <= natural + TILE_STEP_PX / 2 ? undefined : requested);

const KEYS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** A tile on the Every metric grid. By default it takes one column and its row's height; its
 * bottom-right corner resizes it in whole columns and 20 px steps (drag, or the arrow keys when
 * focused). Height only ever adds room, never hides content. Double-click or Delete resets it. */
export function TileFrame({ name, size, columns, onSize, children }: TileFrameProps) {
  const [dragging, setDragging] = useState(false);
  const span = Math.min(size?.span ?? 1, columns);
  const style = { gridColumn: `span ${span}`, ...(size?.h ? { minHeight: size.h } : {}) };

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
      h: minimum(pointer.clientY - box.top, natural),
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
    onSize({ span: Math.max(1, Math.min(columns, span + step[0])), h: minimum((size?.h ?? natural) + step[1] * TILE_STEP_PX, natural) });
  }

  const readout = `${span} column${span === 1 ? "" : "s"}${size?.h ? ` · at least ${size.h} px` : ""}`;
  return (
    <div className={dragging ? "sc-tile is-sizing" : "sc-tile"} style={style} data-sized={size ? "" : undefined}>
      {children}
      <span role="button" tabIndex={0} className="sc-tile__corner" aria-label={`Resize the ${name} tile (${readout})`}
        title="Drag to resize; double-click to reset" onPointerDown={start} onKeyDown={onKeyDown} onDoubleClick={() => onSize(null)} />
      {dragging && <span className="sc-tile__size" aria-hidden="true">{readout}</span>}
    </div>
  );
}
