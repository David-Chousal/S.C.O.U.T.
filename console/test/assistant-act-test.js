/* Fred, Phase 2 (Act): propose tools make cards, nothing changes until Confirm, confirm re-checks
 * the role, refuses expired or someone else's proposals, runs once, and audits "via Fred". */

import assert from "node:assert/strict";
import { test } from "node:test";

import { PROPOSE_TOOLS } from "../worker/assistant/propose-tools.js";
import { ask, stubGemini } from "./assistant-helpers.js";
import { makeEnv, signedIn } from "./helpers.js";

const tool = (name) => PROPOSE_TOOLS.find((t) => t.name === name);
const stubFiles = () => ({ async put() {}, async get() { return null; } });

async function setup(role = "member", extra = {}) {
  const env = makeEnv({ GEMINI_API_KEY: "k", FILES: stubFiles(), ...extra });
  const { client, user } = await signedIn(env, role);
  const db = env.DB.raw;
  const id = db.prepare("SELECT id FROM users WHERE email = ?").get(user.email).id;
  db.prepare("INSERT INTO buoys (buoy_id, label, tx_count_reported) VALUES (1, 'Reef north', 3)").run();
  db.prepare("INSERT INTO devices (id, name, token_hash, created_by, created_at) VALUES ('d1', 'Kaneohe pier', 'h1', ?, 0)").run(id);
  db.prepare("INSERT INTO devices (id, name, token_hash, created_by, created_at) VALUES ('d2', 'Kona pier', 'h2', ?, 0)").run(id);
  const me = { id, email: user.email, name: "", role };
  return { env, client, me, ctx: { env, user: me, now: Date.now() } };
}

const pending = (env) => env.DB.raw.prepare("SELECT * FROM assistant_actions").all();
const confirm = (client, id) => client.post("/api/assistant/confirm", { id });

test("propose_settings makes a card with send times and battery life, and changes nothing", async () => {
  const { env, ctx } = await setup();
  const got = await tool("propose_settings").run(ctx, { buoy_id: 1, changes: { tx_count: 2 } });
  assert.equal(got.card.title, "Change Reef north's settings");
  const details = Object.fromEntries(got.card.details);
  assert.equal(details["Transmits a day"], "default (3) → 2");
  assert.equal(details["Sends at"], "00:10, 16:10 UTC");
  assert.match(details.Battery, /months on 2 D cells/);
  assert.match(got.status, /Nothing has changed/);
  assert.equal(env.DB.raw.prepare("SELECT tx_count_requested FROM buoys").get().tx_count_requested, null);
  assert.equal(pending(env).length, 1);
});

test("a change the buoy would refuse never becomes a card", async () => {
  const { env, ctx } = await setup();
  assert.match((await tool("propose_settings").run(ctx, { buoy_id: 1, changes: { sample_interval_min: 45 } })).error, /would refuse/);
  assert.match((await tool("propose_settings").run(ctx, { buoy_id: 1, changes: { volume: 3 } })).error, /Unknown setting/);
  assert.match((await tool("propose_settings").run(ctx, { buoy_id: 7, changes: { tx_count: 2 } })).error, /No buoy 7/);
  assert.match((await tool("propose_rename_buoy").run(ctx, { buoy_id: 1, label: "<script>" })).error, /letters/);
  assert.match((await tool("propose_report").run(ctx, { buoys: [1], from: "x", to: "y", columns: ["temp_c"] })).error, /UTC/);
  assert.equal(pending(env).length, 0);
});

test("Confirm runs the change as the person, audited via Fred, once", async () => {
  const { env, client, ctx, me } = await setup();
  const { card } = await tool("propose_settings").run(ctx, { buoy_id: 1, changes: { tx_count: 2 } });
  const done = await confirm(client, card.id);
  assert.equal(done.status, 200);
  assert.match(done.body.message, /Pending/);
  assert.equal(env.DB.raw.prepare("SELECT tx_count_requested FROM buoys").get().tx_count_requested, 2);
  const audit = env.DB.raw.prepare("SELECT * FROM audit_log WHERE action = 'buoy.settings'").get();
  assert.equal(audit.actor_label, `${me.email} via Fred`);
  assert.equal(audit.actor_id, me.id);
  assert.equal(pending(env).length, 0);
  assert.equal((await confirm(client, card.id)).status, 404, "a second click does nothing");
});

test("rename, restore defaults and report all run through Confirm", async () => {
  const { env, client, ctx } = await setup();
  const rename = await tool("propose_rename_buoy").run(ctx, { buoy_id: 1, label: "Reef N" });
  assert.equal((await confirm(client, rename.card.id)).status, 200);
  assert.equal(env.DB.raw.prepare("SELECT label FROM buoys").get().label, "Reef N");
  const restore = await tool("propose_restore_defaults").run(ctx, { buoy_id: 1 });
  assert.equal((await confirm(client, restore.card.id)).status, 200);
  assert.equal(env.DB.raw.prepare("SELECT tx_count_requested FROM buoys").get().tx_count_requested, 3);
  const report = await tool("propose_report").run(ctx, { buoys: [1], from: "2026-11-01T00:00:00Z", to: "2026-11-02T00:00:00Z", columns: ["temp_c"] });
  const made = await confirm(client, report.card.id);
  assert.equal(made.status, 200);
  assert.match(made.body.link, /^\/api\/reports\/[\w-]+\/file\?t=/);
  const labels = env.DB.raw.prepare("SELECT actor_label FROM audit_log WHERE action IN ('buoy.rename', 'buoy.settings', 'report.create')").all();
  assert.equal(labels.length, 3);
  assert.ok(labels.every((r) => r.actor_label.endsWith(" via Fred")));
});

test("an expired proposal is refused and removed", async () => {
  const { env, client, ctx } = await setup();
  const { card } = await tool("propose_rename_buoy").run(ctx, { buoy_id: 1, label: "Later" });
  env.DB.raw.prepare("UPDATE assistant_actions SET expires_at = 1").run();
  const got = await confirm(client, card.id);
  assert.equal(got.status, 410);
  assert.match(got.body.error, /expired/);
  assert.equal(pending(env).length, 0);
  assert.equal(env.DB.raw.prepare("SELECT label FROM buoys").get().label, "Reef north");
});

test("someone else's proposal cannot be confirmed or declined", async () => {
  const { env, ctx } = await setup();
  const { card } = await tool("propose_rename_buoy").run(ctx, { buoy_id: 1, label: "Theirs" });
  const other = (await signedIn(env, "admin", "other@scout.test")).client;
  assert.equal((await confirm(other, card.id)).status, 404);
  assert.equal((await other.post("/api/assistant/decline", { id: card.id })).status, 404);
  assert.equal(pending(env).length, 1);
});

test("Confirm re-checks the role: a member demoted to guest is refused", async () => {
  const { env, client, ctx, me } = await setup();
  const { card } = await tool("propose_rename_buoy").run(ctx, { buoy_id: 1, label: "Nope" });
  env.DB.raw.prepare("UPDATE users SET role = 'guest' WHERE id = ?").run(me.id);
  const got = await confirm(client, card.id);
  assert.equal(got.status, 403);
  assert.equal(env.DB.raw.prepare("SELECT label FROM buoys").get().label, "Reef north");
});

test("Decline drops the proposal", async () => {
  const { env, client, ctx } = await setup();
  const { card } = await tool("propose_rename_buoy").run(ctx, { buoy_id: 1, label: "Dropped" });
  assert.equal((await client.post("/api/assistant/decline", { id: card.id })).status, 200);
  assert.equal(pending(env).length, 0);
});

test("admins route a buoy and revoke a station through Confirm", async () => {
  const { env, client, ctx } = await setup("admin");
  const route = await tool("propose_station_route").run(ctx, { buoy_id: 1, station: "kona" });
  assert.equal(Object.fromEntries(route.card.details)["Command station"], "Kona pier");
  assert.equal((await confirm(client, route.card.id)).status, 200);
  assert.equal(env.DB.raw.prepare("SELECT command_device_id FROM buoys").get().command_device_id, "d2");
  assert.match((await tool("propose_station_route").run(ctx, { buoy_id: 1, station: "pier" })).error, /No single/);
  const revoke = await tool("propose_revoke_station").run(ctx, { station: "Kona pier" });
  assert.equal(Object.fromEntries(revoke.card.details)["Loses route"], "Reef north");
  assert.equal((await confirm(client, revoke.card.id)).status, 200);
  assert.ok(env.DB.raw.prepare("SELECT revoked_at FROM devices WHERE id = 'd2'").get().revoked_at);
  assert.equal(env.DB.raw.prepare("SELECT actor_label FROM audit_log WHERE action = 'device.revoke'").get().actor_label, "admin@scout.test via Fred");
});

test("who is offered which propose tools: guests none, members four, admins six", async (t) => {
  const requests = stubGemini(t, [{ text: "a" }, { text: "b" }, { text: "c" }]);
  for (const role of ["guest", "member", "admin"]) {
    const { client } = await setup(role);
    await ask(client, "hi");
  }
  const offered = requests.map((r) => r.body.tools[0].functionDeclarations.map((d) => d.name).filter((n) => n.startsWith("propose_")));
  assert.deepEqual(offered.map((o) => o.length), [0, 4, 6]);
});

test("a proposal made in conversation streams a card event and the model is told nothing changed", async (t) => {
  const requests = stubGemini(t, [{ calls: [{ name: "propose_settings", args: { buoy_id: 1, changes: { tx_count: 1 } } }] },
    { text: "I've drafted it; click Confirm to send it." }]);
  const { client, env } = await setup();
  const reply = await ask(client, "Drop buoy 1 to one transmit a day");
  const action = reply.events.find((e) => e.event === "action");
  assert.equal(action.data.kind, "settings");
  assert.ok(action.data.expiresAt > Date.now());
  assert.match(JSON.stringify(requests[1].body.contents.at(-1)), /Nothing has changed/);
  assert.equal(env.DB.raw.prepare("SELECT tx_count_requested FROM buoys").get().tx_count_requested, null);
});
