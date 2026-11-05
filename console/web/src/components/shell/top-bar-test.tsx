import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { initials } from "./account-menu";
import { TopBar } from "./top-bar";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => "/team/", useRouter: () => ({ replace }) }));

const user = { id: "u1", name: "David Chousal", email: "david@scout.test", role: "guest" as const, hasPassword: true, github: false, google: false, selfSignup: false };

function renderBar(update = vi.fn()) {
  render(
    <PreferencesContext value={{ preferences: DEFAULT_PREFERENCES, update, stored: true }}>
      <TopBar user={user} />
    </PreferencesContext>,
  );
  return update;
}

afterEach(() => vi.restoreAllMocks());

describe("TopBar", () => {
  test("holds the mark, the account and Ask Fred, but no page title", () => {
    renderBar();
    expect(screen.getByRole("link", { name: /S\.C\.O\.U\.T\. Console/ }).getAttribute("href")).toMatch(/^\/dashboard\/?$/);
    expect(screen.getByRole("button", { name: "Account: David Chousal" })).toBeDefined();
    expect((screen.getByRole("button", { name: /Ask Fred/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  test("the account menu changes appearance and time, links to account settings, and signs out", async () => {
    vi.spyOn(api, "signOut").mockResolvedValue({ ok: true });
    const update = renderBar();
    await userEvent.click(screen.getByRole("button", { name: "Account: David Chousal" }));
    const panel = screen.getByRole("dialog", { name: "Account" });
    expect(panel.textContent).toContain("Guest · view only");
    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(update).toHaveBeenCalledWith({ theme: "dark" });
    await userEvent.click(screen.getByRole("button", { name: "My time zone" }));
    expect(update).toHaveBeenCalledWith({ time: "local" });
    expect(screen.getByRole("link", { name: /Account settings/ }).getAttribute("href")).toMatch(/\?tab=account$/);
    await userEvent.click(screen.getByRole("button", { name: /Sign out/ }));
    expect(api.signOut).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/login/");
  });

  test("Escape closes the account menu", async () => {
    renderBar();
    await userEvent.click(screen.getByRole("button", { name: "Account: David Chousal" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Account" })).toBeNull();
  });
});

describe("initials", () => {
  test("come from the name, else the email", () => {
    expect(initials({ name: "Isabella Rodriguez", email: "" })).toBe("IR");
    expect(initials({ name: "", email: "john.ryan@scout.test" })).toBe("JR");
  });
});
