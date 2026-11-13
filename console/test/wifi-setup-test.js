/* Change WiFi from the console (SCO-310): an admin asks a station that is still online to open its
 * SCOUT-Setup network, so someone near it can move it to another network without touching it.
 * The station hears about it in its next settings poll; a request stays live for 15 minutes. */

import assert from "node:assert/strict";
import { test } from "node:test";

import worker from "../worker/index.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

async function setup() {
  const env = makeEnv();
  const { client: admin } = await signedIn(env, "admin");
  const { client: member } = await signedIn(env, "member");
  const { token } = (await admin.post("/api/devices", { name: "Kaneohe shore" })).body;
  const { id } = env.DB.raw.prepare("SELECT id FROM devices WHERE name = ?").get("Kaneohe shore");
  return { env, admin, member, token, id };
}

async function settingsReply(env, token) {
  const response = await worker.fetch(new Request(`${APP_URL}/api/device/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  }), env);
  return response.json();
}

test("a station with no request is told nothing", async () => {
  const { env, token } = await setup();
  assert.equal((await settingsReply(env, token)).wifi_setup_requested_at, null);
});

test("an admin's request reaches the station as a time in seconds", async () => {
  const { env, admin, token, id } = await setup();
  const before = Math.floor(Date.now() / 1000);
  const reply = await admin.post(`/api/devices/${id}/wifi-setup`);
  assert.equal(reply.status, 200);
  const at = (await settingsReply(env, token)).wifi_setup_requested_at;
  assert.ok(Number.isInteger(at) && at >= before && at <= before + 5);
});

test("the request still leaves the buoys list for the station's parser", async () => {
  const { env, admin, token, id } = await setup();
  await admin.post(`/api/devices/${id}/wifi-setup`);
  assert.ok(Array.isArray((await settingsReply(env, token)).buoys));
});

test("a request older than 15 minutes is no longer sent", async () => {
  const { env, admin, token, id } = await setup();
  await admin.post(`/api/devices/${id}/wifi-setup`);
  env.DB.raw.prepare("UPDATE devices SET wifi_setup_requested_at = ? WHERE id = ?").run(Date.now() - 16 * 60 * 1000, id);
  assert.equal((await settingsReply(env, token)).wifi_setup_requested_at, null);
});

test("only the station asked hears the request", async () => {
  const { env, admin, id } = await setup();
  const other = (await admin.post("/api/devices", { name: "Campus bench" })).body.token;
  await admin.post(`/api/devices/${id}/wifi-setup`);
  assert.equal((await settingsReply(env, other)).wifi_setup_requested_at, null);
});

test("a member cannot ask a station to change WiFi", async () => {
  const { member, id } = await setup();
  const reply = await member.post(`/api/devices/${id}/wifi-setup`);
  assert.equal(reply.status, 403);
});

test("a revoked station cannot be asked", async () => {
  const { admin, id } = await setup();
  await admin.post(`/api/devices/${id}/revoke`);
  const reply = await admin.post(`/api/devices/${id}/wifi-setup`);
  assert.equal(reply.status, 400);
});

test("the request is audited and shows on the stations list", async () => {
  const { admin, id } = await setup();
  await admin.post(`/api/devices/${id}/wifi-setup`);
  const audit = (await admin.get("/api/audit")).body.entries[0];
  assert.equal(audit.action, "device.wifi_setup");
  const device = (await admin.get("/api/devices")).body.devices.find((d) => d.id === id);
  assert.ok(device.wifi_setup_requested_at > 0);
});
