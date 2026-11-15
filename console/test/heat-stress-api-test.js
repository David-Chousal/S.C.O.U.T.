/* Heat stress on the console (SCO-314, ADR-0017): the MMM setting and its NOAA lookup, migration
 * 0017, /api/heat-stress and /api/v1, the bleaching email-alert rule, and Fred's tool. The science
 * itself is checked against the Python in heat-stress-test.js. */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";

import { READ_TOOLS } from "../worker/assistant/read-tools.js";
import worker from "../worker/index.js";
import { CRW_DATASET_URL, parseCrwReply } from "../worker/mmm.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

const DAY = 24 * 3600 * 1000;
const dayOf = (offset, now = Date.now()) => new Date(now + offset * DAY).toISOString().slice(0, 10);

function addBuoy(env, { id = 1, label = "SCOUT-01", mmm = null } = {}) {
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label, tx_count_reported, mmm_c, mmm_source) VALUES (?, ?, 3, ?, ?)")
    .run(id, label, mmm, mmm === null ? null : "manual");
}

let seq = 0;
/** Three readings a day at `temp` °C for each day offset in `days` (negative = past). */
function seedDays(env, days, temp, { buoyId = 1 } = {}) {
  const insert = env.DB.raw.prepare("INSERT INTO readings (buoy_id, record_seq, timestamp_utc, row_json, received_at) VALUES (?, ?, ?, ?, ?)");
  for (const offset of days) {
    for (const hour of ["00:10", "08:10", "16:10"]) {
      seq += 1;
      const ts = `${dayOf(offset)}T${hour}:00Z`;
      const row = { buoy_id: `SCOUT-${String(buoyId).padStart(2, "0")}`, record_seq: String(seq), timestamp_utc: ts, temp_c: String(temp), flags: "", tx_count: "3" };
      insert.run(buoyId, seq, ts, JSON.stringify(row), Date.now());
    }
  }
}
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

function stubNoaa(t, reply) {
  const calls = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (reply instanceof Error) throw reply;
    return new Response(JSON.stringify(reply), { status: reply.status ?? 200 });
  };
  t.after(() => { globalThis.fetch = real; });
  return calls;
}

const noaaReply = (sst, hs) => ({ table: { columnNames: ["time", "latitude", "longitude", "CRW_SST", "CRW_HOTSPOT"],
  rows: [["2026-11-14T12:00:00Z", 21.475, -157.775, sst, hs]] } });

test("migration 0017 widens alert_rules without losing alert state or off links", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  const dir = new URL("../migrations/", import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files.filter((name) => name < "0017")) db.exec(readFileSync(new URL(f, dir), "utf8"));
  db.exec(`INSERT INTO users (id, email, name, role, created_at) VALUES ('u', 'm@scout.test', '', 'member', 1);
    INSERT INTO alert_rules VALUES ('r', 'u', NULL, 'silence', NULL, NULL, 18, NULL, 1, 1, 1);
    INSERT INTO alert_state VALUES ('r', 1, 1, 5, 6, 20.5);
    INSERT INTO alert_off_links VALUES ('h', 'u', 'r', 99, NULL);`);
  db.exec(readFileSync(new URL("0017-heat-stress.sql", dir), "utf8"));
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM alert_state").get().n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM alert_off_links").get().n, 1);
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  db.exec("INSERT INTO alert_rules VALUES ('b', 'u', NULL, 'bleaching', NULL, NULL, 3, NULL, 1, 1, 1)");
  db.exec("DELETE FROM alert_rules WHERE id = 'r'");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM alert_state").get().n, 0, "the cascade still works");
  db.exec("INSERT INTO buoys (buoy_id, label) VALUES (1, 'SCOUT-01')");
  assert.throws(() => db.exec("UPDATE buoys SET mmm_c = 50"), /CHECK/i);
});

test("a member sets a buoy's MMM by hand; it is audited and shown on Settings", async () => {
  const env = makeEnv();
  addBuoy(env);
  const { client } = await signedIn(env, "member");
  const reply = await client.post("/api/settings/buoys/1/mmm", { mmm_c: 27.6, latitude: 21.46, longitude: -157.79 });
  assert.equal(reply.status, 200);
  assert.equal(reply.body.mmm.value_c, 27.6);
  assert.equal(reply.body.mmm.source, "manual");
  const buoy = (await client.get("/api/settings")).body.buoys[0];
  assert.equal(buoy.mmm_c, 27.6);
  assert.equal(buoy.latitude, 21.46);
  const audit = env.DB.raw.prepare("SELECT * FROM audit_log WHERE action = 'buoy.mmm'").get();
  assert.equal(JSON.parse(audit.after_json).mmm_c, 27.6);
  assert.equal(JSON.parse(audit.before_json).mmm_c, null);
});

test("a guest sees the MMM but cannot change it", async () => {
  const env = makeEnv();
  addBuoy(env, { mmm: 27 });
  const { client } = await signedIn(env, "guest");
  assert.equal((await client.get("/api/heat-stress")).status, 200);
  const reply = await client.post("/api/settings/buoys/1/mmm", { mmm_c: 28 });
  assert.equal(reply.status, 403);
  assert.equal(env.DB.raw.prepare("SELECT mmm_c FROM buoys").get().mmm_c, 27);
});

test("an MMM outside 10–35 °C, or half a position, is refused", async () => {
  const env = makeEnv();
  addBuoy(env);
  const { client } = await signedIn(env, "member");
  assert.equal((await client.post("/api/settings/buoys/1/mmm", { mmm_c: 40 })).status, 400);
  assert.equal((await client.post("/api/settings/buoys/1/mmm", { mmm_c: 27, latitude: 21 })).status, 400);
  assert.equal((await client.post("/api/settings/buoys/1/mmm", { mmm_c: 27, latitude: 95, longitude: 0 })).status, 400);
  assert.equal((await client.post("/api/settings/buoys/9/mmm", { mmm_c: 27 })).status, 400);
});

test("the NOAA lookup stores MMM = CRW SST − HotSpot for the nearest 5 km cell", async (t) => {
  const env = makeEnv();
  addBuoy(env);
  const calls = stubNoaa(t, noaaReply(26.11, -0.76));
  const { client } = await signedIn(env, "member");
  const reply = await client.post("/api/settings/buoys/1/mmm", { lookup: true, latitude: 21.46, longitude: -157.79 });
  assert.equal(reply.status, 200);
  assert.deepEqual({ ...reply.body.mmm, set_at: 0, set_by: null }, { value_c: 26.87, source: "noaa_crw_5km", latitude: 21.46,
    longitude: -157.79, cell_latitude: 21.475, cell_longitude: -157.775, set_by: null, set_at: 0 });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].startsWith(`${CRW_DATASET_URL}?`));
  assert.match(decodeURIComponent(calls[0]), /CRW_SST\[\(last\)\]\[\(21\.4600\)\]\[\(-157\.7900\)\],CRW_HOTSPOT/);
});

test("a land cell or a NOAA outage gives a 502 in words and changes nothing", async (t) => {
  const env = makeEnv();
  addBuoy(env, { mmm: 27 });
  const { client } = await signedIn(env, "member");
  stubNoaa(t, noaaReply(null, null));
  const land = await client.post("/api/settings/buoys/1/mmm", { lookup: true, latitude: 21.3, longitude: -157.85 });
  assert.equal(land.status, 502);
  assert.match(land.body.error, /land, ice or no data/);
  globalThis.fetch = async () => { throw new TypeError("network"); };
  const down = await client.post("/api/settings/buoys/1/mmm", { lookup: true, latitude: 21.46, longitude: -157.79 });
  assert.equal(down.status, 502);
  assert.match(down.body.error, /did not answer/);
  assert.equal(env.DB.raw.prepare("SELECT mmm_c FROM buoys").get().mmm_c, 27);
});

test("parseCrwReply refuses a reply of the wrong shape or an implausible MMM", () => {
  assert.match(parseCrwReply({}).error, /expected shape/);
  assert.match(parseCrwReply(noaaReply(5, -1)).error, /outside/);
});

test("/api/heat-stress says how to set a missing MMM instead of showing zeros", async () => {
  const env = makeEnv();
  addBuoy(env);
  seedDays(env, range(-5, -1), 30);
  const { client } = await signedIn(env, "guest");
  const [buoy] = (await client.get("/api/heat-stress")).body.buoys;
  assert.equal(buoy.mmm, null);
  assert.equal(buoy.current, null);
  assert.deepEqual(buoy.series, []);
  assert.match(buoy.note, /Settings → Buoys/);
});

test("/api/heat-stress reports DHW and the CRW alert for the newest day", async () => {
  const env = makeEnv();
  addBuoy(env, { mmm: 27 });
  seedDays(env, range(-30, -17), 26);
  seedDays(env, range(-16, -1), 29); // 16 days at HotSpot 2 °C → DHW 32/7 = 4.571
  const { client } = await signedIn(env, "member");
  const view = (await client.get("/api/heat-stress")).body;
  assert.equal(view.window_days, 84);
  const [buoy] = view.buoys;
  assert.equal(buoy.threshold_c, 28);
  assert.equal(buoy.current.day, dayOf(-1));
  assert.equal(buoy.current.days_old, 1);
  assert.equal(buoy.current.alert, "Alert Level 1");
  assert.equal(buoy.current.level, 3);
  assert.ok(Math.abs(buoy.current.dhw - 4.571) < 1e-9);
  assert.equal(buoy.series[0].day, dayOf(-30));
});

test("/api/v1/heat-stress needs read:telemetry, and a single buoy can be read", async () => {
  const env = makeEnv();
  addBuoy(env, { mmm: 27 });
  seedDays(env, range(-3, -1), 29);
  const { client } = await signedIn(env, "member");
  const read = (await client.post("/api/tokens", { name: "nb", scopes: ["read:telemetry"], days: 30 })).body.token;
  const write = (await client.post("/api/tokens", { name: "w", scopes: ["write:settings"], days: 30 })).body.token;
  const get = (token, path) => worker.fetch(new Request(APP_URL + path, { headers: { Authorization: `Bearer ${token}` } }), env);
  const all = await get(read, "/api/v1/heat-stress");
  assert.equal(all.status, 200);
  assert.equal((await all.json()).buoys[0].current.alert, "Bleaching Warning");
  const one = await get(read, "/api/v1/buoys/1/heat-stress");
  assert.equal((await one.json()).buoy_id, 1);
  assert.equal((await get(read, "/api/v1/buoys/7/heat-stress")).status, 404);
  assert.equal((await get(write, "/api/v1/heat-stress")).status, 403);
  const spec = await (await worker.fetch(new Request(`${APP_URL}/api/v1/openapi.json`), env)).json();
  assert.ok(spec.paths["/heat-stress"] && spec.paths["/buoys/{buoy_id}/heat-stress"]);
});

test("Fred's get_heat_stress reads the same numbers, and says when a buoy has no MMM", async () => {
  const env = makeEnv();
  addBuoy(env, { mmm: 27 });
  addBuoy(env, { id: 2, label: "SCOUT-02" });
  seedDays(env, range(-16, -1), 29);
  const tool = READ_TOOLS.find((t) => t.name === "get_heat_stress");
  const ctx = { env, user: { id: "x", role: "guest" }, now: Date.now() };
  const { buoys } = await tool.run(ctx, {});
  assert.equal(buoys[0].current.alert, "Alert Level 1");
  assert.ok(buoys[0].weekly_dhw.length >= 2);
  assert.match(buoys[1].note, /No MMM/);
  assert.match((await tool.run(ctx, { buoy_id: 9 })).error, /No buoy 9/);
});
