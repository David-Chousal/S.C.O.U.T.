import type { BuoySection, TableBlockView, TableView } from "@/lib/report/views/types";
import { Text, View } from "./primitives";
import { S } from "./styles";

type RowSlice = [number, number] | undefined;

/** The same table as the screen's ReportTable: header, then rows, by the view's column widths. */
export function PdfTable({ table, rows }: { table: TableView; rows?: RowSlice }) {
  const shown = rows ? table.rows.slice(rows[0], rows[1]) : table.rows;
  const cell = (i: number) => ({ flex: table.widths[i], textAlign: table.numeric[i] ? ("right" as const) : ("left" as const) });
  return (
    <View>
      <View style={S.tableHead}>
        {table.headers.map((h, i) => <Text key={i} style={[S.th, cell(i)]}>{h}</Text>)}
      </View>
      {shown.map((row, r) => (
        <View key={r} style={S.tr} wrap={false}>
          {row.map((value, i) => <Text key={i} style={[S.td, cell(i)]}>{value}</Text>)}
        </View>
      ))}
    </View>
  );
}

function PdfSection({ section, continued, rows }: { section: BuoySection<TableView>; continued: boolean; rows?: RowSlice }) {
  return (
    <View style={S.section}>
      <View style={S.h3}>
        <Text>{section.heading}{continued ? " (continued)" : ""}</Text>
        {section.note ? <Text style={S.h3Note}>{section.note}</Text> : null}
      </View>
      {section.body ? <PdfTable table={section.body} rows={rows} /> : <Text style={S.muted}>{section.message}</Text>}
    </View>
  );
}

export function PdfTableUnit({ view, unit, rows }: { view: TableBlockView; unit: number; rows?: RowSlice }) {
  const section = view.sections[unit];
  if (!section) return <Text style={S.footnote}>{view.footnote}</Text>;
  return <PdfSection section={section} continued={Boolean(rows && rows[0] > 0)} rows={rows} />;
}
