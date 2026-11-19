import type { Page as ReportPage } from "@/lib/report/paginate";
import { pageBox, PT_PER_PX } from "@/lib/report/page";
import { rangeLabel, resolveRange, zoneLabel } from "@/lib/report/variables";
import type { PageContent } from "../builder/report-pages";
import { HEADER_ID } from "../builder/report-pages";
import { Document, Page, Text, View } from "./primitives";
import { PdfBlockUnit } from "./pdf-units";
import { S } from "./styles";

function PdfHead({ content }: { content: PageContent }) {
  const { doc, ctx } = content;
  const range = resolveRange(doc.variables.range, ctx.now, doc.variables.zone);
  return (
    <View style={S.head}>
      <View><Text style={S.wordmark}>S.C.O.U.T.</Text><Text style={S.h1}>{doc.title}</Text></View>
      <Text style={S.headNote}>{rangeLabel(range, doc.variables.zone)} ({zoneLabel(doc.variables.zone)})</Text>
    </View>
  );
}

/** Consecutive fragments of one block, kept together so they sit 16 px apart as on screen. */
function byBlock(page: ReportPage): ReportPage[] {
  return page.reduce<ReportPage[]>((out, fragment) => {
    const last = out.at(-1);
    return last && last[0].blockId === fragment.blockId ? [...out.slice(0, -1), [...last, fragment]] : [...out, [fragment]];
  }, []);
}

/** One PDF page: the same fragments, in the same order and groups, as the preview's page. */
export function PdfPageBody({ content, page }: { content: PageContent; page: ReportPage }) {
  return (
    <View style={S.body}>
      {byBlock(page).map((group, i) => {
        if (group[0].blockId === HEADER_ID) return <PdfHead key={i} content={content} />;
        const view = content.views.get(group[0].blockId);
        if (!view) return null;
        return (
          <View key={i} style={S.block}>
            {group.map((f, j) => <PdfBlockUnit key={j} view={view} unit={f.unit} rows={f.rows} />)}
          </View>
        );
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
          <Text style={S.foot} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </Page>
      ))}
    </Document>
  );
}
