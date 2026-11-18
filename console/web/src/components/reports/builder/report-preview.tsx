"use client";

import type { ReportDocument } from "@/lib/report/document";
import type { ReportAction } from "@/lib/report/reducer";
import { pageBox } from "@/lib/report/page";
import { buildView, type ViewContext } from "@/lib/report/views";
import { effectiveVariables, rangeLabel, resolveRange, zoneLabel } from "@/lib/report/variables";
import { BlockScreen } from "../blocks/block-screen";
import { BlockFrame } from "./block-frame";

interface ReportPreviewProps {
  doc: ReportDocument;
  ctx: ViewContext;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  canEdit: boolean;
  dispatch: (action: ReportAction) => void;
}

/** The live paper preview: the report as it will print, redrawn whenever the document changes.
 * Click a block to select it; its options open in the right panel. */
export function ReportPreview({ doc, ctx, selectedId, onSelect, canEdit, dispatch }: ReportPreviewProps) {
  const box = pageBox(doc.page);
  const range = resolveRange(doc.variables.range, ctx.now, doc.variables.zone);
  const ownLabel = (block: ReportDocument["blocks"][number]) => {
    const own = effectiveVariables(doc.variables, block.override);
    const parts = [block.override.buoys && own.buoys.map(ctx.buoyLabel).join(", "),
      block.override.range && rangeLabel(resolveRange(own.range, ctx.now, own.zone), own.zone)];
    return `Own ${parts.filter(Boolean).join(" · ")}`;
  };
  return (
    <div className="sc-report-paper" style={{ width: `min(100%, ${box.width}px)` }} aria-label="Report preview"
      onClick={(event) => event.target === event.currentTarget && onSelect(null)}>
      <header className="sc-print__head">
        <div><span className="sc-wordmark">S.C.O.U.T.</span><h1>{doc.title}</h1></div>
        <p>{rangeLabel(range, doc.variables.zone)} ({zoneLabel(doc.variables.zone)})</p>
      </header>
      {doc.blocks.length === 0 && <p className="sc-rb-muted">This report has no blocks yet.</p>}
      {doc.blocks.map((block) => {
        const view = buildView(block, ctx);
        return (
          <BlockFrame key={block.id} block={block} selected={block.id === selectedId} canEdit={canEdit} overrideLabel={ownLabel(block)}
            onSelect={onSelect} dispatch={dispatch}>
            {view && <BlockScreen view={view} />}
          </BlockFrame>
        );
      })}
    </div>
  );
}
