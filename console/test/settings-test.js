/* Remote buoy settings through the JSON API, the device API and the REST API
 * (docs/engineering/firmware-remote-settings-plan.md). Digests are the firmware's
 * (firmware/test/test_settings, shore/tests/test_settings_registry). */

import assert from "node:assert/strict";
import { test } from "node:test";

import { digestHex, DEFAULTS, settingsState, snapshotError } from "../worker/buoy-settings.js";
import worker from "../worker/index.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

function row(seq, { digest = "", tx = "3", flags = "", ts = "2026-03-01T00:00:00Z" } = {}) {
  return { buoy_id: "SCOUT-01", record_seq: String(seq), timestamp_utc: ts, tx_count: tx, flags, settings_digest: digest };
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

async function setup() {
  const env = makeEnv();
  const token = await deviceToken(env);
  await deviceCall(env, token, "/api/device/readings", { rows: [row(1, { digest: "e674" })] });
  const { client } = await signedIn(env, "member");
  return { env, token, client };
}

const buoy = async (client) => (await client.get("/api/settings")).body.buoys[0];

test("digests and checks agree with the firmware's vectors", () => {
  assert.equal(digestHex(DEFAULTS), "e674");
  assert.equal(digestHex([2, 1, 15, 30, 3300, 3200, 2, 80]), "7e60");
  assert.equal(snapshotError(DEFAULTS), null);
  assert.match(snapshotError([3, 0, 45, 60, 3200, 3100, 3, 70]), /Reading interval/);
  assert.match(snapshotError([3, 0, 30, 60, 3200, 3160, 3, 70]), /50 mV/);
  assert.match(snapshotError([3, 0, 30]), /Every setting/);
});

test("states: default, pending, confirmed, rejected, unreported", () => {
  const none = Object.fromEntries(["tx_count", "slot_phase_h", "sample_interval_min", "audio_clip_s", "conserve_mv",
    "critical_mv", "conserve_every", "humidity_alert_pct"].map((k) => [k, null]));
  assert.equal(settingsState({ settings_digest_reported: "e674" }, none), "default");
  const asked = { ...none, humidity_alert_pct: 80 };
  const wanted = digestHex([3, 0, 30, 60, 3200, 3100, 3, 80]);
  assert.equal(settingsState({ settings_digest_reported: "e674" }, asked), "pending");
  assert.equal(settingsState({ settings_digest_reported: wanted }, asked), "confirmed");
  assert.equal(settingsState({ settings_digest_reported: "e674", cmd_rejected: 1 }, asked), "rejected");
  assert.equal(settingsState({ settings_digest_reported: null }, asked), "unreported");
});

test("a member requests settings; pending until the buoy's digest matches, then confirmed, and audited", async () => {
  const { env, token, client } = await setup();
  const reply = await client.post("/api/settings/buoys/1", { settings: { sample_interval_min: 15, humidity_alert_pct: 80 } });
  assert.equal(reply.status, 200, JSON.stringify(reply.body));
  let b = await buoy(client);
  assert.equal(b.settings_state, "pending");
  assert.equal(b.settings_requested.sample_interval_min, 15);
  assert.deepEqual(b.settings_wanted, [3, 0, 15, 60, 3200, 3100, 3, 80]);

  const device = await (await deviceCall(env, token, "/api/device/settings")).json();
  assert.deepEqual(device.buoys, [{ buoy_id: 1, tx_count_requested: null, settings: "3,0,15,60,3200,3100,3,80",
    settings_digest: digestHex([3, 0, 15, 60, 3200, 3100, 3, 80]) }]);

  await deviceCall(env, token, "/api/device/readings", { rows: [row(2, { digest: b.settings_digest_wanted, ts: "2026-03-02T00:00:00Z" })] });
  b = await buoy(client);
  assert.equal(b.settings_state, "confirmed");
  assert.equal(b.settings_digest_reported, b.settings_digest_wanted);
  const audit = (await client.get("/api/audit")).body.entries.find((e) => e.action === "buoy.settings");
  assert.equal(audit.after_json, '{"sample_interval_min":15,"humidity_alert_pct":80}');
});

test("the transmit count set here is the same request Fleet makes", async () => {
  const { client } = await setup();
  await client.post("/api/settings/buoys/1", { settings: { tx_count: 1 } });
  const fleet = (await client.get("/api/fleet")).body.buoys[0];
  assert.equal(fleet.tx_count_requested, 1);
});

test("a snapshot the buoy would refuse is refused whole, and nothing is stored", async () => {
  const { client } = await setup();
  const bad = await client.post("/api/settings/buoys/1", { settings: { conserve_mv: 3140, humidity_alert_pct: 90 } });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /50 mV/);
  assert.equal((await client.post("/api/settings/buoys/1", { settings: { radio_power: 20 } })).status, 400);
  assert.equal((await client.post("/api/settings/buoys/1", { settings: { audio_clip_s: 20 } })).status, 400);
  assert.equal((await buoy(client)).settings_state, "default");
});

test("null withdraws a request; restore defaults asks for every default explicitly", async () => {
  const { env, token, client } = await setup();
  await client.post("/api/settings/buoys/1", { settings: { humidity_alert_pct: 80 } });
  await client.post("/api/settings/buoys/1", { settings: { humidity_alert_pct: null } });
  assert.equal((await buoy(client)).settings_requested.humidity_alert_pct, null);
  assert.equal((await client.post("/api/settings/buoys/1/defaults", {})).status, 200);
  const device = await (await deviceCall(env, token, "/api/device/settings")).json();
  assert.equal(device.buoys[0].settings, DEFAULTS.join(","));
  assert.equal((await buoy(client)).settings_state, "confirmed");
});

test("CMD_REJECTED from the buoy shows the settings as rejected; a new request clears it", async () => {
  const { env, token, client } = await setup();
  await client.post("/api/settings/buoys/1", { settings: { slot_phase_h: 3 } });
  await deviceCall(env, token, "/api/device/readings",
    { rows: [row(2, { digest: "e674", flags: "CMD_REJECTED", ts: "2026-03-02T00:00:00Z" })] });
  assert.equal((await buoy(client)).settings_state, "rejected");
  await client.post("/api/settings/buoys/1", { settings: { slot_phase_h: 2 } });
  assert.equal((await buoy(client)).settings_state, "pending");
});

test("a guest cannot change settings", async () => {
  const { env } = await setup();
  const { client: guest } = await signedIn(env, "guest");
  assert.equal((await guest.post("/api/settings/buoys/1", { settings: { tx_count: 1 } })).status, 403);
});

test("a malformed digest rejects the push", async () => {
  const { env, token } = await setup();
  const response = await deviceCall(env, token, "/api/device/readings", { rows: [row(3, { digest: "E674" })] });
  assert.equal(response.status, 400);
});

test("a v4 buoy (no digest) keeps the digest it last reported", async () => {
  const { env, token, client } = await setup();
  await deviceCall(env, token, "/api/device/readings", { rows: [row(2, { ts: "2026-03-02T00:00:00Z" })] });
  assert.equal((await buoy(client)).settings_digest_reported, "e674");
});

test("a write:settings API token changes settings through /api/v1", async () => {
  const { env, client } = await setup();
  const { token } = (await client.post("/api/tokens", { name: "script", scopes: ["write:settings"], days: 7 })).body;
  const text = JSON.stringify({ settings: { audio_clip_s: 0 } });
  const response = await worker.fetch(new Request(`${APP_URL}/api/v1/buoys/1/settings`, {
    method: "POST", body: text,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Length": String(text.length) },
  }), env);
  assert.equal(response.status, 200, await response.clone().text());
  assert.equal((await buoy(client)).settings_requested.audio_clip_s, 0);
});

