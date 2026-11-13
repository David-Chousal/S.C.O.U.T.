import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import estimates from "../../../../worker/battery-life.json";
import firmware from "../../../../worker/buoy-config.json";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { BuoySettings, Device, Role, Session } from "@/lib/api/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { SessionContext } from "@/lib/session";
import { StationsBoard } from "./stations-board";

const buoy = (id: number, label: string, device: string | null) => ({ buoy_id: id, label, command_device_id: device });
const SETTINGS = { buoys: [buoy(1, "Reef north", null), buoy(2, "Reef south", null)], firmware, estimates } as unknown as BuoySettings;
const DEVICES: { devices: Device[] } = {
  devices: [
    { id: "a", name: "Kaneohe shore", created_at: 0, revoked_at: null, last_seen_at: Date.now(), wifi_setup_requested_at: null },
    { id: "b", name: "Old pier", created_at: 0, revoked_at: 1, last_seen_at: null, wifi_setup_requested_at: null },
  ],
};

function renderBoard(role: Role, devices = DEVICES) {
  vi.spyOn(api, "settings").mockResolvedValue(SETTINGS);
  vi.spyOn(api, "devices").mockResolvedValue(devices);
  const session: Session = { csrf: "t", user: { id: "u", email: "u@scout.test", name: "U", role, hasPassword: true, github: false, google: false, selfSignup: false } };
  render(
    <SessionContext value={session}>
      <PreferencesContext value={{ preferences: DEFAULT_PREFERENCES, update: vi.fn(), stored: true }}>
        <Toaster><StationsBoard /></Toaster>
      </PreferencesContext>
    </SessionContext>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("StationsBoard", () => {
  test("an active station's ⋯ menu revokes after a confirmation, then says how to bring it back", async () => {
    const revoke = vi.spyOn(api, "revokeDevice").mockResolvedValue({ ok: true });
    renderBoard("admin");
    await userEvent.click(await screen.findByRole("button", { name: "Actions for Kaneohe shore" }));
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Info", "Change WiFi", "Revoke"]);
    await userEvent.click(screen.getByRole("menuitem", { name: "Revoke" }));
    expect(revoke).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Revoke" }));
    expect(revoke).toHaveBeenCalledWith("a");
    expect(screen.getByRole("dialog", { name: "Kaneohe shore is revoked" }).textContent).toContain("New token");
    expect(screen.getByRole("link", { name: "How to connect a shore station" }).getAttribute("href")).toMatch(/^\/help\/?#shore$/);
  });

  test("Change WiFi asks first, then tells the station to open its setup network and says what to do on a phone", async () => {
    const request = vi.spyOn(api, "requestWifiSetup").mockResolvedValue({ ok: true });
    renderBoard("admin");
    await userEvent.click(await screen.findByRole("button", { name: "Actions for Kaneohe shore" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Change WiFi" }));
    expect(request).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Open setup network" }));
    expect(request).toHaveBeenCalledWith("a");
    expect(screen.getByRole("dialog", { name: "Setup network on its way" }).textContent).toContain("SCOUT-Setup-");
  });

  test("a station asked to change WiFi in the last 15 minutes shows it", async () => {
    const asked = { devices: [{ ...DEVICES.devices[0], wifi_setup_requested_at: Date.now() - 60_000 }] };
    renderBoard("member", asked);
    expect(await screen.findByText("WiFi setup open")).toBeTruthy();
  });

  test("a revoked station has a delete key that asks first", async () => {
    const remove = vi.spyOn(api, "deleteDevice").mockResolvedValue({ ok: true });
    renderBoard("admin");
    expect(screen.queryByRole("button", { name: /Delete Kaneohe/ })).toBeNull();
    await userEvent.click(await screen.findByRole("button", { name: "Delete Old pier" }));
    expect(remove).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(remove).toHaveBeenCalledWith("b");
  });

  test("Info shows what the station does and which buoys it commands", async () => {
    renderBoard("member");
    await userEvent.click(await screen.findByRole("button", { name: "Actions for Kaneohe shore" }));
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Info"]);
    await userEvent.click(screen.getByRole("menuitem", { name: "Info" }));
    const card = screen.getByRole("dialog", { name: "Kaneohe shore" });
    expect(card.textContent).toContain("Reef north");
    expect(card.textContent).toContain("every minute");
  });

  test("no Buoys it commands column: a lone station's Info lists every buoy, and there is nothing to assign", async () => {
    renderBoard("admin");
    await userEvent.click(await screen.findByRole("button", { name: "Actions for Kaneohe shore" }));
    expect(screen.queryByRole("columnheader", { name: "Buoys it commands" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Assign buoys" })).toBeNull();
    await userEvent.click(screen.getByRole("menuitem", { name: "Info" }));
    const card = screen.getByRole("dialog", { name: "Kaneohe shore" });
    expect(card.textContent).toContain("Reef north");
    expect(card.textContent).toContain("Reef south");
  });

  test("with two stations, an unassigned buoy is flagged and Assign moves it to a station", async () => {
    const assign = vi.spyOn(api, "setCommandStation").mockResolvedValue({ ok: true });
    renderBoard("admin", { devices: [...DEVICES.devices, { id: "c", name: "Campus bench", created_at: 0, revoked_at: null, last_seen_at: null, wifi_setup_requested_at: null }] });
    expect(await screen.findByText(/have no station/)).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Actions for Campus bench" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Assign buoys" }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Reef south/ }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(assign).toHaveBeenCalledWith(2, "c");
  });

  test("New token opens a dialog; non-admins see it disabled", async () => {
    renderBoard("admin");
    await userEvent.click(await screen.findByRole("button", { name: "New token" }));
    expect(screen.getByRole("dialog", { name: "New shore station token" })).toBeDefined();
  });

  test("a member sees the delete key disabled", async () => {
    renderBoard("member");
    expect(((await screen.findByRole("button", { name: "Delete Old pier" })) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "New token" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
