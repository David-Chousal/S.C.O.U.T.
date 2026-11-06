/* Invite and password-reset emails (SCO-300, ADR-0014), sent through Cloudflare Email Sending's
 * Workers binding (EMAIL in wrangler.toml). Email is a convenience on top of the link the admin
 * already gets: a missing binding, a refused send or a spent daily cap never blocks the invite or
 * the reset, and the reply says which happened so the Team page can tell the admin.
 *
 * The link carries the one-time token, so it goes only into the message itself: never into a log
 * line or the audit log. The audit log names each attempt with the address masked. */

import { record } from "./audit.js";

export const SENDER = { email: "console@scoutscu.com", name: "S.C.O.U.T. Console" };

// Defaults, overridable with vars. Cloudflare's paid plan includes 3,000 emails a month (about
// 100 a day); these keep a runaway admin, script or stolen session far below that.
const DEFAULT_CAP_PER_ADMIN = 20;
const DEFAULT_CAP_TOTAL = 50;
const DAY_MS = 24 * 3600 * 1000;

const ROLE_WORDS = {
  guest: "a guest (sees every page, changes nothing)",
  member: "a member (also changes buoy settings)",
  admin: "an admin (also invites people and manages the console)",
};

/** "d***@example.com": enough to tell addresses apart in the audit log, not to harvest them. */
export function maskEmail(email) {
  const [local, domain] = String(email).split("@");
  return domain ? `${local.slice(0, 1)}***@${domain}` : "***";
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function formatExpiry(ms) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }).format(ms) + " UTC";
}

function cap(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Emails attempted today (UTC) by this admin and by everyone. Refused-by-cap rows don't count. */
async function sentToday(db, actorId, now) {
  const since = now - (now % DAY_MS);
  const row = await db
    .prepare("SELECT COUNT(*) AS total, COALESCE(SUM(actor_id = ?), 0) AS mine FROM audit_log " +
      "WHERE action IN ('invite.email', 'reset.email') AND at >= ? " +
      "AND COALESCE(json_extract(after_json, '$.status'), '') != 'rate_limited'")
    .bind(actorId, since)
    .first();
  return { total: Number(row.total), mine: Number(row.mine) };
}

function inviteMessage({ inviter, role, link, expiresAt }) {
  const who = inviter.name ? `${inviter.name} (${inviter.email})` : inviter.email;
  const expires = formatExpiry(expiresAt);
  const roleWords = ROLE_WORDS[role] ?? role;
  return {
    subject: "You're invited to the S.C.O.U.T. Console",
    text: [
      `${who} invited you to the S.C.O.U.T. Console as ${roleWords}.`,
      "",
      "The console is where the S.C.O.U.T. team watches the buoys' readings and manages the fleet.",
      "",
      "Accept the invite here:",
      link,
      "",
      `The link works once and expires on ${expires}.`,
      "If you weren't expecting this, ignore this email; nothing happens unless the link is used.",
    ].join("\n"),
    html: page([
      `<p>${escapeHtml(who)} invited you to the S.C.O.U.T. Console as ${escapeHtml(roleWords)}.</p>`,
      "<p>The console is where the S.C.O.U.T. team watches the buoys' readings and manages the fleet.</p>",
      button(link, "Accept the invite"),
      `<p>The link works once and expires on ${escapeHtml(expires)}.</p>`,
      "<p>If you weren't expecting this, ignore this email; nothing happens unless the link is used.</p>",
    ]),
  };
}

function resetMessage({ inviter, link, expiresAt }) {
  const who = inviter.name ? `${inviter.name} (${inviter.email})` : inviter.email;
  const expires = formatExpiry(expiresAt);
  return {
    subject: "Reset your S.C.O.U.T. Console password",
    text: [
      `${who}, an admin of the S.C.O.U.T. Console, issued a password reset link for your account.`,
      "",
      "Choose a new password here:",
      link,
      "",
      `The link works once and expires on ${expires}. Setting a new password signs you out everywhere.`,
      "If you didn't ask for this, ignore this email and tell an admin; your password stays the same.",
    ].join("\n"),
    html: page([
      `<p>${escapeHtml(who)}, an admin of the S.C.O.U.T. Console, issued a password reset link for your account.</p>`,
      button(link, "Choose a new password"),
      `<p>The link works once and expires on ${escapeHtml(expires)}. Setting a new password signs you out everywhere.</p>`,
      "<p>If you didn't ask for this, ignore this email and tell an admin; your password stays the same.</p>",
    ]),
  };
}

// Inline styles only: no remote images, fonts or stylesheets, and nothing that tracks opens.
function button(link, label) {
  const href = escapeHtml(link);
  return `<p><a href="${href}" style="display:inline-block;padding:10px 16px;background:#0b5d6b;color:#ffffff;` +
    `text-decoration:none;border-radius:6px">${escapeHtml(label)}</a></p>` +
    `<p style="font-size:13px;color:#555555">Or paste this address into your browser:<br>${href}</p>`;
}

function page(parts) {
  return '<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;' +
    `color:#1a1a1a;max-width:560px">${parts.join("")}</body></html>`;
}

/**
 * Email an invite or reset link. Never throws; returns { status, to } where status is one of
 * "sent", "failed", "not_configured" or "rate_limited".
 * @param {{ kind: "invite" | "reset", to: string, link: string, role?: string, expiresAt: number }} message
 */
export async function sendLinkEmail(env, actor, { kind, to, link, role, expiresAt }, now = Date.now()) {
  if (!env.EMAIL || typeof env.EMAIL.send !== "function") return { status: "not_configured", to };
  const action = `${kind}.email`;
  const masked = maskEmail(to);
  const counts = await sentToday(env.DB, actor.id, now);
  if (counts.mine >= cap(env.EMAIL_DAILY_CAP_ADMIN, DEFAULT_CAP_PER_ADMIN)
    || counts.total >= cap(env.EMAIL_DAILY_CAP_TOTAL, DEFAULT_CAP_TOTAL)) {
    await record(env.DB, { actor, action, target: masked, after: { status: "rate_limited" } });
    return { status: "rate_limited", to };
  }
  const content = kind === "invite"
    ? inviteMessage({ inviter: actor, role, link, expiresAt })
    : resetMessage({ inviter: actor, link, expiresAt });
  let status = "sent";
  let code;
  try {
    await env.EMAIL.send({ to, from: SENDER, ...content });
  } catch (error) {
    status = "failed";
    code = typeof error?.code === "string" ? error.code.slice(0, 64) : "unknown";
    // The code only: the binding's message could echo the recipient or the body (and so the link).
    console.error(`console: ${action} not sent: ${code}`);
  }
  await record(env.DB, { actor, action, target: masked, after: code ? { status, code } : { status } });
  return { status, to };
}
