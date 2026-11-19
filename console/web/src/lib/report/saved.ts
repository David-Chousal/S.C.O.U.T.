// Saved reports and templates (worker/report-layouts.js), and how the builder decides what to
// open: a report named in the URL, else a draft kept in this browser, else the team's default
// template, else the plain starting report.

import { createBlock, createDocument, type ReportDocument } from "./document";
import { fromTemplate } from "./templates";
import { isValidCustom, type RangePreset, type ReportVariables, type ZoneChoice } from "./variables";

export interface SavedLayout {
  id: string;
  kind: "report" | "template";
  name: string;
  shared: boolean;
  mine: boolean;
  is_default: boolean;
  author: string | null;
  updated_at: number;
  doc: ReportDocument;
}

export interface Draft { reportId: string | null; doc: ReportDocument }
export interface Start { doc: ReportDocument; reportId: string | null; source: "saved" | "draft" | "template" | "new" }

const DAY = 24 * 3600 * 1000;
const PRESETS: RangePreset[] = ["24h", "7d", "30d", "custom"];

export function plainStart(buoys: number[], now: number): ReportDocument {
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const variables: ReportVariables = { buoys, range: { preset: "7d", from: day(now - 7 * DAY), to: day(now) }, zone: "utc" };
  return createDocument(variables, [createBlock("title", "title"), createBlock("summaryTable", "summary"), createBlock("readingsTable", "readings")]);
}

/** The report id and any variables a link carries: ?report=…&buoys=1,2&range=7d|custom:from:to&zone=utc. */
export function readLink(search: string, known: number[]): { reportId: string | null; variables: Partial<ReportVariables> } {
  const params = new URLSearchParams(search);
  const variables: Partial<ReportVariables> = {};
  const buoys = params.get("buoys")?.split(",").map(Number).filter((b) => known.includes(b));
  if (buoys?.length) variables.buoys = buoys;
  const [preset, from = "", to = ""] = (params.get("range") ?? "").split(":");
  const range = { preset: preset as RangePreset, from, to };
  // A custom range from a link must be real days in order; otherwise the link's range is ignored.
  if (PRESETS.includes(range.preset) && (range.preset !== "custom" || isValidCustom(range))) variables.range = range;
  const zone = params.get("zone");
  if (zone === "utc" || zone === "local") variables.zone = zone as ZoneChoice;
  return { reportId: params.get("report"), variables };
}

/** The link for this report and its variables, so it opens the same report for the same period. */
export function writeLink(reportId: string | null, v: ReportVariables): string {
  const params = new URLSearchParams();
  if (reportId) params.set("report", reportId);
  params.set("buoys", v.buoys.join(","));
  params.set("range", v.range.preset === "custom" ? `custom:${v.range.from}:${v.range.to}` : v.range.preset);
  params.set("zone", v.zone);
  return `?${params.toString().replaceAll("%2C", ",").replaceAll("%3A", ":")}`;
}

export function chooseStart(input: { search: string; draft: Draft | null; layouts: SavedLayout[]; buoys: number[]; now: number }): Start {
  const { reportId, variables } = readLink(input.search, input.buoys);
  const plain = plainStart(input.buoys, input.now);
  const saved = reportId ? input.layouts.find((l) => l.id === reportId && l.kind === "report") : undefined;
  if (saved) return { doc: { ...saved.doc, variables: { ...saved.doc.variables, ...variables } }, reportId: saved.id, source: "saved" };
  if (input.draft) return { doc: { ...input.draft.doc, variables: { ...input.draft.doc.variables, ...variables } }, reportId: input.draft.reportId, source: "draft" };
  const team = input.layouts.find((l) => l.kind === "template" && l.is_default);
  const start = { ...plain.variables, ...variables };
  if (team) return { doc: fromTemplate(team.doc, start), reportId: null, source: "template" };
  return { doc: { ...plain, variables: start }, reportId: null, source: "new" };
}

/** One draft per account, so a shared browser never shows one person's unsaved report to another. */
const draftKey = (userId: string) => `scout-report-draft:${userId}`;

/** The draft kept in this browser while editing. Storage can be missing or blocked; then there is none. */
export function readDraft(userId: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(userId));
    const draft = raw ? (JSON.parse(raw) as Draft) : null;
    return draft?.doc?.version === 1 ? draft : null;
  } catch {
    return null;
  }
}

export function writeDraft(userId: string, draft: Draft | null): void {
  try {
    if (draft) window.localStorage.setItem(draftKey(userId), JSON.stringify(draft));
    else window.localStorage.removeItem(draftKey(userId));
  } catch {
    // Private windows and blocked storage simply keep no draft; saving to the console still works.
  }
}
