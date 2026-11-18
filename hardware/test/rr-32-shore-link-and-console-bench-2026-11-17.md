# Shore Station — First Bench Run, Buoy to Console over LoRa and WiFi, 2026-11-17

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-32 · Partial (the whole chain works on the bench: shore radio up, 16 frames received and validated with no gap in `seq`, each one pushed to the console, the humidity alarm carried end to end; packet loss over 100+ frames, airtime, TX current and range not measured) |
| **Date, duration, who** | 2026-11-17, ≈ 22:00–23:00 PST (≈ 1 h for the measured part; the shore build and soldering came first), Isabella Rodriguez (with Claude for the steps and this record) |
| **Requirement tested** | R-11 link to shore (bench part); R-05 leak alarm path (alarm reaches the console, not the soak); runbook Stage 4a and 4b ([Requirements Test Matrix](../../docs/engineering/requirements-test-matrix.md)) |
| **Tracking issue** | [SCO-155](https://linear.app/scout1/issue/SCO-155), [SCO-24](https://linear.app/scout1/issue/SCO-24), [SCO-237](https://linear.app/scout1/issue/SCO-237) |
| **Record kind** | Prospective, with gaps: the pass marks are the R-11 matrix row (committed 2026-10-30) and the integration runbook's Stage 4a/4b PASS lists, both written before this run; the shore build, wiring and several metrics differ from the plan (B3) |

**Question.** Does a reading go from the bench buoy (Feather M0 RFM95) over LoRa to the ESP32-S3
shore station, and from there over WiFi to the team console, with valid frames, one a minute, and
the flags (including the housing humidity alarm) intact?

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Shore radio starts | S3 serial boot line | `radio=ok … errata=applied` | `radio=ok freq=915.0 modem=98,C4,4 errata=applied` | Pass |
| Frames valid | S3 `RX` / `OK` lines (length, CRC, version checked on the S3) | Every frame `OK`, 46 B | 16 of 16 `RX len=46` → `OK buoy=1` | Pass |
| Cadence | Packet `ts` | One frame a minute | 60 s apart (35 s once, right after the clock-set reset) | Pass |
| Loss (%) | `seq` and the S3's `n` counter | < 1 % over 100+ frames | 0 gaps in 16 frames | Not measured (too few frames) |
| Reaches the console | S3 `console:` line; console Fleet and Stations | `pushed 1 readings, 0 queued`; Fleet shows the buoy just now; station seen just now | Every frame pushed; SCOUT-01 **Live**, last heard just now; station **Live** | Pass |
| Humidity alarm end to end | Breath on the SHT40 | `0x0040` set while humid, cleared after; shown on the console | seq 13–14 `0x0340`, seq 15 `0x0300`; console "Housing humidity high ×2", 1 active issue | Pass |
| RSSI / SNR (dBm / dB) | S3 `RX` line | Record with distance | −28 to −40 dBm, SNR 6–7; distance Not recorded (same desk) | Recorded |
| Airtime, TX current, range | — | ≈ 0.76 s; ≤ 100 mA; ≥ 500 m | — | Not measured |

**How and steps.** Bench buoy on `feather_m0_bench` (transmits every 60 s), USB-powered on COM5;
shore station (ESP32-S3 Feather + RFM95W FeatherWing, joined by 8 jumpers) on COM6 with a serial
monitor; both on 915 MHz coil-spring antennas, on the same desk. Flash the shore, check `radio=ok`;
give it WiFi (phone hotspot) and a console token from its setup page; flash the buoy and set its
clock; watch frames arrive and reach the console; breathe on the SHT40 for one frame period.

**Result.** All 16 frames arrived valid at −28 to −40 dBm, one a minute, and each was pushed to the
console, where SCOUT-01 shows Live with 21.7 °C and 4.11 V. The humidity alarm went out on two
frames (`0x0340`), cleared on the next, and showed on the console.

**Does not establish.**

- Packet loss (< 1 % needs 100+ frames), airtime, TX current or any range beyond one desk.
- The shipped builds: the shore ran the example-key `_downlink` build, the buoy the bench build.
- Duplicate handling (`DUP`), the real slot schedule, or two buoys or two stations.

**Decision.** R-11 moves from Not run to Partial (bench chain shown). Next: a 100+ frame run for
loss, then TX current with a meter, then outdoor range ([SCO-24](https://linear.app/scout1/issue/SCO-24)).

---

## Part A — Plan (write and date before the run)

### A1. Purpose and risk retired
The project's MVP is one reading travelling buoy → LoRa → shore station → WiFi → console. Each
hop was written and unit-tested but had never run together on hardware: the shore station's radio
pins were provisional (runbook G8), its WiFi setup page and console push had never run on the
board, and the 11-15 LoRa report had no record. If any hop fails, the demo and every later field
test fail with it.

### A2. Hypothesis
If the FeatherWing's CS, RST and IRQ reach S3 pins 10, 11 and 9 and the station has WiFi and a
token, then every bench frame is received, validated and pushed to the console within seconds,
because the shore firmware validates each frame and queues it for the console task.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Radio start | — | S3 boot line | — | — | — |
| Frame validity | — | S3 `RX`/`OK` lines (length, CRC, version) | per frame | — | Shore codec unit-tested |
| Loss | % | `seq` gaps and the S3 `n` counter | 1 frame | — | — |
| RSSI, SNR | dBm, dB | SX1276 registers via RadioHead | 1 dBm, 1 dB | Not characterised | Not calibrated |
| Console arrival | — | S3 `console:` line; console Fleet, Stations, Dashboard | per frame | — | — |
| Housing humidity flag | bit | `flags` bit 6 (`HUMIDITY_HIGH`, threshold 70 %RH default) | 1 frame | SHT40 ±1.8 %RH (datasheet) | Not calibrated |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Humidity at the SHT40 (breath) for the alarm part only | Room air → breath → room air |
| Held fixed (controlled) | Boards, antennas, positions on the desk, USB power, 915 MHz modem settings, phone hotspot, console | Same through the run |
| Measured (dependent) | Frame validity, cadence, RSSI, SNR, flags, console arrival | See B2 |

### A5. Success metric (locked)

| # | Metric | Check | Pass if | Why this number | Source (spec, standard, model) |
|---|---|---|---|---|---|
| M1 | Shore radio starts | Present | `radio=ok … errata=applied` | A wrong CS/RST/IRQ jumper gives `radio=FAIL` | Runbook Stage 4b step 1; G8 |
| M2 | Frames valid | Present | Every frame decodes with a valid CRC, 46 B | Packet v5 is 46 B | R-11 row; runbook Stage 4a PASS |
| M3 | Cadence | Plausible | One frame a minute | The bench build sends every 60 s | Runbook Stage 4a PASS |
| M4 | Loss | Accurate | < 1 % over 100+ frames | R-11 | R-11 row; runbook Stage 4a PASS |
| M5 | Reaches the console | Present | `console: pushed`; Fleet shows the buoy's newest packet; Stations shows the station just now | Stage 4b PASS | Runbook Stage 4b PASS |
| M6 | Humidity alarm end to end | Plausible | `0x0040` set when humid and cleared after; shown on the console | The leak warning is only useful if it reaches people | R-05 row (path only); RR-25 breath test |
| M7 | RSSI and SNR | Other | Record with the distance | Range curve later | Runbook Stage 4a PASS |
| M8 | Airtime, TX current | Accurate | ≈ 0.76 s; ≤ 100 mA | Power budget | R-11 row; runbook Stage 4a PASS |

Locked on: 2026-10-30 (R-11 row of the requirements test matrix, commit `7dbcf68`); M1, M5 and M6 from the runbook Stage 4a/4b PASS lists and RR-25, all before this run.

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Design revision / file | Firmware `main` at `88e16c8` (2026-11-15). Buoy: `feather_m0_bench`. Shore: `feather_esp32s3_shore_downlink` (D-02) |
| Material and print settings | n/a |
| Configuration | **Buoy:** Feather M0 RFM95 + Adalogger (CR1220, microSD), DS18B20 and SHT40 as RR-25; 915 MHz coil spring in ANT. **Shore:** ESP32-S3 Feather (Adafruit 5477) + RFM95W FeatherWing (3231), 915 MHz coil spring in the wing's ANT hole; joined by 8 jumpers (D-01): 3V–3V, GND–GND, SCK, MO, MI, S3 10 → CS, S3 11 → RST, S3 9 → IRQ (wing's middle pads, header pins soldered; A–F pads unused) |
| Conditions | Indoors, both boards on one desk, USB power from one laptop |
| Sample size and replication | One buoy, one station; 16 frames |
| Control / reference article | None |
| Reference instrument or standard | None (frame contents checked by the shore codec) |
| Expected values | `radio=ok`; one `OK buoy=1` per minute; `flags=0x0300` (transmit count 3, no faults); RSSI far above the −120 dBm floor at this distance |
| Before you start (go/no-go) | Both antennas soldered before any power (no transmitting without an antenna); 8 jumpers checked pin by pin against the table, RST on the wing's middle pad, not the edge RST; USB unplugged while wiring |
| Data path | USB serial: shore on COM6 (115200, `pio device monitor`), buoy on COM5; console in the browser; screenshots |
| Stop and abort conditions | `radio=FAIL`; a board hot to the touch; frames that never arrive |
| Safety | USB power only; the setup network has no password (accepted for the capstone, [SCO-311](https://linear.app/scout1/issue/SCO-311)); bench only, per runbook G10 |

### A6a. Hazards, damage risks and failure modes

| What could go wrong | What happens | How you would notice | Fix or prevention |
|---|---|---|---|
| Transmitting with no antenna | Can damage the RFM95 | — | Springs soldered on both boards before power |
| Jumper on the wrong pin (3V/GND swapped) | Can damage a board | Hot board, no USB port | Checked against the table before power |
| Edge RST used instead of the radio RST pad | Board reset line held by the radio | `radio=FAIL` or resets | Use the middle `RST` pad |
| Upload cannot find the S3 | No new firmware | `Could not open COM6` | Hold BOOT, tap RESET → bootloader on another port (D-04) |
| Campus WiFi with a sign-in page | Station never online | No `wifi: connected` | Phone hotspot at 2.4 GHz |
| Console token leaked | Anyone can push readings | — | Kept off chat and files; revoke on Stations if it leaks |

### A7. Procedure

**Prerequisites checklist.** Both boards soldered and wired; PlatformIO Core 6.2.0; the console account
with Stations access; a phone hotspot on 2.4 GHz; `set_rtc_windows.ps1`, a Windows port of [`set_rtc.py`](../../firmware/tools/set_rtc.py) kept in the bench handoff folder (not in the repo).

| Step | Action | Record | Expected | Done |
|---|---|---|---|---|
| 1 | Flash the shore build; open its monitor | Boot line | `radio=ok … errata=applied` | ☑ (D-02, D-04) |
| 2 | Console → Stations → New token | Token (not written down) | Shown once, starts `scd_` | ☑ |
| 3 | Join `SCOUT-Setup-2DD4`; pick the hotspot, password, token; Save | Serial | `wifi: connected`, `time: set by ntp`; Stations shows Live | ☑ (D-03) |
| 4 | Flash `feather_m0_bench` on COM5; set the clock with `-Port COM5` | Script output | `OK: clock set to …` | ☑ |
| 5 | Watch the shore monitor for 15 min | `RX` and `OK` lines | One per minute, `flags=0x0300`, `console: pushed` | ☑ |
| 6 | Console → Fleet and Dashboard | Screenshots | SCOUT-01 Live, just now | ☑ |
| 7 | Breathe on the SHT40 for one frame period, then stop | Flags | `0x0340`, then `0x0300` | ☑ |

### A8. Analysis plan
Read every `RX` and `OK` line; count `seq` gaps for loss; compare `ts` steps with 60 s; decode the
flags into the transmit count (bits 8–9) and fault bits; match the console pages to the frames.

### A9. Curve required

| Curve | Axes and units | Standard or model compared against | Range to cover | Acceptance for the fit |
|---|---|---|---|---|
| None for this run | — | — | — | Pass/fail chain test; the RSSI-against-distance curve belongs to the range test |

### A10. Review and open questions

| Reviewer | Sent (date) | Feedback | Change made to Part A |
|---|---|---|---|
| Integration runbook (David) | Stage 4a/4b in the runbook before this run | Not recorded | None |

Open questions (David): confirm CS 10, RST 11, IRQ 9 as final and drop "PROVISIONAL" in
`shore_main.cpp`; provide the real `downlink_key.h` and `ota_pubkey.h` so the shipped shore build
can be flashed.

## Part B — Execution log (fill during the run)

### B1. Run record

| Item | Value |
|---|---|
| Start / end (date, time) | 2026-11-17: shore WiFi up 06:26:57 UTC (22:27 PST); frames 06:45:26–06:59:00 UTC (22:45–22:59 PST) |
| Operator | Isabella Rodriguez |
| Ambient conditions | Indoors; 21.7 °C at the DS18B20 |
| Instrument serials / IDs | Shore setup network `SCOUT-Setup-2DD4` (from the S3's MAC); console station `shore-1-bench`; buoy SCOUT-01 (ID 1) |

### B2. Raw data

All frames: [`lk-shore-frames-2026-11-17.csv`](evidence/rr-32-2026-11-17/data/lk-shore-frames-2026-11-17.csv);
screenshots in [`evidence/rr-32-2026-11-17/screenshots/`](evidence/rr-32-2026-11-17/screenshots/).

| Time (UTC) | Run / sample | Reading or observation | Reference value | Note |
|---|---|---|---|---|
| — | Shore boot | `radio=ok freq=915.0 modem=98,C4,4 errata=applied`; setup network open | — | M1, `lk-01` |
| 06:26:57 | Shore WiFi | `wifi: connected … rssi=-52`, `time: set by ntp`, later `setup network closed` | — | Stations: Live (`lk-02`) |
| — | Buoy flash + clock | `[SUCCESS]`; `OK: clock set to 1794984325` | — | `lk-03`; first hardware run of the Windows clock script |
| (1999-11-18) | rx 1, seq 1 | 21.69 °C, 4166 mV, `0x0310`, −37 dBm | — | Sent before the clock was set (RTC_LOST) |
| 06:45:26–06:48:00 | rx 2–5, seq 1–4 | 21.69–21.75 °C, 4107–4132 mV, `0x0300`, −35 to −40 dBm, SNR 6–7 | — | `lk-04`; seq restarts after the clock-set reset |
| 06:50:00–06:56:00 | rx 7–13, seq 6–12 | `0x0300`, −29 to −35 dBm | — | rx 6 (seq 5) not captured on screen |
| 06:57:00–06:58:00 | rx 14–15, seq 13–14 | **`0x0340`** (HUMIDITY_HIGH) | — | Breath on the SHT40 (`lk-07`) |
| 06:59:00 | rx 16, seq 15 | `0x0300` | — | Recovered (`lk-08`) |
| — | Console | Fleet: SCOUT-01 Live, just now, 3 a day; Dashboard: 21.75 °C QC pass, 4.11 V, 0 issues; after the breath: 1 active issue, "Housing humidity high ×2" | — | `lk-05`, `lk-06`, `lk-09` |

### B3. Deviations

| Time | What differed from A7 | Why | Effect on validity |
|---|---|---|---|
| Build | D-01: S3 and FeatherWing joined by 8 jumpers, not stacked; CS/RST/IRQ wired straight to S3 10/11/9 instead of through pads A/B/C | Header pins on the CS/IRQ/RST pads stood taller than the stacking headers | Same electrical connections as the stacked build with A→11, B→10, C→9 |
| Step 1 | D-02: flashed `feather_esp32s3_shore_downlink` (example keys), which the flashing guide marks "never flash" | The real `downlink_key.h` and `ota_pubkey.h` are not in the repo | Receive, validate and push paths are the same code; the shipped build itself is not tested. Bench only |
| Step 3 | D-03: setup page used from the laptop, WiFi from a phone hotspot (2.4 GHz) | Campus WiFi needs BroncoFi registration ([SCO-304](https://linear.app/scout1/issue/SCO-304)) | None on the metrics |
| Step 1 | D-04: first two uploads failed (`Could not open COM6`); manual bootloader (BOOT + RESET) put the S3 on COM7 | The automatic reset lost the port | None |
| Step 5 | D-05: 16 frames, not 100+ | One evening | M4 not measured |
| Whole run | D-06: airtime and TX current not measured | No multimeter | M8 not measured |

## Part C — Results and decision (fill after)

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 shore radio | `radio=ok … errata=applied` | — | Pass |
| M2 frames valid | 16 / 16, all 46 B | — | Pass |
| M3 cadence | 60 s (one 35 s step after a reset) | — | Pass |
| M4 loss | 0 gaps in 16 frames | Needs 100+ | Not measured |
| M5 console | Every frame pushed, 0 queued; Fleet and Stations Live | — | Pass |
| M6 humidity alarm | Set on 2 frames, cleared on the next, shown on the console | — | Pass |
| M7 RSSI / SNR | −28 to −40 dBm, SNR 6–7, same desk | — | Recorded |
| M8 airtime, TX current | — | — | Not measured |

**Overall:** Partial. Every hop of the chain works on the bench; the numbers R-11 asks for (loss, current, range) are still to measure.

### C2. Curve and analysis

No curve. RSSI ranged −28 to −40 dBm over the run with both boards still, a 12 dB spread at a
fixed distance, so a single reading is not a range figure. Flags decode as transmit count 3 (bits
8–9 = `0x0300`) with no fault bits, apart from RTC_LOST (`0x0010`) on the one frame sent before
the clock was set and HUMIDITY_HIGH (`0x0040`) during the breath. No frame showed HUMIDITY_FAIL
(`0x0080`), so the SHT40 read every time. The console's "9 of 21 expected" early on is its 7-day
window against a buoy minutes old, not loss.

### C3. Validity and limits

- **Sources of error:** a 16-frame sample; one desk distance; screenshots miss one `RX` line (rx 6) and one `OK` line's RSSI (rx 7).
- **What this does establish:** the FeatherWing works on CS 10, RST 11, IRQ 9; the S3 setup page, WiFi join, NTP and console push work on the board; frames and flags arrive intact on the console.
- **What this does not establish:** loss, airtime, TX current, range; the shipped (real-key) builds; downlink to the buoy; duplicates; two buoys or two stations; the 70 %RH threshold's suitability for a sealed housing (R-05 stays a Gap).
- **Not recorded or shortcut taken:** the distance between the boards; exact start times before 06:26 UTC; no photo of the jumpered station.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for the shore wiring and the WiFi/console path on the bench |
| Design change driven by this test | Mark CS 10, RST 11, IRQ 9 as confirmed in `shore_main.cpp` (G8) once David agrees |
| Re-run needed? | Yes, with the real-key `feather_esp32s3_shore` build once the keys exist |
| Next test | 100+ frame loss run, then TX current, then outdoor range ([SCO-24](https://linear.app/scout1/issue/SCO-24), [SCO-155](https://linear.app/scout1/issue/SCO-155)) |
| Issues filed | None new |

### C5. Evidence and traceability

- Data: [`lk-shore-frames-2026-11-17.csv`](evidence/rr-32-2026-11-17/data/lk-shore-frames-2026-11-17.csv)
- Screenshots: [`evidence/rr-32-2026-11-17/screenshots/`](evidence/rr-32-2026-11-17/screenshots/) (`lk-01` to `lk-09`; the hotspot name is cropped out)
- R-11 and R-05 → this test → [SCO-155](https://linear.app/scout1/issue/SCO-155); earlier: [RR-25](rr-25-controller-and-sensor-bring-up-2026-10-29.md) (buoy sensors and breath test over USB)

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](../../mechanical/test/risk-reduction-register.md).
