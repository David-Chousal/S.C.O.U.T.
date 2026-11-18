"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { paginate, type Gaps, type MeasuredBlock, type MeasuredUnit, type Page } from "@/lib/report/paginate";

/** The gaps the page CSS puts between blocks and between a block's units (report-builder.css). */
export const PAGE_GAPS: Gaps = { block: 24, unit: 16 };

export interface FlowItem { id: string; pageBreak: boolean; hidden: boolean }

const height = (el: Element) => el.getBoundingClientRect().height;

/** A unit's height, and for a table its header and row heights so it can split by rows. */
function measureUnit(el: HTMLElement): MeasuredUnit {
  const total = height(el);
  const rows = [...el.querySelectorAll("tbody tr")].map(height);
  if (rows.length < 2) return { height: total };
  return { height: total, split: { head: total - rows.reduce((a, b) => a + b, 0), rows } };
}

function measure(column: HTMLElement, items: FlowItem[]): MeasuredBlock[] {
  const blocks = new Map([...column.querySelectorAll<HTMLElement>("[data-m-block]")].map((el) => [el.dataset.mBlock, el]));
  return items.map((item) => ({
    id: item.id,
    pageBreak: item.pageBreak,
    units: [...(blocks.get(item.id)?.children ?? [])].filter((el): el is HTMLElement => el instanceof HTMLElement && "mUnit" in el.dataset).map(measureUnit),
  }));
}

const same = (a: MeasuredBlock[], b: MeasuredBlock[]) => JSON.stringify(a) === JSON.stringify(b);

/** Measures every block in a hidden column at the page's content width, then flows them onto
 * pages: all blocks for the editing view, and without hidden ones for Print and the PDF.
 * Re-measures whenever `content` (what the column draws) or the block list changes, and once the
 * fonts load; it only sets state when a height changed. */
export function usePagination(items: FlowItem[], contentHeight: number, pageKey: string, content: unknown) {
  const column = useRef<HTMLDivElement>(null);
  const itemsKey = items.map((i) => `${i.id}:${i.pageBreak}`).join("|");
  const [measured, setMeasured] = useState<MeasuredBlock[]>([]);

  useLayoutEffect(() => {
    const el = column.current;
    if (!el) return;
    const next = measure(el, items);
    setMeasured((now) => (same(now, next) ? now : next));
    // `items` is rebuilt every render; its ids and order are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, itemsKey, pageKey]);

  useLayoutEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => {
      const el = column.current;
      if (live && el) setMeasured(measure(el, items));
    });
    return () => { live = false; };
    // Once, when the fonts land; later renders are covered by the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const known = new Map(measured.map((m) => [m.id, m]));
  const flow = (keep: (item: FlowItem) => boolean): Page[] =>
    paginate(items.filter(keep).map((item) => known.get(item.id) ?? { id: item.id, pageBreak: item.pageBreak, units: [] }), contentHeight, PAGE_GAPS);

  return { column, editPages: flow(() => true), printPages: flow((item) => !item.hidden) };
}
