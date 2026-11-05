import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import firmware from "../../../../worker/buoy-config.json";
import type { Buoy, RemoteSetting } from "@/lib/api/types";
import { BuoyOverview, changedSummary } from "./buoy-overview";

const REMOTE = firmware.remote as RemoteSetting[];
const DEFAULTS = REMOTE.map((s) => s.default);

function buoy(id: number, wanted = DEFAULTS, state: Buoy["settings_state"] = "default"): Buoy {
  return {
    buoy_id: id, label: `SCOUT-0${id}`, tx_count_requested: null, requested_by: null, requested_at: null,
    tx_count_reported: 3, cmd_rejected: 0, reported_at: 0, last_seen_at: 0, clock_lost: 0, command_device_id: null, state: "default",
    settings_requested: {}, settings_wanted: wanted, settings_digest_wanted: "e674", settings_digest_reported: "e674",
    settings_state: state,
  };
}

describe("BuoyOverview", () => {
  test("names what differs from the defaults, or says all defaults", () => {
    expect(changedSummary(buoy(1), REMOTE)).toBe("All defaults");
    const humid = DEFAULTS.map((v, i) => (REMOTE[i].key === "humidity_alert_pct" ? 80 : v));
    expect(changedSummary(buoy(1, humid), REMOTE)).toBe("Housing humidity alert 80 %RH");
  });

  test("marks the picked buoy and picks another on click", async () => {
    const onSelect = vi.fn();
    render(<BuoyOverview buoys={[buoy(1), buoy(2, DEFAULTS, "pending")]} remote={REMOTE} selected={1} onSelect={onSelect} />);
    expect(screen.getByRole("button", { name: "SCOUT-01" }).getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "SCOUT-02" }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
