import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { initials, TopBar } from "./top-bar";

vi.mock("next/navigation", () => ({ usePathname: () => "/team/" }));

const user = { id: "u1", name: "David Chousal", email: "david@scout.test", role: "guest" as const, hasPassword: true, github: false, google: false, selfSignup: false };

describe("TopBar", () => {
  test("carries the console's mark, the account as a link to Account, and the page title", () => {
    render(<TopBar title="Team" user={user} />);
    const bar = screen.getByRole("banner");
    expect(screen.getByRole("link", { name: /S\.C\.O\.U\.T\. Console/ }).getAttribute("href")).toMatch(/^\/dashboard\/?$/);
    expect(bar.querySelector(".sc-top__brand")?.textContent).not.toContain("S.C.O.U.T.");
    const account = screen.getByRole("link", { name: "Account: David Chousal" });
    expect(account.getAttribute("href")).toMatch(/^\/account\/?$/);
    expect(account.getAttribute("title")).toBe("Guest · view only");
    expect(screen.getByRole("heading", { level: 1, name: "Team" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  test("while the session loads, the bar shows without the account", () => {
    render(<TopBar title="Fleet" />);
    expect(screen.queryByRole("link", { name: /^Account:/ })).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Fleet" })).toBeDefined();
  });
});

describe("initials", () => {
  test("come from the name, else the email", () => {
    expect(initials({ name: "Isabella Rodriguez", email: "" })).toBe("IR");
    expect(initials({ name: "", email: "john.ryan@scout.test" })).toBe("JR");
  });
});
