import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { HelpGuide } from "./help-guide";

describe("HelpGuide", () => {
  test("covers connecting a shore station and a buoy", () => {
    render(<HelpGuide />);
    expect(screen.getByRole("heading", { name: "Connect a shore station" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Add a buoy" })).toBeDefined();
  });

  test("every contents link points at a section on the page", () => {
    const { container } = render(<HelpGuide />);
    const links = [...container.querySelectorAll(".sc-help-toc a")];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(container.querySelector(link.getAttribute("href") ?? "#none")).not.toBeNull();
  });
});
