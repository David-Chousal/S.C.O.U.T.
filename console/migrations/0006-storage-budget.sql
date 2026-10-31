-- R2 guardrails (Phase E, SCO-241). Cloudflare offers no hard spending cap, so the Worker keeps
-- its own ledger and refuses an R2 call that would pass a ceiling set well under the free tier
-- (worker/storage.js). storage_usage counts billable calls per calendar month (UTC);
-- storage_objects records what was written and when the bucket's lifecycle rule deletes it, so
-- stored bytes can be summed without a billable list call.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE storage_usage (
  month  TEXT PRIMARY KEY,               -- YYYY-MM, UTC
  writes INTEGER NOT NULL DEFAULT 0,     -- R2 Class A calls (put)
  reads  INTEGER NOT NULL DEFAULT 0      -- R2 Class B calls (get)
);

CREATE TABLE storage_objects (
  key        TEXT PRIMARY KEY,
  bytes      INTEGER NOT NULL,
  expires_at INTEGER NOT NULL            -- when the lifecycle rule for its prefix deletes it
);
