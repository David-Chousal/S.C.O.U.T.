-- Firmware over WiFi (SCO-312, ADR-0016): one row per signed .scoutfw bundle an admin uploads for a
-- buoy. The buoy's shore station downloads the bundle over its device token, checks the hash and
-- the Ed25519 signature itself, relays it over LoRa, and reports each step back as `state`.
-- The bundle bytes are dropped (set NULL) once a job is final; the row stays as the record.
-- Apply: wrangler d1 migrations apply scout-console --remote

CREATE TABLE firmware_jobs (
  id          TEXT PRIMARY KEY,
  buoy_id     INTEGER NOT NULL REFERENCES buoys(buoy_id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  size        INTEGER NOT NULL,
  sha256      TEXT NOT NULL,                -- of the image, as in the manifest
  bundle      BLOB,
  state       TEXT NOT NULL CHECK (state IN ('pending', 'staged', 'offering', 'transferring', 'trial',
                'confirmed', 'rolled_back', 'rejected', 'canceled')),
  detail      TEXT,
  uploaded_by TEXT NOT NULL,
  uploaded_at INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX firmware_jobs_buoy ON firmware_jobs (buoy_id, uploaded_at);
