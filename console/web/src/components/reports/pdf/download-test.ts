import { expect, test, vi } from "vitest";

vi.mock("@react-pdf/renderer", () => ({ pdf: vi.fn() }));
vi.mock("./primitives", () => ({ Font: { register: vi.fn(), registerHyphenationCallback: vi.fn() } }));

test("the file is named after the title and the range's days", async () => {
  const { pdfFileName } = await import("./download");
  expect(pdfFileName("Weekly field summary!", "2026-11-11T12:00:00Z", "2026-11-18T12:00:00Z")).toBe("scout-report-weekly-field-summary-2026-11-11-2026-11-18.pdf");
  expect(pdfFileName("   ", "2026-11-11T12:00:00Z", "2026-11-18T12:00:00Z")).toBe("scout-report-report-2026-11-11-2026-11-18.pdf");
});
