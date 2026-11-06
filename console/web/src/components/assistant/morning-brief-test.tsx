import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { api } from "@/lib/api/client";
import { MorningBrief } from "./morning-brief";

afterEach(() => vi.restoreAllMocks());

describe("MorningBrief", () => {
  test("shows today's brief with where it came from", async () => {
    vi.spyOn(api, "fredBrief").mockResolvedValue({ brief: { day: "2026-11-05", text: "1 thing to look at:\n- Reef south is silent.", provider: "facts", created_at: Date.now() } });
    render(<MorningBrief />);
    expect(await screen.findByRole("heading", { name: "Morning brief" })).toBeDefined();
    expect(screen.getByText("Reef south is silent.")).toBeDefined();
    expect(screen.getByText(/facts only/)).toBeDefined();
  });

  test("shows nothing when there is no brief or it fails to load", async () => {
    vi.spyOn(api, "fredBrief").mockRejectedValue(new Error("down"));
    const { container } = render(<MorningBrief />);
    await Promise.resolve();
    expect(container.textContent).toBe("");
  });
});
