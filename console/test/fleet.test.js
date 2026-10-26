/* Roles, the transmit-count setting, the device API, the audit log and escaping. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { countState, lifeFor } from "../worker/fleet.js";
import { parseRow } from "../worker/device.js";
import { can } from "../worker/roles.js";
import { APP_URL, Browser, makeEnv, signedIn } from "./helpers.js";

function row(seq, { tx = "3", flags = "", ts = "2026-03-01T00:00:00Z", buoy = "SCOUT-01" } = {}) {
  return { buoy_id: buoy, record_seq: String(seq), timestamp_utc: ts, tx_count: tx, flags };
}

async function deviceToken(env) {
  const { browser } = await signedIn(env, "admin", "dev-admin@scout.test");
  const { text } = await browser.post("/devices", { name: "Kaneohe shore" });
  return /scd_[\w-]+/.exec(text)[0];
}

function deviceCall(env, token, path, body, extraHeaders = {}) {
  const text = body ? JSON.stringify(body) : undefined;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...extraHeaders };
  if (text !== undefined) headers["Content-Length"] ??= String(new TextEncoder().encode(text).length);
  return import("../worker/index.js").then(({ default: worker }) => worker.fetch(new Request(APP_URL + path, {
    method: body ? "POST" : "GET", body: text, headers }), env));
}

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

test("a guest sees every page and every control, disabled, and cannot write", async () => {
  const env = makeEnv();
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label) VALUES (1, 'SCOUT-01')").run();
  const { browser } = await signedIn(env, "guest");
  for (const path of ["/settings", "/team", "/devices", "/audit", "/account"]) {
    const { response, text } = await browser.request(path);
    assert.equal(response.status, 200, path);
    if (path !== "/audit" && path !== "/account") assert.match(text, /View only/, path);
  }
  const { text } = await browser.request("/settings");
  assert.match(text, /<select id="tx1" name="tx_count" disabled>/);
  const write = await browser.post("/settings/buoys/1/tx-count", { tx_count: "1" });
  assert.equal(write.response.status, 403);
  assert.equal(env.DB.raw.prepare("SELECT tx_count_requested FROM buoys").get().tx_count_requested, null);
});

test("a member requests a count; it is pending until the buoy reports it, and audited", async () => {
  const env = makeEnv();
  const token = await deviceToken(env);
  await deviceCall(env, token, "/api/device/readings", { rows: [row(1)] });
  const { browser } = await signedIn(env, "member");
  await browser.post("/settings/buoys/1/tx-count", { tx_count: "1" });
  assert.match((await browser.request("/settings")).text, /badge pending/);

  const settings = await (await deviceCall(env, token, "/api/device/settings")).json();
  assert.deepEqual(settings.buoys, [{ buoy_id: 1, tx_count_requested: 1 }]);

  await deviceCall(env, token, "/api/device/readings", { rows: [row(2, { tx: "1", ts: "2026-03-02T00:00:00Z" })] });
  assert.match((await browser.request("/settings")).text, /badge confirmed/);
  const audit = env.DB.raw.prepare("SELECT * FROM audit_log WHERE action = 'buoy.tx_count'").get();
  assert.equal(audit.actor_label, "member@scout.test");
  assert.equal(audit.after_json, '{"requested":1}');
});

test("a count outside 1-3 is refused", async () => {
  const env = makeEnv();
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label) VALUES (1, 'SCOUT-01')").run();
  const { browser } = await signedIn(env, "member");
  const { text } = await browser.post("/settings/buoys/1/tx-count", { tx_count: "4" });
  assert.match(text, /must be 1, 2 or 3/);
});

test("CMD_REJECTED from the buoy shows as rejected", async () => {
  const env = makeEnv();
  const token = await deviceToken(env);
  await deviceCall(env, token, "/api/device/readings", { rows: [row(1)] });
  const { browser } = await signedIn(env, "member");
  await browser.post("/settings/buoys/1/tx-count", { tx_count: "2" });
  await deviceCall(env, token, "/api/device/readings", {
    rows: [row(2, { tx: "3", flags: "CMD_REJECTED", ts: "2026-03-02T00:00:00Z" })] });
  assert.match((await browser.request("/settings")).text, /badge rejected/);
});

test("device API: no token, a wrong token and a revoked token are all refused", async () => {
  const env = makeEnv();
  assert.equal((await deviceCall(env, "", "/api/device/settings")).status, 401);
  assert.equal((await deviceCall(env, "scd_nope", "/api/device/settings")).status, 401);
  const token = await deviceToken(env);
  const id = env.DB.raw.prepare("SELECT id FROM devices").get().id;
  const { browser } = await signedIn(env, "admin", "a2@scout.test");
  await browser.post(`/devices/${id}/revoke`, {});
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

test("names a user typed are escaped in every page", async () => {
  const env = makeEnv();
  const { browser } = await signedIn(env, "admin");
  await browser.post("/settings/buoys", { buoy_id: "7", label: "<script>alert(1)</script>" });
  const { text } = await browser.request("/settings");
  assert.doesNotMatch(text, /<script>alert/);
  assert.match(text, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test("the last admin cannot be demoted", async () => {
  const env = makeEnv();
  const { browser, user } = await signedIn(env, "admin");
  const { text } = await browser.post(`/team/users/${user.id}/role`, { role: "member" });
  assert.match(text, /at least one admin/);
});

test("pages fit a phone: every form control is labelled and tables scroll in their own box", async () => {
  const env = makeEnv();
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label) VALUES (1, 'SCOUT-01')").run();
  const { browser } = await signedIn(env, "admin");
  for (const path of ["/settings", "/team", "/devices"]) {
    const { text } = await browser.request(path);
    const ids = [...text.matchAll(/<(?:input|select) id="([^"]+)"/g)].map((m) => m[1]);
    for (const id of ids) assert.match(text, new RegExp(`<label[^>]*for="${id}"`), `${path} #${id}`);
    for (const table of text.matchAll(/<table>/g)) {
      assert.ok(text.slice(0, table.index).endsWith('<div class="table-wrap">'), path);
    }
  }
});

test("a successful change redirects, so a reload cannot repeat it", async () => {
  const env = makeEnv();
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label) VALUES (1, 'SCOUT-01')").run();
  const { browser } = await signedIn(env, "member");
  const { response } = await browser.post("/settings/buoys/1/tx-count", { tx_count: "2" });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("Location"), "/settings?saved=1");
  assert.match((await browser.request("/settings?saved=1")).text, /Saved\./);
});
