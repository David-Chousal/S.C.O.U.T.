-- Phase D (SCO-241): downloadable CSV reports. The file is in R2 at reports/<id>.csv (deleted by
-- the bucket's lifecycle rule after 2 days); this row says who made it, from what, and holds the
-- SHA-256 of its current download token, which expires after an hour.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE reports (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  params_json     TEXT NOT NULL,          -- { buoys, from, to, columns }
  rows            INTEGER NOT NULL,
  bytes           INTEGER NOT NULL,
  token_hash      TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  link_expires_at INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL        -- when R2 deletes the file
);
CREATE INDEX reports_user_created ON reports(user_id, created_at);
