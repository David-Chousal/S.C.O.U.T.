/* S.C.O.U.T. Console — a Cloudflare Worker + D1 (ADR-0012, Phase A, SCO-198).
 *
 * The team's signed-in console: fleet settings (the daily transmit count), team and roles,
 * shore-station tokens and an audit log, plus the device API the shore station calls. The public
 * dashboard stays a static GitHub Pages site and never talks to this Worker.
 *
 * Config (wrangler.toml [vars]; secrets set with `wrangler secret put`, never committed):
 *   APP_URL                — this console's origin, for OAuth callbacks and the Origin check
 *   BOOTSTRAP_ADMIN_EMAIL  — the first admin, honoured only while there are no users
 *   GITHUB_CLIENT_ID / GOOGLE_CLIENT_ID          — public OAuth client IDs (optional)
 *   GITHUB_CLIENT_SECRET / GOOGLE_CLIENT_SECRET  — secrets
 *   DB                     — the D1 binding */

import { handleDeviceApi } from "./device.js";
import { constantTimeEqual } from "./crypto.js";
import {
  bodyWithin, clearCookie, clientIp, css, formData, MAX_FORM_BYTES, OAUTH_COOKIE, redirect, sameOrigin,
  SESSION_COOKIE, setCookie,
} from "./http.js";
import { configured, finish, PROVIDERS, startUrl } from "./oauth.js";
import { handleSignedIn } from "./routes.js";
import { createSession, destroySession, loadSession, passwordSignIn, SESSION_TTL_MS } from "./sessions.js";
import { CONSOLE_CSS } from "./style.js";
import { acceptInviteWithPassword, resetPassword, userForIdentity, validInvite, validReset } from "./users.js";
import { errorPage, invitePage, loginPage, resetPage } from "./views.js";

async function signIn(env, user, extraCookies = []) {
  const { token } = await createSession(env.DB, user.id);
  return redirect("/settings", {}, [setCookie(SESSION_COOKIE, token, SESSION_TTL_MS / 1000), ...extraCookies]);
}

function loginError(env, error, status) {
  // Also drops a half-finished OAuth state, so a retry starts clean.
  const response = loginPage(env, { error, status });
  response.headers.append("Set-Cookie", clearCookie(OAUTH_COOKIE));
  return response;
}

async function signedOutRoutes(request, env, path) {
  const method = request.method;
  if (path === "/login" && method === "GET") return loginPage(env);
  if (path === "/login" && method === "POST") {
    if (!sameOrigin(request, env.APP_URL)) return loginPage(env, { error: "Sign in from this page.", status: 403 });
    const form = await formData(request);
    const email = (form.get("email") || "").trim();
    const result = await passwordSignIn(env.DB, email, form.get("password") || "", clientIp(request));
    return result.user ? signIn(env, result.user) : loginPage(env, { error: result.error, email, status: 401 });
  }
  const provider = /^\/auth\/(github|google)(\/callback)?$/.exec(path);
  if (provider && method === "GET") {
    const [, key, callback] = provider;
    if (!configured(key, env)) return errorPage(404, `${PROVIDERS[key].label} sign-in is not set up.`);
    if (!callback) {
      const invite = new URL(request.url).searchParams.get("invite") || "";
      const { url, cookie } = startUrl(key, env, /^[\w-]{1,64}$/.test(invite) ? invite : "");
      return redirect(url, { "Set-Cookie": cookie });
    }
    const done = await finish(key, request, env);
    if (done.error) return loginError(env, done.error, 400);
    const result = await userForIdentity(env.DB, done.identity, done.inviteToken, env);
    if (result.error) return loginError(env, result.error, 403);
    if (result.user.disabled) return loginError(env, "This account is disabled.", 403);
    return signIn(env, result.user, [clearCookie(OAUTH_COOKIE)]);
  }
  const invite = /^\/invite\/([\w-]{1,64})$/.exec(path);
  if (invite) {
    const token = invite[1];
    if (method === "GET") return invitePage(env, await validInvite(env.DB, token), token);
    if (!sameOrigin(request, env.APP_URL)) return errorPage(403, "Open the invite link and submit it from there.");
    const form = await formData(request);
    const result = await acceptInviteWithPassword(env.DB, token, (form.get("name") || "").trim(), form.get("password") || "");
    if (result.error) return invitePage(env, await validInvite(env.DB, token), token, { error: result.error, status: 400 });
    return signIn(env, result.user);
  }
  const reset = /^\/reset\/([\w-]{1,64})$/.exec(path);
  if (reset) {
    const token = reset[1];
    if (method === "GET") return resetPage(await validReset(env.DB, token), token);
    if (!sameOrigin(request, env.APP_URL)) return errorPage(403, "Open the reset link and submit it from there.");
    const form = await formData(request);
    const result = await resetPassword(env.DB, token, form.get("password") || "");
    if (result.error) return resetPage(await validReset(env.DB, token), token, { error: result.error, status: 400 });
    return signIn(env, result.user);
  }
  return null;
}

async function route(request, env) {
  const path = new URL(request.url).pathname;
  if (path === "/console.css") return css(CONSOLE_CSS);
  if (path === "/healthz") return new Response("ok");
  if (path.startsWith("/api/device/")) return handleDeviceApi(request, env, path);
  if (!bodyWithin(request, MAX_FORM_BYTES)) return errorPage(413, "That form was too large, or sent without a length.");

  const signedOut = await signedOutRoutes(request, env, path);
  if (signedOut) return signedOut;

  const session = await loadSession(env.DB, request);
  if (!session) return redirect("/login");
  if (path === "/logout" && request.method === "POST") {
    const form = await formData(request);
    if (!constantTimeEqual(form.get("csrf") || "", session.csrf) || !sameOrigin(request, env.APP_URL)) {
      return errorPage(403, "The form expired. Reload and try again.", session);
    }
    await destroySession(env.DB, session.sessionHash);
    return redirect("/login", {}, [clearCookie(SESSION_COOKIE)]);
  }
  return handleSignedIn(request, env, path, session);
}

export default {
  async fetch(request, env) {
    if (!env.APP_URL || !env.DB) return new Response("Console is not configured (APP_URL, DB).", { status: 500 });
    try {
      return await route(request, env);
    } catch (error) {
      console.error("console: unhandled", error instanceof Error ? error.stack : error);
      return errorPage(500, "Something failed on our side. It has been logged.");
    }
  },
};
