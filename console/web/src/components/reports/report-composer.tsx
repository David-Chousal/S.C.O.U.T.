"use client";

import { useState } from "react";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { VARIABLES, variableLabel } from "@/lib/variables";

const DEFAULT_COLUMNS = ["temp_c", "turbidity_fau", "battery_v"];
const DAY_MS = 24 * 3600 * 1000;

interface ReportComposerProps {
  buoys: Pick<Buoy, "buoy_id" | "label">[];
  /** Variables the Worker allows (REPORT_COLUMNS). */
  columns: string[];
  canDownload: boolean;
  /** YYYY-MM-DD, UTC; passed in so the defaults are testable. */
  today: string;
  onCreated: (link: string) => void;
}

const minusDays = (day: string, days: number) => new Date(Date.parse(`${day}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10);
const toggled = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

/** Pick buoys, whole UTC days and variables; then a CSV (stored in R2, members and admins) or a
 * printable report (rendered in the browser, anyone signed in). */
export function ReportComposer({ buoys, columns, canDownload, today, onCreated }: ReportComposerProps) {
  const { show } = useToast();
  const [picked, setPicked] = useState(() => buoys.map((b) => b.buoy_id));
  const [from, setFrom] = useState(() => minusDays(today, 7));
  const [to, setTo] = useState(today);
  const [chosen, setChosen] = useState(() => DEFAULT_COLUMNS.filter((c) => columns.includes(c)));
  const [busy, setBusy] = useState(false);
  const ordered = columns.filter((c) => chosen.includes(c));
  const ready = picked.length > 0 && ordered.length > 0 && from <= to;
  const printHref = `/reports/print/?buoys=${picked.join(",")}&from=${from}&to=${to}&columns=${ordered.join(",")}`;

  async function download() {
    setBusy(true);
    try {
      const made = await api.createReport({ buoys: picked, from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z`, columns: ordered });
      show({ tone: "ok", title: `Report ready: ${made.rows.toLocaleString("en-US")} readings`, detail: "The download link works for an hour." });
      onCreated(made.link);
    } catch (failure) {
      show({ tone: "failed", title: "No report", detail: failure instanceof Error ? failure.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sc-bay" aria-labelledby="compose-title">
      <div className="sc-bay__head"><h2 className="sc-bay__title" id="compose-title">New report</h2><span className="sc-tag">Times in UTC</span></div>
      <div className="sc-report-form">
        <fieldset className="sc-settings-choices">
          <legend className="sc-label">Buoys</legend>
          {buoys.map((b) => (
            <label key={b.buoy_id} className="sc-row">
              <input type="checkbox" checked={picked.includes(b.buoy_id)} onChange={() => setPicked((now) => toggled(now, b.buoy_id))} />
              {b.label}
            </label>
          ))}
        </fieldset>
        <div className="sc-report-form__dates">
          <label className="sc-fieldset"><span className="sc-fieldset__label"><span className="sc-tag">From</span></span>
            <input className="sc-input" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="sc-fieldset"><span className="sc-fieldset__label"><span className="sc-tag">To</span></span>
            <input className="sc-input" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        <fieldset className="sc-settings-choices sc-report-form__wide">
          <legend className="sc-label">Variables</legend>
          <div className="sc-report-form__columns">
            {columns.map((c) => (
              <label key={c} className="sc-row">
                <input type="checkbox" checked={chosen.includes(c)} onChange={() => setChosen((now) => toggled(now, c))} />
                {variableLabel(c)}{VARIABLES[c]?.unit ? ` (${VARIABLES[c].unit})` : ""}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="sc-row">
        <Key icon="export" variant="primary" disabled={!canDownload || !ready || busy} onClick={download}>
          {busy ? "Making…" : "Download CSV"}
        </Key>
        <a className={`sc-key${ready ? "" : " is-disabled"}`} href={ready ? printHref : undefined} target="_blank" rel="noopener">Printable report</a>
      </div>
    </section>
  );
}
