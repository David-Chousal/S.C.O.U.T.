import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { AlertOffForm } from "./alert-off-form";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("AlertOffForm", () => {
  test("opening the link changes nothing; the key turns the one alert off", async () => {
    window.history.replaceState(null, "", "/alerts/off/?token=abcdefghijklmnopqrstuvwxyz");
    vi.spyOn(api, "alertOffInfo").mockResolvedValue({ description: "Battery below 3.2 V", buoy_id: 1 });
    const off = vi.spyOn(api, "alertOff").mockResolvedValue({ description: "Battery below 3.2 V" });
    render(<AlertOffForm />);
    expect(await screen.findByText("Turn off this alert?")).toBeDefined();
    expect(off).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Turn this alert off" }));
    expect(off).toHaveBeenCalledWith("abcdefghijklmnopqrstuvwxyz");
    expect(await screen.findByText("Alert turned off")).toBeDefined();
  });

  test("a used or expired link says so", async () => {
    window.history.replaceState(null, "", "/alerts/off/?token=abcdefghijklmnopqrstuvwxyz");
    vi.spyOn(api, "alertOffInfo").mockRejectedValue(new ApiError(410, "This link has expired or was already used."));
    render(<AlertOffForm />);
    expect(await screen.findByText("This link has expired or was already used.")).toBeDefined();
  });
});
