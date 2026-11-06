-- Disconnecting a buoy from the console (Fleet's ⋯ menu, 2026-11-06). A disconnected buoy stays
-- listed but its packets are no longer stored and no shore station is sent its settings; adding
-- it again on Fleet reconnects it. Once disconnected it can be deleted for good (its row, settings
-- and readings). NULL = connected.
-- Apply: wrangler d1 migrations apply scout-console --remote

ALTER TABLE buoys ADD COLUMN disconnected_at INTEGER;
