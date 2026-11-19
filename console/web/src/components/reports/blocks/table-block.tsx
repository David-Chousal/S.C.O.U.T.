import type { ReactNode } from "react";
import type { BuoySection, TableBlockView, TableView } from "@/lib/report/views/types";

type RowSlice = [number, number] | undefined;

/** A view-model table on paper; `rows` draws only that slice, under the same header. */
export function ReportTable({ table, rows }: { table: TableView; rows?: RowSlice }) {
  const shown = rows ? table.rows.slice(rows[0], rows[1]) : table.rows;
  const total = table.widths.reduce((a, b) => a + b, 0) || 1;
  return (
    <table className="sc-rb-table">
      <colgroup>{table.widths.map((w, i) => <col key={i} style={{ width: `${(100 * w) / total}%` }} />)}</colgroup>
      <thead><tr>{table.headers.map((h, i) => <th key={i} scope="col" className={table.numeric[i] ? "n" : undefined}>{h}</th>)}</tr></thead>
      <tbody>
        {shown.map((row, r) => (
          <tr key={r}>{row.map((cell, i) => <td key={i} className={table.numeric[i] ? "n" : undefined}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

/** A buoy's heading, its note, then its body or the reason it has none. A continued slice says so. */
export function Section<T>({ section, continued, children }: { section: BuoySection<T>; continued?: boolean; children: (body: T) => ReactNode }) {
  return (
    <section className="sc-rb-section" aria-busy={section.status === "loading" || undefined}>
      <h3>{section.heading}{continued ? " (continued)" : ""}{section.note && <small>{section.note}</small>}</h3>
      {section.body ? children(section.body) : <p className={`sc-rb-muted${section.status === "loading" ? " sc-rb-skeleton" : ""}`}>{section.message}</p>}
    </section>
  );
}

/** Units: one per buoy's table, then the footnote when there is one. */
export const tableUnits = (view: TableBlockView) => view.sections.length + (view.footnote ? 1 : 0);

export function TableUnit({ view, unit, rows }: { view: TableBlockView; unit: number; rows?: RowSlice }) {
  const section = view.sections[unit];
  if (!section) return <p className="sc-rb-foot">{view.footnote}</p>;
  return <Section section={section} continued={Boolean(rows && rows[0] > 0)}>{(table) => <ReportTable table={table} rows={rows} />}</Section>;
}
