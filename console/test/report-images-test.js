/* Report builder (SCO-317): Image block uploads. PNG or JPEG by their own bytes, at most 1 MB,
 * members and admins upload, anyone signed in views; files go through the guarded R2 module. */

import assert from "node:assert/strict";
import { test } from "node:test";

import worker from "../worker/index.js";
import { MAX_IMAGE_BYTES, sniffImage } from "../worker/report-images.js";
import { APP_URL, makeEnv, signedIn } from "./helpers.js";

function fakeBucket() {
  const objects = new Map();
  return {
    objects,
    async put(key, body) { objects.set(key, new Uint8Array(await new Response(body).arrayBuffer())); return { key }; },
    async get(key) {
      const bytes = objects.get(key);
      return bytes ? { body: new Response(bytes).body, size: bytes.byteLength } : null;
    },
  };
}

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const cookieOf = (client) => [...client.cookies].map(([k, v]) => `${k}=${v}`).join("; ");

/** POST raw bytes the way the browser does: same origin, session cookie and CSRF token. */
function upload(client, bytes, headers = {}) {
  return worker.fetch(new Request(`${APP_URL}/api/report-images`, { method: "POST", body: bytes, headers: {
    "Content-Type": "image/png", "Content-Length": String(bytes.length), Origin: APP_URL, Cookie: cookieOf(client), "X-CSRF-Token": client.csrf, ...headers,
  } }), client.env);
}

test("a member uploads a PNG; anyone signed in, guests too, can view it", async () => {
  const env = makeEnv({ FILES: fakeBucket() });
  const { client: member } = await signedIn(env, "member");
  const made = await upload(member, PNG);
  assert.equal(made.status, 200);
  const { id } = await made.json();
  assert.ok(env.FILES.objects.has(`report-images/${id}`));
  const { client: guest } = await signedIn(env, "guest");
  const seen = await guest.raw(`/api/report-images/${id}`);
  assert.equal(seen.status, 200);
  assert.equal(seen.headers.get("Content-Type"), "image/png");
  assert.deepEqual(new Uint8Array(await seen.arrayBuffer()), PNG);
});

test("guests cannot upload, and signed-out people cannot view", async () => {
  const env = makeEnv({ FILES: fakeBucket() });
  const { client: guest } = await signedIn(env, "guest");
  assert.equal((await upload(guest, PNG)).status, 403);
  const anonymous = await worker.fetch(new Request(`${APP_URL}/api/report-images/abc`), env);
  assert.equal(anonymous.status, 401);
});

test("only real PNG or JPEG bytes up to 1 MB are kept, whatever the browser claims", async () => {
  const env = makeEnv({ FILES: fakeBucket() });
  const { client } = await signedIn(env, "member");
  assert.equal((await upload(client, new TextEncoder().encode("<svg onload=alert(1)>"), { "Content-Type": "image/png" })).status, 400);
  assert.equal((await upload(client, new Uint8Array(MAX_IMAGE_BYTES + 1))).status, 413);
  assert.equal(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(env.FILES.objects.size, 0);
});

test("images past the bucket's 365 days no longer count toward the 50-image limit", async () => {
  const env = makeEnv({ FILES: fakeBucket() });
  const { client, user } = await signedIn(env, "member");
  const old = Date.now() - 366 * 24 * 3600 * 1000;
  const insert = env.DB.raw.prepare("INSERT INTO report_images (id, owner_id, content_type, bytes, created_at) VALUES (?, ?, 'image/png', 12, ?)");
  for (let i = 0; i < 50; i++) insert.run(`old${i}`, user.id, old);
  assert.equal((await upload(client, PNG)).status, 200);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM report_images").get().n, 1);
});

test("an upload from another site, or without the page's CSRF token, is refused", async () => {
  const env = makeEnv({ FILES: fakeBucket() });
  const { client } = await signedIn(env, "member");
  assert.equal((await upload(client, PNG, { Origin: "https://evil.test" })).status, 403);
  assert.equal((await upload(client, PNG, { "X-CSRF-Token": "nope" })).status, 403);
});
