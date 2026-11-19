"use client";

import { useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { cssPageSize } from "@/lib/report/page";
import type { Page } from "@/lib/report/paginate";
import { ReportPages, type PageContent } from "./report-pages";

interface PrintRootProps { content: PageContent; pages: Page[]; onDone: () => void }

/** The print copy of the preview: the same pages without hidden blocks or any edit chrome, put
 * straight under <body> so the print stylesheet can hide the rest of the console. Mounted only
 * while printing; asks the browser to print once it has rendered, and unmounts afterwards. */
export function PrintRoot({ content, pages, onDone }: PrintRootProps) {
  useLayoutEffect(() => {
    document.documentElement.classList.add("is-printing-report");
    return () => document.documentElement.classList.remove("is-printing-report");
  }, []);
  useEffect(() => {
    window.addEventListener("afterprint", onDone, { once: true });
    const timer = window.setTimeout(() => window.print(), 50);
    return () => { window.clearTimeout(timer); window.removeEventListener("afterprint", onDone); };
  }, [onDone]);
  return createPortal(
    <div className="sc-report-print-root">
      <style>{`@page { size: ${cssPageSize(content.doc.page)}; margin: 0; }`}</style>
      <ReportPages content={content} pages={pages} />
    </div>,
    document.body,
  );
}
