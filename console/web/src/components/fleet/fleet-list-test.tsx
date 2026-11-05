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
    expect(transmitsLabel(buoy())).toBe("3 a day");
    expect(transmitsLabel(buoy({ tx_count_requested: 1 }))).toBe("3 a day (1 a day asked)");
    expect(transmitsLabel(buoy({ tx_count_reported: null }))).toBe("Not reported yet");
  });

  test("each buoy opens to its essentials and a Settings key, and carries no battery or reading data", async () => {
    render(<FleetList buoys={[buoy(), buoy({ buoy_id: 2, label: "Reef south", settings_state: "pending" })]} remote={REMOTE}
      devices={[{ id: "d1", name: "Kaneohe shore", created_at: 0, revoked_at: null, last_seen_at: null }]} />);
    expect(screen.getByText("Pending")).toBeDefined();
    await userEvent.click(screen.getByText("Reef south"));
    expect(screen.getAllByText("Kaneohe shore")[0]).toBeDefined();
    expect(screen.getAllByText("All defaults")[0]).toBeDefined();
    expect(screen.getByRole("link", { name: "Settings for Reef south" }).getAttribute("href")).toMatch(/^\/settings\/?\?buoy=2$/);
    expect(screen.queryByText(/battery/i)).toBeNull();
  });
});
