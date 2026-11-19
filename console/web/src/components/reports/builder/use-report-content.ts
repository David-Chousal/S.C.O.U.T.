"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import type { AlertHistoryItem, HeatStressView } from "@/lib/api/types";
import type { ReportDocument } from "@/lib/report/document";
import { pageBox } from "@/lib/report/page";
import { useReadingsStore } from "@/lib/report/readings-store";
import { buildView, type BlockView, type ViewContext } from "@/lib/report/views";
import type { Remote } from "@/lib/report/views/types";
import type { PageContent } from "./report-pages";
import { usePagination, type FlowItem } from "./use-pagination";

// Fit-width zoom rounds row heights up by a fraction of a pixel each; a little room keeps the last row on the page.
const ZOOM_SLACK_PX = 8;

export type ReportBuoy = ViewContext["fleet"][number];

/** One console read, started only once a block needs it; `retry` runs it again after a failure. */
function useRemote<T>(needed: boolean, read: () => Promise<T>): { state: Remote<T>; retry: () => void } {
  const [state, setState] = useState<Remote<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);
  useEffect(() => {
    if (!needed || started.current === attempt) return;
    started.current = attempt;
    read().then((data) => setState({ status: "ready", data }),
      (failure: unknown) => setState({ status: "failed", error: failure instanceof Error ? failure.message : "The console did not answer." }));
    // `read` is a stable api.* call; it must run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needed, attempt]);
  const retry = () => { setState({ status: "loading" }); setAttempt((n) => n + 1); };
  return { state, retry };
}

/** Everything drawn from the document: fetched data, each block's view model, and the pages. */
export function useReportContent(doc: ReportDocument, now: number, buoys: ReportBuoy[]) {
  const readings = useReadingsStore();
  const heatRead = useRemote<HeatStressView>(doc.blocks.some((b) => b.kind === "heatStress"), api.heatStress);
  const alertsRead = useRemote<AlertHistoryItem[]>(doc.blocks.some((b) => b.kind === "alerts"), async () => (await api.alerts()).history);
  const [heat, alerts] = [heatRead.state, alertsRead.state];
  const contentWidth = pageBox(doc.page).contentWidth;
  const ctx = useMemo<ViewContext>(() => ({
    report: doc.variables, now, readings: readings.get, title: doc.title, contentWidth, fleet: buoys, heat, alerts,
    buoyLabel: (id) => buoys.find((b) => b.buoy_id === id)?.label ?? `Buoy ${id}`,
    // readings.version is not read here: it changes when a fetch lands, so every view rebuilds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [doc.variables, doc.title, contentWidth, now, readings.get, readings.version, buoys, heat, alerts]);
  const views = useMemo(() => new Map(doc.blocks.flatMap((b): [string, BlockView][] => {
    const view = buildView(b, ctx);
    return view ? [[b.id, view]] : [];
  })), [doc.blocks, ctx]);
  const items: FlowItem[] = doc.blocks.map((b) => ({ id: b.id, pageBreak: b.kind === "pageBreak", hidden: b.hidden }));
  const pagination = usePagination(items, pageBox(doc.page).contentHeight - ZOOM_SLACK_PX, `${doc.page.size}${doc.page.orientation}|${doc.title}`, views);
  const content: PageContent = { doc, ctx, views };
  const loading = [...views.values()].some((v) => "sections" in v && v.sections.some((s) => s.status === "loading"));
  const otherFailed = heat.status === "failed" || alerts.status === "failed";
  /** Runs every failed read again: readings, heat stress and alerts. */
  const retry = () => {
    readings.retryFailed();
    if (heat.status === "failed") heatRead.retry();
    if (alerts.status === "failed") alertsRead.retry();
  };
  return { content, readings, loading, failed: readings.failed > 0 || otherFailed, retry, ...pagination };
}
