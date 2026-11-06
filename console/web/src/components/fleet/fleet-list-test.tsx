import { describe, expect, test, vi } from "vitest";
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

  test("each row has its status and a Settings link, and no dropdown", () => {
    const now = Date.now();
    render(<FleetList buoys={[buoy({ reported_at: now - 60_000 }), buoy({ buoy_id: 2, label: "Reef south", reported_at: null, last_seen_at: null })]}
      remote={REMOTE} slotsSod={firmware.slotsSod} now={now} />);
    expect(screen.getByText("Live")).toBeDefined();
    expect(screen.getByText("Not heard")).toBeDefined();
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Buoy", "Transmits", "Last heard", "Next transmission", "Status", "Actions"]);
    expect(screen.getAllByText(/^in \d/).length).toBe(2);
  });

  test("each buoy's ⋯ menu opens its readings and its settings; admins also get Disconnect", async () => {
    const onDisconnect = vi.fn();
    render(<FleetList buoys={[buoy({ buoy_id: 2, label: "Reef south" })]} remote={REMOTE} slotsSod={firmware.slotsSod} now={Date.now()}
      canManage onDisconnect={onDisconnect} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions for Reef south" }));
    expect(screen.getByRole("menuitem", { name: "Buoy info" }).getAttribute("href")).toMatch(/^\/readings\/?\?buoy=2$/);
    expect(screen.getByRole("menuitem", { name: "Settings" }).getAttribute("href")).toMatch(/^\/settings\/?\?buoy=2$/);
    await userEvent.click(screen.getByRole("menuitem", { name: "Disconnect" }));
    expect(onDisconnect).toHaveBeenCalledWith(expect.objectContaining({ buoy_id: 2 }));
  });

  test("members see no Disconnect; a disconnected buoy shows Disconnected and a delete key instead of the menu", async () => {
    const onDelete = vi.fn();
    render(<FleetList buoys={[buoy({ buoy_id: 1, label: "Reef north" }), buoy({ buoy_id: 2, label: "Reef south", disconnected_at: 1 })]}
      remote={REMOTE} slotsSod={firmware.slotsSod} now={Date.now()} canManage onDelete={onDelete} onDisconnect={vi.fn()} />);
    expect(screen.getByText("Disconnected")).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Delete Reef south" }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ buoy_id: 2 }));
    expect(screen.queryByRole("button", { name: "Actions for Reef south" })).toBeNull();
  });

  test("without the admin role the menu has no Disconnect", async () => {
    render(<FleetList buoys={[buoy({ buoy_id: 1, label: "Reef north" })]} remote={REMOTE} slotsSod={firmware.slotsSod} now={Date.now()} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions for Reef north" }));
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Buoy info", "Settings"]);
  });
});
