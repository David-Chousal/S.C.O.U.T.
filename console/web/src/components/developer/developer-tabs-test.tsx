import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Session } from "@/lib/api/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { SessionContext } from "@/lib/session";
import { DeveloperTabs } from "./developer-tabs";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));

function renderTabs() {
  vi.spyOn(api, "tokens").mockResolvedValue({ tokens: [], scopes: ["read:telemetry"], expiryDays: [30, 0] });
  vi.spyOn(api, "audit").mockResolvedValue({ entries: [] });
  const session: Session = { csrf: "t", user: { id: "u", email: "u@scout.test", name: "U", role: "member", hasPassword: true, github: false, google: false, selfSignup: false } };
  render(
    <SessionContext value={session}>
      <PreferencesContext value={{ preferences: DEFAULT_PREFERENCES, update: vi.fn(), stored: true }}>
        <Toaster><DeveloperTabs /></Toaster>
      </PreferencesContext>
    </SessionContext>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("DeveloperTabs", () => {
  test("opens on API tokens", async () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: "API tokens" }).getAttribute("aria-selected")).toBe("true");
    expect(await screen.findByText("Your API tokens")).toBeDefined();
  });

  test("the Audit log tab shows the log and puts ?tab=audit in the address", async () => {
    renderTabs();
    await userEvent.click(screen.getByRole("tab", { name: "Audit log" }));
    expect(await screen.findByText("Changes")).toBeDefined();
    expect(window.location.search).toBe("?tab=audit");
  });

  test("?tab=audit opens straight on the log", async () => {
    window.history.replaceState(null, "", "/developer/?tab=audit");
    renderTabs();
    expect(await screen.findByText("Changes")).toBeDefined();
  });
});
