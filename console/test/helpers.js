/* Test helpers: a fresh console with an in-memory D1 and stub static assets, and a client that
 * talks to the JSON API the way the front end does (session cookie + X-CSRF-Token). */

import { fileURLToPath } from "node:url";

import worker from "../worker/index.js";
import { hashPassword } from "../worker/crypto.js";
import { makeD1 } from "./d1-shim.js";

export const APP_URL = "https://console.test";
const MIGRATION = fileURLToPath(new URL("../migrations/0001-init.sql", import.meta.url));

/** Stands in for the ASSETS binding: one HTML page with two scripts, and one stylesheet. */
export const ASSET_HTML =
  '<!DOCTYPE html><html><head><script src="/_next/static/a.js" async></script></head>' +
  "<body><script>self.__next_f=[]</script></body></html>";

const stubAssets = {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path.endsWith(".css")) return new Response("body{}", { headers: { "Content-Type": "text/css" } });
    return new Response(ASSET_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  },
};

export function makeEnv(extra = {}) {
  return { APP_URL, DB: makeD1(MIGRATION), ASSETS: stubAssets, BOOTSTRAP_ADMIN_EMAIL: "admin@scout.test", ...extra };
}

export async function addUser(env, email, role, password = "correct horse battery") {
  const id = crypto.randomUUID();
  env.DB.raw
    .prepare("INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, email, "", role, await hashPassword(password), Date.now());
  return { id, email, password };
}

/** A browser on the console: keeps cookies and the session's CSRF token. */
export class Client {
  constructor(env) {
    this.env = env;
    this.cookies = new Map();
    this.csrf = "";
  }

  async raw(path, { method = "GET", body, headers = {} } = {}) {
    const cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    const init = { method, headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}) } };
    if (body !== undefined) {
      init.body = typeof body === "string" ? body : JSON.stringify(body);
      init.headers["Content-Type"] ??= "application/json";
      // A browser always sends the length; Node's Request does not add it.
      init.headers["Content-Length"] ??= String(new TextEncoder().encode(init.body).length);
      init.headers.Origin ??= APP_URL;
    }
    const response = await worker.fetch(new Request(APP_URL + path, init), this.env);
    for (const set of response.headers.getSetCookie()) {
      const [pair, ...attrs] = set.split(";");
      const [name, value] = pair.split("=");
      if (attrs.some((a) => a.trim() === "Max-Age=0")) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return response;
  }

  /** GET a JSON route: { status, body }. */
  async get(path) {
    const response = await this.raw(path);
    return { status: response.status, body: await response.json(), response };
  }

  /** POST JSON with the session's CSRF token, as the front end's api client does. */
  async post(path, body = {}, headers = {}) {
    if (!this.csrf && this.cookies.has("__Host-scout_session")) await this.refreshCsrf();
    const response = await this.raw(path, { method: "POST", body, headers: { "X-CSRF-Token": this.csrf, ...headers } });
    return { status: response.status, body: await response.json().catch(() => ({})), response };
  }

  async refreshCsrf() {
    const { body } = await this.get("/api/session");
    this.csrf = body.csrf || "";
  }

  async signIn(email, password, headers = {}) {
    this.csrf = "";
    return this.post("/api/login", { email, password }, headers);
  }
}

export async function signedIn(env, role, email = `${role}@scout.test`) {
  const user = await addUser(env, email, role);
  const client = new Client(env);
  await client.signIn(user.email, user.password);
  await client.refreshCsrf();
  return { client, user };
}
