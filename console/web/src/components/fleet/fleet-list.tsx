"use client";

import Link from "next/link";
import { changedSummary } from "@/components/settings/buoy-overview";
import { SETTINGS_SIGNAL } from "@/components/settings/remote-settings";
import { SignalMeter } from "@/components/status/signal-meter";
import { Icon } from "@/components/ui/icon";
import { Ago } from "@/components/ui/ago";
import type { Buoy, Device, RemoteSetting } from "@/lib/api/types";
import { lastHeard } from "@/lib/format";

/** "3 a day", with what was asked when it differs: "3 a day (1 a day asked)". */
export function transmitsLabel(buoy: Buoy): string {
  const reported = buoy.tx_count_reported ? `${buoy.tx_count_reported} a day` : "Not reported yet";
  const requested = buoy.tx_count_requested;
  return requested && requested !== buoy.tx_count_reported ? `${reported} (${requested} a day asked)` : reported;
}

interface FleetListProps {
  buoys: Buoy[];
  remote: RemoteSetting[];
  devices: Device[];
}

/** Every buoy as a row that opens to the few things worth knowing at a glance. Readings belong on
 * the Dashboard and Reports; settings on Settings → Buoys. */
export function FleetList({ buoys, remote, devices }: FleetListProps) {
  return (
    <div className="sc-fleet">
      {buoys.map((buoy) => {
        const signal = SETTINGS_SIGNAL[buoy.settings_state];
        const station = devices.find((d) => d.id === buoy.command_device_id);
        return (
          <details key={buoy.buoy_id} className="sc-fleet__item">
            <summary className="sc-fleet__summary">
              <Icon name="chevron-right" />
              <span className="sc-fleet__name"><strong>{buoy.label}</strong><span className="sc-tag">ID {buoy.buoy_id}</span></span>
              <SignalMeter state={signal.state} lit={signal.lit} word={signal.word} />
              <span className="sc-fleet__when"><Ago ms={lastHeard(buoy)} /></span>
            </summary>
            <div className="sc-fleet__body">
              <dl className="sc-fleet__facts">
                <div><dt className="sc-tag">Transmits</dt><dd>{transmitsLabel(buoy)}</dd></div>
                <div><dt className="sc-tag">Settings</dt><dd>{changedSummary(buoy, remote)}</dd></div>
                <div><dt className="sc-tag">Last heard</dt>
                  <dd><Ago ms={lastHeard(buoy)} />{buoy.clock_lost ? " · buoy clock lost" : ""}</dd></div>
                <div><dt className="sc-tag">Commands from</dt>
                  <dd>{station ? station.name : "Any shore station"}</dd></div>
              </dl>
              <Link className="sc-key sc-key--sm" href={`/settings/?buoy=${buoy.buoy_id}`}
                aria-label={`Settings for ${buoy.label}`}>
                <Icon name="settings" /> Settings
              </Link>
            </div>
          </details>
        );
      })}
    </div>
  );
}
