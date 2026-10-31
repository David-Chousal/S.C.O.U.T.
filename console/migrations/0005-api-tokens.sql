-- Phase B (SCO-240): personal API tokens for the REST API under /api/v1. A token is shown once
-- and stored as its SHA-256; it carries scopes (space-separated: read:telemetry, write:settings),
-- always expires, and acts with its owner's current role, so disabling or demoting the owner
-- limits every token they made.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE api_tokens (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,
  scopes       TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  last_used_at INTEGER,
  revoked_at   INTEGER
);
CREATE INDEX api_tokens_user ON api_tokens(user_id);
