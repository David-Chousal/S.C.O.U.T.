-- NOAA Coral Reef Watch heat stress on the console (SCO-314, ADR-0017).
-- Apply: wrangler d1 migrations apply scout-console --remote

-- Each buoy's site Maximum Monthly Mean (MMM, °C), the climatology Degree Heating Weeks needs.
-- mmm_source noaa_crw_5km: looked up from CRW's 5 km product for latitude/longitude, from the
--   grid cell at mmm_cell_lat/lon (MMM = CRW SST − CRW HotSpot on the newest day).
-- mmm_source manual: typed in by a member or admin (e.g. read off a CRW virtual station).
-- mmm_c NULL = not set: the console shows no heat stress for the buoy and says how to set it.
ALTER TABLE buoys ADD COLUMN latitude REAL CHECK (latitude BETWEEN -90 AND 90);
ALTER TABLE buoys ADD COLUMN longitude REAL CHECK (longitude BETWEEN -180 AND 180);
ALTER TABLE buoys ADD COLUMN mmm_c REAL CHECK (mmm_c BETWEEN 10 AND 35);
ALTER TABLE buoys ADD COLUMN mmm_source TEXT CHECK (mmm_source IN ('noaa_crw_5km', 'manual'));
ALTER TABLE buoys ADD COLUMN mmm_cell_lat REAL;
ALTER TABLE buoys ADD COLUMN mmm_cell_lon REAL;
ALTER TABLE buoys ADD COLUMN mmm_set_by TEXT;
ALTER TABLE buoys ADD COLUMN mmm_set_at INTEGER;

-- A fourth alert-rule kind, bleaching: value is the lowest CRW alert level that fires, as its
-- index in the scale (1 Watch … 7 Alert Level 5). SQLite cannot widen a CHECK in place, so
-- alert_rules is rebuilt. Dropping it would cascade into alert_state and alert_off_links, so both
-- are kept aside and put back; OR IGNORE covers a database that defers the cascade instead.
PRAGMA defer_foreign_keys = true;

CREATE TABLE alert_state_keep AS SELECT * FROM alert_state;
CREATE TABLE alert_off_links_keep AS SELECT * FROM alert_off_links;

CREATE TABLE alert_rules_next (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buoy_id      INTEGER,
  kind         TEXT NOT NULL CHECK (kind IN ('threshold', 'flag', 'silence', 'bleaching')),
  metric       TEXT,
  op           TEXT CHECK (op IN ('above', 'below')),
  value        REAL,
  remind_hours INTEGER,
  enabled      INTEGER NOT NULL DEFAULT 1,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
INSERT INTO alert_rules_next SELECT id, user_id, buoy_id, kind, metric, op, value, remind_hours, enabled, created_at, updated_at
  FROM alert_rules;
DROP TABLE alert_rules;
ALTER TABLE alert_rules_next RENAME TO alert_rules;
CREATE INDEX alert_rules_user ON alert_rules(user_id);

INSERT OR IGNORE INTO alert_state SELECT * FROM alert_state_keep;
INSERT OR IGNORE INTO alert_off_links SELECT * FROM alert_off_links_keep;
DROP TABLE alert_state_keep;
DROP TABLE alert_off_links_keep;
