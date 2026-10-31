/* One command station per buoy: two shore stations in range of one buoy must not both send its
 * downlink command in the 1 s listen window, so only the station an admin picks is told about a
 * requested count. With a single active station nothing needs picking. */

import assert from "node:assert/strict";
import { test } from "node:test";

import worker from "../worker/index.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

async function setup() {
  const env = makeEnv();
  const { client: admin } = await signedIn(env, "admin");
  const { client: member } = await signedIn(env, "member");
  await admin.post("/api/fleet/buoys", { buoy_id: 1, label: "Reef north" });
  await member.post("/api/fleet/buoys/1/tx-count", { tx_count: 2 });
  return { env, admin, member };
}

async function station(env, admin, name) {
  const { token } = (await admin.post("/api/devices", { name })).body;
  const { id } = env.DB.raw.prepare("SELECT id FROM devices WHERE name = ?").get(name);
  return { token, id };
}

async function requested(env, token) {
  const response = await worker.fetch(new Request(`${APP_URL}/api/device/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  }), env);
  return (await response.json()).buoys.map((b) => b.buoy_id);
}

test("a lone station sends commands without anyone picking it", async () => {
  const { env, admin } = await setup();
  const only = await station(env, admin, "Kaneohe shore");
  assert.deepEqual(await requested(env, only.token), [1]);
});

test("with two stations and none picked, neither sends the command", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  assert.deepEqual(await requested(env, a.token), []);
  assert.deepEqual(await requested(env, b.token), []);
});

test("only the picked station is told about a buoy's requested count", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  const reply = await admin.post("/api/fleet/buoys/1/command-station", { device_id: b.id });
  assert.equal(reply.status, 200);
  assert.deepEqual(await requested(env, a.token), []);
  assert.deepEqual(await requested(env, b.token), [1]);
  const fleet = (await admin.get("/api/fleet")).body.buoys[0];
  assert.equal(fleet.command_device_id, b.id);
  const audit = (await admin.get("/api/audit")).body.entries[0];
  assert.equal(audit.action, "buoy.command_station");
});

test("only an admin picks the command station, and only an active one", async () => {
  const { env, admin, member } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  assert.equal((await member.post("/api/fleet/buoys/1/command-station", { device_id: a.id })).status, 403);
  assert.equal((await admin.post("/api/fleet/buoys/1/command-station", { device_id: "nope" })).status, 400);
  await admin.post(`/api/devices/${a.id}/revoke`);
  assert.equal((await admin.post("/api/fleet/buoys/1/command-station", { device_id: a.id })).status, 400);
});

test("revoking the picked station clears the choice", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  const b = await station(env, admin, "Campus bench");
  await admin.post("/api/fleet/buoys/1/command-station", { device_id: a.id });
  await admin.post(`/api/devices/${a.id}/revoke`);
  assert.equal((await admin.get("/api/fleet")).body.buoys[0].command_device_id, null);
  assert.deepEqual(await requested(env, b.token), [1]);
});

test("an admin can unpick, going back to the lone-station rule", async () => {
  const { env, admin } = await setup();
  const a = await station(env, admin, "Kaneohe shore");
  await admin.post("/api/fleet/buoys/1/command-station", { device_id: a.id });
  assert.equal((await admin.post("/api/fleet/buoys/1/command-station", { device_id: null })).status, 200);
  assert.equal((await admin.get("/api/fleet")).body.buoys[0].command_device_id, null);
  assert.deepEqual(await requested(env, a.token), [1]);
});
