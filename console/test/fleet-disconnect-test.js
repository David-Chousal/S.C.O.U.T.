/* Disconnecting a buoy on Fleet (2026-11-06): its packets stop being stored and no station is sent
 * its settings; adding it again reconnects it; only a disconnected buoy can be deleted, with its
 * settings and readings; admins only; every step audited. */

import assert from "node:assert/strict";
import { test } from "node:test";

import worker from "../worker/index.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

function row(seq, ts = "2026-11-05T00:10:00Z") {
  return { buoy_id: "SCOUT-01", record_seq: String(seq), timestamp_utc: ts, tx_count: "3", flags: "", settings_digest: "e674" };
}

function push(env, token, rows) {
  const text = JSON.stringify({ rows });
  return worker.fetch(new Request(`${APP_URL}/api/device/readings`, { method: "POST", body: text,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Length": String(text.length) } }), env);
}

async function setup() {
  const env = makeEnv();
  const { client } = await signedIn(env, "admin");
  const { token } = (await client.post("/api/devices", { name: "Kona pier" })).body;
  await push(env, token, [row(1)]);
  return { env, client, token, count: () => env.DB.raw.prepare("SELECT COUNT(*) AS n FROM readings").get().n };
}

test("a disconnected buoy's packets are accepted but not stored, and it gets no settings", async () => {
  const { env, client, token, count } = await setup();
  assert.equal(count(), 1);
  assert.equal((await client.post("/api/fleet/buoys/1/disconnect")).status, 200);
  const reply = await (await push(env, token, [row(2, "2026-11-05T08:10:00Z")])).json();
  assert.deepEqual([reply.stored, reply.ignored], [0, 1]);
  assert.equal(count(), 1);
  await client.post("/api/settings/buoys/1", { settings: { tx_count: 2 } });
  const settings = await (await worker.fetch(new Request(`${APP_URL}/api/device/settings`, { headers: { Authorization: `Bearer ${token}` } }), env)).json();
  assert.deepEqual(settings.buoys, []);
  const fleet = (await client.get("/api/fleet")).body.buoys[0];
  assert.ok(fleet.disconnected_at);
});

test("adding the buoy again reconnects it", async () => {
  const { env, client, token, count } = await setup();
  await client.post("/api/fleet/buoys/1/disconnect");
  const again = await client.post("/api/fleet/buoys", { buoy_id: 1 });
  assert.equal(again.status, 200);
  assert.equal(again.body.reconnected, true);
  await push(env, token, [row(3, "2026-11-05T16:10:00Z")]);
  assert.equal(count(), 2);
});

test("only a disconnected buoy can be deleted; deleting removes its settings and readings", async () => {
  const { env, client, count } = await setup();
  const early = await client.post("/api/fleet/buoys/1/delete");
  assert.equal(early.status, 400);
  assert.match(early.body.error, /Disconnect/);
  await client.post("/api/settings/buoys/1", { settings: { humidity_alert_pct: 80 } });
  await client.post("/api/fleet/buoys/1/disconnect");
  assert.equal((await client.post("/api/fleet/buoys/1/delete")).status, 200);
  assert.equal(count(), 0);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM buoys").get().n, 0);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM buoy_settings").get().n, 0);
  const actions = env.DB.raw.prepare("SELECT action FROM audit_log WHERE action LIKE 'buoy.%' ORDER BY id").all().map((r) => r.action);
  assert.deepEqual(actions.slice(-2), ["buoy.disconnect", "buoy.delete"]);
});

test("members cannot disconnect or delete", async () => {
  const { env } = await setup();
  const { client } = await signedIn(env, "member");
  assert.equal((await client.post("/api/fleet/buoys/1/disconnect")).status, 403);
  assert.equal((await client.post("/api/fleet/buoys/1/delete")).status, 403);
});
