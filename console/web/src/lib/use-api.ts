"use client";

import { useCallback, useEffect, useState } from "react";
import { DATA_CHANGED } from "./data-changed";

export type Loaded<T> = { data: T | null; error: string; reload: () => void };

/** Load one API read on mount, with a reload for after a write. It also reloads when a change is
 * made elsewhere on the page, such as a confirmed Fred card (data-changed.ts). */
export function useApi<T>(read: () => Promise<T>): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    read().then(
      (value) => {
        setData(value);
        setError("");
      },
      (failure: unknown) => setError(failure instanceof Error ? failure.message : "The console did not answer."),
    );
    // `read` is a stable api.* function; reloading on its identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(reload, [reload]);
  useEffect(() => {
    window.addEventListener(DATA_CHANGED, reload);
    return () => window.removeEventListener(DATA_CHANGED, reload);
  }, [reload]);
  return { data, error, reload };
}
