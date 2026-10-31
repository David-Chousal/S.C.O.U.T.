"use client";

import { SignalMeter } from "@/components/status/signal-meter";
import { Ago } from "@/components/ui/ago";
import type { Buoy, Reading } from "@/lib/api/types";
import { BAY_KINDS, type BayConfig } from "@/lib/dashboard/layout";
import { lastHeard } from "@/lib/format";
import { VARIABLES, variableLabel } from "@/lib/variables";
import { freshness } from "@/components/stations/stations-board";
import { TraceBay } from "./trace-bay";

const HOUR = 3600 * 1000;

export interface BoardData {
  buoys: Buoy[];
  /** Each buoy's last 7 days of readings, oldest first. */
  readings: Record<number, Reading[]>;
  now: number;
}

const buoyLabel = (data: BoardData, id?: number) => data.buoys.find((b) => b.buoy_id === id)?.label ?? `Buoy ${id}`;

/** What a bay is called in its head, the library and its move/remove controls. */
export function bayName(bay: BayConfig, data: BoardData): string {
  if (bay.kind === "readout") return `${variableLabel(bay.variable ?? "")} · ${buoyLabel(data, bay.buoy)}`;
  if (bay.kind === "trace") return `${variableLabel(bay.variable ?? "")} · last 7 days`;
  if (bay.kind === "latest") return `Latest readings · ${buoyLabel(data, bay.buoy)}`;
  return BAY_KINDS[bay.kind].name;
}

function Readout({ bay, data }: { bay: BayConfig; data: BoardData }) {
  const rows = data.readings[bay.buoy ?? 0] ?? [];
  const latest = [...rows].reverse().find((r) => r[bay.variable ?? ""]);
  if (!latest) return <p className="sc-help">No reading in the last 7 days.</p>;
  return (
    <div>
      <div className="sc-dash-readout">{latest[bay.variable ?? ""]}<small>{VARIABLES[bay.variable ?? ""]?.unit}</small></div>
      <span className="sc-help">Taken <Ago ms={Date.parse(latest.timestamp_utc)} /></span>
    </div>
  );
}

function Fleet({ data }: { data: BoardData }) {
  if (data.buoys.length === 0) return <p className="sc-help">No buoys yet.</p>;
  return (
    <div className="sc-list">
      {data.buoys.map((buoy) => (
        <div key={buoy.buoy_id} className="sc-list__row">
          <span className="sc-list__main"><strong>{buoy.label}</strong><span>heard <Ago ms={lastHeard(buoy)} /> · {buoy.tx_count_reported ?? "—"} a day</span></span>
          <span className="sc-list__end"><SignalMeter {...freshness(lastHeard(buoy), data.now, 9 * HOUR)} /></span>
        </div>
      ))}
    </div>
  );
}

function Latest({ bay, data }: { bay: BayConfig; data: BoardData }) {
  const rows = [...(data.readings[bay.buoy ?? 0] ?? [])].reverse().slice(0, 6);
  if (rows.length === 0) return <p className="sc-help">No readings in the last 7 days.</p>;
  const columns = ["temp_c", "turbidity_fau", "battery_v"];
  return (
    <table className="sc-table">
      <thead><tr><th scope="col">Taken (UTC)</th>{columns.map((c) => <th key={c} scope="col" className="n">{variableLabel(c)}</th>)}</tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={`${r.record_seq}-${r.timestamp_utc}`}>
            <td className="sc-audit-table__when">{r.timestamp_utc.slice(5, 16).replace("T", " ")}</td>
            {columns.map((c) => <td key={c} className="n">{r[c] || "—"}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** One bay: a rail-hung bay with its name, holding the content its kind shows. */
export function BayContent({ bay, data }: { bay: BayConfig; data: BoardData }) {
  return (
    <section className="sc-bay" aria-label={bayName(bay, data)}>
      <div className="sc-bay__head"><h2 className="sc-bay__title">{bayName(bay, data)}</h2></div>
      {bay.kind === "readout" && <Readout bay={bay} data={data} />}
      {bay.kind === "trace" && <TraceBay buoys={data.buoys} readings={data.readings} variable={bay.variable ?? "temp_c"} now={data.now} />}
      {bay.kind === "fleet" && <Fleet data={data} />}
      {bay.kind === "latest" && <Latest bay={bay} data={data} />}
    </section>
  );
}
