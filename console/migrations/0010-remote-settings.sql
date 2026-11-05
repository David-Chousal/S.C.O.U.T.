-- Remote buoy settings (docs/engineering/firmware-remote-settings-plan.md). buoy_settings holds
-- what the team requested for each remote setting other than the transmit count, which keeps its
-- column on buoys (tx_count_requested). No row means "use the firmware default". The buoy's v5
-- packets report a digest of every setting it runs, kept as settings_digest_reported (4 hex
-- digits; NULL until a v5 packet arrives).
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE buoy_settings (
  buoy_id      INTEGER NOT NULL REFERENCES buoys(buoy_id) ON DELETE CASCADE,
  setting_key  TEXT NOT NULL,
  value        INTEGER NOT NULL,
  requested_by TEXT NOT NULL,
  requested_at INTEGER NOT NULL,
  PRIMARY KEY (buoy_id, setting_key)
);

ALTER TABLE buoys ADD COLUMN settings_digest_reported TEXT CHECK (settings_digest_reported GLOB '[0-9a-f][0-9a-f][0-9a-f][0-9a-f]');
