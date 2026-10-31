/* S.C.O.U.T. Console — a Cloudflare Worker + D1 (ADR-0012; Phase A, SCO-198; COR front end,
 * SCO-238).
 *
 * It serves three things:
 *   /api/device/*  the shore station's API (bearer device token)           device.js
 *   /api/v1/*      the REST API for scripts (bearer personal API token)    rest.js
 *   /api/*         the JSON API the front end calls (session + CSRF)         api.js
 *   /auth/*        GitHub and Google sign-in redirects                       oauth.js
 *   everything else: the static front end (console/web, a Next.js export) from the ASSETS
 *   binding, each HTML page given a fresh script nonce and a strict CSP.
 *
 * The public dashboard stays a static GitHub Pages site and never talks to this Worker.
 *
 * Config (wrangler.toml [vars]; secrets set with `wrangler secret put`, never committed):
 *   APP_URL, BOOTSTRAP_ADMIN_EMAIL, GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID      vars
 *   GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_SECRET                             secrets
 *   DB (D1), ASSETS (static assets)                                         bindings */

import { handleApi } from "./api.js";
import { FLASH_COOKIE, staticAsset } from "./assets.js";
import { b64url, fromB64url } from "./crypto.js";
import { handleDeviceApi } from "./device.js";
import {
  apiError, bodyWithin, clearCookie, json, OAUTH_COOKIE, readCookie, redirect, SESSION_COOKIE, setCookie,
} from "./http.js";
import { configured, finish, startUrl } from "./oauth.js";
import { handleRest } from "./rest.js";
import { createSession, SESSION_TTL_MS } from "./sessions.js";
import { userForIdentity } from "./users.js";

const FLASH_TTL_S = 300;
const MAX_BODY_BYTES = 256 * 1024;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Back to the sign-in page with a one-time message: kept in a cookie, never in the URL, since
 * a message can name an email address. */
function backToLogin(message) {
  return redirect("/login/", {}, [
    setCookie(FLASH_COOKIE, b64url(encoder.encode(message.slice(0, 300))), FLASH_TTL_S),
    clearCookie(OAUTH_COOKIE),
  ]);
}

async function oauthRoute(request, env, key, callback) {
  if (!configured(key, env)) return backToLogin("That sign-in option is not set up.");
  if (!callback) {
    const invite = new URL(request.url).searchParams.get("invite") || "";
    const { url, cookie } = startUrl(key, env, /^[\w-]{1,64}$/.test(invite) ? invite : "");
    return redirect(url, {}, [cookie]);
  }
  const done = await finish(key, request, env);
  if (done.error) return backToLogin(done.error);
  const result = await userForIdentity(env.DB, done.identity, done.inviteToken, env);
  if (result.error) return backToLogin(result.error);
  if (result.user.disabled) return backToLogin("This account is disabled.");
  const { token } = await createSession(env.DB, result.user.id);
  return redirect("/fleet/", {}, [setCookie(SESSION_COOKIE, token, SESSION_TTL_MS / 1000), clearCookie(OAUTH_COOKIE)]);
}

function flash(request) {
  const raw = readCookie(request, FLASH_COOKIE);
  let message = null;
  try {
    message = raw ? decoder.decode(fromB64url(raw)) : null;
  } catch {
    message = null;
  }
  const response = json({ message });
  response.headers.append("Set-Cookie", clearCookie(FLASH_COOKIE));
  return response;
}

async function route(request, env) {
  const path = new URL(request.url).pathname;
  if (path === "/healthz") return new Response("ok");
  if (path.startsWith("/api/device/")) return handleDeviceApi(request, env, path);
  if (path.startsWith("/api/v1/")) {
    if (!bodyWithin(request, 16 * 1024)) return apiError("The request was too large, or sent without a length.", 413);
    return handleRest(request, env, path);
  }
  if (path.startsWith("/api/")) {
    if (!bodyWithin(request, path === "/api/flash" ? 0 : MAX_BODY_BYTES)) {
      return apiError("The request was too large, or sent without a length.", 413);
    }
    return path === "/api/flash" ? flash(request) : handleApi(request, env, path);
  }
  const oauth = /^\/auth\/(github|google)(\/callback)?\/?$/.exec(path);
  if (oauth) return oauthRoute(request, env, oauth[1], Boolean(oauth[2]));
  return staticAsset(request, env);
}

export default {
  async fetch(request, env) {
    if (!env.APP_URL || !env.DB) return new Response("Console is not configured (APP_URL, DB).", { status: 500 });
    try {
      return await route(request, env);
    } catch (error) {
      console.error("console: unhandled", error instanceof Error ? error.stack : error);
      return apiError("Something failed on our side. It has been logged.", 500);
    }
  },
};
