-- Phase C (SCO-241): dashboards. A view is a named list of bays on the 12-column grid
-- (worker/dashboards.js validates it). owner_id NULL means shared with the whole team; otherwise
-- it is that person's own view. The built-in default view is not stored.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE dashboards (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  bays_json  TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX dashboards_owner ON dashboards(owner_id);
