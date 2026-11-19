"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Banner } from "@/components/feedback/banner";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { createBlock, createDocument, type ReportDocument } from "@/lib/report/document";
import { useReadingsStore } from "@/lib/report/readings-store";
import { resolveRange, type ReportVariables } from "@/lib/report/variables";
import { pageBox } from "@/lib/report/page";
import { buildView, type BlockView, type ViewContext } from "@/lib/report/views";
import { Inspector } from "./inspector";
import { PrintRoot } from "./print-root";
import { HEADER_ID, MeasureColumn } from "./report-pages";
import { usePagination, type FlowItem } from "./use-pagination";
import { ReportPreview } from "./report-preview";
import { ReportToolbar } from "./report-toolbar";
import { useReportEditor } from "./use-report-editor";

const DAY_MS = 24 * 3600 * 1000;
// Fit-width zoom rounds row heights up by a fraction of a pixel each; a little room keeps the last row on the page.
const ZOOM_SLACK_PX = 8;

interface ReportBuilderProps {
  buoys: Pick<Buoy, "buoy_id" | "label">[];
  /** Variables the Worker allows (REPORT_COLUMNS). */
  columns: string[];
  canDownload: boolean;
  /** Members and admins edit blocks; guests change only the report-wide variables. */
  canEdit: boolean;
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
export function ReportBuilder({ buoys, columns, canDownload, canEdit, now, onCreated, recent }: ReportBuilderProps) {
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
    // readings.version is not read here: it changes when a fetch lands, so every view rebuilds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [doc.variables, now, readings.get, readings.version, buoys]);
  const views = useMemo(() => new Map(doc.blocks.flatMap((b): [string, BlockView][] => {
    const view = buildView(b, ctx);
    return view ? [[b.id, view]] : [];
  })), [doc.blocks, ctx]);
  const items: FlowItem[] = [{ id: HEADER_ID, pageBreak: false, hidden: false },
    ...doc.blocks.map((b) => ({ id: b.id, pageBreak: b.kind === "pageBreak", hidden: b.hidden }))];
  const { column, editPages, printPages } = usePagination(items, pageBox(doc.page).contentHeight - ZOOM_SLACK_PX, `${doc.page.size}${doc.page.orientation}|${doc.title}`, views);
  // Print waits for every block's readings, so the paper never shows "Loading…".
  const loading = [...views.values()].some((v) => v.sections.some((s) => s.status === "loading"));
  const content = { doc, ctx, views };
  const [printing, setPrinting] = useState(false);
  const donePrinting = useCallback(() => setPrinting(false), []);

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
      <Key size="sm" variant="primary" icon="reports" disabled={doc.variables.buoys.length === 0 || printing || loading}
        title={loading ? "Waiting for readings to load" : undefined} onClick={() => setPrinting(true)}>Print</Key>
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
        {readings.failed > 0 && (
          <Banner tone="failed" action={<button type="button" className="sc-link" onClick={readings.retryFailed}>Try again</button>}>Some readings did not load.</Banner>
        )}
        <ReportPreview content={content} pages={editPages} selectedId={selected?.id ?? null} onSelect={setSelectedId} canEdit={canEdit} dispatch={dispatch} />
        <MeasureColumn content={content} columnRef={column} />
      </div>
      <aside className="sc-report-side sc-report-side--right" aria-label="Block options">
        {!canEdit ? <p className="sc-help">View only: change the buoys, dates and page above to preview, print and download. Editing blocks needs the member role.</p>
          : selected ? <Inspector block={selected} report={doc.variables} buoys={buoys} columns={columns} dispatch={dispatch} />
            : <p className="sc-help">Click a block in the preview to change what it shows.</p>}
      </aside>
      {printing && <PrintRoot content={content} pages={printPages} onDone={donePrinting} />}
    </div>
  );
}
