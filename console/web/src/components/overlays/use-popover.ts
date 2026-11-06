"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";

const GAP = 4;
const MARGIN = 8;

interface PopoverOptions {
  /** Line the popover up with the trigger's left edge, or its right edge. */
  align?: "start" | "end";
  /** At least as wide as the trigger (a select's list). */
  matchWidth?: boolean;
}

/** Places an open popover (rendered into <body>) under its trigger, or above it when there is no
 * room below, kept inside the window, and follows the trigger while the page scrolls or resizes.
 * Fixed position from <body>, so no scroll box, table or container can clip it. Coordinates are
 * set through the DOM, never an inline style attribute, so the strict CSP holds. */
export function usePopover(open: boolean, triggerRef: RefObject<HTMLElement | null>, popRef: RefObject<HTMLElement | null>,
  { align = "start", matchWidth = false }: PopoverOptions = {}): void {
  useLayoutEffect(() => {
    if (!open) return undefined;
    function place() {
      const trigger = triggerRef.current;
      const pop = popRef.current;
      if (!trigger || !pop) return;
      const anchor = trigger.getBoundingClientRect();
      if (matchWidth) pop.style.minWidth = `${anchor.width}px`;
      const box = pop.getBoundingClientRect();
      const below = anchor.bottom + GAP;
      const top = below + box.height > window.innerHeight - MARGIN && anchor.top - GAP - box.height > MARGIN
        ? anchor.top - GAP - box.height : below;
      const wanted = align === "end" ? anchor.right - box.width : anchor.left;
      const left = Math.min(Math.max(MARGIN, wanted), window.innerWidth - box.width - MARGIN);
      pop.style.top = `${Math.round(top)}px`;
      pop.style.left = `${Math.round(left)}px`;
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, triggerRef, popRef, align, matchWidth]);
}

/** Close when a pointer goes down outside both the trigger and the popover. */
export function useDismiss(open: boolean, refs: RefObject<HTMLElement | null>[], onDismiss: () => void): void {
  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!refs.some((ref) => ref.current?.contains(target))) onDismiss();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, refs, onDismiss]);
}
