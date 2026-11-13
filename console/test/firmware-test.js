/* Firmware over WiFi (SCO-312, ADR-0016): an admin's API token uploads a signed .scoutfw bundle,
 * the buoy's shore station downloads it over its device token, and reports how the LoRa
 * transfer went. The console checks the bundle's shape and hash; it never checks the Ed25519
 * signature and never holds the signing key, so it only ever relays what the developer signed. */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

import worker from "../worker/index.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

const MANIFEST_BYTES = 52;
const SIG_BYTES = 64;

/** A .scoutfw bundle laid out as shore/scout_shore/ota.py reads it: manifest + signature + image. */
function bundle({ buoy = 1, version = 0x000201, image = new Uint8Array(300).fill(7), magic = 0x57464353,
  chunk = 128, flags = 0, length, digest } = {}) {
  const manifest = new Uint8Array(MANIFEST_BYTES);
  const view = new DataView(manifest.buffer);
  view.setUint32(0, magic, true);
  view.setUint16(4, buoy, true);
  view.setUint8(6, chunk);
  view.setUint8(7, flags);
  view.setUint32(8, version, true);
  view.setUint32(12, length ?? image.length, true);
  view.setUint32(16, 1_800_000_000, true);
  manifest.set(digest ?? createHash("sha256").update(image).digest(), 20);
  const out = new Uint8Array(MANIFEST_BYTES + SIG_BYTES + image.length);
  out.set(manifest, 0);
  out.set(new Uint8Array(SIG_BYTES).fill(9), MANIFEST_BYTES);
  out.set(image, MANIFEST_BYTES + SIG_BYTES);
  return out;
}

function call(env, token, path, { method = "GET", body, type = "application/json" } = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  let payload;
  if (body !== undefined) {
    payload = body instanceof Uint8Array ? body : new TextEncoder().encode(JSON.stringify(body));
    Object.assign(headers, { "Content-Type": type, "Content-Length": String(payload.length) });
  }
  return worker.fetch(new Request(APP_URL + path, { method, headers, body: payload }), env);
}

const upload = (env, token, buoy, bytes) =>
  call(env, token, `/api/v1/buoys/${buoy}/firmware`, { method: "POST", body: bytes, type: "application/octet-stream" });

/** An admin with a write:firmware token, one shore station, and buoy 1 known to the console. */
async function setup(role = "admin") {
  const env = makeEnv();
  const { client: admin } = await signedIn(env, "admin", "fw-admin@scout.test");
  const device = (await admin.post("/api/devices", { name: "Kaneohe shore" })).body.token;
  await admin.post("/api/fleet/buoys", { buoy_id: 1 });
  const owner = role === "admin" ? admin : (await signedIn(env, role)).client;
  const made = await owner.post("/api/tokens", { name: "release laptop", scopes: ["read:telemetry", "write:firmware"], days: 30 });
  return { env, admin, device, token: made.body.token, made };
}

test("an admin's token uploads a bundle and the shore station sees it pending", async () => {
  const { env, token, device } = await setup();
  const response = await upload(env, token, 1, bundle());
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.job.state, "pending");
  assert.equal(body.job.version, "v0.2.1");
  const listed = await (await call(env, device, "/api/device/firmware")).json();
  assert.equal(listed.jobs.length, 1);
  assert.deepEqual(Object.keys(listed.jobs[0]), ["job_id", "buoy_id", "version", "size", "sha256"]);
  assert.equal(listed.jobs[0].size, MANIFEST_BYTES + SIG_BYTES + 300);
});

test("the shore station downloads exactly the bytes that were uploaded", async () => {
  const { env, token, device } = await setup();
  const sent = bundle();
  const { job } = await (await upload(env, token, 1, sent)).json();
  const response = await call(env, device, `/api/device/firmware/${job.id}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/octet-stream");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), sent);
});

test("a member's token cannot upload firmware, even with the scope", async () => {
  const { env, token, made } = await setup("member");
  assert.equal(made.status, 200);
  assert.equal((await upload(env, token, 1, bundle())).status, 403);
});

test("a token without write:firmware cannot upload", async () => {
  const { env, admin } = await setup();
  const { token } = (await admin.post("/api/tokens", { name: "read only", scopes: ["read:telemetry"], days: 30 })).body;
  assert.equal((await upload(env, token, 1, bundle())).status, 403);
});

test("a malformed bundle is refused and nothing is stored", async () => {
  const { env, token } = await setup();
  const image = new Uint8Array(300).fill(7);
  const bad = [
    bundle({ magic: 0x12345678 }),
    bundle({ chunk: 64 }),
    bundle({ flags: 1 }),
    bundle({ length: 299 }),
    bundle({ digest: new Uint8Array(32) }),
    bundle({ buoy: 2 }),
    bundle({ image }).slice(0, MANIFEST_BYTES + SIG_BYTES),
  ];
  for (const bytes of bad) assert.equal((await upload(env, token, 1, bytes)).status, 400);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM firmware_jobs").get().n, 0);
});

test("a bundle for any buoy (target 0) is accepted for the buoy it is uploaded to", async () => {
  const { env, token } = await setup();
  assert.equal((await upload(env, token, 1, bundle({ buoy: 0 }))).status, 200);
});

test("an image larger than the buoy's 224 KB application area is refused before it is read", async () => {
  const { env, token } = await setup();
  const huge = bundle({ image: new Uint8Array(0x38000 + 1) });
  assert.equal((await upload(env, token, 1, huge)).status, 413);
});

test("an unknown buoy is refused", async () => {
  const { env, token } = await setup();
  assert.equal((await upload(env, token, 9, bundle({ buoy: 9 }))).status, 404);
});

test("a version no higher than one already sent is refused", async () => {
  const { env, token } = await setup();
  await upload(env, token, 1, bundle({ version: 0x000201 }));
  const again = await upload(env, token, 1, bundle({ version: 0x000201 }));
  assert.equal(again.status, 409);
  assert.match((await again.json()).error, /higher than v0\.2\.1/);
});

test("a newer upload replaces one the buoy has not accepted yet", async () => {
  const { env, token, device } = await setup();
  const first = (await (await upload(env, token, 1, bundle({ version: 0x000201 }))).json()).job;
  assert.equal((await upload(env, token, 1, bundle({ version: 0x000202 }))).status, 200);
  const { jobs } = await (await call(env, device, "/api/device/firmware")).json();
  assert.deepEqual(jobs.map((j) => j.version), ["v0.2.2"]);
  const old = env.DB.raw.prepare("SELECT state, bundle FROM firmware_jobs WHERE id = ?").get(first.id);
  assert.equal(old.state, "canceled");
  assert.equal(old.bundle, null);
});

test("an upload during a transfer is refused until it settles", async () => {
  const { env, token, device } = await setup();
  const { job } = await (await upload(env, token, 1, bundle())).json();
  await call(env, device, `/api/device/firmware/${job.id}/status`, { method: "POST", body: { state: "transferring", detail: "48/747" } });
  assert.equal((await upload(env, token, 1, bundle({ version: 0x000202 }))).status, 409);
});

test("the shore's reports move the job, and a finished job drops its bytes", async () => {
  const { env, token, device } = await setup();
  const { job } = await (await upload(env, token, 1, bundle())).json();
  for (const state of ["staged", "offering", "transferring", "trial", "confirmed"]) {
    const response = await call(env, device, `/api/device/firmware/${job.id}/status`, { method: "POST", body: { state } });
    assert.equal(response.status, 200, state);
  }
  const row = env.DB.raw.prepare("SELECT state, bundle FROM firmware_jobs WHERE id = ?").get(job.id);
  assert.equal(row.state, "confirmed");
  assert.equal(row.bundle, null);
  assert.equal((await (await call(env, device, "/api/device/firmware")).json()).jobs.length, 0);
  const late = await call(env, device, `/api/device/firmware/${job.id}/status`, { method: "POST", body: { state: "trial" } });
  assert.equal(late.status, 409);
});

test("a station rejecting a bundle (bad signature) is recorded with its reason", async () => {
  const { env, token, device, admin } = await setup();
  const { job } = await (await upload(env, token, 1, bundle())).json();
  await call(env, device, `/api/device/firmware/${job.id}/status`, { method: "POST", body: { state: "rejected", detail: "signature" } });
  const { jobs } = await (await call(env, token, "/api/v1/buoys/1/firmware")).json();
  assert.equal(jobs[0].state, "rejected");
  assert.equal(jobs[0].detail, "signature");
  // A rejected version never reached the buoy, so the same version may be signed again properly.
  assert.equal((await upload(env, token, 1, bundle())).status, 200);
  assert.ok((await admin.get("/api/audit")).body.entries.some((e) => e.action === "firmware.rejected"));
});

test("an unknown state or an oversized detail is refused", async () => {
  const { env, token, device } = await setup();
  const { job } = await (await upload(env, token, 1, bundle())).json();
  const path = `/api/device/firmware/${job.id}/status`;
  assert.equal((await call(env, device, path, { method: "POST", body: { state: "pending" } })).status, 400);
  assert.equal((await call(env, device, path, { method: "POST", body: { state: "hacked" } })).status, 400);
  assert.equal((await call(env, device, path, { method: "POST", body: { state: "trial", detail: "x".repeat(200) } })).status, 400);
});

test("an admin cancels a job before the buoy accepts it, not after", async () => {
  const { env, token, device } = await setup();
  const { job } = await (await upload(env, token, 1, bundle())).json();
  const cancel = await call(env, token, `/api/v1/firmware/${job.id}/cancel`, { method: "POST", body: {} });
  assert.equal(cancel.status, 200);
  assert.equal((await (await call(env, device, "/api/device/firmware")).json()).jobs.length, 0);
  assert.equal((await call(env, device, `/api/device/firmware/${job.id}`)).status, 404);

  const second = (await (await upload(env, token, 1, bundle({ version: 0x000202 }))).json()).job;
  await call(env, device, `/api/device/firmware/${second.id}/status`, { method: "POST", body: { state: "transferring" } });
  assert.equal((await call(env, token, `/api/v1/firmware/${second.id}/cancel`, { method: "POST", body: {} })).status, 409);
});

test("only the buoy's command station sees and downloads its firmware", async () => {
  const { env, token, device, admin } = await setup();
  const other = (await admin.post("/api/devices", { name: "Second shore" })).body.token;
  const devices = (await admin.get("/api/devices")).body.devices;
  const commander = devices.find((d) => d.name === "Kaneohe shore");
  await admin.post("/api/fleet/buoys/1/command-station", { device_id: commander.id });
  const { job } = await (await upload(env, token, 1, bundle())).json();
  assert.equal((await (await call(env, device, "/api/device/firmware")).json()).jobs.length, 1);
  assert.equal((await (await call(env, other, "/api/device/firmware")).json()).jobs.length, 0);
  assert.equal((await call(env, other, `/api/device/firmware/${job.id}`)).status, 404);
});

test("uploads and cancels are in the audit log", async () => {
  const { env, token, admin } = await setup();
  const { job } = await (await upload(env, token, 1, bundle())).json();
  await call(env, token, `/api/v1/firmware/${job.id}/cancel`, { method: "POST", body: {} });
  const actions = (await admin.get("/api/audit")).body.entries.map((e) => e.action);
  assert.ok(actions.includes("firmware.upload"));
  assert.ok(actions.includes("firmware.cancel"));
});

test("a report cannot move a job back to a state that could be canceled or replaced", async () => {
  const { env, token, device } = await setup();
  const { job } = await (await upload(env, token, 1, bundle())).json();
  const report = (state) => call(env, device, `/api/device/firmware/${job.id}/status`, { method: "POST", body: { state } });
  assert.equal((await report("transferring")).status, 200);
  assert.equal((await report("transferring")).status, 200);
  assert.equal((await report("offering")).status, 409);
  assert.equal((await report("staged")).status, 409);
  assert.equal((await call(env, token, `/api/v1/firmware/${job.id}/cancel`, { method: "POST", body: {} })).status, 409);
});

test("a stale report does not reopen a job canceled since it was read", async () => {
  const { env, token, device } = await setup();
  const { job } = await (await upload(env, token, 1, bundle())).json();
  // The station's report has read the job as pending; the admin cancels just before its write.
  const realPrepare = env.DB.prepare;
  env.DB.prepare = (sql) => {
    if (sql.startsWith("UPDATE firmware_jobs SET state = ?, detail = ?")) {
      env.DB.raw.prepare("UPDATE firmware_jobs SET state = 'canceled', bundle = NULL WHERE id = ?").run(job.id);
    }
    return realPrepare(sql);
  };
  const late = await call(env, device, `/api/device/firmware/${job.id}/status`, { method: "POST", body: { state: "staged" } });
  assert.equal(late.status, 409);
  assert.equal(env.DB.raw.prepare("SELECT state FROM firmware_jobs WHERE id = ?").get(job.id).state, "canceled");
});

test("an upload whose checks no longer hold when it is written is refused, and replaces nothing", async () => {
  const { env, token } = await setup();
  const first = (await (await upload(env, token, 1, bundle({ version: 0x000201 }))).json()).job;
  const { uploadFirmware } = await import("../worker/firmware.js");
  // A station reports "transferring" between the checks and the write: simulate by flipping the
  // state inside the batch's first statement.
  const realBatch = env.DB.batch.bind(env.DB);
  env.DB.batch = async (statements) => {
    env.DB.raw.prepare("UPDATE firmware_jobs SET state = 'transferring' WHERE id = ?").run(first.id);
    return realBatch(statements);
  };
  const result = await uploadFirmware(env.DB, { id: "x", label: "admin" }, "1", bundle({ version: 0x000202 }));
  assert.equal(result.status, 409);
  const rows = env.DB.raw.prepare("SELECT state FROM firmware_jobs ORDER BY uploaded_at").all();
  assert.deepEqual(rows.map((r) => r.state), ["transferring"]);
});
