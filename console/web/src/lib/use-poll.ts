"use client";

import { useEffect, useRef } from "react";

/** Run `callback` every `intervalMs` while `enabled` and the tab is visible, and once more when
 * the tab comes back into view. Pages stay current without a reload and idle tabs cost nothing. */
export function usePoll(callback: () => void, intervalMs: number, enabled: boolean = true): void {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => {
      if (document.visibilityState === "visible") latest.current();
    };
    const timer = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [intervalMs, enabled]);
}
