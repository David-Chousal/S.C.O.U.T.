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
 *   DB (D1), ASSETS (static assets), FILES (R2, guarded by storage.js)     bindings
 *
 * Two cron triggers (wrangler.toml): daily at 10:30 UTC, the nightly backup to R2 (backup.js) and
 * Fred's morning brief (assistant/brief.js); hourly, the email-alert checks (alerts/evaluate.js,
 * ADR-0015) and nothing else. */

import { alertsHourly, HOURLY_CRON } from "./alerts/evaluate.js";
import { handleApi } from "./api.js";
import { runBrief } from "./assistant/brief.js";
import { runBackup } from "./backup.js";
import { FLASH_COOKIE, staticAsset } from "./assets.js";
import { b64url, fromB64url } from "./crypto.js";
import { handleDeviceApi } from "./device.js";
import { FIRMWARE_UPLOAD, MAX_BUNDLE_BYTES } from "./firmware.js";
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

/** The console lives at APP_URL. A browser that reaches it on another host the Worker answers on,
 * such as the old workers.dev address, is sent there; shore stations flashed with the old URL keep
 * using the device API on it until they are re-flashed. */
function otherHostRedirect(request, appUrl) {
  const url = new URL(request.url);
  const home = new URL(appUrl);
  if (url.host === home.host) return null;
  return Response.redirect(new URL(url.pathname + url.search, home).toString(), 301);
}

async function route(request, env, ctx) {
  const path = new URL(request.url).pathname;
  if (path === "/healthz") return new Response("ok");
  if (path.startsWith("/api/device/")) return handleDeviceApi(request, env, path, ctx);
  if (path.startsWith("/api/v1/")) {
    // A signed firmware bundle is the one large body the REST API takes (SCO-312).
    const limit = FIRMWARE_UPLOAD.test(path) ? MAX_BUNDLE_BYTES : 16 * 1024;
    if (!bodyWithin(request, limit)) return apiError("The request was too large, or sent without a length.", 413);
    return handleRest(request, env, path);
  }
  const elsewhere = otherHostRedirect(request, env.APP_URL);
  if (elsewhere) return elsewhere;
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
  async fetch(request, env, ctx) {
    if (!env.APP_URL || !env.DB) return new Response("Console is not configured (APP_URL, DB).", { status: 500 });
    try {
      return await route(request, env, ctx);
    } catch (error) {
      console.error("console: unhandled", error instanceof Error ? error.stack : error);
      return apiError("Something failed on our side. It has been logged.", 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil?.(Promise.resolve());
    // The hourly trigger only checks alerts; the daily jobs keep their own 10:30 UTC trigger.
    const jobs = event.cron === HOURLY_CRON
      ? [alertsHourly(env, event.scheduledTime)]
      : [runBackup(env, event.scheduledTime), runBrief(env, event.scheduledTime)];
    // Each job runs even if the other fails; a failure still fails the cron run so it shows.
    const results = await Promise.allSettled(jobs);
    const failed = results.filter((r) => r.status === "rejected");
    for (const f of failed) console.error("console: scheduled job failed", f.reason instanceof Error ? f.reason.stack : f.reason);
    if (failed.length) throw failed[0].reason;
  },
};
