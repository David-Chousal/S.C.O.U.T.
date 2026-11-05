-- Fred's morning brief (ADR-0013, Phase 3): one note per UTC day, written by the daily cron from
-- fleet data and shown on the Dashboard. It holds no one's question or reply.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE assistant_briefs (
  day        TEXT PRIMARY KEY,               -- UTC date, YYYY-MM-DD
  text       TEXT NOT NULL,
  provider   TEXT NOT NULL,                  -- gemini | workers-ai | facts (no model answered)
  created_at INTEGER NOT NULL
);
