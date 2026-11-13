-- Change WiFi from the console (SCO-310): when an admin last asked this shore station to open its
-- SCOUT-Setup network. The station reads it in its settings poll; a request older than 15 minutes
-- is no longer sent, so a station that was off at the time does not open setup days later.
-- Apply: wrangler d1 migrations apply scout-console --remote

ALTER TABLE devices ADD COLUMN wifi_setup_requested_at INTEGER;
