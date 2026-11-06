/* Invite and reset emails (SCO-300): sent through a stubbed EMAIL binding, falling back to the
 * copyable link when the binding is missing, refuses, or the daily cap is spent. */

import { test } from "node:test";
import assert from "node:assert/strict";

import { addUser, makeEnv, signedIn as signedInAs } from "./helpers.js";
import { maskEmail } from "../worker/mail.js";

function stubEmail({ fail } = {}) {
  const sent = [];
  return {
    sent,
    async send(message) {
      if (fail) throw Object.assign(new Error(`could not deliver ${message.text}`), { code: fail });
      sent.push(message);
      return { messageId: `m${sent.length}` };
    },
  };
}

const signedIn = (env, email = "admin@scout.test", role = "admin") => signedInAs(env, role, email);

const tokenOf = (link) => new URL(link).searchParams.get("token");

function emailAudit(env) {
  return env.DB.raw.prepare("SELECT * FROM audit_log WHERE action LIKE '%.email' ORDER BY id").all();
}

test("an invite is emailed from console@scoutscu.com with the inviter, role, link and expiry", async () => {
  const EMAIL = stubEmail();
  const env = makeEnv({ EMAIL });
  const { client } = await signedIn(env);
  const { status, body } = await client.post("/api/team/invites", { email: "New.Person@example.com", role: "member" });
  assert.equal(status, 200);
  assert.equal(body.delivery, "sent");
  assert.equal(EMAIL.sent.length, 1);
  const [message] = EMAIL.sent;
  assert.equal(message.to, "new.person@example.com");
  assert.equal(message.from.email, "console@scoutscu.com");
  assert.ok(message.text.includes(body.link));
  assert.ok(message.html.includes(body.link));
  assert.match(message.text, /admin@scout\.test/);
  assert.match(message.text, /as a member/);
  assert.match(message.text, /expires on .+ UTC/);
});

test("the email has no remote images or tracking pixels", async () => {
  const EMAIL = stubEmail();
  const env = makeEnv({ EMAIL });
  const { client } = await signedIn(env);
  await client.post("/api/team/invites", { email: "n@example.com", role: "guest" });
  const { html } = EMAIL.sent[0];
  assert.doesNotMatch(html, /<img|<link|url\(|src=/i);
});

test("a reset link is emailed to the person's own address", async () => {
  const EMAIL = stubEmail();
  const env = makeEnv({ EMAIL });
  const { client } = await signedIn(env);
  const member = await addUser(env, "member@scout.test", "member");
  const { body } = await client.post(`/api/team/users/${member.id}/reset`);
  assert.equal(body.delivery, "sent");
  assert.equal(EMAIL.sent[0].to, "member@scout.test");
  assert.ok(EMAIL.sent[0].text.includes(body.link));
  assert.match(EMAIL.sent[0].subject, /Reset your/);
});

test("with no binding the invite still works and says the email was not sent", async () => {
  const env = makeEnv();
  const { client } = await signedIn(env);
  const { status, body } = await client.post("/api/team/invites", { email: "n@example.com", role: "member" });
  assert.equal(status, 200);
  assert.equal(body.delivery, "not_configured");
  assert.ok(tokenOf(body.link));
  assert.equal(emailAudit(env).length, 0);
});

test("a failed send falls back to the link, logs only the error code, and never the token", async () => {
  const env = makeEnv({ EMAIL: stubEmail({ fail: "E_SENDER_NOT_VERIFIED" }) });
  const { client } = await signedIn(env);
  const logged = [];
  const original = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  try {
    const { status, body } = await client.post("/api/team/invites", { email: "n@example.com", role: "member" });
    assert.equal(status, 200);
    assert.equal(body.delivery, "failed");
    const token = tokenOf(body.link);
    assert.ok(token);
    assert.equal((await client.get("/api/team")).body.invites.length, 1);
    assert.ok(logged.some((line) => line.includes("E_SENDER_NOT_VERIFIED")));
    assert.ok(logged.every((line) => !line.includes(token) && !line.includes("n@example.com")));
  } finally {
    console.error = original;
  }
});

test("each send is audited with the address masked and no token", async () => {
  const env = makeEnv({ EMAIL: stubEmail() });
  const { client } = await signedIn(env);
  const { body } = await client.post("/api/team/invites", { email: "newperson@example.com", role: "member" });
  const rows = emailAudit(env);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].action, "invite.email");
  assert.equal(rows[0].target, "n***@example.com");
  const all = JSON.stringify(env.DB.raw.prepare("SELECT * FROM audit_log").all());
  assert.ok(!all.includes(tokenOf(body.link)));
  assert.deepEqual(JSON.parse(rows[0].after_json), { status: "sent" });
});

test("an admin's daily cap stops the email but not the invite", async () => {
  const EMAIL = stubEmail();
  const env = makeEnv({ EMAIL, EMAIL_DAILY_CAP_ADMIN: "2" });
  const { client } = await signedIn(env);
  const replies = [];
  for (const n of [1, 2, 3]) replies.push((await client.post("/api/team/invites", { email: `p${n}@example.com`, role: "guest" })).body);
  assert.deepEqual(replies.map((r) => r.delivery), ["sent", "sent", "rate_limited"]);
  assert.ok(tokenOf(replies[2].link));
  assert.equal(EMAIL.sent.length, 2);
});

test("the console-wide cap counts every admin's sends", async () => {
  const EMAIL = stubEmail();
  const env = makeEnv({ EMAIL, EMAIL_DAILY_CAP_TOTAL: "1" });
  const first = await signedIn(env, "a1@scout.test");
  const second = await signedIn(env, "a2@scout.test");
  assert.equal((await first.client.post("/api/team/invites", { email: "x@example.com", role: "guest" })).body.delivery, "sent");
  assert.equal((await second.client.post("/api/team/invites", { email: "y@example.com", role: "guest" })).body.delivery, "rate_limited");
});

test("members and guests cannot send invite or reset emails", async () => {
  const EMAIL = stubEmail();
  const env = makeEnv({ EMAIL });
  const target = await addUser(env, "t@scout.test", "member");
  for (const role of ["member", "guest"]) {
    const { client } = await signedIn(env, `${role}@scout.test`, role);
    assert.equal((await client.post("/api/team/invites", { email: "z@example.com", role: "guest" })).status, 403);
    assert.equal((await client.post(`/api/team/users/${target.id}/reset`)).status, 403);
  }
  assert.equal(EMAIL.sent.length, 0);
});

test("maskEmail keeps the first letter and the domain", () => {
  assert.equal(maskEmail("david@scoutscu.com"), "d***@scoutscu.com");
  assert.equal(maskEmail("not-an-email"), "***");
});
