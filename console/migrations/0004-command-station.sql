-- One command station per buoy (2026-10-30). Two shore stations in range of one buoy would both
-- send its downlink command in the buoy's 1 s listen window: the messages collide, or the buoy
-- takes one and refuses the other as a repeat, which the console would show as refused. Only the
-- station named here is told about the buoy's requested count. NULL means "not picked", which is
-- fine while there is a single active station (it sends) and means "nobody sends" once there are
-- more. Revoking the station clears it.
-- Apply: wrangler d1 migrations apply scout-console --remote

ALTER TABLE buoys ADD COLUMN command_device_id TEXT REFERENCES devices(id);
