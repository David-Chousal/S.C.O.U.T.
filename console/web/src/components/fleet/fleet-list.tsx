"use client";

import Link from "next/link";
import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import type { Buoy, RemoteSetting } from "@/lib/api/types";
import { buoyHealth, nextTransmit, runningSettings, slotsInUse, untilLabel, utcClock } from "@/lib/buoy-status";
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
  slotsSod: number[];
  /** The time status is judged at; the page advances it as it refreshes. */
  now: number;
}

/** Every buoy on one row: how often it sends, when it was last heard, when it next transmits,
 * whether it is alive and connected, and a link to its settings. Readings belong on the Dashboard and Reports. */
export function FleetList({ buoys, remote, slotsSod, now }: FleetListProps) {
  return (
    <div className="sc-table-wrap">
      <table className="sc-table sc-fleet-table">
        <thead>
          <tr>
            <th scope="col">Buoy</th><th scope="col">Transmits</th><th scope="col">Last heard</th>
            <th scope="col">Next transmission</th><th scope="col">Status</th>
            <th scope="col"><span className="sc-visually-hidden">Settings</span></th>
          </tr>
        </thead>
        <tbody>
          {buoys.map((buoy) => {
            const running = runningSettings(buoy, remote);
            const slots = slotsInUse(slotsSod, running.tx_count, running.slot_phase_h);
            const health = buoyHealth(lastHeard(buoy), slots, now);
            const next = nextTransmit(slots, now);
            const transmits = transmitsLabel(buoy);
            return (
              <tr key={buoy.buoy_id}>
                <th scope="row">{buoy.label}<span className="sub">ID {buoy.buoy_id}</span></th>
                <td>{transmits.main}<span className="sub">{transmits.sub}</span></td>
                <td><Ago ms={lastHeard(buoy)} />{buoy.clock_lost ? <span className="sub">buoy clock lost</span> : null}</td>
                <td>{next ? <>{untilLabel(next, now)}<span className="sub">{utcClock(next)}</span></> : "—"}</td>
                <td><SignalMeter state={health.state} lit={health.lit} word={health.word} /></td>
                <td className="sc-fleet-table__go">
                  <Link className="sc-link" href={`/settings/?buoy=${buoy.buoy_id}`} aria-label={`Settings for ${buoy.label}`}>Settings</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
