"use client";

import { useCallback, useEffect, useState } from "react";

export type Loaded<T> = { data: T | null; error: string; reload: () => void };

/** Load one API read on mount, with a reload for after a write. */
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
  return { data, error, reload };
}
