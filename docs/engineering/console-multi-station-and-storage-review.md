# Console Review: Multiple Buoys and Stations, Database and Storage

> **Summary** — Answers every question Dr. Shaghaghi raised during the team console demo at the
> 2026-10-30 weekly meeting, checked against the code on `main` (2026-10-30), not against what
> was said in the meeting. Two things said in the demo were wrong and are corrected here. Three
> real gaps were found; they are filed in Linear.
>
> Source: [meeting notes, 2026-10-30](../planning/meeting-notes.md) ·
> [ADR-0012](../decisions/0012-authenticated-console.md) · [`console/`](../../console/README.md)

---

## Short answers

| Navid asked | Answer |
|---|---|
| Does a buoy have to be linked in the lab before it goes out? | **No.** The console adds any buoy the first time one of its readings arrives. In the lab, the buoy only needs its own `BUOY_ID` (and, for the downlink, its own key) flashed |
| How does a shore station know which buoys are "its" buoys? | **It doesn't, and doesn't need to.** A station forwards every valid S.C.O.U.T. packet it hears, from any buoy. The console has no station-to-buoy link at all |
| Two buoys and two stations: will a reading be counted twice? | **No, by design.** A reading is stored once per `(buoy_id, record_seq, timestamp_utc)`; the second station's copy is ignored. Not yet tested with two stations ([SCO-290](https://linear.app/scout1/issue/SCO-290)) |
| Is there an API for the station to send to, and how is it secured? | **Yes:** `POST /api/device/readings` and `GET /api/device/settings`, with a per-station bearer token stored only as a hash and revocable from the Stations page |
| What database is it? | **Cloudflare D1** (SQLite), not KV. The back end is a Cloudflare Worker, not Node |
| Can it store a lot of data on the free plan? | **Yes, by a wide margin.** About 1.3 MB a year for two buoys over LoRa; the 500 MB database cap is decades away. The raw audio, the only large data, never goes to the console |
| Should it move to MySQL or Supabase? | **Not for size.** The constraints that matter on the free plan are CPU per request (sign-in), 7-day backups, and that the console does not show readings yet |

## Corrections to what was said in the demo

| Said in the demo | What the code does |
|---|---|
| "Worker JS is a built-in back end slash database"; storage described as KV | The Worker is the back end; the database is **D1**, a SQLite database (`console/wrangler.toml`, binding `DB`). There is no KV namespace |
| "It's React and Node" | The front end is React (a Next.js static export). The back end runs on Cloudflare's Workers runtime, not Node |
| "I need to work on deduping" | Deduplication is already built at three layers (below). What is missing is a two-station test and a record of which station heard what |
| "If you have a lot of data you have to keep the socket open … which will bar you access" | The free plan limits **requests per day**, **CPU time per request** and **rows read and written per day**, not how long a connection stays open. Each push is a short request (≤ 200 rows) |

## Multiple buoys and stations

### How a buoy appears in the console

- Each buoy's ID is compiled into its firmware (`BUOY_ID`, `firmware/src/config.h`) and sent in
  every packet header. The console accepts IDs `SCOUT-1` to `SCOUT-65535`.
- When a station pushes a reading for a buoy the console has never seen, the console creates
  it (`INSERT OR IGNORE INTO buoys`, `console/worker/device.js`). **Add buoy** on the Fleet page
  only names a buoy or sets its transmit count before its first packet; it is not required.

### How a station handles what it hears

- The station accepts any packet that passes the length, CRC and version checks, from any buoy
  ID. It keeps no list of buoys.
- The buoy repeats each packet (blind repetition), so the station drops repeats itself: it
  remembers the last 16 `(buoy, sequence, timestamp)` keys (`firmware/lib/scout_dedupe`).
- Readings waiting for WiFi queue in RAM, up to 256 (about six weeks for two buoys at three
  transmits a day); after that the oldest are dropped. Every reading is also on the buoy's SD
  card.
- The token only lets a station push readings and read the requested transmit counts. It
  cannot read data, users or settings pages.

### Two stations hearing the same buoy

**Three layers each store a reading once,** all keyed on `(buoy_id, record_seq, timestamp_utc)`:
the station's own dedupe, the Python shore store, and the console's `readings` table, whose
primary key is that triple (`console/migrations/0002-reset-safe-readings.sql`). The rows two
stations push for one packet are byte-for-byte the same, because a row carries no signal
strength or station field, so whichever arrives first is stored and the second is ignored.
Timestamp is in the key because a cold start resets `record_seq` to 0 (decision log 2026-10-30).

What this does **not** cover yet:

1. **No two-station test.** One Worker test pushing the same rows from two device tokens would
   prove it ([SCO-290](https://linear.app/scout1/issue/SCO-290)).
2. **No record of which station heard a reading,** or how strongly. With one station that does
   not matter; with two it is the only way to see coverage and pick the better site. Storing a
   small `(reading, station, rssi, snr)` table next to `readings` would do it without
   double-counting (SCO-290).
3. **Two stations would both send the same downlink command.** Every station reads every
   buoy's requested transmit count, and a `SCOUT_DOWNLINK` build sends `SET_TX_COUNT` right after
   the buoy's packet. With two stations both would transmit in the same 1 s window: the frames
   collide, or the buoy accepts one and refuses the other as a replay (its counter is not newer).
   A replay counts as a rejection, so the buoy flags `CMD_REJECTED` and the console shows the
   change as refused even though it worked. **Not a problem today:** the downlink is off by
   default and has never run on hardware. Before two stations run a downlink build, one station
   per buoy must be chosen to send commands (SCO-290). **Built 2026-10-30:** an admin picks each
   buoy's command station on the Stations page, and only that station is told the requested count
   (a lone station needs no pick; with two and none picked, nobody sends). ⚠️ The S3's WiFi path
   replaces its whole list each pull, so a dropped buoy stops at once; the USB bridge
   (`sync_console.py`) only sends `N<buoy>:<count>` for listed buoys, so a count it set earlier
   stays on the S3 until the S3 restarts or is sent a new one.
4. **Two buoys flashed with the same ID would merge** into one buoy in the console, silently.
   Nothing detects it. The per-unit naming scheme
   ([SCO-121](https://linear.app/scout1/issue/SCO-121)) should assign IDs so this cannot happen.

## Database and storage

### What one reading costs

A stored reading is one schema row (24 columns) as JSON, about 550 bytes, plus its key, so about
**610 bytes**.

| Scenario | Readings per year | Data per year | Time to the free plan's 500 MB database cap |
|---|---|---|---|
| 2 buoys, 3 transmits a day over LoRa (today's plan) | 2,190 | ~1.3 MB | centuries |
| 10 buoys, 3 a day over LoRa | 10,950 | ~6.7 MB | decades |
| 2 buoys, every 30-minute sample imported from SD | 35,040 | ~21 MB | ~24 years |
| 10 buoys, every 30-minute sample from SD | 175,200 | ~107 MB | ~4.7 years |

The hydrophone audio (about 7 GB for one deployment's archive) is the only large data, and it
never reaches the console: it stays on the buoy's SD card and goes through the analytics
pipeline locally ([CLAUDE.md](../../CLAUDE.md) rule 2, [ADR-0010](../decisions/0010-acoustic-summary-over-lora.md)).
Only the 14-byte acoustic summary per recording travels in the reading.

### Free plan limits that apply

| Limit (Workers Free) | Value | S.C.O.U.T. use |
|---|---|---|
| D1 database size | 500 MB (5 GB per account) | ~1.3 MB a year |
| D1 rows written | 100,000 a day | a few per push; tens a day per station |
| D1 rows read | 5 million a day | small until charts read history (below) |
| Worker requests | 100,000 a day | ~150 a day per station (settings check every 10 min plus pushes) |
| CPU per request | 10 ms | **Exceeded by sign-in** (PBKDF2, measured 22–96 ms); everything else 0–2 ms ([open question](../hub/research/open-questions.md)) |
| D1 point-in-time recovery | 7 days | **The real risk:** no copy older than a week ([SCO-241](https://linear.app/scout1/issue/SCO-241)) |

Sources: [`cloudflare-d1-pricing`](../hub/research/sources.md#tooling--software-cited),
[`cloudflare-d1-limits`](../hub/research/sources.md#tooling--software-cited),
[`cloudflare-workers-limits`](../hub/research/sources.md#tooling--software-cited), all read
2026-10-30. When a daily D1 limit is hit, queries fail until 00:00 UTC; the paid plan ($5 a month)
removes them.

### Should it move to MySQL or Supabase?

**Not now, and not for size.** D1 holds a deployment's data many times over. Moving would add a
second service, a second set of credentials and a network hop for no capacity gain. The reasons
that would justify paying or moving are different ones, worth deciding in
[SCO-291](https://linear.app/scout1/issue/SCO-291):

- **Backups.** Seven days of point-in-time recovery is all the free plan keeps. A scheduled
  export of `readings` (or the paid plan's 30 days) is needed before Hawaii.
- **Sign-in CPU.** Already over the free 10 ms; tolerated today, a risk if Cloudflare enforces it.
- **Charts over history.** The rows-read limit only matters once the console draws history. A
  chart that scans 175,000 rows on each page load would hit 5 million reads a day after about 28
  loads, so history views need an index on `(buoy_id, timestamp_utc)` and bounded date ranges.

## Other gaps found while checking

- **The console stores readings but does not show them yet.** Nothing in the Worker reads the
  `readings` table: Fleet shows each buoy's last-seen time and transmit count, not its
  measurements. Today the measurements are visible only on the public dashboard, which reads the
  shore station's CSVs. Worth knowing before the Nov 6 demo; tracked by the console's later phases
  ([SCO-240](https://linear.app/scout1/issue/SCO-240), [SCO-241](https://linear.app/scout1/issue/SCO-241)).
  **Built 2026-10-30 (Phase B):** a Readings page shows each buoy's newest values and last 50
  readings, and `/api/v1/buoys/:id/readings` serves them to scripts with a personal API token.
- **The station token is compiled into the firmware** from the git-ignored `shore_secrets.h`.
  Anyone holding the board could read it; the defence is revoking it on the Stations page, which
  takes effect on the next request. A secret manager would not change this on a microcontroller.
  Agreed as fine for now (decision log 2026-10-30).

## Smaller points from the demo

- **"That's too short of a password":** the console requires at least 12 characters, with no
  composition rules (NIST SP 800-63B, [ADR-0012](../decisions/0012-authenticated-console.md)).
- **UTC vs Hawaii time:** the buoy and the database keep UTC. Each user can show times in their
  own time zone (Settings → Times). Hawaii is UTC−10 with no daylight saving, so times there never
  shift.
