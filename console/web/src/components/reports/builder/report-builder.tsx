"use client";

import { useState, type ReactNode } from "react";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { DEFAULT_PAGE, type PageSetup } from "@/lib/report/page";
import { useReadingsStore } from "@/lib/report/readings-store";
import { resolveRange, type ReportVariables } from "@/lib/report/variables";
import { VARIABLES, variableLabel } from "@/lib/variables";
import { ReportPreview } from "./report-preview";
import { ReportToolbar } from "./report-toolbar";

const DEFAULT_COLUMNS = ["temp_c", "turbidity_fau", "battery_v"];
const DAY_MS = 24 * 3600 * 1000;
const toggled = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

interface ReportBuilderProps {
  buoys: Pick<Buoy, "buoy_id" | "label">[];
  /** Variables the Worker allows (REPORT_COLUMNS). */
  columns: string[];
  canDownload: boolean;
  /** When the page opened, ms; presets count back from it. Passed in so tests are fixed. */
  now: number;
  onCreated: (link: string) => void;
  /** The recent CSVs list, shown in the left panel. */
  recent: ReactNode;
}

function defaultVariables(buoys: ReportBuilderProps["buoys"], now: number): ReportVariables {
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { buoys: buoys.map((b) => b.buoy_id), range: { preset: "7d", from: day(now - 7 * DAY_MS), to: day(now) }, zone: "utc" };
}

/** The Reports page as a builder: report-wide variables in the toolbar, the live paper preview in
 * the centre, and panels either side (docs/engineering/console-report-builder-plan.md). */
export function ReportBuilder({ buoys, columns, canDownload, now, onCreated, recent }: ReportBuilderProps) {
  const { show } = useToast();
  const readings = useReadingsStore();
  const [variables, setVariables] = useState(() => defaultVariables(buoys, now));
  const [page, setPage] = useState<PageSetup>(DEFAULT_PAGE);
  const [chosen, setChosen] = useState(() => DEFAULT_COLUMNS.filter((c) => columns.includes(c)));
  const [busy, setBusy] = useState(false);
  const ordered = columns.filter((c) => chosen.includes(c));
  const range = resolveRange(variables.range, now, variables.zone);
  const ready = variables.buoys.length > 0 && ordered.length > 0 && range.from <= range.to;
  const printHref = `/reports/print/?buoys=${variables.buoys.join(",")}&from=${range.from}&to=${range.to}&columns=${ordered.join(",")}`;

  async function downloadCsv() {
    setBusy(true);
    try {
      const made = await api.createReport({ buoys: variables.buoys, from: range.from, to: range.to, columns: ordered });
      show({ tone: "ok", title: `Report ready: ${made.rows.toLocaleString("en-US")} readings`, detail: "The download link works for an hour." });
      onCreated(made.link);
    } catch (failure) {
      show({ tone: "failed", title: "No report", detail: failure instanceof Error ? failure.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  const actions = (
    <>
      <Key size="sm" icon="export" disabled={!canDownload || !ready || busy} onClick={downloadCsv}>{busy ? "Making…" : "CSV"}</Key>
      <a className={`sc-key sc-key--sm sc-key--primary${ready ? "" : " is-disabled"}`} href={ready ? printHref : undefined} target="_blank" rel="noopener">Printable report</a>
    </>
  );

  return (
    <div className="sc-report-builder">
      <ReportToolbar title={<h2 className="sc-bay__title">Buoy report</h2>} buoys={buoys} variables={variables} onVariables={setVariables}
        page={page} onPage={setPage} actions={actions} />
      <aside className="sc-report-side sc-report-side--left" aria-label="Report library">{recent}</aside>
      <div className="sc-report-stage">
        <ReportPreview buoys={buoys} picked={variables.buoys} range={range} zone={variables.zone} columns={ordered} page={page} readings={readings} />
      </div>
      <aside className="sc-report-side sc-report-side--right" aria-label="Report options">
        <fieldset className="sc-settings-choices">
          <legend className="sc-label">Variables</legend>
          {columns.map((c) => (
            <label key={c} className="sc-row">
              <input type="checkbox" checked={chosen.includes(c)} onChange={() => setChosen((now) => toggled(now, c))} />
              {variableLabel(c)}{VARIABLES[c]?.unit ? ` (${VARIABLES[c].unit})` : ""}
            </label>
          ))}
        </fieldset>
      </aside>
    </div>
  );
}
