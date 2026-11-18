import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { ReportBuilder } from "./report-builder";

afterEach(() => vi.restoreAllMocks());

describe("Print", () => {
  test("prints the pages without hidden blocks or edit tools, then removes the print copy", async () => {
    vi.spyOn(api, "readingsBetween").mockResolvedValue({ readings: [{ timestamp_utc: "2026-10-30T00:00:00Z", record_seq: "1", temp_c: "27" }] });
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<Toaster><ReportBuilder buoys={[{ buoy_id: 1, label: "Reef north" } as Buoy]} columns={["temp_c"]}
      canDownload canEdit now={Date.parse("2026-10-31T12:00:00Z")} onCreated={vi.fn()} recent={null} /></Toaster>);
    await userEvent.click(await screen.findByRole("group", { name: "Readings table block" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Hide in PDF" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "Print" }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    const copy = document.querySelector(".sc-report-print-root");
    expect(copy?.querySelectorAll(".sc-rb-table")).toHaveLength(1);
    expect(copy?.querySelector(".sc-rb-tools, .sc-rb-tags, .sc-rb-block")).toBeNull();
    expect(copy?.querySelector("style")?.textContent).toContain("@page { size: letter portrait; margin: 0; }");
    window.dispatchEvent(new Event("afterprint"));
    await waitFor(() => expect(document.querySelector(".sc-report-print-root")).toBeNull());
  });
});
