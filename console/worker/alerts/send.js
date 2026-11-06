/* Sending alert emails (SCO-301, ADR-0015) through the invite/reset transport (mail.js) and
 * layout (mail-layout.js). One email per person per push or cron run, listing every alert that
 * fired. Alerts go only to the rule owner's account email.
 *
 * Caps: Resend's free plan allows 100 emails a day for the whole account, shared with invites
 * and resets (capped at 50 a day in mail.js). Alerts are capped at 10 a day per person and 30 a
 * day console-wide, so 20 stay spare. A send over a cap is not made; it is recorded in the alert
 * history and the audit log, and the Notifications tab says so.
 *
 * Never logged or audited: the off-link tokens, the links, the API key, or an address unmasked. */

import { record } from "../audit.js";
import { randomToken, sha256Hex } from "../crypto.js";
import { emailHtml } from "../mail-layout.js";
import { cap, configured, deliver, maskEmail } from "../mail.js";
import { describeRule, FLAGS, formatValue, METRICS } from "./catalog.js";

const DEFAULT_CAP_PERSON = 10;
const DEFAULT_CAP_TOTAL = 30;
const DAY_MS = 24 * 3600 * 1000;
const OFF_LINK_DAYS = 30;

export const capsOf = (env) => ({
  person: cap(env.ALERT_DAILY_CAP_PERSON, DEFAULT_CAP_PERSON),
  total: cap(env.ALERT_DAILY_CAP_TOTAL, DEFAULT_CAP_TOTAL),
});

/** Alert emails attempted today (UTC) for this person and for everyone. Capped ones don't count. */
export async function emailsToday(db, userId, now) {
  const since = now - (now % DAY_MS);
  const row = await db
    .prepare("SELECT COUNT(*) AS total, COALESCE(SUM(actor_id = ?), 0) AS mine FROM audit_log " +
      "WHERE action = 'alert.email' AND at >= ? AND COALESCE(json_extract(after_json, '$.status'), '') != 'rate_limited'")
    .bind(userId, since).first();
  return { total: Number(row.total), mine: Number(row.mine) };
}

const utc = (ms) => `${new Date(ms).toISOString().slice(0, 16).replace("T", " ")} UTC`;
const oneLine = (text) => String(text).replace(/[\r\n]+/g, " ").slice(0, 120);

function reading(rule) {
  if (rule.kind === "threshold") return METRICS[rule.metric].label;
  if (rule.kind === "flag") return `Firmware flag ${rule.metric}`;
  return "Packets";
}

function when(event) {
  if (event.rule.kind === "silence") return `Last heard ${utc(event.at)}`;
  return event.clockLost ? `Received ${utc(event.at)} (buoy clock lost)` : utc(event.at);
}

/** "SCOUT-01: Battery below 3.2 V" (and "Still: …" for a reminder). */
export function headline(event) {
  return `${event.kind === "reminder" ? "Still: " : ""}${event.buoy.label}: ${describeRule(event.rule)}`;
}

function facts(event) {
  const value = event.rule.kind === "flag" ? `${FLAGS[event.rule.metric]}, raised` : formatValue(event.rule, event.value);
  return [["Buoy", event.buoy.label], ["Reading", reading(event.rule)], ["Value", value],
    [event.rule.kind === "threshold" ? "Threshold" : "Alert when", describeRule(event.rule)], ["When", when(event)]];
}

/** Subject, text and HTML for one person's alerts. `offLinks[i]` belongs to `events[i]`. */
export function alertMessage(env, events, offLinks, { test = false } = {}) {
  const tab = new URL("/settings/?tab=notifications", env.APP_URL).toString();
  const buoys = [...new Map(events.map((e) => [e.buoy.buoy_id, e.buoy])).values()];
  const open = buoys.length === 1
    ? { label: "Open the buoy", href: new URL(`/readings/?buoy=${buoys[0].buoy_id}`, env.APP_URL).toString() }
    : { label: "Open Fleet", href: new URL("/fleet/", env.APP_URL).toString() };
  const single = events.length === 1;
  const subject = oneLine((test ? "Test: " : "") + (single ? headline(events[0])
    : `${events.length} alerts on ${buoys.map((b) => b.label).join(", ")}`));
  const title = test ? "Test alert" : single ? headline(events[0]) : `${events.length} alerts fired`;
  const intro = test
    ? ["This is a test of your email alerts. It shows what an alert looks like; no buoy crossed anything."]
    : [single ? "An alert you set on the S.C.O.U.T. Console fired." : `${events.length} alerts you set on the S.C.O.U.T. Console fired.`];
  const notes = [
    "You get this because you turned on email alerts on the console's Notifications tab, where you can change or turn off any of them:",
    tab,
  ];
  const groups = events.map((event, i) => ({
    // A single alert's headline is already the email's title.
    title: single ? undefined : headline(event), facts: facts(event),
    link: offLinks[i] ? { label: "Turn this alert off", href: offLinks[i] } : undefined,
  }));
  const text = [
    title, "", ...intro, "",
    ...events.flatMap((event, i) => [
      headline(event),
      ...facts(event).map(([label, value]) => `  ${label}: ${value}`),
      ...(offLinks[i] ? [`  Turn this alert off: ${offLinks[i]}`] : []),
      "",
    ]),
    `${open.label}: ${open.href}`, "", ...notes,
  ].join("\n");
  return { subject, text, html: emailHtml({ title, intro, groups, action: open, notes }) };
}

/** A new off link: `page` asks first (the body's link, safe from link scanners), `oneClick` is the
 * RFC 8058 List-Unsubscribe-Post target that a mail client POSTs to. */
async function newOffLink(env, userId, ruleId, now) {
  const token = randomToken();
  await env.DB.prepare("INSERT INTO alert_off_links (token_hash, user_id, rule_id, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256Hex(token), userId, ruleId, now + OFF_LINK_DAYS * DAY_MS).run();
  return {
    page: new URL(`/alerts/off/?token=${token}`, env.APP_URL).toString(),
    oneClick: new URL(`/api/alerts/off/${token}`, env.APP_URL).toString(),
  };
}

async function remember(db, user, events, status, reason, now) {
  await db.batch(events.map((e) => db.prepare(
    "INSERT INTO alert_history (user_id, rule_id, buoy_id, at, kind, summary, status, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(user.id, e.rule.id ?? null, e.buoy.buoy_id, now, e.kind, e.rule.kind === "flag" ? headline(e) : `${headline(e)} · ${facts(e)[2][1]}`, status, reason ?? null)));
}

async function overCap(env, user, now) {
  const caps = capsOf(env);
  const used = await emailsToday(env.DB, user.id, now);
  if (used.mine >= caps.person) return `your daily cap of ${caps.person}`;
  if (used.total >= caps.total) return `the console-wide daily cap of ${caps.total}`;
  return null;
}

/**
 * Email one person their alerts. Never throws on a refused send; returns the status.
 * @param {{ id: string, email: string }} user
 * @param {{ rule: object, buoy: { buoy_id: number, label: string }, value: number | null, at: number,
 *   kind: "alert" | "reminder" | "test", clockLost?: boolean }[]} events
 */
export async function sendAlerts(env, user, events, now = Date.now(), { test = false } = {}) {
  if (events.length === 0) return { status: "none" };
  const db = env.DB;
  const actor = { id: user.id, label: "alerts" };
  const masked = maskEmail(user.email);
  if (!configured(env)) {
    await remember(db, user, events, "not_configured", "email is not set up on this console", now);
    return { status: "not_configured" };
  }
  const capped = await overCap(env, user, now);
  if (capped) {
    await remember(db, user, events, "rate_limited", capped, now);
    await record(db, { actor, action: "alert.email", target: masked, after: { status: "rate_limited", alerts: events.length } });
    return { status: "rate_limited" };
  }
  const links = test ? events.map(() => null)
    : await Promise.all(events.map((e) => newOffLink(env, user.id, e.rule.id, now)));
  const ruleIds = new Set(events.map((e) => e.rule.id));
  const unsubscribe = test ? null : ruleIds.size === 1 ? links[0] : await newOffLink(env, user.id, null, now);
  const headers = unsubscribe
    ? { "List-Unsubscribe": `<${unsubscribe.oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
    : undefined;
  const offLinks = links.map((link) => link?.page ?? null);
  let status = "sent";
  let code;
  try {
    await deliver(env, { to: user.email, ...alertMessage(env, events, offLinks, { test }), ...(headers ? { headers } : {}) });
  } catch (error) {
    status = "failed";
    code = typeof error?.code === "string" ? error.code.slice(0, 64) : "unknown";
    // The code only: a provider's message could echo the address or the body (and so a link).
    console.error(`console: alert.email not sent: ${code}`);
  }
  await remember(db, user, events, status, code, now);
  if (status === "sent" && !test) {
    await db.batch(events.map((e) => db.prepare("UPDATE alert_state SET last_sent_at = ? WHERE rule_id = ? AND buoy_id = ?")
      .bind(now, e.rule.id, e.buoy.buoy_id)));
  }
  await record(db, { actor, action: "alert.email", target: masked,
    after: { status, alerts: events.length, ...(test ? { test: true } : {}), ...(code ? { code } : {}) } });
  return { status };
}

/** The tab's "Send test email": one sample alert to the person's own account email. */
export async function sendTestEmail(env, actor, now = Date.now()) {
  const sample = {
    rule: { id: null, kind: "threshold", metric: "battery_v", op: "below", value: 3.2 },
    buoy: { buoy_id: 1, label: "SCOUT-01 (sample)" }, value: 3.15, at: now, kind: "test",
  };
  return sendAlerts(env, { id: actor.id, email: actor.email }, [sample], now, { test: true });
}
