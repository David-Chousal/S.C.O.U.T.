import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { ReportBuilder } from "./report-builder";

afterEach(() => vi.restoreAllMocks());

function renderBuilder(canEdit = true) {
  vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [{ timestamp_utc: "2026-10-30T00:00:00Z", record_seq: "1", temp_c: "27", battery_v: "3.7" }] });
  render(<Toaster><ReportBuilder buoys={[{ buoy_id: 1, label: "Reef north" } as Buoy]} columns={["temp_c", "battery_v"]} canDownload={canEdit} canEdit={canEdit}
    now={Date.parse("2026-10-31T12:00:00Z")} onCreated={vi.fn()} recent={null} /></Toaster>);
  return userEvent.click(screen.getByRole("tab", { name: "Blocks" }));
}
const paper = () => within(screen.getByLabelText("Report preview"));

describe("Block library", () => {
  test("adding a block puts it below the selected one and selects it", async () => {
    await renderBuilder();
    await userEvent.click(paper().getByRole("group", { name: "Title block" }));
    await userEvent.click(screen.getByRole("button", { name: "Add Divider" }));
    const names = paper().getAllByRole("group").map((g) => g.getAttribute("aria-label"));
    expect(names.slice(0, 2)).toEqual(["Title block", "Divider block"]);
    expect(screen.getByRole("heading", { name: "Divider" })).toBeDefined();
  });

  test("a Text block is edited in place and fills its fields", async () => {
    await renderBuilder();
    await userEvent.click(screen.getByRole("button", { name: "Add Text" }));
    const area = paper().getByLabelText("Text");
    await userEvent.clear(area);
    await userEvent.type(area, "Buoys: ");
    await userEvent.click(paper().getByRole("button", { name: "{buoys}" }));
    await userEvent.click(paper().getByRole("group", { name: "Title block" }));
    expect(paper().getByText("Buoys: Reef north")).toBeDefined();
  });

  test("the Title block's title is the report's own", async () => {
    await renderBuilder();
    await userEvent.click(paper().getByRole("group", { name: "Title block" }));
    const title = paper().getByLabelText("Report title");
    await userEvent.clear(title);
    await userEvent.type(title, "Weekly");
    expect((screen.getAllByLabelText("Report title")[0] as HTMLInputElement).value).toBe("Weekly");
  });

  test("guests see the library but cannot add from it", async () => {
    await renderBuilder(false);
    expect((screen.getByRole("button", { name: "Add Text" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
