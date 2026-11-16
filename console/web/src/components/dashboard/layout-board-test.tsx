import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy, Reading } from "@/lib/api/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { systemDefault, type SavedView } from "@/lib/dashboard/layout";
import { LayoutBoard } from "./layout-board";
import { TraceBay } from "./trace-bay";

const NOW = Date.UTC(2026, 9, 31, 12);
const buoy = (buoy_id: number, label: string) => ({ buoy_id, label, tx_count_reported: 3, reported_at: NOW, last_seen_at: NOW, clock_lost: 0, state: "confirmed", settings_state: "confirmed" }) as Buoy;
const reading = (hoursAgo: number, temp: string): Reading => ({
  record_seq: String(100 - hoursAgo), timestamp_utc: new Date(NOW - hoursAgo * 3600000).toISOString().slice(0, 19) + "Z", temp_c: temp, turbidity_fau: "1.2", battery_v: "3.3",
});
const DATA = { buoys: [buoy(1, "Reef north"), buoy(2, "Reef south")], readings: { 1: [reading(30, "26.0"), reading(2, "26.4")], 2: [reading(10, "25.1")] }, now: NOW,
  from: NOW - 7 * 24 * 3600000, phrase: "last 7 days", allHistory: false };
const OVERVIEW: SavedView = { id: "default", name: "Overview", shared: true, bays: systemDefault([1, 2]) };

function renderBoard(canEdit = true, views: SavedView[] = [OVERVIEW], onChanged = vi.fn()) {
  render(
    <PreferencesContext value={{ preferences: DEFAULT_PREFERENCES, update: vi.fn(), stored: true }}>
      <Toaster><LayoutBoard views={views} data={DATA} canEdit={canEdit} onChanged={onChanged} /></Toaster>
    </PreferencesContext>,
  );
  return onChanged;
}

afterEach(() => vi.restoreAllMocks());

describe("LayoutBoard", () => {
  test("the Overview shows every buoy's newest value of every metric", () => {
    renderBoard();
    const metrics = screen.getByRole("region", { name: "Every metric · last 7 days" });
    const temp = within(metrics).getByRole("article", { name: "Water temperature" });
    expect(within(temp).getByText("26.4")).toBeDefined();
    expect(within(temp).getByText("25.1")).toBeDefined();
  });

  test("a metric's name opens its full analysis: one common scale, diel cycle, statistics and QC", async () => {
    renderBoard();
    await userEvent.click(screen.getByRole("button", { name: "Open the water temperature analysis" }));
    const dialog = screen.getByRole("dialog", { name: "Water temperature (°C)" });
    expect(within(dialog).getByRole("img", { name: /every buoy on one scale/ })).toBeDefined();
    expect(within(dialog).getByRole("img", { name: /by hour of day/ })).toBeDefined();
    expect(within(dialog).getByRole("region", { name: "Quality control" })).toBeDefined();
  });

  test("the Overview leads with fleet status: who is live and how many packets arrived", () => {
    renderBoard();
    const status = screen.getByRole("region", { name: "Fleet status" });
    expect(within(status).getByText("2 of 2")).toBeDefined();
    expect(within(status).getByText("3 of 42 expected")).toBeDefined();
  });

  test("a guest sees the board but cannot customize it", () => {
    renderBoard(false);
    expect((screen.getByRole("button", { name: /Customize/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("tab", { name: "+ New view" })).toBeNull();
  });

  test("customizing the Overview and saving makes your own copy", async () => {
    const create = vi.spyOn(api, "createDashboard").mockResolvedValue({ id: "d1" });
    const onChanged = renderBoard();
    await userEvent.click(screen.getByRole("button", { name: /Customize/ }));
    await userEvent.click(screen.getByRole("button", { name: "Remove Fleet status" }));
    await userEvent.click(screen.getByRole("button", { name: /Save view/ }));
    expect(create).toHaveBeenCalledWith("My dashboard", false, expect.not.arrayContaining([expect.objectContaining({ kind: "health" })]));
    expect(onChanged).toHaveBeenCalled();
  });

  test("a saved view is changed in place", async () => {
    const save = vi.spyOn(api, "saveDashboard").mockResolvedValue({ ok: true });
    const mine: SavedView = { id: "v1", name: "Mine", shared: false, bays: [{ id: "fleet", kind: "fleet", span: 6 }] };
    renderBoard(true, [OVERVIEW, mine]);
    await userEvent.click(screen.getByRole("tab", { name: "Mine" }));
    await userEvent.click(screen.getByRole("button", { name: /Customize/ }));
    await userEvent.click(screen.getByRole("button", { name: "Add Readout" }));
    await userEvent.click(screen.getByRole("button", { name: /Save view/ }));
    expect(save).toHaveBeenCalledWith("v1", [expect.objectContaining({ kind: "readout", buoy: 1, variable: "temp_c" }), mine.bays[0]]);
  });
});

describe("TraceBay", () => {
  test("two buoys get a legend and end labels; the table view lists the points", () => {
    render(<TraceBay buoys={DATA.buoys} readings={DATA.readings} variable="temp_c" from={DATA.from} now={NOW} phrase="last 7 days" />);
    expect(within(screen.getByRole("list", { name: "Buoys" })).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("img", { name: /Water temperature, last 7 days/ })).toBeDefined();
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });

  test("a readings gap of over 26 hours lifts the pen", () => {
    const { container } = render(<TraceBay buoys={[DATA.buoys[0]]} readings={DATA.readings} variable="temp_c" from={DATA.from} now={NOW} phrase="last 7 days" />);
    expect(container.querySelector(".sc-trace__line")?.getAttribute("d")?.match(/M/g)).toHaveLength(2);
  });

  test("says so when there is nothing to plot", () => {
    render(<TraceBay buoys={DATA.buoys} readings={{}} variable="temp_c" from={DATA.from} now={NOW} phrase="last 7 days" />);
    expect(screen.getByText(/No water temperature readings/)).toBeDefined();
  });
});
