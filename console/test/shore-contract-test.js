/* The S3 shore station's side of the device API (SCO-237), held to what the firmware assumes.
 *
 * firmware/lib/scout_console builds rows, reads the 400 that names a bad row, and parses the
 * settings reply. Its own tests check it against the Python (row_vectors.h); these check the same
 * vectors and replies against the console, so the two ends cannot drift apart unnoticed. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { parseRow } from "../worker/device.js";
import worker from "../worker/index.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

const VECTORS = new URL("../../firmware/test/test_console/row_vectors.h", import.meta.url);

/** The row_json strings in row_vectors.h, un-escaped from C string literals. */
function s3Rows() {
  const text = readFileSync(VECTORS, "utf8");
  const literals = [...text.matchAll(/^\s+"(\{(?:[^"\\]|\\.)*\})"\},$/gm)].map((m) => m[1]);
  return literals.map((literal) => JSON.parse(literal.replace(/\\(.)/g, "$1")));
}

async function deviceToken(env) {
  const { client } = await signedIn(env, "admin", "shore-admin@scout.test");
  return (await client.post("/api/devices", { name: "S3 bench" })).body.token;
}

function deviceCall(env, token, path, body) {
  const text = body ? JSON.stringify(body) : undefined;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (text !== undefined) headers["Content-Length"] = String(new TextEncoder().encode(text).length);
  return worker.fetch(new Request(APP_URL + path, { method: body ? "POST" : "GET", body: text, headers }), env);
}

// The vectors are stamped 2026–2028; judge them as if it were 2029 so none is "in the future".
const LATER = Date.parse("2029-01-01T00:00:00Z");

test("every row the S3 builds passes the console's row check", () => {
  const rows = s3Rows();
  assert.ok(rows.length >= 20, `expected the generated vectors, found ${rows.length}`);
  for (const row of rows) {
    assert.ok(parseRow(row, LATER), `refused: ${JSON.stringify(row).slice(0, 120)}`);
  }
});

test("the S3's rows store once each, and a repeat push stores nothing", async () => {
  const env = makeEnv();
  const token = await deviceToken(env);
  // Today's date bounds the future check, so push only the vectors dated before now.
  const rows = s3Rows().filter((row) => Date.parse(row.timestamp_utc) <= Date.now());
  const unique = new Set(rows.map((row) => `${row.buoy_id}/${row.record_seq}`)).size;
  const first = await (await deviceCall(env, token, "/api/device/readings", { rows })).json();
  const again = await (await deviceCall(env, token, "/api/device/readings", { rows })).json();
  assert.equal(first.stored, unique);
  assert.equal(again.stored, 0);
});

test("a bad row's 400 names it the way scout_console_bad_row() reads it", async () => {
  const env = makeEnv();
  const token = await deviceToken(env);
  const good = s3Rows().find((row) => Date.parse(row.timestamp_utc) <= Date.now());
  const response = await deviceCall(env, token, "/api/device/readings", {
    rows: [good, { ...good, record_seq: "99", tx_count: "9" }],
  });
  assert.equal(response.status, 400);
  // The firmware takes the first number after "row " (lib/scout_console, scout_console_bad_row).
  assert.match((await response.json()).error, /\brow 1 /);
});

test("the settings reply uses the keys the S3's parser looks for", async () => {
  const env = makeEnv();
  const token = await deviceToken(env);
  // A buoy exists once its shore station pushes its first reading.
  const first = s3Rows().find((row) => row.buoy_id === "SCOUT-01" && Date.parse(row.timestamp_utc) <= Date.now());
  await deviceCall(env, token, "/api/device/readings", { rows: [first] });
  const { client } = await signedIn(env, "member", "member@scout.test");
  const request = await client.post("/api/fleet/buoys/1/tx-count", { tx_count: 2 });
  assert.equal(request.status, 200, JSON.stringify(request.body));
  const text = await (await deviceCall(env, token, "/api/device/settings")).text();
  // scout_console_parse_settings() finds "buoys", then "buoy_id": and "tx_count_requested": in
  // each object, with no spaces after the colons.
  assert.match(text, /"buoys":\[/);
  assert.match(text, /\{"buoy_id":1,"tx_count_requested":2\}/);
});

test("more rows than the console takes in one push are refused (the S3 sends 20)", async () => {
  const env = makeEnv();
  const token = await deviceToken(env);
  const good = s3Rows().find((row) => Date.parse(row.timestamp_utc) <= Date.now());
  const rows = Array.from({ length: 201 }, (_, i) => ({ ...good, record_seq: String(i) }));
  const response = await deviceCall(env, token, "/api/device/readings", { rows });
  assert.equal(response.status, 400);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM readings").get().n, 0);
});
