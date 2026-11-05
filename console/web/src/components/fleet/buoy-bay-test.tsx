import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Buoy } from "@/lib/api/types";
import { BuoyBay } from "./buoy-bay";

function buoy(overrides: Partial<Buoy> = {}): Buoy {
  return {
    buoy_id: 1, label: "SCOUT-01", tx_count_requested: 1, requested_by: "m@scout.test", requested_at: 0,
    tx_count_reported: 3, cmd_rejected: 0, reported_at: 0, last_seen_at: 0, clock_lost: 0, command_device_id: null, state: "pending",
    settings_requested: {}, settings_wanted: [], settings_digest_wanted: "e674",
    settings_digest_reported: null, settings_state: "default", ...overrides,
  };
}

function renderBay(overrides: Partial<Buoy> = {}) {
  return render(<BuoyBay buoy={buoy(overrides)} />);
}

describe("BuoyBay", () => {
  test("shows requested vs reported and says it is pending, in words", () => {
    renderBay();
    expect(screen.getByText("Pending")).toBeDefined();
    expect(screen.getByText(/1 a day/, { selector: "dd" })).toBeDefined();
    expect(screen.getByText(/3 a day/, { selector: "dd" })).toBeDefined();
  });

  test("has no transmit picker, request key or battery copy; it links to the settings", () => {
    renderBay();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("button", { name: /Request/ })).toBeNull();
    expect(screen.queryByText(/Battery, two D cells/)).toBeNull();
    expect(screen.getByRole("link", { name: "Change its settings" }).getAttribute("href")).toMatch(/^\/settings\/?$/);
  });

  test("a rejected command reads as rejected", () => {
    renderBay({ state: "rejected", cmd_rejected: 1 });
    expect(screen.getByText("Rejected")).toBeDefined();
    expect(screen.getByText(/CMD_REJECTED/)).toBeDefined();
  });
});
