import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import estimates from "../../../../worker/battery-life.json";
import firmware from "../../../../worker/buoy-config.json";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import { ViewOnlyNoteContext } from "@/lib/view-only-note";
import type { BuoySettings, Role, Session } from "@/lib/api/types";
import { DEFAULT_PREFERENCES, type Preferences } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { SessionContext } from "@/lib/session";
import { keepUnits } from "./buoy-settings";
import { SettingsBoard } from "./settings-board";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/settings/",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const DATA = {
  buoys: [{ buoy_id: 1, label: "SCOUT-01", tx_count_requested: null, requested_by: null, requested_at: null,
    tx_count_reported: 3, cmd_rejected: 0, reported_at: 0, last_seen_at: 0, clock_lost: 0, command_device_id: null, state: "default",
    settings_requested: Object.fromEntries(firmware.remote.map((spec) => [spec.key, null])),
    settings_wanted: firmware.remote.map((spec) => spec.default), settings_digest_wanted: "e674",
    settings_digest_reported: "e674", settings_state: "default"}],
  firmware,
  estimates,
} as BuoySettings;

function renderBoard(role: Role, update = vi.fn(), preferences: Preferences = DEFAULT_PREFERENCES) {
  vi.spyOn(api, "settings").mockResolvedValue(DATA);
  const session: Session = { csrf: "t", user: { id: "u", email: "u@scout.test", name: "U", role, hasPassword: true, github: false, google: false, selfSignup: false } };
  const tree = () => (
    <SessionContext value={session}>
      <PreferencesContext value={{ preferences, update, stored: true }}>
        <Toaster><SettingsBoard /></Toaster>
      </PreferencesContext>
    </SessionContext>
  );
  const { rerender } = render(tree());
  lastRerender = () => rerender(tree());
  return update;
}

let lastRerender = () => {};

afterEach(() => vi.restoreAllMocks());

describe("SettingsBoard", () => {
  test("lists every firmware setting exported from config.h", async () => {
    renderBoard("member");
    expect(await screen.findByText("Firmware defaults")).toBeDefined();
    for (const setting of firmware.settings) expect(screen.getByText(setting.description)).toBeDefined();
    expect(screen.queryByText(/provisional|decided/i)).toBeNull();
    const badges = [...document.querySelectorAll(".sc-firmware-table .sc-badge")].map((b) => b.textContent);
    expect(badges.filter((text) => text === "By radio")).toHaveLength(firmware.settings.filter((s) => s.change === "radio").length);
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

  test("a member changes remote settings; only the changed ones are sent", async () => {
    const send = vi.spyOn(api, "requestSettings").mockResolvedValue({ ok: true });
    renderBoard("member");
    const interval = await screen.findByLabelText("Reading interval");
    await userEvent.selectOptions(interval, "15");
    const humidity = screen.getByLabelText("Housing humidity alert");
    await userEvent.clear(humidity);
    await userEvent.type(humidity, "80");
    await userEvent.click(screen.getByRole("button", { name: "Send 2 changes" }));
    expect(send).toHaveBeenCalledWith(1, { sample_interval_min: 15, humidity_alert_pct: 80 });
  });

  test("a new transmit count asks first, showing battery life, and sends only on confirm", async () => {
    const send = vi.spyOn(api, "requestSettings").mockResolvedValue({ ok: true });
    renderBoard("member");
    await userEvent.selectOptions(await screen.findByLabelText("Transmits a day"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Send 1 change" }));
    expect(send).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Change SCOUT-01 to 1 a day?" })).toBeDefined();
    expect(screen.getByText("After · 1 a day")).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Change to 1 a day" }));
    expect(send).toHaveBeenCalledWith(1, { tx_count: 1 });
  });

  test("the hydrophone clip offers Off, and the radio never appears as a control", async () => {
    renderBoard("member");
    const clip = await screen.findByLabelText("Hydrophone clip");
    expect(screen.getAllByRole("option", { name: "Off" }).length).toBe(1);
    expect(clip).toBeDefined();
    expect(screen.queryByLabelText("Radio")).toBeNull();
  });

  test("a guest sees the buoy settings but cannot rename; the view-only note goes to the top bar", async () => {
    const setNote = vi.fn();
    vi.spyOn(api, "settings").mockResolvedValue(DATA);
    const session: Session = { csrf: "t", user: { id: "u", email: "u@scout.test", name: "U", role: "guest", hasPassword: true, github: false, google: false, selfSignup: false } };
    render(
      <SessionContext value={session}>
        <ViewOnlyNoteContext value={setNote}><Toaster><SettingsBoard /></Toaster></ViewOnlyNoteContext>
      </SessionContext>,
    );
    expect(((await screen.findByLabelText("Name in the console")) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Reading interval") as HTMLSelectElement).disabled).toBe(true);
    expect(screen.queryByText(/View only/)).toBeNull();
    expect(setNote).toHaveBeenCalledWith("View only: renaming a buoy or changing its settings needs the member role.");
  });

  test("each setting's description is a hover tooltip, still linked to its field for screen readers", async () => {
    renderBoard("member");
    const interval = await screen.findByLabelText("Reading interval");
    const tip = document.getElementById(interval.getAttribute("aria-describedby") ?? "");
    expect(tip?.classList.contains("sc-fieldset__tip")).toBe(true);
    expect(tip?.textContent).toContain("Default 30 min");
    expect(tip?.closest(".sc-fieldset--tip")?.contains(interval)).toBe(true);
  });

  test("the Account tab holds sign out, and ?tab=account opens it", async () => {
    window.history.replaceState(null, "", "/settings/?tab=account");
    renderBoard("member");
    expect(await screen.findByRole("button", { name: "Sign out" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Account" }).getAttribute("aria-selected")).toBe("true");
    window.history.replaceState(null, "", "/");
  });

  test("a link to ?tab=account switches tabs even when Settings is already open", async () => {
    window.history.replaceState(null, "", "/settings/");
    renderBoard("member");
    expect((await screen.findByRole("tab", { name: "Buoys" })).getAttribute("aria-selected")).toBe("true");
    window.history.replaceState(null, "", "/settings/?tab=account");
    lastRerender();
    expect(screen.getByRole("tab", { name: "Account" }).getAttribute("aria-selected")).toBe("true");
    window.history.replaceState(null, "", "/");
  });

  test("arrow keys move between tabs, and page settings apply through update", async () => {
    const update = renderBoard("guest");
    await userEvent.click(screen.getByRole("tab", { name: "Buoys" }));
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Account" }).getAttribute("aria-selected")).toBe("true");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "This browser" }).getAttribute("aria-selected")).toBe("true");
    expect((screen.getByRole("button", { name: "Light" })).getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(update).toHaveBeenCalledWith({ theme: "dark" });
    await userEvent.click(screen.getByRole("switch"));
    expect(update).toHaveBeenCalledWith({ shortcuts: true });
  });
});

describe("firmware table helpers", () => {
  test("a number keeps its unit and a code keeps its number", () => {
    expect(keepUnits("critical below 3.10 V")).toBe("critical below 3.10\u00a0V");
    expect(keepUnits("SF12 · CR 4/8")).toBe("SF12 · CR\u00a04/8");
  });

});
