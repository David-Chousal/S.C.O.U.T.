"use client";

import { useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { TILE_STEP_PX, type TileSize } from "@/lib/dashboard/tile-sizes";

interface TileFrameProps {
  name: string;
  size: TileSize | undefined;
  onSize: (size: TileSize | null) => void;
  children: ReactNode;
}

const KEYS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** A tile's box on the Every metric grid. Unsized, it takes at least the width its content needs and
 * its natural height; its bottom-right corner resizes it (drag, or the arrow keys when focused), and
 * a double-click or Delete lets it fit its content again. A set height scrolls what does not fit. */
export function TileFrame({ name, size, onSize, children }: TileFrameProps) {
  const [dragging, setDragging] = useState(false);
  const style = { ...(size?.w ? { flex: `0 0 ${size.w}px` } : {}), ...(size?.h ? { height: size.h } : {}) };

  function start(event: PointerEvent<HTMLSpanElement>) {
    const box = event.currentTarget.parentElement?.getBoundingClientRect();
    if (event.button !== 0 || !box) return;
    event.preventDefault();
    const before = size ?? null;
    setDragging(true);
    const move = (pointer: globalThis.PointerEvent) => onSize({ w: pointer.clientX - box.left, h: pointer.clientY - box.top });
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
    const box = event.currentTarget.parentElement;
    if (!step || !box) return;
    event.preventDefault();
    onSize({ w: (size?.w ?? box.offsetWidth) + step[0] * TILE_STEP_PX, h: (size?.h ?? box.offsetHeight) + step[1] * TILE_STEP_PX });
  }

  return (
    <div className={dragging ? "sc-tile is-sizing" : "sc-tile"} style={style} data-sized={size ? "" : undefined}>
      {children}
      <span role="button" tabIndex={0} className="sc-tile__corner" aria-label={`Resize the ${name} tile`}
        title="Drag to resize; double-click to fit the content" onPointerDown={start} onKeyDown={onKeyDown} onDoubleClick={() => onSize(null)} />
      {dragging && size && <span className="sc-tile__size" aria-hidden="true">{size.w ?? "auto"} × {size.h ?? "auto"}</span>}
    </div>
  );
}
