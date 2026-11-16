/* Which shore station answers each buoy. The console decides (console/worker/routing.js, SCO-316):
 * an admin's pick, else the only active station, else the station that heard the buoy most in the
 * last 24 h. With two or more stations, a buoy neither pinned nor heard in 24 h has none. The UI shows
 * that decision; it does not redo it. */

import type { Buoy, Device, RouteReason } from "@/lib/api/types";

export const ROUTE_REASON: Record<RouteReason, string> = {
  picked: "picked",
  only_station: "the only station",
  heard_most: "hears it most",
};

/** The station that answers `buoy`, or null when none does. */
export function commandingStation(buoy: Pick<Buoy, "answering_station">, active: Device[]): Device | null {
  const id = buoy.answering_station?.device_id;
  return active.find((station) => station.id === id) ?? null;
}

/** The buoys each active station answers, and the buoys no station does. */
export function commandRoutes<B extends Pick<Buoy, "buoy_id" | "answering_station">>(buoys: B[], active: Device[]) {
  const byStation = new Map<string, B[]>(active.map((station) => [station.id, []]));
  const orphans: B[] = [];
  for (const buoy of buoys) {
    const station = commandingStation(buoy, active);
    if (station) byStation.get(station.id)!.push(buoy);
    else orphans.push(buoy);
  }
  return { byStation, orphans };
}
