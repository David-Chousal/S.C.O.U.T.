import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { ReportBuilder } from "./report-builder";

const download = vi.fn(async () => undefined);
vi.mock("../pdf/download", () => ({ downloadPdf: download, pdfFileName: (title: string, from: string, to: string) => `scout-report-${title}-${from}-${to}.pdf` }));

afterEach(() => vi.clearAllMocks());

describe("Download PDF", () => {
  test("builds the file from the same pages Print uses, then says it was saved", async () => {
    vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [{ timestamp_utc: "2026-10-30T00:00:00Z", record_seq: "1", temp_c: "27" }] });
    render(<Toaster><ReportBuilder buoys={[{ buoy_id: 1, label: "Reef north" } as Buoy]} columns={["temp_c"]} canDownload canEdit
      now={Date.parse("2026-10-31T12:00:00Z")} onCreated={vi.fn()} recent={null} /></Toaster>);
    const button = screen.getByRole("button", { name: "Download PDF" });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    await userEvent.click(button);
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    const [content, pages, name] = download.mock.calls[0] as unknown as [{ doc: { title: string } }, unknown[], string];
    expect(content.doc.title).toBe("Buoy report");
    expect(pages.length).toBeGreaterThan(0);
    expect(name).toBe("scout-report-Buoy report-2026-10-24T12:00:00Z-2026-10-31T12:00:00Z.pdf");
    expect(await screen.findByText("PDF saved")).toBeDefined();
  });
});

test("the PDF library is imported only inside pdf/, and only dynamically from the builder", () => {
  const dir = join(__dirname);
  const sources = readdirSync(dir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts")).filter((f) => !f.endsWith("-test.tsx"));
  for (const file of sources) {
    const text = readFileSync(join(dir, file), "utf8");
    expect(text).not.toMatch(/from\s+["']@react-pdf/);
    expect(text).not.toMatch(/^import[^;]*["']\.\.\/pdf\//m);
  }
  expect(readFileSync(join(dir, "report-actions.tsx"), "utf8")).toMatch(/await import\("\.\.\/pdf\/download"\)/);
});
