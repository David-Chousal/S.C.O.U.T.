// View models: what each block shows, as plain strings and numbers. The screen renderer and the
// PDF renderer both draw from these, so numbers, labels and order cannot drift between them.

import type { Reading } from "@/lib/api/types";
import type { ReadingsEntry } from "../readings-store";
import type { ResolvedRange, ReportVariables } from "../variables";

export interface ViewContext {
  report: ReportVariables;
  /** When the page opened, ms. Presets count back from it. */
  now: number;
  buoyLabel: (id: number) => string;
  readings: (buoy: number, range: ResolvedRange) => ReadingsEntry;
}

export interface TableView {
  headers: string[];
  /** Per column: right-aligned numbers. */
  numeric: boolean[];
  rows: string[][];
}

export type SectionStatus = "loading" | "failed" | "empty" | "ready";

/** One buoy's part of a block. `message` explains a section that is not ready. */
export interface BuoySection<T> {
  heading: string;
  note: string;
  status: SectionStatus;
  message: string;
  body: T | null;
}

export interface TableBlockView { kind: "summaryTable" | "readingsTable"; sections: BuoySection<TableView>[]; footnote: string }

export type BlockView = TableBlockView;

export type Rows = Reading[];
