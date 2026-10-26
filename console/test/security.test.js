/* The gaps the 2026-10-25 security review found, each pinned by a test. */

import assert from "node:assert/strict";
import { test } from "node:test";

import worker from "../worker/index.js";
import { finish, startUrl } from "../worker/oauth.js";
import { addUser, APP_URL, Browser, makeEnv, signedIn } from "./helpers.js";

test("a member gets 403 on every admin action", async () => {
  const env = makeEnv();
  const { user: other } = await signedIn(env, "guest", "g@scout.test");
  const { browser } = await signedIn(env, "member");
  const attempts = [
    ["/settings/buoys", { buoy_id: "5" }],
    ["/team/invites", { email: "x@scout.test", role: "admin" }],
    [`/team/users/${other.id}/role`, { role: "admin" }],
    [`/team/users/${other.id}/reset`, {}],
    [`/team/users/${other.id}/disable`, {}],
    ["/devices", { name: "rogue" }],
  ];
  for (const [path, fields] of attempts) {
    assert.equal((await browser.post(path, fields)).response.status, 403, path);
  }
  assert.equal(env.DB.raw.prepare("SELECT role FROM users WHERE id = ?").get(other.id).role, "guest");
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM devices").get().n, 0);
});

test("a disabled user is signed out everywhere and cannot sign in again", async () => {
  const env = makeEnv();
  const { browser: admin } = await signedIn(env, "admin");
  const { browser: member, user } = await signedIn(env, "member");
  await admin.post(`/team/users/${user.id}/disable`, {});
  assert.equal((await member.request("/settings")).response.status, 303);
  assert.match((await new Browser(env).signIn(user.email, user.password)).text, /Wrong email or password/);
});

test("an admin cannot disable themself", async () => {
  const env = makeEnv();
  const { browser, user } = await signedIn(env, "admin");
  assert.match((await browser.post(`/team/users/${user.id}/disable`, {})).text, /your own account/);
});

test("a reset link works once, and a newer link voids the older one", async () => {
  const env = makeEnv();
  const { browser: admin } = await signedIn(env, "admin");
  const user = await addUser(env, "m@scout.test", "member");
  const first = /\/reset\/([\w-]+)/.exec((await admin.post(`/team/users/${user.id}/reset`, {})).text)[1];
  const second = /\/reset\/([\w-]+)/.exec((await admin.post(`/team/users/${user.id}/reset`, {})).text)[1];
  assert.equal((await new Browser(env).request(`/reset/${first}`)).response.status, 410);
  await new Browser(env).request(`/reset/${second}`, { method: "POST", form: { password: "a brand new password" } });
  const reuse = await new Browser(env).request(`/reset/${second}`, { method: "POST", form: { password: "another new password" } });
  assert.equal(reuse.response.status, 410);
});

test("an expired invite is refused", async () => {
  const env = makeEnv();
  const { browser } = await signedIn(env, "admin");
  const token = /\/invite\/([\w-]+)/.exec((await browser.post("/team/invites", { email: "n@scout.test", role: "member" })).text)[1];
  env.DB.raw.prepare("UPDATE invites SET expires_at = 0").run();
  assert.equal((await new Browser(env).request(`/invite/${token}`)).response.status, 410);
});

test("the session cookie is __Host-, Secure, HttpOnly, SameSite=Lax, Path=/ and has no Domain", async () => {
  const env = makeEnv();
  const user = await addUser(env, "m@scout.test", "member");
  const { response } = await new Browser(env).signIn(user.email, user.password);
  const cookie = response.headers.getSetCookie().find((c) => c.startsWith("__Host-scout_session="));
  for (const attr of ["Secure", "HttpOnly", "SameSite=Lax", "Path=/"]) assert.ok(cookie.includes(attr), attr);
  assert.doesNotMatch(cookie, /Domain=/i);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("failing from one address does not lock the same account out from another", async () => {
  const env = makeEnv();
  const user = await addUser(env, "m@scout.test", "member");
  const from = (ip) => ({ headers: { "CF-Connecting-IP": ip } });
  for (let i = 0; i < 6; i++) {
    await new Browser(env).request("/login", { method: "POST", form: { email: user.email, password: "wrong password!!" }, ...from("203.0.113.9") });
  }
  const attacker = await new Browser(env).request("/login", { method: "POST", form: { email: user.email, password: user.password }, ...from("203.0.113.9") });
  assert.match(attacker.text, /Too many attempts/);
  const owner = await new Browser(env).request("/login", { method: "POST", form: { email: user.email, password: user.password }, ...from("198.51.100.4") });
  assert.equal(owner.response.status, 303);
});

test("sign-out-everywhere ends every session; logout and sign-in refuse a foreign Origin", async () => {
  const env = makeEnv();
  const { browser, user } = await signedIn(env, "member");
  const other = new Browser(env);
  await other.signIn(user.email, user.password);
  const csrf = await browser.csrf();
  const foreign = await browser.request("/logout", { method: "POST", form: { csrf }, headers: { Origin: "https://evil.example" } });
  assert.equal(foreign.response.status, 403);
  const crossLogin = await new Browser(env).request("/login", {
    method: "POST", form: { email: user.email, password: user.password }, headers: { Origin: "https://evil.example" } });
  assert.equal(crossLogin.response.status, 403);
  await browser.post("/account/sign-out-everywhere", {});
  assert.equal((await other.request("/settings")).response.status, 303);
});

test("bodies over the limit, or without a length, are refused before they are read", async () => {
  const env = makeEnv();
  const big = await new Browser(env).request("/login", {
    method: "POST", form: { email: "a@b.test", password: "x".repeat(20_000) } });
  assert.equal(big.response.status, 413);
  const noLength = await worker.fetch(new Request(`${APP_URL}/login`, {
    method: "POST", body: "email=a", headers: { "Content-Type": "application/x-www-form-urlencoded" } }), env);
  assert.equal(noLength.status, 413);
});

test("OAuth: a provider reply with no account ID is refused, never matched as 'undefined'", async () => {
  const env = makeEnv({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });
  const { url, cookie } = startUrl("google", env);
  const state = new URL(url).searchParams.get("state");
  const fakeFetch = async (target) => new Response(JSON.stringify(
    target.includes("/token") ? { access_token: "t" } : { error: "rate_limited", email: "a@b.test", email_verified: true }));
  const request = new Request(`${APP_URL}/auth/google/callback?code=c&state=${state}`, { headers: { Cookie: cookie.split(";")[0] } });
  assert.match((await finish("google", request, env, fakeFetch)).error, /account ID/);
});
