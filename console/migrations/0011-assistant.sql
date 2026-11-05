-- Fred, the console's assistant (docs/decisions/0013-console-assistant-fred.md, SCO-299).
-- No question or reply is ever stored. assistant_actions holds a change Fred proposed until the
-- person confirms or declines it, or it is 10 minutes old; assistant_usage holds counts only, per
-- person per UTC day, for the daily caps and the Storage page.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE assistant_actions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  params_json TEXT NOT NULL,
  summary     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);

CREATE INDEX assistant_actions_expiry ON assistant_actions (expires_at);

CREATE TABLE assistant_usage (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,                 -- UTC date, YYYY-MM-DD
  questions   INTEGER NOT NULL DEFAULT 0,
  model_calls INTEGER NOT NULL DEFAULT 0,
  tokens_in   INTEGER NOT NULL DEFAULT 0,
  tokens_out  INTEGER NOT NULL DEFAULT 0,
  fallbacks   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
