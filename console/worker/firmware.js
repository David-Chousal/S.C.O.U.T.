/* Firmware over WiFi (SCO-312, ADR-0016). An admin uploads a signed .scoutfw bundle for a buoy;
 * the buoy's shore station pulls it with its device token and relays it over LoRa (ADR-0008).
 *
 *   POST /api/v1/buoys/{id}/firmware        bundle bytes   write:firmware, owner admin
 *   GET  /api/v1/buoys/{id}/firmware        → { jobs }      read:telemetry
 *   POST /api/v1/firmware/{job}/cancel                      write:firmware, owner admin
 *   GET  /api/device/firmware               → { jobs: [{ job_id, buoy_id, version, size, sha256 }] }
 *   GET  /api/device/firmware/{job}         → the bundle, application/octet-stream
 *   POST /api/device/firmware/{job}/status  { state, detail? }
 *
 * The console checks the bundle's layout, size and image hash, never its Ed25519 signature: it
 * does not hold the key, and does not need to. The S3 and the buoy each verify the signature
 * before acting, so a console or network that is taken over can only resend bundles the
 * developer already signed, and the buoy refuses any version not above the one it runs.
 *
 * Bundle layout (shore/scout_shore/ota.py): manifest (52) + signature (64) + image. Manifest:
 * magic "SCFW" u32, target buoy u16 (0 = any), chunk size u8 (128), flags u8 (0), version u32,
 * image length u32, build time u32, SHA-256 of the image (32); little-endian. */

import { record } from "./audit.js";

const MANIFEST_BYTES = 52;
const SIG_BYTES = 64;
const HEAD_BYTES = MANIFEST_BYTES + SIG_BYTES;
const MAGIC = 0x57464353;
const CHUNK_BYTES = 128;
const MAX_IMAGE = 0x40000 - 0x8000;  // the buoy's application area, 0x8000 to the end of flash
export const MAX_BUNDLE_BYTES = HEAD_BYTES + MAX_IMAGE;
export const FIRMWARE_UPLOAD = /^\/api\/v1\/buoys\/(\d{1,5})\/firmware$/;

const FINAL = ["confirmed", "rolled_back", "rejected", "canceled"];
/** Live states in the order a transfer moves through them; a report may only stay or move on. */
const LIVE_ORDER = ["pending", "staged", "offering", "transferring", "trial"];
const CANCELABLE = ["pending", "staged", "offering"];
/** What a shore station may report; "pending" and "canceled" are the console's alone. */
const REPORTED = ["staged", "offering", "transferring", "trial", "confirmed", "rolled_back", "rejected"];
const MAX_DETAIL = 120;

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

export function versionText(number) {
  return `v${(number >> 16) & 0xff}.${(number >> 8) & 0xff}.${number & 0xff}`;
}

/** A bundle's manifest, checked against its image, or { error }. */
export async function parseBundle(bytes, buoyId) {
  if (bytes.length <= HEAD_BYTES) return { error: "The bundle is too short to hold a manifest, signature and image." };
  const view = new DataView(bytes.buffer, bytes.byteOffset, MANIFEST_BYTES);
  const target = view.getUint16(4, true);
  const length = view.getUint32(12, true);
  if (view.getUint32(0, true) !== MAGIC) return { error: "Not a .scoutfw bundle (bad manifest magic)." };
  if (view.getUint8(6) !== CHUNK_BYTES || view.getUint8(7) !== 0) return { error: "The manifest's chunk size or flags are not accepted." };
  if (length === 0 || length > MAX_IMAGE) return { error: `The image must be 1-${MAX_IMAGE} bytes.` };
  if (length !== bytes.length - HEAD_BYTES) return { error: `The manifest says ${length} bytes; the bundle holds ${bytes.length - HEAD_BYTES}.` };
  if (target !== 0 && target !== buoyId) return { error: `This bundle was signed for buoy ${target}, not ${buoyId}.` };
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes.subarray(HEAD_BYTES)));
  const expected = bytes.subarray(20, 52);
  if (!digest.every((b, i) => b === expected[i])) return { error: "The image does not match the manifest's SHA-256." };
  return { version: view.getUint32(8, true), sha256: hex(digest) };
}

function publicJob(row) {
  return {
    id: row.id, buoy_id: row.buoy_id, version: versionText(row.version), size: row.size, sha256: row.sha256,
    state: row.state, detail: row.detail, uploaded_by: row.uploaded_by, uploaded_at: row.uploaded_at, updated_at: row.updated_at,
  };
}

async function blockingJob(db, buoyId, version) {
  const newest = await db.prepare("SELECT MAX(version) AS v FROM firmware_jobs WHERE buoy_id = ? AND state NOT IN ('canceled', 'rejected')")
    .bind(buoyId).first();
  if (newest?.v !== null && newest?.v !== undefined && version <= newest.v) {
    return `The version must be higher than ${versionText(newest.v)}, already sent to this buoy. Sign it with a new version.`;
  }
  const busy = await db.prepare("SELECT id FROM firmware_jobs WHERE buoy_id = ? AND state IN ('transferring', 'trial')")
    .bind(buoyId).first();
  return busy ? "A firmware transfer to this buoy is under way. Wait for it to be confirmed or rolled back." : null;
}

/** Store an uploaded bundle as a pending job, replacing one the buoy has not accepted yet. */
export async function uploadFirmware(db, actor, buoyIdText, bytes) {
  const buoyId = Number(buoyIdText);
  const buoy = await db.prepare("SELECT buoy_id FROM buoys WHERE buoy_id = ? AND disconnected_at IS NULL").bind(buoyId).first();
  if (!buoy) return { error: "No such buoy, or it is disconnected.", status: 404 };
  const parsed = await parseBundle(bytes, buoyId);
  if (parsed.error) return { error: parsed.error, status: 400 };
  const blocked = await blockingJob(db, buoyId, parsed.version);
  if (blocked) return { error: blocked, status: 409 };
  const now = Date.now();
  const id = crypto.randomUUID();
  // The checks above give a clear message; these conditions, inside one transaction, are what
  // hold. The insert happens only if they still do, and older jobs are replaced only if it did.
  const [inserted] = await db.batch([
    db.prepare("INSERT INTO firmware_jobs (id, buoy_id, version, size, sha256, bundle, state, uploaded_by, uploaded_at, updated_at) " +
      "SELECT ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM firmware_jobs WHERE buoy_id = ? AND " +
      "(state IN ('transferring', 'trial') OR (version >= ? AND state NOT IN ('canceled', 'rejected'))))")
      .bind(id, buoyId, parsed.version, bytes.length, parsed.sha256, bytes, actor.label ?? actor.email, now, now, buoyId, parsed.version),
    db.prepare("UPDATE firmware_jobs SET state = 'canceled', detail = 'replaced by a newer upload', bundle = NULL, updated_at = ? " +
      `WHERE buoy_id = ? AND id != ? AND state IN (${CANCELABLE.map(() => "?").join(", ")}) ` +
      "AND EXISTS (SELECT 1 FROM firmware_jobs WHERE id = ?)").bind(now, buoyId, id, ...CANCELABLE, id),
  ]);
  if (!inserted.meta?.changes) {
    return { error: (await blockingJob(db, buoyId, parsed.version)) ?? "Another upload or transfer changed this buoy's jobs. Try again.", status: 409 };
  }
  await record(db, { actor, action: "firmware.upload", target: `buoy ${buoyId}`, after: { version: versionText(parsed.version), sha256: parsed.sha256 } });
  return { job: publicJob(await db.prepare("SELECT * FROM firmware_jobs WHERE id = ?").bind(id).first()) };
}

export async function listFirmware(db, buoyIdText) {
  const { results } = await db.prepare("SELECT * FROM firmware_jobs WHERE buoy_id = ? ORDER BY uploaded_at DESC LIMIT 50")
    .bind(Number(buoyIdText)).all();
  return results.map(publicJob);
}

export async function cancelFirmware(db, actor, jobId) {
  const job = await db.prepare("SELECT * FROM firmware_jobs WHERE id = ?").bind(jobId).first();
  if (!job) return { error: "No such firmware job.", status: 404 };
  if (!CANCELABLE.includes(job.state)) return { error: `The job is ${job.state}; only one the buoy has not accepted can be canceled.`, status: 409 };
  // The state is checked again in the update: a station may report "transferring" in between.
  const done = await db.prepare("UPDATE firmware_jobs SET state = 'canceled', detail = 'canceled', bundle = NULL, updated_at = ? " +
    `WHERE id = ? AND state IN (${CANCELABLE.map(() => "?").join(", ")})`).bind(Date.now(), jobId, ...CANCELABLE).run();
  if (!done.meta?.changes) return { error: "The buoy accepted the job before it could be canceled.", status: 409 };
  await record(db, { actor, action: "firmware.cancel", target: `buoy ${job.buoy_id}`, before: { version: versionText(job.version), state: job.state } });
  return {};
}

// The same routing as settings (fleet.js wantedForDevice): a buoy's command station, or the only
// station there is when the buoy has none.
const ROUTED = "b.disconnected_at IS NULL AND (b.command_device_id = ? OR (b.command_device_id IS NULL AND " +
  "(SELECT COUNT(*) FROM devices WHERE revoked_at IS NULL) = 1))";

async function routedJob(db, deviceId, jobId) {
  return db.prepare(`SELECT j.* FROM firmware_jobs j JOIN buoys b ON b.buoy_id = j.buoy_id WHERE j.id = ? AND ${ROUTED}`)
    .bind(jobId, deviceId).first();
}

export async function jobsForDevice(db, deviceId) {
  const { results } = await db.prepare("SELECT j.id, j.buoy_id, j.version, j.size, j.sha256 FROM firmware_jobs j " +
    `JOIN buoys b ON b.buoy_id = j.buoy_id WHERE j.state NOT IN (${FINAL.map(() => "?").join(", ")}) AND ${ROUTED} ` +
    "ORDER BY j.uploaded_at").bind(...FINAL, deviceId).all();
  return results.map((j) => ({ job_id: j.id, buoy_id: j.buoy_id, version: versionText(j.version), size: j.size, sha256: j.sha256 }));
}

/** The bundle bytes of a live job routed to this station, or null. */
export async function bundleForDevice(db, deviceId, jobId) {
  const job = await routedJob(db, deviceId, jobId);
  if (!job || FINAL.includes(job.state) || job.bundle === null) return null;
  return new Uint8Array(job.bundle);
}

export async function reportFirmware(db, device, jobId, body) {
  const state = String(body?.state ?? "");
  const detail = body?.detail === undefined || body.detail === null ? null : String(body.detail);
  if (!REPORTED.includes(state)) return { error: `state must be one of ${REPORTED.join(", ")}`, status: 400 };
  if (detail !== null && detail.length > MAX_DETAIL) return { error: `detail is at most ${MAX_DETAIL} characters`, status: 400 };
  const job = await routedJob(db, device.id, jobId);
  if (!job) return { error: "not found", status: 404 };
  if (FINAL.includes(job.state)) return { error: `the job is already ${job.state}`, status: 409 };
  const final = FINAL.includes(state);
  if (!final && LIVE_ORDER.indexOf(state) < LIVE_ORDER.indexOf(job.state)) {
    return { error: `the job is ${job.state}; it cannot go back to ${state}`, status: 409 };
  }
  // Conditional on the state read above, so a report racing a cancel or another report is stale.
  const done = await db.prepare(`UPDATE firmware_jobs SET state = ?, detail = ?, updated_at = ?${final ? ", bundle = NULL" : ""} ` +
    "WHERE id = ? AND state = ?").bind(state, detail, Date.now(), jobId, job.state).run();
  if (!done.meta?.changes) return { error: "the job changed while this report was sent; read it again", status: 409 };
  if (final) {
    await record(db, { actor: { label: `device:${device.name}` }, action: `firmware.${state}`, target: `buoy ${job.buoy_id}`,
      after: { version: versionText(job.version), detail } });
  }
  return {};
}
