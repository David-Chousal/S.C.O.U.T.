/* Which shore station sends each buoy's commands. A buoy's pick wins while that station is active;
 * with no pick, the only active station sends them, and with two or more active stations an
 * unpicked buoy gets no commands (two stations answering in its 1 s window would collide). This
 * mirrors wantedForDevice in console/worker/fleet.js. */

import type { Buoy, Device } from "@/lib/api/types";

/** The station that sends `buoy`'s commands, or null when none does. */
export function commandingStation(buoy: Pick<Buoy, "command_device_id">, active: Device[]): Device | null {
  const picked = active.find((station) => station.id === buoy.command_device_id);
  if (picked) return picked;
  return active.length === 1 ? active[0] : null;
}

/** The buoys each active station commands, and the buoys no station does. */
export function commandRoutes<B extends Pick<Buoy, "buoy_id" | "command_device_id">>(buoys: B[], active: Device[]) {
  const byStation = new Map<string, B[]>(active.map((station) => [station.id, []]));
  const orphans: B[] = [];
  for (const buoy of buoys) {
    const station = commandingStation(buoy, active);
    if (station) byStation.get(station.id)!.push(buoy);
    else orphans.push(buoy);
  }
  return { byStation, orphans };
}
