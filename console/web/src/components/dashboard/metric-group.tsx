"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { arrange, moveTile } from "@/lib/dashboard/tile-order";
import type { TileSize, TileSizes } from "@/lib/dashboard/tile-sizes";
import { TileFrame } from "./tile-frame";

export interface GroupTile {
  key: string;
  name: string;
  node: ReactNode;
}

interface MetricGroupProps {
  name: string;
  tiles: GroupTile[];
  saved: string[] | undefined;
  sizes: TileSizes;
  columns: number;
  onOrder: (keys: string[]) => void;
  onSize: (key: string) => (size: TileSize | null) => void;
}

// A press that moves less than this is a click, not a drag.
const THRESHOLD_PX = 5;
const STEP: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

/** Where a tile dragged over `over` would land among the others: before it when the pointer is on
 * its left half, after it on its right half. */
function dropAt(order: string[], moving: string, over: string, before: boolean): number {
  const others = order.filter((key) => key !== moving);
  return others.indexOf(over) + (before ? 0 : 1);
}

/** One section of Every metric (water, soundscape, power and housing): its tiles in the order the
 * viewer chose. A tile's grip moves it, by drag or the arrow keys, but only inside this section:
 * the pointer is matched against this section's tiles alone. */
export function MetricGroup({ name, tiles, saved, sizes, columns, onOrder, onSize }: MetricGroupProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{ key: string; order: string[] } | null>(null);
  const order = draft?.order ?? arrange(tiles.map((t) => t.key), saved);
  const byKey = new Map(tiles.map((t) => [t.key, t]));

  function startMove(key: string, event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    const [startX, startY] = [event.clientX, event.clientY];
    const original = order;
    let current = original;
    let moved = false;
    const move = (pointer: globalThis.PointerEvent) => {
      if (!moved && Math.hypot(pointer.clientX - startX, pointer.clientY - startY) < THRESHOLD_PX) return;
      moved = true;
      const tile = document.elementFromPoint(pointer.clientX, pointer.clientY)?.closest<HTMLElement>("[data-tile]");
      const over = tile && gridRef.current?.contains(tile) ? tile.dataset.tile : undefined;
      if (over && over !== key) {
        const box = tile!.getBoundingClientRect();
        current = moveTile(current, key, dropAt(current, key, over, pointer.clientX < box.left + box.width / 2));
      }
      setDraft({ key, order: current });
    };
    const finish = (commit: boolean) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", drop);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", onKey, true);
      setDraft(null);
      if (commit && moved && current.join() !== original.join()) onOrder(current);
    };
    const drop = () => finish(true);
    const cancel = () => finish(false);
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key !== "Escape") return;
      key.stopPropagation();
      cancel();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", drop);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", onKey, true);
  }

  function moveByKey(key: string, event: KeyboardEvent<HTMLButtonElement>) {
    const step = STEP[event.key];
    if (!step) return;
    event.preventDefault();
    const target = event.currentTarget;
    onOrder(moveTile(order, key, order.indexOf(key) + step));
    // Moving the tile in the DOM can drop focus; if it did, put it back on this grip so the arrows keep working.
    requestAnimationFrame(() => { if (document.activeElement === document.body || document.activeElement === null) target.focus(); });
  }

  return (
    <section className="sc-metrics__group" aria-label={name}>
      <h3 className="sc-tag">{name}</h3>
      <div className={draft ? "sc-metrics__grid is-ordering" : "sc-metrics__grid"} ref={gridRef}>
        {order.map((key) => {
          const tile = byKey.get(key);
          if (!tile) return null;
          return (
            <TileFrame key={key} tileKey={key} name={tile.name} size={sizes[key]} columns={columns} onSize={onSize(key)} moving={draft?.key === key}
              onMoveStart={(event) => startMove(key, event)} onMoveKey={(event) => moveByKey(key, event)}>
              {tile.node}
            </TileFrame>
          );
        })}
      </div>
    </section>
  );
}
