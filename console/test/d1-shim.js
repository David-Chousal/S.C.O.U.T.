/* A D1Database stand-in over Node's built-in SQLite (node:sqlite), so the console's real
 * migration and queries run under `node --test` with no npm dependencies. Implements only the
 * D1 surface the console uses: prepare().bind().first()/all()/run(), and batch(). */

import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

class Statement {
  constructor(db, sql, params = []) {
    this.db = db;
    this.sql = sql;
    this.params = params;
  }

  bind(...params) {
    return new Statement(this.db, this.sql, params);
  }

  async first() {
    return this.db.prepare(this.sql).get(...this.params) ?? null;
  }

  async all() {
    return { results: this.db.prepare(this.sql).all(...this.params), success: true };
  }

  async run() {
    const info = this.db.prepare(this.sql).run(...this.params);
    return { success: true, meta: { changes: Number(info.changes) } };
  }
}

export function makeD1(migrationPath) {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(readFileSync(migrationPath, "utf8"));
  return {
    raw: db,
    prepare: (sql) => new Statement(db, sql),
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        db.exec("COMMIT");
        return out;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
