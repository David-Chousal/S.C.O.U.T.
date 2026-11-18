"use client";

import type { KeyboardEvent } from "react";
import { BLOCK_INFO, type ReportDocument } from "@/lib/report/document";
import { pageBox } from "@/lib/report/page";
import { buildView, type ViewContext } from "@/lib/report/views";
import { rangeLabel, resolveRange, zoneLabel } from "@/lib/report/variables";
import { BlockScreen } from "../blocks/block-screen";

interface ReportPreviewProps {
  doc: ReportDocument;
  ctx: ViewContext;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** The live paper preview: the report as it will print, redrawn whenever the document changes.
 * Click a block to select it; its options open in the right panel. */
export function ReportPreview({ doc, ctx, selectedId, onSelect }: ReportPreviewProps) {
  const box = pageBox(doc.page);
  const range = resolveRange(doc.variables.range, ctx.now, doc.variables.zone);
  const onKey = (event: KeyboardEvent, id: string) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(id); }
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
          <div key={block.id} className={`sc-rb-block${block.id === selectedId ? " is-selected" : ""}${block.hidden ? " is-hidden" : ""}`}
            data-block-id={block.id} role="group" tabIndex={0} aria-current={block.id === selectedId || undefined}
            aria-label={`${BLOCK_INFO[block.kind].label} block`} onClick={() => onSelect(block.id)} onKeyDown={(e) => onKey(e, block.id)}>
            {view && <BlockScreen view={view} />}
          </div>
        );
      })}
    </div>
  );
}
