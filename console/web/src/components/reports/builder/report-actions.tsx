"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { ReportDocument } from "@/lib/report/document";
import type { Page } from "@/lib/report/paginate";
import { resolveRange } from "@/lib/report/variables";
import { PrintRoot } from "./print-root";
import type { PageContent } from "./report-pages";

interface ReportActionsProps {
  content: PageContent;
  printPages: Page[];
  /** Variables the Worker allows (REPORT_COLUMNS). */
  columns: string[];
  canDownload: boolean;
  loading: boolean;
  onCreated: (link: string) => void;
}

/** Every variable any visible block shows, in the Worker's order: what the CSV holds. */
export const csvColumns = (doc: ReportDocument, columns: string[]) =>
  columns.filter((c) => doc.blocks.some((b) => !b.hidden && "variables" in b.options && b.options.variables.includes(c)));

const reason = (failure: unknown, fallback: string) => (failure instanceof Error ? failure.message : fallback);

/** CSV (stored in R2, members and admins), Print and Download PDF (everyone). */
export function ReportActions({ content, printPages, columns, canDownload, loading, onCreated }: ReportActionsProps) {
  const { show } = useToast();
  const { doc, ctx } = content;
  const [busy, setBusy] = useState<"csv" | "pdf" | "print" | null>(null);
  const range = resolveRange(doc.variables.range, ctx.now, doc.variables.zone);
  const csv = csvColumns(doc, columns);
  const noBuoys = doc.variables.buoys.length === 0;
  // Print and PDF draw whatever visible blocks there are, including ones with their own buoys.
  const nothing = doc.blocks.every((b) => b.hidden);
  const donePrinting = useCallback(() => setBusy(null), []);

  async function run(kind: "csv" | "pdf", work: () => Promise<void>, failTitle: string, fallback: string) {
    setBusy(kind);
    try {
      await work();
    } catch (failure) {
      show({ tone: "failed", title: failTitle, detail: reason(failure, fallback) });
    } finally {
      setBusy(null);
    }
  }
  const downloadCsv = () => run("csv", async () => {
    const made = await api.createReport({ buoys: doc.variables.buoys, from: range.from, to: range.to, columns: csv });
    show({ tone: "ok", title: `Report ready: ${made.rows.toLocaleString("en-US")} readings`, detail: "The download link works for an hour." });
    onCreated(made.link);
  }, "No report", "The console did not answer.");
  const downloadPdfFile = () => run("pdf", async () => {
    // Loaded on the first press only, so the page itself never carries the PDF library.
    const { downloadPdf, pdfFileName } = await import("../pdf/download");
    const fileName = pdfFileName(doc.title, range.from, range.to);
    await downloadPdf(content, printPages, fileName);
    show({ tone: "ok", title: "PDF saved", detail: fileName });
  }, "No PDF", "The PDF could not be made in this browser.");

  return (
    <>
      <Key size="sm" icon="export" disabled={!canDownload || noBuoys || csv.length === 0 || busy !== null} onClick={downloadCsv}>{busy === "csv" ? "Making…" : "CSV"}</Key>
      <Key size="sm" icon="reports" disabled={nothing || loading || busy !== null}
        title={loading ? "Waiting for readings to load" : undefined} onClick={() => setBusy("print")}>Print</Key>
      <Key size="sm" variant="primary" icon="export" disabled={nothing || loading || busy !== null}
        title={loading ? "Waiting for readings to load" : undefined} onClick={downloadPdfFile}>{busy === "pdf" ? "Making PDF…" : "Download PDF"}</Key>
      {busy === "print" && <PrintRoot content={content} pages={printPages} onDone={donePrinting} />}
    </>
  );
}
