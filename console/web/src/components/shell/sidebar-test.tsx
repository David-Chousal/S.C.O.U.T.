import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { initials, Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/team/",
  useRouter: () => ({ push: vi.fn() }),
}));

const user = { id: "u1", name: "David Chousal", email: "david@scout.test", role: "guest" as const, hasPassword: true, github: false, google: false };

describe("Sidebar", () => {
  beforeEach(() => {
    render(<Sidebar user={user} onSignOut={vi.fn()} />);
  });

  test("lists the console's five destinations in order", () => {
    const main = screen.getByRole("navigation", { name: "Main" });
    const names = [...main.querySelectorAll(".sc-nav a")].map((a) => a.textContent?.replace(/G .$/, ""));
    expect(names).toEqual(["Fleet", "Stations", "Team", "Audit log", "Settings", "Account"]);
  });

  test("marks the current page, trailing slash or not", () => {
    const current = screen.getByRole("navigation", { name: "Main" }).querySelector('[aria-current="page"]');
    expect(current?.textContent).toContain("Team");
  });

  test("shows the signed-in user and says a guest is view only", () => {
    expect(screen.getByText("David Chousal")).toBeDefined();
    expect(screen.getByText("Guest · view only")).toBeDefined();
  });
});

describe("initials", () => {
  test("come from the name, else the email", () => {
    expect(initials({ name: "Isabella Rodriguez", email: "" })).toBe("IR");
    expect(initials({ name: "", email: "john.ryan@scout.test" })).toBe("JR");
  });
});
