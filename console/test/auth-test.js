/* Sign-in, sessions, CSRF, rate limiting, passwords, invites and resets. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { hashPassword, PBKDF2_ITERATIONS, verifyPassword } from "../worker/crypto.js";
import { finish, startUrl } from "../worker/oauth.js";
import { userForIdentity } from "../worker/users.js";
import { addUser, APP_URL, Browser, makeEnv, signedIn } from "./helpers.js";

test("passwords are PBKDF2 at the Workers ceiling and verify only with the right password", async () => {
  const stored = await hashPassword("correct horse battery");
  assert.match(stored, new RegExp(`^pbkdf2-sha256\\$${PBKDF2_ITERATIONS}\\$`));
  assert.equal(await verifyPassword("correct horse battery", stored), true);
  assert.equal(await verifyPassword("correct horse batterx", stored), false);
  assert.equal(await verifyPassword("anything", "md5$abc"), false);
});

test("signed-out pages redirect to the login page", async () => {
  const { response } = await new Browser(makeEnv()).request("/settings");
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("Location"), "/login");
});

test("password sign-in sets a __Host- session cookie and the database stores only its hash", async () => {
  const env = makeEnv();
  const user = await addUser(env, "m@scout.test", "member");
  const browser = new Browser(env);
  const { response } = await browser.signIn(user.email, user.password);
  assert.equal(response.status, 303);
  const cookie = browser.cookies.get("__Host-scout_session");
  assert.ok(cookie && cookie.length >= 40);
  const row = env.DB.raw.prepare("SELECT token_hash FROM sessions").get();
  assert.notEqual(row.token_hash, cookie);
  assert.equal((await browser.request("/settings")).response.status, 200);
});

test("a wrong password and an unknown email get the same answer", async () => {
  const env = makeEnv();
  await addUser(env, "m@scout.test", "member");
  const a = await new Browser(env).signIn("m@scout.test", "wrong password!!");
  const b = await new Browser(env).signIn("nobody@scout.test", "wrong password!!");
  assert.equal(a.response.status, 401);
  assert.match(a.text, /Wrong email or password/);
  assert.match(b.text, /Wrong email or password/);
});

test("five failures lock the email for fifteen minutes, even with the right password", async () => {
  const env = makeEnv();
  const user = await addUser(env, "m@scout.test", "member");
  for (let i = 0; i < 5; i++) await new Browser(env).signIn(user.email, "wrong password!!");
  const { text } = await new Browser(env).signIn(user.email, user.password);
  assert.match(text, /Too many attempts/);
});

test("a POST without the session's CSRF token, or from another origin, is refused", async () => {
  const env = makeEnv();
  const { browser } = await signedIn(env, "admin");
  const noToken = await browser.request("/settings/buoys", { method: "POST", form: { buoy_id: "1" } });
  assert.equal(noToken.response.status, 403);
  const csrf = await browser.csrf();
  const crossSite = await browser.request("/settings/buoys", {
    method: "POST", form: { csrf, buoy_id: "1" }, headers: { Origin: "https://evil.example" } });
  assert.equal(crossSite.response.status, 403);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM buoys").get().n, 0);
});

test("sign out ends the session", async () => {
  const env = makeEnv();
  const { browser } = await signedIn(env, "member");
  await browser.post("/logout", {});
  assert.equal((await browser.request("/settings")).response.status, 303);
});

test("an invite link creates the account once, with the invited role", async () => {
  const env = makeEnv();
  const { browser } = await signedIn(env, "admin");
  const { text } = await browser.post("/team/invites", { email: "new@scout.test", role: "guest" });
  const link = /https:\/\/console\.test\/invite\/([\w-]+)/.exec(text);
  assert.ok(link, "the invite link is shown once");
  const guest = new Browser(env);
  const accepted = await guest.request(`/invite/${link[1]}`, {
    method: "POST", form: { name: "New", password: "a long enough password" } });
  assert.equal(accepted.response.status, 303);
  assert.equal(env.DB.raw.prepare("SELECT role FROM users WHERE email = 'new@scout.test'").get().role, "guest");
  const again = await new Browser(env).request(`/invite/${link[1]}`);
  assert.equal(again.response.status, 410);
});

test("a short password is refused on an invite", async () => {
  const env = makeEnv();
  const { browser } = await signedIn(env, "admin");
  const { text } = await browser.post("/team/invites", { email: "new@scout.test", role: "member" });
  const token = /\/invite\/([\w-]+)/.exec(text)[1];
  const { text: page } = await new Browser(env).request(`/invite/${token}`, {
    method: "POST", form: { password: "short" } });
  assert.match(page, /at least 12 characters/);
});

test("a reset link sets a new password and signs out every session", async () => {
  const env = makeEnv();
  const { browser: admin } = await signedIn(env, "admin");
  const { browser: member, user } = await signedIn(env, "member");
  const { text } = await admin.post(`/team/users/${user.id}/reset`, {});
  const token = /\/reset\/([\w-]+)/.exec(text)[1];
  await new Browser(env).request(`/reset/${token}`, { method: "POST", form: { password: "a brand new password" } });
  assert.equal((await member.request("/settings")).response.status, 303);
  assert.equal((await new Browser(env).signIn(user.email, "a brand new password")).response.status, 303);
});

test("OAuth: the state must match the cookie, and only a verified email is used", async () => {
  const env = makeEnv({ GITHUB_CLIENT_ID: "id", GITHUB_CLIENT_SECRET: "secret" });
  const { url, cookie } = startUrl("github", env);
  const state = new URL(url).searchParams.get("state");
  const cookieValue = cookie.split(";")[0];
  const fakeFetch = async (target) => new Response(JSON.stringify(
    target.includes("access_token") ? { access_token: "t" }
      : target.endsWith("/user") ? { id: 42, login: "octo" }
        : [{ email: "unverified@x.test", primary: true, verified: false }]));
  const forged = new Request(`${APP_URL}/auth/github/callback?code=c&state=other`, { headers: { Cookie: cookieValue } });
  assert.match((await finish("github", forged, env, fakeFetch)).error, /expired/);
  const good = new Request(`${APP_URL}/auth/github/callback?code=c&state=${state}`, { headers: { Cookie: cookieValue } });
  assert.match((await finish("github", good, env, fakeFetch)).error, /no verified email/);
});

test("OAuth: only the bootstrap email gets in on an empty console, and nobody else without an invite", async () => {
  const env = makeEnv();
  const stranger = await userForIdentity(env.DB, { provider: "google", subject: "1", email: "x@y.test", name: "" }, "", env);
  assert.match(stranger.error, /Ask an admin for an invite/);
  const admin = await userForIdentity(env.DB, { provider: "google", subject: "2", email: "Admin@scout.test", name: "" }, "", env);
  assert.equal(admin.user.role, "admin");
  const late = await userForIdentity(env.DB, { provider: "github", subject: "3", email: "admin2@scout.test", name: "" }, "",
    { ...env, BOOTSTRAP_ADMIN_EMAIL: "admin2@scout.test" });
  assert.ok(late.error, "the bootstrap only applies while there are no users");
});

test("OAuth with an invite requires the invited email", async () => {
  const env = makeEnv();
  const { browser } = await signedIn(env, "admin");
  const { text } = await browser.post("/team/invites", { email: "new@scout.test", role: "member" });
  const token = /\/invite\/([\w-]+)/.exec(text)[1];
  const wrong = await userForIdentity(env.DB, { provider: "github", subject: "9", email: "other@scout.test", name: "" }, token, env);
  assert.match(wrong.error, /This invite is for new@scout.test/);
  const right = await userForIdentity(env.DB, { provider: "github", subject: "9", email: "NEW@scout.test", name: "" }, token, env);
  assert.equal(right.user.role, "member");
});

test("every HTML response carries a strict CSP with no scripts", async () => {
  const { response } = await new Browser(makeEnv()).request("/login");
  const csp = response.headers.get("Content-Security-Policy");
  assert.match(csp, /default-src 'none'/);
  assert.doesNotMatch(csp, /script-src/);
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
});
