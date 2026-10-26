/* Test helpers: a fresh console with an in-memory D1, and a cookie-keeping browser. */

import { fileURLToPath } from "node:url";

import worker from "../worker/index.js";
import { hashPassword } from "../worker/crypto.js";
import { makeD1 } from "./d1-shim.js";

export const APP_URL = "https://console.test";
const MIGRATION = fileURLToPath(new URL("../migrations/0001-init.sql", import.meta.url));

export function makeEnv(extra = {}) {
  return { APP_URL, DB: makeD1(MIGRATION), BOOTSTRAP_ADMIN_EMAIL: "admin@scout.test", ...extra };
}

export async function addUser(env, email, role, password = "correct horse battery") {
  const id = crypto.randomUUID();
  env.DB.raw
    .prepare("INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, email, "", role, await hashPassword(password), Date.now());
  return { id, email, password };
}

/** A minimal browser: keeps cookies, sends forms with the page's CSRF token. */
export class Browser {
  constructor(env) {
    this.env = env;
    this.cookies = new Map();
  }

  async request(path, { method = "GET", form = null, headers = {} } = {}) {
    const cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    const init = { method, headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}) } };
    if (form) {
      init.body = new URLSearchParams(form).toString();
      init.headers["Content-Type"] = "application/x-www-form-urlencoded";
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
    return { response, text: await response.text() };
  }

  async csrf(path = "/settings") {
    const { text } = await this.request(path);
    return /name="csrf" value="([^"]+)"/.exec(text)?.[1];
  }

  async post(path, fields, extra = {}) {
    const csrf = await this.csrf();
    return this.request(path, { method: "POST", form: { csrf, ...fields }, ...extra });
  }

  async signIn(email, password) {
    return this.request("/login", { method: "POST", form: { email, password } });
  }
}

export async function signedIn(env, role, email = `${role}@scout.test`) {
  const user = await addUser(env, email, role);
  const browser = new Browser(env);
  await browser.signIn(user.email, user.password);
  return { browser, user };
}
