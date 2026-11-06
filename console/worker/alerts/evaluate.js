/* Deciding which alerts fire (SCO-301, ADR-0015).
 *
 *   on ingest (device.js, after the readings are stored): threshold and flag rules, against each
 *     buoy's newest trusted row in the push
 *   hourly cron (index.js): silence rules, plus clearing out spent off links
 *
 * A rule fires on the transition into breach, re-arms when the value clears the line by the
 * metric's margin (catalog.js), and, if it has a reminder interval, reminds while it stays in
 * breach. Only rules of members and admins who have the master switch on and are not disabled
 * count; disconnected buoys never alert. Each person gets one email per run (send.js). */

import { sendAlerts } from "./send.js";
import { METRICS } from "./catalog.js";

const HOUR_MS = 3600 * 1000;
// Must match the hourly entry in wrangler.toml [triggers] crons. index.js routes on it.
export const HOURLY_CRON = "0 * * * *";
const HISTORY_DAYS = 90;

/** Is the observation in breach? A firing threshold rule stays in breach until the value is back
 * past the line by the metric's margin, so a value hovering at the line does not flap. */
export function breached(rule, observed, firing) {
  if (rule.kind === "flag") return observed === true;
  if (rule.kind === "silence") return observed > rule.value;
  const margin = firing ? METRICS[rule.metric].margin : 0;
  return rule.op === "above" ? observed > rule.value - margin : observed < rule.value + margin;
}

/** The next state of one (rule, buoy) and the email it calls for, if any. Pure. */
export function decide(rule, state, observed, now) {
  const firing = Boolean(state?.firing);
  const lastSent = state?.last_sent_at ?? null;
  // A new episode starts with no send on record; sendAlerts stamps it once the email goes out.
  if (!breached(rule, observed, firing)) return { firing: 0, since: null, lastSent: null, event: null };
  if (!firing) return { firing: 1, since: now, lastSent: null, event: "alert" };
  const due = rule.remind_hours && now - (lastSent ?? state.since ?? now) >= rule.remind_hours * HOUR_MS;
  return { firing: 1, since: state.since, lastSent, event: due ? "reminder" : null };
}

/** Rules that may alert right now: enabled, of a kind, owned by a member or admin with alerts on. */
async function liveRules(db, kinds) {
  const { results } = await db.prepare(
    "SELECT r.*, u.email AS owner_email FROM alert_rules r JOIN users u ON u.id = r.user_id " +
    "JOIN alert_prefs p ON p.user_id = r.user_id AND p.enabled = 1 " +
    `WHERE r.enabled = 1 AND u.disabled = 0 AND u.role IN ('member', 'admin') AND r.kind IN (${kinds.map(() => "?").join(", ")})`)
    .bind(...kinds).all();
  return results;
}

async function statesOf(db, rules) {
  if (rules.length === 0) return new Map();
  const { results } = await db.prepare("SELECT s.* FROM alert_state s JOIN alert_rules r ON r.id = s.rule_id WHERE r.enabled = 1").all();
  return new Map(results.map((s) => [`${s.rule_id}:${s.buoy_id}`, s]));
}

/** Store every decision and email each person what fired. `checks`: { rule, buoy, observed, at, clockLost }. */
async function apply(env, checks, now) {
  const db = env.DB;
  const states = await statesOf(db, checks.map((c) => c.rule));
  const upserts = [];
  const byUser = new Map();
  for (const check of checks) {
    const state = states.get(`${check.rule.id}:${check.buoy.buoy_id}`);
    const next = decide(check.rule, state, check.observed, now);
    upserts.push(db.prepare("INSERT INTO alert_state (rule_id, buoy_id, firing, since, last_sent_at, last_value) VALUES (?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT (rule_id, buoy_id) DO UPDATE SET firing = excluded.firing, since = excluded.since, last_sent_at = excluded.last_sent_at, last_value = excluded.last_value")
      .bind(check.rule.id, check.buoy.buoy_id, next.firing, next.since, next.lastSent, typeof check.observed === "number" ? check.observed : null));
    if (!next.event) continue;
    const user = byUser.get(check.rule.user_id) ?? { user: { id: check.rule.user_id, email: check.rule.owner_email }, events: [] };
    user.events.push({ rule: check.rule, buoy: check.buoy, value: check.observed, at: check.at, kind: next.event, clockLost: check.clockLost });
    byUser.set(check.rule.user_id, user);
  }
  if (upserts.length) await db.batch(upserts);
  for (const { user, events } of byUser.values()) await sendAlerts(env, user, events, now);
}

/** The row each buoy is judged on: its newest trusted row, or, when every row in the push lost its
 * clock, the last one in push order (as device.js updateReported does), judged by arrival time. */
function newestPerBuoy(kept) {
  const trusted = new Map();
  const lost = new Map();
  for (const [p, row] of kept) {
    if (p.clockLost) lost.set(p.buoyId, { p, row });
    else if (!trusted.has(p.buoyId) || p.timestamp > trusted.get(p.buoyId).p.timestamp) trusted.set(p.buoyId, { p, row });
  }
  return new Map([...lost, ...trusted]);
}

function observe(rule, row) {
  if (rule.kind === "flag") return String(row.flags || "").split("|").includes(rule.metric);
  const raw = row[rule.metric];
  if (raw === null || raw === undefined || raw === "" || typeof raw === "boolean") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** Threshold and flag rules after a push. `kept`: [parsed, row] pairs already stored. */
export async function alertsOnIngest(env, kept, now = Date.now()) {
  if (kept.length === 0) return;
  const rules = await liveRules(env.DB, ["threshold", "flag"]);
  if (rules.length === 0) return;
  const newest = newestPerBuoy(kept);
  const { results: buoys } = await env.DB.prepare("SELECT buoy_id, label, reported_at, disconnected_at FROM buoys").all();
  const judged = [];
  for (const buoy of buoys) {
    const pick = newest.get(buoy.buoy_id);
    if (!pick || buoy.disconnected_at) continue;
    const at = pick.p.clockLost ? now : Date.parse(pick.p.timestamp);
    // A late push of older rows never alerts: only the buoy's newest reading counts.
    if (!pick.p.clockLost && buoy.reported_at !== null && at < buoy.reported_at) continue;
    judged.push({ buoy: { buoy_id: buoy.buoy_id, label: buoy.label }, row: pick.row, at, clockLost: pick.p.clockLost });
  }
  const checks = rules.flatMap((rule) => judged
    .filter((j) => rule.buoy_id === null || rule.buoy_id === j.buoy.buoy_id)
    .map((j) => ({ rule, buoy: j.buoy, observed: observe(rule, j.row), at: j.at, clockLost: j.clockLost }))
    .filter((c) => c.observed !== null));
  await apply(env, checks, now);
}

/** The hourly cron: silence rules against each connected buoy's last packet, then tidying up. */
export async function alertsHourly(env, now = Date.now()) {
  const db = env.DB;
  await db.batch([
    db.prepare("DELETE FROM alert_off_links WHERE expires_at <= ? OR used_at IS NOT NULL").bind(now),
    db.prepare("DELETE FROM alert_history WHERE at < ?").bind(now - HISTORY_DAYS * 24 * HOUR_MS),
  ]);
  const rules = await liveRules(db, ["silence"]);
  if (rules.length === 0) return;
  const { results: buoys } = await db
    .prepare("SELECT buoy_id, label, last_seen_at FROM buoys WHERE disconnected_at IS NULL AND last_seen_at IS NOT NULL").all();
  const checks = rules.flatMap((rule) => buoys
    .filter((b) => rule.buoy_id === null || rule.buoy_id === b.buoy_id)
    .map((b) => ({ rule, buoy: { buoy_id: b.buoy_id, label: b.label }, observed: (now - b.last_seen_at) / HOUR_MS, at: b.last_seen_at })));
  await apply(env, checks, now);
}
