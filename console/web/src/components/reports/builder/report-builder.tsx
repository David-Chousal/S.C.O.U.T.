"use client";

import { useState, type ReactNode } from "react";
import { Banner } from "@/components/feedback/banner";
import { Key } from "@/components/ui/key";
import { plainStart, type SavedLayout, type Start } from "@/lib/report/saved";
import { Inspector } from "./inspector";
import { BlocksTab, LibraryPanel } from "./library-panel";
import { OutlineTab } from "./outline-tab";
import { useBlockDrag } from "./use-block-drag";
import { ReportActions } from "./report-actions";
import { MeasureColumn } from "./report-pages";
import { ReportPreview } from "./report-preview";
import { ReportToolbar } from "./report-toolbar";
import { useReportContent, type ReportBuoy } from "./use-report-content";
import { useReportEditor } from "./use-report-editor";
import { SaveControls } from "./save-controls";
import { TemplatesTab } from "./templates-tab";
import { useSavedReport } from "./use-saved-report";

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
  /** What to open (saved/saved.ts chooseStart); the plain report when absent. */
  start?: Start;
  /** Saved reports and templates this person can open. */
  layouts?: SavedLayout[];
  onLayoutsChanged?: () => void;
  /** Admins choose the team's default template. */
  isAdmin?: boolean;
}

const NO_LAYOUTS: SavedLayout[] = [];

/** The Reports page as a builder: report-wide variables in the toolbar, the live paper preview in
 * the centre, and panels either side (docs/engineering/console-report-builder-plan.md). */
export function ReportBuilder({ buoys, columns, canDownload, canEdit, now, onCreated, recent, start, layouts = NO_LAYOUTS,
  onLayoutsChanged = () => undefined, isAdmin = false }: ReportBuilderProps) {
  const { doc, dispatch, undo, redo, canUndo, canRedo } = useReportEditor(() => start?.doc ?? plainStart(buoys.map((b) => b.buoy_id), now));
  const saving = useSavedReport({ doc, dispatch, startId: start?.reportId ?? null, layouts, onLayoutsChanged });
  const { content, readings, loading, column, editPages, printPages } = useReportContent(doc, now, buoys);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = doc.blocks.find((b) => b.id === selectedId) ?? null;
  const { area: dropArea, pointer: drag } = useBlockDrag(dispatch, setSelectedId);
  const actions = (
    <>
      {canEdit && <SaveControls saved={saving.saved} dirty={saving.dirty} title={doc.title} onSave={saving.save} onSaveAs={saving.saveAs} />}
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
        <LibraryPanel footer={recent} tabs={[
          { id: "templates", label: "Templates", content: <TemplatesTab layouts={layouts} variables={doc.variables} canEdit={canEdit} isAdmin={isAdmin}
            dirty={saving.dirty && doc.blocks.length > 0} onOpen={(next, id) => { saving.open(next, id); setSelectedId(null); }} onLayoutsChanged={onLayoutsChanged} /> },
          { id: "blocks", label: "Blocks", content: <BlocksTab canEdit={canEdit} drag={drag} onAdd={(block) => {
            dispatch({ type: "add", block, after: selected?.id ?? null });
            setSelectedId(block.id);
          }} /> },
          { id: "outline", label: "Outline", content: <OutlineTab blocks={doc.blocks} selectedId={selected?.id ?? null} canEdit={canEdit} onSelect={setSelectedId} dispatch={dispatch} /> },
        ]} />
      </aside>
      <div className="sc-report-stage">
        {readings.failed > 0 && (
          <Banner tone="failed" action={<button type="button" className="sc-link" onClick={readings.retryFailed}>Try again</button>}>Some readings did not load.</Banner>
        )}
        <ReportPreview content={content} pages={editPages} selectedId={selected?.id ?? null} onSelect={setSelectedId} canEdit={canEdit} dispatch={dispatch} drag={drag} dropArea={dropArea} />
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
