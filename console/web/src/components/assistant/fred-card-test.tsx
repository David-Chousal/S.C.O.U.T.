import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import { ApiError, type FredCard } from "@/lib/api/types";
import { DATA_CHANGED } from "@/lib/data-changed";
import { FredConfirmCard } from "./fred-card";

const NOW = Date.parse("2026-11-05T12:00:00Z");
const card: FredCard = { id: "a1", kind: "settings", title: "Change Reef north's settings",
  details: [["Transmits a day", "3 → 2"], ["Sends at", "00:10, 16:10 UTC"]], expiresAt: NOW + 10 * 60000 };

afterEach(() => vi.restoreAllMocks());

describe("FredConfirmCard", () => {
  test("shows the effect and the time left; Confirm runs it", async () => {
    const confirm = vi.spyOn(api, "confirmFred").mockResolvedValue({ message: "Requested." });
    render(<FredConfirmCard card={card} now={NOW} />);
    expect(screen.getByText("00:10, 16:10 UTC")).toBeDefined();
    expect(screen.getByText("Expires in 10 min")).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(confirm).toHaveBeenCalledWith("a1");
    expect(screen.getByRole("status").textContent).toContain("Requested.");
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
  });

  test("a confirmed change tells the page to reload; a declined one does not", async () => {
    vi.spyOn(api, "confirmFred").mockResolvedValue({ message: "Requested." });
    vi.spyOn(api, "declineFred").mockResolvedValue({ ok: true });
    const heard = vi.fn();
    window.addEventListener(DATA_CHANGED, heard);
    const { unmount } = render(<FredConfirmCard card={card} now={NOW} />);
    await userEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(heard).not.toHaveBeenCalled();
    unmount();
    render(<FredConfirmCard card={{ ...card, id: "a2" }} now={NOW} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(heard).toHaveBeenCalledTimes(1);
    window.removeEventListener(DATA_CHANGED, heard);
  });

  test("Decline drops it and changes nothing", async () => {
    const decline = vi.spyOn(api, "declineFred").mockResolvedValue({ ok: true });
    render(<FredConfirmCard card={card} now={NOW} />);
    await userEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(decline).toHaveBeenCalledWith("a1");
    expect(screen.getByText(/Declined. Nothing changed/)).toBeDefined();
  });

  test("an expired card offers no Confirm", () => {
    render(<FredConfirmCard card={{ ...card, expiresAt: NOW - 1 }} now={NOW} />);
    expect(screen.getByText(/Expired/)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
  });

  test("a refusal from the server is shown and Confirm stays available", async () => {
    vi.spyOn(api, "confirmFred").mockRejectedValue(new ApiError(403, "Your role can view this but not change it."));
    render(<FredConfirmCard card={card} now={NOW} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByRole("alert").textContent).toContain("Your role");
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDefined();
  });

  test("a report card links to the CSV once made", async () => {
    vi.spyOn(api, "confirmFred").mockResolvedValue({ message: "Report ready.", link: "/api/reports/r1/file?t=x" });
    render(<FredConfirmCard card={{ ...card, kind: "report" }} now={NOW} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByRole("link", { name: "Download CSV" }).getAttribute("href")).toBe("/api/reports/r1/file?t=x");
  });
});
