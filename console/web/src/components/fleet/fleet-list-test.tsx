import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
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

  test("each row has its status and a Settings link, and no dropdown", () => {
    const now = Date.now();
    render(<FleetList buoys={[buoy({ reported_at: now - 60_000 }), buoy({ buoy_id: 2, label: "Reef south", reported_at: null, last_seen_at: null })]}
      remote={REMOTE} slotsSod={firmware.slotsSod} now={now} />);
    expect(screen.getByText("Live")).toBeDefined();
    expect(screen.getByText("Not heard")).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("link", { name: "Settings for Reef south" }).getAttribute("href")).toMatch(/^\/settings\/?\?buoy=2$/);
  });
});
