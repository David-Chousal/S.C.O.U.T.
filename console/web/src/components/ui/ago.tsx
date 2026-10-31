"use client";

import { ago } from "@/lib/format";
import { useWhen } from "@/lib/preferences-context";

/** "12 min ago", with the exact time (UTC or local, per the page setting) on hover. */
export function Ago({ ms }: { ms: number | null | undefined }) {
  const when = useWhen();
  if (!ms) return <>—</>;
  return <time dateTime={new Date(ms).toISOString()} title={when(ms)}>{ago(ms)}</time>;
}
