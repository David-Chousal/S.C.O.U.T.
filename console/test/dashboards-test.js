/* Phase C (SCO-241): dashboards. Each person keeps their own views and the team shares some;
 * a layout is a list of bays on the 12-column grid, checked on the server before it is stored. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { validateLayout } from "../worker/dashboards.js";
import { makeEnv, signedIn } from "./helpers.js";

const BAYS = [
  { id: "readout-1-temp_c", kind: "readout", span: 3, buoy: 1, variable: "temp_c" },
  { id: "trace-temp_c", kind: "trace", span: 12, variable: "temp_c" },
  { id: "fleet", kind: "fleet", span: 6 },
  { id: "latest-1", kind: "latest", span: 6, buoy: 1 },
];

test("a member saves a personal view; only they see it", async () => {
  const env = makeEnv();
  const { client: mine } = await signedIn(env, "member");
  const made = await mine.post("/api/dashboards", { name: "My reef", shared: false, bays: BAYS });
  assert.equal(made.status, 200);
  const listed = (await mine.get("/api/dashboards")).body.dashboards;
  assert.deepEqual(listed.map((d) => [d.name, d.shared]), [["My reef", false]]);
  assert.deepEqual(listed[0].bays, BAYS);
  const { client: other } = await signedIn(env, "member", "other@scout.test");
  assert.equal((await other.get("/api/dashboards")).body.dashboards.length, 0);
});

test("a shared view is seen by everyone, guests included, and edited by members", async () => {
  const env = makeEnv();
  const { client: author } = await signedIn(env, "member");
  const { id } = (await author.post("/api/dashboards", { name: "Team board", shared: true, bays: BAYS })).body;
  const { client: guest } = await signedIn(env, "guest");
  assert.equal((await guest.get("/api/dashboards")).body.dashboards[0].name, "Team board");
  assert.equal((await guest.post(`/api/dashboards/${id}`, { bays: BAYS.slice(0, 1) })).status, 403);
  const { client: colleague } = await signedIn(env, "member", "colleague@scout.test");
  assert.equal((await colleague.post(`/api/dashboards/${id}`, { bays: BAYS.slice(0, 2) })).status, 200);
  assert.equal((await author.get("/api/dashboards")).body.dashboards[0].bays.length, 2);
  assert.equal((await author.get("/api/audit")).body.entries[0].action, "dashboard.save");
});

test("nobody else can change or delete your personal view", async () => {
  const env = makeEnv();
  const { client: owner } = await signedIn(env, "member");
  const { id } = (await owner.post("/api/dashboards", { name: "Mine", shared: false, bays: BAYS })).body;
  const { client: other } = await signedIn(env, "admin");
  assert.equal((await other.post(`/api/dashboards/${id}`, { bays: [] })).status, 400);
  assert.equal((await other.post(`/api/dashboards/${id}/delete`)).status, 400);
  assert.equal((await owner.post(`/api/dashboards/${id}/delete`)).status, 200);
  assert.equal((await owner.get("/api/dashboards")).body.dashboards.length, 0);
});

test("a guest cannot create a view", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "guest");
  assert.equal((await client.post("/api/dashboards", { name: "x", shared: false, bays: BAYS })).status, 403);
});

test("layouts are checked: kinds, widths, required fields, duplicates and size", () => {
  assert.deepEqual(validateLayout(BAYS), BAYS);
  assert.throws(() => validateLayout([{ id: "a", kind: "pie", span: 6 }]), /Unknown/);
  assert.throws(() => validateLayout([{ id: "a", kind: "trace", span: 3, variable: "temp_c" }]), /width/);
  assert.throws(() => validateLayout([{ id: "a", kind: "readout", span: 3, variable: "temp_c" }]), /buoy/);
  assert.throws(() => validateLayout([{ id: "a", kind: "trace", span: 12, variable: "password_hash" }]), /variable/);
  assert.throws(() => validateLayout([BAYS[2], { ...BAYS[2], id: "fleet-2" }]), /twice/);
  assert.throws(() => validateLayout(Array.from({ length: 25 }, (_, i) => ({ id: `f${i}`, kind: "latest", span: 6, buoy: i + 1 }))), /at most/);
});

test("a bad layout or a missing name is refused through the API", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "member");
  assert.equal((await client.post("/api/dashboards", { name: "", shared: false, bays: BAYS })).status, 400);
  assert.equal((await client.post("/api/dashboards", { name: "x", shared: false, bays: [{ id: "a", kind: "pie", span: 6 }] })).status, 400);
});
