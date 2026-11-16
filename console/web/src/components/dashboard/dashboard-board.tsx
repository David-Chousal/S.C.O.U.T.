"use client";

import { useCallback, useEffect, useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { BuoySettings, Fleet, HeatStressView } from "@/lib/api/types";
import { DEFAULT_VIEW_ID, normalizeBays, systemDefault, type SavedView } from "@/lib/dashboard/layout";
import { fetchHistory, loadRange, rangeOption, requestBounds, saveRange, windowStart, type RangeId } from "@/lib/dashboard/range";
import { can, needs, useSession } from "@/lib/session";
import { useViewOnlyNote } from "@/lib/view-only-note";
import type { BoardData } from "./bay-content";
import { LayoutBoard } from "./layout-board";
import { RangeBar } from "./range-bar";

const failureText = (failure: unknown, fallback: string) => (failure instanceof Error ? failure.message : fallback);

/** Every buoy's readings over the chosen range, oldest first; "all" pages back through the whole history. */
async function loadReadings(range: RangeId): Promise<BoardData> {
  const now = Date.now();
  const [from, to] = requestBounds(range, now);
  const fleet: Fleet = await api.fleet();
  const histories = await Promise.all(fleet.buoys.map((b) =>
    fetchHistory((start, end) => api.readingsBetween(b.buoy_id, start, end).then((reply) => reply.readings), from, to)));
  const readings = Object.fromEntries(fleet.buoys.map((b, i) => [b.buoy_id, histories[i].readings]));
  return {
    buoys: fleet.buoys, readings, now,
    from: windowStart(range, now, readings),
    phrase: rangeOption(range).phrase,
    allHistory: range === "all",
    truncated: histories.some((h) => h.truncated),
  };
}

/** The Dashboard page: the built-in Overview, the team's shared views and your own, each a layout
 * of bays over the chosen time range (24 hours to all history; heat stress keeps CRW's 12 weeks).
 * Guests see every view and change none. */
export function DashboardBoard() {
  const { user } = useSession();
  const [views, setViews] = useState<SavedView[] | null>(null);
  const [range, setRange] = useState<RangeId>(() => loadRange());
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [heat, setHeat] = useState<HeatStressView | null | undefined>(undefined);
  const [schedule, setSchedule] = useState<BuoySettings | null>(null);
  const [error, setError] = useState("");
  // A readings failure keeps the board and the range control, with a retry, unlike a failure to load the views.
  const [readingsError, setReadingsError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const canEdit = can(user.role, "dashboards.write");
  useViewOnlyNote(canEdit ? null : `View only: arranging dashboards needs the ${needs("dashboards.write")} role.`);

  const loadViews = useCallback(() => {
    api.dashboards().then((reply) => setViews(reply.dashboards.map((view) => ({ ...view, bays: normalizeBays(view.bays) }))), (failure: unknown) => setError(failureText(failure, "Could not load the views.")));
  }, []);

  useEffect(() => {
    loadViews();
    // Heat stress loads apart: a failure there leaves the rest of the board working.
    api.heatStress().then(setHeat, () => setHeat(null));
    // The transmit slots, so link health follows each buoy's schedule; without them it falls back to a fixed window.
    api.settings().then(setSchedule, () => setSchedule(null));
  }, [loadViews]);

  useEffect(() => {
    let current = true;
    loadReadings(range)
      .then((loaded) => { if (current) { setData(loaded); setReadingsError(""); } })
      .catch((failure: unknown) => { if (current) setReadingsError(failureText(failure, "Could not load the readings.")); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [range, attempt]);

  function retry() {
    setLoading(true);
    setAttempt((n) => n + 1);
  }

  function choose(next: RangeId) {
    if (next === range) return;
    saveRange(next);
    setLoading(true);
    setRange(next);
  }

  const readingsBanner = readingsError && (
    <Banner tone="failed" action={<Key size="sm" onClick={retry} disabled={loading}>Try again</Key>}>{readingsError}</Banner>
  );
  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!data && readingsBanner) return readingsBanner;
  if (!views || !data) return <span className="sc-tag" aria-busy="true">Loading the dashboard…</span>;
  const overview: SavedView = { id: DEFAULT_VIEW_ID, name: "Overview", shared: true, bays: systemDefault(data.buoys.map((b) => b.buoy_id)) };
  return (
    <>
      <RangeBar range={range} onChange={choose} loading={loading} data={data} />
      {readingsBanner}
      <LayoutBoard views={[overview, ...views]} data={{ ...data, heat, schedule }} canEdit={canEdit} onChanged={loadViews} />
    </>
  );
}
