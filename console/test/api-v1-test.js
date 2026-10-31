/* Phase B (SCO-240): personal API tokens, the bearer-token REST API under /api/v1, its OpenAPI
 * file, and the readings the console stores, now readable by the front end and by tokens. */

import assert from "node:assert/strict";
import { test } from "node:test";

import worker from "../worker/index.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

function row(seq, ts, temp = "26.1") {
  return { buoy_id: "SCOUT-01", record_seq: String(seq), timestamp_utc: ts, tx_count: "3", flags: "", temp_c: temp, battery_v: "3.30" };
}

async function pushReadings(env, rows) {
  const { client: admin } = await signedIn(env, "admin", "dev-admin@scout.test");
  const { token } = (await admin.post("/api/devices", { name: "Kaneohe shore" })).body;
  const text = JSON.stringify({ rows });
  await worker.fetch(new Request(`${APP_URL}/api/device/readings`, {
    method: "POST", body: text,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Length": String(text.length) },
  }), env);
}

function bearer(env, token, path, { method = "GET", body } = {}) {
  const text = body === undefined ? undefined : JSON.stringify(body);
  const headers = { Authorization: `Bearer ${token}` };
  if (text !== undefined) Object.assign(headers, { "Content-Type": "application/json", "Content-Length": String(text.length) });
  return worker.fetch(new Request(APP_URL + path, { method, headers, body: text }), env);
}

async function makeToken(client, scopes = ["read:telemetry"], days = 30, name = "laptop") {
  return client.post("/api/tokens", { name, scopes, days });
}

test("a member creates a token, sees it once, and only its hash is stored", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "member");
  const { status, body } = await makeToken(client);
  assert.equal(status, 200);
  assert.match(body.token, /^sct_[\w-]{30,}$/);
  const stored = env.DB.raw.prepare("SELECT token_hash, scopes FROM api_tokens").get();
  assert.notEqual(stored.token_hash, body.token);
  assert.equal(stored.scopes, "read:telemetry");
  const listed = (await client.get("/api/tokens")).body.tokens;
  assert.equal(listed.length, 1);
  assert.equal(listed[0].token, undefined);
  assert.equal((await client.get("/api/audit")).body.entries[0].action, "token.create");
});

test("a guest sees the developer page's data but cannot create a token", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "guest");
  assert.equal((await client.get("/api/tokens")).status, 200);
  assert.equal((await makeToken(client)).status, 403);
});

test("an unknown scope, a missing name or an odd expiry is refused", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "member");
  assert.equal((await makeToken(client, ["root"])).status, 400);
  assert.equal((await makeToken(client, ["read:telemetry"], 30, "")).status, 400);
  assert.equal((await makeToken(client, ["read:telemetry"], 9999)).status, 400);
});

test("a read:telemetry token reads buoys, readings and settings", async () => {
  const env = makeEnv();
  await pushReadings(env, [row(1, "2026-10-30T00:10:00Z", "26.1"), row(2, "2026-10-30T08:10:00Z", "26.4")]);
  const { client } = await signedIn(env, "member");
  const { token } = (await makeToken(client)).body;
  const buoys = await (await bearer(env, token, "/api/v1/buoys")).json();
  assert.equal(buoys.buoys[0].buoy_id, 1);
  const readings = await (await bearer(env, token, "/api/v1/buoys/1/readings")).json();
  assert.deepEqual(readings.readings.map((r) => r.temp_c), ["26.4", "26.1"]);
  const settings = await bearer(env, token, "/api/v1/settings");
  assert.equal(settings.status, 200);
});

test("readings can be limited to a time range and a count", async () => {
  const env = makeEnv();
  await pushReadings(env, [1, 2, 3, 4].map((i) => row(i, `2026-10-30T0${i}:00:00Z`)));
  const { client } = await signedIn(env, "member");
  const { token } = (await makeToken(client)).body;
  const ranged = await (await bearer(env, token,
    "/api/v1/buoys/1/readings?from=2026-10-30T02:00:00Z&to=2026-10-30T03:00:00Z")).json();
  assert.deepEqual(ranged.readings.map((r) => r.record_seq), ["3", "2"]);
  const limited = await (await bearer(env, token, "/api/v1/buoys/1/readings?limit=1")).json();
  assert.equal(limited.readings.length, 1);
  assert.equal((await bearer(env, token, "/api/v1/buoys/1/readings?limit=0")).status, 400);
});

test("no token, a revoked token, an expired token or a disabled owner gets 401", async () => {
  const env = makeEnv();
  assert.equal((await bearer(env, "", "/api/v1/buoys")).status, 401);
  const { client, user } = await signedIn(env, "member");
  const { token, id } = (await makeToken(client)).body;
  await client.post(`/api/tokens/${id}/revoke`);
  assert.equal((await bearer(env, token, "/api/v1/buoys")).status, 401);
  const second = (await makeToken(client, ["read:telemetry"], 7, "second")).body;
  env.DB.raw.prepare("UPDATE api_tokens SET expires_at = 1 WHERE id = ?").run(second.id);
  assert.equal((await bearer(env, second.token, "/api/v1/buoys")).status, 401);
  const third = (await makeToken(client, ["read:telemetry"], 7, "third")).body;
  env.DB.raw.prepare("UPDATE users SET disabled = 1 WHERE id = ?").run(user.id);
  assert.equal((await bearer(env, third.token, "/api/v1/buoys")).status, 401);
});

test("a token without the scope is refused, and write:settings follows the owner's role", async () => {
  const env = makeEnv();
  await pushReadings(env, [row(1, "2026-10-30T00:10:00Z")]);
  const { client: member } = await signedIn(env, "member");
  const reader = (await makeToken(member)).body.token;
  assert.equal((await bearer(env, reader, "/api/v1/buoys/1/tx-count", { method: "POST", body: { tx_count: 2 } })).status, 403);
  const writer = (await makeToken(member, ["write:settings"], 30, "writer")).body.token;
  assert.equal((await bearer(env, writer, "/api/v1/buoys")).status, 403);
  const write = await bearer(env, writer, "/api/v1/buoys/1/tx-count", { method: "POST", body: { tx_count: 2 } });
  assert.equal(write.status, 200);
  assert.equal(env.DB.raw.prepare("SELECT tx_count_requested FROM buoys WHERE buoy_id = 1").get().tx_count_requested, 2);
  env.DB.raw.prepare("UPDATE users SET role = 'guest' WHERE email = 'member@scout.test'").run();
  assert.equal((await bearer(env, writer, "/api/v1/buoys/1/tx-count", { method: "POST", body: { tx_count: 1 } })).status, 403);
});

test("you can only revoke your own token", async () => {
  const env = makeEnv();
  const { client: owner } = await signedIn(env, "member");
  const { id } = (await makeToken(owner)).body;
  const { client: other } = await signedIn(env, "member", "other@scout.test");
  assert.equal((await other.post(`/api/tokens/${id}/revoke`)).status, 400);
});

test("the OpenAPI file is public and names every /api/v1 path", async () => {
  const env = makeEnv();
  const response = await worker.fetch(new Request(`${APP_URL}/api/v1/openapi.json`), env);
  assert.equal(response.status, 200);
  const spec = await response.json();
  assert.equal(spec.openapi.split(".")[0], "3");
  for (const path of ["/buoys", "/buoys/{buoy_id}/readings", "/settings", "/buoys/{buoy_id}/tx-count"]) {
    assert.ok(spec.paths[path], path);
  }
});

test("the signed-in front end reads a buoy's readings too", async () => {
  const env = makeEnv();
  await pushReadings(env, [row(1, "2026-10-30T00:10:00Z")]);
  const { client } = await signedIn(env, "guest");
  const { status, body } = await client.get("/api/readings?buoy=1");
  assert.equal(status, 200);
  assert.equal(body.readings[0].temp_c, "26.1");
});
