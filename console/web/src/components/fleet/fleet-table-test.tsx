import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Buoy } from "@/lib/api/types";
import { FleetTable, transmitsLabel } from "./fleet-table";

function buoy(overrides: Partial<Buoy> = {}): Buoy {
  return {
    buoy_id: 1, label: "SCOUT-01", tx_count_requested: null, requested_by: null, requested_at: null,
    tx_count_reported: 3, cmd_rejected: 0, reported_at: 0, last_seen_at: 0, clock_lost: 0, command_device_id: null, state: "default",
    settings_requested: {}, settings_wanted: [], settings_digest_wanted: "e674", settings_digest_reported: "e674",
    settings_state: "default", ...overrides,
  };
}

describe("FleetTable", () => {
  test("says what was asked only when it differs from what the buoy reports", () => {
    expect(transmitsLabel(buoy())).toEqual({ main: "3 a day", sub: "default" });
    expect(transmitsLabel(buoy({ tx_count_requested: 1 }))).toEqual({ main: "3 a day", sub: "1 a day asked" });
    expect(transmitsLabel(buoy({ tx_count_requested: 3 }))).toEqual({ main: "3 a day", sub: "as asked" });
    expect(transmitsLabel(buoy({ tx_count_reported: null })).main).toBe("Not reported yet");
  });

  test("one row per buoy, with its settings state and a link to its settings", () => {
    render(<FleetTable buoys={[buoy(), buoy({ buoy_id: 2, label: "Reef south", settings_state: "pending" })]} />);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("Pending")).toBeDefined();
    expect(screen.getByRole("link", { name: "Change Reef south's settings" }).getAttribute("href")).toMatch(/^\/settings\/?\?buoy=2$/);
  });
});
