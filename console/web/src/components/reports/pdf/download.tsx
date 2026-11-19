// Download PDF (SCO-317): built in the browser with @react-pdf/renderer. This module, and the
// library with it, is only ever loaded by a dynamic import() when someone presses the button.
import { pdf } from "@react-pdf/renderer";
import type { Page } from "@/lib/report/paginate";
import type { PageContent } from "../builder/report-pages";
import { Font } from "./primitives";
import { PdfReport } from "./pdf-report";
import { MONO, SANS } from "./styles";

let registered = false;

/** DM Sans and JetBrains Mono (SIL OFL 1.1), static weights cut by scripts/build-report-fonts.py. */
function registerFonts(origin: string) {
  if (registered) return;
  const url = (file: string) => `${origin}/fonts/report/${file}`;
  Font.register({ family: SANS, fonts: [400, 500, 700].map((fontWeight) => ({ src: url(`dmsans-${fontWeight}.ttf`), fontWeight })) });
  Font.register({ family: MONO, fonts: [400, 500].map((fontWeight) => ({ src: url(`jetbrainsmono-${fontWeight}.ttf`), fontWeight })) });
  // Words never hyphenate mid-number in a data report.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "report";

/** scout-report-<title>-<from>-<to>.pdf, from the report's resolved range. */
export function pdfFileName(title: string, from: string, to: string): string {
  return `scout-report-${slug(title)}-${from.slice(0, 10)}-${to.slice(0, 10)}.pdf`;
}

/** Builds the PDF for these pages and saves it, with no dialog. */
export async function downloadPdf(content: PageContent, pages: Page[], fileName: string): Promise<void> {
  registerFonts(window.location.origin);
  const blob = await pdf(<PdfReport content={content} pages={pages} />).toBlob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
}
