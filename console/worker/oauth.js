/* GitHub and Google sign-in (OAuth 2.0 authorization code flow).
 *
 * Only a verified email is ever trusted. The state value is bound to the browser with a short
 * __Host- cookie and compared on return, which stops a forged callback. An invite link's token
 * rides in the same cookie so the provider round-trip can finish accepting it. `fetchImpl` is
 * injected so tests never reach the providers. */

import { constantTimeEqual, randomToken } from "./crypto.js";
import { OAUTH_COOKIE, readCookie, setCookie } from "./http.js";

const STATE_TTL_S = 600;

export const PROVIDERS = {
  github: {
    label: "GitHub",
    authorize: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    clientId: (env) => env.GITHUB_CLIENT_ID,
    secret: (env) => env.GITHUB_CLIENT_SECRET,
    identity: githubIdentity,
  },
  google: {
    label: "Google",
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    clientId: (env) => env.GOOGLE_CLIENT_ID,
    secret: (env) => env.GOOGLE_CLIENT_SECRET,
    identity: googleIdentity,
  },
};

export function configured(provider, env) {
  const p = PROVIDERS[provider];
  return Boolean(p && p.clientId(env) && p.secret(env));
}

function callbackUrl(provider, env) {
  return new URL(`/auth/${provider}/callback`, env.APP_URL).toString();
}

/** The redirect to the provider, and the cookie that binds the state to this browser. */
export function startUrl(provider, env, inviteToken = "") {
  const p = PROVIDERS[provider];
  const state = randomToken(24);
  const url = new URL(p.authorize);
  url.search = new URLSearchParams({
    client_id: p.clientId(env), redirect_uri: callbackUrl(provider, env), scope: p.scope,
    state, response_type: "code",
  }).toString();
  const cookie = setCookie(OAUTH_COOKIE, `${provider}.${state}.${inviteToken}`, STATE_TTL_S);
  return { url: url.toString(), cookie };
}

/** Check state, exchange the code, and return the verified identity (or an error). */
export async function finish(provider, request, env, fetchImpl = fetch) {
  const p = PROVIDERS[provider];
  const params = new URL(request.url).searchParams;
  const [cookieProvider, cookieState, inviteToken] = (readCookie(request, OAUTH_COOKIE) || "..").split(".");
  const state = params.get("state") || "";
  if (cookieProvider !== provider || !cookieState || !constantTimeEqual(state, cookieState)) {
    return { error: "The sign-in link expired or was not started here. Try again." };
  }
  const code = params.get("code");
  if (!code) return { error: `${p.label} did not complete the sign-in.` };
  try {
    const tokenResponse = await fetchImpl(p.token, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: p.clientId(env), client_secret: p.secret(env), code,
        redirect_uri: callbackUrl(provider, env), grant_type: "authorization_code",
      }),
    });
    const { access_token: accessToken } = await tokenResponse.json();
    if (!accessToken) return { error: `${p.label} refused the sign-in.` };
    const identity = await p.identity(accessToken, fetchImpl);
    if (!identity.subject) return { error: `${p.label} did not return an account ID. Try again.` };
    if (!identity.email) return { error: `Your ${p.label} account has no verified email.` };
    return { identity: { provider, ...identity }, inviteToken: inviteToken || "" };
  } catch {
    return { error: `Could not reach ${p.label}. Try again in a minute.` };
  }
}

async function githubIdentity(accessToken, fetchImpl) {
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json",
    "User-Agent": "scout-console" };
  const user = await (await fetchImpl("https://api.github.com/user", { headers })).json();
  const emails = await (await fetchImpl("https://api.github.com/user/emails", { headers })).json();
  const primary = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) : null;
  return { subject: user?.id ? String(user.id) : "", email: primary?.email ?? null, name: user?.name || user?.login || "" };
}

async function googleIdentity(accessToken, fetchImpl) {
  const info = await (await fetchImpl("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })).json();
  return { subject: info?.sub ? String(info.sub) : "", email: info?.email_verified ? info.email : null, name: info?.name || "" };
}
