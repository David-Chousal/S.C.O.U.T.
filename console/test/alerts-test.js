/* Email alerts (SCO-301, ADR-0015): rules on Settings → Notifications, evaluated on ingest and on
 * the hourly cron, sent through a stubbed Resend fetch. */

import { test } from "node:test";
import assert from "node:assert/strict";

import worker from "../worker/index.js";
import { decide, HOURLY_CRON } from "../worker/alerts/evaluate.js";
import { APP_URL, Client, makeEnv, signedIn } from "./helpers.js";

const KEY = "re_test_key_never_logged";
const HOUR = 3600 * 1000;
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

/** Replace fetch with a Resend stand-in that records each email (or refuses with `status`). */
function stubResend(t, { status = 200 } = {}) {
  const sent = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://api.resend.com/emails");
    if (status !== 200) return new Response(JSON.stringify({ name: "validation_error", message: `bad ${init.body}` }), { status });
    sent.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: `e${sent.length}` }), { status: 200 });
  };
  t.after(() => { globalThis.fetch = real; });
  return sent;
}

/** Capture console.error lines so tests can prove nothing secret is logged. */
function captureErrors(t) {
  const lines = [];
  const real = console.error;
  console.error = (...args) => lines.push(args.join(" "));
  t.after(() => { console.error = real; });
  return lines;
}

async function setup(t, extra = {}, { status } = {}) {
  const sent = stubResend(t, { status });
  const env = makeEnv({ RESEND_API_KEY: KEY, ...extra });
  const admin = await signedIn(env, "admin", "dev-admin@scout.test");
  const token = (await admin.client.post("/api/devices", { name: "Kaneohe shore" })).body.token;
  const member = await signedIn(env, "member", "member@scout.test");
  await member.client.post("/api/alerts/switch", { enabled: true });
  return { env, sent, token, member, admin };
}

let seq = 0;
function row(fields = {}, { buoy = "SCOUT-01", at = Date.now() - 60_000, flags = "" } = {}) {
  seq += 1;
  return { buoy_id: buoy, record_seq: String(seq), timestamp_utc: iso(at), tx_count: "3", flags, ...fields };
}

async function push(env, token, rows) {
  const text = JSON.stringify({ rows });
  const response = await worker.fetch(new Request(`${APP_URL}/api/device/readings`, {
    method: "POST", body: text,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Length": String(text.length) },
  }), env);
  return { status: response.status, body: await response.json() };
}

const battery = { kind: "threshold", metric: "battery_v", op: "below", value: 3.2, buoy_id: null };
const history = (env) => env.DB.raw.prepare("SELECT * FROM alert_history ORDER BY id").all();

test("a threshold fires once on entering breach and re-arms only past the hysteresis margin", async (t) => {
  const { env, sent, token, member } = await setup(t);
  assert.equal((await member.client.post("/api/alerts/rules", battery)).status, 200);
  await push(env, token, [row({ battery_v: "3.30" }, { at: Date.now() - 50 * 60_000 })]);
  assert.equal(sent.length, 0);
  await push(env, token, [row({ battery_v: "3.15" }, { at: Date.now() - 40 * 60_000 })]);
  assert.equal(sent.length, 1);
  await push(env, token, [row({ battery_v: "3.14" }, { at: Date.now() - 30 * 60_000 })]);
  assert.equal(sent.length, 1, "still in breach: no second email");
  // 3.22 is above the line but inside the 50 mV margin: still firing, nothing sent.
  await push(env, token, [row({ battery_v: "3.22" }, { at: Date.now() - 20 * 60_000 })]);
  await push(env, token, [row({ battery_v: "3.10" }, { at: Date.now() - 15 * 60_000 })]);
  assert.equal(sent.length, 1, "hovering at the line does not flap");
  await push(env, token, [row({ battery_v: "3.30" }, { at: Date.now() - 10 * 60_000 })]);
  await push(env, token, [row({ battery_v: "3.10" }, { at: Date.now() - 5 * 60_000 })]);
  assert.equal(sent.length, 2, "re-armed after clearing, fires again");
  assert.equal(sent[0].to[0], "member@scout.test");
  assert.match(sent[0].subject, /SCOUT-01: Battery below 3\.2 V/);
});

test("decide reminds while in breach once the interval has passed", () => {
  const rule = { kind: "threshold", metric: "battery_v", op: "below", value: 3.2, remind_hours: 6 };
  const t0 = Date.UTC(2026, 10, 6);
  const fired = decide(rule, null, 3.1, t0);
  assert.equal(fired.event, "alert");
  const state = { firing: 1, since: t0, last_sent_at: t0 };
  assert.equal(decide(rule, state, 3.1, t0 + 5 * HOUR).event, null);
  assert.equal(decide(rule, state, 3.1, t0 + 6 * HOUR).event, "reminder");
  assert.equal(decide({ ...rule, remind_hours: null }, state, 3.1, t0 + 60 * HOUR).event, null);
});

test("a reminder is emailed on a later push while the reading stays in breach", async (t) => {
  const { env, sent, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", { ...battery, remind_hours: 1 });
  await push(env, token, [row({ battery_v: "3.1" }, { at: Date.now() - 30 * 60_000 })]);
  env.DB.raw.prepare("UPDATE alert_state SET last_sent_at = last_sent_at - ?").run(2 * HOUR);
  await push(env, token, [row({ battery_v: "3.1" }, { at: Date.now() - 20 * 60_000 })]);
  assert.equal(sent.length, 2);
  assert.match(sent[1].subject, /^Still: SCOUT-01/);
});

test("a flag rule fires when the firmware flag appears and re-arms when it goes", async (t) => {
  const { env, sent, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", { kind: "flag", metric: "HUMIDITY_HIGH", buoy_id: 1 });
  await push(env, token, [row({}, { flags: "", at: Date.now() - 30 * 60_000 })]);
  await push(env, token, [row({}, { flags: "HUMIDITY_HIGH|POWER_CONSERVE", at: Date.now() - 20 * 60_000 })]);
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /HUMIDITY_HIGH/);
  await push(env, token, [row({}, { flags: "HUMIDITY_HIGH", at: Date.now() - 10 * 60_000 })]);
  assert.equal(sent.length, 1);
});

test("missing or non-numeric values and older rows never fire", async (t) => {
  const { env, sent, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", battery);
  await push(env, token, [row({ battery_v: "" })]);
  await push(env, token, [row({ battery_v: "low" })]);
  await push(env, token, [row({ battery_v: "3.4" }, { at: Date.now() - 60_000 })]);
  await push(env, token, [row({ battery_v: "3.0" }, { at: Date.now() - 50 * HOUR })]);
  assert.equal(sent.length, 0);
});

test("a silence rule fires from the hourly cron, and the daily jobs do not run then", async (t) => {
  const { env, sent, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", { kind: "silence", value: 18, buoy_id: null });
  await push(env, token, [row({ battery_v: "3.4" })]);
  const now = Date.now();
  env.DB.raw.prepare("UPDATE buoys SET last_seen_at = ?").run(now - 20 * HOUR);
  const ctx = { waitUntil() {} };
  await worker.scheduled({ cron: HOURLY_CRON, scheduledTime: now }, env, ctx);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /SCOUT-01: Quiet for 18 h/);
  await worker.scheduled({ cron: HOURLY_CRON, scheduledTime: now + HOUR }, env, ctx);
  assert.equal(sent.length, 1, "fires once");
  const daily = env.DB.raw.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action LIKE 'backup%' OR action LIKE 'assistant%'").get();
  assert.equal(daily.n, 0);
});

test("a disconnected buoy never alerts, on ingest or on the cron", async (t) => {
  const { env, sent, token, member, admin } = await setup(t);
  await member.client.post("/api/alerts/rules", battery);
  await member.client.post("/api/alerts/rules", { kind: "silence", value: 1 });
  await push(env, token, [row({ battery_v: "3.4" })]);
  await admin.client.post("/api/fleet/buoys/1/disconnect");
  await push(env, token, [row({ battery_v: "3.0" })]);
  env.DB.raw.prepare("UPDATE buoys SET last_seen_at = ?").run(Date.now() - 48 * HOUR);
  await worker.scheduled({ cron: HOURLY_CRON, scheduledTime: Date.now() }, env, { waitUntil() {} });
  assert.equal(sent.length, 0);
});

test("everything that fires in one push goes out as one email", async (t) => {
  const { env, sent, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", battery);
  await member.client.post("/api/alerts/rules", { kind: "threshold", metric: "internal_humidity_pct", op: "above", value: 70 });
  await push(env, token, [
    row({ battery_v: "3.1", internal_humidity_pct: "80" }, { buoy: "SCOUT-01" }),
    row({ battery_v: "3.0" }, { buoy: "SCOUT-02" }),
  ]);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /^3 alerts on SCOUT-01, SCOUT-02/);
  assert.equal((sent[0].html.match(/Turn this alert off/g) || []).length, 3);
  assert.equal(history(env).length, 3);
});

test("per-person and console-wide daily caps stop sends and are recorded", async (t) => {
  const { env, sent, token, member } = await setup(t, { ALERT_DAILY_CAP_PERSON: "1", ALERT_DAILY_CAP_TOTAL: "2" });
  await member.client.post("/api/alerts/rules", battery);
  await push(env, token, [row({ battery_v: "3.1" }, { at: Date.now() - 30 * 60_000 })]);
  await member.client.post("/api/alerts/test");
  assert.equal(sent.length, 1);
  const view = (await member.client.get("/api/alerts")).body;
  assert.equal(view.history[0].status, "rate_limited");
  assert.match(view.history[0].reason, /your daily cap of 1/);
  assert.equal(view.caps.cappedToday, 1);

  const other = await signedIn(env, "member", "other@scout.test");
  await other.client.post("/api/alerts/switch", { enabled: true });
  assert.equal((await other.client.post("/api/alerts/test")).body.delivery, "sent");
  assert.equal((await (await signedIn(env, "admin", "third@scout.test")).client.post("/api/alerts/test")).body.delivery, "rate_limited");
  assert.equal(sent.length, 2);
});

test("guests cannot have rules, and a guest's leftover rule never alerts", async (t) => {
  const { env, sent, token, member } = await setup(t);
  const guest = await signedIn(env, "guest", "guest@scout.test");
  assert.equal((await guest.client.post("/api/alerts/rules", battery)).status, 403);
  assert.equal((await guest.client.post("/api/alerts/switch", { enabled: true })).status, 403);
  assert.equal((await guest.client.post("/api/alerts/test")).status, 403);
  await member.client.post("/api/alerts/rules", battery);
  env.DB.raw.prepare("UPDATE users SET role = 'guest' WHERE email = 'member@scout.test'").run();
  await push(env, token, [row({ battery_v: "3.0" })]);
  assert.equal(sent.length, 0);
});

test("alerts go only to the account email; a typed address is ignored", async (t) => {
  const { env, sent, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", { ...battery, email: "stranger@example.com", to: "stranger@example.com" });
  await push(env, token, [row({ battery_v: "3.0" })]);
  assert.deepEqual(sent.map((m) => m.to), [["member@scout.test"]]);
  assert.doesNotMatch(JSON.stringify(sent), /stranger/);
});

test("rules are personal: another member cannot see, edit or delete them", async (t) => {
  const { env, member } = await setup(t);
  const { id } = (await member.client.post("/api/alerts/rules", battery)).body;
  const other = await signedIn(env, "member", "other@scout.test");
  assert.equal((await other.client.get("/api/alerts")).body.rules.length, 0);
  assert.equal((await other.client.post(`/api/alerts/rules/${id}`, { enabled: false })).status, 404);
  assert.equal((await other.client.post(`/api/alerts/rules/${id}/delete`)).status, 404);
  assert.equal((await member.client.post(`/api/alerts/rules/${id}`, { value: 3.1 })).status, 200);
  assert.equal((await member.client.get("/api/alerts")).body.rules[0].description, "Battery below 3.1 V");
  assert.equal((await member.client.post(`/api/alerts/rules/${id}/delete`)).status, 200);
});

test("the off link turns off that one rule, once, with no sign-in", async (t) => {
  const { env, sent, token, member } = await setup(t);
  const a = (await member.client.post("/api/alerts/rules", battery)).body.id;
  const b = (await member.client.post("/api/alerts/rules", { kind: "flag", metric: "RTC_LOST" })).body.id;
  await push(env, token, [row({ battery_v: "3.0" })]);
  const link = /https:\/\/console\.test\/alerts\/off\/\?token=([\w-]+)/.exec(sent[0].text);
  assert.ok(link);
  const stranger = new Client(env);
  const info = await stranger.get(`/api/alerts/off/${link[1]}`);
  assert.equal(info.body.description, "Battery below 3.2 V");
  assert.equal((await stranger.raw(`/api/alerts/off/${link[1]}`, { method: "POST", body: "{}" })).status, 200);
  assert.equal((await stranger.raw(`/api/alerts/off/${link[1]}`, { method: "POST", body: "{}" })).status, 410);
  const rules = Object.fromEntries((await member.client.get("/api/alerts")).body.rules.map((r) => [r.id, r.enabled]));
  assert.deepEqual(rules, { [a]: false, [b]: true });
});

test("List-Unsubscribe headers allow a mail client's one-click POST", async (t) => {
  const { env, sent, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", battery);
  await push(env, token, [row({ battery_v: "3.0" })]);
  const { headers } = sent[0];
  assert.equal(headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  const url = /^<(.+)>$/.exec(headers["List-Unsubscribe"])[1];
  const body = "List-Unsubscribe=One-Click";
  const response = await worker.fetch(new Request(url.replace("https://console.test", APP_URL), {
    method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": String(body.length) },
  }), env);
  assert.equal(response.status, 200);
  assert.equal((await member.client.get("/api/alerts")).body.rules[0].enabled, false);
});

test("a failing send never fails the push, and nothing secret reaches logs or audit", async (t) => {
  const errors = captureErrors(t);
  const { env, token, member } = await setup(t, {}, { status: 422 });
  await member.client.post("/api/alerts/rules", battery);
  const reply = await push(env, token, [row({ battery_v: "3.0" })]);
  assert.equal(reply.status, 200);
  assert.equal(reply.body.stored, 1);
  assert.equal(history(env)[0].status, "failed");
  // Rule changes name their actor like every audit row; the send rows must not hold the address.
  const audit = JSON.stringify(env.DB.raw.prepare("SELECT * FROM audit_log WHERE action = 'alert.email'").all());
  const logged = errors.join("\n") + audit;
  assert.match(errors.join("\n"), /alert\.email not sent: resend_422_validation_error/);
  for (const secret of [KEY, "member@scout.test", "token=", "/alerts/off/"]) assert.ok(!logged.includes(secret), secret);
  assert.match(audit, /m\*\*\*@scout\.test/);
});

test("a throwing alert check never fails the push", async (t) => {
  const errors = captureErrors(t);
  const { env, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", battery);
  env.DB.raw.exec("DROP TABLE alert_state");
  const reply = await push(env, token, [row({ battery_v: "3.0" })]);
  assert.equal(reply.status, 200);
  assert.match(errors.join("\n"), /alerts not checked/);
});

test("with a ctx, alerts run in waitUntil after the reply", async (t) => {
  const { env, sent, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", battery);
  const pending = [];
  const text = JSON.stringify({ rows: [row({ battery_v: "3.0" })] });
  const response = await worker.fetch(new Request(`${APP_URL}/api/device/readings`, {
    method: "POST", body: text,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Length": String(text.length) },
  }), env, { waitUntil: (p) => pending.push(p) });
  assert.equal(response.status, 200);
  assert.equal(pending.length, 1);
  await Promise.all(pending);
  assert.equal(sent.length, 1);
});

test("the alert email is the console dialog: no images or remote loads, a text part, escaped values", async (t) => {
  const { env, sent, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", battery);
  await push(env, token, [row({ battery_v: "3.4" })]);
  env.DB.raw.prepare("UPDATE buoys SET label = ?").run("<b>Reef</b> & co");
  await push(env, token, [row({ battery_v: "3.0" })]);
  const [mail] = sent;
  assert.doesNotMatch(mail.html, /<img|src=|url\(|<link/i);
  assert.match(mail.html, /&lt;b&gt;Reef&lt;\/b&gt; &amp; co/);
  assert.match(mail.html, /S\.C\.O\.U\.T\. Console/);
  assert.match(mail.html, /Open the buoy/);
  assert.match(mail.html, /tab=notifications/);
  assert.match(mail.text, /Value: 3 V/);
  assert.match(mail.text, /Turn this alert off: https:\/\/console\.test\/alerts\/off\//);
  assert.equal(mail.from, "S.C.O.U.T. Console <console@scoutscu.com>");
});

test("the test email goes to the person, rule changes and the switch are audited", async (t) => {
  const { env, sent, member } = await setup(t);
  assert.equal((await member.client.post("/api/alerts/test")).body.delivery, "sent");
  assert.equal(sent[0].to[0], "member@scout.test");
  assert.match(sent[0].subject, /^Test: /);
  const { id } = (await member.client.post("/api/alerts/rules", battery)).body;
  await member.client.post(`/api/alerts/rules/${id}`, { enabled: false });
  await member.client.post(`/api/alerts/rules/${id}/delete`);
  const actions = env.DB.raw.prepare("SELECT action FROM audit_log WHERE action LIKE 'alert%' ORDER BY id").all().map((r) => r.action);
  assert.deepEqual(actions, ["alert.switch", "alert.email", "alert.rule.create", "alert.rule.edit", "alert.rule.delete"]);
});

test("presets take their numbers from the firmware defaults, or leave them empty", async (t) => {
  const { member } = await setup(t);
  const { presets } = (await member.client.get("/api/alerts")).body;
  const byId = Object.fromEntries(presets.map((p) => [p.id, p.value]));
  assert.deepEqual(byId, { "battery-low": 3.2, "humidity-high": 70, "water-warm": null, "buoy-silent": null });
});

test("with the master switch off nothing is sent", async (t) => {
  const { env, sent, token, member } = await setup(t);
  await member.client.post("/api/alerts/rules", battery);
  await member.client.post("/api/alerts/switch", { enabled: false });
  await push(env, token, [row({ battery_v: "3.0" })]);
  assert.equal(sent.length, 0);
});
