import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import estimates from "../../../../worker/battery-life.json";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy, Estimates } from "@/lib/api/types";
import { BuoyBay } from "./buoy-bay";

const SLOTS = { "1": "00:10 UTC", "2": "00:10 and 16:10 UTC", "3": "00:10, 08:10 and 16:10 UTC" };

function buoy(overrides: Partial<Buoy> = {}): Buoy {
  return {
    buoy_id: 1, label: "SCOUT-01", tx_count_requested: 1, requested_by: "m@scout.test", requested_at: 0,
    tx_count_reported: 3, cmd_rejected: 0, reported_at: 0, last_seen_at: 0, clock_lost: 0, command_device_id: null, state: "pending", ...overrides,
  };
}

function renderBay(props: { buoy?: Buoy; canChange?: boolean; onChanged?: () => void } = {}) {
  return render(
    <Toaster>
      <BuoyBay buoy={props.buoy ?? buoy()} estimates={estimates as Estimates} slotLabels={SLOTS}
        canChange={props.canChange ?? true} onChanged={props.onChanged ?? vi.fn()} />
    </Toaster>,
  );
}

describe("BuoyBay", () => {
  test("shows requested vs reported and says it is pending, in words", () => {
    renderBay();
    expect(screen.getByText("Pending")).toBeDefined();
    expect(screen.getByText(/1 a day/, { selector: "dd" })).toBeDefined();
    expect(screen.getByText(/3 a day/, { selector: "dd" })).toBeDefined();
  });

  test("each option carries its slots; the two-cell battery estimate is said once, for the chosen count", () => {
    renderBay();
    expect(screen.getByText("00:10 and 16:10 UTC")).toBeDefined();
    expect(screen.getAllByText(/ mo$/)).toHaveLength(2);
    expect(screen.getByText("48.4 mo")).toBeDefined();
  });

  test("the request key sits after the options, not beside one", () => {
    renderBay();
    const options = screen.getByRole("group", { name: "Transmits a day" });
    const key = screen.getByRole("button", { name: /Request/ });
    expect(options.compareDocumentPosition(key) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(options.contains(key)).toBe(false);
  });

  test("a role that cannot change it sees every option disabled", () => {
    renderBay({ canChange: false });
    for (const radio of screen.getAllByRole("radio")) expect((radio as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Request/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  test("requesting a different count calls the API and reloads", async () => {
    const request = vi.spyOn(api, "requestTxCount").mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    renderBay({ onChanged });
    const key = screen.getByRole("button", { name: /Request 1 a day/ }) as HTMLButtonElement;
    expect(key.disabled).toBe(true);
    await userEvent.click(screen.getByRole("radio", { name: /2 a day/ }));
    await userEvent.click(screen.getByRole("button", { name: /Request 2 a day/ }));
    expect(request).toHaveBeenCalledWith(1, 2);
    expect(onChanged).toHaveBeenCalled();
    request.mockRestore();
  });

  test("a rejected command reads as rejected", () => {
    renderBay({ buoy: buoy({ state: "rejected", cmd_rejected: 1 }) });
    expect(screen.getByText("Rejected")).toBeDefined();
    expect(screen.getByText(/CMD_REJECTED/)).toBeDefined();
  });
});
