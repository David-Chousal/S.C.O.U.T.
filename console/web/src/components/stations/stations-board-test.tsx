import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import estimates from "../../../../worker/battery-life.json";
import firmware from "../../../../worker/buoy-config.json";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { BuoySettings, Role, Session } from "@/lib/api/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { SessionContext } from "@/lib/session";
import { StationsBoard } from "./stations-board";

const SETTINGS = { buoys: [], firmware, estimates } as unknown as BuoySettings;
const DEVICES = {
  devices: [
    { id: "a", name: "Kaneohe shore", created_at: 0, revoked_at: null, last_seen_at: Date.now() },
    { id: "b", name: "Old pier", created_at: 0, revoked_at: 1, last_seen_at: null },
  ],
};

function renderBoard(role: Role) {
  vi.spyOn(api, "settings").mockResolvedValue(SETTINGS);
  vi.spyOn(api, "devices").mockResolvedValue(DEVICES);
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
  test("an active token can be revoked; a revoked one has a delete key that deletes it", async () => {
    const remove = vi.spyOn(api, "deleteDevice").mockResolvedValue({ ok: true });
    renderBoard("admin");
    expect(await screen.findByRole("button", { name: "Hold to revoke Kaneohe shore's token" })).toBeDefined();
    expect(screen.queryByRole("button", { name: /Delete Kaneohe/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Delete Old pier's revoked token" }));
    expect(remove).toHaveBeenCalledWith("b");
  });

  test("New token opens a dialog; non-admins see it disabled", async () => {
    renderBoard("admin");
    await userEvent.click(await screen.findByRole("button", { name: "New token" }));
    expect(screen.getByRole("dialog", { name: "New shore station token" })).toBeDefined();
  });

  test("a member sees the delete key disabled", async () => {
    renderBoard("member");
    expect(((await screen.findByRole("button", { name: "Delete Old pier's revoked token" })) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "New token" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
