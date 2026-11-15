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
// The Worker's accepted MMM range (worker/mmm.js MMM_RANGE_C).
const MMM_RANGE_C = [10, 35] as const;

/** A typed number, or null when blank, or NaN when it is not a number (e.g. "27,6"). */
function parsed(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

type Position = { latitude: number | null; longitude: number | null };

/** Both coordinates, or neither, each a number in range; otherwise a sentence saying what is wrong. */
export function positionOf(latitude: string, longitude: string): Position | string {
  const lat = parsed(latitude);
  const lon = parsed(longitude);
  if ((lat === null) !== (lon === null)) return "Give both latitude and longitude, or neither.";
  if (lat !== null && !(Number.isFinite(lat) && lat >= -90 && lat <= 90)) return "Latitude is a number from −90 to 90 (south is negative).";
  if (lon !== null && !(Number.isFinite(lon) && lon >= -180 && lon <= 180)) return "Longitude is a number from −180 to 180 (west is negative).";
  return { latitude: lat, longitude: lon };
}

/** The MMM as a number in range, or a sentence saying what is wrong. Null is kept for Clear MMM. */
export function mmmOf(value: string): number | string {
  const mmm = parsed(value);
  if (mmm === null || !Number.isFinite(mmm) || mmm < MMM_RANGE_C[0] || mmm > MMM_RANGE_C[1]) {
    return `Give the MMM as a number in °C, ${MMM_RANGE_C[0]}–${MMM_RANGE_C[1]} (use a point, e.g. 27.6).`;
  }
  return mmm;
}

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
    const position = positionOf(latitude, longitude);
    if (typeof position === "string" || position.latitude === null || position.longitude === null) {
      show({ tone: "failed", title: "Not looked up", detail: typeof position === "string" ? position : "Give the buoy's latitude and longitude first." });
      return;
    }
    const at = { lookup: true as const, latitude: position.latitude, longitude: position.longitude };
    void run(() => api.setMmm(buoy.buoy_id, at), `Looked up ${buoy.label}'s MMM from NOAA Coral Reef Watch`, "MMM not looked up");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const position = positionOf(latitude, longitude);
    const value = mmmOf(mmm);
    const problem = typeof position === "string" ? position : typeof value === "string" ? value : null;
    if (problem !== null || typeof position === "string" || typeof value === "string") {
      show({ tone: "failed", title: "MMM not saved", detail: problem ?? undefined });
      return;
    }
    void run(() => api.setMmm(buoy.buoy_id, { mmm_c: value, ...position }), `Saved ${buoy.label}'s MMM`, "MMM not saved");
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
