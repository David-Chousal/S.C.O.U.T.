"use client";

import { useToast } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy, Device } from "@/lib/api/types";

interface CommandStationProps {
  buoy: Pick<Buoy, "buoy_id" | "label" | "command_device_id" | "tx_count_requested">;
  /** Active (unrevoked) shore stations. */
  stations: Device[];
  canPick: boolean;
  onChanged: () => void;
}

/** Which shore station sends this buoy's downlink commands. Two stations sending the same command
 * in the buoy's 1 s listen window collide, or one is refused as a repeat, so exactly one may. */
export function CommandStation({ buoy, stations, canPick, onChanged }: CommandStationProps) {
  const { show } = useToast();
  if (stations.length <= 1 && !buoy.command_device_id) {
    return <span className="sc-help">{stations[0] ? `Commands go through ${stations[0].name}` : "No shore station yet"}</span>;
  }

  async function pick(deviceId: string) {
    try {
      await api.setCommandStation(buoy.buoy_id, deviceId || null);
      const name = stations.find((station) => station.id === deviceId)?.name;
      show({ tone: "ok", title: name ? `${buoy.label}'s commands go through ${name}` : `No station sends ${buoy.label}'s commands` });
      onChanged();
    } catch (failure) {
      show({ tone: "failed", title: "Not changed", detail: failure instanceof Error ? failure.message : undefined });
    }
  }

  return (
    <span className="sc-command-station">
      <select className="sc-input sc-command-station__select" aria-label={`Command station for ${buoy.label}`}
        value={buoy.command_device_id ?? ""} disabled={!canPick} onChange={(event) => pick(event.target.value)}>
        <option value="">Not picked</option>
        {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
      </select>
      {!buoy.command_device_id && buoy.tx_count_requested && (
        <span className="sc-help sc-help--error">No station sends this buoy&rsquo;s requested count</span>
      )}
    </span>
  );
}
