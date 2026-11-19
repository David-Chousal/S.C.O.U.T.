"use client";

import type { Buoy } from "@/lib/api/types";
import { pageBox, type PageSetup } from "@/lib/report/page";
import { MAX_REPORT_READINGS, type useReadingsStore } from "@/lib/report/readings-store";
import { formatWhen, rangeLabel, zoneLabel, type ResolvedRange, type ZoneChoice } from "@/lib/report/variables";
import { variableLabel, VARIABLES } from "@/lib/variables";
import { summarize } from "../report-stats";

interface ReportPreviewProps {
  buoys: Pick<Buoy, "buoy_id" | "label">[];
  picked: number[];
  range: ResolvedRange;
  zone: ZoneChoice;
  columns: string[];
  page: PageSetup;
  readings: ReturnType<typeof useReadingsStore>;
}

const fmt = (value: number | null) => (value === null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: 3 }));
const withUnit = (c: string) => `${variableLabel(c)}${VARIABLES[c]?.unit ? ` (${VARIABLES[c].unit})` : ""}`;

/** The live paper preview: the report as it will print, redrawn whenever a choice changes.
 * For now one continuous sheet at the page's width holding the two fixed sections per buoy. */
export function ReportPreview({ buoys, picked, range, zone, columns, page, readings }: ReportPreviewProps) {
  const box = pageBox(page);
  return (
    <div className="sc-report-paper" style={{ width: `min(100%, ${box.width}px)` }} aria-label="Report preview">
      <header className="sc-print__head">
        <div><span className="sc-wordmark">S.C.O.U.T.</span><h1>Buoy report</h1></div>
        <p>{rangeLabel(range, zone)} ({zoneLabel(zone)})</p>
      </header>
      {picked.length === 0 && <p className="sc-help">Pick at least one buoy.</p>}
      {picked.map((id) => {
        const label = buoys.find((b) => b.buoy_id === id)?.label ?? `Buoy ${id}`;
        const entry = readings.get(id, range);
        if (entry.status === "loading") return <section key={id} className="sc-print__buoy" aria-busy="true"><h2>{label}</h2><p className="sc-tag">Loading…</p></section>;
        if (entry.status === "failed") return (
          <section key={id} className="sc-print__buoy"><h2>{label}</h2><p>{entry.error}</p>
            <button type="button" className="sc-link" onClick={readings.retryFailed}>Try again</button></section>
        );
        const rows = entry.rows;
        return (
          <section key={id} className="sc-print__buoy">
            <h2>{label} <small>{rows.length.toLocaleString("en-US")} readings</small></h2>
            {entry.truncated && <p className="sc-help">Only the newest {MAX_REPORT_READINGS.toLocaleString("en-US")} readings are shown, so these figures do not cover the whole range. The CSV holds every reading.</p>}
            {rows.length === 0 ? <p>No readings in this range.</p> : (
              <>
                <table className="sc-table">
                  <thead><tr><th scope="col">Variable</th><th scope="col" className="n">Readings</th><th scope="col" className="n">Min</th><th scope="col" className="n">Mean</th><th scope="col" className="n">Max</th></tr></thead>
                  <tbody>
                    {summarize(rows, columns).map((s) => (
                      <tr key={s.column}><th scope="row">{withUnit(s.column)}</th>
                        <td className="n">{s.count}</td><td className="n">{fmt(s.min)}</td><td className="n">{fmt(s.mean)}</td><td className="n">{fmt(s.max)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <table className="sc-table sc-print__rows">
                  <thead><tr><th scope="col">Taken ({zoneLabel(zone)})</th>{columns.map((c) => <th key={c} scope="col" className="n">{variableLabel(c)}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`${row.record_seq}-${row.timestamp_utc}`}>
                        <td className="sc-audit-table__when">{formatWhen(row.timestamp_utc, zone)}</td>
                        {columns.map((c) => <td key={c} className="n">{row[c] || "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
