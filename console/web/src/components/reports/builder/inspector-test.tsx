import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { ReportBuilder } from "./report-builder";

const buoy = (buoy_id: number, label: string) => ({ buoy_id, label }) as Buoy;
const NOW = Date.parse("2026-10-31T12:00:00Z");

function renderBuilder(canEdit = true) {
  const read = vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [] });
  render(<Toaster><ReportBuilder buoys={[buoy(1, "Reef north"), buoy(2, "Reef south")]} columns={["temp_c", "battery_v"]}
    canDownload={canEdit} canEdit={canEdit} now={NOW} onCreated={vi.fn()} recent={null} /></Toaster>);
  return read;
}
const paper = () => within(screen.getByLabelText("Report preview"));
const blockNames = () => paper().getAllByRole("group").map((g) => g.getAttribute("aria-label"));

afterEach(() => vi.restoreAllMocks());

describe("Inspector", () => {
  test("a block inherits the report's buoys until it overrides them", async () => {
    renderBuilder();
    await userEvent.click(paper().getByRole("group", { name: "Summary table block" }));
    expect(screen.getAllByText("From report")).toHaveLength(2);
    await userEvent.click(screen.getAllByRole("button", { name: "Override" })[0]);
    await userEvent.click(within(screen.getByRole("group", { name: "This block's buoys" })).getByRole("button", { name: "Reef north" }));
    expect(paper().getByText("Own Reef south")).toBeDefined();
    const summary = paper().getByRole("group", { name: "Summary table block" });
    expect(within(summary).queryByText("Reef north")).toBeNull();
    expect(within(summary).getByText("Reef south")).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Use report's" }));
    expect(within(summary).getByText("Reef north")).toBeDefined();
  });

  test("a range override fetches that block's own range", async () => {
    const read = renderBuilder();
    await userEvent.click(paper().getByRole("group", { name: "Readings table block" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Override" })[1]);
    await userEvent.click(within(screen.getByRole("group", { name: "This block's range" })).getByRole("button", { name: "24 h" }));
    expect(read).toHaveBeenCalledWith(1, "2026-10-30T12:00:00Z", "2026-10-31T12:00:00Z");
  });

  test("the block tools duplicate, move and delete, and undo reverses each", async () => {
    renderBuilder();
    await userEvent.click(paper().getByRole("group", { name: "Summary table block" }));
    await userEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(blockNames()).toEqual(["Title block", "Summary table block", "Summary table block", "Readings table block"]);
    await userEvent.click(screen.getByRole("button", { name: "Move down" }));
    expect(blockNames()).toEqual(["Title block", "Summary table block", "Readings table block", "Summary table block"]);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(blockNames()).toEqual(["Title block", "Summary table block", "Readings table block"]);
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(blockNames()).toHaveLength(4);
  });

  test("hide in PDF keeps the block on the page, tagged", async () => {
    renderBuilder();
    await userEvent.click(paper().getByRole("group", { name: "Summary table block" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Hide in PDF" })[0]);
    expect(paper().getByText("Hidden in PDF")).toBeDefined();
  });

  test("a guest cannot select or edit blocks but still changes the report's variables", async () => {
    const read = renderBuilder(false);
    await userEvent.click(paper().getByRole("group", { name: "Summary table block" }));
    expect(screen.queryByRole("button", { name: "Duplicate" })).toBeNull();
    expect(screen.getByText(/View only/)).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "24 h" }));
    expect(read).toHaveBeenCalledWith(1, "2026-10-30T12:00:00Z", "2026-10-31T12:00:00Z");
  });
});

test("the row cap is typed freely and clamped when the field is left", async () => {
  vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [] });
  render(<Toaster><ReportBuilder buoys={[buoy(1, "Reef north")]} columns={["temp_c"]} canDownload canEdit now={NOW} onCreated={vi.fn()} recent={null} /></Toaster>);
  await userEvent.click(within(screen.getByLabelText("Report preview")).getByRole("group", { name: "Readings table block" }));
  const cap = screen.getByRole("spinbutton");
  await userEvent.clear(cap);
  await userEvent.type(cap, "500");
  expect((cap as HTMLInputElement).value).toBe("500");
  await userEvent.type(cap, "0{Enter}");
  expect((cap as HTMLInputElement).value).toBe("2000");
});

test("Alt+↑ and Alt+↓ move the focused block", async () => {
  vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [] });
  render(<Toaster><ReportBuilder buoys={[buoy(1, "Reef north")]} columns={["temp_c"]} canDownload canEdit now={NOW} onCreated={vi.fn()} recent={null} /></Toaster>);
  const paperNow = within(screen.getByLabelText("Report preview"));
  paperNow.getByRole("group", { name: "Readings table block" }).focus();
  await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
  expect(paperNow.getAllByRole("group").map((g) => g.getAttribute("aria-label"))).toEqual(["Title block", "Readings table block", "Summary table block"]);
});
