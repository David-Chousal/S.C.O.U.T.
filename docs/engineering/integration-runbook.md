# Hardware/Software Integration Runbook

> **Summary** — The single procedure for getting S.C.O.U.T.'s software onto its hardware and the
> whole chain running, bench to field: what to wire, what programs what, which commands to run,
> and what "working" means at each step. Written to be **executed by a Claude session** with a
> human doing only the physical work.
>
> **Rewritten 2026-10-19** against every decision since the 2026-09-10 version: two primary
> D cells and no solar ([ADR-0007](../decisions/0007-primary-cell-power-source.md)), the 3.3 V
> Grove turbidity sensor, P-FET sensor switches (LOW = on), standby wake on the SAMD21 RTC,
> three fixed transmit slots a day, an ESP32-S3 shore station instead of a Raspberry Pi, and
> over-the-air updates ([ADR-0008](../decisions/0008-over-the-air-firmware-updates.md)).
>
> **Stage numbers follow the [Electronics Build and Test Plan](electronics-build-and-test-plan.md)**
> (Isabella's Stages 1–9, which Linear issues cite). The build plan says *what* each stage must
> prove and what to buy; this runbook says *how* to do it on the software side.
>
> **Updated 2026-10-29** for the work since: packet v4 with a 1–3 daily transmit count
> ([SCO-198](https://linear.app/scout1/issue/SCO-198)), the team console
> ([ADR-0012](../decisions/0012-authenticated-console.md)), the ESP32-S3 shore firmware with its
> own WiFi push ([SCO-24](https://linear.app/scout1/issue/SCO-24),
> [SCO-237](https://linear.app/scout1/issue/SCO-237)) and the computer bridge fallback
> ([SCO-257](https://linear.app/scout1/issue/SCO-257)). §6 now says how to connect a buoy to the
> console so its readings update there automatically.
>
> **Status:** all parts for Stages 1–5 have arrived (2026-10-16); bench assembly started
> 2026-10-27. Stage 0 is re-verified on 2026-10-29. **Nothing in Stages 1–9 has been executed
> yet.** Read §2 before plugging anything in.

---

## 0. How to use this document

### The three markings

Every command and claim carries one of three states. **Never promote a claim to a stronger state
without evidence** — the value of this runbook is that it never overstates what is known.

| Mark | Means | You may rely on it |
|---|---|---|
| ✅ **VERIFIED** | Actually executed, with the date and output recorded here | Yes |
| ⚠️ **UNVERIFIED** | Derived from datasheets, the drawings, or code; never run on hardware | As a hypothesis to test |
| 🔴 **GAP / BLOCKED** | Something is missing or wrong; the stage cannot pass until it is fixed | No. Stop at the gate |

### Contract for a Claude session executing this

1. **Work the stages in order.** Each stage's preconditions are the previous stage's PASS criteria.
2. **Never advance past a failed gate.** If a PASS criterion is not met, stop and report.
3. **Never invent a pin, a part number, or a register value.** Every one is sourced below.
4. **Physical steps are the human's.** Wiring, plugging, power, submersion. Claude prepares the
   command and verifies the result; it does not pretend to have done the physical act.
5. **Report failures verbatim** ([Standing rule 5](../../CLAUDE.md#standing-rules)).
6. **Update this file as reality lands.** When a stage runs, change ⚠️ to ✅ with the date and real
   output. Measurements go into [`facts.md`](../hub/facts.md) **first**, then here.

### What only the human can do

Wiring and soldering · plugging boards into USB · applying power · anything needing a password,
including typing the WiFi password and the console device token into `shore_secrets.h` ·
measuring current or continuity · putting sensors in water · siting antennas · deploying.
**Claude must never type a password** ([CLAUDE.md → Repo gotchas](../../CLAUDE.md)).

---

## 1. Ground truth — what exists today (2026-10-29)

| Layer | State | Evidence |
|---|---|---|
| Firmware pure logic (packet codec v4, scheduler, link policy, downlink, acoustic summary, shore row builder, upload queue, shore clock) | ✅ 120 native tests pass, CI-gated | `pio test -e native`, 2026-10-29 |
| Buoy firmware target build | ✅ Compiles for the Feather M0: RAM 70.8%, Flash 27.7% (the audio buffers account for most of the RAM) | `pio run -e feather_m0`, 2026-10-29 |
| Firmware drivers (sensors, SD, RTC, radio, sleep, audio capture) | ⚠️ Written, never run on hardware | [`firmware/README.md`](../../firmware/README.md) |
| Buoy wiring reference | ✅ **Rev B drawing set (2026-10-12)** agrees with `config.h`; ⚠️ the Rev A KiCad schematic is stale (§2, G3). Electrical block diagram added 2026-10-28, reviewed by Dr. Krishnan, not yet approved | [Electronics Drawing Set](electronics-drawing-set.md), [block diagram](drawings/scout-electrical-block-diagram.pdf) |
| Buoy bench parts (Feather M0 RFM95, Adalogger, DS18B20, Grove turbidity, DMG2305UX, SHT40, antennas) | ✅ All arrived 2026-10-16 ([SCO-115](https://linear.app/scout1/issue/SCO-115)); headers soldered and stacked 2026-10-27; second Mouser order in transit (expected week of 2026-11-02) | [Purchase Log](../planning/purchase-log.md) |
| D cells and battery protection | 🔴 Not bought — "Later order 1", after Stage 2. Cell model not settled (§ Stage 6) | [Build plan](electronics-build-and-test-plan.md#stage-6--run-on-the-batteries) |
| Hydrophone (Aquarian H2dM) and antenna | 🔴 Not bought — decided 2026-10-28 to order this week through the department | [SCO-8](https://linear.app/scout1/issue/SCO-8), [SCO-158](https://linear.app/scout1/issue/SCO-158) |
| Shore station hardware (ESP32-S3 Feather + LoRa FeatherWing) | ✅ Arrived 2026-10-16, soldered 2026-10-27; ⚠️ the FeatherWing's CS/RST/IRQ jumpers (10/11/9) are not yet soldered (G8) | [SCO-86](https://linear.app/scout1/issue/SCO-86) |
| Shore station firmware (ESP32-S3): receive, validate, decode, dedupe, slot tag, **WiFi push to the console**, settings pull, NTP clock | ⚠️ Written and compiled (RAM 26.7%, flash 64.3% with WiFi), logic unit-tested, never run on the board | `firmware/src/shore_rx/`, [SCO-24](https://linear.app/scout1/issue/SCO-24), [SCO-237](https://linear.app/scout1/issue/SCO-237) |
| Settings downlink (`SET_TX_COUNT`, HMAC-signed) | ⚠️ Written, **off in every shipped build**; waits on Isabella's sign-off of the listen window and the FeatherWing's FCC check (G10) | [SCO-198](https://linear.app/scout1/issue/SCO-198) |
| Bench tooling: clock set (`set_rtc.py`), bench receiver (`feather_m0_rx`), transmit-every-minute build (`feather_m0_bench`), frame decoder (`decode_frames.py`) | ⚠️ Written and built, never run on hardware | [PR #186](https://github.com/David-Chousal/S.C.O.U.T./pull/186) |
| Shore software on a computer (decode, dedupe, CSV store, SD import, publish, **USB bridge from the S3**, console sync) | ✅ 129 tests pass on simulated data and a pseudo-terminal; Python, stdlib only | [`shore/`](../../shore/), [SCO-257](https://linear.app/scout1/issue/SCO-257) |
| Team console (Cloudflare Worker + D1): sign-in, roles, Fleet, Stations, Team, Audit, device API | ✅ **Live** at <https://scout-console.scout1.workers.dev> since 2026-10-26; 43 Worker and 41 front-end tests pass | [`console/`](../../console/README.md), [ADR-0012](../decisions/0012-authenticated-console.md) |
| Analytics pipeline | ✅ 289 telemetry tests and 29 acoustic-reference tests pass on simulated data | [`analytics/`](../../analytics/) |
| Public site + dashboard | ✅ Deployed (simulated data until real CSVs land in `shore/data-live/`) | [Live Dashboard](live-dashboard.md) |
| Firmware over-the-air updates | 🔴 Decided, not built — reflashing still needs USB | [ADR-0008](../decisions/0008-over-the-air-firmware-updates.md), [SCO-197](https://linear.app/scout1/issue/SCO-197) |

**Read this honestly:** every line of software is verified against *simulated* data. None of it
has met a real sensor, a real radio, or real water yet.

---

## 2. Gates — known gaps to fix or work around before the stage that needs them

Found in the 2026-10-19 rewrite and updated 2026-10-29. Each names the first stage it blocks.

| # | Gap | Blocks | Fix (owner) |
|---|---|---|---|
| **G1** ✅ fixed in code | **Nothing ever set the RTC**, so timestamps and the UTC transmit slots were wrong on a new board. Now: for ~8 s after a reset, with USB connected, the firmware accepts `T<unix-epoch>`; `firmware/tools/set_rtc.py` sends it. | Stage 1, 4, 5 | [PR #186](https://github.com/David-Chousal/S.C.O.U.T./pull/186), [SCO-201](https://linear.app/scout1/issue/SCO-201) — confirm on hardware that `RTC_LOST` clears |
| **G2** ✅ design / ✅ built / ⚠️ bench | **Shore data path.** The **ESP32-S3 + LoRa FeatherWing is the shore station**; it receives, validates and **pushes each reading to the team console over WiFi by itself** (decoded schema rows to `POST /api/device/readings`, decided 2026-10-25 in [ADR-0012](../decisions/0012-authenticated-console.md), written 2026-10-28). Fallbacks: a computer reading the S3 over USB ([SCO-257](https://linear.app/scout1/issue/SCO-257)) and the buoy's SD card. **Still open:** none of it has run on the board (Stage 4b). | Stage 4b–4c | CS lead ([SCO-237](https://linear.app/scout1/issue/SCO-237)) |
| **G3** ⚠️ | **The Rev A KiCad schematic still says `TEMP_DATA = D5`.** The Rev B drawing set, `pin-assignments.md` and `config.h` all agree on **D12**. | Nothing, if you wire from the Rev B drawing set | Update the KiCad schematic (ECE) |
| **G4** ✅ fixed in code | **SD file layout.** The firmware wrote `YYYYMMDD.CSV` at the card root and the importer matched `*.csv` case-sensitively, so a retrieved card merged nothing. Now `/DATA/YYYYMMDD.CSV` (8.3-safe), audio at `/AUDIO/YYYYMMDD/HHMMSSZ.WAV`, and a case-insensitive importer ([data-schema](data-schema.md#file-layout-on-the-sd-card)). | Card retrieval (§6) | [PR #186](https://github.com/David-Chousal/S.C.O.U.T./pull/186), [SCO-202](https://linear.app/scout1/issue/SCO-202) — confirm with a real card |
| **G5** ✅ fixed in code | **No receiver for the bench link test.** Now `feather_m0_rx` (a second Feather M0) and `shore/scripts/decode_frames.py`. | Stage 4a | [PR #186](https://github.com/David-Chousal/S.C.O.U.T./pull/186), [SCO-155](https://linear.app/scout1/issue/SCO-155) |
| **G6** ✅ fixed in code | **Forcing a watchdog reset for the Stage 5 test.** Now: env `feather_m0_wdt_test` (the bench build plus `-DSCOUT_WDT_TEST`) logs one reading, then hangs on its second cycle without petting the watchdog. The watchdog fires (~16 s) and the next boot reports `watchdog_reset=yes`. A boot the watchdog caused never hangs, so there is one forced reset per power-on or reset-button press. | Stage 5 | Added 2026-10-30 ([SCO-160](https://linear.app/scout1/issue/SCO-160)) — confirm on hardware |
| **G7** ⚠️ | **Audio capture is written but has never run.** `drivers/audio_capture.h` records a 60 s clip at 22.05 kHz three times a day ([ADR-0011](../decisions/0011-audio-capture-parameters.md)); the hydrophone has not been bought. (The 2026-10-19 version said no capture code existed; that was superseded.) | Stage 7 | Run it once the H2dM arrives (CSEN + ECE) |
| **G8** ⚠️ | **The shore FeatherWing's CS/RST/IRQ jumpers have no default.** `shore_main.cpp` assumes **CS 10, RST 11, IRQ 9**; the pads must be soldered to match and confirmed with ECE. | Stage 4a (S3 as receiver), 4b | Isabella |
| **G9** ⚠️ | **The shore station has no battery-backed clock.** After a power-on with no WiFi it has no time until NTP or `T<epoch>` over USB sets it: slot tags read `win=unknown` and the downlink holds off. Readings are unaffected (they carry the buoy's timestamp). | Nothing (a degraded mode) | ECE to decide on an RTC FeatherWing ([Shore Station](shore-station.md#open-items) item 6) |
| **G10** 🔴 | **The shore must not transmit off the bench** until the RFM95W FeatherWing's own FCC authorization is checked, and the buoy's 1 s listen window needs Isabella's power sign-off. Until both, the settings downlink stays off and a requested transmit count shows *Pending* on the console. | Changing a buoy's transmit count by radio | CS lead + Isabella ([Shore Station](shore-station.md#open-items) item 3) |

**Hard safety rule, not a gap:** **never connect a primary (Li-SOCl₂) cell to a Feather that still
has its MCP73831 charger.** Charging a primary cell is a fire hazard. The charger comes off the
deployment Feather before Stage 6 ([ADR-0007](../decisions/0007-primary-cell-power-source.md)).

---

## 3. Setup

### Toolchain

✅ **VERIFIED 2026-10-29** (Python 3.9.6, PlatformIO 6.2.0, Node 25.1 on the dev Mac).

| Tool | Version proven | Needed for | Install |
|---|---|---|---|
| Python | 3.9.6 locally; CI uses 3.12 | Shore, analytics, scripts | Preinstalled on macOS, or `brew install python@3.12` |
| PlatformIO Core | 6.2.0 | Buoy and shore firmware: build, flash, native tests | `pipx install platformio` (puts `pio` on the PATH; run it from `firmware/`) |
| ESP32-S3 toolchain | `espressif32@~6.9.0` (Arduino core 2.0.x) | Shore station firmware | Nothing to install: PlatformIO fetches it on the first `pio run -e feather_esp32s3_shore` |
| Node.js + npm | Node ≥ 22.13 (the Worker tests use its built-in SQLite); CI uses 24 | Team console: tests, build, deploy (`npx wrangler`) | `brew install node` |
| git, `gh` | — | Repo, PRs | Xcode CLT; `brew install gh` then `gh auth login` |

```bash
xcode-select --install
brew install gh node pipx && gh auth login   # keyring, NOT a GITHUB_TOKEN env var
pipx install platformio
```

**Do not export `GITHUB_TOKEN`**; `gh` prefers it over the keyring, so a stale value silently
breaks every `gh` command. (Older notes use `~/.scout-venv/bin/pio`; a venv works too, but every
command below assumes `pio` is on the PATH.)

### Deliberate constraints — do not "fix" these

- **`shore/` and `analytics/telemetry/` are standard-library only.** The USB bridge to the S3
  needs no serial library. The one exception is the fallback radio-on-a-Raspberry-Pi backend
  [`radio.py`](../../shore/scout_shore/radio.py), never run on hardware, which imports
  `adafruit-circuitpython-rfm9x` lazily so the test suite still runs on a bare machine.
- **The shore station's secrets are never committed.** `firmware/src/shore_rx/shore_secrets.h`
  (WiFi and the console device token) and `firmware/src/downlink_key.h` are gitignored; copy
  their `_example.h` files.
- **The `Arduino Low Power` library ID contains spaces** in `platformio.ini`.
  `arduino-libraries/ArduinoLowPower` does not resolve.

### Connecting the Feather M0 to the computer

These caught the first bench attempt (2026-10-16); check them before blaming the software.

- **Plug the USB cable into the Feather's own micro-USB port.** A computer cannot see the Feather
  through another board on the breadboard.
- **Use a data cable.** Charge-only cables power the board and carry no data. If a phone cannot
  transfer files over it, swap it.
- **On Apple Silicon Macs, approve "Allow accessory to connect?"** when macOS asks.
- **The port disappears while the board sleeps.** SAMD21 standby drops USB by design. To flash,
  **double-tap RESET**: the red LED pulses and a `FEATHERBOOT` drive appears.
- **One power source at a time.** Don't feed the Feather from USB and another board's 5 V rail at
  once, and **never put 5 V on a SAMD21 GPIO**: its pins are 3.3 V only, not 5 V tolerant.
- Find the port with `ls /dev/cu.usbmodem*` or `pio device list`.

### Connecting the ESP32-S3 shore station to the computer ⚠️ UNVERIFIED on this board

- **Use the S3 Feather's USB-C port** and a data cable. It shows up as `/dev/cu.usbmodem*` on a
  Mac, `/dev/ttyACM*` on Linux (stable name under `/dev/serial/by-id/`).
- **If an upload cannot find the board**, put it in its ROM bootloader: hold **BOOT**, press and
  release **RESET**, release **BOOT**, then upload again (Adafruit's procedure for this Feather).
  Press RESET after the upload to run the new firmware.
- The S3 stays awake (it is mains-powered and always listening), so its port does not vanish the
  way the sleeping M0's does.
- **Antenna on the FeatherWing before power**, and the CS/RST/IRQ jumpers soldered (G8).

---

## 4. What programs what

| Target | What runs on it | Toolchain | Source of truth | Programmed by |
|---|---|---|---|---|
| **Feather M0 RFM95** — the buoy | `firmware/src/` + `firmware/lib/` (C++, Arduino SAMD core) | PlatformIO → BOSSA over USB | `firmware/src/config.h` (pins, schedule, radio) | `pio run -e feather_m0 -t upload`, double-tap RESET |
| **ESP32-S3 Feather + LoRa FeatherWing** — **the shore station** | `firmware/src/shore_rx/`: LoRa receive and decode, dedupe, slot tag, **push to the console over WiFi**, read requested transmit counts, NTP clock; settings downlink only in a `SCOUT_DOWNLINK` build (off) | PlatformIO `espressif32` (Arduino core) | the buoy's `config.h` radio settings; `shore_secrets.h` (gitignored) for WiFi and the device token; [Shore Station](shore-station.md) | `pio run -e feather_esp32s3_shore -t upload` |
| **Second Feather M0** — bench receiver (optional test instrument) | `firmware/src/bench_rx/` | PlatformIO | the buoy's `config.h` | `pio run -e feather_m0_rx -t upload`. Since 2026-10-28 the S3 is the planned link-test receiver; this is the fallback |
| **A computer** — Python shore package | `shore/scout_shore/` (Python, stdlib): the **fallback path** when the S3 cannot reach WiFi (reads the S3 over USB, writes CSVs, pushes them to the console), SD-card import, Pages publishing, bench decoding | none | `shore/scout_shore/packet.py` (wire format), `schema.py` (row format) | `run_receiver.py --link serial`, `sync_console.py`, `import_sd_card.py`, `decode_frames.py` |
| **Cloudflare Worker + D1** — the team console | `console/worker/` (API) serving `console/web/` (static Next.js export) | Wrangler via `npx`, Node | `console/wrangler.toml`, `console/migrations/` | `npx wrangler deploy` from `console/` (after `npm run build` in `console/web`); needs the Cloudflare account owner |
| **Any machine** — analytics | `analytics/telemetry/` (Python, stdlib) | none | [data-schema.md](data-schema.md) | `python3 run_telemetry.py` |
| **GitHub Pages** — public site | generated HTML | `.github/workflows/pages.yml` | `analytics/telemetry/site/` | CI on push to `main`, hourly cron |
| **Cloudflare Worker** — "Fred" chat | `chatbot/worker.js` | Wrangler | `chatbot/wrangler.toml` | `wrangler deploy` (separate from the buoy chain) |

### The cross-language packet contract

`firmware/lib/scout_packet/` (C++) and `shore/scout_shore/packet.py` (Python) encode the **same
44 bytes** (packet **v4**; 30-byte v1/v2 frames still decode). `scripts/check_packet_contract.py`
compares them and fails CI on drift. **Change one, change all, and bump `SCOUT_PACKET_VERSION`.**

**The row contract (since 2026-10-28):** the S3 builds the console's schema rows in C++
(`firmware/lib/scout_console/`) and must match `shore/scout_shore/schema.py` `reading_to_row()` to
the character, rounding included, because the console keeps rows as sent and the computer bridge
and SD import build the same rows in Python. `firmware/test/test_console/row_vectors.h` is
generated from the Python (`cd shore && python -m scout_shore.row_vectors --write`) and
`shore/tests/test_row_vectors.py` fails CI if it drifts. Change `schema.py`, regenerate it.

### Pin map — the authority chain

`firmware/src/config.h` is what gets compiled; [`pin-assignments.md`](../../firmware/docs/pin-assignments.md)
documents it; the **Rev B** [drawing set](electronics-drawing-set.md) is what gets wired. All
three agree as of 2026-10-19. (The Rev A KiCad schematic does not — G3.)

| Signal | Pin | Notes |
|---|---|---|
| DS18B20 data | **D12** | 1-Wire, 4.7 kΩ pull-up to 3V3 |
| Turbidity analog | **A1** | Seeed Grove 101020752 at **3.3 V, wired direct, no divider** |
| Turbidity power switch Q1 | **D11** | DMG2305UX P-FET, 100 kΩ pull-up — **LOW = on** (`SENSOR_ON`) |
| Hydrophone power switch Q2 | **A3** | Same P-FET logic, digital output; held off until Stage 7 |
| Hydrophone preamp out | **A2** | Analog in (Stage 7) |
| Battery sense | **A7** | Feather onboard 100k/100k divider on `BAT` |
| microSD CS | **D10** | Adalogger; SPI shared with the radio |
| RFM95 CS / RST / IRQ | **D8 / D4 / D3** | On-board radio |
| RTC | **SDA/SCL** | PCF8523 at 0x68 (wall clock only); SHT40 at 0x44 later |
| D5, D6 | free | D5 was the old RTC wake pin; D6 reserved for radio IO1 |
| D13 | red LED | Forced **off** by firmware |

**SPI is shared** between the SD card (CS D10) and the radio (CS D8). If each works alone but not
together, suspect chip-select first.

### What the buoy firmware does — so you know what to expect

- **Boot:** prints a `boot:` line, latches both sensor switches **off**, turns the LED off, and
  **samples once immediately**.
- **Samples** at every :00 and :30 (UTC from the PCF8523) and logs one CSV row per sample.
- **Transmits** the latest sample **1–3 times a day** (default **3**; the range is pending
  Isabella's sign-off, [SCO-198](https://linear.app/scout1/issue/SCO-198)): 3 → 00:10, 08:10 and
  16:10 UTC; 2 → 00:10 and 16:10; 1 → 00:10 (`TX_SLOTS_SOD`). **One copy per slot** since
  2026-10-23 ([SCO-21](https://linear.app/scout1/issue/SCO-21)); CONSERVE sends slot 0 only, CRITICAL
  none. A missed slot is skipped, not retried. Each packet reports the count in use (v4, flags bits
  8–9).
- **Records audio** (once the hydrophone exists): a 60 s clip at 00:00, 08:00 and 16:00 UTC to the
  SD card, summarised into 14 bytes of the next packet ([ADR-0010](../decisions/0010-acoustic-summary-over-lora.md)).
- **Sleeps** in SAMD21 standby between events, waking on the SAMD21 RTC; it re-reads the PCF8523
  after every wake. **USB drops while asleep.**
- **Radio:** 915.0 MHz · BW 500 kHz · SF12 · CR 4/8 · **+11 dBm** — fixed by FCC compliance; do
  not narrow the bandwidth ([facts.md](../hub/facts.md), [FCC brief](../research/fcc-review-brief.md)).
  The buoy is **transmit-only** in every shipped build. A `SCOUT_DOWNLINK` build listens 1 s after
  each send for a signed `SET_TX_COUNT` (G10).

---

## 5. Stages

### Stage 0 — Prove the software with no hardware ✅ VERIFIED 2026-10-29

**Goal:** every later failure is a hardware or wiring failure, not a software one.

```bash
cd analytics && python3 -m unittest discover -s telemetry/tests -t . \
  && python3 -m unittest discover -s utils/tests -t . && cd ..
cd shore && python3 -m unittest discover -s tests && cd ..
python3 scripts/check_packet_contract.py
cd console && npm test && cd web && npm ci && npm test && cd ../..
cd firmware && pio test -e native && pio run -e feather_m0 -e feather_esp32s3_shore && cd ..
```

**PASS (as recorded 2026-10-29, on `main` with PRs #231 and #235):** 289 telemetry tests OK · 29
acoustic-reference tests OK · 129 shore tests OK · `bit maps OK — v4, 9 flags, 4 SoH bits`,
`payload ceiling OK — 140 B`, `downlink contract OK — 28 bytes` · 43 console Worker tests, 41
front-end tests · 120 native test cases · `feather_m0` `SUCCESS`, RAM 70.8%, Flash 27.7%.
**Re-run after every firmware change.** If any fails, stop: the problem is the environment.

---

### Stage 1 — First readings on USB power ⚠️ UNVERIFIED · [SCO-157](https://linear.app/scout1/issue/SCO-157), [SCO-25](https://linear.app/scout1/issue/SCO-25)

**Preconditions:** Stage 0 PASS · PR #186 merged (clock set, SD layout) · microSD formatted
FAT32 · CR1220 in the Adalogger.

**Wire (human), from the Rev B drawing set:**

1. Stack the Adalogger FeatherWing on the Feather M0 with stacking headers.
2. DS18B20: red → 3V3, black → GND, yellow (data) → **D12**, **4.7 kΩ** between data and 3V3.
3. Grove turbidity: set the switch on the Grove board to **A** (analog). Grove → male cable
   (713-110990210): red VCC → **3V3** (not 5 V), black → GND, yellow → **A1** (no divider), white
   not connected (cut short and insulate). The probe has its own cable to the board; only the probe
   tip goes in water. For this stage power it
   straight from 3V3; the P-FET switch arrives in Stage 3.
4. **Antenna on the RFM95** before the firmware runs — it can transmit at boot if a slot is due.

**Flash and watch (Claude):**

```bash
cd firmware
pio run -e feather_m0 -t upload      # double-tap RESET if the port is not found
cd .. && python3 firmware/tools/set_rtc.py              # press RESET once when asked
pio device monitor -d firmware -b 115200
```

`set_rtc.py` waits for the board, sends the current UTC time inside the firmware's 8 s boot
window, and prints `time: set to …`. Do it once per board, and again whenever the CR1220 is
removed.

**PASS:**

- The boot line reports every subsystem up:
  `boot: watchdog_reset=no rtc=ok sd=ok lora=ok start=cold resume_seq=0`
- A `seq=1 mode=NORMAL flags=- soh=-` line follows. `RTC_LOST` in flags means the clock was
  never set: run `set_rtc.py`.
- **Temperature** within ±0.5 °C of a reference thermometer, and it tracks a warm hand.
- **Turbidity polarity — the trap.** A **higher** ADC count means **clearer** water. Clear water,
  then a spoon of milk: **the count must go DOWN.** If it goes up, stop; the analytics chain
  depends on this sign ([facts.md](../hub/facts.md)). 50 consecutive readings vary < ~1%.
- **SD:** `DATA/YYYYMMDD.CSV` with the [data-schema](data-schema.md) header and one row per sample.
- **RTC** keeps time across a power cycle (unplug USB, wait, reconnect: no `RTC_LOST`).

| Symptom | Cause | Action |
|---|---|---|
| No port at all | Wrong USB port, charge-only cable, or unapproved accessory | §3, *Connecting the Feather M0* |
| Port vanishes after the first line | Standby dropped USB | Expected; double-tap RESET to reflash |
| `rtc=FAIL` | Adalogger not seated, or I²C | Reseat the stack |
| `sd=FAIL` | Card missing or not FAT32, or SPI CS conflict | Reformat; confirm CS D10 vs D8 |
| `lora=FAIL` | Radio not responding | On-board wiring is fixed (8/4/3); check the stack is not shorting pins |
| `TEMP_TIMEOUT` every cycle | DS18B20 on the wrong pin or no pull-up | D12 + 4.7 kΩ |
| Turbidity reads 0 | Sensor not powered | Stage 1 powers it from 3V3 directly |
| Turbidity jumps between two values | Grove board switch on **D** (digital threshold) | Set it to **A**. The board's knob sets sensitivity (Isabella's sensor review): don't move it once calibrated, and record its position |

---

### Stage 2 — Measure power and confirm the budget ⚠️ UNVERIFIED · [SCO-157](https://linear.app/scout1/issue/SCO-157), [SCO-23](https://linear.app/scout1/issue/SCO-23)

**Preconditions:** Stage 1 PASS.

**Power the Feather from a current-limited bench supply at 3.6 V into `BAT`, with USB unplugged**
(USB would power the board and hide the real draw). A bench supply is fine on `BAT` with the
charger still fitted; a primary cell is not (§2 safety rule). Meter in series.

**PASS:** 3.3 V rail = 3.3 V ±3% · **sleep current ≤ 500 µA** · turbidity draw and settle time
(≤ 1 s) recorded · daily use ≈ 13–15 mAh/day without the hydrophone.
**Record the real sleep current in [`facts.md`](../hub/facts.md) first, whatever it is** — it
decides battery life and whether [ADR-0007](../decisions/0007-primary-cell-power-source.md) can
be accepted.

---

### Stage 3 — Sensor switching ⚠️ UNVERIFIED · [SCO-157](https://linear.app/scout1/issue/SCO-157), [SCO-186](https://linear.app/scout1/issue/SCO-186)

**Wire (human)**, per the Rev B drawing set, sheet 7B: Grove VCC (red) now goes through **Q1**
(DMG2305UX on its SOT-23 adapter): source to 3V3, drain to the `TURB_3V3` node and the Grove VCC,
gate to **D11** with **R2 100 kΩ pull-up to 3V3**. C1 is a 100 µF 10 V electrolytic (watch the
polarity) and C2 0.1 µF ceramic next to Q1, both on the switched side. If the 3V rail dips more
than ~100 mV at turn-on, the drawing set says to change C1 to 10 µF †.

**The logic is inverted:** gate **LOW = sensor ON**. The firmware drives `SENSOR_ON`/`SENSOR_OFF`,
latches the gate off before making it an output, and re-asserts it off on every wake.

**PASS:** switched rail ≈ **3.3 V while sampling** and ≈ **0 V while asleep** (SCO-186's "done
when") · off current < 1 µA · readings after switch-on match always-on readings · no MCU reset
at switch-on (rail dip < ~100 mV).

---

### Stage 4 — Data transmission, buoy → shore ⚠️ UNVERIFIED · [SCO-155](https://linear.app/scout1/issue/SCO-155), [SCO-98](https://linear.app/scout1/issue/SCO-98), [SCO-24](https://linear.app/scout1/issue/SCO-24)

> ⚠️ **Never power an RFM95 without its antenna.** Transmitting unterminated can destroy the PA.

**4a — Bench link** (SCO-155 + SCO-98). **Receiver: the ESP32-S3 shore station** (decided
2026-10-28; no second Feather M0 needed): flash `feather_esp32s3_shore` as in 4b (WiFi can stay off)
and watch its USB output, or feed it to `shore/scripts/decode_frames.py`, which reads the S3's `RX`
lines unchanged. The second-Feather receiver below is the fallback if the S3 is not ready (G8).

```bash
cd firmware
# Second Feather (the receiver), antenna on:
pio run -e feather_m0_rx -t upload
# Buoy Feather, antenna on: the bench build samples and transmits every minute
pio run -e feather_m0_bench -t upload
cd .. && python3 firmware/tools/set_rtc.py
# Watch the receiver and decode as frames arrive (use the receiver's port):
pio device monitor -d firmware -e feather_m0_rx -p <receiver port> \
  | python3 shore/scripts/decode_frames.py --out /tmp/bench-data
```

`feather_m0_rx` is built from the buoy's own `config.h` (915.0 MHz, `{0x98, 0xC4, 0x04}`), and
applies the **SX1276 500 kHz erratum** (`0x36` ← `0x02`, `0x3A` ← `0x64`; `spiWrite` is public
in RadioHead, no subclass needed). It prints `bench_rx: radio=ok … errata=applied` at boot, then
`RX len=44 rssi=… snr=… hex=…` per frame (44 bytes since packet v3/v4). `feather_m0_bench`
prints a warning at boot; **reflash `feather_m0` before anything leaves the bench.**

**PASS:** frames decode and pass CRC in `decode_frames.py` · one frame per minute, one row each
(the buoy sends one copy per slot since 2026-10-23) · on the bench, < 1% loss over 100+ frames ·
time on air ≈ **0.69 s** for the 44-byte packet (`SCOUT_LINK_AIRTIME_MS` 691;
`scripts/lora_airtime.py`) · TX current ≤ 100 mA · RSSI and SNR recorded with the distance. **Record the results on SCO-155 and SCO-98**;
the register values and sensitivity become verified only here. Then try the real schedule: flash
`feather_m0`, set the clock a few minutes before a slot, and confirm the slot transmission.

**4b — The shore station: ESP32-S3 + LoRa FeatherWing, pushing to the console** ⚠️ UNVERIFIED ·
[SCO-24](https://linear.app/scout1/issue/SCO-24), [SCO-237](https://linear.app/scout1/issue/SCO-237).
Firmware written (receive 2026-10-23, WiFi push 2026-10-28), never run on the board.

**Preconditions:** 4a frames decode · FeatherWing jumpers soldered (G8) · antenna on · a WiFi
network the S3 can join (2.4 GHz; no captive sign-in page) · a **device token** from the console
(§6, *Connect a buoy to the console*, step 1).

1. **Secrets (human types them; Claude never does).** Copy
   `firmware/src/shore_rx/shore_secrets_example.h` to `shore_secrets.h` (git ignores it) and fill
   in the WiFi name and password and the device token. An admin creates the token on the console's
   **Stations** page, which shows it once. **Without this file, WiFi stays off** and the station
   works over USB exactly as before (4a, and the computer bridge in §6).

   ```bash
   cp firmware/src/shore_rx/shore_secrets_example.h firmware/src/shore_rx/shore_secrets.h
   # then edit shore_secrets.h: SHORE_WIFI_SSID, SHORE_WIFI_PASSWORD, SHORE_CONSOLE_TOKEN
   ```

2. **Flash `feather_esp32s3_shore` and watch.**

   ```bash
   cd firmware
   pio run -e feather_esp32s3_shore -t upload        # BOOT + RESET if the port is not found (§3)
   pio device monitor -e feather_esp32s3_shore
   ```

   Expect, in order: `shore_rx: radio=ok … errata=applied` · `wifi: joining <network>` ·
   `wifi: connected ip=… rssi=…` · `time: set by ntp to …` · then, after the bench buoy's packet,
   the `RX …` and `OK buoy=1 seq=… win=in tx=3/0` lines and **`console: pushed 1 readings, 0 queued`**.
   Within 10 min it also prints `console: requested …` if anyone has asked for a transmit count.

**PASS:**

- The buoy's reading appears on the console: **Fleet** shows its "newest packet" time and the
  count it reports; **Stations** shows the shore station's token last seen just now.
- One row per reading: a repeated frame prints `DUP` on the S3 and adds nothing on the console.
- **Offline queue:** switch the WiFi off, let a packet arrive (`console: push failed (…), 1 queued`
  or `wifi: lost`), switch it back on: the queued reading is pushed and appears on Fleet.
- **Clock fallback:** with the clock set by NTP, press RESET with WiFi off; the boot line reads
  `time: kept across the reset`, and `win=` still reads `in` or `out`, not `unknown`. (This relies
  on the ESP32's RTC timer surviving resets, per the ESP-IDF docs; it is the claim this step tests.)
- No `RX` line is ever split by a `wifi:`/`console:` line (the computer bridge depends on it).

The S3 must also keep its transmit antenna **≤ 2.15 dBi**, and must not transmit off the bench
until G10 is cleared ([FCC brief](../research/fcc-review-brief.md#outcome--reviewed-2026-10-16)).

**4c — Dedupe.** Each slot sends one copy (SCO-21, 2026-10-23), but the same reading can still
arrive twice: a re-received frame, the S3 and the computer bridge both pushing, or an SD-card import
of a reading the radio already delivered. Every layer collapses those to **one** row on
`(buoy_id, record_seq)`: the S3's own dedupe (`lib/scout_dedupe`, recent readings), the console's
store (`INSERT OR IGNORE` on that pair), and the Python CSV store. Duplicate rows would inflate QC
completeness and hide real gaps. **PASS:** the same frame received twice, and the same reading
pushed by both the S3 and `sync_console.py`, each leave one row on the console.

**4d — Outdoor range** with the spring antennas, line of sight, RSSI logged (aim ≥ 500 m). Real
over-saltwater range is still unmeasured ([SCO-14](https://linear.app/scout1/issue/SCO-14)).

---

### Stage 5 — Whole system under firmware control ⚠️ UNVERIFIED · [SCO-160](https://linear.app/scout1/issue/SCO-160), [SCO-165](https://linear.app/scout1/issue/SCO-165)

**Preconditions:** Stages 1–4a PASS · clock set with `set_rtc.py` (the slots run on UTC) ·
the deployment build `feather_m0`, not `feather_m0_bench`.

Run 24 h unattended on the bench supply. Read the SD card afterwards rather than the serial
monitor (USB drops in standby).

**PASS:**

- **48 samples and 3 transmit slots in 24 h**, at :00/:30 and 00:10/08:10/16:10 UTC, none missed.
- `record_seq` increments by one per sample and **continues after a reset** (`resume_seq`).
- **Watchdog:** a forced hang resets the buoy and the next boot says `watchdog_reset=yes` (G6).
  Run it apart from the 24 h run, with the test build: `pio run -e feather_m0_wdt_test -t upload`.
  About a minute after boot it hangs (it prints `wdt_test: hanging` if USB is still up); about
  16 s later it resets. On the SD card, the next row's `soh` carries `WATCHDOG_RESET` and its
  `record_seq` follows the row before the hang; no second hang follows. Reflash `feather_m0`
  afterwards: the test build must never be deployed.
- D13 LED stays off; the switched rail is ≈ 0 V between samples.
- 24 h average current within budget (≈ 0.56 mA).

---

### Stage 6 — Run on the batteries ⚠️ UNVERIFIED · [SCO-159](https://linear.app/scout1/issue/SCO-159), [SCO-150](https://linear.app/scout1/issue/SCO-150) · parts not bought

**Preconditions:** Stage 2 PASS (it justifies the battery order) · **the MCP73831 charger removed
from the deployment Feather** (§2 safety rule). *When:* the Rev B drawing set (sheet 7) removes it
at the end of Stage 3; the build plan lists it under Stage 6. Either is safe as long as it happens
before any primary cell is connected.

Two primary lithium D cells in parallel, each through **two MAX40200 ideal diodes** (replacing the
LM66100 pair, 2026-10-28, [SCO-150](https://linear.app/scout1/issue/SCO-150)), then a PTC fuse and a keyed
connector into `BAT` ([ADR-0007](../decisions/0007-primary-cell-power-source.md); packaging in the
electronics housing per the 2026-10-15 decision). **Check connector polarity by hand before the
first connection** ([SCO-84](https://linear.app/scout1/issue/SCO-84)).

⚠️ **The cell model is not settled, and the docs disagree:** [`facts.md`](../hub/facts.md) says
"model TBD"; Isabella's 2026-10-28 power check used **TL5930/T** cells (≈ 28 months typical,
≈ 15 months pessimistic, [SCO-223](https://linear.app/scout1/issue/SCO-223)); this runbook named
the Saft LS33600 until 2026-10-29. Settle it in `facts.md` first, then here
([SCO-267](https://linear.app/scout1/issue/SCO-267)).

**Battery telemetry:** A7 reads `BAT`, so it reads the cell. The power-mode thresholds
(`BATTERY_CONSERVE_MV` 3200, `BATTERY_CRITICAL_MV` 3100) are provisional, and a Li-SOCl₂ curve is
flat, so voltage is a poor fuel gauge ([SCO-83](https://linear.app/scout1/issue/SCO-83)). On USB
power A7 reads the charger output, not a battery; don't tune thresholds against it.

**PASS:** with USB connected, **0 µA flows into the battery** · battery ≥ 3.35 V during transmit
· 7 days on battery, extrapolating to ≥ 12 months.

---

### Stage 7 — Hydrophone ⚠️ UNVERIFIED · [SCO-231](https://linear.app/scout1/issue/SCO-231) · parts not bought; firmware written, never run (G7)

Aquarian H2dM on 3.5 mm plug-in power, biased from 3.3 V through 1.1 kΩ, preamp out to **A2**,
power switch Q2 on **A3** (LOW = on). Values in the [drawing set](electronics-drawing-set.md#hydrophone-front-end-values).
Raw audio stays on the SD card and is **never** sent over LoRa.

Firmware: `drivers/audio_capture.h` records one 60 s clip at 00:00, 08:00 and 16:00 UTC to
`/AUDIO/YYYYMMDD/HHMMSSZ.WAV` ([ADR-0011](../decisions/0011-audio-capture-parameters.md)). The
serial log prints `audio: ok samples=1323000` or `audio: FAILED reason=<n>` (1 SD open, 2 DMA,
3 stalled, 4 overrun, 5 SD write). Use the bench build to hit a recording hour quickly by
setting the clock to 07:59 UTC.

**PASS:** 1-min clips at 22.05 kHz on schedule with `samples=1323000` every time; a 1 kHz test
tone reads 1 kHz in the WAV; recording current ≤ ~76 mA (estimate ≈ 56 mA); clips run cleanly
through the acoustic pipeline; power budget re-run with the measured draw.

---

### Stage 8 — Sealed in the housing ⚠️ UNVERIFIED · [SCO-161](https://linear.app/scout1/issue/SCO-161), [SCO-162](https://linear.app/scout1/issue/SCO-162)

**Preconditions:** Stages 1–6 PASS on the bench. **Never seal an unverified board** — until
ADR-0008 is built, every firmware fix means opening the housing.

Electronics housing: 4.4 in ID × 5 in, sealed with the AS568-247 O-ring; FCC label
"Contains FCC ID: 2ASEORFM95C" already engraved. Antenna via uFL → SMA bulkhead to a whip of
**≤ 2.15 dBi** (FCC grant limit). SHT40 for internal humidity, desiccant, conformal coat, **PG11 cable
glands** from lab stock for the housing penetrations (decided 2026-10-29,
[facts.md](../hub/facts.md)). No solar.

**PASS:** 7–14 days sealed, ≥ 95% of packets received, no resets, internal humidity low and
flat, range test with the real antenna at buoy height over water.

---

### Stage 9 — Prototype deployment ⚠️ UNVERIFIED · [SCO-143](https://linear.app/scout1/issue/SCO-143)

**Do not deploy unless every stage above is PASS.**

Sites ([Deployment Strategy](../planning/deployment-strategy.md)): Monterey Bay or Santa Cruz for
systems and survivability tests only; Hawaii for reef data (first from the Kāneʻohe Yacht Club
slip). **Tethered to an existing authorized structure, no anchor of our own** (permitting path B).
Depth **2–8 m**. MVP target **2026-12-04** (hard limit 12-11): floats and self-rights, one
temperature and one turbidity reading, a packet reaches the shore.

Before deploying: clock set and verified · `record_seq` checked · SD card empty and seated ·
antifouling applied · shore link tested at true range · the shore station on the site's WiFi
and pushing to the console (or the computer fallback running, §6) · a buoy ID unique to this
deployment.

**PASS:** data arrives every slot for the whole test; temperature matches a reference logger; no
leaks; battery use on track for 12 months.

---

## 6. After reception — the console, pipeline, publish, and card retrieval

### Connect a buoy to the console, so its readings update there automatically ⚠️ UNVERIFIED end to end

The team console (<https://scout-console.scout1.workers.dev>, [`console/`](../../console/README.md))
is where readings land live and where a buoy's transmit count is changed. Once these steps are
done, every reading the shore station hears shows up on the console with no one running anything.

1. **Create the shore station's device token** (admin). In the console, open **Stations**, name
   the station (e.g. `shore-1 bench`) and create a token. It starts `scd_` and is **shown once**:
   copy it straight into the next step. It can only push readings and read requested transmit
   counts; **revoke** it on the same page if it leaks, then make a new one. *(Signing in: the first
   admin is created with `node console/scripts/create-admin.mjs`, which asks for the password itself
   and sends only its hash; everyone else joins by an invite from the **Team** page. Claude never
   types a password.)*
2. **Give the token to the shore station.**
   - **Normal path: the S3 itself.** Put the token and the site's WiFi in
     `firmware/src/shore_rx/shore_secrets.h` and flash it (Stage 4b, steps 1–2).
   - **Fallback: a computer reading the S3 over USB**, where the S3 cannot reach WiFi. Plug the S3
     into the computer and run (the token goes in the environment, never in a file in the repo):

     ```bash
     cd shore
     python3 scripts/run_receiver.py --link serial --serial /dev/cu.usbmodem1101 --out data-live
     # in another terminal, every few minutes (e.g. from cron):
     SCOUT_CONSOLE_URL=https://scout-console.scout1.workers.dev SCOUT_CONSOLE_TOKEN=scd_… \
       python3 scripts/sync_console.py --data data-live
     ```

     `sync_console.py` pushes the newest CSVs (repeats are ignored) and prints the requested
     counts as `N<buoy>:<count>` lines; with `--serial <port>` it writes them to the S3.
3. **Give each buoy a unique ID before flashing it.** The ID is `BUOY_ID` in
   `firmware/src/config.h` (1 → `SCOUT-01`). Two buoys with the same ID would be merged into one on
   the console, and readings whose sequence numbers collide would be silently dropped.
4. **The buoy appears by itself.** Its first reading creates it on **Fleet** as `SCOUT-01`, `SCOUT-02`, … (the ID,
   zero-padded to two digits). An
   admin can also add it ahead of time on Fleet (ID and name), and a member can rename it on
   **Settings → Buoys**.
5. **Watch it update.** Each reading reaches the console seconds after the shore station hears
   it (the S3 pushes at once and retries if offline; the computer path when `sync_console.py`
   next runs). **Fleet** shows each buoy's newest packet time and the transmit count it reports;
   **Stations** shows when each shore station's token was last used.
6. **Changing the transmit count from the console** (member). Pick 1–3 on **Fleet**. The S3 reads
   it within 10 minutes (or `sync_console.py` prints it), and the buoy shows **Pending** until its
   next packet reports the new count, then **Confirmed**. ⚠️ Getting it to the buoy needs the
   settings downlink, which is **off in every shipped build** (G10), so until then a request stays
   Pending. Every other firmware setting (shown read-only on **Settings → Buoys**) needs a reflash.

**PASS:** the bench buoy's readings appear on Fleet at every slot with no one at a keyboard, for
at least a day; Stations shows the station's token in use; a buoy that misses a slot shows its
"newest packet" age growing.

**What the console does not do:** the public dashboard on GitHub Pages is still built from CSVs
committed to `shore/data-live/` (next section). Readings pushed to the console do not reach it
by themselves.

### Pipeline and publish ✅ verified with simulated data; ⚠️ with real data

```bash
cd analytics
python3 run_telemetry.py --source ../shore/data-live --mmm <site MMM> --out data/processed --web ../site
```

**`--source ../shore/data-live`, never `../shore/data`.** `shore/data/` is gitignored scratch
that CI regenerates from the simulator every hour. `--mmm` is the site's NOAA CRW Maximum
Monthly Mean; without it DHW is skipped.

Publishing is automatic: `pages.yml` deploys on push to `main` and hourly, and
[`publish.py`](../../shore/scout_shore/publish.py) builds from real CSVs in `shore/data-live/`
when any exist, the simulator otherwise. **PASS:** with real CSVs committed, the dashboard shows
**no** sample-data banner.

### On every retrieval — merge the SD card back in

The card is the **complete** record: every reading the radio missed exists only there, the
housing's internal temperature and humidity never fit in the packet, and the raw audio is
nowhere else.

```bash
cd shore
python3 scripts/import_sd_card.py --card /Volumes/<card> --into data-live --dry-run   # inspect first
python3 scripts/import_sd_card.py --card /Volumes/<card> --into data-live
```

The importer reads `DATA/YYYYMMDD.CSV` (G4, fixed in PR #186; confirm with the first real card)
and takes the `buoy_id` from the rows. Copy `/AUDIO/` off the card before reusing it; raw audio
exists nowhere else.

### If a computer runs the fallback path as a service

The S3 pushes to the console itself (Stage 4b). Where it cannot reach WiFi, a Linux computer with
the S3 plugged in over USB can stand in, run as a service so a reboot does not silently stop it.
The unit runs `run_receiver.py --link serial` as the `pi` user in the `dialout` group; set
`--serial` to the S3's name under `/dev/serial/by-id/` first ([`shore/README.md`](../../shore/README.md)):

```bash
ls /dev/serial/by-id/                       # the S3's stable port name → the unit's --serial
sudo cp shore/deploy/scout-shore.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now scout-shore
journalctl -u scout-shore -f
```

There is no unit for `sync_console.py` yet; run it from cron (§6, *Connect a buoy*, step 2).

The analytics pipeline needs a 64-bit host: on 32-bit armv7l nine of its packages have no wheel
(check with `python3 scripts/check_arm_wheels.py`). The shore package itself is stdlib-only.

---

## 7. Failure playbook

| Symptom | First suspicion | Why |
|---|---|---|
| Computer shows no port | Wrong USB port, charge-only cable, accessory prompt | §3 — the Feather's own micro-USB, a data cable |
| Timestamps wrong, `RTC_LOST` set | The clock was never set | Run `firmware/tools/set_rtc.py` and press RESET once |
| No transmissions on the bench | Not in a slot, or the clock is wrong | `feather_m0` sends only at 00:10/08:10/16:10 UTC; use `feather_m0_bench` for the link test |
| Receiver prints nothing | Settings or antenna | Both boards built from the same `config.h`; antennas on both; `bench_rx: radio=ok` at boot |
| Buoy sleeps and never wakes | SAMD21 RTC alarm not firing | Check the 32.768 kHz crystal; the wake no longer uses `INT1` |
| Temperature never reads | DS18B20 not on D12, or no 4.7 kΩ pull-up | Wire from the Rev B drawing set, not Rev A KiCad (G3) |
| Turbidity rises in dirty water | Polarity | Higher ADC = clearer; the Grove output must fall as turbidity rises |
| Sensors read nothing | Gate polarity | LOW = on; a stale build with the old HIGH = on logic leaves them dark |
| SD and radio work alone, not together | Shared SPI chip select | Only one of D10 / D8 may be active |
| Link weak, antenna fine | SX1276 500 kHz erratum not applied on the receiver | `0x36` ← `0x02`, `0x3A` ← `0x64`; `bench_rx` prints `errata=applied` |
| Duplicate CSV rows for one reading | Shore dedupe broken | Rows must be unique on `(buoy_id, record_seq)` |
| Reboot mid-transmit | Airtime over the watchdog budget | Compare against `SCOUT_LINK_AIRTIME_MS` (691 ms for the 44-byte packet) |
| SD import finds nothing | Card written by firmware older than PR #186 | Old builds wrote `YYYYMMDD.CSV` at the root; point the importer at the card root, and update the firmware |
| Battery voltage implausible on USB | A7 reads the charger output | Expected; only trust A7 on the cells (SCO-83) |
| Completeness 0%, expected records absurd | A clock-invalid row | `RTC_LOST`/1970 rows are excluded from timing (`clock_invalid`) |
| Dashboard shows sample data after go-live | Publishing from the wrong directory | Real CSVs belong in `shore/data-live/` |
| S3 prints `wifi: off (no src/shore_rx/shore_secrets.h)` | Secrets file missing | Copy `shore_secrets_example.h` to `shore_secrets.h`, fill it in, reflash (4b) |
| `wifi: joining …` and never `connected` | Wrong password, a 5 GHz-only network, or a captive sign-in page | The S3 needs plain 2.4 GHz WPA2; otherwise use the computer fallback (§6) |
| `console: device token refused (401)` | Token revoked, mistyped, or from another console | Make a new one on **Stations**, update `shore_secrets.h`, reflash |
| `console: push failed (-1)` while WiFi is up | No internet past the WiFi, or a TLS failure | Check the site's internet; if Cloudflare moved the console to a CA outside `console_ca.h`, update that file. Readings stay queued (256) meanwhile |
| `win=unknown` on every `OK` line | Shore clock unset: power-on with no WiFi | Restore WiFi (NTP) or run `firmware/tools/set_rtc.py` against the S3 (G9) |
| Buoy never appears on Fleet | Nothing reaching the console | Check the S3 shows `console: pushed`; check Stations for the token's last use |
| Transmit count stuck on **Pending** | The downlink is off in shipped builds | Expected until G10 is cleared |
| A `RX` line looks cut in two | Old shore firmware | Builds from 2026-10-28 write each line in one call; reflash |

---

## 8. What Claude cannot do

Wire, solder or power anything · measure current, voltage or continuity · put a sensor in water ·
type a password, including the WiFi password and console token in `shore_secrets.h` · create the
console's first admin · flash a board the human has not connected · confirm any ⚠️ claim without
hardware output.

**Claude can:** run Stage 0 · build and flash a connected board · read serial output · decode
frames · drive the shore, console and analytics chain · check the console for a buoy's readings ·
diagnose from real output · and update this runbook as stages are proven.

## 9. Keeping this document true

When a stage runs, change ⚠️ → ✅ with the date and the real output. When a measurement lands
(sleep current, range, airtime, RSSI), it goes in [`facts.md`](../hub/facts.md) **first**, then
here. When a gap in §2 is fixed, mark it fixed with the PR and keep the row until the stage it
blocked has passed. **A runbook that is not updated as reality arrives is worse than none** — it
looks authoritative while being wrong.
