-- Opt-in email alerts (SCO-301, ADR-0015). Each person's own rules, on Settings → Notifications.
-- Alerts go only to the rule owner's account email, so no address is stored here.
-- Apply: wrangler d1 migrations apply scout-console --remote

-- The master switch. No row = off: nobody is emailed until they turn alerts on.
CREATE TABLE alert_prefs (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled    INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- kind threshold: metric is a reading column, op above|below, value in the metric's unit.
-- kind flag:      metric is a firmware flag name; op and value unused.
-- kind silence:   value is hours without a packet; metric and op unused.
-- buoy_id NULL = any buoy. remind_hours NULL = no reminder while it stays in breach.
CREATE TABLE alert_rules (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buoy_id      INTEGER,
  kind         TEXT NOT NULL CHECK (kind IN ('threshold', 'flag', 'silence')),
  metric       TEXT,
  op           TEXT CHECK (op IN ('above', 'below')),
  value        REAL,
  remind_hours INTEGER,
  enabled      INTEGER NOT NULL DEFAULT 1,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX alert_rules_user ON alert_rules(user_id);

-- Where each rule stands for each buoy it watches (an "any buoy" rule tracks every buoy apart).
CREATE TABLE alert_state (
  rule_id      TEXT NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  buoy_id      INTEGER NOT NULL,
  firing       INTEGER NOT NULL DEFAULT 0,
  since        INTEGER,
  last_sent_at INTEGER,
  last_value   REAL,
  PRIMARY KEY (rule_id, buoy_id)
);

-- Every alert that fired, emailed or not. status: sent | failed | rate_limited | not_configured.
-- reason: the cap that refused it, or the provider's error code. rule_id has no foreign key so
-- the history outlives a deleted rule.
CREATE TABLE alert_history (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_id TEXT,
  buoy_id INTEGER,
  at      INTEGER NOT NULL,
  kind    TEXT NOT NULL CHECK (kind IN ('alert', 'reminder', 'test')),
  summary TEXT NOT NULL,
  status  TEXT NOT NULL,
  reason  TEXT
);
CREATE INDEX alert_history_user_at ON alert_history(user_id, at);

-- The "turn this alert off" links: shown once in an email, stored hashed, single-purpose, expiring.
-- rule_id names the one rule the link turns off; NULL = the List-Unsubscribe link of an email that
-- batched several rules, which turns that person's master switch off.
CREATE TABLE alert_off_links (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_id    TEXT REFERENCES alert_rules(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);
CREATE INDEX alert_off_links_expires ON alert_off_links(expires_at);
