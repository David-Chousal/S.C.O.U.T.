"use client";

import { useEffect, useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { EmptyState } from "@/components/feedback/empty-state";
import { Ago } from "@/components/ui/ago";
import { api } from "@/lib/api/client";
import type { Fleet, Reading } from "@/lib/api/types";
import { useWhen } from "@/lib/preferences-context";
import { useApi } from "@/lib/use-api";

const SHOWN = 50;

/** The values a reading carries, in the order people look for them. Blank means not measured. */
const COLUMNS = [
  { key: "temp_c", label: "Water", unit: "°C" },
  { key: "turbidity_fau", label: "Turbidity", unit: "FAU" },
  { key: "battery_v", label: "Battery", unit: "V" },
  { key: "internal_humidity_pct", label: "Housing humidity", unit: "%" },
] as const;

const value = (reading: Reading, key: string) => reading[key] || "—";

function Latest({ reading }: { reading: Reading }) {
  return (
    <section className="sc-bay" aria-label="Latest reading">
      <div className="sc-bay__head">
        <h2 className="sc-bay__title">Latest reading</h2>
        <span className="sc-tag">Taken <Ago ms={Date.parse(reading.timestamp_utc)} /></span>
      </div>
      <dl className="sc-readings-latest">
        {COLUMNS.map((column) => (
          <div key={column.key}>
            <dt className="sc-tag">{column.label}</dt>
            <dd>{value(reading, column.key)}<small>{reading[column.key] ? column.unit : ""}</small></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ReadingsTable({ readings }: { readings: Reading[] }) {
  const when = useWhen();
  return (
    <section className="sc-bay" aria-labelledby="readings-title">
      <div className="sc-bay__head">
        <h2 className="sc-bay__title" id="readings-title">Readings</h2>
        <span className="sc-tag">Newest first · last {SHOWN}</span>
      </div>
      <div className="sc-table-wrap">
        <table className="sc-table">
          <thead>
            <tr>
              <th scope="col">Taken</th>
              {COLUMNS.map((column) => <th key={column.key} scope="col" className="n">{column.label} ({column.unit})</th>)}
              <th scope="col">Flags</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr key={`${reading.record_seq}-${reading.timestamp_utc}`}>
                <td className="sc-audit-table__when">{when(Date.parse(reading.timestamp_utc))}</td>
                {COLUMNS.map((column) => <td key={column.key} className="n">{value(reading, column.key)}</td>)}
                <td><span className="sub">{reading.flags?.replaceAll("|", " · ") || "—"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** The Readings page: what each buoy measured, newest first, as the shore stations pushed it. */
export function ReadingsBoard() {
  const fleet = useApi<Fleet>(api.fleet);
  const [picked, setPicked] = useState<number | null>(null);
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [error, setError] = useState("");
  const buoyId = picked ?? fleet.data?.buoys[0]?.buoy_id ?? null;

  useEffect(() => {
    if (buoyId === null) return;
    let live = true;
    api.readings(buoyId, SHOWN).then(
      (reply) => live && setReadings(reply.readings),
      (failure: unknown) => live && setError(failure instanceof Error ? failure.message : "Could not load readings."),
    );
    return () => {
      live = false;
    };
  }, [buoyId]);

  if (fleet.error || error) return <Banner tone="failed">{fleet.error || error}</Banner>;
  if (!fleet.data) return <span className="sc-tag" aria-busy="true">Loading buoys…</span>;
  if (fleet.data.buoys.length === 0) {
    return <EmptyState status="No buoys" title="No buoys yet">A buoy appears when its shore station first pushes a reading.</EmptyState>;
  }
  return (
    <>
      <div className="sc-seg" role="group" aria-label="Buoy">
        {fleet.data.buoys.map((buoy) => (
          <button key={buoy.buoy_id} type="button" aria-pressed={buoy.buoy_id === buoyId}
            onClick={() => { setReadings(null); setPicked(buoy.buoy_id); }}>{buoy.label}</button>
        ))}
      </div>
      {readings === null && <span className="sc-tag" aria-busy="true">Loading readings…</span>}
      {readings?.length === 0 && (
        <EmptyState status="No readings" title="No readings yet">
          This buoy is listed, but no shore station has pushed one of its readings.
        </EmptyState>
      )}
      {readings && readings.length > 0 && (
        <>
          <Latest reading={readings[0]} />
          <ReadingsTable readings={readings} />
        </>
      )}
    </>
  );
}
