import type { ReactNode } from "react";
import type { BuoySection, TableBlockView, TableView } from "@/lib/report/views/types";

/** A view-model table on paper. */
export function ReportTable({ table }: { table: TableView }) {
  return (
    <table className="sc-rb-table">
      <thead><tr>{table.headers.map((h, i) => <th key={i} scope="col" className={table.numeric[i] ? "n" : undefined}>{h}</th>)}</tr></thead>
      <tbody>
        {table.rows.map((row, r) => (
          <tr key={r}>{row.map((cell, i) => <td key={i} className={table.numeric[i] ? "n" : undefined}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

/** A buoy's heading, its note, then its body or the reason it has none. */
export function Section<T>({ section, children }: { section: BuoySection<T>; children: (body: T) => ReactNode }) {
  return (
    <section className="sc-rb-section" aria-busy={section.status === "loading" || undefined}>
      <h3>{section.heading}{section.note && <small>{section.note}</small>}</h3>
      {section.body ? children(section.body) : <p className={`sc-rb-muted${section.status === "loading" ? " sc-rb-skeleton" : ""}`}>{section.message}</p>}
    </section>
  );
}

/** Summary table and Readings table: one table per buoy, then a footnote. */
export function TableBlock({ view }: { view: TableBlockView }) {
  return (
    <div className="sc-rb-stack">
      {view.sections.map((section, i) => <Section key={i} section={section}>{(table) => <ReportTable table={table} />}</Section>)}
      {view.footnote && <p className="sc-rb-foot">{view.footnote}</p>}
    </div>
  );
}
