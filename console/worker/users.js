/* Accounts, invites, roles and password resets. Invite-only: nobody gets an account without an
 * admin's invite, except the first admin named by BOOTSTRAP_ADMIN_EMAIL on an empty database and
 * view-only guests who sign themselves in (guests.js). Invite and reset links are single-use,
 * expire, and are stored hashed. */

import { record } from "./audit.js";
import { hashPassword, passwordProblem, randomToken, sha256Hex } from "./crypto.js";
import { isRole } from "./roles.js";
import { destroyUserSessions } from "./sessions.js";

export const INVITE_TTL_MS = 7 * 24 * 3600 * 1000;
export const RESET_TTL_MS = 24 * 3600 * 1000;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/;

const PROVIDER_COLUMN = { github: "github_id", google: "google_sub" };

export function validEmail(email) {
  return typeof email === "string" && EMAIL.test(email);
}

async function insertUser(db, { email, name, role, column = null, subject = null, passwordHash = null }) {
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO users (id, email, name, role, password_hash, github_id, google_sub, created_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(id, email, name.slice(0, 120), role, passwordHash,
      column === "github_id" ? subject : null, column === "google_sub" ? subject : null, Date.now())
    .run();
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
}

export async function validInvite(db, token, now = Date.now()) {
  if (!token || token.length > 64) return null;
  const invite = await db.prepare("SELECT * FROM invites WHERE token_hash = ?").bind(await sha256Hex(token)).first();
  if (!invite || invite.accepted_at || invite.revoked_at || invite.expires_at <= now) return null;
  return invite;
}

/** Claim an invite exactly once: of two concurrent uses, only one updates the row. */
async function claimInvite(db, invite) {
  const { meta } = await db
    .prepare("UPDATE invites SET accepted_at = ? WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL")
    .bind(Date.now(), invite.id)
    .run();
  return meta.changes === 1;
}

/** A self-signed-up guest's email was proven (invite or verified OAuth): the account stops being
 * one anyone can open by typing the email, and every session opened that way ends. */
async function claimSelfSignup(db, user, changes = {}) {
  const sets = ["self_signup = 0", ...Object.keys(changes).map((column) => `${column} = ?`)];
  await db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).bind(...Object.values(changes), user.id).run();
  await destroyUserSessions(db, user.id);
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
}

async function markAccepted(db, invite, user) {
  await record(db, { actor: user, action: "invite.accept", target: invite.email, after: { role: invite.role } });
}

/** The user an OAuth identity signs in as, creating or linking one where that is allowed. */
export async function userForIdentity(db, identity, inviteToken, env) {
  const column = PROVIDER_COLUMN[identity.provider];
  const email = identity.email.toLowerCase();
  if (inviteToken) {
    const invite = await validInvite(db, inviteToken);
    if (!invite) return { error: "This invite has expired, was revoked, or was already used." };
    if (invite.email.toLowerCase() !== email) {
      return { error: `This invite is for ${invite.email}; you signed in as ${identity.email}.` };
    }
    const existing = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (existing && !existing.self_signup) return { error: "An account with this email already exists. Sign in instead." };
    const linked = await db.prepare(`SELECT id FROM users WHERE ${column} = ?`).bind(identity.subject).first();
    if (linked) return { error: `That ${identity.provider} account already belongs to another console account.` };
    if (!(await claimInvite(db, invite))) return { error: "This invite was just used." };
    const user = existing
      ? await claimSelfSignup(db, existing, { role: invite.role, name: identity.name.slice(0, 120), [column]: identity.subject })
      : await insertUser(db, { email, name: identity.name, role: invite.role, column, subject: identity.subject });
    await markAccepted(db, invite, user);
    return { user };
  }
  const bySubject = await db.prepare(`SELECT * FROM users WHERE ${column} = ?`).bind(identity.subject).first();
  if (bySubject) return { user: bySubject };
  const byEmail = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (byEmail && !byEmail[column]) {
    let user = byEmail;
    if (byEmail.self_signup) user = await claimSelfSignup(db, byEmail, { [column]: identity.subject });
    else await db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).bind(identity.subject, byEmail.id).run();
    await record(db, { actor: user, action: "user.link", target: identity.provider });
    return { user };
  }
  const { n } = await db.prepare("SELECT COUNT(*) AS n FROM users").first();
  if (n === 0 && env.BOOTSTRAP_ADMIN_EMAIL && env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase() === email) {
    const user = await insertUser(db, { email, name: identity.name, role: "admin", column, subject: identity.subject });
    await record(db, { actor: user, action: "user.bootstrap_admin", target: email });
    return { user };
  }
  return { error: `No account for ${identity.email}. Ask an admin for an invite.` };
}

export async function acceptInviteWithPassword(db, token, name, password) {
  const invite = await validInvite(db, token);
  if (!invite) return { error: "This invite has expired, was revoked, or was already used." };
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  const existing = await db.prepare("SELECT * FROM users WHERE email = ?").bind(invite.email).first();
  if (existing && !existing.self_signup) return { error: "An account with this email already exists. Sign in instead." };
  if (!(await claimInvite(db, invite))) return { error: "This invite was just used." };
  const passwordHash = await hashPassword(password);
  const user = existing
    ? await claimSelfSignup(db, existing, { role: invite.role, name: (name || existing.name).slice(0, 120), password_hash: passwordHash })
    : await insertUser(db, { email: invite.email.toLowerCase(), name: name || "", role: invite.role, passwordHash });
  await markAccepted(db, invite, user);
  return { user };
}

export async function createInvite(db, actor, email, role) {
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (!isRole(role)) return { error: "Pick a role." };
  // A self-signed-up guest proves nothing about the email, so an invite can still take it over.
  const taken = await db.prepare("SELECT id, self_signup FROM users WHERE email = ?").bind(email).first();
  if (taken && !taken.self_signup) return { error: `${email} already has an account.` };
  const token = randomToken(24);
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare("INSERT INTO invites (id, token_hash, email, role, invited_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, await sha256Hex(token), email.toLowerCase(), role, actor.id, now, now + INVITE_TTL_MS)
    .run();
  await record(db, { actor, action: "invite.create", target: email.toLowerCase(), after: { role } });
  return { token };
}

export async function revokeInvite(db, actor, id) {
  const invite = await db.prepare("SELECT * FROM invites WHERE id = ?").bind(id).first();
  if (!invite || invite.accepted_at || invite.revoked_at) return { error: "That invite is no longer open." };
  await db.prepare("UPDATE invites SET revoked_at = ? WHERE id = ?").bind(Date.now(), id).run();
  await record(db, { actor, action: "invite.revoke", target: invite.email });
  return {};
}

export async function setRole(db, actor, userId, role) {
  if (!isRole(role)) return { error: "Pick a role." };
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  if (!user) return { error: "No such user." };
  if (user.self_signup && role !== "guest") {
    return { error: "This guest signed themselves in, so anyone with their email could use the account. Invite them instead." };
  }
  if (role !== "admin" && (await lastActiveAdmin(db, user))) return { error: "The console needs at least one admin." };
  await db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, userId).run();
  await record(db, { actor, action: "user.role", target: user.email, before: { role: user.role }, after: { role } });
  return {};
}

async function lastActiveAdmin(db, user) {
  if (user.role !== "admin" || user.disabled) return false;
  const { n } = await db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND disabled = 0").first();
  return n <= 1;
}

/** Offboard (or restore) a person: a disabled account cannot sign in and its sessions end. */
export async function setDisabled(db, actor, userId, disabled) {
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  if (!user) return { error: "No such user." };
  if (disabled && user.id === actor.id) return { error: "You cannot disable your own account." };
  if (disabled && (await lastActiveAdmin(db, user))) return { error: "The console needs at least one admin." };
  await db.prepare("UPDATE users SET disabled = ? WHERE id = ?").bind(disabled ? 1 : 0, userId).run();
  if (disabled) await destroyUserSessions(db, userId);
  await record(db, { actor, action: disabled ? "user.disable" : "user.enable", target: user.email });
  return {};
}

export async function createResetLink(db, actor, userId) {
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  if (!user) return { error: "No such user." };
  const token = randomToken(24);
  // A new link replaces any earlier unused one for this user.
  await db.batch([
    db.prepare("DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL").bind(userId),
    db.prepare("INSERT INTO password_resets (token_hash, user_id, created_by, expires_at) VALUES (?, ?, ?, ?)")
      .bind(await sha256Hex(token), userId, actor.id, Date.now() + RESET_TTL_MS),
  ]);
  await record(db, { actor, action: "user.reset_link", target: user.email });
  return { token, email: user.email };
}

export async function validReset(db, token, now = Date.now()) {
  if (!token || token.length > 64) return null;
  const reset = await db.prepare("SELECT * FROM password_resets WHERE token_hash = ?").bind(await sha256Hex(token)).first();
  if (!reset || reset.used_at || reset.expires_at <= now) return null;
  return reset;
}

/** Set a new password from a reset link, and sign the user out everywhere. */
export async function resetPassword(db, token, password) {
  const reset = await validReset(db, token);
  if (!reset) return { error: "This reset link has expired or was already used." };
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  const { meta } = await db
    .prepare("UPDATE password_resets SET used_at = ? WHERE token_hash = ? AND used_at IS NULL")
    .bind(Date.now(), reset.token_hash)
    .run();
  if (meta.changes !== 1) return { error: "This reset link has expired or was already used." };
  await db.batch([
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(await hashPassword(password), reset.user_id),
    db.prepare("DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL").bind(reset.user_id),
  ]);
  await destroyUserSessions(db, reset.user_id);
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(reset.user_id).first();
  await record(db, { actor: user, action: "user.password_reset", target: user.email });
  return { user };
}

export async function listUsers(db) {
  const { results } = await db
    .prepare("SELECT id, email, name, role, disabled, created_at, password_hash IS NOT NULL AS has_password, " +
      "github_id IS NOT NULL AS has_github, google_sub IS NOT NULL AS has_google, self_signup FROM users ORDER BY created_at")
    .all();
  return results;
}

export async function openInvites(db, now = Date.now()) {
  const { results } = await db
    .prepare("SELECT id, email, role, created_at, expires_at FROM invites " +
      "WHERE accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ? ORDER BY created_at DESC")
    .bind(now)
    .all();
  return results;
}
