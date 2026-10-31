/* Guarded access to the R2 bucket (binding FILES, bucket scout-console-files).
 *
 * Cloudflare has no hard spending cap for R2, so these are the guardrails against a bill:
 *   - every write and read goes through here and is counted in D1 first; past a monthly ceiling
 *     (10% of the free tier's operations) the call is refused and R2 is never reached
 *   - stored bytes are capped at 20% of the free tier's 10 GB, summed from our own ledger
 *   - one object is at most 25 MB
 *   - writes go only under prefixes the bucket's lifecycle rules delete (backups/ after 35 days,
 *     reports/ after 2), so nothing piles up even if this code stops running
 *   - the bucket's storage class is Standard; Infrequent Access has no free tier and is never used
 * Deletes are free in R2 and are not counted. */

const DAY_MS = 24 * 3600 * 1000;

export const BUDGET = Object.freeze({
  writesPerMonth: 100_000,      // free tier: 1,000,000 Class A
  readsPerMonth: 1_000_000,     // free tier: 10,000,000 Class B
  storedBytes: 2_000_000_000,   // free tier: 10 GB-month
  maxObjectBytes: 25_000_000,
});

/** Prefix → days until the bucket's lifecycle rule deletes it (must match the rules set with
 * `wrangler r2 bucket lifecycle`; see console/README.md). */
export const PREFIX_DAYS = Object.freeze({ "backups/": 35, "reports/": 2 });

const month = (now) => new Date(now).toISOString().slice(0, 7);

/** Count one call of `kind` ("writes" | "reads") and say whether it is still within budget. */
async function spend(db, kind, now) {
  const m = month(now);
  await db.prepare(`INSERT INTO storage_usage (month, ${kind}) VALUES (?, 1) ` +
    `ON CONFLICT(month) DO UPDATE SET ${kind} = ${kind} + 1`).bind(m).run();
  const row = await db.prepare(`SELECT ${kind} AS n FROM storage_usage WHERE month = ?`).bind(m).first();
  const ceiling = kind === "writes" ? BUDGET.writesPerMonth : BUDGET.readsPerMonth;
  return row.n <= ceiling;
}

export async function usage(db, now = Date.now()) {
  const counts = await db.prepare("SELECT writes, reads FROM storage_usage WHERE month = ?").bind(month(now)).first();
  const stored = await db.prepare("SELECT COALESCE(SUM(bytes), 0) AS bytes, COUNT(*) AS objects FROM storage_objects " +
    "WHERE expires_at > ?").bind(now).first();
  return { month: month(now), writes: counts?.writes ?? 0, reads: counts?.reads ?? 0, storedBytes: stored.bytes, objects: stored.objects };
}

/** @returns {Promise<{ key?: string, error?: string }>} */
export async function guardedPut(env, key, body, now = Date.now()) {
  if (!env.FILES) return { error: "File storage is not set up (no R2 binding)." };
  const prefix = Object.keys(PREFIX_DAYS).find((p) => key.startsWith(p));
  if (!prefix || key.length > 200) return { error: `Files go only under ${Object.keys(PREFIX_DAYS).join(" or ")} (prefix).` };
  const bytes = body.byteLength;
  if (bytes > BUDGET.maxObjectBytes) return { error: `That file is too large (over ${BUDGET.maxObjectBytes / 1e6} MB).` };
  const { storedBytes } = await usage(env.DB, now);
  if (storedBytes + bytes > BUDGET.storedBytes) return { error: "File storage is full for now; old files are deleted daily." };
  if (!(await spend(env.DB, "writes", now))) return { error: "This month's file-write budget is used up." };
  await env.FILES.put(key, body);
  await env.DB.prepare("INSERT INTO storage_objects (key, bytes, expires_at) VALUES (?, ?, ?) " +
    "ON CONFLICT(key) DO UPDATE SET bytes = excluded.bytes, expires_at = excluded.expires_at")
    .bind(key, bytes, now + PREFIX_DAYS[prefix] * DAY_MS).run();
  return { key };
}

/** @returns {Promise<{ object?: object, error?: string }>} */
export async function guardedGet(env, key, now = Date.now()) {
  if (!env.FILES) return { error: "File storage is not set up (no R2 binding)." };
  if (!(await spend(env.DB, "reads", now))) return { error: "This month's file-read budget is used up." };
  const object = await env.FILES.get(key);
  return object ? { object } : { error: "No such file (it may have expired)." };
}
