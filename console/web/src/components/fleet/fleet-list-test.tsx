import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import estimates from "../../../../worker/battery-life.json";
import firmware from "../../../../worker/buoy-config.json";
import type { Buoy, Estimates, RemoteSetting } from "@/lib/api/types";
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

  test("status says whether the buoy is alive; a row opens to its briefing with a Settings key", async () => {
    const now = Date.now();
    render(<FleetList buoys={[buoy({ reported_at: now - 60_000 }), buoy({ buoy_id: 2, label: "Reef south", reported_at: null, last_seen_at: null })]}
      remote={REMOTE} slotsSod={firmware.slotsSod} estimates={estimates as Estimates} />);
    expect(screen.getByText("Live")).toBeDefined();
    expect(screen.getByText("Not heard")).toBeDefined();
    expect(screen.queryByRole("link", { name: /Settings for/ })).toBeNull();
    const toggle = screen.getByRole("button", { name: /SCOUT-01/ });
    await userEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Next transmission")).toBeDefined();
    expect(screen.getByText(/on 2 D cells/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Settings for SCOUT-01" }).getAttribute("href")).toMatch(/^\/settings\/?\?buoy=1$/);
    await userEvent.click(toggle);
    expect(screen.queryByText("Next transmission")).toBeNull();
  });
});
