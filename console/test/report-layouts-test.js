/* Report builder (SCO-317): saved reports and templates. Reports are shared with the team by
 * default; guests open them but cannot save; an admin picks the team's default template. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { REPORT_BLOCK_KINDS, validateReportDocument } from "../worker/report-layouts.js";
import { makeEnv, signedIn } from "./helpers.js";

const DOC = {
  version: 1, title: "Weekly", page: { size: "letter", orientation: "portrait" },
  variables: { buoys: [1, 2], range: { preset: "7d", from: "", to: "" }, zone: "utc" },
  blocks: [
    { id: "t", kind: "title", hidden: false, override: {}, options: { subtitle: "{buoys}" } },
    { id: "s", kind: "summaryTable", hidden: false, override: { buoys: [2] }, options: { variables: ["temp_c"] } },
  ],
};

test("a saved report is shared with the team by default, and guests can open it but not change it", async () => {
  const env = makeEnv();
  const { client: author } = await signedIn(env, "member");
  const made = await author.post("/api/report-layouts", { kind: "report", name: "Weekly", doc: DOC });
  assert.equal(made.status, 200);
  const { client: guest } = await signedIn(env, "guest");
  const seen = (await guest.get("/api/report-layouts")).body.layouts;
  assert.deepEqual(seen.map((l) => [l.name, l.kind, l.shared, l.mine]), [["Weekly", "report", true, false]]);
  assert.deepEqual(seen[0].doc, DOC);
  assert.equal((await guest.post(`/api/report-layouts/${made.body.id}`, { doc: DOC })).status, 403);
  assert.equal((await guest.post("/api/report-layouts", { kind: "report", name: "Mine", doc: DOC })).status, 403);
});

test("a private report is seen only by its author, and only the author changes who sees it", async () => {
  const env = makeEnv();
  const { client: author } = await signedIn(env, "member");
  const { id } = (await author.post("/api/report-layouts", { kind: "report", name: "Draft", shared: false, doc: DOC })).body;
  const { client: other } = await signedIn(env, "member", "other@scout.test");
  assert.equal((await other.get("/api/report-layouts")).body.layouts.length, 0);
  assert.equal((await other.post(`/api/report-layouts/${id}`, { doc: DOC })).status, 400);
  assert.equal((await author.post(`/api/report-layouts/${id}`, { shared: true })).status, 200);
  assert.equal((await other.get("/api/report-layouts")).body.layouts.length, 1);
  assert.equal((await other.post(`/api/report-layouts/${id}`, { shared: false })).status, 400);
});

test("members edit and delete team reports; changes are audited", async () => {
  const env = makeEnv();
  const { client: author } = await signedIn(env, "member");
  const { id } = (await author.post("/api/report-layouts", { kind: "template", name: "Field", doc: DOC })).body;
  const { client: colleague } = await signedIn(env, "member", "colleague@scout.test");
  assert.equal((await colleague.post(`/api/report-layouts/${id}`, { name: "Field week", doc: { ...DOC, title: "Changed" } })).status, 200);
  const [layout] = (await author.get("/api/report-layouts")).body.layouts;
  assert.deepEqual([layout.name, layout.doc.title], ["Field week", "Changed"]);
  assert.equal((await colleague.post(`/api/report-layouts/${id}/delete`)).status, 200);
  assert.equal((await author.get("/api/audit")).body.entries[0].action, "report_template.delete");
});

test("only an admin sets the team's default template, and only one is default", async () => {
  const env = makeEnv();
  const { client: member } = await signedIn(env, "member");
  const a = (await member.post("/api/report-layouts", { kind: "template", name: "A", doc: DOC })).body.id;
  const b = (await member.post("/api/report-layouts", { kind: "template", name: "B", doc: DOC })).body.id;
  assert.equal((await member.post(`/api/report-layouts/${a}/default`, { is_default: true })).status, 403);
  const { client: admin } = await signedIn(env, "admin");
  assert.equal((await admin.post(`/api/report-layouts/${a}/default`, { is_default: true })).status, 200);
  assert.equal((await admin.post(`/api/report-layouts/${b}/default`, { is_default: true })).status, 200);
  const defaults = (await admin.get("/api/report-layouts")).body.layouts.filter((l) => l.is_default).map((l) => l.name);
  assert.deepEqual(defaults, ["B"]);
});

test("documents are checked before they are stored", () => {
  assert.deepEqual(validateReportDocument(DOC), DOC);
  const bad = (change, message) => assert.throws(() => validateReportDocument({ ...DOC, ...change }), message);
  bad({ version: 2 }, /version 1/);
  bad({ page: { size: "legal", orientation: "portrait" } }, /page size/);
  bad({ blocks: [{ ...DOC.blocks[0], kind: "script" }] }, /Unknown block kind/);
  bad({ blocks: [DOC.blocks[0], DOC.blocks[0]] }, /share an id/);
  bad({ blocks: [{ ...DOC.blocks[0], options: { text: "x".repeat(5000) } }] }, /not allowed/);
  bad({ blocks: [{ ...DOC.blocks[0], options: { nested: { a: 1 } } }] }, /not allowed/);
  bad({ variables: { ...DOC.variables, range: { preset: "custom", from: "nope", to: "" } } }, /date range/);
  bad({ blocks: Array.from({ length: 61 }, (_, i) => ({ ...DOC.blocks[0], id: `b${i}` })) }, /at most 60/);
});

test("the server knows the same block kinds as the front end", () => {
  const source = readFileSync(new URL("../web/src/lib/report/document.ts", import.meta.url), "utf8");
  const info = source.slice(source.indexOf("export const BLOCK_INFO"), source.indexOf("};", source.indexOf("export const BLOCK_INFO")));
  const kinds = [...info.matchAll(/^\s{2}(\w+): \{ label/gm)].map((m) => m[1]);
  assert.deepEqual([...kinds].sort(), [...REPORT_BLOCK_KINDS].sort());
});
