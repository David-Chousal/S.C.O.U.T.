/* Buoys and their daily transmit count (SCO-198).
 *
 * The console stores only the count the team *requested*. The shore station pulls it, signs a
 * SET_TX_COUNT frame with the buoy's key (which never comes here) and sends it in the buoy's
 * listen window; the buoy's next packet reports the count it now uses. Until the two match the
 * setting reads "pending". The state names match shore/scout_shore/tx_schedule.py. */

import { record } from "./audit.js";
import estimates from "./battery-life.json" with { type: "json" };

export const TX_COUNTS = [1, 2, 3];
export const DEFAULT_TX_COUNT = 3;
export const SLOT_LABELS = { 1: "00:10 UTC", 2: "00:10 and 16:10 UTC", 3: "00:10, 08:10 and 16:10 UTC" };

export { estimates };

/** confirmed | pending | rejected | unreported | default — see tx_schedule.CountStatus. */
export function countState(buoy) {
  const requested = buoy.tx_count_requested ?? null;
  const reported = buoy.tx_count_reported ?? null;
  if (requested === null) return reported === null || reported === DEFAULT_TX_COUNT ? "default" : "confirmed";
  if (reported === requested) return "confirmed";
  if (buoy.cmd_rejected) return "rejected";
  return reported === null ? "unreported" : "pending";
}

/** Best/pessimistic life for a count and cell count, from the shared Python model's export. */
export function lifeFor(txCount, cells, listenWindow = false) {
  const rows = listenWindow ? estimates.with_listen_window : estimates.without_listen_window;
  const pick = (scenario) => rows.find((r) => r.scenario === scenario && r.tx_per_day === txCount && r.cells === cells);
  return { best: pick("best"), pessimistic: pick("pessimistic") };
}

export async function listBuoys(db) {
  const { results } = await db.prepare("SELECT * FROM buoys ORDER BY buoy_id").all();
  return results.map((b) => ({ ...b, state: countState(b) }));
}

export async function addBuoy(db, actor, buoyId, label) {
  const id = Number(buoyId);
  if (!Number.isInteger(id) || id < 1 || id > 65535) return { error: "Buoy ID must be 1-65535." };
  const name = (label || `SCOUT-${String(id).padStart(2, "0")}`).slice(0, 40);
  const existing = await db.prepare("SELECT buoy_id FROM buoys WHERE buoy_id = ?").bind(id).first();
  if (existing) return { error: `Buoy ${id} is already listed.` };
  await db.prepare("INSERT INTO buoys (buoy_id, label) VALUES (?, ?)").bind(id, name).run();
  await record(db, { actor, action: "buoy.add", target: name });
  return {};
}

export async function requestTxCount(db, actor, buoyId, value) {
  const count = Number(value);
  if (!TX_COUNTS.includes(count)) return { error: "Transmits a day must be 1, 2 or 3." };
  const buoy = await db.prepare("SELECT * FROM buoys WHERE buoy_id = ?").bind(Number(buoyId)).first();
  if (!buoy) return { error: "No such buoy." };
  if (buoy.tx_count_requested === count) return {};
  await db
    .prepare("UPDATE buoys SET tx_count_requested = ?, requested_by = ?, requested_at = ?, cmd_rejected = 0 WHERE buoy_id = ?")
    .bind(count, actor.email, Date.now(), buoy.buoy_id)
    .run();
  await record(db, { actor, action: "buoy.tx_count", target: buoy.label,
    before: { requested: buoy.tx_count_requested, reported: buoy.tx_count_reported }, after: { requested: count } });
  return {};
}
