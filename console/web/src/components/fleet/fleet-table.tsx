"use client";

import Link from "next/link";
import { SETTINGS_SIGNAL } from "@/components/settings/remote-settings";
import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import type { Buoy } from "@/lib/api/types";
import { lastHeard } from "@/lib/format";

/** "3 a day", with what was asked when it differs: "3 a day · 1 asked". */
export function transmitsLabel(buoy: Buoy): { main: string; sub: string } {
  const reported = buoy.tx_count_reported;
  const requested = buoy.tx_count_requested;
  const main = reported ? `${reported} a day` : "Not reported yet";
  if (requested && requested !== reported) return { main, sub: `${requested} a day asked` };
  return { main, sub: requested ? "as asked" : "default" };
}

/** Every buoy on one row: how often it sends, whether it runs the settings asked of it, when it
 * was last heard, and a way to its settings. */
export function FleetTable({ buoys }: { buoys: Buoy[] }) {
  return (
    <div className="sc-table-wrap">
      <table className="sc-table sc-fleet-table">
        <thead>
          <tr>
            <th scope="col">Buoy</th><th scope="col">Transmits</th><th scope="col">Settings</th>
            <th scope="col">Last heard</th><th scope="col"><span className="sc-visually-hidden">Settings</span></th>
          </tr>
        </thead>
        <tbody>
          {buoys.map((buoy) => {
            const signal = SETTINGS_SIGNAL[buoy.settings_state];
            const transmits = transmitsLabel(buoy);
            return (
              <tr key={buoy.buoy_id}>
                <th scope="row">{buoy.label}<span className="sub">ID {buoy.buoy_id}</span></th>
                <td>{transmits.main}<span className="sub">{transmits.sub}</span></td>
                <td><SignalMeter state={signal.state} lit={signal.lit} word={signal.word} /></td>
                <td><Ago ms={lastHeard(buoy)} />{buoy.clock_lost ? <span className="sub">buoy clock lost</span> : null}</td>
                <td className="sc-fleet-table__go">
                  <Link className="sc-link" href={`/settings/?buoy=${buoy.buoy_id}`} aria-label={`Change ${buoy.label}'s settings`}>Change</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
