/* The nightly backup (Phase E, SCO-241): a cron trigger dumps the console's data as SQL INSERTs,
 * gzipped, to R2 at backups/YYYY-MM-DD.sql.gz, through the storage guardrails. Restore: apply the
 * migrations to an empty database, then run the dump (console/README.md → Backups).
 * Sessions and failed sign-ins are left out: they are short-lived and a restore should sign
 * everyone out anyway. The storage ledger is left out too; it describes the bucket, not the data. */

import { guardedPut } from "./storage.js";

const SKIP = new Set(["sessions", "login_failures", "storage_usage", "storage_objects", "d1_migrations"]);
// Parents before children, so a restore satisfies every foreign key in one pass.
const ORDER = ["users", "invites", "password_resets", "devices", "buoys", "readings", "audit_log", "api_tokens"];

function literal(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

export async function dumpSql(db, now = Date.now()) {
  const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' " +
    "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all();
  const names = results.map((r) => r.name).filter((name) => !SKIP.has(name));
  const ordered = [...ORDER.filter((n) => names.includes(n)), ...names.filter((n) => !ORDER.includes(n)).sort()];
  const lines = [`-- S.C.O.U.T. console backup, ${new Date(now).toISOString()}. Data only: apply the migrations first.`];
  for (const name of ordered) {
    const rows = (await db.prepare(`SELECT * FROM "${name}"`).all()).results;
    lines.push(`-- ${name}: ${rows.length} rows`);
    for (const row of rows) {
      const columns = Object.keys(row).map((c) => `"${c}"`).join(", ");
      lines.push(`INSERT INTO "${name}" (${columns}) VALUES (${Object.values(row).map(literal).join(", ")});`);
    }
  }
  return `${lines.join("\n")}\n`;
}

async function gzip(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function runBackup(env, now = Date.now()) {
  const key = `backups/${new Date(now).toISOString().slice(0, 10)}.sql.gz`;
  const result = await guardedPut(env, key, await gzip(await dumpSql(env.DB, now)), now);
  if (result.error) console.error(`console: backup ${key} not written: ${result.error}`);
  return result;
}

export async function lastBackup(db) {
  return db.prepare("SELECT key, bytes FROM storage_objects WHERE key LIKE 'backups/%' ORDER BY key DESC LIMIT 1").first();
}
