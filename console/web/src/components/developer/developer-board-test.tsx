import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Role, Session, TokenList } from "@/lib/api/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { SessionContext } from "@/lib/session";
import { DeveloperBoard } from "./developer-board";

const LIST: TokenList = {
  tokens: [{ id: "t1", name: "notebook", scopes: "read:telemetry", created_at: 0, expires_at: Date.now() + 86400000, last_used_at: null, revoked_at: null }],
  scopes: ["read:telemetry", "write:settings"],
  expiryDays: [7, 30, 90, 365],
};

function renderBoard(role: Role) {
  vi.spyOn(api, "tokens").mockResolvedValue(LIST);
  const session: Session = { csrf: "t", user: { id: "u", email: "u@scout.test", name: "U", role, hasPassword: true, github: false, google: false, selfSignup: false } };
  render(
    <SessionContext value={session}>
      <PreferencesContext value={{ preferences: DEFAULT_PREFERENCES, update: vi.fn(), stored: true }}>
        <Toaster><DeveloperBoard /></Toaster>
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
    await userEvent.type(await screen.findByLabelText("Token name"), "laptop");
    await userEvent.click(screen.getByRole("checkbox", { name: /read:telemetry/ }));
    await userEvent.click(screen.getByRole("button", { name: /Create token/ }));
    expect(api.createToken).toHaveBeenCalledWith("laptop", ["read:telemetry"], 30);
    expect(await screen.findByText("sct_secret_value_123456789012345")).toBeDefined();
  });

  test("a guest sees the page but every control is off", async () => {
    renderBoard("guest");
    expect(await screen.findByText(/View only/)).toBeDefined();
    expect((screen.getByLabelText("Token name") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Create token/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  test("links the OpenAPI file", async () => {
    renderBoard("member");
    expect((await screen.findByRole("link", { name: /openapi.json/ })).getAttribute("href")).toBe("/api/v1/openapi.json");
  });
});
