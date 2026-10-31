/* Phase D (SCO-241): CSV reports for a date range, chosen buoys and chosen variables, written to
 * R2 through the storage guardrails and handed out behind short-lived download links. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { buildCsv, REPORT_COLUMNS } from "../worker/reports.js";
import { Client, makeEnv, signedIn } from "./helpers.js";

function fakeBucket() {
  const objects = new Map();
  return {
    objects,
    async put(key, body) { objects.set(key, new Uint8Array(await new Response(body).arrayBuffer())); return { key }; },
    async get(key) {
      const bytes = objects.get(key);
      return bytes ? { body: new Response(bytes).body, size: bytes.byteLength } : null;
    },
  };
}

function seed(env) {
  const insert = env.DB.raw.prepare("INSERT INTO readings VALUES (?, ?, ?, ?, ?)");
  const rows = [
    [1, 1, "2026-10-29T00:10:00Z", { temp_c: "26.0", battery_v: "3.31", flags: "" }],
    [1, 2, "2026-10-30T00:10:00Z", { temp_c: "26.2", battery_v: "3.30", flags: "LOW_BATT" }],
    [2, 1, "2026-10-30T08:10:00Z", { temp_c: "25.1", battery_v: "3.29", flags: "" }],
  ];
  for (const [buoy, seq, ts, values] of rows) {
    insert.run(buoy, seq, ts, JSON.stringify({ buoy_id: `SCOUT-0${buoy}`, record_seq: String(seq), timestamp_utc: ts, ...values }), 0);
  }
  env.DB.raw.prepare("INSERT INTO buoys (buoy_id, label) VALUES (1, 'Reef north'), (2, 'Reef south')").run();
}

const envWithBucket = () => {
  const env = makeEnv({ FILES: fakeBucket() });
  seed(env);
  return env;
};

const ask = (overrides = {}) => ({ buoys: [1, 2], from: "2026-10-29T00:00:00Z", to: "2026-10-31T00:00:00Z", columns: ["temp_c", "battery_v"], ...overrides });

test("a CSV has the identifying columns, then only the chosen ones, oldest first", async () => {
  const env = envWithBucket();
  const csv = await buildCsv(env.DB, ask());
  const lines = csv.trim().split("\n");
  assert.equal(lines[0], "buoy_id,timestamp_utc,record_seq,temp_c,battery_v");
  assert.equal(lines[1], "SCOUT-01,2026-10-29T00:10:00Z,1,26.0,3.31");
  assert.equal(lines.length, 4);
});

test("a cell with a comma, quote or leading formula character is made safe", async () => {
  const env = envWithBucket();
  env.DB.raw.prepare("UPDATE readings SET row_json = json_set(row_json, '$.flags', ?) WHERE record_seq = 2 AND buoy_id = 1")
    .run('=HYPERLINK("x"),A');
  const csv = await buildCsv(env.DB, ask({ buoys: [1], columns: ["flags"] }));
  assert.match(csv, /,"'=HYPERLINK\(""x""\),A"\n/);
});

test("a member makes a report; it lands in R2 under reports/ and comes back through a short-lived link", async () => {
  const env = envWithBucket();
  const { client } = await signedIn(env, "member");
  const made = await client.post("/api/reports", ask());
  assert.equal(made.status, 200);
  assert.match(made.body.link, /^\/api\/reports\/[\w-]+\/file\?t=[\w-]{20,}$/);
  assert.equal([...env.FILES.objects.keys()][0].startsWith("reports/"), true);
  const anyone = new Client(env);
  const file = await anyone.raw(made.body.link);
  assert.equal(file.status, 200);
  assert.match(file.headers.get("Content-Disposition"), /attachment; filename="scout-.*\.csv"/);
  assert.match(await file.text(), /^buoy_id,timestamp_utc/);
  assert.equal((await client.get("/api/audit")).body.entries[0].action, "report.create");
});

test("a download link stops working after an hour, or with the wrong token", async () => {
  const env = envWithBucket();
  const { client } = await signedIn(env, "member");
  const { link } = (await client.post("/api/reports", ask())).body;
  const anyone = new Client(env);
  assert.equal((await anyone.raw(link.replace(/t=.*/, "t=wrongwrongwrongwrongwrong"))).status, 404);
  env.DB.raw.prepare("UPDATE reports SET link_expires_at = 1").run();
  assert.equal((await anyone.raw(link)).status, 410);
});

test("the owner can get a fresh link while the file is still kept", async () => {
  const env = envWithBucket();
  const { client } = await signedIn(env, "member");
  const { id } = (await client.post("/api/reports", ask())).body;
  env.DB.raw.prepare("UPDATE reports SET link_expires_at = 1").run();
  const again = await client.post(`/api/reports/${id}/link`);
  assert.equal(again.status, 200);
  assert.equal((await new Client(env).raw(again.body.link)).status, 200);
});

test("guests cannot make reports, and bad requests are refused", async () => {
  const env = envWithBucket();
  const { client: guest } = await signedIn(env, "guest");
  assert.equal((await guest.post("/api/reports", ask())).status, 403);
  const { client } = await signedIn(env, "member");
  assert.equal((await client.post("/api/reports", ask({ columns: ["password_hash"] }))).status, 400);
  assert.equal((await client.post("/api/reports", ask({ buoys: [] }))).status, 400);
  assert.equal((await client.post("/api/reports", ask({ from: "yesterday" }))).status, 400);
  assert.equal((await client.post("/api/reports", ask({ from: "2026-10-31T00:00:00Z", to: "2026-10-01T00:00:00Z" }))).status, 400);
});

test("one person can make 20 reports a day", async () => {
  const env = envWithBucket();
  const { client } = await signedIn(env, "member");
  const statuses = [];
  for (let i = 0; i < 21; i += 1) statuses.push((await client.post("/api/reports", ask())).status);
  assert.equal(statuses.filter((s) => s === 200).length, 20);
  assert.equal(statuses[20], 429);
});

test("your recent reports are listed, newest first, with no download token in them", async () => {
  const env = envWithBucket();
  const { client } = await signedIn(env, "member");
  await client.post("/api/reports", ask());
  const { body } = await client.get("/api/reports");
  assert.equal(body.reports.length, 1);
  assert.equal(body.reports[0].rows, 3);
  assert.equal(JSON.stringify(body).includes("t="), false);
  assert.deepEqual(body.columns, REPORT_COLUMNS);
});

test("the readings route serves a whole date range for the printable report", async () => {
  const env = envWithBucket();
  const { client } = await signedIn(env, "guest");
  const { body } = await client.get("/api/readings?buoy=1&from=2026-10-29T00:00:00Z&to=2026-10-31T00:00:00Z&limit=1000");
  assert.equal(body.readings.length, 2);
});

test("without R2 bound, a report is refused with a reason, not a crash", async () => {
  const env = makeEnv();
  seed(env);
  const { client } = await signedIn(env, "member");
  const made = await client.post("/api/reports", ask());
  assert.equal(made.status, 400);
  assert.match(made.body.error, /not set up/);
});
