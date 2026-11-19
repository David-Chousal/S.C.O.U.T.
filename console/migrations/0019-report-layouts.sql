-- Report builder (SCO-317): saved reports and templates. Both hold a report document
-- (worker/report-layouts.js validates it): layout and options only, never readings, so they stay
-- small and always show current data. shared = 1 means the whole team sees it and members can
-- change it (reports are shared by default, decided 2026-11-18); 0 means only its author does.
-- is_default marks the one team template an admin chose for new reports.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE report_layouts (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL CHECK (kind IN ('report', 'template')),
  owner_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  shared     INTEGER NOT NULL DEFAULT 1,
  is_default INTEGER NOT NULL DEFAULT 0,
  name       TEXT NOT NULL,
  doc_json   TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX report_layouts_owner ON report_layouts(owner_id);
