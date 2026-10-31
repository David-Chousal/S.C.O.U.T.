/* "Sign in as guest": a name and an email give a view-only account, with other people's emails
 * masked. Anyone who types that email can use it, so it can never be promoted, and an invite or
 * a verified OAuth sign-in for the same email takes it over. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { maskEmail } from "../worker/guests.js";
import { userForIdentity } from "../worker/users.js";
import { addUser, Client, makeEnv, signedIn } from "./helpers.js";

const inviteToken = (link) => new URL(link).searchParams.get("token");

async function guest(env, name = "Visitor", email = "visitor@example.org") {
  const client = new Client(env);
  const reply = await client.post("/api/guest", { name, email });
  return { client, reply };
}

test("a name and an email sign in as a view-only guest", async () => {
  const env = makeEnv();
  const { client, reply } = await guest(env);
  assert.equal(reply.status, 200);
  const { body } = await client.get("/api/session");
  assert.equal(body.user.role, "guest");
  assert.equal(body.user.selfSignup, true);
  assert.equal(body.user.name, "Visitor");
  const write = await client.post("/api/fleet/buoys/1/tx-count", { tx_count: 2 });
  assert.equal(write.status, 403);
});

test("a missing name or a bad email is refused", async () => {
  const env = makeEnv();
  assert.equal((await guest(env, "", "visitor@example.org")).reply.status, 400);
  assert.equal((await guest(env, "Visitor", "not-an-email")).reply.status, 400);
});

test("the same email signs back in to the same guest account", async () => {
  const env = makeEnv();
  await guest(env);
  await guest(env, "Visitor again");
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM users").get().n, 1);
});

test("a team member's email cannot be used to get in as a guest", async () => {
  const env = makeEnv();
  await addUser(env, "member@scout.test", "member");
  const { client, reply } = await guest(env, "Impostor", "member@scout.test");
  assert.equal(reply.status, 409);
  assert.equal((await client.get("/api/session")).status, 401);
});

test("one address can only start a few guest sessions in 15 minutes", async () => {
  const env = makeEnv();
  const statuses = [];
  for (let i = 0; i < 7; i += 1) statuses.push((await guest(env, "V", `v${i}@example.org`)).reply.status);
  assert.deepEqual(statuses.slice(0, 5), [200, 200, 200, 200, 200]);
  assert.equal(statuses[6], 429);
});

test("a self-signed-up guest sees other people's emails masked, and their own in full", async () => {
  const env = makeEnv();
  await addUser(env, "isabella@scout.test", "member");
  const { client } = await guest(env);
  const { body } = await client.get("/api/team");
  const emails = body.members.map((member) => member.email);
  assert.ok(emails.includes("visitor@example.org"));
  assert.ok(emails.includes("i•••@scout.test"));
  assert.ok(!JSON.stringify(body).includes("isabella@scout.test"));
});

test("an invited guest still sees emails in full", async () => {
  const env = makeEnv();
  await addUser(env, "isabella@scout.test", "member");
  const { client } = await signedIn(env, "guest", "advisor@scu.test");
  const { body } = await client.get("/api/team");
  assert.ok(body.members.some((member) => member.email === "isabella@scout.test"));
});

test("a self-signed-up guest cannot be promoted", async () => {
  const env = makeEnv();
  await guest(env);
  const { client: admin } = await signedIn(env, "admin");
  const id = env.DB.raw.prepare("SELECT id FROM users WHERE email = ?").get("visitor@example.org").id;
  const reply = await admin.post(`/api/team/users/${id}/role`, { role: "member" });
  assert.equal(reply.status, 400);
  assert.match(reply.body.error, /invite/i);
});

test("an invite for a self-signed-up guest's email takes the account over and ends its sessions", async () => {
  const env = makeEnv();
  const { client: squatter } = await guest(env, "Squatter", "john@scout.test");
  const { client: admin } = await signedIn(env, "admin");
  const invite = await admin.post("/api/team/invites", { email: "john@scout.test", role: "member" });
  assert.equal(invite.status, 200);
  const owner = new Client(env);
  const accepted = await owner.post(`/api/invites/${inviteToken(invite.body.link)}/accept`,
    { name: "John Ryan", password: "correct horse battery" });
  assert.equal(accepted.status, 200);
  const user = env.DB.raw.prepare("SELECT role, self_signup, name FROM users WHERE email = ?").get("john@scout.test");
  assert.deepEqual({ ...user }, { role: "member", self_signup: 0, name: "John Ryan" });
  assert.equal((await squatter.get("/api/session")).status, 401);
  assert.equal((await guest(env, "Squatter", "john@scout.test")).reply.status, 409);
});

test("a verified OAuth sign-in for a self-signed-up guest's email claims it", async () => {
  const env = makeEnv();
  const { client: squatter } = await guest(env, "Squatter", "owner@example.org");
  const result = await userForIdentity(env.DB,
    { provider: "github", subject: "42", email: "owner@example.org", name: "Owner" }, null, env);
  assert.equal(result.user.email, "owner@example.org");
  assert.equal(env.DB.raw.prepare("SELECT self_signup FROM users WHERE email = ?").get("owner@example.org").self_signup, 0);
  assert.equal((await squatter.get("/api/session")).status, 401);
});

test("masking keeps the first letter and the domain", () => {
  assert.equal(maskEmail("isabella@scout.test"), "i•••@scout.test");
  assert.equal(maskEmail("device:Shore Pi"), "device:Shore Pi");
});
