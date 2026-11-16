import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Reading } from "@/lib/api/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { PreferencesContext } from "@/lib/preferences-context";
import { HousingTile } from "./housing-tile";

const row = (hour: number, flags = ""): Reading => ({ record_seq: String(hour), timestamp_utc: `2026-11-10T${String(hour).padStart(2, "0")}:00:00Z`, flags, soh: "" });

describe("HousingTile", () => {
  test("names each buoy's seal from the humidity flags, and how often humidity ran high", () => {
    render(
      <PreferencesContext value={{ preferences: DEFAULT_PREFERENCES, update: vi.fn(), stored: true }}>
        <HousingTile multi buoys={[{ buoy_id: 1, label: "Reef north" }, { buoy_id: 2, label: "Lagoon test" }, { buoy_id: 3, label: "Spare" }]}
          readings={{ 1: [row(0), row(8)], 2: [row(0), row(8, "HUMIDITY_HIGH")] }} />
      </PreferencesContext>,
    );
    const tile = screen.getByRole("article", { name: "Housing seal" });
    expect(within(tile).getByText("Sealed")).toBeDefined();
    expect(within(tile).getByText("Never high in 2 readings")).toBeDefined();
    expect(within(tile).getByText("Humidity high")).toBeDefined();
    expect(within(tile).getByText(/High in 1 of 2 readings/)).toBeDefined();
    expect(within(tile).getByText("No readings")).toBeDefined();
  });
});
