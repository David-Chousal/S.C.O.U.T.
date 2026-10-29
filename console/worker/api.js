/* The console's JSON API, which the static front end (console/web) calls (ADR-0012, SCO-238).
 *
 * Every POST must be JSON (a cross-site HTML form cannot send that without a CORS preflight,
 * which this Worker never grants), from this origin, and, when signed in, carry the session's
 * CSRF token in X-CSRF-Token. Roles are checked here on every write (roles.js); the front end's
 * disabled controls are only a courtesy. Replies use the envelope { ok, ...data } / { ok:false, error }. */

import { recent } from "./audit.js";
import { constantTimeEqual } from "./crypto.js";
import { createDevice, listDevices, revokeDevice } from "./device.js";
import { addBuoy, buoyConfig, estimates, listBuoys, renameBuoy, requestTxCount, SLOT_LABELS } from "./fleet.js";
import { apiError, clearCookie, clientIp, json, sameOrigin, SESSION_COOKIE, setCookie } from "./http.js";
import { configured } from "./oauth.js";
import { can } from "./roles.js";
import {
  createSession, destroySession, destroyUserSessions, loadSession, passwordSignIn, SESSION_TTL_MS,
} from "./sessions.js";
import {
  acceptInviteWithPassword, createInvite, createResetLink, listUsers, openInvites, resetPassword,
  revokeInvite, setDisabled, setRole, validInvite, validReset,
} from "./users.js";

const MAX_JSON_BYTES = 16_384;

async function readJson(request) {
  if (!(request.headers.get("Content-Type") || "").startsWith("application/json")) return null;
  const text = await request.text();
  if (text.length > MAX_JSON_BYTES) return null;
  try {
    const body = JSON.parse(text || "{}");
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

/** A JSON reply that also starts a session (sign-in, invite accepted, password reset). */
async function withSession(env, user) {
  const { token } = await createSession(env.DB, user.id);
  const response = json({});
  response.headers.append("Set-Cookie", setCookie(SESSION_COOKIE, token, SESSION_TTL_MS / 1000));
  return response;
}

function actorOf(session) {
  return { id: session.user.id, email: session.user.email, label: session.user.email };
}

function link(env, kind, token) {
  return new URL(`/${kind}/?token=${token}`, env.APP_URL).toString();
}

/** Routes that work without a session. Returns null when the path is not one of them. */
async function signedOut(request, env, path, body) {
  if (path === "/api/providers") return json({ github: configured("github", env), google: configured("google", env) });
  if (path === "/api/login" && request.method === "POST") {
    const email = String(body.email || "").trim();
    const result = await passwordSignIn(env.DB, email, String(body.password || ""), clientIp(request));
    return result.user ? withSession(env, result.user) : apiError(result.error, 401);
  }
  const invite = /^\/api\/invites\/([\w-]{1,64})(\/accept)?$/.exec(path);
  if (invite) {
    const [, token, accept] = invite;
    if (!accept && request.method === "GET") {
      const found = await validInvite(env.DB, token);
      return found ? json({ invite: { email: found.email, role: found.role } })
        : apiError("This invite has expired, was revoked, or was already used.", 410);
    }
    if (accept && request.method === "POST") {
      const result = await acceptInviteWithPassword(env.DB, token, String(body.name || "").trim(), String(body.password || ""));
      return result.user ? withSession(env, result.user) : apiError(result.error, 400);
    }
  }
  const reset = /^\/api\/resets\/([\w-]{1,64})$/.exec(path);
  if (reset) {
    if (request.method === "GET") {
      return (await validReset(env.DB, reset[1])) ? json({})
        : apiError("This reset link has expired or was already used.", 410);
    }
    const result = await resetPassword(env.DB, reset[1], String(body.password || ""));
    return result.user ? withSession(env, result.user) : apiError(result.error, 400);
  }
  return null;
}

async function reads(env, path, session) {
  switch (path) {
    case "/api/session":
      return json({ user: session.user, csrf: session.csrf });
    case "/api/fleet":
      return json({ buoys: await listBuoys(env.DB), estimates, slotLabels: SLOT_LABELS });
    case "/api/settings":
      return json({ buoys: await listBuoys(env.DB), firmware: buoyConfig });
    case "/api/team":
      return json({ members: await listUsers(env.DB), invites: await openInvites(env.DB) });
    case "/api/devices":
      return json({ devices: await listDevices(env.DB) });
    case "/api/audit":
      return json({ entries: await recent(env.DB) });
    default:
      return apiError("not found", 404);
  }
}

/** [pattern, action needed, handler(db, body, match, actor, env) → { error?, ...reply }] */
const WRITES = [
  [/^\/api\/fleet\/buoys\/(\d{1,5})\/tx-count$/, "settings.write", (db, b, m, a) => requestTxCount(db, a, m[1], b.tx_count)],
  [/^\/api\/fleet\/buoys\/(\d{1,5})\/label$/, "settings.write", (db, b, m, a) => renameBuoy(db, a, m[1], b.label)],
  [/^\/api\/fleet\/buoys$/, "buoys.add", (db, b, m, a) => addBuoy(db, a, b.buoy_id, String(b.label || "").trim())],
  [/^\/api\/team\/invites$/, "invites.write", async (db, b, m, a, env) => {
    const result = await createInvite(db, a, String(b.email || "").trim(), b.role);
    return result.error ? result : { link: link(env, "invite", result.token) };
  }],
  [/^\/api\/team\/invites\/([\w-]{1,64})\/revoke$/, "invites.write", (db, b, m, a) => revokeInvite(db, a, m[1])],
  [/^\/api\/team\/users\/([\w-]{1,64})\/role$/, "users.role", (db, b, m, a) => setRole(db, a, m[1], b.role)],
  [/^\/api\/team\/users\/([\w-]{1,64})\/reset$/, "users.reset", async (db, b, m, a, env) => {
    const result = await createResetLink(db, a, m[1]);
    return result.error ? result : { link: link(env, "reset", result.token), email: result.email };
  }],
  [/^\/api\/team\/users\/([\w-]{1,64})\/(disable|enable)$/, "users.disable", (db, b, m, a) => setDisabled(db, a, m[1], m[2] === "disable")],
  [/^\/api\/devices$/, "devices.write", (db, b, m, a) => createDevice(db, a, b.name)],
  [/^\/api\/devices\/([\w-]{1,64})\/revoke$/, "devices.write", (db, b, m, a) => revokeDevice(db, a, m[1])],
];

async function writes(request, env, path, session, body) {
  if (path === "/api/logout") {
    await destroySession(env.DB, session.sessionHash);
    const response = json({});
    response.headers.append("Set-Cookie", clearCookie(SESSION_COOKIE));
    return response;
  }
  if (path === "/api/account/sign-out-everywhere") {
    await destroyUserSessions(env.DB, session.user.id);
    const response = json({});
    response.headers.append("Set-Cookie", clearCookie(SESSION_COOKIE));
    return response;
  }
  for (const [pattern, action, handler] of WRITES) {
    const match = pattern.exec(path);
    if (!match) continue;
    if (!can(session.user, action)) return apiError("Your role can view this but not change it.", 403);
    const result = await handler(env.DB, body, match, actorOf(session), env);
    if (result.error) return apiError(result.error, 400);
    return json(result);
  }
  return apiError("not found", 404);
}

export async function handleApi(request, env, path) {
  let body = {};
  if (request.method === "POST") {
    if (!sameOrigin(request, env.APP_URL)) return apiError("Requests must come from the console itself.", 403);
    body = await readJson(request);
    if (body === null) return apiError("Send a JSON object of at most 16 KB.", 415);
  } else if (request.method !== "GET") {
    return apiError("method not allowed", 405);
  }
  const open = await signedOut(request, env, path, body);
  if (open) return open;

  const session = await loadSession(env.DB, request);
  if (!session) return apiError("Sign in first.", 401);
  if (request.method === "GET") return reads(env, path, session);
  if (!constantTimeEqual(request.headers.get("X-CSRF-Token") || "", session.csrf)) {
    return apiError("This page is out of date. Reload it and try again.", 403);
  }
  return writes(request, env, path, session, body);
}
