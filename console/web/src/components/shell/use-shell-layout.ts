"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  clampFred, DEFAULT_LAYOUT, dragSide, FRED, loadLayout, saveLayout, sideOf, type ShellLayout,
} from "@/lib/shell-layout";

export interface ShellLayoutControls {
  shellRef: RefObject<HTMLDivElement | null>;
  layout: ShellLayout;
  side: number;
  fred: number;
  fredMax: number;
  dragging: boolean;
  setDragging: (dragging: boolean) => void;
  resizeSide: (px: number) => void;
  toggleSide: () => void;
  resizeFred: (px: number) => void;
}

const viewportWidth = () => (typeof window === "undefined" ? 1440 : window.innerWidth);

/** The shell's widths: state, saved per browser, written to the shell element as --side-w and
 * --fred-w (set through the DOM, never an inline style attribute, so the strict CSP holds). */
export function useShellLayout(fredOpen: boolean): ShellLayoutControls {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<ShellLayout>(() => (typeof window === "undefined" ? DEFAULT_LAYOUT : loadLayout()));
  const [viewport, setViewport] = useState(viewportWidth);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const onResize = () => setViewport(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!dragging) saveLayout(layout);
  }, [layout, dragging]);

  const side = sideOf(layout);
  const fred = clampFred(layout.fredWidth, viewport, side);
  const fredMax = clampFred(FRED.max, viewport, side);

  // Every render: the shell element is swapped when the session finishes loading, and three
  // setProperty calls cost nothing.
  useLayoutEffect(() => {
    const element = shellRef.current;
    if (!element) return;
    element.style.setProperty("--side-w", `${side}px`);
    element.style.setProperty("--fred-w", `${fred}px`);
    element.style.setProperty("--fred-col", fredOpen ? `${fred}px` : "0px");
  });

  const resizeSide = useCallback((px: number) => setLayout((now) => ({ ...now, ...dragSide(px) })), []);
  const toggleSide = useCallback(() => setLayout((now) => ({ ...now, sideCollapsed: !now.sideCollapsed })), []);
  const resizeFred = useCallback((px: number) => {
    setLayout((now) => ({ ...now, fredWidth: clampFred(px, window.innerWidth, sideOf(now)) }));
  }, []);

  return { shellRef, layout, side, fred, fredMax, dragging, setDragging, resizeSide, toggleSide, resizeFred };
}
