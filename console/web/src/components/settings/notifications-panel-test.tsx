import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { AlertsView, Fleet, Role, Session } from "@/lib/api/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { SessionContext } from "@/lib/session";
import { NotificationsPanel } from "./notifications-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/settings/",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const VIEW: AlertsView = {
  enabled: true,
  email: "u@scout.test",
  rules: [{ id: "r1", buoy_id: 1, kind: "threshold", metric: "battery_v", op: "below", value: 3.2, remind_hours: null, enabled: true,
    description: "Battery below 3.2 V", firing: true }],
  history: [
    { id: 2, rule_id: "r1", buoy_id: 1, at: Date.UTC(2026, 10, 6, 8, 10), kind: "alert", summary: "SCOUT-01: Battery below 3.2 V · 3.1 V", status: "rate_limited", reason: "your daily cap of 10" },
    { id: 1, rule_id: "r1", buoy_id: 1, at: Date.UTC(2026, 10, 6, 0, 10), kind: "alert", summary: "SCOUT-01: Battery below 3.2 V · 3.15 V", status: "sent", reason: null },
  ],
  caps: { person: 10, total: 30, sentToday: 10, cappedToday: 1 },
  metrics: [{ key: "temp_c", label: "Water temperature", unit: "°C" }, { key: "battery_v", label: "Battery", unit: "V" },
    { key: "internal_humidity_pct", label: "Housing humidity", unit: "%" }],
  flags: [{ key: "HUMIDITY_HIGH", label: "Housing humidity high" }, { key: "RTC_LOST", label: "Clock lost" }],
  presets: [
    { id: "battery-low", label: "Battery low", kind: "threshold", metric: "battery_v", op: "below", value: 3.2, source: "The firmware's default conserve threshold." },
    { id: "humidity-high", label: "Housing humidity high", kind: "threshold", metric: "internal_humidity_pct", op: "above", value: 70, source: "Placeholder until SCO-204." },
    { id: "water-warm", label: "Water temperature above", kind: "threshold", metric: "temp_c", op: "above", value: null, source: "The repo has no canonical temperature limit, so set your own." },
    { id: "buoy-silent", label: "Buoy silent", kind: "silence", metric: null, op: null, value: null, source: "No canonical number. Set your own." },
  ],
};

const FLEET = { buoys: [{ buoy_id: 1, label: "SCOUT-01" }, { buoy_id: 2, label: "SCOUT-02", disconnected_at: 5 }] } as unknown as Fleet;

function renderPanel(role: Role = "member", view: AlertsView = VIEW) {
  vi.spyOn(api, "alerts").mockResolvedValue(view);
  vi.spyOn(api, "fleet").mockResolvedValue(FLEET);
  const session: Session = { csrf: "t", user: { id: "u", email: "u@scout.test", name: "U", role, hasPassword: true, github: false, google: false, selfSignup: false } };
  render(
    <SessionContext value={session}>
      <PreferencesContext value={{ preferences: DEFAULT_PREFERENCES, update: vi.fn(), stored: true }}>
        <Toaster><NotificationsPanel /></Toaster>
      </PreferencesContext>
    </SessionContext>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("NotificationsPanel", () => {
  test("shows the master switch, the account email, the cap note and the history", async () => {
    renderPanel();
    expect(await screen.findByText("Sent to u@scout.test")).toBeDefined();
    expect((screen.getByRole("switch", { name: /Email me when/ }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText(/1 alert today hit a daily email cap/)).toBeDefined();
    expect(screen.getByText("Not emailed: your daily cap of 10")).toBeDefined();
    expect(screen.getByText("Cap reached")).toBeDefined();
    expect(screen.getByText("Firing")).toBeDefined();
  });

  test("the master switch turns alerts off", async () => {
    const toggle = vi.spyOn(api, "setAlertsEnabled").mockResolvedValue({ enabled: false });
    renderPanel();
    await userEvent.click(await screen.findByRole("switch", { name: /Email me when/ }));
    expect(toggle).toHaveBeenCalledWith(false);
  });

  test("a preset fills in the firmware number and saves as a rule", async () => {
    const create = vi.spyOn(api, "createAlertRule").mockResolvedValue({ id: "r2" });
    renderPanel();
    await userEvent.click(await screen.findByRole("button", { name: "Housing humidity high" }));
    expect((screen.getByLabelText("Value in %") as HTMLInputElement).value).toBe("70");
    expect(screen.getByText("Placeholder until SCO-204.")).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Add alert" }));
    expect(create).toHaveBeenCalledWith({ buoy_id: null, remind_hours: null, kind: "threshold", metric: "internal_humidity_pct", op: "above", value: 70 });
  });

  test("a preset with no canonical number leaves the value empty and says so", async () => {
    const create = vi.spyOn(api, "createAlertRule");
    renderPanel();
    await userEvent.click(await screen.findByRole("button", { name: "Water temperature above" }));
    expect((screen.getByLabelText("Value in °C") as HTMLInputElement).value).toBe("");
    expect(screen.getByText(/no canonical temperature limit/)).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Add alert" }));
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByText("Give the value to compare against.")).toBeDefined();
  });

  test("builds a silence rule for one buoy with a reminder; disconnected buoys are not offered", async () => {
    const create = vi.spyOn(api, "createAlertRule").mockResolvedValue({ id: "r3" });
    renderPanel();
    await userEvent.click(await screen.findByLabelText("Buoy"));
    expect(screen.queryByRole("option", { name: "SCOUT-02" })).toBeNull();
    await userEvent.click(screen.getByRole("option", { name: "SCOUT-01" }));
    await userEvent.click(screen.getByLabelText("Alert when"));
    await userEvent.click(screen.getByRole("option", { name: "The buoy goes quiet" }));
    await userEvent.type(screen.getByLabelText("Quiet hours"), "18");
    await userEvent.type(screen.getByLabelText("Remind every (hours)"), "12");
    await userEvent.click(screen.getByRole("button", { name: "Add alert" }));
    expect(create).toHaveBeenCalledWith({ buoy_id: 1, remind_hours: 12, kind: "silence", metric: null, op: null, value: 18 });
  });

  test("builds a flag rule", async () => {
    const create = vi.spyOn(api, "createAlertRule").mockResolvedValue({ id: "r4" });
    renderPanel();
    await userEvent.click(await screen.findByLabelText("Alert when"));
    await userEvent.click(screen.getByRole("option", { name: "A firmware flag appears" }));
    await userEvent.click(screen.getByLabelText("Flag"));
    await userEvent.click(screen.getByRole("option", { name: "Clock lost · RTC_LOST" }));
    await userEvent.click(screen.getByRole("button", { name: "Add alert" }));
    expect(create).toHaveBeenCalledWith({ buoy_id: null, remind_hours: null, kind: "flag", metric: "RTC_LOST", op: null, value: null });
  });

  test("a rule can be switched off, edited and deleted", async () => {
    const update = vi.spyOn(api, "updateAlertRule").mockResolvedValue({ ok: true });
    const remove = vi.spyOn(api, "deleteAlertRule").mockResolvedValue({ ok: true });
    renderPanel();
    const row = (await screen.findByText("Battery below 3.2 V", { selector: "strong" })).closest("tr") as HTMLElement;
    await userEvent.click(within(row).getByRole("switch"));
    expect(update).toHaveBeenCalledWith("r1", { enabled: false });
    await userEvent.click(within(row).getByRole("button", { name: "Edit Battery below 3.2 V" }));
    const value = screen.getByLabelText("Value in V");
    await userEvent.clear(value);
    await userEvent.type(value, "3.1");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(update).toHaveBeenLastCalledWith("r1", { buoy_id: 1, remind_hours: null, kind: "threshold", metric: "battery_v", op: "below", value: 3.1 });
    await userEvent.click(within(row).getByRole("button", { name: "Delete Battery below 3.2 V" }));
    expect(remove).toHaveBeenCalledWith("r1");
  });

  test("Send test email sends to the account and says so", async () => {
    const send = vi.spyOn(api, "testAlert").mockResolvedValue({ delivery: "sent" });
    renderPanel();
    await userEvent.click(await screen.findByRole("button", { name: "Send test email" }));
    expect(send).toHaveBeenCalled();
    expect(await screen.findByText("Test email sent")).toBeDefined();
  });

  test("a guest sees why alerts are not available, and every control is disabled", async () => {
    renderPanel("guest", { ...VIEW, enabled: false, rules: [], history: [], caps: { ...VIEW.caps, cappedToday: 0 } });
    expect(await screen.findByText(/Guests can.t have email alerts/)).toBeDefined();
    expect((screen.getByRole("switch", { name: /Email me when/ }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Send test email" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Add alert" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Battery low" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
