/* Downloadable CSV reports (Phase D, SCO-241). A member picks buoys, a date range and variables;
 * the CSV goes to R2 through the storage guardrails (storage.js) and comes back through a link
 * that works for an hour, with no session needed, so it can be pasted into a notebook or email.
 * The printable report needs none of this: the front end renders it and the browser prints it. */

import { record } from "./audit.js";
import { constantTimeEqual, randomToken, sha256Hex } from "./crypto.js";
import { guardedGet, guardedPut, PREFIX_DAYS } from "./storage.js";

/** Variables a report may include (shore/scout_shore/schema.py COLUMNS, minus the identifiers
 * every report starts with). */
export const REPORT_COLUMNS = [
  "temp_c", "turbidity_fau", "turbidity_v", "turbidity_adc", "battery_v", "internal_temp_c", "internal_humidity_pct",
  "lvl_anthro_cdb", "lvl_mixed_cdb", "lvl_bio_cdb", "lvl_broad_cdb", "ndsi_e4", "snap_count", "clip_count",
  "flags", "soh", "tx_count", "uptime_s", "audio_file", "fw_version", "schema_version",
];
const ID_COLUMNS = ["buoy_id", "timestamp_utc", "record_seq"];
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const MAX_ROWS = 50_000;
const MAX_BUOYS = 20;
const PER_DAY = 20;
const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** A request body → { buoys, from, to, columns }, or { error }. */
export function validRequest(body) {
  const buoys = Array.isArray(body?.buoys) ? [...new Set(body.buoys.map(Number))] : [];
  const columns = Array.isArray(body?.columns) ? [...new Set(body.columns)] : [];
  const { from, to } = body ?? {};
  if (buoys.length === 0 || buoys.length > MAX_BUOYS || !buoys.every((b) => Number.isInteger(b) && b >= 1 && b <= 65535)) {
    return { error: `Pick 1-${MAX_BUOYS} buoys.` };
  }
  if (!TIMESTAMP.test(from || "") || !TIMESTAMP.test(to || "")) return { error: "from and to are UTC times like 2026-10-30T00:00:00Z." };
  if (from > to) return { error: "The range ends before it starts." };
  if (columns.length === 0 || !columns.every((c) => REPORT_COLUMNS.includes(c))) return { error: "Pick at least one variable from the list." };
  return { buoys, from, to, columns };
}

/** A spreadsheet must not run a cell as a formula: text starting with = + - @ gets a leading '. */
function cell(value) {
  let text = value === undefined || value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
  return /[",\n\r]|^'/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function rowsFor(db, { buoys, from, to }) {
  const marks = buoys.map(() => "?").join(", ");
  const { results } = await db
    .prepare(`SELECT row_json FROM readings WHERE buoy_id IN (${marks}) AND timestamp_utc >= ? AND timestamp_utc <= ? ` +
      "ORDER BY timestamp_utc, buoy_id, record_seq LIMIT ?")
    .bind(...buoys, from, to, MAX_ROWS + 1)
    .all();
  return results.map((r) => JSON.parse(r.row_json));
}

export async function buildCsv(db, request) {
  const header = [...ID_COLUMNS, ...request.columns];
  const rows = await rowsFor(db, request);
  if (rows.length > MAX_ROWS) return null;
  return `${[header, ...rows.map((row) => header.map((c) => row[c]))].map((line) => line.map(cell).join(",")).join("\n")}\n`;
}

const linkFor = (id, token) => `/api/reports/${id}/file?t=${token}`;

export async function createReport(env, actor, body, now = Date.now()) {
  const request = validRequest(body);
  if (request.error) return request;
  const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM reports WHERE user_id = ? AND created_at > ?")
    .bind(actor.id, now - DAY_MS).first();
  if (n >= PER_DAY) return { error: `That's ${PER_DAY} reports today; try again tomorrow.`, status: 429 };
  const csv = await buildCsv(env.DB, request);
  if (csv === null) return { error: `Over ${MAX_ROWS.toLocaleString("en-US")} readings; narrow the range or the buoys.` };
  const bytes = new TextEncoder().encode(csv);
  const id = crypto.randomUUID();
  const stored = await guardedPut(env, `reports/${id}.csv`, bytes, now);
  if (stored.error) return stored;
  const token = randomToken(24);
  const rows = csv.split("\n").length - 2;
  await env.DB.prepare("INSERT INTO reports (id, user_id, params_json, rows, bytes, token_hash, created_at, link_expires_at, expires_at) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, actor.id, JSON.stringify(request), rows, bytes.byteLength, await sha256Hex(token), now, now + HOUR_MS,
      now + PREFIX_DAYS["reports/"] * DAY_MS)
    .run();
  await record(env.DB, { actor, action: "report.create", target: `${request.from.slice(0, 10)} to ${request.to.slice(0, 10)}`,
    after: { buoys: request.buoys.join(" "), rows } });
  return { id, link: linkFor(id, token), rows };
}

export async function newLink(env, actor, id, now = Date.now()) {
  const report = await env.DB.prepare("SELECT id FROM reports WHERE id = ? AND user_id = ? AND expires_at > ?")
    .bind(id, actor.id, now).first();
  if (!report) return { error: "That report is not yours, or its file has been deleted." };
  const token = randomToken(24);
  await env.DB.prepare("UPDATE reports SET token_hash = ?, link_expires_at = ? WHERE id = ?")
    .bind(await sha256Hex(token), now + HOUR_MS, id).run();
  return { link: linkFor(id, token) };
}

export async function listReports(db, userId) {
  const { results } = await db.prepare("SELECT id, params_json, rows, bytes, created_at, link_expires_at, expires_at FROM reports " +
    "WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").bind(userId).all();
  return results.map(({ params_json: params, ...rest }) => ({ ...rest, params: JSON.parse(params) }));
}

/** GET /api/reports/:id/file?t=… → the CSV, or a status and message. */
export async function download(env, id, token, now = Date.now()) {
  const report = await env.DB.prepare("SELECT * FROM reports WHERE id = ?").bind(id).first();
  if (!report || !token || !constantTimeEqual(await sha256Hex(token), report.token_hash)) return { status: 404, error: "No such report link." };
  if (report.link_expires_at <= now || report.expires_at <= now) {
    return { status: 410, error: "This link has expired. Open Reports in the console for a fresh one." };
  }
  const got = await guardedGet(env, `reports/${id}.csv`, now);
  if (got.error) return { status: 410, error: got.error };
  const { from, to } = JSON.parse(report.params_json);
  return { body: got.object.body, filename: `scout-${from.slice(0, 10)}-to-${to.slice(0, 10)}.csv` };
}
