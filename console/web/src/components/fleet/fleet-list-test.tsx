import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import firmware from "../../../../worker/buoy-config.json";
import type { Buoy, RemoteSetting } from "@/lib/api/types";
import { FleetList, transmitsLabel } from "./fleet-list";

const REMOTE = firmware.remote as RemoteSetting[];

function buoy(overrides: Partial<Buoy> = {}): Buoy {
  return {
    buoy_id: 1, label: "SCOUT-01", tx_count_requested: null, requested_by: null, requested_at: null,
    tx_count_reported: 3, cmd_rejected: 0, reported_at: 0, last_seen_at: 0, clock_lost: 0, command_device_id: "d1", state: "default",
    settings_requested: {}, settings_wanted: REMOTE.map((s) => s.default), settings_digest_wanted: "e674",
    settings_digest_reported: "e674", settings_state: "default", ...overrides,
  };
}

describe("FleetList", () => {
  test("says what was asked only when it differs from what the buoy reports", () => {
    expect(transmitsLabel(buoy())).toEqual({ main: "3 a day", sub: "default" });
    expect(transmitsLabel(buoy({ tx_count_requested: 1 }))).toEqual({ main: "3 a day", sub: "1 a day asked" });
    expect(transmitsLabel(buoy({ tx_count_reported: null })).main).toBe("Not reported yet");
  });

  test("a row opens to its essentials and closes again; no battery or reading data", async () => {
    render(<FleetList buoys={[buoy(), buoy({ buoy_id: 2, label: "Reef south", settings_state: "pending" })]} remote={REMOTE}
      devices={[{ id: "d1", name: "Kaneohe shore", created_at: 0, revoked_at: null, last_seen_at: null }]} />);
    expect(screen.getByText("Pending")).toBeDefined();
    expect(screen.queryByText("Kaneohe shore")).toBeNull();
    const toggle = screen.getByRole("button", { name: /Reef south/ });
    await userEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Kaneohe shore")).toBeDefined();
    expect(screen.getByText("All defaults")).toBeDefined();
    await userEvent.click(toggle);
    expect(screen.queryByText("Kaneohe shore")).toBeNull();
    expect(screen.getByRole("link", { name: "Settings for Reef south" }).getAttribute("href")).toMatch(/^\/settings\/?\?buoy=2$/);
    expect(screen.queryByText(/battery/i)).toBeNull();
  });
});
