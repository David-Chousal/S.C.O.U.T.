"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { ReportDocument } from "@/lib/report/document";
import { writeDraft, writeLink, type SavedLayout, type Start } from "@/lib/report/saved";

interface SavedReportOptions {
  doc: ReportDocument;
  /** Replaces the document with a fresh undo history (opening a saved report). */
  reset: (doc: ReportDocument) => void;
  /** Replaces the document as one undoable step (starting from a template). */
  replace: (doc: ReportDocument) => void;
  /** What the page opened with: the document, its saved report id, and where it came from. */
  start: Pick<Start, "doc" | "reportId" | "source">;
  layouts: SavedLayout[];
  onLayoutsChanged: () => void;
  /** Whose draft this is: drafts are kept per account. */
  userId: string;
}

const reason = (failure: unknown) => (failure instanceof Error ? failure.message : "The console did not answer.");

/** Which saved report this is, whether it has unsaved changes, and saving: to the console when
 * someone presses Save, and to a draft in this browser after an edit. The page's link follows the
 * report and its variables, so it can be shared. A save that finishes after another report was
 * opened changes nothing, so it can never point one report's Save at another's document. */
export function useSavedReport({ doc, reset, replace, start, layouts, onLayoutsChanged, userId }: SavedReportOptions) {
  const { show } = useToast();
  const [reportId, setReportId] = useState<string | null>(start.reportId);
  // A restored draft is unsaved work by definition; anything else starts clean.
  const [baseline, setBaseline] = useState(() => (start.source === "draft" ? "" : JSON.stringify(start.doc)));
  const [saving, setSaving] = useState(false);
  const generation = useRef(0);
  const saved = layouts.find((l) => l.id === reportId) ?? null;
  const dirty = JSON.stringify(doc) !== baseline;

  useEffect(() => {
    writeDraft(userId, dirty ? { reportId, doc } : null);
  }, [doc, dirty, reportId, userId]);
  useEffect(() => {
    window.history.replaceState(null, "", writeLink(reportId, doc.variables));
  }, [reportId, doc.variables]);

  async function save(): Promise<void> {
    if (!saved || saving) return;
    const [mine, sent] = [generation.current, JSON.stringify(doc)];
    setSaving(true);
    try {
      await api.saveReportLayout(saved.id, { doc });
      if (mine !== generation.current) return;
      setBaseline(sent);
      onLayoutsChanged();
      show({ tone: "ok", title: `Saved “${saved.name}”` });
    } catch (failure) {
      show({ tone: "failed", title: "Not saved", detail: reason(failure) });
    } finally {
      setSaving(false);
    }
  }

  async function saveAs(kind: SavedLayout["kind"], name: string, shared: boolean): Promise<boolean> {
    const [mine, sent] = [generation.current, JSON.stringify(doc)];
    try {
      const { id } = await api.createReportLayout({ kind, name, shared, doc });
      onLayoutsChanged();
      if (kind === "report" && mine === generation.current) {
        setReportId(id);
        setBaseline(sent);
      }
      show({ tone: "ok", title: kind === "report" ? `Saved “${name}”` : `Template “${name}” saved`, detail: shared ? "The whole team can open it." : "Only you can open it." });
      return true;
    } catch (failure) {
      show({ tone: "failed", title: "Not saved", detail: reason(failure) });
      return false;
    }
  }

  /** Opens a saved report (a fresh undo history), or starts from a template (undoable, unsaved). */
  function open(next: ReportDocument, id: string | null) {
    generation.current += 1;
    if (id) reset(next);
    else replace(next);
    setReportId(id);
    setBaseline(id ? JSON.stringify(next) : "");
  }

  return { reportId, saved, dirty, saving, save, saveAs, open };
}
