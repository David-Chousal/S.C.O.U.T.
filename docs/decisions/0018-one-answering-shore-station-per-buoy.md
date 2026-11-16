# ADR-0018 — One Answering Shore Station per Buoy, Chosen by Who Hears It Most

- **Status:** ✅ Accepted 2026-11-15 (David). Built on branch `firmware/sco-316-one-answering-station`;
  not deployed; D1 migration `0018-receptions.sql` not applied remotely; never run with two stations
- **Date raised:** 2026-11-15 (David Chousal Cantu)
- **Owner:** CS lead (David Chousal Cantu)
- **Implements:** [SCO-316](https://linear.app/scout1/issue/SCO-316), [SCO-290](https://linear.app/scout1/issue/SCO-290)
- **Builds on:** the command station of 2026-10-30 (`0004-command-station.sql`),
  [SCO-315](https://linear.app/scout1/issue/SCO-315) (the shore's time after every packet),
  [ADR-0016](0016-firmware-delivery-over-wifi.md) (firmware jobs routed to a station)

> **Summary** — With two shore stations in range of one buoy, both would answer each of its packets
> in the same 1 s listen window and the frames would collide. Exactly one station now answers each
> buoy: the station an admin pinned, else the only station, else the station that pushed the most
> of that buoy's readings in the last 24 h. The console records every station that heard each
> reading to decide this, and tells each station the full list of buoys it answers; the S3 sends
> nothing at all to any other buoy.

---

## Context

A buoy listens for 1 s after each packet and keeps the first frame it hears. On 2026-10-30 the
console gained a per-buoy **command station**: only that station was told the buoy's wanted
settings, so only it sent a settings or count frame. That left two gaps:

1. **A station still answered buoys it was not told about.** Since SCO-315 the shore sends its
   own time after every packet with nothing else due, and the S3 did not know which buoys were
   "its" buoys, only which had pending changes. Two stations would both send a time frame.
2. **With two or more stations, an unpicked buoy got no commands at all.** That used to mean only
   that settings could not change. Now it also means its clock is never corrected, so two buoys
   would drift into each other's transmit slots within about 6 days (SCO-224).

The console also kept no record of which station heard a reading (SCO-290), so it had nothing to
choose with.

## Decision

1. **Record every station that hears a reading** in `receptions` (`buoy_id`, `record_seq`,
   `timestamp_utc`, `device_id`, `received_at`), once per station, kept 30 days. A reading is
   still stored once in `readings`. No RSSI: a pushed row does not carry it, and adding it would
   change the schema row shared by the firmware, the Python shore and the console.
2. **Exactly one station answers each connected buoy** (`console/worker/routing.js`):
   1. the station an admin pinned (Stations → Assign buoys), while it is active;
   2. else the only active station;
   3. else the active station that pushed the most of the buoy's readings in the last 24 h, ties
      going to the one that heard it last, then the oldest station;
   4. else none, until a station hears it. Stations warns about such a buoy.
   Settings, counts and firmware jobs go only to that station.
3. **The settings reply lists every buoy the station answers** (`"commands": [1, 3]`). The S3
   sends no frame of any kind to a buoy outside it and prints `QUIET buoy=N`. Until it has a list
   (no console contact since boot, or an older console) it answers every buoy, as a lone station
   always has. A USB-bridged S3 gets the same list as an `A1,3` line from `sync_console.py`.
4. **Every station that can hear a buoy holds that buoy's downlink key**, since any of them may be
   picked. This replaces the interim rule of 2026-11-15 (one station per key).

## Alternatives considered

- **Pins only (keep 2026-10-30's rule).** Unpicked buoys would get no clock corrections with two
  stations, and forgetting to pin is silent until buoys collide. Rejected; pins still win.
- **Random back-off or RSSI-based contention on the stations.** Frames take 0.5–1.7 s, so there is
  no room in a 1 s window to back off, and it still collides sometimes. Rejected.
- **One key per station.** It works with no code, but a buoy then depends on one station staying
  up, and picking the station happens at flashing time, not in the console. Rejected as the
  long-term rule; it was the interim rule.

## Consequences

- With two stations nobody has to configure anything: the buoy goes to the station that hears it
  best, and moves if that station goes quiet for a day. A pin overrides it.
- The route can change while a firmware transfer is running. Transfers are buoy-driven and
  resume from the SD card, so the next station continues where the last one stopped.
- A station on WiFi hears about a route change within a minute (its settings poll). A station on
  the USB bridge hears only when `sync_console.py --serial` next runs, and a station with no
  console contact keeps its last list (or, after a reboot, answers every buoy) until contact
  returns. Until then two stations can both answer the same packet. Slots are hours apart, so a
  WiFi station overlaps for at most one slot; for the others, restore the connection or rerun the
  sync (the `scout-shore-sync.timer` does it on a schedule) before relying on the new route.
- Buoy IDs above 63 cannot be routed to the S3 (its table has 64 slots); the S3 already keeps
  wanted settings only for IDs 1–8.
- ⚠️ Never run with two stations or on hardware: the console side is tested end to end in the
  Worker and in a local console; the S3 side is unit-tested and compiles.
