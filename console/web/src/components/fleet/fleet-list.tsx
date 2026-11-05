"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import { Icon } from "@/components/ui/icon";
import type { Buoy, Estimates, RemoteSetting } from "@/lib/api/types";
import { buoyHealth, nextTransmit, runningSettings, slotsInUse, untilLabel, utcClock } from "@/lib/buoy-status";
import { lastHeard, lifeFor, months } from "@/lib/format";

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
}

/** Every buoy on one row: how often it sends, whether it is alive and connected, and when it was
 * last heard. Each row opens to a short briefing: when it next transmits, its battery life
 * estimate, and its settings. Readings belong on the Dashboard and Reports. */
export function FleetList({ buoys, remote, slotsSod, estimates }: FleetListProps) {
  const [now] = useState(() => Date.now());
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
                    <td colSpan={4}>
                      <div className="sc-fleet-table__brief">
                        <dl className="sc-fleet-table__facts">
                          <div><dt className="sc-tag">Next transmission</dt>
                            <dd>{next ? <>{untilLabel(next, now)}<span className="sub">{utcClock(next)}</span></> : "—"}</dd></div>
                          <div><dt className="sc-tag">Battery life · estimate</dt>
                            <dd>{months(life.best)} on 2 D cells<span className="sub">{months(life.pessimistic)} worst case, at {running.tx_count} a day</span></dd></div>
                        </dl>
                        <Link className="sc-key sc-key--sm" href={`/settings/?buoy=${buoy.buoy_id}`} aria-label={`Settings for ${buoy.label}`}>
                          <Icon name="settings" /> Settings
                        </Link>
                      </div>
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
