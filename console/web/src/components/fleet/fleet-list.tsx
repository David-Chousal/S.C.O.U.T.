"use client";

import { ActionMenu, type ActionMenuItem } from "@/components/overlays/action-menu";
import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import { Icon } from "@/components/ui/icon";
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
  /** Admins can disconnect a buoy, and delete one already disconnected. */
  canManage?: boolean;
  onDisconnect?: (buoy: Buoy) => void;
  onDelete?: (buoy: Buoy) => void;
}

function menuFor(buoy: Buoy, canManage: boolean, onDisconnect?: (buoy: Buoy) => void): ActionMenuItem[] {
  const items: ActionMenuItem[] = [
    { label: "Buoy info", icon: "data", href: `/readings/?buoy=${buoy.buoy_id}` },
    { label: "Settings", icon: "settings", href: `/settings/?buoy=${buoy.buoy_id}` },
  ];
  if (canManage && onDisconnect) items.push({ label: "Disconnect", icon: "close", danger: true, onSelect: () => onDisconnect(buoy) });
  return items;
}

/** Every buoy on one row: how often it sends, when it was last heard, when it next transmits,
 * whether it is alive and connected, and a ⋯ menu (its readings, its settings, disconnect). A
 * disconnected buoy shows a delete key instead. */
export function FleetList({ buoys, remote, slotsSod, now, canManage = false, onDisconnect, onDelete }: FleetListProps) {
  return (
    <div className="sc-table-wrap">
      <table className="sc-table sc-fleet-table">
        <thead>
          <tr>
            <th scope="col">Buoy</th><th scope="col">Transmits</th><th scope="col">Last heard</th>
            <th scope="col">Next transmission</th><th scope="col">Status</th>
            <th scope="col"><span className="sc-visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {buoys.map((buoy) => {
            const running = runningSettings(buoy, remote);
            const slots = slotsInUse(slotsSod, running.tx_count, running.slot_phase_h);
            const off = Boolean(buoy.disconnected_at);
            const health = off ? { state: "off" as const, lit: 0, word: "Disconnected" } : buoyHealth(lastHeard(buoy), slots, now);
            const next = off ? null : nextTransmit(slots, now);
            const transmits = transmitsLabel(buoy);
            return (
              <tr key={buoy.buoy_id}>
                <th scope="row">{buoy.label}<span className="sub">ID {buoy.buoy_id}</span></th>
                <td>{transmits.main}<span className="sub">{transmits.sub}</span></td>
                <td><Ago ms={lastHeard(buoy)} />{buoy.clock_lost ? <span className="sub">buoy clock lost</span> : null}</td>
                <td>{next ? <>{untilLabel(next, now)}<span className="sub">{utcClock(next)}</span></> : "—"}</td>
                <td><SignalMeter state={health.state} lit={health.lit} word={health.word} /></td>
                <td className="sc-fleet-table__go">
                  {off ? (
                    <button type="button" className="sc-key sc-key--sm sc-key--icon" aria-label={`Delete ${buoy.label}`} title="Delete from the console"
                      disabled={!canManage || !onDelete} onClick={() => onDelete?.(buoy)}>
                      <Icon name="trash" />
                    </button>
                  ) : <ActionMenu label={`Actions for ${buoy.label}`} items={menuFor(buoy, canManage, onDisconnect)} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
