/* Fred, Phase 3 (Brief): the facts come from code, a model only phrases them, the cron writes one
 * brief a day alongside the backup, and the Dashboard reads it. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { briefFacts, runBrief } from "../worker/assistant/brief.js";
import { MODELS } from "../worker/assistant/model.js";
import worker from "../worker/index.js";
import { stubGemini, stubWorkersAi } from "./assistant-helpers.js";
import { makeEnv, signedIn } from "./helpers.js";

const NOW = Date.parse("2026-11-05T10:30:00Z");

function seed(env) {
  const db = env.DB.raw;
  db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('seed', 'seed@scout.test', 'Seed', 'admin', 0)").run();
  db.prepare("INSERT INTO buoys (buoy_id, label, tx_count_reported, last_seen_at) VALUES (1, 'Reef north', 3, ?)").run(NOW - 3600e3);
  db.prepare("INSERT INTO buoys (buoy_id, label, tx_count_reported, last_seen_at, cmd_rejected, tx_count_requested) VALUES (2, 'Reef south', 3, ?, 1, 2)").run(NOW - 4 * 86400e3);
  db.prepare("INSERT INTO devices (id, name, token_hash, created_by, created_at, last_seen_at) VALUES ('d1', 'Kona pier', 'h', 'seed', 0, ?)").run(NOW - 3 * 86400e3);
}

test("facts: silent buoys, rejected settings and quiet stations; a healthy fleet has none", async () => {
  const env = makeEnv();
  seed(env);
  const { facts } = await briefFacts(env, NOW);
  assert.equal(facts.length, 3);
  assert.match(facts.join(" "), /Reef south \(buoy 2\) is silent/);
  assert.match(facts.join(" "), /Reef south rejected/);
  assert.match(facts.join(" "), /Kona pier has not checked in/);
  assert.ok(!facts.join(" ").includes("Reef north"), "a live buoy raises no alarm");
  const healthy = makeEnv();
  healthy.DB.raw.prepare("INSERT INTO buoys (buoy_id, label, tx_count_reported, last_seen_at) VALUES (1, 'A', 3, ?)").run(NOW);
  assert.deepEqual((await briefFacts(healthy, NOW)).facts, []);
});

test("the brief model phrases the facts; with no model the facts are stored as they are", async (t) => {
  const env = makeEnv({ GEMINI_API_KEY: "k" });
  seed(env);
  const requests = stubGemini(t, [{ text: "Two buoys need a look." }]);
  assert.deepEqual(await runBrief(env, NOW), { text: "Two buoys need a look.", provider: "gemini" });
  assert.ok(requests[0].url.includes(MODELS.brief));
  assert.ok(!requests[0].body.tools, "the brief has no tools");
  assert.match(requests[0].body.contents[0].parts[0].text, /Reef south rejected/);
  const bare = makeEnv();
  seed(bare);
  const plain = await runBrief(bare, NOW);
  assert.equal(plain.provider, "facts");
  assert.match(plain.text, /^3 things to look at:\n- /);
});

test("Gemini busy: the plain facts are stored, never a weaker model's phrasing", async (t) => {
  const ai = stubWorkersAi([{ response: "Invented extra detail." }]);
  const env = makeEnv({ GEMINI_API_KEY: "k", AI: ai });
  seed(env);
  stubGemini(t, [{ status: 429 }]);
  const got = await runBrief(env, NOW);
  assert.equal(got.provider, "facts");
  assert.equal(ai.calls.length, 0);
});

test("the cron writes the brief beside the backup, and the Dashboard route reads it", async () => {
  const env = makeEnv();
  seed(env);
  const { client } = await signedIn(env, "guest");
  assert.deepEqual((await client.get("/api/assistant/brief")).body, { ok: true, brief: null });
  await worker.scheduled({ cron: "30 10 * * *", scheduledTime: Date.now() }, env, { waitUntil() {} }).catch(() => undefined);
  const { brief } = (await client.get("/api/assistant/brief")).body;
  assert.equal(brief.provider, "facts");
  assert.match(brief.text, /Reef south/);
});
