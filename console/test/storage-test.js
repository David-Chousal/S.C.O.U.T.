/* R2 guardrails and the nightly backup (Phase E, SCO-241). Cloudflare has no hard spending cap,
 * so the Worker keeps its own ledger and refuses any R2 call that would pass a ceiling set well
 * under the free tier, writes only under prefixes the bucket's lifecycle rules delete, and caps
 * each object's size. */

import assert from "node:assert/strict";
import { test } from "node:test";
import { gunzipSync } from "node:zlib";

import worker from "../worker/index.js";
import { BUDGET, guardedGet, guardedPut, usage } from "../worker/storage.js";
import { makeEnv, signedIn } from "./helpers.js";

/** A stand-in for an R2 bucket binding that counts the calls R2 would bill. */
function fakeBucket() {
  const objects = new Map();
  const calls = { put: 0, get: 0 };
  return {
    objects, calls,
    async put(key, body) {
      calls.put += 1;
      objects.set(key, new Uint8Array(await new Response(body).arrayBuffer()));
      return { key };
    },
    async get(key) {
      calls.get += 1;
      const bytes = objects.get(key);
      return bytes ? { body: new Response(bytes).body, arrayBuffer: async () => bytes.buffer } : null;
    },
  };
}

const envWithBucket = () => makeEnv({ FILES: fakeBucket() });

test("a write under a lifecycle prefix is stored and counted", async () => {
  const env = envWithBucket();
  const result = await guardedPut(env, "backups/x.sql.gz", new Uint8Array(1000));
  assert.equal(result.error, undefined);
  assert.equal(env.FILES.calls.put, 1);
  const now = await usage(env.DB);
  assert.equal(now.writes, 1);
  assert.equal(now.storedBytes, 1000);
});

test("a write outside the auto-deleted prefixes is refused before R2 is called", async () => {
  const env = envWithBucket();
  assert.match((await guardedPut(env, "keep-forever.bin", new Uint8Array(10))).error, /prefix/);
  assert.equal(env.FILES.calls.put, 0);
});

test("an object over the size cap is refused", async () => {
  const env = envWithBucket();
  const big = new Uint8Array(BUDGET.maxObjectBytes + 1);
  assert.match((await guardedPut(env, "reports/big.csv", big)).error, /large/);
  assert.equal(env.FILES.calls.put, 0);
});

test("writes stop at the monthly ceiling, far under the free tier", async () => {
  const env = envWithBucket();
  assert.ok(BUDGET.writesPerMonth <= 1_000_000 * 0.1);
  env.DB.raw.prepare("INSERT INTO storage_usage (month, writes, reads) VALUES (?, ?, 0)")
    .run(new Date().toISOString().slice(0, 7), BUDGET.writesPerMonth);
  assert.match((await guardedPut(env, "backups/y.sql.gz", new Uint8Array(10))).error, /budget is used up/);
  assert.equal(env.FILES.calls.put, 0);
});

test("stored bytes stop at the ceiling, and expired objects no longer count", async () => {
  const env = envWithBucket();
  assert.ok(BUDGET.storedBytes <= 10e9 * 0.2);
  env.DB.raw.prepare("INSERT INTO storage_objects (key, bytes, expires_at) VALUES ('backups/old', ?, ?)")
    .run(BUDGET.storedBytes, Date.now() + 86400000);
  assert.match((await guardedPut(env, "backups/z.sql.gz", new Uint8Array(10))).error, /full/);
  env.DB.raw.prepare("UPDATE storage_objects SET expires_at = 1").run();
  assert.equal((await guardedPut(env, "backups/z.sql.gz", new Uint8Array(10))).error, undefined);
});

test("reads are counted and stop at their own ceiling", async () => {
  const env = envWithBucket();
  await guardedPut(env, "reports/r.csv", new TextEncoder().encode("a,b"));
  assert.ok((await guardedGet(env, "reports/r.csv")).object);
  assert.equal((await usage(env.DB)).reads, 1);
  env.DB.raw.prepare("UPDATE storage_usage SET reads = ?").run(BUDGET.readsPerMonth);
  assert.match((await guardedGet(env, "reports/r.csv")).error, /budget is used up/);
  assert.equal(env.FILES.calls.get, 1);
});

test("without a bucket bound, nothing is attempted", async () => {
  const env = makeEnv();
  assert.match((await guardedPut(env, "backups/a", new Uint8Array(1))).error, /not set up/);
});

test("the nightly backup writes one gzipped SQL dump of the console's tables, without sessions", async () => {
  const env = envWithBucket();
  await signedIn(env, "admin");
  await worker.scheduled({ cron: "30 10 * * *", scheduledTime: Date.UTC(2026, 9, 31, 10, 30) }, env, { waitUntil() {} });
  const keys = [...env.FILES.objects.keys()];
  assert.deepEqual(keys, ["backups/2026-10-31.sql.gz"]);
  const sql = gunzipSync(env.FILES.objects.get(keys[0])).toString();
  assert.match(sql, /INSERT INTO "users"/);
  assert.match(sql, /INSERT INTO "audit_log"|-- audit_log: 0 rows/);
  assert.doesNotMatch(sql, /INSERT INTO "sessions"/);
  assert.doesNotMatch(sql, /INSERT INTO "login_failures"/);
});

test("a backup dump restores into an empty database", async () => {
  const env = envWithBucket();
  await signedIn(env, "admin");
  await worker.scheduled({ cron: "30 10 * * *", scheduledTime: Date.UTC(2026, 9, 31, 10, 30) }, env, { waitUntil() {} });
  const sql = gunzipSync(env.FILES.objects.get("backups/2026-10-31.sql.gz")).toString();
  const fresh = makeEnv();
  fresh.DB.raw.exec(sql);
  assert.equal(fresh.DB.raw.prepare("SELECT email FROM users").get().email, "admin@scout.test");
});

test("an admin sees storage use against the ceilings and the newest backup; others do not", async () => {
  const env = envWithBucket();
  await guardedPut(env, "backups/2026-10-30.sql.gz", new Uint8Array(500));
  const { client: admin } = await signedIn(env, "admin");
  const { body } = await admin.get("/api/storage");
  assert.equal(body.usage.writes, 1);
  assert.equal(body.budget.writesPerMonth, BUDGET.writesPerMonth);
  assert.equal(body.lastBackup.key, "backups/2026-10-30.sql.gz");
  const { client: member } = await signedIn(env, "member");
  assert.equal((await member.get("/api/storage")).status, 403);
});
