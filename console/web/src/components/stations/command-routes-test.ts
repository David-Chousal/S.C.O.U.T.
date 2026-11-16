import { describe, expect, test } from "vitest";
import type { Device } from "@/lib/api/types";
import { commandingStation, commandRoutes } from "./command-routes";

const station = (id: string): Device => ({ id, name: id, created_at: 0, revoked_at: null, last_seen_at: null, wifi_setup_requested_at: null, heard: [] });

describe("command routes", () => {
  test("the station the console names answers the buoy", () => {
    const buoy = { answering_station: { device_id: "a", name: "a", reason: "only_station" as const } };
    expect(commandingStation(buoy, [station("a")])?.id).toBe("a");
  });

  test("a buoy no station answers is an orphan, and a revoked station answers nothing", () => {
    const active = [station("a"), station("b")];
    const routes = commandRoutes([
      { buoy_id: 1, answering_station: { device_id: "b", name: "b", reason: "heard_most" as const } },
      { buoy_id: 2, answering_station: null },
      { buoy_id: 3, answering_station: { device_id: "gone", name: "gone", reason: "picked" as const } },
    ], active);
    expect(routes.byStation.get("b")!.map((b) => b.buoy_id)).toEqual([1]);
    expect(routes.byStation.get("a")).toEqual([]);
    expect(routes.orphans.map((b) => b.buoy_id)).toEqual([2, 3]);
  });
});
