"use client";

import { useMemo } from "react";
import type { Buoy } from "@/lib/api/types";
import type { ReportDocument } from "@/lib/report/document";
import { pageBox } from "@/lib/report/page";
import { useReadingsStore } from "@/lib/report/readings-store";
import { buildView, type BlockView, type ViewContext } from "@/lib/report/views";
import { HEADER_ID, type PageContent } from "./report-pages";
import { usePagination, type FlowItem } from "./use-pagination";

// Fit-width zoom rounds row heights up by a fraction of a pixel each; a little room keeps the last row on the page.
const ZOOM_SLACK_PX = 8;

/** Everything drawn from the document: fetched data, each block's view model, and the pages. */
export function useReportContent(doc: ReportDocument, now: number, buoys: Pick<Buoy, "buoy_id" | "label">[]) {
  const readings = useReadingsStore();
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
  const pagination = usePagination(items, pageBox(doc.page).contentHeight - ZOOM_SLACK_PX, `${doc.page.size}${doc.page.orientation}`, views);
  const content: PageContent = { doc, ctx, views };
  const loading = [...views.values()].some((v) => "sections" in v && v.sections.some((s) => s.status === "loading"));
  return { content, readings, loading, ...pagination };
}
