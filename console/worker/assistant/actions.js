/* Changes Fred proposed, waiting for the person's click (ADR-0013, Phase 2).
 *
 * A propose tool stores a pending action here for 10 minutes and the panel shows it as a card.
 * Confirm re-checks the person's role with can() and runs the same handler the page would, as
 * that person, with the audit entry marked "via Fred". Confirmed, declined and expired actions
 * are deleted; nothing else about the conversation is kept. */

import { setCommandStation, renameBuoy, requestSettings, restoreDefaults } from "../fleet.js";
import { revokeDevice } from "../device.js";
import { createReport } from "../reports.js";
import { can } from "../roles.js";

export const ACTION_TTL_MS = 10 * 60 * 1000;

/** kind → [action can() checks, runner(env, actor, params) → { error?, ...reply }, done message] */
const KINDS = {
  settings: ["settings.write", (env, a, p) => requestSettings(env.DB, a, p.buoy_id, p.changes), "Requested. The buoy picks it up at its next listen window; Settings shows it Pending until then."],
  restore_defaults: ["settings.write", (env, a, p) => restoreDefaults(env.DB, a, p.buoy_id), "Defaults requested. Settings shows them Pending until the buoy confirms."],
  rename_buoy: ["settings.write", (env, a, p) => renameBuoy(env.DB, a, p.buoy_id, p.label), "Renamed."],
  report: ["reports.write", (env, a, p) => createReport(env, a, p.request), "Report ready. The link works for an hour; Reports keeps it for two days."],
  station_route: ["devices.write", (env, a, p) => setCommandStation(env.DB, a, p.buoy_id, p.device_id), "Route changed."],
  revoke_station: ["devices.write", (env, a, p) => revokeDevice(env.DB, a, p.device_id), "Token revoked. That station can no longer push readings."],
};

export const NEEDS = Object.fromEntries(Object.entries(KINDS).map(([kind, [needs]]) => [kind, needs]));

/** Store a proposal; returns the card the panel shows. */
export async function propose(env, user, { kind, params, title, details }, now = Date.now()) {
  if (!KINDS[kind]) throw new Error(`Unknown action kind ${kind}`);
  await env.DB.prepare("DELETE FROM assistant_actions WHERE expires_at <= ?").bind(now).run();
  const id = crypto.randomUUID();
  const expiresAt = now + ACTION_TTL_MS;
  await env.DB.prepare("INSERT INTO assistant_actions (id, user_id, kind, params_json, summary, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, user.id, kind, JSON.stringify(params), title, now, expiresAt).run();
  return { id, kind, title, details, expiresAt };
}

async function owned(env, user, id, now) {
  if (typeof id !== "string" || !/^[\w-]{1,64}$/.test(id)) return { error: "No such proposal.", status: 404 };
  const row = await env.DB.prepare("SELECT * FROM assistant_actions WHERE id = ?").bind(id).first();
  if (!row || row.user_id !== user.id) return { error: "No such proposal.", status: 404 };
  if (row.expires_at <= now) {
    await env.DB.prepare("DELETE FROM assistant_actions WHERE id = ?").bind(id).run();
    return { error: "This proposal expired. Ask Fred again.", status: 410 };
  }
  return { row };
}

/** Run a proposal as the person who asked, if their role still allows it. */
export async function confirm(env, user, id, now = Date.now()) {
  const found = await owned(env, user, id, now);
  if (found.error) return found;
  const { row } = found;
  const [needs, run, done] = KINDS[row.kind];
  if (!can(user, needs)) {
    await env.DB.prepare("DELETE FROM assistant_actions WHERE id = ?").bind(id).run();
    return { error: "Your role can view this but not change it.", status: 403 };
  }
  // Delete first, so a double click cannot run it twice.
  const { meta } = await env.DB.prepare("DELETE FROM assistant_actions WHERE id = ?").bind(id).run();
  if (!meta?.changes) return { error: "No such proposal.", status: 404 };
  const actor = { id: user.id, email: user.email, label: `${user.email} via Fred` };
  const result = await run(env, actor, JSON.parse(row.params_json));
  if (result.error) return { error: result.error, status: result.status ?? 400 };
  return { message: done, ...(result.link ? { link: result.link } : {}) };
}

export async function decline(env, user, id, now = Date.now()) {
  const found = await owned(env, user, id, now);
  if (found.error) return found;
  await env.DB.prepare("DELETE FROM assistant_actions WHERE id = ?").bind(id).run();
  return {};
}
