import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { ReportBuilder } from "./report-builder";

afterEach(() => vi.restoreAllMocks());

function renderBuilder() {
  vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [] });
  render(<Toaster><ReportBuilder buoys={[{ buoy_id: 1, label: "Reef north" } as Buoy]} columns={["temp_c"]} canDownload canEdit
    now={Date.parse("2026-10-31T12:00:00Z")} onCreated={vi.fn()} recent={null} /></Toaster>);
}
const outline = () => within(screen.getByRole("list", { name: "Outline" }));
const pageOrder = () => within(screen.getByLabelText("Report preview")).getAllByRole("group").map((g) => g.getAttribute("aria-label"));

describe("Outline", () => {
  test("lists every block in order, and clicking one selects it", async () => {
    renderBuilder();
    await userEvent.click(screen.getByRole("tab", { name: "Outline" }));
    expect(outline().getAllByRole("button").map((b) => b.querySelector("strong")?.textContent)).toEqual(["Title", "Summary table", "Readings table"]);
    await userEvent.click(outline().getByRole("button", { name: /Readings table/ }));
    expect(screen.getByRole("heading", { name: "Readings table" })).toBeDefined();
  });

  test("Alt+↑ on a row moves that block up on the page", async () => {
    renderBuilder();
    await userEvent.click(screen.getByRole("tab", { name: "Outline" }));
    outline().getByRole("button", { name: /Readings table/ }).focus();
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(pageOrder()).toEqual(["Title block", "Readings table block", "Summary table block"]);
  });

  test("hidden and overridden blocks are marked in the outline", async () => {
    renderBuilder();
    await userEvent.click(within(screen.getByLabelText("Report preview")).getByRole("group", { name: "Summary table block" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Hide in PDF" })[0]);
    await userEvent.click(screen.getByRole("tab", { name: "Outline" }));
    expect(outline().getByText("Hidden")).toBeDefined();
  });

  test("each block on the page has a drag handle while editing", () => {
    renderBuilder();
    expect(screen.getByRole("button", { name: "Drag Summary table to move it" })).toBeDefined();
  });
});
