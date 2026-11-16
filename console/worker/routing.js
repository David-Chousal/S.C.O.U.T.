/* Which shore station answers each buoy (SCO-316), from which stations hear it (SCO-290).
 *
 * A buoy listens for 1 s after each packet and keeps the first frame it hears, so two stations
 * answering the same packet collide and often neither lands. Exactly one station answers a buoy:
 *   1. the station an admin picked (buoys.command_device_id), while it is active;
 *   2. else the only active station;
 *   3. else the active station that pushed the most of the buoy's readings in the last 24 h,
 *      ties going to the one that heard it last, then the oldest station;
 *   4. else none, until some station hears the buoy.
 * Settings, count and firmware jobs go only to that station, and its settings reply lists the
 * buoys it answers, so the station sends nothing (not even its time) to any other buoy. */

export const ROUTE_WINDOW_MS = 24 * 3600 * 1000;
export const RECEPTION_KEEP_MS = 30 * 24 * 3600 * 1000;

/** Record that `deviceId` pushed these readings; a repeat push records nothing new. */
export function receptionStatements(db, deviceId, parsed, now) {
  return parsed.map((p) =>
    db.prepare("INSERT OR IGNORE INTO receptions (buoy_id, record_seq, timestamp_utc, device_id, received_at) VALUES (?, ?, ?, ?, ?)")
      .bind(p.buoyId, p.seq, p.timestamp, deviceId, now));
}

/** Packets and last reception per (buoy, active station) in the route window. */
async function recentHearing(db, now) {
  const { results } = await db.prepare(
    "SELECT r.buoy_id, r.device_id, COUNT(*) AS packets, MAX(r.received_at) AS last_heard_at FROM receptions r " +
    "JOIN devices d ON d.id = r.device_id AND d.revoked_at IS NULL WHERE r.received_at >= ? GROUP BY r.buoy_id, r.device_id")
    .bind(now - ROUTE_WINDOW_MS).all();
  return results;
}

function heardMost(rows, order) {
  return [...rows].sort((a, b) => b.packets - a.packets || b.last_heard_at - a.last_heard_at ||
    order.get(a.device_id) - order.get(b.device_id))[0];
}

/** Map of buoy_id → { device_id, name, reason } for every connected buoy that has a station. */
export async function answeringStations(db, now = Date.now()) {
  const { results: active } = await db.prepare("SELECT id, name FROM devices WHERE revoked_at IS NULL ORDER BY created_at, id").all();
  const { results: buoys } = await db.prepare("SELECT buoy_id, command_device_id FROM buoys WHERE disconnected_at IS NULL").all();
  const hearing = active.length > 1 ? await recentHearing(db, now) : [];
  const order = new Map(active.map((d, i) => [d.id, i]));
  const byId = new Map(active.map((d) => [d.id, d]));
  const routes = new Map();
  for (const buoy of buoys) {
    const picked = byId.get(buoy.command_device_id);
    let route = null;
    if (picked) route = { device: picked, reason: "picked" };
    else if (active.length === 1) route = { device: active[0], reason: "only_station" };
    else {
      const best = heardMost(hearing.filter((h) => h.buoy_id === buoy.buoy_id), order);
      if (best) route = { device: byId.get(best.device_id), reason: "heard_most" };
    }
    if (route) routes.set(buoy.buoy_id, { device_id: route.device.id, name: route.device.name, reason: route.reason });
  }
  return routes;
}

/** The buoy IDs `deviceId` answers, ascending. */
export async function buoysAnsweredBy(db, deviceId, now = Date.now()) {
  const routes = await answeringStations(db, now);
  return [...routes].filter(([, r]) => r.device_id === deviceId).map(([id]) => id).sort((a, b) => a - b);
}

/** Per station, the buoys it heard in the last 24 h: { device_id: [{ buoy_id, packets, last_heard_at }] }. */
export async function heardByStation(db, now = Date.now()) {
  const { results } = await db.prepare(
    "SELECT device_id, buoy_id, COUNT(*) AS packets, MAX(received_at) AS last_heard_at FROM receptions " +
    "WHERE received_at >= ? GROUP BY device_id, buoy_id ORDER BY buoy_id").bind(now - ROUTE_WINDOW_MS).all();
  const out = {};
  for (const r of results) (out[r.device_id] ??= []).push({ buoy_id: r.buoy_id, packets: r.packets, last_heard_at: r.last_heard_at });
  return out;
}

/** Drop receptions past RECEPTION_KEEP_MS (the daily job). Returns how many were removed. */
export async function pruneReceptions(db, now = Date.now()) {
  const result = await db.prepare("DELETE FROM receptions WHERE received_at < ?").bind(now - RECEPTION_KEEP_MS).run();
  return result.meta?.changes ?? 0;
}
