# On-Board CSV Data Schema (v1)

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
  SCOUT-01_20260814.csv     one file per UTC day: <buoy_id>_<YYYYMMDD>.csv
  SCOUT-01_20260815.csv
/AUDIO/
  SCOUT-01_20260814T003000Z.wav   audio referenced by the audio_file column
```

Each daily CSV starts with the header row below.

## Columns (v1)

| # | Column | Type | Unit | Example | Notes |
|---|---|---|---|---|---|
| 1 | `schema_version` | int | — | `1` | Bumped when columns change. Constant within a file. |
| 2 | `buoy_id` | string | — | `SCOUT-01` | Multi-buoy readiness; stable per unit. |
| 3 | `timestamp_utc` | string | ISO 8601 UTC | `2026-08-14T00:30:00Z` | From the PCF8523 RTC. Row key. |
| 4 | `record_seq` | uint32 | — | `48` | Monotonic counter since boot; also the LoRa packet counter. |
| 5 | `temp_c` | float | °C | `26.42` | DS18B20 water temperature, 2 dp (sensor is ±0.5 °C — see [sensor-selection](sensor-selection.md)). |
| 6 | `turbidity_adc` | uint16 | counts | `512` | Raw SEN0189 ADC reading. Always logged — it is the ground truth. |
| 7 | `turbidity_v` | float | V | `1.65` | Derived sensor voltage (ADC × Vref ÷ full-scale). |
| 8 | `turbidity_ntu` | float | NTU | `` | Only if a calibration curve is applied; otherwise empty. See open questions. |
| 9 | `battery_v` | float | V | `3.28` | Pack voltage via the divider on an ADC pin. Drives the skip-TX threshold. |
| 10 | `uptime_s` | uint32 | s | `172800` | Seconds since boot (State-of-Health). |
| 11 | `audio_file` | string | — | `SCOUT-01_20260814T003000Z.wav` | Filename in `/AUDIO/` if a recording was taken this cycle, else empty. |
| 12 | `flags` | string | — | `TEMP_TIMEOUT` | `|`-separated per-cycle event codes; empty when clean. |
| 13 | `soh` | string | — | `WATCHDOG_RESET` | `|`-separated device State-of-Health codes (set at boot); empty when healthy. |
| 14 | `fw_version` | string | — | `v0.1.0` | Firmware tag that wrote the row. |

### Optional / future columns (append at the end when the hardware lands)

- `internal_temp_c`, `internal_humidity_pct` — enclosure State-of-Health. **Not in the v1 BOM**
  (needs an added SoH sensor; the SAMD21 and PCF8523 provide neither reliably). Add when fitted.
- `temp_c_01`, `temp_c_02`, … — multi-depth temperature **only if** the vertical sensor string
  ([sensor-string-architecture](sensor-string-architecture.md)) is ever populated. Per
  [ADR-0003](../decisions/0003-single-point-sensing.md) the build is single-point, so v1 logs
  the one deployed DS18B20 in `temp_c` and these columns do not exist.
- `turbidity_ntu` becomes populated once a calibration exists.

### `soh` vocabulary (v1)

Device State-of-Health, set at boot and carried in every row/packet (distinct from the
per-cycle `flags`): `WATCHDOG_RESET` · `RTC_UNSET` · `SD_INIT_FAIL` · `LORA_INIT_FAIL`. A
recurring `WATCHDOG_RESET` means a cycle is hanging. Matches `SOH_BITS` in the packet codec.

### `flags` vocabulary (v1)

`SD_RETRY` · `TEMP_TIMEOUT` · `TURBIDITY_RANGE` · `BATT_LOW_SKIP_TX` · `RTC_LOST` — extend as
needed; keep them SCREAMING_SNAKE_CASE and documented here.

## Example

```csv
schema_version,buoy_id,timestamp_utc,record_seq,temp_c,turbidity_adc,turbidity_v,turbidity_ntu,battery_v,uptime_s,audio_file,flags,soh,fw_version
1,SCOUT-01,2026-08-14T00:00:00Z,1,26.44,,,,3.31,60,,,,v0.1.0
1,SCOUT-01,2026-08-14T00:30:00Z,2,26.42,514,1.66,,3.30,1860,,,,v0.1.0
1,SCOUT-01,2026-08-14T06:00:00Z,13,26.51,498,1.61,,3.24,21660,SCOUT-01_20260814T060000Z.wav,,,v0.1.0
1,SCOUT-01,2026-08-14T12:00:00Z,25,27.05,,,,3.19,43260,,BATT_LOW_SKIP_TX,WATCHDOG_RESET,v0.1.0
```

## Relationship to the LoRa daily packet

The 82-byte daily packet ([EDD §10, §14](engineering-design-document.md)) is a **summary**, not
a row dump. Per the [Team Timeline](../planning/team-timeline.md) Phase 2, it carries at least
`timestamp_utc`, `record_seq` (as the packet counter), a temperature summary, a turbidity
summary, and `battery_v`. The CSV is the full local record; the packet is what fits over radio.
Raw audio is **never** transmitted — it stays in `/AUDIO/` on the card.

## Open questions

- **Turbidity units.** Ship raw ADC + volts for v1 (uncalibrated), or invest in an NTU
  calibration curve? SEN0189 is not factory-calibrated; NTU needs reference standards.
- **ADC full-scale.** SAMD21 ADC is 12-bit (0–4095) but SEN0189 outputs up to ~4.5 V — the
  divider/front end (see [hardware/README](../../hardware/README.md)) sets how `turbidity_v` is
  computed. Lock this once the analog input is designed.
- ~~**Depth string count.**~~ ✅ Resolved by [ADR-0003](../decisions/0003-single-point-sensing.md):
  single-point sensing, so no `temp_c_NN` columns.
- **SoH sensor.** Is an enclosure temp/humidity sensor being added? If not, drop those
  optional columns from the plan.
