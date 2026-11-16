/* Two shore stations hearing one buoy (SCO-290, SCO-316): a reading is stored once, every station
 * that heard it is recorded, and exactly one station answers each buoy — the one an admin picked,
 * else the only station, else the one that heard it most in the last 24 h. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { pruneReceptions, RECEPTION_KEEP_MS } from "../worker/routing.js";
import { jobsForDevice } from "../worker/firmware.js";
import worker from "../worker/index.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

const HOUR = 3600 * 1000;

function row(seq, buoy = "SCOUT-01", ts = "2026-03-01T00:00:00Z") {
  return { buoy_id: buoy, record_seq: String(seq), timestamp_utc: ts, tx_count: "3", flags: "" };
}

function deviceCall(env, token, path, body) {
  const text = body ? JSON.stringify(body) : undefined;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (text !== undefined) headers["Content-Length"] = String(new TextEncoder().encode(text).length);
  return worker.fetch(new Request(APP_URL + path, { method: body ? "POST" : "GET", body: text, headers }), env);
}

async function setup() {
  const env = makeEnv();
  const { client: admin } = await signedIn(env, "admin");
  await admin.post("/api/fleet/buoys", { buoy_id: 1, label: "Reef north" });
  return { env, admin };
}

async function station(env, admin, name) {
  const { token } = (await admin.post("/api/devices", { name })).body;
  const { id } = env.DB.raw.prepare("SELECT id FROM devices WHERE name = ?").get(name);
  return { token, id };
}

const push = async (env, s, rows) => (await deviceCall(env, s.token, "/api/device/readings", { rows })).json();
const settings = async (env, s) => (await deviceCall(env, s.token, "/api/device/settings")).json();

test("two stations pushing the same reading store it once and both succeed", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  const first = await push(env, a, [row(7)]);
  const second = await push(env, b, [row(7)]);
  assert.deepEqual([first.ok, first.stored, second.ok, second.stored], [true, 1, true, 0]);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM readings").get().n, 1);
});

test("every station that heard a reading is recorded once", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  await push(env, a, [row(7)]);
  await push(env, a, [row(7)]);  // a station re-pushing its own day
  await push(env, b, [row(7)]);
  const heard = env.DB.raw.prepare("SELECT device_id FROM receptions ORDER BY device_id").all().map((r) => r.device_id);
  assert.deepEqual(heard, [a.id, b.id].sort());
});

test("a lone station is told it answers every buoy, even with nothing requested", async () => {
  const { env, admin } = await setup();
  const only = await station(env, admin, "Kaneohe shore");
  const reply = await settings(env, only);
  assert.deepEqual(reply.commands, [1]);
  assert.deepEqual(reply.buoys, []);
});

test("with two stations and no pick, the one that heard the buoy most answers it", async () => {
  const { env, admin } = await setup();
  await admin.post("/api/fleet/buoys/1/tx-count", { tx_count: 2 });
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  await push(env, a, [row(1)]);
  await push(env, b, [row(1), row(2)]);
  assert.deepEqual((await settings(env, a)).commands, []);
  assert.deepEqual((await settings(env, a)).buoys, []);
  assert.deepEqual((await settings(env, b)).commands, [1]);
  assert.deepEqual((await settings(env, b)).buoys.map((x) => x.buoy_id), [1]);
});

test("with two stations and nobody hearing the buoy, neither answers", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  assert.deepEqual((await settings(env, a)).commands, []);
  assert.deepEqual((await settings(env, b)).commands, []);
});

test("an admin's pick wins over the station that heard the buoy most", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  await push(env, b, [row(1), row(2)]);
  await admin.post("/api/fleet/buoys/1/command-station", { device_id: a.id });
  assert.deepEqual((await settings(env, a)).commands, [1]);
  assert.deepEqual((await settings(env, b)).commands, []);
});

test("receptions older than 24 h and from revoked stations do not count", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  const c = await station(env, admin, "Old bench");
  await push(env, a, [row(1)]);
  await push(env, b, [row(1), row(2), row(3)]);
  env.DB.raw.prepare("UPDATE receptions SET received_at = ? WHERE device_id = ?").run(Date.now() - 25 * HOUR, b.id);
  await push(env, c, [row(1), row(2), row(3), row(4)]);
  await admin.post(`/api/devices/${c.id}/revoke`, {});
  assert.deepEqual((await settings(env, a)).commands, [1]);
  assert.deepEqual((await settings(env, b)).commands, []);
});

test("a tie goes to the station that heard the buoy last", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  await push(env, a, [row(1)]);
  await push(env, b, [row(2)]);
  env.DB.raw.prepare("UPDATE receptions SET received_at = received_at - 60000 WHERE device_id = ?").run(a.id);
  assert.deepEqual((await settings(env, b)).commands, [1]);
  assert.deepEqual((await settings(env, a)).commands, []);
});

test("firmware jobs follow the same answering station", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  await push(env, b, [row(1)]);
  const now = Date.now();
  env.DB.raw.prepare("INSERT INTO firmware_jobs (id, buoy_id, version, size, sha256, state, uploaded_by, uploaded_at, updated_at) " +
    "VALUES ('j1', 1, 65536, 10, 'ab', 'pending', 'u', ?, ?)").run(now, now);
  assert.deepEqual((await jobsForDevice(env.DB, a.id)).map((j) => j.job_id), []);
  assert.deepEqual((await jobsForDevice(env.DB, b.id)).map((j) => j.job_id), ["j1"]);
});

test("the fleet shows which station answers each buoy and why", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  await push(env, b, [row(1), row(2)]);
  await push(env, a, [row(1)]);
  const fleet = (await admin.get("/api/fleet")).body.buoys[0];
  assert.deepEqual(fleet.answering_station, { device_id: b.id, name: "Campus bench", reason: "heard_most" });
  await admin.post("/api/fleet/buoys/1/command-station", { device_id: a.id });
  const picked = (await admin.get("/api/fleet")).body.buoys[0];
  assert.deepEqual(picked.answering_station, { device_id: a.id, name: "Kaneohe shore", reason: "picked" });
});

test("the stations list shows which buoys each station heard in the last 24 h", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  await push(env, a, [row(1), row(2)]);
  const listed = (await admin.get("/api/devices")).body.devices.find((d) => d.id === a.id);
  assert.equal(listed.heard.length, 1);
  assert.equal(listed.heard[0].buoy_id, 1);
  assert.equal(listed.heard[0].packets, 2);
  assert.ok(listed.heard[0].last_heard_at > 0);
});

test("receptions are pruned after 30 days", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  await push(env, a, [row(1), row(2)]);
  env.DB.raw.prepare("UPDATE receptions SET received_at = ? WHERE record_seq = 1").run(Date.now() - RECEPTION_KEEP_MS - HOUR);
  assert.equal(await pruneReceptions(env.DB), 1);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM receptions").get().n, 1);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM readings").get().n, 2);
});
