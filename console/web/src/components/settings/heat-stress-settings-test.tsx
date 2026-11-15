import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";
import { HeatStressSettings, mmmOf, positionOf } from "./heat-stress-settings";

const BUOY = { buoy_id: 1, label: "SCOUT-01", latitude: null, longitude: null, mmm_c: null, mmm_source: null } as unknown as Buoy;

function renderPanel(buoy: Buoy = BUOY, canEdit = true) {
  const onSaved = vi.fn();
  render(<Toaster><HeatStressSettings buoy={buoy} canEdit={canEdit} onSaved={onSaved} /></Toaster>);
  return onSaved;
}

afterEach(() => vi.restoreAllMocks());

describe("HeatStressSettings", () => {
  test("says when no MMM is set", () => {
    renderPanel();
    expect(screen.getByText(/No MMM set/)).toBeDefined();
  });

  test("looks the MMM up from NOAA for the position typed in", async () => {
    const setMmm = vi.spyOn(api, "setMmm").mockResolvedValue({ ok: true });
    const onSaved = renderPanel();
    await userEvent.type(screen.getByLabelText(/Latitude/), "21.46");
    await userEvent.type(screen.getByLabelText(/Longitude/), "-157.79");
    await userEvent.click(screen.getByRole("button", { name: "Look up from NOAA" }));
    expect(setMmm).toHaveBeenCalledWith(1, { lookup: true, latitude: 21.46, longitude: -157.79 });
    expect(onSaved).toHaveBeenCalled();
  });

  test("saves an MMM typed by hand", async () => {
    const setMmm = vi.spyOn(api, "setMmm").mockResolvedValue({ ok: true });
    renderPanel();
    await userEvent.type(screen.getByLabelText(/MMM \(°C\)/), "27.6");
    await userEvent.click(screen.getByRole("button", { name: "Save MMM by hand" }));
    expect(setMmm).toHaveBeenCalledWith(1, { mmm_c: 27.6, latitude: null, longitude: null });
  });

  test("shows where a looked-up MMM came from", () => {
    renderPanel({ ...BUOY, mmm_c: 26.87, mmm_source: "noaa_crw_5km", mmm_cell_lat: 21.475, mmm_cell_lon: -157.775 } as Buoy);
    expect(screen.getByText(/MMM 26.87 °C, looked up from NOAA CRW's 5 km product \(cell 21.475, -157.775\)/)).toBeDefined();
    expect(screen.getByText(/Bleaching threshold 27.87 °C/)).toBeDefined();
  });

  test("a guest sees it but every control is disabled", () => {
    renderPanel({ ...BUOY, mmm_c: 27 } as Buoy, false);
    for (const name of ["Look up from NOAA", "Save MMM by hand", "Clear MMM"]) {
      expect((screen.getByRole("button", { name }) as HTMLButtonElement).disabled).toBe(true);
    }
    expect((screen.getByLabelText(/MMM \(°C\)/) as HTMLInputElement).disabled).toBe(true);
  });

  test("half a position, or a comma for a point, is refused before anything is sent", async () => {
    const setMmm = vi.spyOn(api, "setMmm").mockResolvedValue({ ok: true });
    renderPanel({ ...BUOY, mmm_c: 27 } as Buoy);
    await userEvent.type(screen.getByLabelText(/Latitude/), "21.46");
    await userEvent.click(screen.getByRole("button", { name: "Look up from NOAA" }));
    expect(await screen.findByText("Give both latitude and longitude, or neither.")).toBeDefined();
    await userEvent.clear(screen.getByLabelText(/Latitude/));
    await userEvent.clear(screen.getByLabelText(/MMM \(°C\)/));
    await userEvent.type(screen.getByLabelText(/MMM \(°C\)/), "27,6");
    await userEvent.click(screen.getByRole("button", { name: "Save MMM by hand" }));
    expect(await screen.findByText(/use a point, e.g. 27.6/)).toBeDefined();
    expect(setMmm).not.toHaveBeenCalled();
  });

  test("positionOf and mmmOf keep blanks as null and reject anything else out of shape", () => {
    expect(positionOf("", "")).toEqual({ latitude: null, longitude: null });
    expect(positionOf("21.46", "-157.79")).toEqual({ latitude: 21.46, longitude: -157.79 });
    expect(positionOf("21.46", "")).toMatch(/both/);
    expect(positionOf("95", "0")).toMatch(/Latitude/);
    expect(mmmOf("27.6")).toBe(27.6);
    for (const bad of ["", "27,6", "40"]) expect(typeof mmmOf(bad)).toBe("string");
  });
});
