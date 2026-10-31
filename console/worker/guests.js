/* "Sign in as guest" (ADR-0012, amended 2026-10-30): a name and an email give a view-only guest.
 *
 * Nothing proves the email, so anyone who types it gets the same account. That is acceptable only
 * because a guest changes nothing, and it shapes the rest: the email must not belong to a real
 * account, an address can start only a few guest sessions per window, other people's emails are
 * masked for these guests, and the account can never be promoted (users.js). */

import { record } from "./audit.js";
import { validEmail } from "./users.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 5;
const EMAIL_IN_TEXT = /([^\s@"'<>(),;:]{1,64})@([^\s@"'<>(),;:]{1,190}\.[^\s@"'<>(),;:]{2,63})/g;

export function maskEmail(text) {
  return text.replace(EMAIL_IN_TEXT, (_, local, domain) => `${local[0]}•••@${domain}`);
}

/** A copy of an API reply with every email but the viewer's own masked. */
export function maskReply(value, ownEmail) {
  if (typeof value === "string") {
    return value.toLowerCase() === ownEmail.toLowerCase() ? value : maskEmail(value);
  }
  if (Array.isArray(value)) return value.map((item) => maskReply(item, ownEmail));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, maskReply(item, ownEmail)]));
  }
  return value;
}

async function tooMany(db, ip, now) {
  const key = `guest:${ip}`;
  await db.batch([
    db.prepare("INSERT INTO login_failures (key, at) VALUES (?, ?)").bind(key, now),
    db.prepare("DELETE FROM login_failures WHERE at < ?").bind(now - WINDOW_MS),
  ]);
  const { n } = await db.prepare("SELECT COUNT(*) AS n FROM login_failures WHERE key = ? AND at > ?")
    .bind(key, now - WINDOW_MS).first();
  return n > MAX_PER_IP;
}

/** @returns {Promise<{user?: object, error?: string, status?: number}>} */
export async function guestSignIn(db, name, email, ip, now = Date.now()) {
  const cleanName = name.trim().slice(0, 80);
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanName) return { error: "Enter your name.", status: 400 };
  if (!validEmail(cleanEmail)) return { error: "Enter a valid email address.", status: 400 };
  if (await tooMany(db, ip, now)) return { error: "Too many guest sign-ins from here. Try again in 15 minutes.", status: 429 };
  const existing = await db.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
  if (existing) {
    if (!existing.self_signup || existing.disabled) {
      return { error: "This email already has an account. Sign in with it instead.", status: 409 };
    }
    return { user: existing };
  }
  const id = crypto.randomUUID();
  await db.prepare("INSERT INTO users (id, email, name, role, self_signup, created_at) VALUES (?, ?, ?, 'guest', 1, ?)")
    .bind(id, cleanEmail, cleanName, now).run();
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  await record(db, { actor: user, action: "user.guest_signup", target: cleanEmail });
  return { user };
}
