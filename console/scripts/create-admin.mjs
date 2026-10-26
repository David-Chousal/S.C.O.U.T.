#!/usr/bin/env node
// Create the console's first admin with a password, on the live database (or --local).
//
//   cd console && node scripts/create-admin.mjs            # live (remote) D1
//   cd console && node scripts/create-admin.mjs --local    # wrangler dev's local D1
//
// It asks for the email, a name and the password (typed hidden), hashes the password here with
// the console's own PBKDF2 (worker/crypto.js), and sends only the hash to D1. The password never
// leaves this machine and is never stored in plain text. It refuses when an admin already
// exists: after the first one, people join through invites from the Team page.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

import { hashPassword, passwordProblem } from "../worker/crypto.js";

const DATABASE = "scout-console";
const where = process.argv.includes("--local") ? "--local" : "--remote";
const EMAIL = /^[^\s@'"]{1,64}@[^\s@'"]{1,190}\.[^\s@'"]{2,63}$/;

// One reader for the whole session, read as a stream of lines: its iterator buffers every line
// until it is asked for, so nothing typed or piped ahead of a prompt is lost. While a password
// is typed, nothing is echoed.
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
const lines = rl[Symbol.asyncIterator]();
let muted = false;
rl._writeToOutput = (text) => { if (!muted) process.stdout.write(text); };

async function ask(question, { hidden = false } = {}) {
  process.stdout.write(question);
  muted = hidden;
  const { value, done } = await lines.next();
  muted = false;
  if (hidden || !process.stdin.isTTY) process.stdout.write("\n");
  if (done) throw new Error("Input ended before every answer was given; nothing was created.");
  return value;
}

function d1(args) {
  return execFileSync("npx", ["wrangler", "d1", "execute", DATABASE, where, ...args], {
    encoding: "utf8", stdio: ["ignore", "pipe", "inherit"],
  });
}

function adminCount() {
  try {
    const out = JSON.parse(d1(["--json", "--command", "SELECT COUNT(*) AS n FROM users WHERE role = 'admin'"]));
    return out[0].results[0].n;
  } catch {
    throw new Error(`Could not read the ${where.slice(2)} database. Apply the schema first: ` +
      `npx wrangler d1 migrations apply ${DATABASE} ${where}`);
  }
}

const sql = (text) => `'${String(text).replaceAll("'", "''")}'`;

async function main() {
  if (adminCount() > 0) {
    throw new Error("An admin already exists. Sign in and invite people from the Team page instead.");
  }
  const email = (await ask("Admin email: ")).trim().toLowerCase();
  if (!EMAIL.test(email)) throw new Error("That does not look like an email address.");
  const name = (await ask("Your name: ")).trim().slice(0, 120);
  const password = await ask("Password (12+ characters, hidden): ", { hidden: true });
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
  if ((await ask("Repeat the password: ", { hidden: true })) !== password) throw new Error("The passwords differ.");

  const statement = "INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (" +
    [sql(crypto.randomUUID()), sql(email), sql(name), "'admin'", sql(await hashPassword(password)), Date.now()].join(", ") + ");";
  // Through a file, not the command line, so the hash never sits in the shell's process list.
  const dir = mkdtempSync(join(tmpdir(), "scout-admin-"));
  try {
    writeFileSync(join(dir, "admin.sql"), statement, { mode: 0o600 });
    d1(["--file", join(dir, "admin.sql")]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(`Created admin ${email} on the ${where.slice(2)} database. Sign in at /login/.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
