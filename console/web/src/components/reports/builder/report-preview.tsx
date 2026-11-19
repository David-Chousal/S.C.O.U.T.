"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Segmented } from "@/components/ui/segmented";
import type { Block } from "@/lib/report/document";
import { pageBox } from "@/lib/report/page";
import type { Page } from "@/lib/report/paginate";
import type { ReportAction } from "@/lib/report/reducer";
import { effectiveVariables, rangeLabel, resolveRange } from "@/lib/report/variables";
import { BlockFrame } from "./block-frame";
import { InlineText, InlineTitle } from "./inline-edit";
import type { BlockDrag } from "./use-block-drag";
import { ReportPages, type PageContent } from "./report-pages";

interface ReportPreviewProps {
  content: PageContent;
  pages: Page[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  canEdit: boolean;
  dispatch: (action: ReportAction) => void;
  drag: BlockDrag;
  dropArea: RefObject<HTMLDivElement | null>;
}

/** Where the drop line goes for each block: above the block at the drop index, or below the last one. */
function dropMarks(blocks: Block[], drag: BlockDrag["drag"]): Map<string, "before" | "after"> {
  if (!drag || drag.at === null) return new Map();
  const moving = drag.source.type === "bay" ? drag.source.id : null;
  const staying = blocks.filter((b) => b.id !== moving);
  const target = staying[drag.at];
  if (target) return new Map([[target.id, "before"]]);
  const last = staying.at(-1);
  return last ? new Map([[last.id, "after"]]) : new Map();
}

const ZOOMS = [{ value: "fit", label: "Fit width" }, { value: "full", label: "100 %" }] as const;

/** Fit-width zoom: the pages scale down to the stage, never up. */
function useFitZoom(pageWidth: number) {
  const stage = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(pageWidth);
  useEffect(() => {
    const el = stage.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  // A margin of sunken background either side, so the page edge stays visible.
  return { stage, fit: Math.min(1, Math.max(0.2, (width - 48) / pageWidth)) };
}

/** The live paper preview: page frames at the chosen size, redrawn whenever the document changes.
 * Click a block to select it; its options open in the right panel. */
export function ReportPreview({ content, pages, selectedId, onSelect, canEdit, dispatch, drag, dropArea }: ReportPreviewProps) {
  const { doc, ctx } = content;
  const box = pageBox(doc.page);
  const [zoom, setZoom] = useState<"fit" | "full">("fit");
  const { stage, fit } = useFitZoom(box.width);
  const marks = dropMarks(doc.blocks, drag.drag);
  const ownLabel = (block: Block) => {
    const own = effectiveVariables(doc.variables, block.override);
    const parts = [block.override.buoys && own.buoys.map(ctx.buoyLabel).join(", "),
      block.override.range && rangeLabel(resolveRange(own.range, ctx.now, own.zone), own.zone)];
    return `Own ${parts.filter(Boolean).join(" · ")}`;
  };
  return (
    <div className="sc-report-preview">
      <div className="sc-report-preview__bar">
        <span className="sc-tag">{pages.length} {pages.length === 1 ? "page" : "pages"}</span>
        <Segmented size="sm" label="Zoom" options={ZOOMS} value={zoom} onChange={setZoom} />
      </div>
      <div className="sc-report-preview__scroll" ref={stage}>
        <div className={`sc-report-pages${drag.drag ? " is-dragging-over" : ""}`} ref={dropArea} aria-label="Report preview" style={{ zoom: zoom === "fit" ? fit : 1 }}
          onClick={(event) => event.target === event.currentTarget && onSelect(null)}>
          {doc.blocks.length === 0 && <p className="sc-rb-muted">This report has no blocks yet.</p>}
          <ReportPages content={content} pages={pages} frame={(block, children, first) => {
            const editing = canEdit && block.id === selectedId;
            const inline = editing && block.kind === "text" ? <InlineText block={block} dispatch={dispatch} />
              : editing && block.kind === "title" ? <InlineTitle block={block} title={doc.title} dispatch={dispatch} /> : children;
            return <BlockFrame block={block} selected={block.id === selectedId} canEdit={canEdit} overrideLabel={ownLabel(block)}
              onSelect={onSelect} dispatch={dispatch} drag={canEdit && first ? drag : null} drop={marks.get(block.id) ?? null} first={first}>{inline}</BlockFrame>;
          }} />
        </div>
      </div>
      {drag.drag && (
        <div className="sc-drag-ghost" style={{ left: drag.drag.x, top: drag.drag.y }} aria-hidden="true">
          <strong>{drag.drag.label}</strong>
          <span>{drag.drag.at === null ? "Release to cancel" : `Drop at position ${drag.drag.at + 1}`}</span>
        </div>
      )}
    </div>
  );
}
