import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Buoy, BuoySettings } from "@/lib/api/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { HealthBay } from "./health-bay";

const NOW = Date.UTC(2026, 10, 15, 12, 30);
const HOUR = 3600 * 1000;
// Count 2 sends at 00:10 and 16:10 UTC, so at 12:30 a packet from 00:10 is on schedule.
const buoy = { buoy_id: 1, label: "Reef north", tx_count_reported: 2, reported_at: NOW - 12 * HOUR - 20 * 60000, last_seen_at: NOW - 12 * HOUR,
  clock_lost: 0, state: "confirmed", settings_state: "confirmed", settings_wanted: [2, 0] } as unknown as Buoy;
const schedule = { firmware: { slotsSod: [600, 29400, 58200], remote: [
  { id: 1, key: "tx_count", label: "", unit: "", help: "", default: 3 },
  { id: 2, key: "slot_phase_h", label: "", unit: "h", help: "", default: 0 },
] } } as unknown as BuoySettings;

const renderBay = (withSchedule: boolean) => render(
  <PreferencesContext value={{ preferences: DEFAULT_PREFERENCES, update: vi.fn(), stored: true }}>
    <HealthBay buoys={[buoy]} readings={{ 1: [] }} heat={null} schedule={withSchedule ? schedule : null}
      window={{ from: NOW - 7 * 24 * HOUR, now: NOW, phrase: "last 7 days", allHistory: false }} />
  </PreferencesContext>,
);

describe("HealthBay", () => {
  test("a 2-a-day buoy between its slots is live, judged on its own schedule", () => {
    renderBay(true);
    expect(within(screen.getByRole("table")).getByText("Live")).toBeDefined();
  });

  test("without the schedule it falls back to a fixed 9-hour window", () => {
    renderBay(false);
    expect(within(screen.getByRole("table")).queryByText("Live")).toBeNull();
  });

  test("a buoy whose command and settings are confirmed shows its schedule without a status note", () => {
    renderBay(true);
    const table = screen.getByRole("table");
    expect(within(table).getByText(/2 a day/)).toBeDefined();
    expect(within(table).queryByText(/Pending|rejected/)).toBeNull();
  });
});
