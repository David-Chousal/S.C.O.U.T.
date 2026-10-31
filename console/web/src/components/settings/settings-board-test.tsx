import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import firmware from "../../../../worker/buoy-config.json";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { BuoySettings, Role, Session } from "@/lib/api/types";
import { DEFAULT_PREFERENCES, type Preferences } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { SessionContext } from "@/lib/session";
import { SettingsBoard } from "./settings-board";

const DATA = {
  buoys: [{ buoy_id: 1, label: "SCOUT-01", tx_count_requested: null, requested_by: null, requested_at: null,
    tx_count_reported: 3, cmd_rejected: 0, reported_at: 0, last_seen_at: 0, clock_lost: 0, state: "default" }],
  firmware,
} as BuoySettings;

function renderBoard(role: Role, update = vi.fn(), preferences: Preferences = DEFAULT_PREFERENCES) {
  vi.spyOn(api, "settings").mockResolvedValue(DATA);
  const session: Session = { csrf: "t", user: { id: "u", email: "u@scout.test", name: "U", role, hasPassword: true, github: false, google: false } };
  render(
    <SessionContext value={session}>
      <PreferencesContext value={{ preferences, update, stored: true }}>
        <Toaster><SettingsBoard /></Toaster>
      </PreferencesContext>
    </SessionContext>,
  );
  return update;
}

afterEach(() => vi.restoreAllMocks());

describe("SettingsBoard", () => {
  test("lists every firmware setting exported from config.h", async () => {
    renderBoard("member");
    expect(await screen.findByText("Firmware settings")).toBeDefined();
    for (const setting of firmware.settings) expect(screen.getByRole("rowheader", { name: setting.label })).toBeDefined();
  });

  test("a member can rename a buoy; the save key wakes once the name changes", async () => {
    const rename = vi.spyOn(api, "renameBuoy").mockResolvedValue({ ok: true });
    renderBoard("member");
    const input = await screen.findByLabelText("Name in the console");
    const save = screen.getByRole("button", { name: "Save name" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    await userEvent.clear(input);
    await userEvent.type(input, "Reef north");
    await userEvent.click(save);
    expect(rename).toHaveBeenCalledWith(1, "Reef north");
  });

  test("a guest sees the buoy settings but cannot rename", async () => {
    renderBoard("guest");
    expect(((await screen.findByLabelText("Name in the console")) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/View only/)).toBeDefined();
  });

  test("arrow keys move between tabs, and page settings apply through update", async () => {
    const update = renderBoard("guest");
    await userEvent.click(screen.getByRole("tab", { name: "Buoys" }));
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "This browser" }).getAttribute("aria-selected")).toBe("true");
    expect((screen.getByRole("button", { name: "Light" })).getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(update).toHaveBeenCalledWith({ theme: "dark" });
    await userEvent.click(screen.getByRole("switch"));
    expect(update).toHaveBeenCalledWith({ shortcuts: false });
  });
});
