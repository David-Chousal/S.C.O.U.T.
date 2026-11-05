import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FirstContact } from "./first-contact";

describe("FirstContact", () => {
  test("listens until the device is heard, then says connected and stops asking", async () => {
    const heardAt = Date.now();
    const read = vi.fn<() => Promise<number | null>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValue(heardAt);
    const onHeard = vi.fn();
    render(<FirstContact read={read} onHeard={onHeard} intervalMs={10} waiting="Power it on." />);

    expect(screen.getByText(/Listening for first contact/)).toBeDefined();
    expect(await screen.findByText(/Connected/)).toBeDefined();
    expect(onHeard).toHaveBeenCalledWith(heardAt);

    const calls = read.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(read.mock.calls.length).toBe(calls);
  });

  test("a failed check keeps listening and says the console did not answer", async () => {
    const read = vi.fn<() => Promise<number | null>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(Date.now());
    render(<FirstContact read={read} intervalMs={10} waiting="Power it on." />);

    expect(await screen.findByText(/Connected/)).toBeDefined();
    expect(read.mock.calls.length).toBeGreaterThan(1);
  });
});
