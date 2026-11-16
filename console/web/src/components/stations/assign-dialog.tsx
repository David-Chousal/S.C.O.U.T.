"use client";

import { useState } from "react";
import { Dialog } from "@/components/overlays/dialog";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy, Device } from "@/lib/api/types";
import { ROUTE_REASON } from "./command-routes";

interface AssignDialogProps {
  station: Device | null;
  buoys: Buoy[];
  onClose: () => void;
  onSaved: () => void;
}

/** Pick which buoys one station answers. Ticking a buoy pins it here, away from any other station;
 * unticking a pin hands the buoy back to the console, which gives it to the station that hears it
 * most (worker/routing.js). */
export function AssignDialog({ station, buoys, onClose, onSaved }: AssignDialogProps) {
  const { show } = useToast();
  const initial = new Set(buoys.filter((b) => station && b.command_device_id === station.id).map((b) => b.buoy_id));
  const [picked, setPicked] = useState<Set<number>>(initial);
  const [saving, setSaving] = useState(false);
  if (!station) return null;

  const toggle = (id: number) => setPicked((now) => {
    const next = new Set(now);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const changed = buoys.filter((b) => picked.has(b.buoy_id) !== initial.has(b.buoy_id));

  async function save() {
    if (!station) return;
    setSaving(true);
    try {
      for (const buoy of changed) await api.setCommandStation(buoy.buoy_id, picked.has(buoy.buoy_id) ? station.id : null);
      show({ tone: "ok", title: `Updated ${station.name}'s buoys` });
      onSaved();
      onClose();
    } catch (failure) {
      show({ tone: "failed", title: "Not saved", detail: failure instanceof Error ? failure.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open title={`Buoys ${station.name} answers`} onClose={onClose}
      footer={<>
        <Key onClick={onClose}>Cancel</Key>
        <Key variant="primary" disabled={saving || changed.length === 0} onClick={() => void save()}>
          {saving ? "Saving…" : "Save"}
        </Key>
      </>}>
      <p className="sc-help">Only one station may answer a buoy. Ticking a buoy pins it to this station; an unticked buoy goes to
        whichever station hears it most.</p>
      <fieldset className="sc-assign">
        <legend className="sc-visually-hidden">Buoys</legend>
        {buoys.map((buoy) => {
          const now = buoy.answering_station;
          const elsewhere = now ? `now ${now.device_id === station.id ? "this station" : now.name} (${ROUTE_REASON[now.reason]})` : "no station yet";
          return (
            <label key={buoy.buoy_id} className="sc-assign__row">
              <input type="checkbox" checked={picked.has(buoy.buoy_id)} onChange={() => toggle(buoy.buoy_id)} />
              <span>{buoy.label}<span className="sc-tag"> ID {buoy.buoy_id}</span></span>
              {elsewhere && <span className="sc-help">{elsewhere}</span>}
            </label>
          );
        })}
      </fieldset>
    </Dialog>
  );
}
