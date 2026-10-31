/* Dashboards (Phase C, SCO-241): saved views of bays on the 12-column grid, adapted from COR's
 * layout editor. Personal views belong to one person; shared views (owner_id NULL) are seen by
 * everyone, guests included, and changed by members and admins. The front end's model
 * (web/src/lib/dashboard/layout.ts) mirrors the kinds and widths here; a test keeps them equal. */

import { record } from "./audit.js";
import { REPORT_COLUMNS } from "./reports.js";

export const BAY_KINDS = {
  readout: { spans: [3, 4, 6], buoy: true, variable: true },
  trace: { spans: [6, 12], buoy: false, variable: true },
  fleet: { spans: [4, 6, 12], buoy: false, variable: false },
  latest: { spans: [6, 12], buoy: true, variable: false },
};
export const MAX_BAYS = 24;
const MAX_VIEWS = 20;
const NUMERIC = REPORT_COLUMNS.filter((c) => !["flags", "soh", "audio_file", "fw_version", "schema_version"].includes(c));

const bayKey = (bay) => [bay.kind, bay.buoy ?? "", bay.variable ?? ""].join(":");

function validateBay(value) {
  if (typeof value !== "object" || value === null) throw new Error("Each bay must be an object.");
  const { id, kind, span, buoy, variable } = value;
  if (typeof id !== "string" || id.length === 0 || id.length > 64) throw new Error("Each bay needs an id.");
  const info = BAY_KINDS[kind];
  if (!info) throw new Error(`Unknown bay kind: ${String(kind)}.`);
  if (!info.spans.includes(span)) throw new Error(`A ${kind} bay can't take a width of ${String(span)}.`);
  if (info.buoy && !(Number.isInteger(buoy) && buoy >= 1 && buoy <= 65535)) throw new Error(`A ${kind} bay needs a buoy.`);
  if (info.variable && !NUMERIC.includes(variable)) throw new Error(`A ${kind} bay needs a numeric variable.`);
  return { id, kind, span, ...(info.buoy ? { buoy } : {}), ...(info.variable ? { variable } : {}) };
}

/** Checks a layout from a request body and returns it clean. Throws with a readable reason. */
export function validateLayout(value) {
  if (!Array.isArray(value)) throw new Error("A layout must be a list of bays.");
  if (value.length > MAX_BAYS) throw new Error(`A view holds at most ${MAX_BAYS} bays.`);
  const bays = value.map(validateBay);
  const keys = new Set();
  for (const bay of bays) {
    if (keys.has(bayKey(bay))) throw new Error("The same bay appears twice.");
    keys.add(bayKey(bay));
  }
  return bays;
}

function checked(bays) {
  try {
    return { bays: validateLayout(bays) };
  } catch (error) {
    return { error: error.message };
  }
}

export async function listDashboards(db, userId) {
  const { results } = await db.prepare("SELECT id, owner_id, name, bays_json, updated_at FROM dashboards " +
    "WHERE owner_id IS NULL OR owner_id = ? ORDER BY owner_id IS NOT NULL, created_at").bind(userId).all();
  return results.map((row) => ({ id: row.id, name: row.name, shared: row.owner_id === null, bays: JSON.parse(row.bays_json), updated_at: row.updated_at }));
}

export async function createDashboard(db, actor, { name, shared, bays }) {
  const cleanName = String(name || "").trim().slice(0, 40);
  if (!cleanName) return { error: "Name the view." };
  const layout = checked(bays);
  if (layout.error) return layout;
  const { n } = await db.prepare("SELECT COUNT(*) AS n FROM dashboards WHERE owner_id = ?").bind(actor.id).first();
  if (!shared && n >= MAX_VIEWS) return { error: `You can keep ${MAX_VIEWS} views; delete one first.` };
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.prepare("INSERT INTO dashboards (id, owner_id, name, bays_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, shared ? null : actor.id, cleanName, JSON.stringify(layout.bays), now, now).run();
  if (shared) await record(db, { actor, action: "dashboard.create", target: cleanName, after: { shared: "yes" } });
  return { id };
}

async function editable(db, actor, id) {
  return db.prepare("SELECT * FROM dashboards WHERE id = ? AND (owner_id IS NULL OR owner_id = ?)").bind(id, actor.id).first();
}

export async function saveDashboard(db, actor, id, bays) {
  const view = await editable(db, actor, id);
  if (!view) return { error: "That view is not yours to change." };
  const layout = checked(bays);
  if (layout.error) return layout;
  await db.prepare("UPDATE dashboards SET bays_json = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(layout.bays), Date.now(), id).run();
  if (view.owner_id === null) await record(db, { actor, action: "dashboard.save", target: view.name });
  return {};
}

export async function deleteDashboard(db, actor, id) {
  const view = await editable(db, actor, id);
  if (!view) return { error: "That view is not yours to delete." };
  await db.prepare("DELETE FROM dashboards WHERE id = ?").bind(id).run();
  if (view.owner_id === null) await record(db, { actor, action: "dashboard.delete", target: view.name });
  return {};
}
