"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { ReportDocument } from "@/lib/report/document";
import type { ReportAction } from "@/lib/report/reducer";
import { writeDraft, writeLink, type SavedLayout } from "@/lib/report/saved";

interface SavedReportOptions {
  doc: ReportDocument;
  dispatch: (action: ReportAction) => void;
  /** The saved report the page opened with, if any. */
  startId: string | null;
  layouts: SavedLayout[];
  onLayoutsChanged: () => void;
}

const reason = (failure: unknown) => (failure instanceof Error ? failure.message : "The console did not answer.");

/** Which saved report this is, whether it has unsaved changes, and saving: to the console when
 * someone presses Save, and to a draft in this browser after every change. The page's link
 * follows the report and its variables, so it can be shared. */
export function useSavedReport({ doc, dispatch, startId, layouts, onLayoutsChanged }: SavedReportOptions) {
  const { show } = useToast();
  const [reportId, setReportId] = useState<string | null>(startId);
  const saved = layouts.find((l) => l.id === reportId) ?? null;
  const [baseline, setBaseline] = useState(() => (saved ? JSON.stringify(saved.doc) : ""));
  const dirty = JSON.stringify(doc) !== baseline;

  useEffect(() => {
    writeDraft(dirty ? { reportId, doc } : null);
  }, [doc, dirty, reportId]);
  useEffect(() => {
    window.history.replaceState(null, "", writeLink(reportId, doc.variables));
  }, [reportId, doc.variables]);

  async function save(): Promise<void> {
    if (!saved) return;
    try {
      await api.saveReportLayout(saved.id, { doc });
      setBaseline(JSON.stringify(doc));
      onLayoutsChanged();
      show({ tone: "ok", title: `Saved “${saved.name}”` });
    } catch (failure) {
      show({ tone: "failed", title: "Not saved", detail: reason(failure) });
    }
  }

  async function saveAs(kind: SavedLayout["kind"], name: string, shared: boolean): Promise<boolean> {
    try {
      const { id } = await api.createReportLayout({ kind, name, shared, doc });
      if (kind === "report") {
        setReportId(id);
        setBaseline(JSON.stringify(doc));
      }
      onLayoutsChanged();
      show({ tone: "ok", title: kind === "report" ? `Saved “${name}”` : `Template “${name}” saved`, detail: shared ? "The whole team can open it." : "Only you can open it." });
      return true;
    } catch (failure) {
      show({ tone: "failed", title: "Not saved", detail: reason(failure) });
      return false;
    }
  }

  /** Opens a saved report, or starts over from a layout (reportId null). One undo step either way. */
  function open(next: ReportDocument, id: string | null) {
    dispatch({ type: "replace", document: next });
    setReportId(id);
    setBaseline(id ? JSON.stringify(next) : "");
  }

  return { reportId, saved, dirty, save, saveAs, open };
}
