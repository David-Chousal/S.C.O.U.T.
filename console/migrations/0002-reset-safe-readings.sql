-- A buoy that loses power cold-starts its record_seq at 0, so (buoy_id, record_seq) alone
-- names two different readings after a battery swap, and INSERT OR IGNORE dropped the second.
-- A repeat of the same reading also repeats its timestamp, so adding timestamp_utc to the key
-- keeps pushes idempotent while letting a reused sequence number through.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE readings_new (
  buoy_id       INTEGER NOT NULL,
  record_seq    INTEGER NOT NULL,
  timestamp_utc TEXT NOT NULL,
  row_json      TEXT NOT NULL,
  received_at   INTEGER NOT NULL,
  PRIMARY KEY (buoy_id, record_seq, timestamp_utc)
);
INSERT INTO readings_new SELECT buoy_id, record_seq, timestamp_utc, row_json, received_at FROM readings;
DROP TABLE readings;
ALTER TABLE readings_new RENAME TO readings;

-- 1 while the buoy's newest row carried RTC_LOST: its timestamp cannot be trusted, so the
-- console judges freshness by when the row arrived instead.
ALTER TABLE buoys ADD COLUMN clock_lost INTEGER NOT NULL DEFAULT 0;
