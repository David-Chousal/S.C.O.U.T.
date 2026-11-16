-- Which shore stations heard each reading (SCO-290, SCO-316). The reading itself is stored once in
-- `readings`; this keeps one row per station that pushed it, so the console can say which station
-- hears a buoy best and let only that one answer it (a buoy's 1 s listen window fits one reply).
-- Rows older than 30 days are pruned by the daily job; only the last 24 h decide the route.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE receptions (
  buoy_id       INTEGER NOT NULL,
  record_seq    INTEGER NOT NULL,
  timestamp_utc TEXT NOT NULL,
  device_id     TEXT NOT NULL,
  received_at   INTEGER NOT NULL,
  PRIMARY KEY (buoy_id, record_seq, timestamp_utc, device_id)
);

CREATE INDEX receptions_recent ON receptions (received_at, buoy_id, device_id);
