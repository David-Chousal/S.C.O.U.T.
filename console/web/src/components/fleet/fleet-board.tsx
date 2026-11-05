"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { EmptyState } from "@/components/feedback/empty-state";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { BuoySettings } from "@/lib/api/types";
import { can, needs, useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { usePoll } from "@/lib/use-poll";
import { AddBuoyDialog } from "./add-buoy-dialog";
import { FleetList } from "./fleet-list";

/** The Fleet page: every buoy at a glance, and adding one. Readings live on the Dashboard and
 * Reports, settings on Settings → Buoys. */
export function FleetBoard() {
  const { user } = useSession();
  const settings = useApi<BuoySettings>(api.settings);
  const [adding, setAdding] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // New packets, and the countdown to the next transmission, update without a reload.
  usePoll(() => { settings.reload(); setNow(Date.now()); }, 30 * 1000);

  if (settings.error) return <Banner tone="failed">{settings.error}</Banner>;
  if (!settings.data) return <span className="sc-tag" aria-busy="true">Loading the fleet…</span>;
  const canAdd = can(user.role, "buoys.add");
  const { buoys } = settings.data;

  return (
    <>
      <section className="sc-bay" aria-labelledby="buoys-title">
        <div className="sc-bay__head">
          <h2 className="sc-bay__title" id="buoys-title">Buoys</h2>
          <span className="sc-row">
            <span className="sc-tag">{buoys.length === 1 ? "1 buoy" : `${buoys.length} buoys`}</span>
            <Key size="sm" variant="primary" icon="plus" disabled={!canAdd} onClick={() => setAdding(true)}
              title={canAdd ? undefined : `Adding a buoy needs the ${needs("buoys.add")} role`}>Add buoy</Key>
          </span>
        </div>
        {buoys.length === 0 ? (
          <EmptyState status="No buoys" title="No buoys yet">
            A buoy appears when its shore station first pushes a reading, or when it is added here.
          </EmptyState>
        ) : <FleetList buoys={buoys} remote={settings.data.firmware.remote} slotsSod={settings.data.firmware.slotsSod}
            estimates={settings.data.estimates} now={now} />}
      </section>
      <AddBuoyDialog open={adding} onClose={() => setAdding(false)} onAdded={settings.reload} />
    </>
  );
}
