import type { Page as ReportPage } from "@/lib/report/paginate";
import { pageBox, PT_PER_PX } from "@/lib/report/page";
import type { PageContent } from "../builder/report-pages";
import { Document, Page, Text, View } from "./primitives";
import { PdfBlockUnit } from "./pdf-units";
import { S } from "./styles";

/** One PDF page: the same fragments, in the same order, as the preview's page. */
export function PdfPageBody({ content, page }: { content: PageContent; page: ReportPage }) {
  return (
    <View style={S.body}>
      {page.map((fragment, i) => {
        const view = content.views.get(fragment.blockId);
        return view ? <PdfBlockUnit key={i} view={view} unit={fragment.unit} rows={fragment.rows} /> : null;
      })}
    </View>
  );
}

/** The whole report as a react-pdf document, page for page with Print. */
export function PdfReport({ content, pages }: { content: PageContent; pages: ReportPage[] }) {
  const box = pageBox(content.doc.page);
  const size = { width: box.width * PT_PER_PX, height: box.height * PT_PER_PX };
  return (
    <Document title={content.doc.title} author="S.C.O.U.T. Console" creator="S.C.O.U.T. Console" producer="S.C.O.U.T. Console">
      {pages.map((page, n) => (
        <Page key={n} size={size} style={S.page}>
          <PdfPageBody content={content} page={page} />
          <Text style={S.foot} fixed>Page {n + 1} of {pages.length}</Text>
        </Page>
      ))}
    </Document>
  );
}
