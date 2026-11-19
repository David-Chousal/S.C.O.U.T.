// View models: what each block shows, as plain strings and numbers. The screen renderer and the
// PDF renderer both draw from these, so numbers, labels and order cannot drift between them.

import type { AlertHistoryItem, Buoy, HeatStressView, Reading } from "@/lib/api/types";
import type { ChartGeometry } from "../chart";
import type { TextStyle } from "../document";
import type { ReadingsEntry } from "../readings-store";
import type { ResolvedRange, ReportVariables } from "../variables";

/** A console read the report needs besides readings: still loading, failed, or here. */
export type Remote<T> = { status: "loading" } | { status: "failed"; error: string } | { status: "ready"; data: T };

export interface ViewContext {
  report: ReportVariables;
  /** The report's title, for {title}. */
  title: string;
  /** The page's content width in CSS pixels: charts are drawn to fit it. */
  contentWidth: number;
  /** The page's content height in CSS pixels, when known: an image is fitted inside it. */
  contentHeight?: number;
  fleet: Pick<Buoy, "buoy_id" | "label" | "last_seen_at" | "settings_state" | "mmm_c">[];
  heat: Remote<HeatStressView>;
  /** Alerts sent to the person viewing (the console keeps 90 days). */
  alerts: Remote<AlertHistoryItem[]>;
  /** When the page opened, ms. Presets count back from it. */
  now: number;
  buoyLabel: (id: number) => string;
  readings: (buoy: number, range: ResolvedRange) => ReadingsEntry;
}

export interface TableView {
  headers: string[];
  /** Per column: right-aligned numbers. */
  numeric: boolean[];
  /** Per column: relative width. Screen and PDF both lay columns out by these, so rows wrap alike. */
  widths: number[];
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

export interface TableBlockView { kind: "summaryTable" | "readingsTable" | "buoyHealth" | "alerts"; sections: BuoySection<TableView>[]; footnote: string }

export interface TitleView { kind: "title"; title: string; subtitle: string; lines: string[] }
export interface TextView { kind: "text"; style: TextStyle; paragraphs: string[] }
export interface Tile { label: string; value: string; unit: string; caption: string }
export interface KeyFiguresView { kind: "keyFigures"; sections: BuoySection<Tile[]>[] }
export interface ChartsView { kind: "timeSeries"; sections: BuoySection<ChartGeometry>[]; footnote: string }
export interface HeatSection { facts: TableView; chart: ChartGeometry | null }
export interface HeatStressBlockView { kind: "heatStress"; sections: BuoySection<HeatSection>[]; footnote: string }
export interface MarkerView { kind: "pageBreak" | "divider" }
/** `src` null: no image chosen yet; `message` says so on screen and in the PDF. */
export interface ImageView { kind: "image"; src: string | null; alt: string; caption: string; width: number; height: number; message: string }

export type BlockView = TableBlockView | TitleView | TextView | KeyFiguresView | ChartsView | HeatStressBlockView | MarkerView | ImageView;

export type Rows = Reading[];
