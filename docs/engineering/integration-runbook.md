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
> **Status:** all parts for Stages 1–5 have arrived (2026-10-16). Stage 0 is verified on
> 2026-10-19. **Nothing in Stages 1–9 has been executed yet.** Read §2 before plugging anything in.

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

Wiring and soldering · plugging boards into USB · applying power · anything needing a password ·
measuring current or continuity · putting sensors in water · siting antennas · deploying.
**Claude must never type a password** ([CLAUDE.md → Repo gotchas](../../CLAUDE.md)).

---

## 1. Ground truth — what exists today (2026-10-19)

| Layer | State | Evidence |
|---|---|---|
| Firmware pure logic (packet codec, scheduler, link policy) | ✅ 20 native tests pass, CI-gated | `pio test -e native` |
| Firmware target build | ✅ Compiles for the Feather M0: RAM 19.4%, Flash 25.4% | `pio run -e feather_m0`, 2026-10-19 |
| Firmware drivers (sensors, SD, RTC, radio, sleep) | ⚠️ Written, never run on hardware | [`firmware/README.md`](../../firmware/README.md) |
| Buoy wiring reference | ✅ **Rev B drawing set (2026-10-12)** agrees with `config.h`; ⚠️ the Rev A KiCad schematic is stale (§2, G3) | [Electronics Drawing Set](electronics-drawing-set.md) |
| Buoy bench parts (Feather M0 RFM95, Adalogger, DS18B20, Grove turbidity, DMG2305UX, antennas) | ✅ All arrived 2026-10-16 ([SCO-115](https://linear.app/scout1/issue/SCO-115)) | [Purchase Log](../planning/purchase-log.md) |
| Spare Feather M0 RFM95 ×2 (David's, for the bench link test) | ✅ On hand | [SCO-155](https://linear.app/scout1/issue/SCO-155) |
| D cells and battery protection | 🔴 Not bought — "Later order 1", after Stage 2 | [Build plan](electronics-build-and-test-plan.md#stage-6--run-on-the-batteries) |
| Hydrophone (Aquarian H2dM) | 🔴 Not bought — waits for funding | [SCO-8](https://linear.app/scout1/issue/SCO-8) |
| Shore radio hardware (ESP32-S3 Feather + LoRa FeatherWing) | ✅ Arrived 2026-10-16 | [SCO-86](https://linear.app/scout1/issue/SCO-86) |
| Shore radio firmware (ESP32-S3) | 🔴 **Not written** | [SCO-24](https://linear.app/scout1/issue/SCO-24); design in [Shore Station](shore-station.md) |
| Bench tooling: clock set (`set_rtc.py`), bench receiver (`feather_m0_rx`), transmit-every-minute build (`feather_m0_bench`), frame decoder (`decode_frames.py`) | ⚠️ Written and built, never run on hardware | [PR #186](https://github.com/David-Chousal/S.C.O.U.T./pull/186) |
| Shore software (decode, dedupe, CSV store, SD import, publish) | ✅ 64 tests pass on simulated data; Python, stdlib only | [`shore/`](../../shore/) |
| Analytics pipeline | ✅ 86 tests pass on simulated data | [`analytics/telemetry/`](../../analytics/telemetry/) |
| Public site + dashboard | ✅ Deployed (simulated data) | [Live Dashboard](live-dashboard.md) |
| Over-the-air updates | 🔴 Decided, not designed or built — reflashing still needs USB | [ADR-0008](../decisions/0008-over-the-air-firmware-updates.md), [SCO-197](https://linear.app/scout1/issue/SCO-197) |

**Read this honestly:** every line of software is verified against *simulated* data. None of it
has met a real sensor, a real radio, or real water yet.

---

## 2. Gates — known gaps to fix or work around before the stage that needs them

Found in the 2026-10-19 rewrite. Each names the first stage it blocks.

| # | Gap | Blocks | Fix (owner) |
|---|---|---|---|
| **G1** ✅ fixed in code | **Nothing ever set the RTC**, so timestamps and the UTC transmit slots were wrong on a new board. Now: for ~8 s after a reset, with USB connected, the firmware accepts `T<unix-epoch>`; `firmware/tools/set_rtc.py` sends it. | Stage 1, 4, 5 | [PR #186](https://github.com/David-Chousal/S.C.O.U.T./pull/186), [SCO-201](https://linear.app/scout1/issue/SCO-201) — confirm on hardware that `RTC_LOST` clears |
| **G2** ✅ design / 🔴 build | **Shore data path.** Resolved by the agreed design ([Shore Station](shore-station.md)): the **ESP32-S3 + LoRa FeatherWing is the shore station** — it receives, validates and **pushes to the dashboard over WiFi** on FreeRTOS, and under ADR-0008 sends firmware and settings back. **Still open:** which dashboard back end it pushes to (today's GitHub Pages site has no endpoint; Catherine's React + SQL dashboard is to be reviewed first, [SCO-120](https://linear.app/scout1/issue/SCO-120)). The S3 firmware is not written. | Stage 4b–4c | CS lead ([SCO-24](https://linear.app/scout1/issue/SCO-24)) |
| **G3** ⚠️ | **The Rev A KiCad schematic still says `TEMP_DATA = D5`.** The Rev B drawing set, `pin-assignments.md` and `config.h` all agree on **D12**. | Nothing, if you wire from the Rev B drawing set | Update the KiCad schematic (ECE) |
| **G4** ✅ fixed in code | **SD file layout.** The firmware wrote `YYYYMMDD.CSV` at the card root and the importer matched `*.csv` case-sensitively, so a retrieved card merged nothing. Now `/DATA/YYYYMMDD.CSV` (8.3-safe), audio at `/AUDIO/YYYYMMDD/HHMMSSZ.WAV`, and a case-insensitive importer ([data-schema](data-schema.md#file-layout-on-the-sd-card)). | Card retrieval (§6) | [PR #186](https://github.com/David-Chousal/S.C.O.U.T./pull/186), [SCO-202](https://linear.app/scout1/issue/SCO-202) — confirm with a real card |
| **G5** ✅ fixed in code | **No receiver for the bench link test.** Now `feather_m0_rx` (a second Feather M0) and `shore/scripts/decode_frames.py`. | Stage 4a | [PR #186](https://github.com/David-Chousal/S.C.O.U.T./pull/186), [SCO-155](https://linear.app/scout1/issue/SCO-155) |
| **G6** ⚠️ | **No way to force a watchdog reset** for the Stage 5 test. | Stage 5 | A test-only build flag that hangs one cycle (CSEN) |
| **G7** ⚠️ | **Audio is not implemented.** The firmware records the *intent* to record (`audio_present`); no capture code exists. | Stage 7 | Hydrophone firmware once the H2dM arrives |

**Hard safety rule, not a gap:** **never connect a primary (Li-SOCl₂) cell to a Feather that still
has its MCP73831 charger.** Charging a primary cell is a fire hazard. The charger comes off the
deployment Feather before Stage 6 ([ADR-0007](../decisions/0007-primary-cell-power-source.md)).

---

## 3. Setup

### Toolchain

✅ **VERIFIED 2026-10-19.**

| Tool | Version proven | Needed for | Install |
|---|---|---|---|
| Python | 3.9.6 locally; CI uses 3.12 | Shore, analytics, scripts | Preinstalled on macOS, or `brew install python@3.12` |
| PlatformIO Core | 6.2.0 | Buoy firmware build, flash, native tests | `pip install platformio` in a venv |
| git, `gh` | — | Repo, PRs | Xcode CLT; `brew install gh` then `gh auth login` |
| Arduino IDE or PlatformIO `espressif32` | ⚠️ not yet chosen | ESP32-S3 shore firmware (G2) | — |

```bash
xcode-select --install
brew install gh && gh auth login            # keyring, NOT a GITHUB_TOKEN env var
python3 -m venv ~/.scout-venv
~/.scout-venv/bin/pip install platformio
```

**Do not export `GITHUB_TOKEN`**; `gh` prefers it over the keyring, so a stale value silently
breaks every `gh` command.

### Deliberate constraints — do not "fix" these

- **`shore/` and `analytics/telemetry/` are standard-library only.** The one exception is the
  optional real-radio backend [`radio.py`](../../shore/scout_shore/radio.py), which imports
  `adafruit-circuitpython-rfm9x` lazily so the test suite still runs on a bare machine.
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
- Find the port with `ls /dev/cu.usbmodem*` or `~/.scout-venv/bin/pio device list`.

---

## 4. What programs what

| Target | What runs on it | Toolchain | Source of truth | Programmed by |
|---|---|---|---|---|
| **Feather M0 RFM95** — the buoy | `firmware/src/` + `firmware/lib/` (C++, Arduino SAMD core) | PlatformIO → BOSSA over USB | `firmware/src/config.h` (pins, schedule, radio) | `pio run -e feather_m0 -t upload`, double-tap RESET |
| **ESP32-S3 Feather + LoRa FeatherWing** — **the shore station** | LoRa receive, push to the dashboard over WiFi, downlink (ADR-0008) — 🔴 not written | ⚠️ Arduino core or ESP-IDF, undecided | the buoy's `config.h` radio settings; [Shore Station](shore-station.md) | — |
| **Second Feather M0** — bench receiver (test instrument) | `firmware/src/bench_rx/` | PlatformIO | the buoy's `config.h` | `pio run -e feather_m0_rx -t upload` |
| **A computer** — Python shore package | `shore/scout_shore/` (Python, stdlib): decode, dedupe, CSV store, SD import, Pages publishing; bench decoding | none | `shore/scout_shore/packet.py` (wire format) | `python3 scripts/decode_frames.py`, `import_sd_card.py`; its live role depends on the dashboard decision (G2) |
| **Any machine** — analytics | `analytics/telemetry/` (Python, stdlib) | none | [data-schema.md](data-schema.md) | `python3 run_telemetry.py` |
| **GitHub Pages** — public site | generated HTML | `.github/workflows/pages.yml` | `analytics/telemetry/site/` | CI on push to `main`, hourly cron |
| **Cloudflare Worker** — "Fred" chat | `chatbot/worker.js` | Wrangler | `chatbot/wrangler.toml` | `wrangler deploy` (separate from the buoy chain) |

### The cross-language packet contract

`firmware/lib/scout_packet/` (C++) and `shore/scout_shore/packet.py` (Python) encode the **same
44 bytes** (schema v3). `scripts/check_packet_contract.py` compares them and fails CI on drift. Any ESP32-S3
code that decodes frames must also match it. **Change one, change all, and bump
`SCOUT_PACKET_VERSION`.**

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
- **Transmits** the latest sample at **00:10, 08:10 and 16:10 UTC** (`TX_SLOTS_SOD`), sending 3
  copies with widening gaps in NORMAL power, 1 copy in CONSERVE (slot 0 only), none in CRITICAL.
  A missed slot is skipped, not retried.
- **Sleeps** in SAMD21 standby between events, waking on the SAMD21 RTC; it re-reads the PCF8523
  after every wake. **USB drops while asleep.**
- **Radio:** 915.0 MHz · BW 500 kHz · SF12 · CR 4/8 · **+11 dBm** — fixed by FCC compliance; do
  not narrow the bandwidth ([facts.md](../hub/facts.md), [FCC brief](../research/fcc-review-brief.md)).
  The buoy is **transmit-only** until ADR-0008 is built.

---

## 5. Stages

### Stage 0 — Prove the software with no hardware ✅ VERIFIED 2026-10-19

**Goal:** every later failure is a hardware or wiring failure, not a software one.

```bash
cd analytics && python3 -m unittest discover -s telemetry/tests -t . && cd ..
cd shore && python3 -m unittest discover -s tests && cd ..
python3 scripts/check_packet_contract.py
cd firmware && ~/.scout-venv/bin/pio test -e native && ~/.scout-venv/bin/pio run -e feather_m0 && cd ..
```

**PASS (as recorded 2026-10-19):** 86 telemetry tests OK · 64 shore tests OK ·
`packet contract OK — 30 bytes` · 20 native test cases · `SUCCESS`, RAM 19.4%, Flash 25.4%.
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
~/.scout-venv/bin/pio run -e feather_m0 -t upload      # double-tap RESET if the port is not found
cd .. && python3 firmware/tools/set_rtc.py              # press RESET once when asked
~/.scout-venv/bin/pio device monitor -d firmware -b 115200
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

**4a — Bench link between two Feather M0s** (SCO-155 + SCO-98).

```bash
cd firmware
# Second Feather (the receiver), antenna on:
~/.scout-venv/bin/pio run -e feather_m0_rx -t upload
# Buoy Feather, antenna on: the bench build samples and transmits every minute
~/.scout-venv/bin/pio run -e feather_m0_bench -t upload
cd .. && python3 firmware/tools/set_rtc.py
# Watch the receiver and decode as frames arrive (use the receiver's port):
~/.scout-venv/bin/pio device monitor -d firmware -e feather_m0_rx -p <receiver port> \
  | python3 shore/scripts/decode_frames.py --out /tmp/bench-data
```

`feather_m0_rx` is built from the buoy's own `config.h` (915.0 MHz, `{0x98, 0xC4, 0x04}`), and
applies the **SX1276 500 kHz erratum** (`0x36` ← `0x02`, `0x3A` ← `0x64`; `spiWrite` is public
in RadioHead, no subclass needed). It prints `bench_rx: radio=ok … errata=applied` at boot, then
`RX len=30 rssi=… snr=… hex=…` per frame. `feather_m0_bench` prints a warning at boot; **reflash
`feather_m0` before anything leaves the bench.**

**PASS:** frames decode and pass CRC in `decode_frames.py` · one frame per minute, one row each
(the buoy sends one copy per slot since 2026-10-23) · on the bench, < 1% loss over 100+ frames ·
time on air ≈ **0.56 s** (`SCOUT_LINK_AIRTIME_MS` 560; `scripts/lora_airtime.py`) · TX current
≤ 100 mA · RSSI and SNR recorded with the distance. **Record the results on SCO-155 and SCO-98**;
the register values and sensitivity become verified only here. Then try the real schedule: flash
`feather_m0`, set the clock a few minutes before a slot, and confirm the slot transmission.

**4b — The shore station: ESP32-S3 + LoRa FeatherWing** (SCO-24). 🟡 Receive firmware written 2026-10-23 (`firmware/src/shore_rx/`, env `feather_esp32s3_shore`), never run on the board; the WiFi push is not written.
Per the agreed design ([Shore Station](shore-station.md)) it receives with the same settings and
erratum as 4a, listens in a **±2 min** window around each slot, and **pushes to the dashboard
over WiFi**. Under ADR-0008 it will also transmit, so its transmit antenna must stay **≤ 2.15 dBi**
and the FeatherWing's own FCC authorization needs checking
([FCC brief](../research/fcc-review-brief.md#outcome--reviewed-2026-10-16)).

**PASS:** the S3 receives the buoy's slot transmissions and the readings appear on the dashboard,
one row per reading.

**4c — Dedupe and the dashboard.** Each slot sends one copy (SCO-21, 2026-10-23), but the same
reading can still arrive twice: a re-received frame, or an SD-card import of a reading the radio
already delivered. Whatever stores readings must collapse those to **one** row on
`(buoy_id, record_seq)`; duplicate rows would inflate QC completeness and hide real gaps. The
Python store already does this and is unit-tested. Where the S3's pushes land, and so where this
check runs in the live system, waits on the dashboard decision (G2 open item).

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
- D13 LED stays off; the switched rail is ≈ 0 V between samples.
- 24 h average current within budget (≈ 0.56 mA).

---

### Stage 6 — Run on the batteries ⚠️ UNVERIFIED · [SCO-159](https://linear.app/scout1/issue/SCO-159), [SCO-150](https://linear.app/scout1/issue/SCO-150) · parts not bought

**Preconditions:** Stage 2 PASS (it justifies the battery order) · **the MCP73831 charger removed
from the deployment Feather** (§2 safety rule). *When:* the Rev B drawing set (sheet 7) removes it
at the end of Stage 3; the build plan lists it under Stage 6. Either is safe as long as it happens
before any primary cell is connected.

Two Saft LS33600 D cells in parallel, each through an ideal diode, then a PTC fuse and a keyed
connector into `BAT` ([ADR-0007](../decisions/0007-primary-cell-power-source.md); packaging in the
electronics housing per the 2026-10-15 decision). **Check connector polarity by hand before the
first connection** ([SCO-84](https://linear.app/scout1/issue/SCO-84)).

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
**≤ 2.15 dBi** (FCC grant limit). SHT40 for internal humidity, desiccant, conformal coat, cable
glands from lab stock. No solar.

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
antifouling applied · shore link tested at true range.

**PASS:** data arrives every slot for the whole test; temperature matches a reference logger; no
leaks; battery use on track for 12 months.

---

## 6. After reception — pipeline, publish, and card retrieval

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

The card is the **complete** record: every reading the radio missed exists only there, and
`turbidity_v`, `turbidity_ntu` and the audio filename never fit in the packet.

```bash
cd shore
python3 scripts/import_sd_card.py --card /Volumes/<card> --into data-live --dry-run   # inspect first
python3 scripts/import_sd_card.py --card /Volumes/<card> --into data-live
```

The importer reads `DATA/YYYYMMDD.CSV` (G4, fixed in PR #186; confirm with the first real card)
and takes the `buoy_id` from the rows. Copy `/AUDIO/` off the card before reusing it; raw audio
exists nowhere else.

### If the Python shore package runs as a service

The shore station is the ESP32-S3. Whether the Python package also runs continuously (for
example behind the dashboard) depends on the open dashboard decision (G2). If it does, on Linux,
run it as a service so a reboot does not silently stop it:

```bash
sudo cp shore/deploy/scout-shore.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now scout-shore
journalctl -u scout-shore -f
```

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
| Reboot mid-transmit | Airtime over the watchdog budget | Compare against `SCOUT_LINK_AIRTIME_MS` (560 ms) |
| SD import finds nothing | Card written by firmware older than PR #186 | Old builds wrote `YYYYMMDD.CSV` at the root; point the importer at the card root, and update the firmware |
| Battery voltage implausible on USB | A7 reads the charger output | Expected; only trust A7 on the cells (SCO-83) |
| Completeness 0%, expected records absurd | A clock-invalid row | `RTC_LOST`/1970 rows are excluded from timing (`clock_invalid`) |
| Dashboard shows sample data after go-live | Publishing from the wrong directory | Real CSVs belong in `shore/data-live/` |

---

## 8. What Claude cannot do

Wire, solder or power anything · measure current, voltage or continuity · put a sensor in water ·
type a password · flash a board the human has not connected · confirm any ⚠️ claim without
hardware output.

**Claude can:** run Stage 0 · build and flash a connected board · read serial output · decode
frames · drive the shore and analytics chain · diagnose from real output · and update this
runbook as stages are proven.

## 9. Keeping this document true

When a stage runs, change ⚠️ → ✅ with the date and the real output. When a measurement lands
(sleep current, range, airtime, RSSI), it goes in [`facts.md`](../hub/facts.md) **first**, then
here. When a gap in §2 is fixed, mark it fixed with the PR and keep the row until the stage it
blocked has passed. **A runbook that is not updated as reality arrives is worse than none** — it
looks authoritative while being wrong.
