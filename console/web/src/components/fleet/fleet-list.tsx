"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { changedSummary } from "@/components/settings/buoy-overview";
import { SETTINGS_SIGNAL } from "@/components/settings/remote-settings";
import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import { Icon } from "@/components/ui/icon";
import type { Buoy, Device, RemoteSetting } from "@/lib/api/types";
import { lastHeard } from "@/lib/format";

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
  devices: Device[];
}

/** Every buoy on one row: how often it sends, whether it runs the settings asked of it, when it
 * was last heard, and a way to its settings. Each row opens to the few other things worth a
 * glance. Readings belong on the Dashboard and Reports. */
export function FleetList({ buoys, remote, devices }: FleetListProps) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (id: number) => setOpen((now) => {
    const next = new Set(now);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <div className="sc-table-wrap">
      <table className="sc-table sc-fleet-table">
        <thead>
          <tr>
            <th scope="col">Buoy</th><th scope="col">Transmits</th><th scope="col">Settings</th>
            <th scope="col">Last heard</th><th scope="col"><span className="sc-visually-hidden">Open settings</span></th>
          </tr>
        </thead>
        <tbody>
          {buoys.map((buoy) => {
            const signal = SETTINGS_SIGNAL[buoy.settings_state];
            const transmits = transmitsLabel(buoy);
            const isOpen = open.has(buoy.buoy_id);
            const detailId = `fleet-detail-${buoy.buoy_id}`;
            const station = devices.find((d) => d.id === buoy.command_device_id);
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
                  <td><SignalMeter state={signal.state} lit={signal.lit} word={signal.word} /></td>
                  <td><Ago ms={lastHeard(buoy)} />{buoy.clock_lost ? <span className="sub">buoy clock lost</span> : null}</td>
                  <td className="sc-fleet-table__go">
                    <Link className="sc-link" href={`/settings/?buoy=${buoy.buoy_id}`} aria-label={`Settings for ${buoy.label}`}
                      onClick={(event) => event.stopPropagation()}>Settings</Link>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="sc-fleet-table__detail" id={detailId}>
                    <td colSpan={5}>
                      <dl className="sc-fleet-table__facts">
                        <div><dt className="sc-tag">Differs from defaults</dt><dd>{changedSummary(buoy, remote)}</dd></div>
                        <div><dt className="sc-tag">Commands from</dt><dd>{station ? station.name : "Any shore station"}</dd></div>
                        <div><dt className="sc-tag">Settings digest</dt>
                          <dd className="sc-num">{buoy.settings_digest_reported ?? "—"} reported · {buoy.settings_digest_wanted} wanted</dd></div>
                      </dl>
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
