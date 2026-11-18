"use client";

import { useCallback, useEffect, useReducer } from "react";
import type { ReportDocument } from "@/lib/report/document";
import { historyReducer, initialHistory, type ReportAction } from "@/lib/report/reducer";

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** The report document with undo and redo: ⌘Z / Ctrl+Z and ⇧⌘Z / Ctrl+Y, except while typing in a field. */
export function useReportEditor(initial: () => ReportDocument) {
  const [history, send] = useReducer(historyReducer, undefined, () => initialHistory(initial()));
  const dispatch = useCallback((action: ReportAction) => send(action), []);
  const undo = useCallback(() => send({ type: "undo" }), []);
  const redo = useCallback(() => send({ type: "redo" }), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || typing(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) { event.preventDefault(); undo(); }
      if ((key === "z" && event.shiftKey) || key === "y") { event.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return { doc: history.present, dispatch, undo, redo, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}
