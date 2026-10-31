"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { ApiError, type Buoy, type Reading } from "@/lib/api/types";
import { variableLabel, VARIABLES } from "@/lib/variables";
import { summarize } from "./report-stats";

interface Choice { buoys: number[]; from: string; to: string; columns: string[] }

function readChoice(search: string): Choice {
  const params = new URLSearchParams(search);
  const list = (key: string) => (params.get(key) || "").split(",").filter(Boolean);
  return { buoys: list("buoys").map(Number).filter(Number.isInteger), from: params.get("from") || "", to: params.get("to") || "", columns: list("columns") };
}

const fmt = (value: number | null) => (value === null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: 3 }));

/** A report meant for paper or PDF: per buoy, a summary of each variable, then every reading.
 * Rendered from the readings API in the browser; nothing is stored. Print with the browser. */
export function ReportPrint() {
  const [choice] = useState<Choice>(() => readChoice(typeof window === "undefined" ? "" : window.location.search));
  const [data, setData] = useState<{ buoys: Buoy[]; readings: Record<number, Reading[]> } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const range = [`${choice.from}T00:00:00Z`, `${choice.to}T23:59:59Z`] as const;
    Promise.all([api.fleet(), ...choice.buoys.map((b) => api.readingsBetween(b, ...range))]).then(
      ([fleet, ...replies]) => setData({ buoys: fleet.buoys, readings: Object.fromEntries(choice.buoys.map((b, i) => [b, [...replies[i].readings].reverse()])) }),
      (failure: unknown) => setError(failure instanceof ApiError && failure.status === 401 ? "Sign in to the console first, then open this report again."
        : failure instanceof Error ? failure.message : "Could not load the report."),
    );
  }, [choice]);

  if (error) return <main className="sc-print"><p>{error}</p></main>;
  if (!data) return <main className="sc-print"><p className="sc-tag">Loading the report…</p></main>;
  return (
    <main className="sc-print">
      <header className="sc-print__head">
        <div><span className="sc-wordmark">S.C.O.U.T.</span><h1>Buoy report</h1></div>
        <p>{choice.from} to {choice.to} (UTC) · made {new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</p>
        <button type="button" className="sc-key sc-print__button" onClick={() => window.print()}>Print or save as PDF</button>
      </header>
      {choice.buoys.map((id) => {
        const rows = data.readings[id] ?? [];
        const label = data.buoys.find((b) => b.buoy_id === id)?.label ?? `Buoy ${id}`;
        return (
          <section key={id} className="sc-print__buoy">
            <h2>{label} <small>{rows.length.toLocaleString("en-US")} readings</small></h2>
            {rows.length === 0 ? <p>No readings in this range.</p> : (
              <>
                <table className="sc-table">
                  <thead><tr><th scope="col">Variable</th><th scope="col" className="n">Readings</th><th scope="col" className="n">Min</th><th scope="col" className="n">Mean</th><th scope="col" className="n">Max</th></tr></thead>
                  <tbody>
                    {summarize(rows, choice.columns).map((s) => (
                      <tr key={s.column}><th scope="row">{variableLabel(s.column)}{VARIABLES[s.column]?.unit ? ` (${VARIABLES[s.column].unit})` : ""}</th>
                        <td className="n">{s.count}</td><td className="n">{fmt(s.min)}</td><td className="n">{fmt(s.mean)}</td><td className="n">{fmt(s.max)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <table className="sc-table sc-print__rows">
                  <thead><tr><th scope="col">Taken (UTC)</th>{choice.columns.map((c) => <th key={c} scope="col" className="n">{variableLabel(c)}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`${row.record_seq}-${row.timestamp_utc}`}>
                        <td className="sc-audit-table__when">{row.timestamp_utc.slice(0, 16).replace("T", " ")}</td>
                        {choice.columns.map((c) => <td key={c} className="n">{row[c] || "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        );
      })}
    </main>
  );
}
