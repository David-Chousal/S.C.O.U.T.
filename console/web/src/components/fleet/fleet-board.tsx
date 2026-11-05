"use client";

import { useCallback, useEffect, useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { EmptyState } from "@/components/feedback/empty-state";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Estimates, Fleet } from "@/lib/api/types";
import { can, needs, useSession } from "@/lib/session";
import { AddBuoyDialog } from "./add-buoy-dialog";
import { BatteryTable } from "./battery-table";
import { FleetTable } from "./fleet-table";

/** The most days the 1 s listen window costs any option, so one table can stand for both. */
export function listenWindowCost(estimates: Estimates): number {
  return Math.max(0, ...estimates.without_listen_window.map((row) => {
    const twin = estimates.with_listen_window.find((other) =>
      other.scenario === row.scenario && other.tx_per_day === row.tx_per_day && other.cells === row.cells);
    return twin ? row.days - twin.days : 0;
  }));
}

/** The Fleet page: every buoy at a glance, adding one, and what each transmit count costs in
 * battery life. Settings themselves change on Settings → Buoys. */
export function FleetBoard() {
  const { user } = useSession();
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    api.fleet().then(setFleet, (failure: unknown) => setError(failure instanceof Error ? failure.message : "Could not load the fleet."));
  }, []);
  useEffect(load, [load]);

  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!fleet) return <span className="sc-tag" aria-busy="true">Loading the fleet…</span>;
  const canAdd = can(user.role, "buoys.add");

  return (
    <>
      <section className="sc-bay" aria-labelledby="buoys-title">
        <div className="sc-bay__head">
          <h2 className="sc-bay__title" id="buoys-title">Buoys</h2>
          <span className="sc-row">
            <span className="sc-tag">{fleet.buoys.length === 1 ? "1 buoy" : `${fleet.buoys.length} buoys`}</span>
            <Key size="sm" variant="primary" icon="plus" disabled={!canAdd} onClick={() => setAdding(true)}
              title={canAdd ? undefined : `Adding a buoy needs the ${needs("buoys.add")} role`}>Add buoy</Key>
          </span>
        </div>
        {fleet.buoys.length === 0 ? (
          <EmptyState status="No buoys" title="No buoys yet">
            A buoy appears when its shore station first pushes a reading, or when it is added here.
          </EmptyState>
        ) : <FleetTable buoys={fleet.buoys} />}
      </section>
      <section className="sc-bay" aria-labelledby="battery-title">
        <div className="sc-bay__head">
          <h2 className="sc-bay__title" id="battery-title">Battery life by transmit count</h2>
          <span className="sc-tag">Estimate</span>
        </div>
        <p className="sc-help">From the power budget&rsquo;s datasheet figures, not a measurement. The radio is under half a percent of
          the daily draw, so the count mostly changes how fresh the data is, not how long the cells last. The 1 s listen
          window after each send costs at most {listenWindowCost(fleet.estimates)} days, and is included below.</p>
        <BatteryTable estimates={fleet.estimates} listenWindow />
      </section>
      <AddBuoyDialog open={adding} onClose={() => setAdding(false)} onAdded={load} />
    </>
  );
}
