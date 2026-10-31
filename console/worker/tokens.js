/* Personal API tokens (Phase B, SCO-240). A member makes one on the Developer page for a script
 * or a notebook; it is shown once, stored hashed, always expires, and can be revoked. A token
 * acts as its owner with that owner's role at the time of use, limited further by its scopes. */

import { record } from "./audit.js";
import { randomToken, sha256Hex } from "./crypto.js";

export const SCOPES = ["read:telemetry", "write:settings"];
export const EXPIRY_DAYS = [7, 30, 90, 365];
const DAY_MS = 24 * 3600 * 1000;

export async function createToken(db, actor, { name, scopes, days }) {
  const cleanName = String(name || "").trim().slice(0, 60);
  const wanted = Array.isArray(scopes) ? [...new Set(scopes)] : [];
  if (!cleanName) return { error: "Name the token after what will use it." };
  if (wanted.length === 0 || !wanted.every((scope) => SCOPES.includes(scope))) return { error: "Pick at least one scope." };
  if (!EXPIRY_DAYS.includes(Number(days))) return { error: `Expiry is ${EXPIRY_DAYS.join(", ")} days.` };
  const token = `sct_${randomToken(24)}`;
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare("INSERT INTO api_tokens (id, user_id, name, token_hash, scopes, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, actor.id, cleanName, await sha256Hex(token), wanted.join(" "), now, now + Number(days) * DAY_MS)
    .run();
  await record(db, { actor, action: "token.create", target: cleanName, after: { scopes: wanted.join(" "), days: Number(days) } });
  return { token, id };
}

export async function listTokens(db, userId) {
  const { results } = await db
    .prepare("SELECT id, name, scopes, created_at, expires_at, last_used_at, revoked_at FROM api_tokens " +
      "WHERE user_id = ? ORDER BY created_at DESC")
    .bind(userId)
    .all();
  return results;
}

export async function revokeToken(db, actor, id) {
  const token = await db.prepare("SELECT * FROM api_tokens WHERE id = ? AND user_id = ? AND revoked_at IS NULL")
    .bind(id, actor.id).first();
  if (!token) return { error: "That token is not one of yours, or is already revoked." };
  await db.prepare("UPDATE api_tokens SET revoked_at = ? WHERE id = ?").bind(Date.now(), id).run();
  await record(db, { actor, action: "token.revoke", target: token.name });
  return {};
}

/** The token and owner behind "Authorization: Bearer sct_…", or null. */
export async function authenticateToken(db, request, now = Date.now()) {
  const match = /^Bearer (sct_[\w-]{20,80})$/.exec(request.headers.get("Authorization") || "");
  if (!match) return null;
  const row = await db
    .prepare("SELECT t.id, t.name, t.scopes, t.expires_at, t.revoked_at, u.id AS user_id, u.email, u.role, u.disabled " +
      "FROM api_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = ?")
    .bind(await sha256Hex(match[1]))
    .first();
  if (!row || row.revoked_at || row.expires_at <= now || row.disabled) return null;
  await db.prepare("UPDATE api_tokens SET last_used_at = ? WHERE id = ?").bind(now, row.id).run();
  return {
    scopes: row.scopes.split(" "),
    user: { id: row.user_id, email: row.email, role: row.role, label: `${row.email} (token ${row.name})` },
  };
}
