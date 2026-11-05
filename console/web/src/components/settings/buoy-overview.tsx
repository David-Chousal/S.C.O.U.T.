"use client";

import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import type { Buoy, RemoteSetting } from "@/lib/api/types";
import { lastHeard } from "@/lib/format";
import { display, SETTINGS_SIGNAL } from "./remote-settings";

/** What a buoy is asked to run that differs from the firmware defaults, in words. */
export function changedSummary(buoy: Buoy, remote: RemoteSetting[]): string {
  const changed = remote.flatMap((spec, i) =>
    buoy.settings_wanted[i] !== undefined && buoy.settings_wanted[i] !== spec.default
      ? [`${spec.label} ${display(spec, buoy.settings_wanted[i])}`] : []);
  return changed.length ? changed.join(" · ") : "All defaults";
}

interface BuoyOverviewProps {
  buoys: Buoy[];
  remote: RemoteSetting[];
  selected: number;
  onSelect: (buoyId: number) => void;
}

/** Every buoy on one table: whether it runs what was asked, what differs from the defaults, and
 * when it was last heard. Picking a row opens that buoy's editor below. */
export function BuoyOverview({ buoys, remote, selected, onSelect }: BuoyOverviewProps) {
  return (
    <div className="sc-table-wrap">
      <table className="sc-table sc-buoy-table">
        <thead>
          <tr><th scope="col">Buoy</th><th scope="col">Settings</th><th scope="col">Changed from defaults</th><th scope="col">Last heard</th></tr>
        </thead>
        <tbody>
          {buoys.map((buoy) => {
            const signal = SETTINGS_SIGNAL[buoy.settings_state];
            const isSelected = buoy.buoy_id === selected;
            return (
              <tr key={buoy.buoy_id} aria-selected={isSelected} onClick={() => onSelect(buoy.buoy_id)}>
                <th scope="row">
                  <button type="button" className="sc-buoy-table__pick" aria-pressed={isSelected}
                    onClick={(event) => { event.stopPropagation(); onSelect(buoy.buoy_id); }}>
                    {buoy.label}
                  </button>
                  <span className="sub">ID {buoy.buoy_id}</span>
                </th>
                <td><SignalMeter state={signal.state} lit={signal.lit} word={signal.word} /></td>
                <td className="sc-buoy-table__changed">{changedSummary(buoy, remote)}</td>
                <td className="sc-buoy-table__when"><Ago ms={lastHeard(buoy)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
