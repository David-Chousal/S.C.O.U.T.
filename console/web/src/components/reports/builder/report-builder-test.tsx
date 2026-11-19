import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { ReportBuilder } from "./report-builder";

const buoy = (buoy_id: number, label: string) => ({ buoy_id, label }) as Buoy;
const COLUMNS = ["temp_c", "turbidity_fau", "battery_v", "flags"];
const NOW = Date.parse("2026-10-31T12:00:00Z");

function renderBuilder(canDownload = true, onCreated = vi.fn()) {
  vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [] });
  render(<Toaster><ReportBuilder buoys={[buoy(1, "Reef north"), buoy(2, "Reef south")]} columns={COLUMNS}
    canDownload={canDownload} canEdit={canDownload} now={NOW} onCreated={onCreated} recent={null} /></Toaster>);
  return onCreated;
}

afterEach(() => vi.restoreAllMocks());

describe("ReportBuilder", () => {
  test("starts with every buoy, the last 7 days and the three main variables", async () => {
    renderBuilder();
    expect(screen.getByRole("button", { name: "Reef north" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "7 d" }).getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(screen.getByRole("group", { name: "Summary table block" }));
    expect((screen.getByLabelText(/Water temperature/) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(/^Flags/) as HTMLInputElement).checked).toBe(false);
  });

  test("the preview names the buoys and the range at once, with no Generate step", async () => {
    renderBuilder();
    expect(screen.getByText("2026-10-24 to 2026-10-31 (UTC)")).toBeDefined();
    expect(await screen.findAllByText("No readings in this range.")).toHaveLength(4);
  });

  test("CSV asks for the report's range and hands back the link", async () => {
    const create = vi.spyOn(api, "createReport").mockResolvedValue({ id: "r1", link: "/api/reports/r1/file?t=abc", rows: 12 });
    const onCreated = renderBuilder();
    await userEvent.click(screen.getByRole("button", { name: "Reef south" }));
    await userEvent.click(screen.getByRole("button", { name: /CSV/ }));
    expect(create).toHaveBeenCalledWith({ buoys: [1], from: "2026-10-24T12:00:00Z", to: "2026-10-31T12:00:00Z",
      columns: ["temp_c", "turbidity_fau", "battery_v"] });
    expect(onCreated).toHaveBeenCalledWith("/api/reports/r1/file?t=abc");
  });

  test("a guest can preview and print but not make a CSV", () => {
    renderBuilder(false);
    expect((screen.getByRole("button", { name: /CSV/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("link", { name: /Printable report/ })).toBeDefined();
  });

  test("unticking a variable on a block changes that block, and undo brings it back", async () => {
    vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [{ timestamp_utc: "2026-10-30T00:00:00Z", record_seq: "1", temp_c: "27", turbidity_fau: "1", battery_v: "3.7" }] });
    render(<Toaster><ReportBuilder buoys={[buoy(1, "Reef north")]} columns={COLUMNS} canDownload canEdit now={NOW} onCreated={vi.fn()} recent={null} /></Toaster>);
    await screen.findAllByText("Water temperature (°C)");
    await userEvent.click(screen.getByRole("group", { name: "Summary table block" }));
    await userEvent.click(screen.getByLabelText(/Water temperature/));
    const paper = () => within(screen.getByLabelText("Report preview"));
    expect(paper().queryByText("Water temperature (°C)")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(paper().getByText("Water temperature (°C)")).toBeDefined();
  });
});

test("clearing a custom day keeps the last whole day and the page keeps working", async () => {
  vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [] });
  render(<Toaster><ReportBuilder buoys={[buoy(1, "Reef north")]} columns={COLUMNS} canDownload canEdit now={NOW} onCreated={vi.fn()} recent={null} /></Toaster>);
  await userEvent.click(screen.getByRole("button", { name: "Custom" }));
  await userEvent.clear(screen.getByLabelText("From"));
  expect((screen.getByLabelText("From") as HTMLInputElement).value).toBe("2026-10-24");
  expect(screen.getByRole("button", { name: /CSV/ })).toBeDefined();
});

test("Printable report carries the exact range, to the second", () => {
  vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [] });
  render(<Toaster><ReportBuilder buoys={[buoy(1, "Reef north")]} columns={COLUMNS} canDownload canEdit now={NOW} onCreated={vi.fn()} recent={null} /></Toaster>);
  expect(screen.getByRole("link", { name: /Printable report/ }).getAttribute("href"))
    .toBe("/reports/print/?buoys=1&from=2026-10-24T12:00:00Z&to=2026-10-31T12:00:00Z&columns=temp_c,turbidity_fau,battery_v");
});
