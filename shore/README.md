# Shore — Raspberry Pi data path

Shore-station software: the LoRa packet codec, a hardware-free sensor simulator, a mock LoRa
link, a schema-validated CSV store, and the receiver that ties them together.

Runtime and role are documented in
[docs/engineering/shore-station.md](../docs/engineering/shore-station.md). The buoy is a
Feather M0; **this code runs on the Raspberry Pi** (see
[ADR-0001](../docs/decisions/0001-mcu-and-radio-selection.md)).

> **Status:** simulated end-to-end path working with **no hardware**. Real reception drops in
> when a Raspberry Pi + RFM95/SX1276 LoRa HAT is available — swap `MockLoRaLink` for an
> `adafruit-rfm9x` backend exposing the same `transmit`/`receive`/`pending` interface.

## The path

```
sensor simulator → packet.encode → MockLoRaLink (loss/corruption)
    → Receiver: packet.decode → schema.validate → CsvStore (daily CSV)
```

Everything conforms to the
[On-Board CSV Data Schema](../docs/engineering/data-schema.md), so shore-decoded data and
retrieved on-buoy data share one format and one analytics path.

**Writes are idempotent.** The buoy transmits each daily packet several times without waiting
for an acknowledgement (blind repetition — see `firmware/lib/scout_link`), so the same reading
legitimately arrives more than once. `CsvStore` keys on `(buoy_id, record_seq)` and skips
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

## Contract note

`packet.py` is the **verified wire format** (30 bytes, well under the 82-byte daily budget
ceiling in EDD §10 — see [`docs/hub/facts.md`](../docs/hub/facts.md) for why those are two
different numbers, not a contradiction). It's mirrored byte-identical by the firmware C
encoder, CI-enforced via a golden vector (`firmware/test/test_packet`). `turbidity_v` still
uses provisional ADC constants pending the analog front-end design.
