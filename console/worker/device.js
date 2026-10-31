/* The shore station's API (bearer device token; never a user session).
 *
 *   POST /api/device/readings  { rows: [schema row, ...] }   ≤ 200 rows, ≤ 256 KB
 *   GET  /api/device/settings  → { buoys: [{ buoy_id, tx_count_requested }] }
 *
 * Rows are validated field by field before anything is stored, and repeats of a
 * (buoy_id, record_seq, timestamp_utc) are ignored, so a shore station may push the same day
 * again safely. The timestamp is in the key because a cold start resets record_seq to 0. */

import { record } from "./audit.js";
import { randomToken, sha256Hex } from "./crypto.js";
import { apiError, bodyWithin, json } from "./http.js";

const MAX_ROWS = 200;
const MAX_BODY_BYTES = 256 * 1024;
const BUOY_LABEL = /^SCOUT-(\d{1,5})$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
// A row stamped further ahead than this is refused: a buoy clock gone wrong must not pin the
// buoy's "newest packet" in the future and hide every real one after it.
const MAX_FUTURE_MS = 24 * 3600 * 1000;

export async function createDevice(db, actor, name) {
  const label = String(name || "").trim().slice(0, 60);
  if (!label) return { error: "Name the shore station." };
  const token = `scd_${randomToken()}`;
  await db
    .prepare("INSERT INTO devices (id, name, token_hash, created_by, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), label, await sha256Hex(token), actor.id, Date.now())
    .run();
  await record(db, { actor, action: "device.create", target: label });
  return { token, name: label };
}

export async function revokeDevice(db, actor, id) {
  const device = await db.prepare("SELECT * FROM devices WHERE id = ? AND revoked_at IS NULL").bind(id).first();
  if (!device) return { error: "That token is already revoked." };
  await db.prepare("UPDATE devices SET revoked_at = ? WHERE id = ?").bind(Date.now(), id).run();
  await record(db, { actor, action: "device.revoke", target: device.name });
  return {};
}

export async function listDevices(db) {
  const { results } = await db
    .prepare("SELECT id, name, created_at, revoked_at, last_seen_at FROM devices ORDER BY created_at DESC")
    .all();
  return results;
}

async function authenticate(db, request) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token.startsWith("scd_") || token.length > 80) return null;
  const device = await db
    .prepare("SELECT * FROM devices WHERE token_hash = ? AND revoked_at IS NULL")
    .bind(await sha256Hex(token))
    .first();
  if (device) await db.prepare("UPDATE devices SET last_seen_at = ? WHERE id = ?").bind(Date.now(), device.id).run();
  return device;
}

/** A validated row → {buoyId, seq, timestamp, txCount, rejected, clockLost}, or null. */
export function parseRow(row, now = Date.now()) {
  if (!row || typeof row !== "object") return null;
  const label = BUOY_LABEL.exec(String(row.buoy_id || ""));
  const buoyId = label ? Number(label[1]) : NaN;
  const seq = Number(row.record_seq);
  const timestamp = String(row.timestamp_utc || "");
  const txText = String(row.tx_count ?? "");
  if (!(buoyId >= 1 && buoyId <= 65535) || !Number.isInteger(seq) || seq < 0 || seq > 0xffffffff) return null;
  if (!TIMESTAMP.test(timestamp) || !["", "1", "2", "3"].includes(txText)) return null;
  if (!(Date.parse(timestamp) <= now + MAX_FUTURE_MS)) return null;
  const flags = String(row.flags || "").split("|");
  return {
    buoyId, seq, timestamp, txCount: txText ? Number(txText) : null,
    rejected: flags.includes("CMD_REJECTED"), clockLost: flags.includes("RTC_LOST"),
  };
}

async function storeRows(db, parsed, rows) {
  const now = Date.now();
  const inserts = parsed.map((p, i) =>
    db.prepare("INSERT OR IGNORE INTO readings (buoy_id, record_seq, timestamp_utc, row_json, received_at) VALUES (?, ?, ?, ?, ?)")
      .bind(p.buoyId, p.seq, p.timestamp, JSON.stringify(rows[i]), now));
  const results = await db.batch(inserts);
  return results.reduce((n, r) => n + (r.meta?.changes ?? 0), 0);
}

/** Newest row per buoy updates what that buoy reports (count, rejection, last seen).
 *
 * A row flagged RTC_LOST carries a timestamp the buoy cannot vouch for, so it cannot be ordered
 * against the others by time. Trusted rows are ordered by timestamp as before. When a buoy's rows
 * in a push are all clock-lost, the last one in push order (the shore's arrival order) sets the
 * count and marks the buoy clock_lost, and its timestamp is not used. */
async function updateReported(db, parsed) {
  const trusted = new Map();
  const clockLost = new Map();
  for (const p of parsed) {
    if (p.clockLost) clockLost.set(p.buoyId, p);
    else if (!trusted.has(p.buoyId) || p.timestamp > trusted.get(p.buoyId).timestamp) trusted.set(p.buoyId, p);
  }
  const now = Date.now();
  const buoyIds = new Set([...trusted.keys(), ...clockLost.keys()]);
  await db.batch([...buoyIds].flatMap((buoyId) => {
    const statements = [
      db.prepare("INSERT OR IGNORE INTO buoys (buoy_id, label) VALUES (?, ?)")
        .bind(buoyId, `SCOUT-${String(buoyId).padStart(2, "0")}`),
      db.prepare("UPDATE buoys SET last_seen_at = ? WHERE buoy_id = ?").bind(now, buoyId),
    ];
    const p = trusted.get(buoyId);
    if (p) {
      statements.push(db.prepare("UPDATE buoys SET tx_count_reported = COALESCE(?, tx_count_reported), cmd_rejected = ?, " +
        "reported_at = ?, clock_lost = 0 WHERE buoy_id = ? AND (reported_at IS NULL OR reported_at <= ?)")
        .bind(p.txCount, p.rejected ? 1 : 0, Date.parse(p.timestamp), buoyId, Date.parse(p.timestamp)));
    } else {
      const lost = clockLost.get(buoyId);
      statements.push(db.prepare("UPDATE buoys SET tx_count_reported = COALESCE(?, tx_count_reported), cmd_rejected = ?, " +
        "clock_lost = 1 WHERE buoy_id = ?")
        .bind(lost.txCount, lost.rejected ? 1 : 0, buoyId));
    }
    return statements;
  }));
}

export async function handleDeviceApi(request, env, path) {
  const device = await authenticate(env.DB, request);
  if (!device) return apiError("unauthorized", 401);
  if (path === "/api/device/settings" && request.method === "GET") {
    const { results } = await env.DB
      .prepare("SELECT buoy_id, tx_count_requested FROM buoys WHERE tx_count_requested IS NOT NULL ORDER BY buoy_id")
      .all();
    return json({ buoys: results });
  }
  if (path === "/api/device/readings" && request.method === "POST") {
    if (!bodyWithin(request, MAX_BODY_BYTES)) return apiError("body too large or without a length", 413);
    const text = await request.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return apiError("body is not JSON", 400);
    }
    const rows = Array.isArray(body?.rows) ? body.rows : null;
    if (!rows || rows.length > MAX_ROWS) return apiError(`rows must be an array of at most ${MAX_ROWS}`, 400);
    const parsed = rows.map((r) => parseRow(r));
    const bad = parsed.findIndex((p) => p === null);
    if (bad !== -1) return apiError(`row ${bad} is not a valid schema row`, 400);
    const stored = await storeRows(env.DB, parsed, rows);
    await updateReported(env.DB, parsed);
    return json({ stored });
  }
  return apiError("not found", 404);
}
