"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

interface ResizeHandleProps {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Which way dragging makes the panel wider: right for the menu, left for Fred. */
  grows: "right" | "left";
  onResize: (px: number) => void;
  /** Called with true when a drag starts and false when it ends, so the shell can drop its
   * transition while a pointer is moving it. */
  onDragging?: (dragging: boolean) => void;
  className?: string;
}

const STEP = 16;

/** A vertical splitter: drag it, or focus it and use the arrow keys (Home and End jump to the
 * limits). It reports widths; the caller decides what they mean. */
export function ResizeHandle({ label, value, min, max, grows, onResize, onDragging, className }: ResizeHandleProps) {
  const start = useRef<{ x: number; value: number } | null>(null);
  const sign = grows === "right" ? 1 : -1;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { x: event.clientX, value };
    onDragging?.(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    onResize(start.current.value + sign * (event.clientX - start.current.x));
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    start.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onDragging?.(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = {
      ArrowRight: value + sign * STEP,
      ArrowLeft: value - sign * STEP,
      Home: min,
      End: max,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onResize(next);
  }

  return (
    <div role="separator" aria-orientation="vertical" aria-label={label} aria-valuenow={Math.round(value)}
      aria-valuemin={min} aria-valuemax={max} tabIndex={0} className={`sc-resize${className ? ` ${className}` : ""}`}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown} />
  );
}
