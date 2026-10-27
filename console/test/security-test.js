/* The 2026-10-25 security review's findings, and the static front end's CSP, each pinned by a test. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { addNonce, pageCsp } from "../worker/assets.js";
import worker from "../worker/index.js";
import { finish, startUrl } from "../worker/oauth.js";
import { addUser, APP_URL, Client, makeEnv, signedIn } from "./helpers.js";

const tokenOf = (link) => new URL(link).searchParams.get("token");

test("a member gets 403 on every admin action", async () => {
  const env = makeEnv();
  const { user: other } = await signedIn(env, "guest", "g@scout.test");
  const { client } = await signedIn(env, "member");
  const attempts = [
    ["/api/fleet/buoys", { buoy_id: 5 }],
    ["/api/team/invites", { email: "x@scout.test", role: "admin" }],
    [`/api/team/users/${other.id}/role`, { role: "admin" }],
    [`/api/team/users/${other.id}/reset`, {}],
    [`/api/team/users/${other.id}/disable`, {}],
    ["/api/devices", { name: "rogue" }],
  ];
  for (const [path, body] of attempts) assert.equal((await client.post(path, body)).status, 403, path);
  assert.equal(env.DB.raw.prepare("SELECT role FROM users WHERE id = ?").get(other.id).role, "guest");
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM devices").get().n, 0);
});

test("a disabled user is signed out everywhere and cannot sign in again", async () => {
  const env = makeEnv();
  const { client: admin } = await signedIn(env, "admin");
  const { client: member, user } = await signedIn(env, "member");
  await admin.post(`/api/team/users/${user.id}/disable`);
  assert.equal((await member.get("/api/fleet")).status, 401);
  assert.equal((await new Client(env).signIn(user.email, user.password)).body.error, "Wrong email or password.");
});

test("an admin cannot disable themself", async () => {
  const env = makeEnv();
  const { client, user } = await signedIn(env, "admin");
  assert.match((await client.post(`/api/team/users/${user.id}/disable`)).body.error, /your own account/);
});

test("a reset link works once, and a newer link voids the older one", async () => {
  const env = makeEnv();
  const { client: admin } = await signedIn(env, "admin");
  const user = await addUser(env, "m@scout.test", "member");
  const first = tokenOf((await admin.post(`/api/team/users/${user.id}/reset`)).body.link);
  const second = tokenOf((await admin.post(`/api/team/users/${user.id}/reset`)).body.link);
  assert.equal((await new Client(env).get(`/api/resets/${first}`)).status, 410);
  await new Client(env).post(`/api/resets/${second}`, { password: "a brand new password" });
  assert.equal((await new Client(env).post(`/api/resets/${second}`, { password: "another new password" })).status, 400);
});

test("an expired invite is refused", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "admin");
  const token = tokenOf((await client.post("/api/team/invites", { email: "n@scout.test", role: "member" })).body.link);
  env.DB.raw.prepare("UPDATE invites SET expires_at = 0").run();
  assert.equal((await new Client(env).get(`/api/invites/${token}`)).status, 410);
});

test("the session cookie is __Host-, Secure, HttpOnly, SameSite=Lax, Path=/ and has no Domain", async () => {
  const env = makeEnv();
  const user = await addUser(env, "m@scout.test", "member");
  const { response } = await new Client(env).signIn(user.email, user.password);
  const cookie = response.headers.getSetCookie().find((c) => c.startsWith("__Host-scout_session="));
  for (const attr of ["Secure", "HttpOnly", "SameSite=Lax", "Path=/"]) assert.ok(cookie.includes(attr), attr);
  assert.doesNotMatch(cookie, /Domain=/i);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("failing from one address does not lock the same account out from another", async () => {
  const env = makeEnv();
  const user = await addUser(env, "m@scout.test", "member");
  const from = (ip) => ({ "CF-Connecting-IP": ip });
  for (let i = 0; i < 6; i++) await new Client(env).signIn(user.email, "wrong password!!", from("203.0.113.9"));
  assert.match((await new Client(env).signIn(user.email, user.password, from("203.0.113.9"))).body.error, /Too many attempts/);
  assert.equal((await new Client(env).signIn(user.email, user.password, from("198.51.100.4"))).status, 200);
});

test("sign-out-everywhere ends every session; logout and sign-in refuse a foreign Origin", async () => {
  const env = makeEnv();
  const { client, user } = await signedIn(env, "member");
  const other = new Client(env);
  await other.signIn(user.email, user.password);
  assert.equal((await client.post("/api/logout", {}, { Origin: "https://evil.example" })).status, 403);
  assert.equal((await new Client(env).signIn(user.email, user.password, { Origin: "https://evil.example" })).status, 403);
  await client.post("/api/account/sign-out-everywhere");
  assert.equal((await other.get("/api/fleet")).status, 401);
});

test("bodies over the limit, or without a length, are refused before they are read", async () => {
  const env = makeEnv();
  const big = await new Client(env).signIn("a@b.test", "x".repeat(300_000));
  assert.equal(big.status, 413);
  const noLength = await worker.fetch(new Request(`${APP_URL}/api/login`, {
    method: "POST", body: "{}", headers: { "Content-Type": "application/json" } }), env);
  assert.equal(noLength.status, 413);
  const overJson = await new Client(env).signIn("a@b.test", "x".repeat(20_000));
  assert.equal(overJson.status, 415);
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

test("every page gets a fresh nonce on every script, and a CSP that allows only that nonce", async () => {
  const env = makeEnv();
  const a = await new Client(env).raw("/fleet/");
  const b = await new Client(env).raw("/fleet/");
  const csp = a.headers.get("Content-Security-Policy");
  const nonce = /'nonce-([\w-]+)'/.exec(csp)[1];
  const html = await a.text();
  assert.equal(html.match(/<script nonce="/g).length, 2);
  assert.ok(html.includes(`<script nonce="${nonce}"`));
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  assert.match(csp, /default-src 'none'/);
  assert.notEqual(nonce, /'nonce-([\w-]+)'/.exec(b.headers.get("Content-Security-Policy"))[1]);
  assert.equal(a.headers.get("X-Content-Type-Options"), "nosniff");
});

test("static files other than HTML pass through without a page CSP", async () => {
  const response = await new Client(makeEnv()).raw("/_next/static/app.css");
  assert.equal(response.headers.get("Content-Type"), "text/css");
  assert.equal(response.headers.get("Content-Security-Policy"), null);
});

test("the nonce rewrite touches script tags only", () => {
  assert.equal(addNonce("<script>a</script><scripts><noscript>", "N"), '<script nonce="N">a</script><scripts><noscript>');
  assert.equal(addNonce('<link rel="preload" as="script" href="/a.js"/><link rel="stylesheet" href="/a.css"/>', "N"),
    '<link nonce="N" rel="preload" as="script" href="/a.js"/><link rel="stylesheet" href="/a.css"/>');
  assert.match(pageCsp("N"), /script-src 'nonce-N' 'strict-dynamic'/);
});

test("the Worker entry module exports only its handler, as workerd requires", async () => {
  const entry = await import("../worker/index.js");
  assert.deepEqual(Object.keys(entry), ["default"]);
});
