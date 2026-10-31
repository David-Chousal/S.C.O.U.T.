/* The readings shore stations push (device.js stores them), read back newest first for the
 * Readings page and the REST API. Each row comes back as the schema row the station sent. */

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 200;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/** ?from=&to=&limit= → a query, or { error } naming what is wrong. */
export function readingsQuery(params) {
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const limitText = params.get("limit");
  const limit = limitText === null ? DEFAULT_LIMIT : Number(limitText);
  if ((from && !TIMESTAMP.test(from)) || (to && !TIMESTAMP.test(to))) {
    return { error: "from and to are UTC times like 2026-10-30T08:10:00Z." };
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return { error: `limit is 1-${MAX_LIMIT}.` };
  return { from, to, limit };
}

export async function listReadings(db, buoyId, { from = "", to = "", limit = DEFAULT_LIMIT } = {}) {
  const { results } = await db
    .prepare("SELECT row_json FROM readings WHERE buoy_id = ? AND timestamp_utc >= ? AND timestamp_utc <= ? " +
      "ORDER BY timestamp_utc DESC, record_seq DESC LIMIT ?")
    .bind(Number(buoyId), from, to || "9999", limit)
    .all();
  return results.map((r) => JSON.parse(r.row_json));
}
