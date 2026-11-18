import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import type { Reading } from "@/lib/api/types";
import type { ReportDocument } from "@/lib/report/document";
import type { ReadingsEntry } from "@/lib/report/readings-store";
import { buildView, type BlockView, type ViewContext } from "@/lib/report/views";
import { BlockUnit, unitCount } from "../blocks/block-units";
import { PdfBlockUnit } from "./pdf-units";
import { SAMPLE_DOCUMENTS } from "./sample-documents";

// react-pdf's primitives stood in by plain elements: the test compares the text each renderer
// writes, which is what a reader of the PDF sees.
vi.mock("./primitives", () => {
  const box = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const text = ({ children }: { children?: ReactNode }) => <span>{children}</span>;
  return { Document: box, Page: box, View: box, Text: text, Svg: box, G: box, Line: box, Path: box, Rect: box, Circle: box, Image: box, Font: { register: vi.fn() } };
});

const row = (i: number): Reading => ({
  timestamp_utc: new Date(Date.parse("2026-11-10T00:00:00Z") + i * 3 * 3600_000).toISOString().slice(0, 19) + "Z",
  record_seq: String(i), temp_c: (26 + (i % 7) * 0.3).toFixed(2), turbidity_fau: String(i % 5), battery_v: (3.9 - i * 0.002).toFixed(3),
});
const ENTRIES: Record<number, ReadingsEntry> = {
  1: { status: "ready", rows: Array.from({ length: 60 }, (_, i) => row(i)), truncated: false },
  2: { status: "ready", rows: Array.from({ length: 12 }, (_, i) => row(i)), truncated: true },
  3: { status: "failed", error: "The console did not answer." },
  4: { status: "ready", rows: [], truncated: false },
};
const ctx = (doc: ReportDocument): ViewContext => ({
  report: doc.variables, now: Date.parse("2026-11-18T12:00:00Z"),
  buoyLabel: (id) => `Buoy ${id}`, readings: (id) => ENTRIES[id] ?? { status: "loading" },
});

const textOf = (node: ReactNode) => {
  const { container, unmount } = render(<>{node}</>);
  const text = (container.textContent ?? "").replace(/\s+/g, "");
  unmount();
  return text;
};

/** Every unit, and for tables also a split slice, so continued pages are compared too. */
function pieces(view: BlockView): { unit: number; rows?: [number, number] }[] {
  return Array.from({ length: unitCount(view) }, (_, unit) => [{ unit }, { unit, rows: [3, 9] as [number, number] }]).flat();
}

describe.each(SAMPLE_DOCUMENTS.map((d) => [d.title, d] as const))("%s: screen and PDF write the same text", (_, doc) => {
  test.each(doc.blocks.map((b) => [b.kind, b] as const))("%s block", (_kind, block) => {
    const view = buildView(block, ctx(doc));
    expect(view).not.toBeNull();
    if (!view) return;
    for (const piece of pieces(view)) {
      const screen = textOf(<BlockUnit view={view} {...piece} />);
      expect(screen.length).toBeGreaterThan(0);
      expect(textOf(<PdfBlockUnit view={view} {...piece} />)).toBe(screen);
    }
  });
});
