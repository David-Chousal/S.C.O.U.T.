"use client";

import type { ReactNode, RefObject } from "react";
import type { Block, ReportDocument } from "@/lib/report/document";
import { pageBox } from "@/lib/report/page";
import type { Fragment, Page } from "@/lib/report/paginate";
import type { BlockView, ViewContext } from "@/lib/report/views";
import { rangeLabel, resolveRange, zoneLabel } from "@/lib/report/variables";
import { BlockUnit, unitCount } from "../blocks/block-units";

export const HEADER_ID = "__header";

/** The report's head, until the Title block replaces it. */
export function ReportHead({ doc, ctx }: { doc: ReportDocument; ctx: ViewContext }) {
  const range = resolveRange(doc.variables.range, ctx.now, doc.variables.zone);
  return (
    <header className="sc-print__head">
      <div><span className="sc-wordmark">S.C.O.U.T.</span><h1>{doc.title}</h1></div>
      <p>{rangeLabel(range, doc.variables.zone)} ({zoneLabel(doc.variables.zone)})</p>
    </header>
  );
}

export interface PageContent {
  doc: ReportDocument;
  ctx: ViewContext;
  views: Map<string, BlockView>;
}

/** Every block at the page's content width, off screen, for usePagination to measure. */
export function MeasureColumn({ content, columnRef }: { content: PageContent; columnRef: RefObject<HTMLDivElement | null> }) {
  const { doc, ctx, views } = content;
  return (
    <div className="sc-report-measure" ref={columnRef} aria-hidden="true" style={{ width: pageBox(doc.page).contentWidth }}>
      <div data-m-block={HEADER_ID}><div data-m-unit=""><ReportHead doc={doc} ctx={ctx} /></div></div>
      {doc.blocks.map((block) => {
        const view = views.get(block.id);
        return (
          <div key={block.id} data-m-block={block.id}>
            {view && Array.from({ length: unitCount(view) }, (_, unit) => <div key={unit} data-m-unit=""><BlockUnit view={view} unit={unit} /></div>)}
          </div>
        );
      })}
    </div>
  );
}

/** Consecutive fragments of one block on a page, drawn together so a frame can wrap them. */
function groups(page: Page): { blockId: string; fragments: Fragment[] }[] {
  return page.reduce<{ blockId: string; fragments: Fragment[] }[]>((out, fragment) => {
    const last = out.at(-1);
    return last && last.blockId === fragment.blockId
      ? [...out.slice(0, -1), { ...last, fragments: [...last.fragments, fragment] }]
      : [...out, { blockId: fragment.blockId, fragments: [fragment] }];
  }, []);
}

interface PagesProps {
  content: PageContent;
  pages: Page[];
  /** Wraps a block's fragments on a page: the selection frame while editing, nothing in Print. */
  frame?: (block: Block, children: ReactNode) => ReactNode;
}

/** The pages themselves: real page frames at the chosen size, with page numbers. */
export function ReportPages({ content, pages, frame = (_, children) => children }: PagesProps) {
  const { doc, ctx, views } = content;
  const box = pageBox(doc.page);
  return pages.map((page, n) => (
    <div key={n} className="sc-report-page" style={{ width: box.width, height: box.height }}>
      <div className="sc-report-page__body">
        {groups(page).map(({ blockId, fragments }, i) => {
          if (blockId === HEADER_ID) return <ReportHead key={`h${i}`} doc={doc} ctx={ctx} />;
          const block = doc.blocks.find((b) => b.id === blockId);
          const view = views.get(blockId);
          if (!block || !view) return null;
          const units = fragments.map((f) => <div key={`${f.unit}-${f.rows?.[0] ?? 0}`} className="sc-report-unit"><BlockUnit view={view} unit={f.unit} rows={f.rows} /></div>);
          return <div key={`${blockId}-${i}`} className="sc-report-block">{frame(block, units)}</div>;
        })}
      </div>
      <footer className="sc-report-page__foot">Page {n + 1} of {pages.length}</footer>
    </div>
  ));
}
