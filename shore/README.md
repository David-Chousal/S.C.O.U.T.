# Shore — data path

Shore-station software: the LoRa packet codec, a hardware-free sensor simulator, a mock LoRa
link, a schema-validated CSV store, and the receiver that ties them together.

Runtime and role are documented in
[docs/engineering/shore-station.md](../docs/engineering/shore-station.md). The buoy is a
Feather M0. The shore station is an **ESP32-S3 Feather with a LoRa FeatherWing**
(`firmware/src/shore_rx/`); **this code runs on the computer it is plugged into over USB**,
until the S3 pushes readings over WiFi itself
([SCO-237](https://linear.app/scout1/issue/SCO-237)). `serial_link.SerialFrameLink` reads the
S3's `RX` lines ([SCO-257](https://linear.app/scout1/issue/SCO-257)).

> **Status:** simulated end-to-end path working with **no hardware**, the S3 serial link
> (tested against a pseudo-terminal and saved logs), a fallback SX1276-on-a-Raspberry-Pi backend
> (`radio.Rfm9xLink`) and a systemd service — ⚠️ **none yet run against the real boards**.
> All three links implement the `LoRaLink` protocol in [`scout_shore/link.py`](scout_shore/link.py),
> so switching is a `--link` flag, not a code change.

## The path

```
sensor simulator → packet.encode → MockLoRaLink (loss/corruption)
    → Receiver: packet.decode → schema.validate → CsvStore (daily CSV)
```

Everything conforms to the
[On-Board CSV Data Schema](../docs/engineering/data-schema.md), so shore-decoded data and
retrieved on-buoy data share one format and one analytics path.

**Writes are idempotent.** The same reading can legitimately arrive more than once: a frame
received twice, a buoy configured to send extra copies per slot (`SCOUT_LINK_REPEATS_NORMAL` in
`firmware/lib/scout_link`; one copy since 2026-10-23), or an SD-card import of readings the radio
already delivered. `CsvStore` keys on `(buoy_id, record_seq, timestamp_utc)` (a power-cycled buoy restarts `record_seq` at 0) and skips
copies it has already stored, seeding that key set from the daily file on disk so a restarted
shore station does not re-admit them. `Receiver.stats.duplicates` counts the skips: they are
expected traffic, not errors. Without this, repeats would triple every row and inflate the
completeness figure in `analytics/telemetry/qc.py`, masking real gaps.

## Layout

```
shore/
├── scout_shore/
│   ├── packet.py       LoRa packet codec (encode/decode + CRC) — the firmware↔shore contract
│   ├── schema.py       Reading → CSV row (data-schema.md) + row/file validator
│   ├── simulator.py    synthetic readings (diurnal temp, turbidity events, battery)
│   ├── store.py        append rows to per-day CSV files
│   └── receiver.py     MockLoRaLink + Receiver (decode → validate → store, with stats)
├── scripts/
│   └── run_loopback.py end-to-end demo
└── tests/              unittest suite (stdlib only)
```

## Run

```bash
cd shore

# End-to-end demo: 1 day of readings, 5% loss, 2% corruption
python scripts/run_loopback.py --count 48 --loss 0.05 --corrupt 0.02 --out ./data

# Tests (stdlib unittest — no install needed; pytest also works)
python -m unittest discover -s tests -v
```

## Deploying on the shore computer

Plug the S3 in over USB, then on the computer (any Linux machine; a Raspberry Pi works):

```bash
ls /dev/serial/by-id/          # the S3's port; put it in the unit's --serial
sudo cp shore/deploy/scout-shore.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now scout-shore
journalctl -u scout-shore -f
```

The unit assumes the repo is at `/home/pi/S.C.O.U.T.` and runs as `pi` (in the `dialout`
group, for the serial port); adjust `WorkingDirectory`, `User` and `--serial` if yours differs.
No third-party packages are needed. A saved S3 log can be replayed into the store once with
`--serial s3.log`; it exits when the log is done.

**It restarts unconditionally, by design.** `Restart=always` with the start-limit disabled: an
unattended station on a coastline will not be restarted by hand, and the buoy transmits blind,
so if nothing is listening neither end raises an alarm. A link that throws (including an unplugged S3) is caught, counted,
and retried with a widening backoff capped at 60 s, so a dead link never pins the CPU and a
recovered one is picked up promptly. `SIGTERM` is a clean stop, so `systemctl stop` and reboots
never interrupt a CSV write.

### Where received data has to go

```bash
python scripts/run_receiver.py --link serial --serial /dev/ttyACM0 --out data-live   # what the unit runs
```

`data-live/` is **tracked in git** and is what the public dashboard publishes from — see
[`data-live/README.md`](data-live/README.md). `data/` is gitignored scratch that CI regenerates
from the simulator on every Pages build. Writing received data to `data/` would mean it is
never committed *and* overwritten within the hour, so the site would keep showing sample data
with no error anywhere. The choice between the two is made in
[`scout_shore/publish.py`](scout_shore/publish.py), which is tested; real data always wins and
is never labelled as a simulation.

## Recovering a retrieved SD card

The buoy transmits each daily packet a few times and never waits for an acknowledgement. If
shore misses every copy — a power cut, a storm, the station down for maintenance — that reading
exists **only** on the buoy's SD card. And even the readings that did arrive are lossy: a
44-byte packet cannot carry `turbidity_v`, `turbidity_ntu` or the audio filename, so those cells
are empty in the shore CSV while the card has them.

```bash
# Inspect a card before touching anything:
python scripts/import_sd_card.py --card /Volumes/SCOUT --into data-live --dry-run

# Merge it in:
python scripts/import_sd_card.py --card /Volumes/SCOUT --into data-live
```

Merging is on `(buoy_id, record_seq, timestamp_utc)` — the same idempotency key the receiver uses for blind
repeats — so **running it twice is a no-op**. The card wins cell by cell where it holds more,
but a blank cell on the card never overwrites a value shore received: a row half-written at the
moment of power loss must not erase a reading that arrived intact over the radio. Existing shore
rows the card lacks are kept, because a card pulled mid-deployment is a partial record and
treating it as authoritative for *absence* would delete history.

Rows that cannot be keyed are reported on stderr and the command exits non-zero. They are never
silently skipped — a row on the card we failed to import is exactly the loss this tool exists to
prevent.

## Contract note

`packet.py` is the **verified wire format** (44 bytes in v3, under the 140-byte payload ceiling
that `LORA_PAYLOAD_BUDGET_BYTES` shares with the firmware — see
[`docs/hub/facts.md`](../docs/hub/facts.md)). It's mirrored byte-identical by the firmware C
encoder, CI-enforced via a golden vector (`firmware/test/test_packet`). `turbidity_v` still
uses provisional ADC constants pending the analog front-end design.
