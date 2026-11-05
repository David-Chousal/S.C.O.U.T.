"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { EmptyState } from "@/components/feedback/empty-state";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { BuoySettings, Device } from "@/lib/api/types";
import { can, needs, useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { AddBuoyDialog } from "./add-buoy-dialog";
import { FleetList } from "./fleet-list";

/** The Fleet page: every buoy at a glance, and adding one. Readings live on the Dashboard and
 * Reports, settings on Settings → Buoys. */
export function FleetBoard() {
  const { user } = useSession();
  const settings = useApi<BuoySettings>(api.settings);
  const devices = useApi<{ devices: Device[] }>(api.devices);
  const [adding, setAdding] = useState(false);

  const error = settings.error || devices.error;
  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!settings.data || !devices.data) return <span className="sc-tag" aria-busy="true">Loading the fleet…</span>;
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
        ) : <FleetList buoys={buoys} remote={settings.data.firmware.remote} devices={devices.data.devices} />}
      </section>
      <AddBuoyDialog open={adding} onClose={() => setAdding(false)} onAdded={settings.reload} />
    </>
  );
}
