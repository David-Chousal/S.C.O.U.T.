"use client";

import { useState, type ReactNode } from "react";
import { Banner } from "@/components/feedback/banner";
import { Key } from "@/components/ui/key";
import { createBlock, createDocument, type ReportDocument } from "@/lib/report/document";
import type { ReportVariables } from "@/lib/report/variables";
import { Inspector } from "./inspector";
import { BlocksTab, LibraryPanel } from "./library-panel";
import { ReportActions } from "./report-actions";
import { MeasureColumn } from "./report-pages";
import { ReportPreview } from "./report-preview";
import { ReportToolbar } from "./report-toolbar";
import { useReportContent, type ReportBuoy } from "./use-report-content";
import { useReportEditor } from "./use-report-editor";

const DAY_MS = 24 * 3600 * 1000;

interface ReportBuilderProps {
  buoys: ReportBuoy[];
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
  return createDocument(variables, [createBlock("title", "title"), createBlock("summaryTable", "summary"), createBlock("readingsTable", "readings")]);
}

/** The Reports page as a builder: report-wide variables in the toolbar, the live paper preview in
 * the centre, and panels either side (docs/engineering/console-report-builder-plan.md). */
export function ReportBuilder({ buoys, columns, canDownload, canEdit, now, onCreated, recent }: ReportBuilderProps) {
  const { doc, dispatch, undo, redo, canUndo, canRedo } = useReportEditor(() => startingDocument(buoys, now));
  const { content, failed, retry, loading, column, editPages, printPages } = useReportContent(doc, now, buoys);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = doc.blocks.find((b) => b.id === selectedId) ?? null;
  const actions = (
    <>
      <Key size="sm" iconOnly icon="undo" aria-label="Undo" title="Undo (⌘Z)" disabled={!canUndo} onClick={undo} />
      <Key size="sm" iconOnly icon="redo" aria-label="Redo" title="Redo (⇧⌘Z)" disabled={!canRedo} onClick={redo} />
      <ReportActions content={content} printPages={printPages} columns={columns} canDownload={canDownload} loading={loading} onCreated={onCreated} />
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
      <aside className="sc-report-side sc-report-side--left" aria-label="Report library">
        <LibraryPanel footer={recent} tabs={[{ id: "blocks", label: "Blocks", content: <BlocksTab canEdit={canEdit} onAdd={(block) => {
          dispatch({ type: "add", block, after: selected?.id ?? null });
          setSelectedId(block.id);
        }} /> }]} />
      </aside>
      <div className="sc-report-stage">
        {failed && (
          <Banner tone="failed" action={<button type="button" className="sc-link" onClick={retry}>Try again</button>}>Some of this report&apos;s data did not load.</Banner>
        )}
        <ReportPreview content={content} pages={editPages} selectedId={selected?.id ?? null} onSelect={setSelectedId} canEdit={canEdit} dispatch={dispatch} />
        <MeasureColumn content={content} columnRef={column} />
      </div>
      <aside className="sc-report-side sc-report-side--right" aria-label="Block options">
        {!canEdit ? <p className="sc-help">View only: change the buoys, dates and page above to preview, print and download. Editing blocks needs the member role.</p>
          : selected ? <Inspector block={selected} report={doc.variables} buoys={buoys} columns={columns} dispatch={dispatch} />
            : <p className="sc-help">Click a block in the preview to change what it shows.</p>}
      </aside>
    </div>
  );
}
