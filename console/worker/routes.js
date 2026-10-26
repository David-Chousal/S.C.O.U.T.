/* Signed-in routes. Every POST checks the session's CSRF token and the Origin header, then the
 * role (roles.js), before it changes anything. */

import { recent } from "./audit.js";
import { constantTimeEqual } from "./crypto.js";
import { createDevice, listDevices, revokeDevice } from "./device.js";
import { addBuoy, listBuoys, requestTxCount } from "./fleet.js";
import { formData, redirect, sameOrigin } from "./http.js";
import { accountPage, auditPage, devicesPage, oneTimeSecret, settingsPage, teamPage } from "./pages.js";
import { can } from "./roles.js";
import { destroyUserSessions } from "./sessions.js";
import { createInvite, createResetLink, listUsers, openInvites, revokeInvite, setDisabled, setRole } from "./users.js";
import { errorPage, message } from "./views.js";

function actorOf(session) {
  return { id: session.user.id, email: session.user.email, label: session.user.email };
}

const SAVED = { ok: "Saved." };

async function getPage(env, path, session, saved) {
  const notice = saved ? SAVED : {};
  switch (path) {
    case "/":
    case "/settings":
      return settingsPage(session, await listBuoys(env.DB), notice);
    case "/team":
      return teamPage(session, await listUsers(env.DB), await openInvites(env.DB), { html: saved ? message(SAVED.ok) : "" });
    case "/devices":
      return devicesPage(session, await listDevices(env.DB), { html: saved ? message(SAVED.ok) : "" });
    case "/audit":
      return auditPage(session, await recent(env.DB));
    case "/account":
      return accountPage(session);
    default:
      return errorPage(404, "No such page.", session);
  }
}

/** POST routes: [pattern, action needed, handler(form, match, actor) → {error?, ...}] */
const POSTS = [
  [/^\/settings\/buoys\/(\d{1,5})\/tx-count$/, "settings.write",
    (db, f, m, a) => requestTxCount(db, a, m[1], f.get("tx_count"))],
  [/^\/settings\/buoys$/, "buoys.add", (db, f, m, a) => addBuoy(db, a, f.get("buoy_id"), (f.get("label") || "").trim())],
  [/^\/team\/invites$/, "invites.write", (db, f, m, a) => createInvite(db, a, (f.get("email") || "").trim(), f.get("role"))],
  [/^\/team\/invites\/([\w-]{1,64})\/revoke$/, "invites.write", (db, f, m, a) => revokeInvite(db, a, m[1])],
  [/^\/team\/users\/([\w-]{1,64})\/role$/, "users.role", (db, f, m, a) => setRole(db, a, m[1], f.get("role"))],
  [/^\/team\/users\/([\w-]{1,64})\/reset$/, "users.reset", (db, f, m, a) => createResetLink(db, a, m[1])],
  [/^\/team\/users\/([\w-]{1,64})\/(disable|enable)$/, "users.disable",
    (db, f, m, a) => setDisabled(db, a, m[1], m[2] === "disable")],
  [/^\/devices$/, "devices.write", (db, f, m, a) => createDevice(db, a, f.get("name"))],
  [/^\/devices\/([\w-]{1,64})\/revoke$/, "devices.write", (db, f, m, a) => revokeDevice(db, a, m[1])],
];

async function afterPost(env, path, session, result) {
  const db = env.DB;
  // Post/redirect/get, so a reload cannot repeat the change. A one-time secret or an error has
  // to be rendered in this response instead: the secret is not stored anywhere to show later.
  if (!result.error && !result.token) return redirect(`/${path.split("/")[1]}?saved=1`);
  if (path.startsWith("/settings")) {
    return settingsPage(session, await listBuoys(db), result.error ? { error: result.error } : { ok: "Saved." });
  }
  if (path.startsWith("/team")) {
    let shown = "";
    if (result.token && path === "/team/invites") {
      shown = oneTimeSecret("Invite link", new URL(`/invite/${result.token}`, env.APP_URL).toString());
    } else if (result.token) {
      shown = oneTimeSecret(`Password reset link for ${result.email}`, new URL(`/reset/${result.token}`, env.APP_URL).toString());
    }
    return teamPage(session, await listUsers(db), await openInvites(db), { error: result.error, html: shown });
  }
  const shown = result.token ? oneTimeSecret(`Device token for ${result.name}`, result.token) : "";
  return devicesPage(session, await listDevices(db), { error: result.error, html: shown });
}

export async function handleSignedIn(request, env, path, session) {
  if (request.method === "GET") {
    return getPage(env, path, session, new URL(request.url).searchParams.get("saved") === "1");
  }
  if (request.method !== "POST") return errorPage(405, "Method not allowed.", session);
  const form = await formData(request);
  if (!constantTimeEqual(form.get("csrf") || "", session.csrf) || !sameOrigin(request, env.APP_URL)) {
    return errorPage(403, "The form expired or came from another site. Reload and try again.", session);
  }
  if (path === "/account/sign-out-everywhere") {
    await destroyUserSessions(env.DB, session.user.id);
    return redirect("/login");
  }
  for (const [pattern, action, handler] of POSTS) {
    const match = pattern.exec(path);
    if (!match) continue;
    if (!can(session.user, action)) {
      return errorPage(403, "Your role can view this but not change it.", session);
    }
    const result = await handler(env.DB, form, match, actorOf(session));
    return afterPost(env, path, session, result);
  }
  return errorPage(404, "No such action.", session);
}
