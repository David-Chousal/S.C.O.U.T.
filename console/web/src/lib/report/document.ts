// The report document: everything a report is, as plain JSON. The preview, Print and the PDF
// are pure functions of it plus fetched data (docs/engineering/console-report-builder-plan.md).

import { DEFAULT_PAGE, type PageSetup } from "./page";
import type { BlockOverride, ReportVariables } from "./variables";

export type Stat = "latest" | "min" | "mean" | "max";
export type Sampling = "all" | "hourly" | "daily";
export type TextStyle = "body" | "heading" | "subheading" | "callout";
export type ImageWidth = "small" | "medium" | "full";
type NoOptions = Record<string, never>;

export interface BlockOptions {
  title: { subtitle: string };
  text: { text: string; style: TextStyle };
  keyFigures: { variables: string[]; stat: Stat };
  timeSeries: { variables: string[]; perBuoy: boolean; thresholds: boolean };
  summaryTable: { variables: string[] };
  readingsTable: { variables: string[]; sampling: Sampling; rowCap: number };
  heatStress: { charts: boolean };
  buoyHealth: NoOptions;
  alerts: { includeTests: boolean };
  /** `ratio` is height ÷ width, read at upload, so the page can lay the image out before it loads. */
  image: { assetId: string | null; alt: string; caption: string; width: ImageWidth; ratio: number };
  pageBreak: NoOptions;
  divider: NoOptions;
}
export type BlockKind = keyof BlockOptions;

interface BlockOf<K extends BlockKind> {
  id: string;
  kind: K;
  /** Kept in the layout but left out of Print and the PDF. */
  hidden: boolean;
  override: BlockOverride;
  options: BlockOptions[K];
}
export type Block = { [K in BlockKind]: BlockOf<K> }[BlockKind];
export type BlockOfKind<K extends BlockKind> = Extract<Block, { kind: K }>;

export interface ReportDocument {
  version: 1;
  title: string;
  page: PageSetup;
  variables: ReportVariables;
  blocks: Block[];
}

export const DOCUMENT_VERSION = 1;
export const MAX_BLOCKS = 60;
export const MAX_ROW_CAP = 2000;
export const DEFAULT_VARIABLES = ["temp_c", "turbidity_fau", "battery_v"];

/** What each block is called, what it is for, and whether it reads buoy data (so can override the variables). */
export const BLOCK_INFO: Record<BlockKind, { label: string; description: string; data: boolean }> = {
  title: { label: "Title", description: "Report name, buoys, period and when it was made", data: false },
  text: { label: "Text", description: "A heading, paragraph or callout, with fields like {buoys}", data: false },
  keyFigures: { label: "Key figures", description: "A row of numbers: latest, min, mean or max", data: true },
  timeSeries: { label: "Time series", description: "Variables over the range, per buoy", data: true },
  summaryTable: { label: "Summary table", description: "Readings, min, mean and max per variable", data: true },
  readingsTable: { label: "Readings table", description: "Every reading, or one an hour or a day", data: true },
  heatStress: { label: "Heat stress", description: "MMM, hot spot and degree heating weeks", data: true },
  buoyHealth: { label: "Buoy health", description: "Battery, housing humidity, last heard, settings", data: true },
  alerts: { label: "Alerts in range", description: "Alerts that fired in the period", data: true },
  image: { label: "Image", description: "A logo or photo", data: false },
  pageBreak: { label: "Page break", description: "Start the next block on a new page", data: false },
  divider: { label: "Divider", description: "A thin rule between sections", data: false },
};

const DEFAULT_OPTIONS: { [K in BlockKind]: () => BlockOptions[K] } = {
  title: () => ({ subtitle: "" }),
  text: () => ({ text: "Notes", style: "body" }),
  keyFigures: () => ({ variables: ["temp_c", "battery_v"], stat: "latest" }),
  timeSeries: () => ({ variables: ["temp_c"], perBuoy: false, thresholds: true }),
  summaryTable: () => ({ variables: [...DEFAULT_VARIABLES] }),
  readingsTable: () => ({ variables: [...DEFAULT_VARIABLES], sampling: "all", rowCap: 200 }),
  heatStress: () => ({ charts: true }),
  buoyHealth: () => ({}),
  alerts: () => ({ includeTests: false }),
  image: () => ({ assetId: null, alt: "", caption: "", width: "medium", ratio: 0.5 }),
  pageBreak: () => ({}),
  divider: () => ({}),
};

let counter = 0;
/** A short id, unique within a document. */
export const newBlockId = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

export function createBlock<K extends BlockKind>(kind: K, id: string = newBlockId()): BlockOfKind<K> {
  const block: BlockOf<K> = { id, kind, hidden: false, override: {}, options: DEFAULT_OPTIONS[kind]() };
  // BlockOf<K> and the union member for K are the same shape; TypeScript cannot see that for a generic K.
  return block as unknown as BlockOfKind<K>;
}

export function createDocument(variables: ReportVariables, blocks: Block[] = [], title = "Buoy report"): ReportDocument {
  return { version: DOCUMENT_VERSION, title, page: DEFAULT_PAGE, variables, blocks };
}
