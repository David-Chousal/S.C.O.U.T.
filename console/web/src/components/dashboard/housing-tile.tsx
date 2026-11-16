"use client";

import type { SignalState } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import type { Reading } from "@/lib/api/types";
import { housingSeal, type SealState } from "@/lib/dashboard/housing";
import { StatusDot } from "./status-dot";
import { seriesColor } from "./trace-bay";

interface HousingTileProps {
  buoys: { buoy_id: number; label: string }[];
  readings: Record<number, Reading[]>;
  multi: boolean;
}

const SEAL: Record<SealState, { state: SignalState; word: string }> = {
  sealed: { state: "ok", word: "Sealed" },
  high: { state: "failed", word: "Humidity high" },
  failed: { state: "stale", word: "Sensor failed" },
  unknown: { state: "off", word: "No readings" },
};

/** The housing seal per buoy, from the humidity sensor's two packet flags (the %RH value stays on
 * the SD card): sealed, humidity high (the first sign of a leak) or sensor failed, since when, and
 * how often humidity ran high in range. */
export function HousingTile({ buoys, readings, multi }: HousingTileProps) {
  return (
    <article className="sc-metric" aria-label="Housing seal">
      <header className="sc-metric__head">
        <span className="sc-metric__name sc-metric__name--plain">Housing seal</span>
        <span className="sc-help">humidity alarm</span>
      </header>
      {buoys.map((buoy, index) => {
        const seal = housingSeal(readings[buoy.buoy_id] ?? []);
        return (
          <div key={buoy.buoy_id} className="sc-metric__row">
            {multi && <span className="sc-metric__buoy"><i style={{ background: seriesColor(index) }} />{buoy.label}</span>}
            <span className="sc-seal"><StatusDot {...SEAL[seal.state]} />{seal.since !== null && <span className="sc-help">since <Ago ms={seal.since} /></span>}</span>
            {seal.readings > 0 && (
              <span className="sc-metric__range">
                {seal.highCount === 0 ? `Never high in ${seal.readings} readings`
                  : <>High in {seal.highCount} of {seal.readings} readings · last <Ago ms={seal.lastHigh ?? 0} /></>}
              </span>
            )}
          </div>
        );
      })}
    </article>
  );
}
