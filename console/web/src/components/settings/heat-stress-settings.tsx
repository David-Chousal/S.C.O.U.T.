"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { utc } from "@/lib/format";

/** Settings → Buoys → Heat stress (SCO-314, ADR-0017): a buoy's position and site MMM, the
 * climatology Degree Heating Weeks needs. Look it up from NOAA Coral Reef Watch's 5 km product for
 * the position, or type it in (e.g. off the site's CRW virtual station). Guests see it read-only. */

const text = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));

function currentLine(buoy: Buoy): string {
  if (buoy.mmm_c === null || buoy.mmm_c === undefined) return "No MMM set: the Dashboard shows no heat stress for this buoy.";
  const from = buoy.mmm_source === "noaa_crw_5km"
    ? `looked up from NOAA CRW's 5 km product (cell ${text(buoy.mmm_cell_lat)}, ${text(buoy.mmm_cell_lon)})`
    : "entered by hand";
  const by = buoy.mmm_set_by ? ` by ${buoy.mmm_set_by}` : "";
  return `MMM ${buoy.mmm_c.toFixed(2)} °C, ${from}${by}${buoy.mmm_set_at ? `, ${utc(buoy.mmm_set_at)}` : ""}. Bleaching threshold ${(buoy.mmm_c + 1).toFixed(2)} °C.`;
}

export function HeatStressSettings({ buoy, canEdit, onSaved }: { buoy: Buoy; canEdit: boolean; onSaved: () => void }) {
  const { show } = useToast();
  const [latitude, setLatitude] = useState(text(buoy.latitude));
  const [longitude, setLongitude] = useState(text(buoy.longitude));
  const [mmm, setMmm] = useState(text(buoy.mmm_c));
  const [busy, setBusy] = useState(false);
  const id = `buoy-${buoy.buoy_id}-heat`;
  const position = latitude.trim() === "" && longitude.trim() === "" ? { latitude: null, longitude: null }
    : { latitude: Number(latitude), longitude: Number(longitude) };

  async function run(action: () => Promise<unknown>, done: string, failed: string) {
    setBusy(true);
    try {
      await action();
      show({ tone: "ok", title: done });
      onSaved();
    } catch (failure) {
      show({ tone: "failed", title: failed, detail: failure instanceof Error ? failure.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  function lookUp() {
    if (position.latitude === null || position.longitude === null) {
      show({ tone: "failed", title: "Not looked up", detail: "Give the buoy's latitude and longitude first." });
      return;
    }
    const at = { lookup: true as const, latitude: position.latitude, longitude: position.longitude };
    void run(() => api.setMmm(buoy.buoy_id, at), `Looked up ${buoy.label}'s MMM from NOAA Coral Reef Watch`, "MMM not looked up");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => api.setMmm(buoy.buoy_id, { mmm_c: Number(mmm), ...position }), `Saved ${buoy.label}'s MMM`, "MMM not saved");
  }

  return (
    <section className="sc-bay" aria-labelledby={`${id}-title`}>
      <div className="sc-bay__head">
        <h3 className="sc-bay__title" id={`${id}-title`}>Heat stress · {buoy.label}</h3>
        <span className="sc-tag">NOAA Coral Reef Watch</span>
      </div>
      <p className="sc-help">{currentLine(buoy)}</p>
      <form className="sc-settings-form" onSubmit={save} aria-label={`${buoy.label} position and MMM`}>
        <label className="sc-fieldset">
          <span className="sc-fieldset__label"><span className="sc-tag">Latitude (°N, south negative)</span></span>
          <input className="sc-input sc-num" inputMode="decimal" value={latitude} disabled={!canEdit || busy} placeholder="21.46"
            onChange={(event) => setLatitude(event.target.value)} />
        </label>
        <label className="sc-fieldset">
          <span className="sc-fieldset__label"><span className="sc-tag">Longitude (°E, west negative)</span></span>
          <input className="sc-input sc-num" inputMode="decimal" value={longitude} disabled={!canEdit || busy} placeholder="-157.79"
            onChange={(event) => setLongitude(event.target.value)} />
        </label>
        <label className="sc-fieldset">
          <span className="sc-fieldset__label"><span className="sc-tag">MMM (°C)</span></span>
          <input className="sc-input sc-num" inputMode="decimal" value={mmm} disabled={!canEdit || busy} placeholder="Look up, or type it"
            onChange={(event) => setMmm(event.target.value)} />
          <span className="sc-help">The warmest climatological month&apos;s mean sea temperature for the site. Bleaching stress builds above MMM + 1 °C.</span>
        </label>
        <div className="sc-settings-form__foot">
          <Key variant="primary" disabled={!canEdit || busy} onClick={lookUp}>Look up from NOAA</Key>
          <Key type="submit" disabled={!canEdit || busy || mmm.trim() === ""}>Save MMM by hand</Key>
          <Key disabled={!canEdit || busy || buoy.mmm_c === null || buoy.mmm_c === undefined}
            onClick={() => void run(() => api.setMmm(buoy.buoy_id, { mmm_c: null }), `Cleared ${buoy.label}'s MMM`, "MMM not cleared")}>Clear MMM</Key>
        </div>
      </form>
    </section>
  );
}
