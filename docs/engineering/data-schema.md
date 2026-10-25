# On-Board CSV Data Schema (v3)

> **Summary** — The format of the CSV log the buoy writes to microSD: one row per sampling
> event, fixed column order, UTC timestamps. This is the contract between the firmware
> (writer) and the shore station / `analytics/` pipeline (readers). Phase 0 deliverable — see
> [Team Timeline](../planning/team-timeline.md) Phase 0, CS lead.

---

## Design principles

- **One row per wake/sample event.** The firmware wakes on the RTC alarm (~every 30 min),
  samples, appends one row, and sleeps. Not every sensor is read every cycle (turbidity and
  audio run less often) — columns that were not sampled this cycle are left **empty**, never
  `0`.
- **Fixed column order, stable names.** Readers index by header name, but the order below is
  canonical. Adding a column goes at the end and bumps `schema_version`.
- **UTC, ISO 8601.** All timestamps are UTC with a trailing `Z` (e.g. `2026-08-14T00:30:00Z`).
  We deploy in Hawaii (HST, UTC−10) with a reference dataset from Japan — storing UTC avoids
  the ambiguity [CONVENTIONS.md → Engineering data](../CONVENTIONS.md#engineering-data) warns
  about. Convert to local only for display.
- **Units live in the column name** (`temp_c`, `battery_v`) so the file stays pure ASCII and
  parses without a unit dictionary. The authoritative unit for each column is in the table.
- **Append-only.** Rows are only ever appended; the file is never rewritten in place.
- **Missing ≠ zero.** A failed or skipped read is empty + a `flags` entry, so downstream code
  can tell "not measured" from "measured 0".

## File layout on the SD card

```
/DATA/
  20260814.CSV              one file per UTC day: YYYYMMDD.CSV
  20260815.CSV
/AUDIO/
  20260814/
    003000Z.WAV             audio referenced by the audio_file column (20260814/003000Z.WAV)
```

**Names are FAT 8.3** (at most 8 characters, a dot, 3 characters), because the buoy's Arduino SD
library cannot write long names; the buoy writes them in upper case. The `buoy_id` is in every
row, so it is left out of the file name. On the **shore** side the store and the card importer
name the same daily file `<buoy_id>_<YYYYMMDD>.csv` (e.g. `SCOUT-01_20260814.csv`), taking the
`buoy_id` from the rows. The card importer matches `.csv` in any case. Changed 2026-10-19
([SCO-202](https://linear.app/scout1/issue/SCO-202)); the earlier `SCOUT-01_20260814.csv` card
name could not be written by the buoy.

Each daily CSV starts with the header row below.

## Columns (v3)

| # | Column | Type | Unit | Example | Notes |
|---|---|---|---|---|---|
| 1 | `schema_version` | int | — | `3` | Bumped when columns change. Constant within a file. Shared with the packet's version byte. **v3 (2026-10-25, [SCO-233](https://linear.app/scout1/issue/SCO-233), [ADR-0010](../decisions/0010-acoustic-summary-over-lora.md))** added columns 17–23, the acoustic summary. **v2 (2026-10-23, [SCO-205](https://linear.app/scout1/issue/SCO-205))** added columns 15–16 and the `HUMIDITY_*` flags; v1 files have 14 columns, v2 files 16. Readers accept all three, and the shore store rewrites an older daily file's header before appending v3 rows. |
| 2 | `buoy_id` | string | — | `SCOUT-01` | Multi-buoy readiness; stable per unit. |
| 3 | `timestamp_utc` | string | ISO 8601 UTC | `2026-08-14T00:30:00Z` | From the PCF8523 RTC. Row key. |
| 4 | `record_seq` | uint32 | — | `48` | Monotonic counter since boot; also the LoRa packet counter. With `buoy_id` it is the **idempotency key** the shore station deduplicates on — the same reading can arrive twice (a re-received frame, or an SD-card import of a reading the radio already delivered), and must collapse to one row. |
| 5 | `temp_c` | float | °C | `26.42` | DS18B20 water temperature, 2 dp (sensor is ±0.5 °C — see [sensor-selection](sensor-selection.md)). |
| 6 | `turbidity_adc` | uint16 | counts | `3300` | Raw turbidity-sensor ADC reading (Seeed Grove 101020752), **not inverted**. Always logged — it is the ground truth. **A higher count is clearer water** (see the polarity note below). |
| 7 | `turbidity_v` | float | V | `1.65` | Derived sensor voltage (ADC × Vref ÷ full-scale). |
| 8 | `turbidity_fau` | float | FAU | `` | Formazin attenuation units. **Computed downstream, never on the buoy** ([SCO-13](https://linear.app/scout1/issue/SCO-13)). Populated by the analytics pipeline only once a calibration curve exists ([SCO-12](https://linear.app/scout1/issue/SCO-12)); empty until then. **FAU, not NTU:** the sensor measures light transmitted straight through the water, and ISO 7027-1 reports that method in FAU; NTU/FNU are for 90° scattered light. Named `turbidity_ntu` before 2026-10-23; readers accept the old name. |
| 9 | `battery_v` | float | V | `3.28` | Pack voltage via the divider on an ADC pin. Drives the skip-TX threshold. |
| 10 | `uptime_s` | uint32 | s | `172800` | Seconds since boot (State-of-Health). |
| 11 | `audio_file` | string | — | `20260814/003000Z.WAV` | Path under `/AUDIO/` if a recording was actually captured this cycle, else empty. Since v3 firmware this means captured, not merely scheduled: until the capture path is built ([SCO-231](https://linear.app/scout1/issue/SCO-231)) it stays empty. |
| 12 | `flags` | string | — | `TEMP_TIMEOUT` | `|`-separated per-cycle event codes; empty when clean. |
| 13 | `soh` | string | — | `WATCHDOG_RESET` | `|`-separated device State-of-Health codes (set at boot); empty when healthy. |
| 14 | `fw_version` | string | — | `v0.1.0` | Firmware tag that wrote the row. |
| 15 | `internal_temp_c` | float | °C | `24.50` | Air temperature inside the electronics housing, SHT40, 2 dp. **SD card only**: the packet does not carry it, so live rows leave it empty. Empty when the read failed (`HUMIDITY_FAIL`). |
| 16 | `internal_humidity_pct` | float | %RH | `41.2` | Relative humidity inside the housing, SHT40, 1 dp. **The leak early warning**: a sealed housing should stay low and steady, so a rise means water is getting in. SD card only, like column 15; the packet carries only the `HUMIDITY_HIGH` / `HUMIDITY_FAIL` flags. |
| 17 | `lvl_anthro_cdb` | int16 | centi-dB | `-3972` | RMS level of the recording in 0–200 Hz (boats), centi-dB re a full-scale sine (dBFS × 100). **Columns 17–23 are the acoustic summary** ([ADR-0010](../decisions/0010-acoustic-summary-over-lora.md)), the same seven fields the packet carries; all empty when the cycle had no recording. `-32768` = digital silence. |
| 18 | `lvl_mixed_cdb` | int16 | centi-dB | `-3006` | RMS level, 200–1,000 Hz (fish and small-boat overlap). |
| 19 | `lvl_bio_cdb` | int16 | centi-dB | `-1068` | RMS level, 1,000–8,000 Hz (snapping shrimp). |
| 20 | `lvl_broad_cdb` | int16 | centi-dB | `-995` | Broadband RMS level (DC-blocked signal). |
| 21 | `ndsi_e4` | int16 | ×10⁻⁴ | `9975` | (E_bio − E_anthro) / (E_bio + E_anthro) × 10,000, from filtered time-domain energy. Tracks the shore NDSI, does not equal it. |
| 22 | `snap_count` | uint16 | count | `10` | Bio-band impulses above 8× the running mean \|bio\|, one per 3.0 ms window; saturates at 65,535. |
| 23 | `clip_count` | uint16 | samples | `24` | Samples within 16 ADC counts of either rail; saturates at 65,535. |

### Optional / future columns (append at the end when the hardware lands)

- `temp_c_01`, `temp_c_02`, … — multi-depth temperature **only if** the vertical sensor string
  ([sensor-string-architecture](sensor-string-architecture.md)) is ever populated. Per
  [ADR-0003](../decisions/0003-single-point-sensing.md) the build is single-point, so v1 logs
  the one deployed DS18B20 in `temp_c` and these columns do not exist.
- `turbidity_fau` becomes populated once a calibration exists.

### Turbidity polarity — a higher ADC count is *clearer* water

Settled 2026-08-15 for the SEN0189, carried over to the Seeed Grove 101020752 that replaced it
on 2026-10-06. Both measure **transmittance**: suspended particles block light reaching the
phototransistor, so the analog output *falls* as turbidity rises. The DFRobot SEN0189
datasheet states it directly — *"Analog Signal Output, the output value will decrease when in
liquids with a high turbidity"* — and the Seeed wiki says the same of the Grove sensor. A bench
check on the Grove sensor is still owed ([SCO-25](https://linear.app/scout1/issue/SCO-25)).
The firmware logs raw `analogRead` with no inversion
([`drivers/turbidity.h`](../../firmware/src/drivers/turbidity.h)), so `turbidity_adc` inherits
that direction:

| Water | Sensor volts | `turbidity_adc` |
|---|---|---|
| Clear | High | **High** |
| Turbid (runoff, resuspension, plume) | Low | **Low** |

A sediment plume is therefore a **dip** in this column, not a spike. Anything reading this
field — event detection, drift screening, dashboards, a future FAU calibration curve — must
treat a falling count as worsening water quality.

> **If an analog front end is ever added, it must be non-inverting.** The prototype's Grove sensor
> runs at 3.3 V straight into the SAMD21 ADC with no front end (2026-10-06). The SEN0189 it
> replaced swung up to 4.5 V and needed a level-shifting stage; any future sensor that does must
> use a divider or buffer, not an inverting amplifier, or this convention silently flips.

### `RTC_LOST` rows are excluded from time-based analysis

When the PCF8523 is unset or unreadable the firmware sets `RTC_LOST`, stamps the row
`1970-01-01T00:00:00Z`, and **keeps logging** — the sensor readings are still real, only the
time is not. The analytics side treats such a row accordingly
([`model.has_valid_clock`](../../analytics/telemetry/model.py)):

- **Counted, never dropped.** It appears in `n_records` and in the flag tallies, and QC reports
  it separately as `clock_invalid`.
- **Excluded from anything derived from timestamps** — span, expected records, completeness,
  gaps, daily aggregation, DHW, trends, turbidity events, and the drift screen.

Both signals condemn a row: the `RTC_LOST` flag, and any timestamp before 2020 (which catches an
unset clock whose flag was lost). Without this, one such row moved the deployment span to
fifty-six years — completeness collapsed to 0% and a phantom 1970 day entered the daily series.

### `soh` vocabulary (v1)

Device State-of-Health, set at boot and carried in every row/packet (distinct from the
per-cycle `flags`): `WATCHDOG_RESET` · `RTC_UNSET` · `SD_INIT_FAIL` · `LORA_INIT_FAIL`. A
recurring `WATCHDOG_RESET` means a cycle is hanging. Matches `SOH_BITS` in the packet codec.

### `flags` vocabulary (v2)

`SD_RETRY` · `TEMP_TIMEOUT` · `TURBIDITY_RANGE` · `BATT_LOW_SKIP_TX` · `RTC_LOST` ·
`POWER_CONSERVE` (battery-saving mode: audio off, transmit throttled) · `HUMIDITY_HIGH`
(housing humidity at or above `HUMIDITY_ALERT_RH_PCT` in `config.h`; ⚠️ the 70 %RH value is a
placeholder until the calibration in [SCO-204](https://linear.app/scout1/issue/SCO-204)) ·
`HUMIDITY_FAIL` (the SHT40 did not answer or failed its CRC; added in v2) — extend as
needed; keep them SCREAMING_SNAKE_CASE and documented here.

## Example

```csv
schema_version,buoy_id,timestamp_utc,record_seq,temp_c,turbidity_adc,turbidity_v,turbidity_fau,battery_v,uptime_s,audio_file,flags,soh,fw_version,internal_temp_c,internal_humidity_pct,lvl_anthro_cdb,lvl_mixed_cdb,lvl_bio_cdb,lvl_broad_cdb,ndsi_e4,snap_count,clip_count
3,SCOUT-01,2026-08-14T00:00:00Z,1,26.44,,,,3.31,60,,,,v0.1.0,24.10,38.2,,,,,,,
3,SCOUT-01,2026-08-14T00:30:00Z,2,26.42,514,1.66,,3.30,1860,,,,v0.1.0,24.15,38.3,,,,,,,
3,SCOUT-01,2026-08-14T08:00:00Z,17,26.51,498,1.61,,3.24,30660,20260814/080000Z.WAV,,,v0.1.0,25.02,38.9,-3972,-3006,-1068,-995,9975,2310,24
3,SCOUT-01,2026-08-14T12:00:00Z,25,27.05,,,,3.19,43260,,BATT_LOW_SKIP_TX|HUMIDITY_FAIL,WATCHDOG_RESET,v0.1.0,,,,,,,,,
```

## Relationship to the LoRa daily packet

The packet is not a row dump. Since 2026-10-16 the buoy transmits in **three fixed slots a
day — 00:10, 08:10 and 16:10 UTC — each packet carrying the latest reading**
([`facts.md`](../hub/facts.md), [SCO-196](https://linear.app/scout1/issue/SCO-196); it was one
packet a day before). It carries at least `timestamp_utc`, `record_seq` (as the packet
counter), the temperature and turbidity readings, and `battery_v`. The CSV is the full local record; the packet is what fits over radio. Raw audio is
**never** transmitted — it stays in `/AUDIO/` on the card. Since v3 the packet carries a
14-byte summary of the most recent recording instead (below).

### Packet layout (v3, 44 bytes)

Little-endian; the firmware (`firmware/lib/scout_packet`) and the shore decoder
(`shore/scout_shore/packet.py`) are byte-identical, and `scripts/check_packet_contract.py`
fails CI if they drift.

| Bytes | Field | Type | Encoding |
|---|---|---|---|
| 0 | `schema_version` | u8 | `3`; same number as the CSV |
| 1–2 | `buoy_id` | u16 | numeric; CSV renders `SCOUT-%02d` |
| 3–6 | `timestamp` | u32 | Unix epoch seconds, UTC |
| 7–10 | `record_seq` | u32 | monotonic counter |
| 11–12 | `temp_c` | i16 | °C × 100 |
| 13–14 | `turbidity_adc` | u16 | raw counts |
| 15–16 | `battery_mv` | u16 | millivolts |
| 17–20 | `uptime_s` | u32 | seconds |
| 21–22 | `flags` | u16 | per-cycle bits (`flags` vocabulary) |
| 23 | `soh` | u8 | State-of-Health bits |
| 24 | `audio_present` | u8 | 1 if the summary below is a real recording |
| 25–27 | `fw_major/minor/patch` | u8 ×3 | firmware version |
| 28–29 | `lvl_anthro_cdb` | i16 | centi-dB re full-scale sine, 0–200 Hz |
| 30–31 | `lvl_mixed_cdb` | i16 | 200–1,000 Hz |
| 32–33 | `lvl_bio_cdb` | i16 | 1–8 kHz |
| 34–35 | `lvl_broad_cdb` | i16 | broadband |
| 36–37 | `ndsi_e4` | i16 | NDSI × 10,000 |
| 38–39 | `snap_count` | u16 | saturating |
| 40–41 | `clip_count` | u16 | saturating |
| 42–43 | `crc` | u16 | CRC-16/CCITT-FALSE over bytes 0–41 |

v1 and v2 packets were bytes 0–27 plus a CRC (30 bytes). Both decoders still accept a 30-byte
frame with version 1 or 2 and give the acoustic fields as zero.

**Which recording a packet carries.** The most recent recording since the previous transmit
slot. Today recordings start at 00:00, 08:00 and 16:00 UTC and the slots are 10 minutes later,
so each packet carries the clip just before it. Every slot closes the window, sent or not, so a
recording is never reported twice. With no recording since the last slot, or in CONSERVE or
CRITICAL (which record nothing), the seven fields are zero and `audio_present` is 0. The CSV
leaves them blank instead, like the turbidity cells when that sensor is paused.

**How the summary is computed.** `analytics/utils/acoustic_summary.py` is the specification and
`firmware/lib/scout_acoustic` a bit-exact port, checked by golden vectors in
`firmware/test/test_acoustic`. 12-bit samples at 22,050 Hz are centred and scaled (×8), pass a
DC blocker (≈ 6.9 Hz), then Q14 Butterworth biquads on the shore pipeline's bands (4th-order
low-pass at 200 Hz; 2nd-order high- and low-pass pairs at 200/1,000 Hz and 1,000/8,000 Hz;
bilinear-transform formulas from the [Audio EQ Cookbook](https://www.w3.org/TR/audio-eq-cookbook/)).
Energies accumulate in 64 bits; levels come from an integer log2, referenced to a full-scale
sine (0 cdB). The constants and their reasons are in `firmware/src/config.h` (`ACOUSTIC_*`):

| Constant | Value | Meaning |
|---|---|---|
| Snap threshold | 8× running mean \|bio\| | Gaussian noise (mean \|x\| ≈ 0.8σ) never reaches 6.4σ; the louder, nearer snaps do |
| Snap floor | 8 ADC LSB | near-silence does not count quantisation noise |
| Refractory window | 66 samples (3.0 ms) | one snap counts once; caps the count at ≈ 334 snaps/s |
| Noise floor | 2¹² samples (≈ 186 ms), not updated during a snap | tracks the chorus, not the snaps |
| Warm-up | 2,048 samples (≈ 93 ms) | the floor settles before counting starts |
| Clip margin | 16 ADC counts from either rail | allows the SAMD21's few-LSB offset and a preamp that cannot reach the rails |
| Level reference | full-scale sine = 0 cdB | a square wave at full scale reads +3 dB; −32,768 = digital silence |

**Two numbers, two meanings — do not use them interchangeably:**

| Number | What it is | Where it lives |
|---|---|---|
| **44 bytes** | The **actual** encoded packet today (v3) — 42-byte body + 2-byte CRC. Was 30 B in v1/v2 | `SCOUT_PACKET_SIZE` (firmware), `PACKET_SIZE` (shore); CI-enforced byte-identical by `scripts/check_packet_contract.py` |
| **140 bytes** | The **payload ceiling** — the most a packet may grow to (since 2026-10-23, [SCO-97](https://linear.app/scout1/issue/SCO-97)) | `SCOUT_LINK_PAYLOAD_CEILING_BYTES` (firmware), `LORA_PAYLOAD_BUDGET_BYTES` (shore); CI checks they match and that a ceiling-size frame fits the send timeout |

The packet therefore has 96 bytes of headroom for future signals (110 before the acoustic summary). Earlier revisions of this
doc and `facts.md` quoted 82 B as though it were the packet size, which is what
[SCO-40](https://linear.app/scout1/issue/SCO-40) corrected; until 2026-10-23 82 B was also the
ceiling.

**Where 140 comes from.** The firmware's `send()` waits at most 2 s for the radio to finish
(`SCOUT_LINK_TX_BUDGET_MS`). At the shipped BW500 / SF12 / CR4-8, a 140-byte payload plus
RadioHead's 4-byte header takes 1,739 ms on air, under 90% of that timeout. The largest payload
that fits at all is ~158 B; the radio's own 251 B frame would take ~3.0 s and time out. At three
slots a day, one copy each (SCO-21, 2026-10-23), a full 140 B packet would cost about
0.16 mAh/day, 1.2% of the 13.3 mAh/day power budget (44 B today, 690 ms a send: 0.5%; it was 0.4% at 30 B). Reproduce with `scripts/lora_airtime.py`.

**Where the old 82 came from, and why it was never a real limit.** EDD §10's
82 bytes is not an arbitrary ceiling — it is the *sum of a specific proposed layout*: a
timestamp, **18 temperature values, 18 turbidity values**, battery voltage, status flags,
firmware version, and a CRC. That is a multi-sample packet built for the ESP32-C3 production
target. The as-built packet (30 B in v1/v2, 44 B in v3) is a different design: **one** reading per packet, three packets a
day, on
the Feather M0 build platform ([ADR-0001](../decisions/0001-mcu-and-radio-selection.md)), plus
fields the EDD layout never had (`record_seq`, `uptime_s`, `soh`, `audio_present`).

Using 82 B as a growth ceiling was a reinterpretation of that layout, not a derived limit, which
is why [SCO-97](https://linear.app/scout1/issue/SCO-97) replaced it with the timeout-derived
140 B. Consistent with
[CLAUDE.md standing rule 3](../../CLAUDE.md#standing-rules), the EDD's figure is
production-target analysis, not a spec for the Feather build.

## Open questions

- ~~**Turbidity units.**~~ ✅ Resolved by [SCO-13](https://linear.app/scout1/issue/SCO-13)
  (2026-08-31): the buoy ships **raw ADC counts**. `turbidity_adc` is canonical and is what the
  packet carries; `turbidity_v` is derived from it. `turbidity_fau` (named `turbidity_ntu`
  until 2026-10-23) stays an optional column
  computed **downstream in the analytics pipeline**, and only once a calibration curve exists
  ([SCO-12](https://linear.app/scout1/issue/SCO-12)) — until then it is empty. Rationale: raw
  counts are lossless, so a calibration can be revised and re-applied to historical data,
  whereas one baked in on-board cannot be undone. The sensor is not factory-calibrated, and a
  calibration needs formazin reference standards the team does not yet have.
- ~~**ADC full-scale.**~~ ✅ Resolved by the sensor change (2026-10-06): the Grove sensor runs at
  3.3 V into the 12-bit SAMD21 ADC with no divider, so `turbidity_v = turbidity_adc × 3.3 ÷ 4095`
  in both the firmware (`drivers/turbidity.h`) and the shore code (`schema.py`).
- ~~**Depth string count.**~~ ✅ Resolved by [ADR-0003](../decisions/0003-single-point-sensing.md):
  single-point sensing, so no `temp_c_NN` columns.
- ~~**SoH sensor — which part?**~~ ✅ The SHT40 (Adafruit 4885, bought 2026-10-06); driver,
  columns 15–16 and the `schema_version` 2 bump landed 2026-10-23
  ([SCO-205](https://linear.app/scout1/issue/SCO-205)). Still open: the alert threshold
  ([SCO-204](https://linear.app/scout1/issue/SCO-204) calibration). Was
  [SCO-60](https://linear.app/scout1/issue/SCO-60)
