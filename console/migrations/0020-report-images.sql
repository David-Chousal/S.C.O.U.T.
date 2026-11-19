-- Report builder (SCO-317): images for the Image block (a logo or photo, decided for v1 on
-- 2026-11-18). The file is in R2 under report-images/<id> (worker/storage.js budgets it); this
-- row says what it is and who uploaded it. Any signed-in person can view one, as with reports.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE report_images (
  id           TEXT PRIMARY KEY,
  owner_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/png', 'image/jpeg')),
  bytes        INTEGER NOT NULL,
  created_at   INTEGER NOT NULL
);
CREATE INDEX report_images_owner ON report_images(owner_id);
