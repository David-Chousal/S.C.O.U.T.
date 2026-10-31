import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { ReportComposer } from "./report-composer";

const buoy = (buoy_id: number, label: string) => ({ buoy_id, label }) as Buoy;
const COLUMNS = ["temp_c", "turbidity_fau", "battery_v", "flags"];

function renderComposer(canDownload = true, onCreated = vi.fn()) {
  render(<Toaster><ReportComposer buoys={[buoy(1, "Reef north"), buoy(2, "Reef south")]} columns={COLUMNS}
    canDownload={canDownload} today="2026-10-31" onCreated={onCreated} /></Toaster>);
  return onCreated;
}

afterEach(() => vi.restoreAllMocks());

describe("ReportComposer", () => {
  test("starts with every buoy, the last 7 days and the three main variables", () => {
    renderComposer();
    expect((screen.getByLabelText("Reef north") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("From") as HTMLInputElement).value).toBe("2026-10-24");
    expect((screen.getByLabelText("To") as HTMLInputElement).value).toBe("2026-10-31");
    expect((screen.getByLabelText(/Water temperature/) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(/^Flags/) as HTMLInputElement).checked).toBe(false);
  });

  test("Download CSV asks for whole UTC days and hands back the link", async () => {
    const create = vi.spyOn(api, "createReport").mockResolvedValue({ id: "r1", link: "/api/reports/r1/file?t=abc", rows: 12 });
    const onCreated = renderComposer();
    await userEvent.click(screen.getByLabelText("Reef south"));
    await userEvent.click(screen.getByRole("button", { name: /Download CSV/ }));
    expect(create).toHaveBeenCalledWith({ buoys: [1], from: "2026-10-24T00:00:00Z", to: "2026-10-31T23:59:59Z",
      columns: ["temp_c", "turbidity_fau", "battery_v"] });
    expect(onCreated).toHaveBeenCalledWith("/api/reports/r1/file?t=abc");
  });

  test("the printable report opens with the same choices", () => {
    renderComposer();
    const print = screen.getByRole("link", { name: /Printable report/ });
    expect(print.getAttribute("href")).toBe("/reports/print/?buoys=1,2&from=2026-10-24&to=2026-10-31&columns=temp_c,turbidity_fau,battery_v");
  });

  test("a guest can print but not make a CSV", () => {
    renderComposer(false);
    expect((screen.getByRole("button", { name: /Download CSV/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("link", { name: /Printable report/ })).toBeDefined();
  });
});
