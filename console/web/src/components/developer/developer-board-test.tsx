import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import { ViewOnlyNoteContext } from "@/lib/view-only-note";
import type { Role, Session, TokenList } from "@/lib/api/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { SessionContext } from "@/lib/session";
import { DeveloperBoard } from "./developer-board";

const LIST: TokenList = {
  tokens: [{ id: "t1", name: "notebook", scopes: "read:telemetry", created_at: 0, expires_at: Date.now() + 86400000, last_used_at: null, revoked_at: null }],
  scopes: ["read:telemetry", "write:settings"],
  expiryDays: [7, 30, 90, 365, 0],
};

function renderBoard(role: Role, setNote = vi.fn()) {
  vi.spyOn(api, "tokens").mockResolvedValue(LIST);
  const session: Session = { csrf: "t", user: { id: "u", email: "u@scout.test", name: "U", role, hasPassword: true, github: false, google: false, selfSignup: false } };
  render(
    <SessionContext value={session}>
      <PreferencesContext value={{ preferences: DEFAULT_PREFERENCES, update: vi.fn(), stored: true }}>
        <ViewOnlyNoteContext value={setNote}><Toaster><DeveloperBoard /></Toaster></ViewOnlyNoteContext>
      </PreferencesContext>
    </SessionContext>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("DeveloperBoard", () => {
  test("lists your tokens with their scopes", async () => {
    renderBoard("member");
    expect(await screen.findByText("notebook")).toBeDefined();
    expect(screen.getAllByText(/read:telemetry/).length).toBeGreaterThan(0);
  });

  test("a new token is shown once, in full", async () => {
    vi.spyOn(api, "createToken").mockResolvedValue({ token: "sct_secret_value_123456789012345", id: "t2" });
    renderBoard("member");
    await userEvent.click(await screen.findByRole("button", { name: "New token" }));
    expect(screen.getByRole("dialog", { name: "New API token" })).toBeDefined();
    await userEvent.type(screen.getByLabelText("Token name"), "laptop");
    await userEvent.click(screen.getByRole("checkbox", { name: /read:telemetry/ }));
    await userEvent.click(screen.getByRole("button", { name: /Create token/ }));
    expect(api.createToken).toHaveBeenCalledWith("laptop", ["read:telemetry"], 30);
    expect(await screen.findByText("sct_secret_value_123456789012345")).toBeDefined();
    expect(screen.queryByRole("dialog", { name: "New API token" })).toBeNull();
  });

  test("the form lives in the card, not on the page; Escape in its dropdown closes only the list", async () => {
    renderBoard("member");
    await screen.findByText("notebook");
    expect(screen.queryByLabelText("Token name")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "New token" }));
    await userEvent.click(screen.getByLabelText("Expires after"));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("dialog", { name: "New API token" })).toBeDefined();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "New API token" })).toBeNull();
  });

  test("a token can be made to never expire", async () => {
    vi.spyOn(api, "createToken").mockResolvedValue({ token: "sct_secret_value_123456789012345", id: "t2" });
    renderBoard("member");
    await userEvent.click(await screen.findByRole("button", { name: "New token" }));
    await userEvent.type(screen.getByLabelText("Token name"), "station");
    await userEvent.click(screen.getByLabelText("Expires after"));
    await userEvent.click(screen.getByRole("option", { name: "Never" }));
    await userEvent.click(screen.getByRole("checkbox", { name: /read:telemetry/ }));
    await userEvent.click(screen.getByRole("button", { name: /Create token/ }));
    expect(api.createToken).toHaveBeenCalledWith("station", ["read:telemetry"], 0);
  });

  test("a guest sees the page but every control is off", async () => {
    const setNote = vi.fn();
    renderBoard("guest", setNote);
    expect(((await screen.findByRole("button", { name: "New token" })) as HTMLButtonElement).disabled).toBe(true);
    expect(setNote).toHaveBeenCalledWith("View only: making API tokens needs the member role.");
    expect(screen.queryByText(/View only/)).toBeNull();
  });

  test("links the OpenAPI file", async () => {
    renderBoard("member");
    expect((await screen.findByRole("link", { name: /openapi.json/ })).getAttribute("href")).toBe("/api/v1/openapi.json");
  });
});
