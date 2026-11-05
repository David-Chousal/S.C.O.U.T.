import { describe, expect, test } from "vitest";
import type { Device } from "@/lib/api/types";
import { commandingStation, commandRoutes } from "./command-routes";

const station = (id: string): Device => ({ id, name: id, created_at: 0, revoked_at: null, last_seen_at: null });

describe("command routes", () => {
  test("a lone active station commands every unpicked buoy", () => {
    expect(commandingStation({ command_device_id: null }, [station("a")])?.id).toBe("a");
  });

  test("with two stations, a pick wins and an unpicked buoy has none", () => {
    const active = [station("a"), station("b")];
    const routes = commandRoutes([{ buoy_id: 1, command_device_id: "b" }, { buoy_id: 2, command_device_id: null }], active);
    expect(routes.byStation.get("b")!.map((b) => b.buoy_id)).toEqual([1]);
    expect(routes.byStation.get("a")).toEqual([]);
    expect(routes.orphans.map((b) => b.buoy_id)).toEqual([2]);
  });
});
