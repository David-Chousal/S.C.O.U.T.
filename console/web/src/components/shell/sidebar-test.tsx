import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { initials, Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/team/",
  useRouter: () => ({ push: vi.fn() }),
}));

const user = { id: "u1", name: "David Chousal", email: "david@scout.test", role: "guest" as const, hasPassword: true, github: false, google: false, selfSignup: false };

describe("Sidebar", () => {
  beforeEach(() => {
    render(<Sidebar user={user} />);
  });

  test("lists the console's destinations in order", () => {
    const main = screen.getByRole("navigation", { name: "Main" });
    const names = [...main.querySelectorAll(".sc-nav a")].map((a) => a.textContent?.replace(/G .$/, ""));
    expect(names).toEqual(["Dashboard", "Fleet", "Stations", "Readings", "Reports", "Team", "Settings", "Developer", "Help"]);
  });

  test("marks the current page, trailing slash or not", () => {
    const current = screen.getByRole("navigation", { name: "Main" }).querySelector('[aria-current="page"]');
    expect(current?.textContent).toContain("Team");
  });

  test("puts the signed-in user first, as a link to Account, with no sign-out button", () => {
    const main = screen.getByRole("navigation", { name: "Main" });
    const profile = screen.getByRole("link", { name: "Account: David Chousal" });
    expect(main.firstElementChild).toBe(profile);
    expect(profile.getAttribute("href")).toMatch(/^\/account\/?$/);
    expect(screen.getByText("Guest · view only")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });
});

describe("phone bottom bar", () => {
  test("keeps to six destinations, leaving stations, reports, the developer page and help to the sidebar", () => {
    render(<Sidebar user={user} />);
    const compact = screen.getByRole("navigation", { name: "Main, compact" });
    expect([...compact.querySelectorAll("a")].map((a) => a.textContent)).toEqual(["Dashboard", "Fleet", "Readings", "Team", "Settings", "Account"]);
  });
});

describe("Sidebar while the session loads", () => {
  test("keeps the nav up and leaves out the profile card", () => {
    render(<Sidebar />);
    expect(screen.getByRole("navigation", { name: "Main" }).querySelectorAll(".sc-nav a")).toHaveLength(9);
    expect(screen.queryByRole("link", { name: /^Account:/ })).toBeNull();
  });
});

describe("initials", () => {
  test("come from the name, else the email", () => {
    expect(initials({ name: "Isabella Rodriguez", email: "" })).toBe("IR");
    expect(initials({ name: "", email: "john.ryan@scout.test" })).toBe("JR");
  });
});
