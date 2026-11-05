import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/team/",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    render(<Sidebar />);
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
});

describe("phone bottom bar", () => {
  test("keeps to six destinations, leaving stations, reports, the developer page and help to the sidebar", () => {
    render(<Sidebar />);
    const compact = screen.getByRole("navigation", { name: "Main, compact" });
    expect([...compact.querySelectorAll("a")].map((a) => a.textContent)).toEqual(["Dashboard", "Fleet", "Readings", "Team", "Settings", "Account"]);
  });
});
