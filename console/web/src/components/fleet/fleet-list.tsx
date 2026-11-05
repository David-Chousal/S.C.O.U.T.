"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import { Icon } from "@/components/ui/icon";
import type { Buoy, Estimates, RemoteSetting } from "@/lib/api/types";
import {
  batteryTier, buoyHealth, monthsLeft, nextTransmit, onPackLabel, runningSettings, slotsInUse, untilLabel, utcClock,
} from "@/lib/buoy-status";
import { lastHeard, lifeFor } from "@/lib/format";

/** "3 a day", with what was asked when it differs: "1 a day asked". */
export function transmitsLabel(buoy: Buoy): { main: string; sub: string } {
  const reported = buoy.tx_count_reported;
  const requested = buoy.tx_count_requested;
  const main = reported ? `${reported} a day` : "Not reported yet";
  if (requested && requested !== reported) return { main, sub: `${requested} a day asked` };
  return { main, sub: requested ? "as asked" : "default" };
}

interface FleetListProps {
  buoys: Buoy[];
  remote: RemoteSetting[];
  slotsSod: number[];
  estimates: Estimates;
  /** The time the briefing counts from; the page advances it as it refreshes. */
  now: number;
}

/** Every buoy on one row: how often it sends, whether it is alive and connected, and when it was
 * last heard. Each row opens to a briefing, one fact under each column: when it next transmits,
 * how long its battery has left, its battery voltage, and its settings. Readings belong on the Dashboard and Reports. */
export function FleetList({ buoys, remote, slotsSod, estimates, now }: FleetListProps) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (id: number) => setOpen((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <div className="sc-table-wrap">
      <table className="sc-table sc-fleet-table">
        <thead>
          <tr><th scope="col">Buoy</th><th scope="col">Transmits</th><th scope="col">Status</th><th scope="col">Last heard</th></tr>
        </thead>
        <tbody>
          {buoys.map((buoy) => {
            const running = runningSettings(buoy, remote);
            const slots = slotsInUse(slotsSod, running.tx_count, running.slot_phase_h);
            const health = buoyHealth(lastHeard(buoy), slots, now);
            const next = nextTransmit(slots, now);
            const life = lifeFor(estimates, running.tx_count, 2, true);
            const best = monthsLeft(life.best, buoy.uptime_s_reported);
            const worst = monthsLeft(life.pessimistic, buoy.uptime_s_reported);
            const left = best === null || worst === null ? null : { best, worst };
            const tier = buoy.battery_v_reported ? batteryTier(buoy.battery_v_reported, running.conserve_mv, running.critical_mv) : null;
            const transmits = transmitsLabel(buoy);
            const isOpen = open.has(buoy.buoy_id);
            const detailId = `fleet-detail-${buoy.buoy_id}`;
            return (
              <Fragment key={buoy.buoy_id}>
                <tr className={isOpen ? "is-open" : undefined} onClick={() => toggle(buoy.buoy_id)}>
                  <th scope="row">
                    <button type="button" className="sc-fleet-table__toggle" aria-expanded={isOpen} aria-controls={detailId}
                      onClick={(event) => { event.stopPropagation(); toggle(buoy.buoy_id); }}>
                      <Icon name="chevron-right" />
                      <span>{buoy.label}<span className="sub">ID {buoy.buoy_id}</span></span>
                    </button>
                  </th>
                  <td>{transmits.main}<span className="sub">{transmits.sub}</span></td>
                  <td><SignalMeter state={health.state} lit={health.lit} word={health.word} /></td>
                  <td><Ago ms={lastHeard(buoy)} />{buoy.clock_lost ? <span className="sub">buoy clock lost</span> : null}</td>
                </tr>
                {isOpen && (
                  <tr className="sc-fleet-table__detail" id={detailId}>
                    <td>
                      <span className="sc-tag">Next transmission</span>
                      <span className="sc-fleet-table__fact">{next ? untilLabel(next, now) : "—"}</span>
                      {next && <span className="sub">{utcClock(next)}</span>}
                    </td>
                    <td>
                      <span className="sc-tag">Battery left · estimate</span>
                      <span className="sc-fleet-table__fact">{left === null ? "—" : `${left.best.toFixed(1)} mo`}</span>
                      <span className="sub">{left === null ? "after its first reading"
                        : `${left.worst.toFixed(1)} mo worst case · ${onPackLabel(buoy.uptime_s_reported ?? 0)} on this pack`}</span>
                    </td>
                    <td>
                      <span className="sc-tag">Battery now</span>
                      <span className="sc-fleet-table__fact">{buoy.battery_v_reported ? `${buoy.battery_v_reported.toFixed(2)} V` : "—"}</span>
                      {tier && <span className="sub" title={`Conserve below ${(running.conserve_mv / 1000).toFixed(2)} V, critical below ${(running.critical_mv / 1000).toFixed(2)} V`}>
                        {tier.word === "Normal" ? "normal power" : `${tier.word.toLowerCase()} mode`}</span>}
                    </td>
                    <td className="sc-fleet-table__go">
                      <Link className="sc-key sc-key--sm" href={`/settings/?buoy=${buoy.buoy_id}`} aria-label={`Settings for ${buoy.label}`}>
                        <Icon name="settings" /> Settings
                      </Link>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
