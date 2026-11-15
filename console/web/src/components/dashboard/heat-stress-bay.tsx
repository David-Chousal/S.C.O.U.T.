"use client";

import Link from "next/link";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import { ALERT_LEVELS, type AlertLevel, type BuoyHeatStress, type HeatStressView } from "@/lib/api/types";
import { DayChart, type Reference } from "./day-chart";

/** The heat-stress bay (SCO-314, ADR-0017): NOAA Coral Reef Watch's method on each buoy's own
 * temperature. Every buoy's current DHW and alert level, then for one buoy the daily-mean
 * temperature against its MMM and bleaching threshold (MMM + 1 °C), and DHW over 12 weeks. */

const SLUG: Record<AlertLevel, string> = {
  "No Stress": "nostress", "Bleaching Watch": "watch", "Bleaching Warning": "warning", "Alert Level 1": "alert1",
  "Alert Level 2": "alert2", "Alert Level 3": "alert3", "Alert Level 4": "alert4", "Alert Level 5": "alert5",
};
// CRW's DHW floors for Alert Levels 1–5, drawn on the DHW chart when the series reaches near them.
const DHW_FLOORS = [[4, "Alert 1 · 4"], [8, "Alert 2 · 8"], [12, "Alert 3 · 12"], [16, "Alert 4 · 16"], [20, "Alert 5 · 20"]] as const;

export function AlertChip({ alert }: { alert: AlertLevel }) {
  return <span className={`sc-alert-chip sc-alert-chip--${SLUG[alert]}`}>{alert}</span>;
}

function Legend() {
  return (
    <details className="sc-heat-legend">
      <summary className="sc-help">Alert levels (NOAA Coral Reef Watch)</summary>
      <ul aria-label="Bleaching alert levels">
        {ALERT_LEVELS.map((level, i) => (
          <li key={level}><AlertChip alert={level} /><span className="sc-help">{[
            "Daily mean at or below the MMM", "Above the MMM, below MMM + 1 °C", "HotSpot ≥ 1 °C, DHW under 4",
            "DHW 4–8: risk of reef-wide bleaching", "DHW 8–12: bleaching with mortality of heat-sensitive corals",
            "DHW 12–16: multi-species mortality", "DHW 16–20: severe mortality, over half of corals", "DHW 20+: near-complete mortality",
          ][i]}</span></li>
        ))}
      </ul>
    </details>
  );
}

const fmt = (value: number | null | undefined, digits: number) => (value === null || value === undefined ? "—" : value.toFixed(digits));

function NowTable({ buoys }: { buoys: BuoyHeatStress[] }) {
  return (
    <div className="sc-table-wrap">
      <table className="sc-table sc-heat-table">
        <thead>
          <tr><th scope="col">Buoy</th><th scope="col">Alert level</th><th scope="col" className="n">DHW (°C-wk)</th>
            <th scope="col" className="n">Daily mean (°C)</th><th scope="col" className="n">MMM (°C)</th><th scope="col">As of (UTC)</th></tr>
        </thead>
        <tbody>
          {buoys.map((b) => (
            <tr key={b.buoy_id}>
              <th scope="row">{b.label}</th>
              {b.mmm && b.current ? (
                <>
                  <td><AlertChip alert={b.current.alert} /></td>
                  <td className="n">{fmt(b.current.dhw, 1)}</td>
                  <td className="n">{fmt(b.current.sst, 2)}</td>
                  <td className="n">{fmt(b.mmm.value_c, 2)}</td>
                  <td className="sc-audit-table__when">{b.current.day}{b.current.days_old > 1 ? ` · ${b.current.days_old} days old` : ""}</td>
                </>
              ) : (
                <td colSpan={5} className="sc-heat-table__note">
                  {b.mmm ? b.note : <>No MMM set. <Link className="sc-link" href={`/settings/?buoy=${b.buoy_id}`}>Open Settings → Buoys</Link></>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BuoyCharts({ buoy }: { buoy: BuoyHeatStress }) {
  if (!buoy.mmm || buoy.threshold_c === null) return null;
  const mmm = buoy.mmm.value_c;
  const tempRefs: Reference[] = [
    { value: mmm, label: `MMM ${mmm.toFixed(2)}`, tone: "muted" },
    { value: buoy.threshold_c, label: `MMM + 1 °C`, tone: "annotation" },
  ];
  const peak = Math.max(0, ...buoy.series.map((d) => d.dhw));
  const dhwRefs: Reference[] = DHW_FLOORS.filter(([floor], i) => i === 0 || floor <= peak + 4)
    .map(([value, label]) => ({ value, label, tone: "annotation" }));
  const source = buoy.mmm.source === "noaa_crw_5km"
    ? `MMM from NOAA CRW's 5 km product, cell ${fmt(buoy.mmm.cell_latitude, 3)}, ${fmt(buoy.mmm.cell_longitude, 3)}`
    : "MMM entered by hand";
  return (
    <div className="sc-heat-charts">
      <div>
        <h3 className="sc-tag">Daily-mean water temperature · {buoy.label}</h3>
        <DayChart points={buoy.series.map((d) => ({ day: d.day, value: d.sst }))} label="Daily mean" unit="°C" color="var(--series-temp)"
          references={tempRefs} digits={2} ariaLabel={`${buoy.label} daily-mean water temperature over 12 weeks, with its MMM and bleaching threshold`} />
      </div>
      <div>
        <h3 className="sc-tag">Degree Heating Weeks · {buoy.label}</h3>
        <DayChart points={buoy.series.map((d) => ({ day: d.day, value: d.dhw }))} label="DHW" unit="°C-wk" color="var(--ink)"
          references={dhwRefs} floor={0} digits={1} ariaLabel={`${buoy.label} Degree Heating Weeks over 12 weeks, with CRW's alert floors`} />
      </div>
      <p className="sc-help">{source}. Daily means need half of a day&apos;s {buoy.samples_per_day ?? 3} transmits. Indicative: a buoy
        reads in-water temperature around the clock, not CRW&apos;s night-time satellite SST.</p>
    </div>
  );
}

/** The whole bay. `view` is null while loading or when the console could not compute it. */
export function HeatStressBay({ view }: { view: HeatStressView | null | undefined }) {
  const withMmm = view?.buoys.filter((b) => b.mmm) ?? [];
  const [picked, setPicked] = useState<number | null>(null);
  if (view === undefined) return <span className="sc-tag" aria-busy="true">Working out heat stress…</span>;
  if (view === null) return <p className="sc-help">Heat stress could not be loaded. Reload the page to try again.</p>;
  if (view.buoys.length === 0) return <p className="sc-help">No buoys yet.</p>;
  const shown = withMmm.find((b) => b.buoy_id === picked) ?? withMmm[0];
  return (
    <div className="sc-heat">
      <NowTable buoys={view.buoys} />
      {view.buoys.some((b) => !b.mmm) && (
        <p className="sc-help">{view.buoys.find((b) => !b.mmm)?.note}</p>
      )}
      <Legend />
      {withMmm.length > 1 && (
        <span className="sc-heat__pick">
          <Select aria-label="Buoy for the heat-stress charts" value={shown.buoy_id} onChange={setPicked}
            options={withMmm.map((b) => ({ value: b.buoy_id, label: b.label }))} />
        </span>
      )}
      {shown && <BuoyCharts buoy={shown} />}
    </div>
  );
}
