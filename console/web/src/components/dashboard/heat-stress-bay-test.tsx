import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ALERT_LEVELS, type BuoyHeatStress, type HeatStressDay, type HeatStressView } from "@/lib/api/types";
import { DayChart } from "./day-chart";
import { HeatStressBay } from "./heat-stress-bay";

function days(n: number, sst: (i: number) => number | null, dhw: (i: number) => number): HeatStressDay[] {
  return Array.from({ length: n }, (_, i) => ({
    day: new Date(Date.UTC(2027, 2, 1) + i * 86400000).toISOString().slice(0, 10), sst: sst(i), hotspot: null, dhw: dhw(i),
    alert: "Bleaching Warning", level: 2, window_coverage: 1,
  }));
}

const series = days(30, (i) => (i === 12 ? null : 28 + i / 10), (i) => i / 4);
const hot: BuoyHeatStress = {
  buoy_id: 1, label: "Reef north", threshold_c: 28.5, samples_per_day: 3, note: null,
  mmm: { value_c: 27.5, source: "noaa_crw_5km", latitude: 21.46, longitude: -157.79, cell_latitude: 21.475, cell_longitude: -157.775, set_by: null, set_at: 1 },
  current: { ...series[29], alert: "Alert Level 2", level: 4, dhw: 9.2, days_old: 1 }, series,
  summary: { peak_dhw: 9.2, peak_dhw_day: series[29].day, peak_alert: "Alert Level 2", days: 30, days_at_or_above_threshold: 20 },
};
const unset: BuoyHeatStress = { buoy_id: 2, label: "Reef south", mmm: null, threshold_c: null, current: null, series: [], summary: null,
  note: "No MMM is set for this buoy, so heat stress cannot be computed." };
const VIEW: HeatStressView = { window_days: 84, alert_levels: [...ALERT_LEVELS], generated_at: "2027-03-31T00:00:00Z", buoys: [hot, unset] };

describe("HeatStressBay", () => {
  test("shows each buoy's alert level and DHW, and tells how to set a missing MMM", () => {
    render(<HeatStressBay view={VIEW} />);
    const row = screen.getByRole("row", { name: /Reef north/ });
    expect(within(row).getByText("Alert Level 2")).toBeDefined();
    expect(within(row).getByText("9.2")).toBeDefined();
    const missing = screen.getByRole("row", { name: /Reef south/ });
    expect(within(missing).getByText(/No MMM set/)).toBeDefined();
    expect(screen.getByText(/No MMM is set for this buoy/)).toBeDefined();
    expect(within(missing).getByRole("link", { name: "Open Settings → Buoys" }).getAttribute("href")).toMatch(/^\/settings\/?\?buoy=2$/);
  });

  test("draws the temperature with its MMM and MMM + 1 °C lines, and DHW with the Alert 1 floor", () => {
    const { container } = render(<HeatStressBay view={VIEW} />);
    expect(screen.getByRole("img", { name: /Reef north daily-mean water temperature/ })).toBeDefined();
    expect(screen.getByRole("img", { name: /Reef north Degree Heating Weeks/ })).toBeDefined();
    const labels = [...container.querySelectorAll(".sc-heat-ref text")].map((t) => t.textContent);
    expect(labels).toEqual(expect.arrayContaining(["MMM 27.50", "MMM + 1 °C", "Alert 1 · 4", "Alert 2 · 8"]));
    expect(container.querySelectorAll(".sc-heat-ref--annotation").length).toBeGreaterThanOrEqual(3);
  });

  test("a missing day lifts the pen, and the table view lists it as a dash", () => {
    const { container } = render(<HeatStressBay view={VIEW} />);
    const temperature = container.querySelectorAll(".sc-trace__line")[0].getAttribute("d") ?? "";
    expect(temperature.match(/M/g)?.length).toBe(2);
    const table = container.querySelectorAll("details table")[0];
    expect(within(table as HTMLElement).getByRole("row", { name: /2027-03-13 —/ })).toBeDefined();
  });

  test("the legend names every CRW level", async () => {
    render(<HeatStressBay view={VIEW} />);
    await userEvent.click(screen.getByText("Alert levels (NOAA Coral Reef Watch)"));
    const legend = screen.getByRole("list", { name: "Bleaching alert levels" });
    for (const level of ALERT_LEVELS) expect(within(legend).getByText(level)).toBeDefined();
  });

  test("says when heat stress is loading or failed", () => {
    const { rerender } = render(<HeatStressBay view={undefined} />);
    expect(screen.getByText("Working out heat stress…")).toBeDefined();
    rerender(<HeatStressBay view={null} />);
    expect(screen.getByText(/could not be loaded/)).toBeDefined();
  });

  test("a chart that starts empty starts measuring its width once its points arrive", () => {
    const observed: Element[] = [];
    vi.stubGlobal("ResizeObserver", class { observe(element: Element) { observed.push(element); } disconnect() {} });
    const props = { label: "DHW", unit: "°C-wk", color: "var(--ink)", references: [], digits: 1, ariaLabel: "DHW chart" };
    const { rerender } = render(<DayChart {...props} points={[{ day: "2027-03-01", value: null }]} />);
    expect(observed.length).toBe(0);
    rerender(<DayChart {...props} points={[{ day: "2027-03-01", value: 1 }, { day: "2027-03-02", value: 2 }]} />);
    expect(observed.length).toBe(1);
  });
});

afterEach(() => vi.unstubAllGlobals());
