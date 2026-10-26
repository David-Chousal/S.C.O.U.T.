-- S.C.O.U.T. Console, Phase A (ADR-0012, SCO-198). D1 (SQLite).
-- Apply: wrangler d1 migrations apply scout-console --remote
-- Every secret-bearing column holds a hash, never the secret: session cookies, invite and
-- reset links, device tokens and passwords are all shown once and stored hashed.

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL CHECK (role IN ('admin', 'member', 'guest')),
  password_hash TEXT,                       -- pbkdf2-sha256$iterations$salt$hash, or NULL
  github_id     TEXT UNIQUE,
  google_sub    TEXT UNIQUE,
  disabled      INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,              -- SHA-256 of the cookie value
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE invites (
  id          TEXT PRIMARY KEY,
  token_hash  TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL COLLATE NOCASE,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'member', 'guest')),
  invited_by  TEXT NOT NULL REFERENCES users(id),
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  accepted_at INTEGER,
  revoked_at  INTEGER
);

CREATE TABLE password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);

-- Failed sign-ins, for rate limiting (key = lower(email) or the client IP).
CREATE TABLE login_failures (
  key TEXT NOT NULL,
  at  INTEGER NOT NULL
);
CREATE INDEX login_failures_key_at ON login_failures(key, at);

CREATE TABLE audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  at          INTEGER NOT NULL,
  actor_id    TEXT,
  actor_label TEXT NOT NULL,                -- email, or "device:<name>", kept if the user goes
  action      TEXT NOT NULL,
  target      TEXT NOT NULL DEFAULT '',
  before_json TEXT,
  after_json  TEXT
);

-- One row per buoy. tx_count_requested is what the team asked for (NULL = nothing asked, the
-- buoy runs its default 3); tx_count_reported is what the buoy's newest packet says (v4).
CREATE TABLE buoys (
  buoy_id            INTEGER PRIMARY KEY CHECK (buoy_id BETWEEN 1 AND 65535),
  label              TEXT NOT NULL,
  tx_count_requested INTEGER CHECK (tx_count_requested BETWEEN 1 AND 3),
  requested_by       TEXT,
  requested_at       INTEGER,
  tx_count_reported  INTEGER CHECK (tx_count_reported BETWEEN 1 AND 3),
  cmd_rejected       INTEGER NOT NULL DEFAULT 0,
  reported_at        INTEGER,
  last_seen_at       INTEGER
);

-- Shore stations. Their bearer token is shown once and stored hashed.
CREATE TABLE devices (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,
  created_by   TEXT NOT NULL REFERENCES users(id),
  created_at   INTEGER NOT NULL,
  revoked_at   INTEGER,
  last_seen_at INTEGER
);

-- Readings pushed by a shore station, one per (buoy_id, record_seq), as schema rows.
CREATE TABLE readings (
  buoy_id       INTEGER NOT NULL,
  record_seq    INTEGER NOT NULL,
  timestamp_utc TEXT NOT NULL,
  row_json      TEXT NOT NULL,
  received_at   INTEGER NOT NULL,
  PRIMARY KEY (buoy_id, record_seq)
);
