/* Roles, the transmit-count setting, the device API and the audit log, through the JSON API. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { parseRow } from "../worker/device.js";
import { countState, lifeFor } from "../worker/fleet.js";
import { can } from "../worker/roles.js";
import worker from "../worker/index.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

function row(seq, { tx = "3", flags = "", ts = "2026-03-01T00:00:00Z", buoy = "SCOUT-01" } = {}) {
  return { buoy_id: buoy, record_seq: String(seq), timestamp_utc: ts, tx_count: tx, flags };
}

async function deviceToken(env) {
  const { client } = await signedIn(env, "admin", "dev-admin@scout.test");
  return (await client.post("/api/devices", { name: "Kaneohe shore" })).body.token;
}

function deviceCall(env, token, path, body) {
  const text = body ? JSON.stringify(body) : undefined;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (text !== undefined) headers["Content-Length"] = String(new TextEncoder().encode(text).length);
  return worker.fetch(new Request(APP_URL + path, { method: body ? "POST" : "GET", body: text, headers }), env);
}

const buoy = async (client, id = 1) => (await client.get("/api/fleet")).body.buoys.find((b) => b.buoy_id === id);

test("roles: guests change nothing, members change settings, only admins administer", () => {
  assert.equal(can({ role: "guest" }, "settings.write"), false);
  assert.equal(can({ role: "member" }, "settings.write"), true);
  assert.equal(can({ role: "member" }, "invites.write"), false);
  assert.equal(can({ role: "admin" }, "devices.write"), true);
  assert.equal(can({ role: "admin" }, "unknown.action"), false);
  assert.equal(can(null, "settings.write"), false);
});

test("count states match the shore's CountStatus", () => {
  assert.equal(countState({ tx_count_requested: 2, tx_count_reported: 2 }), "confirmed");
  assert.equal(countState({ tx_count_requested: 2, tx_count_reported: 3 }), "pending");
  assert.equal(countState({ tx_count_requested: 2, tx_count_reported: 3, cmd_rejected: 1 }), "rejected");
  assert.equal(countState({ tx_count_requested: 2, tx_count_reported: null }), "unreported");
  assert.equal(countState({ tx_count_requested: null, tx_count_reported: 3 }), "default");
});

test("estimates come from the Python model's export and fewer transmits never last less", () => {
  const days = [1, 2, 3].map((n) => lifeFor(n, 2).best.days);
  assert.deepEqual(days, [...days].sort((a, b) => b - a));
  assert.ok(lifeFor(3, 1).best.days > 700 && lifeFor(3, 1).best.days < 760);
});

test("the fleet read carries buoys, the battery estimates and the slot labels", async () => {
  const env = makeEnv();
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label) VALUES (1, 'SCOUT-01')").run();
  const { client } = await signedIn(env, "guest");
  const { body } = await client.get("/api/fleet");
  assert.equal(body.buoys[0].state, "default");
  assert.equal(body.estimates.estimate, true);
  assert.equal(body.slotLabels["2"], "00:10 and 16:10 UTC");
});

test("a guest reads every page's data and writes nothing", async () => {
  const env = makeEnv();
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label) VALUES (1, 'SCOUT-01')").run();
  const { client } = await signedIn(env, "guest");
  for (const path of ["/api/session", "/api/fleet", "/api/team", "/api/devices", "/api/audit"]) {
    assert.equal((await client.get(path)).status, 200, path);
  }
  assert.equal((await client.post("/api/fleet/buoys/1/tx-count", { tx_count: 1 })).status, 403);
  assert.equal(env.DB.raw.prepare("SELECT tx_count_requested FROM buoys").get().tx_count_requested, null);
});

test("a member requests a count; it is pending until the buoy reports it, and audited", async () => {
  const env = makeEnv();
  const token = await deviceToken(env);
  await deviceCall(env, token, "/api/device/readings", { rows: [row(1)] });
  const { client } = await signedIn(env, "member");
  assert.equal((await client.post("/api/fleet/buoys/1/tx-count", { tx_count: 1 })).status, 200);
  assert.equal((await buoy(client)).state, "pending");

  const settings = await (await deviceCall(env, token, "/api/device/settings")).json();
  assert.deepEqual(settings.buoys, [{ buoy_id: 1, tx_count_requested: 1 }]);

  await deviceCall(env, token, "/api/device/readings", { rows: [row(2, { tx: "1", ts: "2026-03-02T00:00:00Z" })] });
  assert.equal((await buoy(client)).state, "confirmed");
  const audit = (await client.get("/api/audit")).body.entries.find((e) => e.action === "buoy.tx_count");
  assert.equal(audit.actor_label, "member@scout.test");
  assert.equal(audit.after_json, '{"requested":1}');
});

test("a count outside 1-3 is refused", async () => {
  const env = makeEnv();
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label) VALUES (1, 'SCOUT-01')").run();
  const { client } = await signedIn(env, "member");
  const { status, body } = await client.post("/api/fleet/buoys/1/tx-count", { tx_count: 4 });
  assert.equal(status, 400);
  assert.match(body.error, /must be 1, 2 or 3/);
});

test("CMD_REJECTED from the buoy shows as rejected", async () => {
  const env = makeEnv();
  const token = await deviceToken(env);
  await deviceCall(env, token, "/api/device/readings", { rows: [row(1)] });
  const { client } = await signedIn(env, "member");
  await client.post("/api/fleet/buoys/1/tx-count", { tx_count: 2 });
  await deviceCall(env, token, "/api/device/readings", {
    rows: [row(2, { tx: "3", flags: "CMD_REJECTED", ts: "2026-03-02T00:00:00Z" })] });
  assert.equal((await buoy(client)).state, "rejected");
});

test("device API: no token, a wrong token and a revoked token are all refused", async () => {
  const env = makeEnv();
  assert.equal((await deviceCall(env, "", "/api/device/settings")).status, 401);
  assert.equal((await deviceCall(env, "scd_nope", "/api/device/settings")).status, 401);
  const token = await deviceToken(env);
  const id = env.DB.raw.prepare("SELECT id FROM devices").get().id;
  const { client } = await signedIn(env, "admin", "a2@scout.test");
  await client.post(`/api/devices/${id}/revoke`);
  assert.equal((await deviceCall(env, token, "/api/device/settings")).status, 401);
});

test("device API: repeats are ignored and a bad row rejects the whole push", async () => {
  const env = makeEnv();
  const token = await deviceToken(env);
  const first = await (await deviceCall(env, token, "/api/device/readings", { rows: [row(1), row(2)] })).json();
  const again = await (await deviceCall(env, token, "/api/device/readings", { rows: [row(1), row(2)] })).json();
  assert.equal(first.stored, 2);
  assert.equal(again.stored, 0);
  const bad = await deviceCall(env, token, "/api/device/readings", { rows: [row(3), { ...row(4), tx_count: "9" }] });
  assert.equal(bad.status, 400);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM readings").get().n, 2);
});

test("parseRow validates every field it uses", () => {
  assert.equal(parseRow(row(1)).buoyId, 1);
  assert.equal(parseRow({ ...row(1), buoy_id: "1" }), null);
  assert.equal(parseRow({ ...row(1), timestamp_utc: "2026-03-01 00:00" }), null);
  assert.equal(parseRow({ ...row(1), record_seq: "-1" }), null);
  assert.equal(parseRow(row(1, { tx: "" })).txCount, null);
  // More than a day ahead of now is refused, so a bad buoy clock cannot pin "newest packet".
  assert.equal(parseRow(row(1, { ts: "2026-03-03T00:00:00Z" }), Date.parse("2026-03-01T00:00:00Z")), null);
  assert.ok(parseRow(row(1, { ts: "2026-03-01T12:00:00Z" }), Date.parse("2026-03-01T00:00:00Z")));
});

test("labels people type come back as data, never as markup the API renders", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "admin");
  await client.post("/api/fleet/buoys", { buoy_id: 7, label: "<script>alert(1)</script>" });
  const response = await client.raw("/api/fleet");
  assert.match(response.headers.get("Content-Type"), /^application\/json/);
  assert.equal((await response.json()).buoys[0].label, "<script>alert(1)</script>");
});

test("the last admin cannot be demoted", async () => {
  const env = makeEnv();
  const { client, user } = await signedIn(env, "admin");
  const { body } = await client.post(`/api/team/users/${user.id}/role`, { role: "member" });
  assert.match(body.error, /at least one admin/);
});

test("the settings read carries each buoy and the firmware's settings, from the export", async () => {
  const env = makeEnv();
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label) VALUES (1, 'SCOUT-01')").run();
  const { client } = await signedIn(env, "guest");
  const { status, body } = await client.get("/api/settings");
  assert.equal(status, 200);
  assert.equal(body.buoys[0].label, "SCOUT-01");
  const keys = body.firmware.settings.map((s) => s.key);
  assert.ok(keys.includes("tx_count") && keys.includes("humidity_alert"));
  assert.equal(body.firmware.settings.find((s) => s.key === "sample_interval").value, "every 30 min");
});

test("a member renames a buoy, audited; a guest cannot; bad names are refused", async () => {
  const env = makeEnv();
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label) VALUES (1, 'SCOUT-01')").run();
  const { client: guest } = await signedIn(env, "guest");
  assert.equal((await guest.post("/api/fleet/buoys/1/label", { label: "Reef north" })).status, 403);
  const { client } = await signedIn(env, "member");
  assert.equal((await client.post("/api/fleet/buoys/1/label", { label: "<b>x</b>" })).status, 400);
  assert.equal((await client.post("/api/fleet/buoys/1/label", { label: "Reef north (Kaneohe)" })).status, 200);
  assert.equal(env.DB.raw.prepare("SELECT label FROM buoys").get().label, "Reef north (Kaneohe)");
  const audit = env.DB.raw.prepare("SELECT * FROM audit_log WHERE action = 'buoy.rename'").get();
  assert.equal(audit.before_json, '{"label":"SCOUT-01"}');
});
