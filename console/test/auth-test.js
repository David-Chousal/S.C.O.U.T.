/* Sign-in, sessions, CSRF, rate limiting, passwords, invites, resets and OAuth, through the
 * JSON API the front end calls. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { hashPassword, PBKDF2_ITERATIONS, verifyPassword } from "../worker/crypto.js";
import { finish, startUrl } from "../worker/oauth.js";
import { userForIdentity } from "../worker/users.js";
import { addUser, APP_URL, Client, makeEnv, signedIn } from "./helpers.js";

const inviteToken = (link) => new URL(link).searchParams.get("token");

test("passwords are PBKDF2 at the chosen cost and verify only with the right password", async () => {
  const stored = await hashPassword("correct horse battery");
  assert.match(stored, new RegExp(`^pbkdf2-sha256\\$${PBKDF2_ITERATIONS}\\$`));
  assert.equal(await verifyPassword("correct horse battery", stored), true);
  assert.equal(await verifyPassword("correct horse batterx", stored), false);
  assert.equal(await verifyPassword("anything", "md5$abc"), false);
});

test("without a session the API answers 401", async () => {
  const { status } = await new Client(makeEnv()).get("/api/fleet");
  assert.equal(status, 401);
});

test("sign-in sets a __Host- session cookie and the database stores only its hash", async () => {
  const env = makeEnv();
  const user = await addUser(env, "m@scout.test", "member");
  const client = new Client(env);
  assert.equal((await client.signIn(user.email, user.password)).status, 200);
  const cookie = client.cookies.get("__Host-scout_session");
  assert.ok(cookie && cookie.length >= 40);
  assert.notEqual(env.DB.raw.prepare("SELECT token_hash FROM sessions").get().token_hash, cookie);
  const { status, body } = await client.get("/api/session");
  assert.equal(status, 200);
  assert.equal(body.user.email, user.email);
  assert.ok(body.csrf);
});

test("a wrong password and an unknown email get the same answer", async () => {
  const env = makeEnv();
  await addUser(env, "m@scout.test", "member");
  const a = await new Client(env).signIn("m@scout.test", "wrong password!!");
  const b = await new Client(env).signIn("nobody@scout.test", "wrong password!!");
  assert.equal(a.status, 401);
  assert.equal(a.body.error, "Wrong email or password.");
  assert.equal(b.body.error, "Wrong email or password.");
});

test("five failures from one address lock that email out there, even with the right password", async () => {
  const env = makeEnv();
  const user = await addUser(env, "m@scout.test", "member");
  for (let i = 0; i < 5; i++) await new Client(env).signIn(user.email, "wrong password!!");
  assert.match((await new Client(env).signIn(user.email, user.password)).body.error, /Too many attempts/);
});

test("a write without the session's CSRF token, or from another origin, is refused", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "admin");
  const noToken = await client.raw("/api/fleet/buoys", { method: "POST", body: { buoy_id: 1 } });
  assert.equal(noToken.status, 403);
  const crossSite = await client.post("/api/fleet/buoys", { buoy_id: 1 }, { Origin: "https://evil.example" });
  assert.equal(crossSite.status, 403);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM buoys").get().n, 0);
});

test("a write that is not JSON is refused, so a cross-site HTML form cannot make one", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "admin");
  const form = await client.raw("/api/fleet/buoys", {
    method: "POST", body: "buoy_id=1",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-CSRF-Token": client.csrf } });
  assert.equal(form.status, 415);
});

test("sign out ends the session", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "member");
  await client.post("/api/logout");
  assert.equal((await client.get("/api/fleet")).status, 401);
});

test("an invite link creates the account once, with the invited role", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "admin");
  const { body } = await client.post("/api/team/invites", { email: "new@scout.test", role: "guest" });
  const token = inviteToken(body.link);
  assert.ok(body.link.startsWith(`${APP_URL}/invite/?token=`));
  assert.deepEqual((await new Client(env).get(`/api/invites/${token}`)).body.invite, { email: "new@scout.test", role: "guest" });
  const accepted = await new Client(env).post(`/api/invites/${token}/accept`, { name: "New", password: "a long enough password" });
  assert.equal(accepted.status, 200);
  assert.ok(accepted.response.headers.getSetCookie().some((c) => c.startsWith("__Host-scout_session=")));
  assert.equal(env.DB.raw.prepare("SELECT role FROM users WHERE email = 'new@scout.test'").get().role, "guest");
  assert.equal((await new Client(env).get(`/api/invites/${token}`)).status, 410);
});

test("a short password is refused on an invite", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env, "admin");
  const token = inviteToken((await client.post("/api/team/invites", { email: "n@scout.test", role: "member" })).body.link);
  const { body } = await new Client(env).post(`/api/invites/${token}/accept`, { password: "short" });
  assert.match(body.error, /at least 12 characters/);
});

test("a reset link sets a new password and signs out every session", async () => {
  const env = makeEnv();
  const { client: admin } = await signedIn(env, "admin");
  const { client: member, user } = await signedIn(env, "member");
  const token = inviteToken((await admin.post(`/api/team/users/${user.id}/reset`)).body.link);
  assert.equal((await new Client(env).post(`/api/resets/${token}`, { password: "a brand new password" })).status, 200);
  assert.equal((await member.get("/api/fleet")).status, 401);
  assert.equal((await new Client(env).signIn(user.email, "a brand new password")).status, 200);
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
  const { client } = await signedIn(env, "admin");
  const token = inviteToken((await client.post("/api/team/invites", { email: "new@scout.test", role: "member" })).body.link);
  const wrong = await userForIdentity(env.DB, { provider: "github", subject: "9", email: "other@scout.test", name: "" }, token, env);
  assert.match(wrong.error, /This invite is for new@scout.test/);
  const right = await userForIdentity(env.DB, { provider: "github", subject: "9", email: "NEW@scout.test", name: "" }, token, env);
  assert.equal(right.user.role, "member");
});

test("a failed OAuth sign-in returns to /login with a one-time message that is not in the URL", async () => {
  const env = makeEnv({ GITHUB_CLIENT_ID: "id", GITHUB_CLIENT_SECRET: "secret" });
  const client = new Client(env);
  const response = await client.raw("/auth/github/callback?code=c&state=forged");
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("Location"), "/login/");
  const first = await client.get("/api/flash");
  assert.match(first.body.message, /expired/);
  assert.equal((await client.get("/api/flash")).body.message, null);
});

test("the sign-in page lists only the providers that are set up", async () => {
  const { body } = await new Client(makeEnv({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s" })).get("/api/providers");
  assert.deepEqual({ github: body.github, google: body.google }, { github: false, google: true });
});
