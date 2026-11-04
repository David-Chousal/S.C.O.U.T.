-- A personal API token may now never expire: expires_at NULL means no expiry. SQLite cannot drop
-- a NOT NULL constraint in place, so the table is rebuilt with the same columns and index.
-- Nothing references api_tokens, so dropping the old table cascades nowhere.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE api_tokens_next (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,
  scopes       TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER,
  last_used_at INTEGER,
  revoked_at   INTEGER
);
INSERT INTO api_tokens_next SELECT id, user_id, name, token_hash, scopes, created_at, expires_at, last_used_at, revoked_at FROM api_tokens;
DROP TABLE api_tokens;
ALTER TABLE api_tokens_next RENAME TO api_tokens;
CREATE INDEX api_tokens_user ON api_tokens(user_id);
