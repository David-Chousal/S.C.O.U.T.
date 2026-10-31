"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Estimates, Fleet } from "@/lib/api/types";
import { can, needs, useSession } from "@/lib/session";
import { BatteryTable } from "./battery-table";
import { BuoyBay } from "./buoy-bay";

/** The most days the 1 s listen window costs any option, so one table can stand for both. */
export function listenWindowCost(estimates: Estimates): number {
  return Math.max(0, ...estimates.without_listen_window.map((row) => {
    const twin = estimates.with_listen_window.find((other) =>
      other.scenario === row.scenario && other.tx_per_day === row.tx_per_day && other.cells === row.cells);
    return twin ? row.days - twin.days : 0;
  }));
}

function AddBuoy({ onAdded, canAdd }: { onAdded: () => void; canAdd: boolean }) {
  const { show } = useToast();
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api.addBuoy(Number(id), label.trim());
      show({ tone: "ok", title: `Added buoy ${id}` });
      setId("");
      setLabel("");
      onAdded();
    } catch (error) {
      show({ tone: "failed", title: "Not added", detail: error instanceof Error ? error.message : undefined });
    }
  }

  return (
    <form className="sc-settings-form" onSubmit={onSubmit}>
      <label className="sc-fieldset">
        <span className="sc-fieldset__label"><span className="sc-tag">Buoy ID</span></span>
        <input className="sc-input sc-input--mono" inputMode="numeric" pattern="[0-9]{1,5}" required value={id}
          disabled={!canAdd} onChange={(event) => setId(event.target.value)} />
      </label>
      <label className="sc-fieldset">
        <span className="sc-fieldset__label"><span className="sc-tag">Label</span></span>
        <input className="sc-input" maxLength={40} placeholder="e.g. SCOUT-01" value={label}
          disabled={!canAdd} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <div className="sc-settings-form__foot"><Key type="submit" disabled={!canAdd} icon="plus">Add buoy</Key></div>
    </form>
  );
}

/** The Fleet page: each buoy's daily transmit count, and what each option costs in battery life. */
export function FleetBoard() {
  const { user } = useSession();
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.fleet().then(setFleet, (failure: unknown) => setError(failure instanceof Error ? failure.message : "Could not load the fleet."));
  }, []);
  useEffect(load, [load]);

  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!fleet) return <span className="sc-tag" aria-busy="true">Loading the fleet…</span>;
  const canChange = can(user.role, "settings.write");
  const canAdd = can(user.role, "buoys.add");

  return (
    <>
      <Banner tone="caution">
        <strong>Range 1–3 pending the electrical lead&rsquo;s power sign-off.</strong> The radio downlink that carries a request
        is built but off in the shipped firmware, so a request stays pending until it is switched on.
      </Banner>
      {!canChange && <Banner tone="info" icon="lock">View only: changing the transmit count needs the {needs("settings.write")} role.</Banner>}
      {fleet.buoys.length === 0 ? (
        <EmptyState status="No buoys" title="No buoys yet">
          A buoy appears when its shore station first pushes a reading, or when an admin adds it below.
        </EmptyState>
      ) : (
        <div className="sc-grid12">
          {fleet.buoys.map((buoy) => (
            <div className="span-6" key={buoy.buoy_id}>
              <BuoyBay buoy={buoy} estimates={fleet.estimates} slotLabels={fleet.slotLabels} canChange={canChange} onChanged={load} />
            </div>
          ))}
        </div>
      )}
      <section className="sc-bay" aria-labelledby="battery-title">
        <div className="sc-bay__head">
          <h2 className="sc-bay__title" id="battery-title">Battery life by transmit count</h2>
          <span className="sc-tag">Estimate</span>
        </div>
        <p className="sc-help">From the power budget&rsquo;s datasheet figures, not a measurement. The radio is under half a percent of
          the daily draw, so the count mostly changes how fresh the data is, not how long the cells last. The 1 s listen
          window after each send (off in shipped firmware) costs at most {listenWindowCost(fleet.estimates)} days.</p>
        <BatteryTable estimates={fleet.estimates} listenWindow={false} />
      </section>
      <section className="sc-bay" aria-labelledby="add-title">
        <div className="sc-bay__head">
          <h2 className="sc-bay__title" id="add-title">Add a buoy</h2>
          {!canAdd && <span className="sc-tag">View only · needs {needs("buoys.add")}</span>}
        </div>
        <AddBuoy onAdded={load} canAdd={canAdd} />
      </section>
    </>
  );
}
