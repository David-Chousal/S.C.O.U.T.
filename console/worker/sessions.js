/* Sessions and password sign-in.
 *
 * The session cookie holds 256 random bits; the database holds only its SHA-256, so a leaked
 * table does not leak sessions. Each session carries its own CSRF token for forms. Sign-in is
 * rate-limited per (email, IP) pair and per IP, so a stranger cannot lock someone else out by
 * failing on purpose from their own address, plus a looser per-email cap against spraying from
 * many addresses. Each attempt is counted before the hash is checked, so a parallel burst cannot
 * slip past the limit. The same "wrong email or password" answer is given whether or not the
 * account exists. */

import { hashPassword, randomToken, sha256Hex, verifyPassword } from "./crypto.js";
import { readCookie, SESSION_COOKIE } from "./http.js";

export const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_PAIR = 5;
const MAX_FAILURES_PER_IP = 20;
const MAX_FAILURES_PER_EMAIL = 50;

// Verified against when the email is unknown, so both paths cost one PBKDF2.
let dummyHash = null;

export async function createSession(db, userId, now = Date.now()) {
  const token = randomToken();
  const csrf = randomToken(18);
  await db.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now).run();
  await db
    .prepare("INSERT INTO sessions (token_hash, user_id, csrf, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
    .bind(await sha256Hex(token), userId, csrf, now, now + SESSION_TTL_MS)
    .run();
  return { token, csrf };
}

/** The signed-in user and session for a request, or null. */
export async function loadSession(db, request, now = Date.now()) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || token.length > 128) return null;
  const row = await db
    .prepare(
      "SELECT s.token_hash, s.csrf, s.expires_at, u.id, u.email, u.name, u.role, u.disabled, " +
        "u.password_hash IS NOT NULL AS has_password, u.github_id, u.google_sub " +
        "FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
    )
    .bind(await sha256Hex(token))
    .first();
  if (!row || row.expires_at <= now || row.disabled) return null;
  return {
    sessionHash: row.token_hash,
    csrf: row.csrf,
    user: { id: row.id, email: row.email, name: row.name, role: row.role,
      hasPassword: Boolean(row.has_password), github: Boolean(row.github_id), google: Boolean(row.google_sub) },
  };
}

export async function destroySession(db, sessionHash) {
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(sessionHash).run();
}

export async function destroyUserSessions(db, userId) {
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}

async function failuresSince(db, key, since) {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM login_failures WHERE key = ? AND at > ?")
    .bind(key, since)
    .first();
  return row.n;
}

function keysFor(email, ip) {
  const lower = email.toLowerCase();
  return [`pair:${lower}|${ip}`, `ip:${ip}`, `email:${lower}`];
}

export async function rateLimited(db, email, ip, now = Date.now()) {
  const since = now - FAILURE_WINDOW_MS;
  const [pair, byIp, byEmail] = keysFor(email, ip);
  // Strictly greater: the attempt being checked is already counted.
  return (await failuresSince(db, pair, since)) > MAX_FAILURES_PER_PAIR ||
    (await failuresSince(db, byIp, since)) > MAX_FAILURES_PER_IP ||
    (await failuresSince(db, byEmail, since)) > MAX_FAILURES_PER_EMAIL;
}

// Counted as a failure up front; a successful sign-in takes it back.
async function recordAttempt(db, email, ip, now) {
  await db.batch([
    ...keysFor(email, ip).map((key) => db.prepare("INSERT INTO login_failures (key, at) VALUES (?, ?)").bind(key, now)),
    db.prepare("DELETE FROM login_failures WHERE at < ?").bind(now - FAILURE_WINDOW_MS),
  ]);
}

async function forgiveAttempt(db, email, ip, now) {
  await db.batch(keysFor(email, ip).map((key) =>
    db.prepare("DELETE FROM login_failures WHERE rowid = (SELECT rowid FROM login_failures WHERE key = ? AND at = ? LIMIT 1)")
      .bind(key, now)));
}

/** @returns {Promise<{user?: object, error?: string}>} */
export async function passwordSignIn(db, email, password, ip, now = Date.now()) {
  if (!email || !password) return { error: "Enter your email and password." };
  await recordAttempt(db, email, ip, now);
  if (await rateLimited(db, email, ip, now)) {
    return { error: "Too many attempts. Wait 15 minutes, or sign in with GitHub or Google." };
  }
  const user = await db
    .prepare("SELECT id, email, role, password_hash, disabled FROM users WHERE email = ?")
    .bind(email)
    .first();
  dummyHash ??= await hashPassword(randomToken());
  const ok = await verifyPassword(password, user?.password_hash ?? dummyHash);
  if (!user || !user.password_hash || !ok || user.disabled) return { error: "Wrong email or password." };
  await forgiveAttempt(db, email, ip, now);
  return { user };
}
