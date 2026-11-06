/* Each person's alert rules and master switch (SCO-301, ADR-0015), and the "turn this alert off"
 * links in alert emails. Every query is scoped to the signed-in person: nobody reads or changes
 * another person's rules. Changes go in the audit log. */

import { record } from "../audit.js";
import { sha256Hex } from "../crypto.js";
import { catalog, describeRule, MAX_RULES, validRule } from "./catalog.js";
import { capsOf, emailsToday } from "./send.js";

const HISTORY_LIMIT = 25;
const DAY_MS = 24 * 3600 * 1000;

const publicRule = (rule) => ({
  id: rule.id, buoy_id: rule.buoy_id, kind: rule.kind, metric: rule.metric, op: rule.op, value: rule.value,
  remind_hours: rule.remind_hours, enabled: Boolean(rule.enabled), description: describeRule(rule),
  firing: Boolean(rule.firing),
});

export async function alertsEnabled(db, userId) {
  const row = await db.prepare("SELECT enabled FROM alert_prefs WHERE user_id = ?").bind(userId).first();
  return Boolean(row?.enabled);
}

/** Everything the Notifications tab shows for this person. */
export async function alertsView(env, user, now = Date.now()) {
  const db = env.DB;
  const { results: rules } = await db
    .prepare("SELECT r.*, EXISTS (SELECT 1 FROM alert_state s WHERE s.rule_id = r.id AND s.firing = 1) AS firing " +
      "FROM alert_rules r WHERE r.user_id = ? ORDER BY r.created_at")
    .bind(user.id).all();
  const { results: history } = await db
    .prepare("SELECT id, rule_id, buoy_id, at, kind, summary, status, reason FROM alert_history WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .bind(user.id, HISTORY_LIMIT).all();
  const caps = capsOf(env);
  const used = await emailsToday(db, user.id, now);
  const since = now - (now % DAY_MS);
  const capped = await db.prepare("SELECT COUNT(*) AS n FROM alert_history WHERE user_id = ? AND at >= ? AND status = 'rate_limited'")
    .bind(user.id, since).first();
  return {
    enabled: await alertsEnabled(db, user.id),
    email: user.email,
    rules: rules.map(publicRule),
    history,
    caps: { person: caps.person, total: caps.total, sentToday: used.mine, cappedToday: Number(capped.n) },
    ...catalog(),
  };
}

export async function setAlertsEnabled(db, actor, enabled) {
  const on = enabled ? 1 : 0;
  await db.prepare("INSERT INTO alert_prefs (user_id, enabled, updated_at) VALUES (?, ?, ?) " +
    "ON CONFLICT (user_id) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at")
    .bind(actor.id, on, Date.now()).run();
  await record(db, { actor, action: "alert.switch", target: actor.label, after: { enabled: Boolean(on) } });
  return { enabled: Boolean(on) };
}

const ruleFields = (r) => ({
  buoy_id: r.buoy_id, kind: r.kind, metric: r.metric, op: r.op, value: r.value, remind_hours: r.remind_hours, enabled: Boolean(r.enabled),
});

export async function createRule(db, actor, body) {
  const rule = validRule(body);
  if (rule.error) return rule;
  const { n } = await db.prepare("SELECT COUNT(*) AS n FROM alert_rules WHERE user_id = ?").bind(actor.id).first();
  if (n >= MAX_RULES) return { error: `You can have up to ${MAX_RULES} alert rules.` };
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.prepare("INSERT INTO alert_rules (id, user_id, buoy_id, kind, metric, op, value, remind_hours, enabled, created_at, updated_at) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, actor.id, rule.buoy_id, rule.kind, rule.metric, rule.op, rule.value, rule.remind_hours, rule.enabled, now, now).run();
  await record(db, { actor, action: "alert.rule.create", target: describeRule(rule), after: ruleFields(rule) });
  return { id };
}

async function ownRule(db, actor, id) {
  return db.prepare("SELECT * FROM alert_rules WHERE id = ? AND user_id = ?").bind(id, actor.id).first();
}

/** An edit replaces the rule and clears where it stood, so a rule edited while in breach fires
 * again on the next reading under its new terms. */
export async function updateRule(db, actor, id, body) {
  const before = await ownRule(db, actor, id);
  if (!before) return { error: "No such alert rule.", status: 404 };
  const rule = validRule({ ...ruleFields(before), ...body });
  if (rule.error) return rule;
  await db.batch([
    db.prepare("UPDATE alert_rules SET buoy_id = ?, kind = ?, metric = ?, op = ?, value = ?, remind_hours = ?, enabled = ?, updated_at = ? " +
      "WHERE id = ? AND user_id = ?")
      .bind(rule.buoy_id, rule.kind, rule.metric, rule.op, rule.value, rule.remind_hours, rule.enabled, Date.now(), id, actor.id),
    db.prepare("DELETE FROM alert_state WHERE rule_id = ?").bind(id),
  ]);
  await record(db, { actor, action: "alert.rule.edit", target: describeRule(rule), before: ruleFields(before), after: ruleFields(rule) });
  return {};
}

export async function deleteRule(db, actor, id) {
  const before = await ownRule(db, actor, id);
  if (!before) return { error: "No such alert rule.", status: 404 };
  await db.prepare("DELETE FROM alert_rules WHERE id = ? AND user_id = ?").bind(id, actor.id).run();
  await record(db, { actor, action: "alert.rule.delete", target: describeRule(before), before: ruleFields(before) });
  return {};
}

const ALL_ALERTS = "All your email alerts";

async function liveOffLink(db, token, now) {
  if (!/^[\w-]{20,64}$/.test(token)) return null;
  const link = await db.prepare("SELECT * FROM alert_off_links WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL")
    .bind(await sha256Hex(token), now).first();
  if (!link) return null;
  if (link.rule_id === null) return { link, rule: null, description: ALL_ALERTS };
  const rule = await db.prepare("SELECT * FROM alert_rules WHERE id = ? AND user_id = ?").bind(link.rule_id, link.user_id).first();
  return rule ? { link, rule, description: describeRule(rule) } : null;
}

const GONE = { error: "This link has expired or was already used.", status: 410 };

/** What an off link would turn off, for the page that asks first. Changes nothing. */
export async function offLinkInfo(db, token, now = Date.now()) {
  const found = await liveOffLink(db, token, now);
  if (!found) return GONE;
  return { description: found.description, buoy_id: found.rule?.buoy_id ?? null };
}

/** Turn off the one rule the link names (or, for a batched email's List-Unsubscribe link, that
 * person's alerts). Works once, with no sign-in: the token is the proof. */
export async function useOffLink(db, token, now = Date.now()) {
  const found = await liveOffLink(db, token, now);
  if (!found) return GONE;
  const claimed = await db.prepare("UPDATE alert_off_links SET used_at = ? WHERE token_hash = ? AND used_at IS NULL")
    .bind(now, found.link.token_hash).run();
  if (!claimed.meta?.changes) return GONE;
  const actor = { id: found.link.user_id, label: "alert email link" };
  if (found.rule) {
    await db.prepare("UPDATE alert_rules SET enabled = 0, updated_at = ? WHERE id = ?").bind(now, found.rule.id).run();
    await record(db, { actor, action: "alert.rule.off", target: found.description, after: { enabled: false } });
  } else {
    await db.prepare("UPDATE alert_prefs SET enabled = 0, updated_at = ? WHERE user_id = ?").bind(now, found.link.user_id).run();
    await record(db, { actor, action: "alert.switch", target: "alert email link", after: { enabled: false } });
  }
  return { description: found.description };
}
