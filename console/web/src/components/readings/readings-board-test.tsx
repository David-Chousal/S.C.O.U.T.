import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import type { Buoy, Fleet, Reading } from "@/lib/api/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { ReadingsBoard } from "./readings-board";

const buoy = (buoy_id: number, label: string): Buoy => ({
  buoy_id, label, tx_count_requested: null, requested_by: null, requested_at: null, tx_count_reported: 3, cmd_rejected: 0,
  reported_at: 0, last_seen_at: 0, clock_lost: 0, command_device_id: null, state: "default",
});
const reading = (seq: number, temp: string, flags = ""): Reading => ({
  buoy_id: "SCOUT-01", record_seq: String(seq), timestamp_utc: `2026-10-30T0${seq}:10:00Z`, temp_c: temp,
  turbidity_fau: "1.20", battery_v: "3.31", internal_humidity_pct: "", flags,
});

function renderBoard(readings: Reading[], buoys = [buoy(1, "Reef north"), buoy(2, "Reef south")]) {
  vi.spyOn(api, "fleet").mockResolvedValue({ buoys } as Fleet);
  const load = vi.spyOn(api, "readings").mockResolvedValue({ readings });
  render(<PreferencesContext value={{ preferences: DEFAULT_PREFERENCES, update: vi.fn(), stored: true }}><ReadingsBoard /></PreferencesContext>);
  return load;
}

afterEach(() => vi.restoreAllMocks());

describe("ReadingsBoard", () => {
  test("shows the newest values up top and every reading in a table", async () => {
    renderBoard([reading(2, "26.4"), reading(1, "26.1")]);
    const latest = await screen.findByRole("region", { name: "Latest reading" });
    expect(within(latest).getByText("26.4")).toBeDefined();
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[2]).getByText("26.1")).toBeDefined();
  });

  test("a value that was not measured reads as a dash, not a blank", async () => {
    renderBoard([reading(1, "26.1")]);
    const latest = await screen.findByRole("region", { name: "Latest reading" });
    expect(within(latest).getAllByText("—").length).toBeGreaterThan(0);
  });

  test("switching buoy loads that buoy's readings", async () => {
    const load = renderBoard([reading(1, "26.1")]);
    await screen.findByRole("region", { name: "Latest reading" });
    await userEvent.click(screen.getByRole("button", { name: "Reef south" }));
    expect(load).toHaveBeenLastCalledWith(2, 50);
  });

  test("says so when a buoy has no readings yet", async () => {
    renderBoard([]);
    expect(await screen.findByText(/No readings yet/)).toBeDefined();
  });
});
