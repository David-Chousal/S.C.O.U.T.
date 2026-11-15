/* The audit log: every change, who made it, before and after. Everyone signed in can read it. */

/** The audit insert as a prepared statement, for a caller that must commit it in one batch with
 * the change it describes. @param {D1Database} db */
export function recordStatement(db, { actor, action, target = "", before = null, after = null }) {
  return db
    .prepare(
      "INSERT INTO audit_log (at, actor_id, actor_label, action, target, before_json, after_json) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(Date.now(), actor?.id ?? null, actor?.label ?? actor?.email ?? "system", action, String(target),
      before === null ? null : JSON.stringify(before), after === null ? null : JSON.stringify(after));
}

/** @param {D1Database} db */
export async function record(db, entry) {
  await recordStatement(db, entry).run();
}

export async function recent(db, limit = 200) {
  const { results } = await db
    .prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?")
    .bind(limit)
    .all();
  return results;
}
