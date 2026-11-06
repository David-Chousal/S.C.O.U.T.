/* Buoys and their daily transmit count (SCO-198).
 *
 * The console stores only the count the team *requested*. The shore station pulls it, signs a
 * SET_TX_COUNT frame with the buoy's key (which never comes here) and sends it in the buoy's
 * listen window; the buoy's next packet reports the count it now uses. Until the two match the
 * setting reads "pending". The state names match shore/scout_shore/tx_schedule.py. */

import { record } from "./audit.js";
import estimates from "./battery-life.json" with { type: "json" };
import buoyConfig from "./buoy-config.json" with { type: "json" };
import { digestHex, KEYS, REGISTRY, requestedOf, settingsState, snapshotError, wantedOf } from "./buoy-settings.js";

export const TX_COUNTS = [1, 2, 3];
export const DEFAULT_TX_COUNT = 3;
export const SLOT_LABELS = { 1: "00:10 UTC", 2: "00:10 and 16:10 UTC", 3: "00:10, 08:10 and 16:10 UTC" };

export { buoyConfig, estimates };

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

async function settingRows(db, buoyId = null) {
  const statement = buoyId === null
    ? db.prepare("SELECT * FROM buoy_settings")
    : db.prepare("SELECT * FROM buoy_settings WHERE buoy_id = ?").bind(buoyId);
  return (await statement.all()).results;
}

/** Each buoy with its count state, and its remote settings: what was requested per setting
 * (null = default), the snapshot it should run, that snapshot's digest and the overall state. */
export async function listBuoys(db) {
  const { results } = await db.prepare("SELECT * FROM buoys ORDER BY buoy_id").all();
  const rows = await settingRows(db);
  return results.map((b) => {
    const requested = requestedOf(b, rows.filter((r) => r.buoy_id === b.buoy_id));
    const wanted = wantedOf(requested);
    return { ...b, state: countState(b), settings_requested: requested, settings_wanted: wanted,
      settings_digest_wanted: digestHex(wanted), settings_state: settingsState(b, requested) };
  });
}

/** Request remote settings for one buoy. `changes` is { key: value | null }; null withdraws a
 * request (the buoy goes back to that setting's default). The resulting snapshot must be one the
 * buoy would accept as a whole, or nothing is stored. */
export async function requestSettings(db, actor, buoyId, changes) {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return { error: "Send settings as { key: value }." };
  const unknown = Object.keys(changes).filter((key) => !KEYS.includes(key));
  if (unknown.length) return { error: `Unknown setting: ${unknown.join(", ")}.` };
  const buoy = await db.prepare("SELECT * FROM buoys WHERE buoy_id = ?").bind(Number(buoyId)).first();
  if (!buoy) return { error: "No such buoy." };
  const before = requestedOf(buoy, await settingRows(db, buoy.buoy_id));
  const after = { ...before };
  for (const [key, value] of Object.entries(changes)) after[key] = value === null ? null : Number(value);
  const problem = snapshotError(wantedOf(after));
  if (problem) return { error: problem };
  const changed = KEYS.filter((key) => after[key] !== before[key]);
  if (changed.length === 0) return {};
  const now = Date.now();
  const statements = changed.map((key) => {
    if (key === "tx_count") {
      return db.prepare("UPDATE buoys SET tx_count_requested = ?, requested_by = ?, requested_at = ?, cmd_rejected = 0 WHERE buoy_id = ?")
        .bind(after.tx_count, actor.email, now, buoy.buoy_id);
    }
    return after[key] === null
      ? db.prepare("DELETE FROM buoy_settings WHERE buoy_id = ? AND setting_key = ?").bind(buoy.buoy_id, key)
      : db.prepare("INSERT INTO buoy_settings (buoy_id, setting_key, value, requested_by, requested_at) VALUES (?, ?, ?, ?, ?) " +
        "ON CONFLICT (buoy_id, setting_key) DO UPDATE SET value = excluded.value, requested_by = excluded.requested_by, " +
        "requested_at = excluded.requested_at").bind(buoy.buoy_id, key, after[key], actor.email, now);
  });
  statements.push(db.prepare("UPDATE buoys SET cmd_rejected = 0 WHERE buoy_id = ?").bind(buoy.buoy_id));
  await db.batch(statements);
  const pick = (source) => Object.fromEntries(changed.map((key) => [key, source[key]]));
  await record(db, { actor, action: "buoy.settings", target: buoy.label, before: pick(before), after: pick(after) });
  return {};
}

/** Request every setting at its firmware default, so the shore sends the default snapshot. */
export async function restoreDefaults(db, actor, buoyId) {
  return requestSettings(db, actor, buoyId, Object.fromEntries(REGISTRY.map((spec) => [spec.key, spec.default])));
}

/** The snapshot string and digest the shore station sends, for every buoy with any request.
 * Only a buoy's command station hears about it; a lone station is everyone's. */
export async function wantedForDevice(db, deviceId) {
  const { results } = await db
    .prepare("SELECT * FROM buoys WHERE disconnected_at IS NULL AND (command_device_id = ? OR (command_device_id IS NULL AND " +
      "(SELECT COUNT(*) FROM devices WHERE revoked_at IS NULL) = 1)) ORDER BY buoy_id")
    .bind(deviceId)
    .all();
  const rows = await settingRows(db);
  return results.flatMap((b) => {
    const requested = requestedOf(b, rows.filter((r) => r.buoy_id === b.buoy_id));
    if (!Object.values(requested).some((value) => value !== null)) return [];
    const wanted = wantedOf(requested);
    return [{ buoy_id: b.buoy_id, tx_count_requested: b.tx_count_requested ?? null,
      settings: wanted.join(","), settings_digest: digestHex(wanted) }];
  });
}

export async function addBuoy(db, actor, buoyId, label) {
  const id = Number(buoyId);
  if (!Number.isInteger(id) || id < 1 || id > 65535) return { error: "Buoy ID must be 1-65535." };
  const name = (label || `SCOUT-${String(id).padStart(2, "0")}`).slice(0, 40);
  const existing = await db.prepare("SELECT buoy_id, label, disconnected_at FROM buoys WHERE buoy_id = ?").bind(id).first();
  if (existing?.disconnected_at) {
    // Adding a disconnected buoy reconnects it: its packets are stored again from now on.
    await db.prepare("UPDATE buoys SET disconnected_at = NULL WHERE buoy_id = ?").bind(id).run();
    await record(db, { actor, action: "buoy.reconnect", target: existing.label });
    return { reconnected: true };
  }
  if (existing) return { error: `Buoy ${id} is already listed.` };
  await db.prepare("INSERT INTO buoys (buoy_id, label) VALUES (?, ?)").bind(id, name).run();
  await record(db, { actor, action: "buoy.add", target: name });
  return {};
}

/** Stop listening to a buoy: its packets are ignored and no station is sent its settings until it is
 * added again on Fleet. The radio cannot be reached from here, so the buoy itself keeps running. */
export async function disconnectBuoy(db, actor, buoyId, now = Date.now()) {
  const buoy = await db.prepare("SELECT * FROM buoys WHERE buoy_id = ?").bind(Number(buoyId)).first();
  if (!buoy) return { error: "No such buoy." };
  if (buoy.disconnected_at) return { error: `${buoy.label} is already disconnected.` };
  await db.prepare("UPDATE buoys SET disconnected_at = ? WHERE buoy_id = ?").bind(now, buoy.buoy_id).run();
  await record(db, { actor, action: "buoy.disconnect", target: buoy.label });
  return {};
}

/** Remove a disconnected buoy from the console for good: its row, requested settings and readings.
 * A connected buoy must be disconnected first, so nothing live is deleted by one click. */
export async function deleteBuoy(db, actor, buoyId) {
  const buoy = await db.prepare("SELECT * FROM buoys WHERE buoy_id = ?").bind(Number(buoyId)).first();
  if (!buoy) return { error: "No such buoy." };
  if (!buoy.disconnected_at) return { error: "Disconnect the buoy before deleting it." };
  const { n } = await db.prepare("SELECT COUNT(*) AS n FROM readings WHERE buoy_id = ?").bind(buoy.buoy_id).first();
  await db.batch([
    db.prepare("DELETE FROM readings WHERE buoy_id = ?").bind(buoy.buoy_id),
    db.prepare("DELETE FROM buoy_settings WHERE buoy_id = ?").bind(buoy.buoy_id),
    db.prepare("DELETE FROM buoys WHERE buoy_id = ?").bind(buoy.buoy_id),
  ]);
  await record(db, { actor, action: "buoy.delete", target: buoy.label, before: { buoy_id: buoy.buoy_id, readings: n } });
  return {};
}

/** Rename a buoy as the console shows it. The packet carries only the numeric ID, so this never
 * reaches the buoy. */
export async function renameBuoy(db, actor, buoyId, value) {
  const label = String(value || "").trim();
  if (!/^[\w .·()-]{1,40}$/u.test(label)) return { error: "Use 1–40 letters, numbers, spaces or - . ( )" };
  const buoy = await db.prepare("SELECT * FROM buoys WHERE buoy_id = ?").bind(Number(buoyId)).first();
  if (!buoy) return { error: "No such buoy." };
  if (buoy.label === label) return {};
  await db.prepare("UPDATE buoys SET label = ? WHERE buoy_id = ?").bind(label, buoy.buoy_id).run();
  await record(db, { actor, action: "buoy.rename", target: String(buoy.buoy_id), before: { label: buoy.label }, after: { label } });
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

/** Pick (or with null, unpick) the one shore station that sends a buoy's downlink commands. */
export async function setCommandStation(db, actor, buoyId, deviceId) {
  const buoy = await db.prepare("SELECT * FROM buoys WHERE buoy_id = ?").bind(Number(buoyId)).first();
  if (!buoy) return { error: "No such buoy." };
  let device = null;
  if (deviceId !== null && deviceId !== undefined) {
    device = await db.prepare("SELECT id, name FROM devices WHERE id = ? AND revoked_at IS NULL").bind(String(deviceId)).first();
    if (!device) return { error: "Pick an active shore station." };
  }
  const previous = buoy.command_device_id
    ? await db.prepare("SELECT name FROM devices WHERE id = ?").bind(buoy.command_device_id).first()
    : null;
  await db.prepare("UPDATE buoys SET command_device_id = ? WHERE buoy_id = ?").bind(device?.id ?? null, buoy.buoy_id).run();
  await record(db, { actor, action: "buoy.command_station", target: buoy.label,
    before: { station: previous?.name ?? null }, after: { station: device?.name ?? null } });
  return {};
}
