"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { createBlock, createDocument, type ReportDocument } from "@/lib/report/document";
import { useReadingsStore } from "@/lib/report/readings-store";
import { resolveRange, type ReportVariables } from "@/lib/report/variables";
import type { ViewContext } from "@/lib/report/views";
import { VariablesPanel } from "./variables-panel";
import { ReportPreview } from "./report-preview";
import { ReportToolbar } from "./report-toolbar";
import { useReportEditor } from "./use-report-editor";

const DAY_MS = 24 * 3600 * 1000;

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

function startingDocument(buoys: ReportBuilderProps["buoys"], now: number): ReportDocument {
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const variables: ReportVariables = { buoys: buoys.map((b) => b.buoy_id), range: { preset: "7d", from: day(now - 7 * DAY_MS), to: day(now) }, zone: "utc" };
  return createDocument(variables, [createBlock("summaryTable", "summary"), createBlock("readingsTable", "readings")]);
}

/** Every variable any visible block shows, in the Worker's order: what the CSV holds. */
const csvColumns = (doc: ReportDocument, columns: string[]) =>
  columns.filter((c) => doc.blocks.some((b) => !b.hidden && "variables" in b.options && b.options.variables.includes(c)));

/** The Reports page as a builder: report-wide variables in the toolbar, the live paper preview in
 * the centre, and panels either side (docs/engineering/console-report-builder-plan.md). */
export function ReportBuilder({ buoys, columns, canDownload, now, onCreated, recent }: ReportBuilderProps) {
  const { show } = useToast();
  const readings = useReadingsStore();
  const { doc, dispatch, undo, redo, canUndo, canRedo } = useReportEditor(() => startingDocument(buoys, now));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const range = resolveRange(doc.variables.range, now, doc.variables.zone);
  const csv = csvColumns(doc, columns);
  const ready = doc.variables.buoys.length > 0 && csv.length > 0 && range.from <= range.to;
  const selected = doc.blocks.find((b) => b.id === selectedId) ?? null;
  const ctx = useMemo<ViewContext>(() => ({
    report: doc.variables, now, readings: readings.get,
    buoyLabel: (id) => buoys.find((b) => b.buoy_id === id)?.label ?? `Buoy ${id}`,
  }), [doc.variables, now, readings.get, buoys]);
  const printHref = `/reports/print/?buoys=${doc.variables.buoys.join(",")}&from=${range.from.slice(0, 10)}&to=${range.to.slice(0, 10)}&columns=${csv.join(",")}`;

  async function downloadCsv() {
    setBusy(true);
    try {
      const made = await api.createReport({ buoys: doc.variables.buoys, from: range.from, to: range.to, columns: csv });
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
      <Key size="sm" iconOnly icon="undo" aria-label="Undo" title="Undo (⌘Z)" disabled={!canUndo} onClick={undo} />
      <Key size="sm" iconOnly icon="redo" aria-label="Redo" title="Redo (⇧⌘Z)" disabled={!canRedo} onClick={redo} />
      <Key size="sm" icon="export" disabled={!canDownload || !ready || busy} onClick={downloadCsv}>{busy ? "Making…" : "CSV"}</Key>
      <a className={`sc-key sc-key--sm sc-key--primary${ready ? "" : " is-disabled"}`} href={ready ? printHref : undefined} target="_blank" rel="noopener">Printable report</a>
    </>
  );
  const title = (
    <input className="sc-report-bar__name" aria-label="Report title" value={doc.title} maxLength={80}
      onChange={(e) => dispatch({ type: "setTitle", title: e.target.value })} />
  );

  return (
    <div className="sc-report-builder">
      <ReportToolbar title={title} buoys={buoys} variables={doc.variables} onVariables={(variables) => dispatch({ type: "setVariables", variables })}
        page={doc.page} onPage={(page) => dispatch({ type: "setPage", page })} actions={actions} />
      <aside className="sc-report-side sc-report-side--left" aria-label="Report library">{recent}</aside>
      <div className="sc-report-stage">
        <ReportPreview doc={doc} ctx={ctx} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      <aside className="sc-report-side sc-report-side--right" aria-label="Block options">
        {selected && "variables" in selected.options
          ? <VariablesPanel columns={columns} chosen={selected.options.variables}
              onChange={(variables) => dispatch({ type: "update", id: selected.id, options: { variables } })} />
          : <p className="sc-help">Click a block in the preview to change what it shows.</p>}
      </aside>
    </div>
  );
}
