"use client";

import { useEffect, useRef, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import type { Block } from "@/lib/report/document";
import { pageBox } from "@/lib/report/page";
import type { Page } from "@/lib/report/paginate";
import type { ReportAction } from "@/lib/report/reducer";
import { effectiveVariables, rangeLabel, resolveRange } from "@/lib/report/variables";
import { BlockFrame } from "./block-frame";
import { ReportPages, type PageContent } from "./report-pages";

interface ReportPreviewProps {
  content: PageContent;
  pages: Page[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  canEdit: boolean;
  dispatch: (action: ReportAction) => void;
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
export function ReportPreview({ content, pages, selectedId, onSelect, canEdit, dispatch }: ReportPreviewProps) {
  const { doc, ctx } = content;
  const box = pageBox(doc.page);
  const [zoom, setZoom] = useState<"fit" | "full">("fit");
  const { stage, fit } = useFitZoom(box.width);
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
        <div className="sc-report-pages" aria-label="Report preview" style={{ zoom: zoom === "fit" ? fit : 1 }}
          onClick={(event) => event.target === event.currentTarget && onSelect(null)}>
          {doc.blocks.length === 0 && <p className="sc-rb-muted">This report has no blocks yet.</p>}
          <ReportPages content={content} pages={pages} frame={(block, children) => (
            <BlockFrame block={block} selected={block.id === selectedId} canEdit={canEdit} overrideLabel={ownLabel(block)}
              onSelect={onSelect} dispatch={dispatch}>{children}</BlockFrame>
          )} />
        </div>
      </div>
    </div>
  );
}
