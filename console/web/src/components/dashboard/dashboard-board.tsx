"use client";

import { useCallback, useEffect, useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { api } from "@/lib/api/client";
import type { Fleet, Reading } from "@/lib/api/types";
import { DEFAULT_VIEW_ID, systemDefault, type SavedView } from "@/lib/dashboard/layout";
import { can, needs, useSession } from "@/lib/session";
import type { BoardData } from "./bay-content";
import { LayoutBoard } from "./layout-board";

const DAY_MS = 24 * 3600 * 1000;

/** The Dashboard page: the built-in Overview, the team's shared views and your own, each a
 * layout of bays over the last 7 days of readings. Guests see every view and change none. */
export function DashboardBoard() {
  const { user } = useSession();
  const [views, setViews] = useState<SavedView[] | null>(null);
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState("");
  const canEdit = can(user.role, "dashboards.write");

  const loadViews = useCallback(() => {
    api.dashboards().then((reply) => setViews(reply.dashboards), (failure: unknown) => setError(failure instanceof Error ? failure.message : "Could not load the views."));
  }, []);

  useEffect(() => {
    loadViews();
    const now = Date.now();
    const range = [new Date(now - 7 * DAY_MS).toISOString().slice(0, 19) + "Z", new Date(now).toISOString().slice(0, 19) + "Z"] as const;
    api.fleet().then(async (fleet: Fleet) => {
      const replies = await Promise.all(fleet.buoys.map((b) => api.readingsBetween(b.buoy_id, ...range)));
      const readings: Record<number, Reading[]> = Object.fromEntries(fleet.buoys.map((b, i) => [b.buoy_id, [...replies[i].readings].reverse()]));
      setData({ buoys: fleet.buoys, readings, now });
    }).catch((failure: unknown) => setError(failure instanceof Error ? failure.message : "Could not load the readings."));
  }, [loadViews]);

  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!views || !data) return <span className="sc-tag" aria-busy="true">Loading the dashboard…</span>;
  const overview: SavedView = { id: DEFAULT_VIEW_ID, name: "Overview", shared: true, bays: systemDefault(data.buoys.map((b) => b.buoy_id)) };
  return (
    <>
      {!canEdit && <Banner tone="info" icon="lock">View only: arranging dashboards needs the {needs("dashboards.write")} role.</Banner>}
      <LayoutBoard views={[overview, ...views]} data={data} canEdit={canEdit} onChanged={loadViews} />
    </>
  );
}
