"use client";

import Link from "next/link";
import { useId } from "react";
import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import type { Buoy } from "@/lib/api/types";
import { COUNT_SIGNAL, lastHeard, packetLabel } from "@/lib/format";

/** One buoy at a glance: its transmit count, asked for vs reported, and its newest packet. The
 * count and every other setting are changed on Settings → Buoys. */
export function BuoyBay({ buoy }: { buoy: Buoy }) {
  const titleId = useId();
  const signal = COUNT_SIGNAL[buoy.state];
  return (
    <section className="sc-bay" aria-labelledby={titleId}>
      <div className="sc-bay__head">
        <h2 className="sc-bay__title" id={titleId}>{buoy.label}</h2>
        <SignalMeter state={signal.state} lit={signal.lit} word={signal.word} />
      </div>
      <p className="sc-help">{signal.detail}</p>
      <dl className="sc-pair">
        <div>
          <dt className="sc-tag">Requested</dt>
          <dd>{buoy.tx_count_requested ? `${buoy.tx_count_requested} a day` : "Default"}
            <small>{buoy.requested_by ? <>{buoy.requested_by} · <Ago ms={buoy.requested_at} /></> : "3 a day"}</small>
          </dd>
        </div>
        <div>
          <dt className="sc-tag">Buoy reports</dt>
          <dd>{buoy.tx_count_reported ? `${buoy.tx_count_reported} a day` : "Not yet"}
            <small>{packetLabel(buoy)} <Ago ms={lastHeard(buoy)} /></small>
          </dd>
        </div>
      </dl>
      <Link className="sc-link" href="/settings/">Change its settings</Link>
    </section>
  );
}
