/* Report builder (SCO-317): saved reports and templates, adapted from dashboards.js. A report
 * document is checked here before it is stored; web/src/lib/report/document.ts is its shape, and
 * test/report-layouts-test.js keeps the block kinds equal. */

import { record } from "./audit.js";

export const REPORT_BLOCK_KINDS = ["title", "text", "keyFigures", "timeSeries", "summaryTable", "readingsTable",
  "heatStress", "buoyHealth", "alerts", "image", "pageBreak", "divider"];
const PRESETS = ["24h", "7d", "30d", "custom"];
const MAX_BLOCKS = 60;
const MAX_DOC_BYTES = 64 * 1024;
const MAX_SAVED = 50;
const MAX_TEXT = 4000;
const DAY = /^(\d{4}-\d{2}-\d{2})?$/;

const fail = (message) => { throw new Error(message); };
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const buoyList = (value, what) => (Array.isArray(value) && value.length <= 50 && value.every((b) => Number.isInteger(b) && b >= 1 && b <= 65535)
  ? value : fail(`${what} must be a list of buoy ids.`));

function range(value, what) {
  if (!isObject(value) || !PRESETS.includes(value.preset) || !DAY.test(value.from ?? "") || !DAY.test(value.to ?? "")) fail(`${what} is not a valid date range.`);
  return { preset: value.preset, from: value.from ?? "", to: value.to ?? "" };
}

/** Options are plain values: short strings, finite numbers, booleans, strings in a list, or an
 * image id. Kind-specific meaning is the front end's; the server only keeps them safe and small. */
function options(value) {
  if (!isObject(value)) fail("A block's options must be an object.");
  for (const [key, item] of Object.entries(value)) {
    const ok = (typeof item === "string" && item.length <= MAX_TEXT) || (typeof item === "number" && Number.isFinite(item))
      || typeof item === "boolean" || item === null || (Array.isArray(item) && item.length <= 40 && item.every((v) => typeof v === "string" && v.length <= 64));
    if (!ok || key.length > 32) fail(`A block option (${key.slice(0, 32)}) is not allowed.`);
  }
  return value;
}

function block(value, seen) {
  if (!isObject(value)) fail("Each block must be an object.");
  const { id, kind, hidden, override = {} } = value;
  if (typeof id !== "string" || !/^[\w-]{1,64}$/.test(id)) fail("Each block needs an id.");
  if (seen.has(id)) fail("Two blocks share an id.");
  seen.add(id);
  if (!REPORT_BLOCK_KINDS.includes(kind)) fail(`Unknown block kind: ${String(kind).slice(0, 32)}.`);
  if (!isObject(override)) fail("A block's override must be an object.");
  return {
    id, kind, hidden: hidden === true,
    override: { ...(override.buoys ? { buoys: buoyList(override.buoys, "A block's buoys") } : {}), ...(override.range ? { range: range(override.range, "A block's range") } : {}) },
    options: options(value.options ?? {}),
  };
}

/** Checks a report document from a request body and returns it clean. Throws with a readable reason. */
export function validateReportDocument(doc) {
  if (!isObject(doc) || doc.version !== 1) fail("A report must be a version 1 report document.");
  if (JSON.stringify(doc).length > MAX_DOC_BYTES) fail("That report is too large to save.");
  const { title, page, variables, blocks } = doc;
  if (typeof title !== "string" || title.length > 80) fail("A report title is up to 80 characters.");
  if (!isObject(page) || !["letter", "a4"].includes(page.size) || !["portrait", "landscape"].includes(page.orientation)) fail("Unknown page size.");
  if (!isObject(variables) || !["utc", "local"].includes(variables.zone)) fail("A report needs its buoys, range and time zone.");
  if (!Array.isArray(blocks) || blocks.length > MAX_BLOCKS) fail(`A report holds at most ${MAX_BLOCKS} blocks.`);
  const seen = new Set();
  return {
    version: 1, title, page: { size: page.size, orientation: page.orientation },
    variables: { buoys: buoyList(variables.buoys, "The report's buoys"), range: range(variables.range, "The report's range"), zone: variables.zone },
    blocks: blocks.map((b) => block(b, seen)),
  };
}

function checked(doc) {
  try {
    return { doc: validateReportDocument(doc) };
  } catch (error) {
    return { error: error.message };
  }
}

const toItem = (userId) => (row) => ({
  id: row.id, kind: row.kind, name: row.name, shared: row.shared === 1, mine: row.owner_id === userId,
  is_default: row.is_default === 1, author: row.author ?? null, updated_at: row.updated_at, doc: JSON.parse(row.doc_json),
});

/** Everything this person may open: shared layouts and their own. */
export async function listReportLayouts(db, userId) {
  const { results } = await db.prepare("SELECT l.*, u.name AS author FROM report_layouts l LEFT JOIN users u ON u.id = l.owner_id " +
    "WHERE l.shared = 1 OR l.owner_id = ? ORDER BY l.kind, l.updated_at DESC").bind(userId).all();
  return results.map(toItem(userId));
}

export async function createReportLayout(db, actor, { kind, name, shared = true, doc }) {
  if (!["report", "template"].includes(kind)) return { error: "Save it as a report or a template." };
  const cleanName = String(name || "").trim().slice(0, 60);
  if (!cleanName) return { error: "Name it." };
  const valid = checked(doc);
  if (valid.error) return valid;
  const { n } = await db.prepare("SELECT COUNT(*) AS n FROM report_layouts WHERE owner_id = ?").bind(actor.id).first();
  if (n >= MAX_SAVED) return { error: `You can keep ${MAX_SAVED} saved reports and templates; delete one first.` };
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.prepare("INSERT INTO report_layouts (id, kind, owner_id, shared, is_default, name, doc_json, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)")
    .bind(id, kind, actor.id, shared === false ? 0 : 1, cleanName, JSON.stringify(valid.doc), now, now).run();
  if (shared !== false) await record(db, { actor, action: `report_${kind}.create`, target: cleanName });
  return { id };
}

const editable = (db, actor, id) =>
  db.prepare("SELECT * FROM report_layouts WHERE id = ? AND (shared = 1 OR owner_id = ?)").bind(id, actor.id).first();

/** Saves a new document, name or sharing. Only the author changes who can see it. */
export async function saveReportLayout(db, actor, id, body) {
  const row = await editable(db, actor, id);
  if (!row) return { error: "That report is not yours to change." };
  if (body.shared !== undefined && row.owner_id !== actor.id) return { error: "Only its author can change who sees it." };
  const valid = body.doc === undefined ? { doc: JSON.parse(row.doc_json) } : checked(body.doc);
  if (valid.error) return valid;
  const name = body.name === undefined ? row.name : String(body.name).trim().slice(0, 60) || row.name;
  const shared = body.shared === undefined ? row.shared : body.shared ? 1 : 0;
  await db.prepare("UPDATE report_layouts SET name = ?, shared = ?, is_default = ?, doc_json = ?, updated_at = ? WHERE id = ?")
    .bind(name, shared, shared ? row.is_default : 0, JSON.stringify(valid.doc), Date.now(), id).run();
  if (row.shared === 1 || shared) await record(db, { actor, action: `report_${row.kind}.save`, target: name });
  return {};
}

export async function deleteReportLayout(db, actor, id) {
  const row = await editable(db, actor, id);
  if (!row) return { error: "That report is not yours to delete." };
  await db.prepare("DELETE FROM report_layouts WHERE id = ?").bind(id).run();
  if (row.shared === 1) await record(db, { actor, action: `report_${row.kind}.delete`, target: row.name });
  return {};
}

/** An admin marks one shared template as the team's default for new reports, or clears it. */
export async function setDefaultTemplate(db, actor, id, isDefault) {
  const row = await db.prepare("SELECT * FROM report_layouts WHERE id = ? AND kind = 'template' AND shared = 1").bind(id).first();
  if (!row) return { error: "Only a team template can be the default." };
  await db.prepare("UPDATE report_layouts SET is_default = 0 WHERE kind = 'template'").run();
  if (isDefault) await db.prepare("UPDATE report_layouts SET is_default = 1 WHERE id = ?").bind(id).run();
  await record(db, { actor, action: "report_template.default", target: row.name, after: { default: isDefault ? "yes" : "no" } });
  return {};
}
