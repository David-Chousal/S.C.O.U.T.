# Hardware/Software Integration Runbook

> **Summary** — The single procedure for getting S.C.O.U.T.'s software onto its hardware and the
> whole chain running, bench to field: what to install, what programs what, which commands to
> run, and what "working" means at each step. Written to be **executed by a Claude session**
> with a human doing only the physical work.
>
> **As of 2026-09-10. Nothing in Stages 1–10 has been executed** — no hardware has arrived
> ([SCO-88](https://linear.app/scout1/issue/SCO-88)) and there is no shore Pi. Stage 0 is
> verified and runnable today. Every other stage is specified, not proven.

---

## 0. How to use this document

### The three markings, and why they matter

Every command and claim carries one of three states. **Do not silently promote a claim from one
state to a stronger one** — the value of this runbook is that it never overstates what is known.

| Mark | Means | You may rely on it |
|---|---|---|
| ✅ **VERIFIED** | Actually executed on 2026-09-10, output recorded here | Yes |
| ⚠️ **UNVERIFIED** | Derived from datasheets, schematic, or code — never run against hardware | Treat as a hypothesis to test, not a fact |
| 🔴 **BLOCKED** | Cannot proceed; a decision or part is missing | No. Stop at the gate |

### Contract for a Claude session executing this

1. **Work the stages in order.** Each stage's preconditions are the previous stage's PASS
   criteria. Skipping is how a wiring fault gets misdiagnosed as a firmware bug three stages later.
2. **Never advance past a failed gate.** If a PASS criterion is not met, stop and report. Do not
   "work around" it — a workaround at Stage 3 becomes an unexplained failure at Stage 7.
3. **Never invent a pin, a part number, or a register value.** Every one is sourced below. If
   something needed is not here, say so and stop.
4. **Physical steps are the human's.** Soldering, plugging, power, submersion. Claude prepares the
   command and verifies the result; it does not pretend to have done the physical act.
5. **Report failures verbatim** ([Standing rule 5](../../CLAUDE.md#standing-rules)). Paste the real
   output, not a summary of it.
6. **Update this file as reality lands.** When a stage is executed, change its mark from
   ⚠️ to ✅ and record the actual output. A runbook that does not learn is a work of fiction.

### What only the human can do

Soldering and assembly · plugging the board into USB · applying power · anything needing a
password (sudo, GitHub sudo-mode) · physically siting the shore antenna · deploying the buoy.
**Claude must never type a password** ([CLAUDE.md → Repo gotchas](../../CLAUDE.md)).

---

## 1. Ground truth — what exists today

| Layer | State | Evidence |
|---|---|---|
| Firmware pure logic (packet codec, scheduler, link policy) | ✅ Real, unit-tested, CI-gated | 16 native tests pass; `scripts/check_packet_contract.py` enforces the codec across languages |
| Firmware target build | ✅ Compiles for Feather M0 | RAM 18.8%, Flash 22.6%; gated in `ci.yml` |
| Firmware drivers (sensors, SD, RTC, radio) | ⚠️ Written, never run on hardware | [`firmware/README.md`](../../firmware/README.md) "What's real vs. scaffold" |
| Rev A schematic | ⚠️ ERC-clean, never built | [`hardware/README.md`](../../hardware/README.md) — "schematic-level verification, not physical validation" |
| Physical buoy electronics | 🔴 Does not exist | [SCO-88](https://linear.app/scout1/issue/SCO-88) parts not arrived |
| Shore station code | ✅ Simulated path works, **64 tests pass** | [`shore/`](../../shore/) |
| Shore radio driver | ⚠️ Written, never run on hardware — `radio.Rfm9xLink`, mirrors the buoy's modem config, applies the 500 kHz errata | [`shore/scout_shore/radio.py`](../../shore/scout_shore/radio.py) |
| Shore service (systemd) | ⚠️ Written, never loaded by systemd — restarts unconditionally, clean SIGTERM, capped backoff | [`scout-shore.service`](../../shore/deploy/scout-shore.service) |
| SD-card recovery | ✅ Merges a retrieved card into the shore record, tested | [`sd_import.py`](../../shore/scout_shore/sd_import.py) |
| Shore station hardware | 🔴 No Raspberry Pi | [Shore Station](shore-station.md) |
| Analytics pipeline | ✅ Working end to end on simulated data | **86 tests**; site builds |
| Public site + dashboard | ✅ Deployed | [Live Dashboard](live-dashboard.md) |

**Read this honestly:** every line of software is verified against *simulated* data. Not one line
has met a real sensor, a real radio, or real water. That is the gap this runbook closes.

---

## 2. 🔴 BLOCKING GATE — the Rev A pin map contradicts the firmware

**Do not flash anything onto Rev A hardware until this is resolved.** Two faults, both found
2026-09-10, both of the same class as the `PIN_TURBIDITY` A0→A1 error that was caught and fixed in
[SCO-85](https://linear.app/scout1/issue/SCO-85) / PR #103.

### Fault 1 — the temperature sensor is on a different pin in each source

| Source | Says | Line |
|---|---|---|
| Rev A schematic (authoritative for electrical) | `TEMP_DATA = Feather D5` | `hardware/schematics/scout-reva.kicad_sch`, text annotation |
| Firmware | `#define PIN_ONEWIRE 12` | [`firmware/src/config.h`](../../firmware/src/config.h) |
| [`firmware/docs/pin-assignments.md`](../../firmware/docs/pin-assignments.md) | `PIN_ONEWIRE = 12` | agrees with firmware, not the schematic |

**Consequence if flashed as-is:** the DS18B20 never reads. The firmware polls D12, which has
nothing on it. `SCOUT_FLAG_TEMP_TIMEOUT` sets on every cycle and the buoy logs no temperature —
its primary signal.

### Fault 2 — the RTC wake interrupt has no wire, and its pin is already taken

The firmware needs `PIN_RTC_INT 5` to wake the SAMD21 from standby. On Rev A:

- The schematic contains **no interrupt net at all** (zero matches for any RTC INT signal).
- D5 is where the schematic puts `TEMP_DATA`, so even if the wire existed, the two collide.
- The Adalogger's PCF8523 `INT1` is **not brought out by default** — it requires a solder jumper
  on the FeatherWing.

**Consequence:** no wake interrupt means no duty cycle. The buoy enters `LowPower.deepSleep()` and
never returns. This is not a degraded mode; it is a dead buoy.

### Resolving it — an ECE decision, not a documentation one

Both resolutions are viable. **Isabella owns this** (`ece`). Pick one, apply it, then delete this
gate and record the choice in [`decision-log.md`](../hub/decision-log.md).

**Option A — schematic wins (firmware moves).** Set `PIN_ONEWIRE 5`, relocate `PIN_RTC_INT` to a
free pin (D6, D9, D11 and D12 are unclaimed in `config.h`), and add the Adalogger `INT1` solder
jumper to the assembly steps. Cheapest if a board is already fabricated to the schematic.

**Option B — firmware wins (schematic moves).** Correct the schematic so `TEMP_DATA = D12`,
leaving D5 free for the RTC interrupt as the firmware assumes, and add the `INT1` jumper. Cheapest
if nothing is built yet — which is the case today.

**Either way the `INT1` jumper is required.** It is not optional and it is not in any current
assembly instruction.

> **Gate:** Stages 2–10 are blocked until one option is applied, `pin-assignments.md`, `config.h`
> and the schematic all agree, and `pio run -e feather_m0` still succeeds.

---

## 3. The toolchain

✅ **VERIFIED 2026-09-10** — installed from clean and exercised. Versions are what was proven, not
what is merely compatible.

| Tool | Version proven | Needed for | Install |
|---|---|---|---|
| Python | 3.14.6 (CI uses 3.12) | Everything Python | Preinstalled on macOS, or `brew install python@3.12` |
| PlatformIO Core | 6.2.0 | Firmware build, flash, native tests | `pip install platformio` |
| git | 2.50.1 | Repo | Preinstalled with Xcode CLT |
| `gh` CLI | 2.95.0 | PRs, CI status | `brew install gh`, then `gh auth login` |

**No `pip install` is needed to run the shore or telemetry test suites** — both are standard
library only, deliberately, so they run on a bare Raspberry Pi. `analytics/requirements.txt`
(numpy/pandas/scipy/scikit-maad/matplotlib) is for the **acoustic** pipeline only; the telemetry
pipeline does not need it.

### 🔴 The acoustic pipeline needs a 64-bit host

Verified against PyPI on 2026-09-10, not assumed:

| Architecture | Result |
|---|---|
| **aarch64** — Raspberry Pi OS **64-bit**, and any modern laptop | ✅ every pinned package and compiled transitive dependency has a wheel |
| **armv7l** — Raspberry Pi OS **32-bit** | ⚠️ **nine** have no wheel: numpy, scipy, pandas, matplotlib, scikit-image, pywavelets, contourpy, kiwisolver, pillow |

Without a wheel `pip` builds from source, and SciPy on a Pi needs a Fortran toolchain and routinely
exhausts the board's RAM. **Flash the 64-bit image.** Getting it wrong means reimaging the card
after the fact.

Re-check whenever `analytics/requirements.txt` changes — the answer is version-specific:

```bash
python3 scripts/check_arm_wheels.py
```

It queries PyPI, so it needs network and is deliberately **not** in CI. The shore station and the
telemetry pipeline are unaffected by any of this; they have no dependencies.

### Deliberate constraints — do not "fix" these

- **`analytics/telemetry/` and `shore/` are standard-library only.** This is a hard design
  constraint so the pipeline runs on a bare Pi. Adding a dependency breaks the shore station.
  **The one exception is the real radio backend**
  ([`radio.py`](../../shore/scout_shore/radio.py)), which needs `adafruit-circuitpython-rfm9x`.
  It imports lazily *inside* `Rfm9xLink.__init__` precisely so the module, the package, and the
  whole test suite still import on a machine with nothing installed. Keep it that way: a
  top-level import there would break `python3 -m unittest` on a bare Pi.
- **`--audio_dir` uses an underscore** while other flags use hyphens. Known, documented, and must
  not be changed without an issue ([CLAUDE.md → Before committing](../../CLAUDE.md)).
- **The `Arduino Low Power` registry ID contains spaces.** `arduino-libraries/ArduinoLowPower`
  does not resolve and will fail dependency resolution before a single file compiles.

---

## 4. Environment setup — the human does this once

```bash
xcode-select --install                      # git + toolchain, if not present
brew install gh                             # GitHub CLI
gh auth login                               # keyring, NOT a GITHUB_TOKEN env var
python3 -m venv ~/.scout-venv
~/.scout-venv/bin/pip install platformio
```

**Do not export `GITHUB_TOKEN`.** `gh` prefers it over the keyring, so a stale value silently
breaks every `gh` command ([CLAUDE.md → Repo gotchas](../../CLAUDE.md)).

**Verification — run this before anything else.** ✅ VERIFIED

```bash
cd analytics && python3 -m unittest discover -s telemetry/tests -t . && cd ..
cd shore && python3 -m unittest discover -s tests && cd ..
python3 scripts/check_packet_contract.py
cd firmware && ~/.scout-venv/bin/pio test -e native && ~/.scout-venv/bin/pio run -e feather_m0
```

Expected: **86** telemetry tests OK · **64** shore tests OK · `packet contract OK — 30 bytes` ·
16 native test cases · `SUCCESS`, RAM 18.8%, Flash 22.6%.

**If any of these fail, stop.** The problem is the environment, not the hardware, and every later
stage will misattribute it.

---

## 5. What programs what

The single most important table in this document. **Each artifact has exactly one toolchain and
one source of truth.** Ambiguity here is what produces the drift this project keeps finding.

| Target | What runs on it | Language | Toolchain | Source of truth | Programmed by |
|---|---|---|---|---|---|
| **Feather M0 (SAMD21)** — the buoy | `firmware/src/` + `firmware/lib/` | C++ (Arduino SAMD core) | PlatformIO → BOSSA over USB | `firmware/src/config.h` for pins/cadence | `pio run -t upload`, double-tap RESET |
| **Raspberry Pi** — shore station | `shore/scout_shore/` | Python 3, stdlib **+ `adafruit-circuitpython-rfm9x` for the real radio only** | Pi OS **64-bit** (see §3) | `shore/scout_shore/packet.py` for the wire format | `git pull` + [`scout-shore.service`](../../shore/deploy/scout-shore.service) |
| **Any machine** — analytics | `analytics/telemetry/` | Python 3, stdlib only | none | `docs/engineering/data-schema.md` | `python3 run_telemetry.py` |
| **GitHub Pages** — public site | generated HTML | Python → static HTML | `.github/workflows/pages.yml` | `analytics/telemetry/site/` | CI on push to `main` |
| **Cloudflare Worker** — "Fred" chat | `chatbot/worker.js` | JavaScript | Wrangler | `chatbot/wrangler.toml` | `wrangler deploy` (separate from the buoy chain) |

### The cross-language contract

`firmware/lib/scout_packet/` (C++) and `shore/scout_shore/packet.py` (Python) encode the **same 30
bytes**. They are not allowed to drift: `scripts/check_packet_contract.py` compares the C++ encoder
against a Python golden vector and **fails CI** if they disagree.

**If you change one, change both, and bump `SCOUT_PACKET_VERSION`.** ✅ The guard currently passes:
`packet contract OK — 30 bytes`.

### Pin map — the authority chain

`firmware/src/config.h` is what actually gets compiled. `firmware/docs/pin-assignments.md` is
documentation of it. `hardware/schematics/scout-reva.kicad_sch` is what is physically wired.
**All three must agree before flashing** — they currently do not (§2).

| Signal | `config.h` | Peripheral |
|---|---|---|
| DS18B20 data | `PIN_ONEWIRE` **12** 🔴 conflicts with schematic D5 | 1-Wire, 4.7 kΩ pull-up to 3V3 |
| Turbidity analog | `PIN_TURBIDITY` **A1** ✅ matches schematic | SEN0189 via 10k/20k divider |
| Sensor power gate | `PIN_SENSOR_GATE` **11** | MOSFET, HIGH = rail on |
| Battery sense | `PIN_BATTERY` **A7** | Feather onboard 2:1 divider |
| microSD CS | `PIN_SD_CS` **10** | Adalogger, shared SPI |
| LoRa CS / RST / IRQ | **8 / 4 / 3** | RFM95, shared SPI |
| RTC wake IRQ | `PIN_RTC_INT` **5** 🔴 no wire, collides with D5 | PCF8523 INT1 — needs solder jumper |

**SPI is shared** between the microSD (CS 10) and the RFM95 (CS 8). Only one may be selected at a
time. A bring-up failure where SD and radio each work alone but not together is almost always this.

---

## 6. Integration stages

### Stage 0 — Prove the software with no hardware ✅ VERIFIED

**Goal:** establish that every failure from here on is a hardware or wiring failure, not a
software one.

Run the §4 verification block. **PASS:** all five commands succeed with the stated output.

This stage is runnable today and is the only one that is. Re-run it after every firmware change.

---

### Stage 1 — Assemble the buoy electronics ⚠️ UNVERIFIED · human · 🔴 blocked on parts

**Preconditions:** §2 gate resolved; parts arrived (SCO-88).

1. Stack the Adalogger FeatherWing on the Feather M0.
2. **Solder the PCF8523 `INT1` jumper** on the Adalogger and run it to the pin chosen in §2. Not
   optional — without it there is no wake.
3. DS18B20: 3V3 / GND / data to the §2-chosen pin, **4.7 kΩ pull-up between data and 3V3**.
4. SEN0189: `SYSTEM_5V` supply, output through the **10 kΩ / 20 kΩ divider** to A1. Verify the
   divider before connecting — it is what keeps a 4.5 V sensor off a 3.3 V ADC pin.
5. Power: LiPo → Adafruit PID 6106 `BAT+`; PID 6106 boost out → Feather `VBUS`
   ([ADR-0006](../decisions/0006-rev-a-battery-chemistry.md)). The Feather's own `BAT`/`VBAT` is
   **unused** — its onboard charger is not in this design.
6. Antenna on the RFM95 **before any transmit**.

**PASS:** continuity matches the schematic; the divider measures ≈ 2/3 of input; no short between
3V3 and GND; the antenna is attached.

> ⚠️ **Never power the RFM95 without an antenna.** Transmitting unterminated can destroy the PA.

> ⚠️ **[SCO-84](https://linear.app/scout1/issue/SCO-84): check battery connector polarity by hand
> before first connection.** JST polarity is not standardised across vendors and reversing it
> destroys the board.

---

### Stage 2 — First flash and boot ⚠️ UNVERIFIED

**Preconditions:** Stage 1 PASS. Board on USB (human).

```bash
cd firmware
~/.scout-venv/bin/pio run -e feather_m0                  # must succeed before upload
~/.scout-venv/bin/pio run -e feather_m0 -t upload        # double-tap RESET for the bootloader
~/.scout-venv/bin/pio device monitor -b 115200
```

**PASS:** the boot line appears and reports subsystem init:

```
boot: watchdog_reset=no rtc=ok sd=ok lora=ok start=cold resume_seq=0
```

**Failure modes**

| Symptom | Cause | Action |
|---|---|---|
| Upload port not found | Not in bootloader | Double-tap RESET; the port changes when it enumerates |
| `rtc=FAIL` | I²C wiring or the FeatherWing not seated | Reseat; check SDA/SCL |
| `sd=FAIL` | Card absent/unformatted, or SPI CS conflict | FAT32; confirm CS 10 vs 8 |
| `lora=FAIL` | RFM95 CS/RST/IRQ wiring | Confirm 8 / 4 / 3 |
| Nothing on serial | Wrong baud, or USB dropped during standby | 115200; USB drops in standby **by design** |

---

### Stage 3 — Sensors, one at a time ⚠️ UNVERIFIED

**Bring up one sensor per cycle.** Two at once means an ambiguous failure.

**3a — Temperature.** Expect plausible room temperature in the CSV row. **PASS:** value tracks a
warm hand within a few seconds and `TEMP_TIMEOUT` is absent.

**3b — Turbidity.** ⚠️ **Polarity is the trap.** A **higher** ADC count is **clearer** water — the
SEN0189's output *falls* as turbidity rises ([facts.md](../hub/facts.md), DFRobot datasheet).
Confirm in clear water then a spoon of milk: **the count must go DOWN.**

**PASS:** clear ≫ turbid in ADC counts. **If it goes up, stop** — either the divider inverts
(it must not; [SCO-47](https://linear.app/scout1/issue/SCO-47)) or `turbidity.py`'s event direction
is wrong again. Do not proceed; the entire analytics chain depends on this sign.

**3c — Battery sense.** ⚠️ [SCO-83](https://linear.app/scout1/issue/SCO-83): the battery-voltage
telemetry does not currently measure the Rev A pack — the Feather's A7 divider reads its own `BAT`
pin, which this design leaves unused. **Expect this to read wrong** until SCO-83 is resolved.
Record the value; do not tune thresholds against it.

---

### Stage 4 — Storage, clock, sleep, watchdog ⚠️ UNVERIFIED

**4a — SD logging.** **PASS:** `/DATA/SCOUT-01_YYYYMMDD.csv` exists, header matches
[data-schema.md](data-schema.md), one row per wake.

**4b — RTC.** **PASS:** timestamps are real UTC and survive a power cycle.

**4c — Standby sleep.** **PASS:** the buoy wakes on the PCF8523 interrupt at the expected interval
and `record_seq` increments. USB/serial dropping during standby is expected.

**4d — Sleep current.** ⚠️ `< 5 mA` is an analytical **target, never measured**
([facts.md](../hub/facts.md) open facts). Measure with a multimeter in series. **Record the real
number in `facts.md` whatever it is** — this feeds the entire power budget.

**4e — Watchdog.** **PASS:** an induced hang resets the buoy and the next boot reports
`watchdog_reset=yes`.

**4f — Retained state.** **PASS:** after a reset, `resume_seq` continues rather than restarting
at 0.

---

### Stage 5 — Radio transmit ⚠️ UNVERIFIED

**Modem configuration is fixed by compliance, not preference** —
**915.0 MHz · BW 500 kHz · SF12 · CR 4/8 · +11 dBm**
([facts.md](../hub/facts.md), [FCC 915 MHz Compliance](../research/fcc-915-mhz-compliance.md)).
47 CFR §15.247 requires either ≥ 500 kHz bandwidth or ≥ 50-channel hopping; the earlier BW125
single-channel config met neither. **Do not narrow the bandwidth to improve range.**

⚠️ Register values and the resulting sensitivity are **modelled, not bench-verified**
([SCO-98](https://linear.app/scout1/issue/SCO-98)).

**PASS:** a 30-byte frame is transmitted; airtime is near the modelled **560 ms**
(`SCOUT_LINK_AIRTIME_MS`, reproducible with `scripts/lora_airtime.py`). Airtime materially above
budget risks a mid-transmit watchdog reboot.

---

### Stage 6 — Shore station 🔴 no Pi exists

**Hardware:** Raspberry Pi (4 or Zero 2 W) · **RFM95/SX1276 915 MHz** radio, matching the buoy ·
915 MHz antenna · SD card ([Shore Station](shore-station.md)).

> 🔴 **Flash the 64-bit Raspberry Pi OS (aarch64), not the 32-bit image.** This is a constraint,
> not a preference. On aarch64 every pinned analytics package and compiled transitive dependency
> has an ARM wheel; on 32-bit **armv7l** nine of them have none, so `pip` builds from source —
> and SciPy needs a Fortran toolchain and routinely exhausts a Pi's RAM. Re-checkable any time
> with `python3 scripts/check_arm_wheels.py`. The shore station itself is unaffected (stdlib), but
> getting this wrong means reimaging the card later.

```bash
git clone git@github.com:David-Chousal/S.C.O.U.T..git && cd S.C.O.U.T.
cd shore && python3 -m unittest discover -s tests     # stdlib only — must pass on a bare Pi
pip install adafruit-circuitpython-rfm9x               # the ONE runtime dep, for real radio

# Receive with the real radio, into the directory the dashboard publishes from:
python3 scripts/run_receiver.py --link rfm9x --out data-live
```

> ⚠️ **SX1276 errata §2.1 — the receiver underperforms without it.** At BW ≥ 500 kHz two
> undocumented registers must be written to reach datasheet sensitivity: `0x36` ← `0x02` and
> `0x3A` ← `0x64` ([reading note](../hub/research/notes/sx1276-errata-500khz.md)). It is a
> **receive-side** fix, which is why the transmit-only buoy does not set it. Miss it and the link
> looks weak for no visible reason — the exact failure that gets misdiagnosed as antenna or range.
>
> [`Rfm9xLink`](../../shore/scout_shore/radio.py) **already writes both registers**, and a test
> pins the values. What is unverified is the code path itself, which has never executed against a
> real SX1276 — so confirm the radio initialises rather than assuming the errata is handled.

**Then install it as a service**, so a reboot or power cut does not silently end reception:

```bash
sudo cp shore/deploy/scout-shore.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now scout-shore
journalctl -u scout-shore -f
```

**PASS:** shore tests pass on the Pi · `--link rfm9x` constructs without error (a missing package
prints what to install, not a traceback) · `systemctl status scout-shore` shows **active
(running)** · `systemctl restart` recovers within ~10 s · the service survives a full reboot.

---

### Stage 7 — Close the link ⚠️ UNVERIFIED

**PASS:** a buoy transmission is received, CRC-validates, schema-validates, and appends **one** row
to the shore CSV.

**The dedupe check matters.** The buoy sends **3 blind copies** in NORMAL power mode with widening
gaps and never listens for an ACK. The shore station deduplicates on `(buoy_id, record_seq)`.
**PASS:** three copies → exactly **one** CSV row. If you get three rows, dedupe is broken and QC
completeness will read 100% while masking real gaps.

**And the other half: what happens when all three copies are missed.** Blind repetition has no
retry — that reading then exists only on the buoy's SD card. Shore CSVs are therefore expected to
be gappy, and a gap is **not** a fault to chase here; it is recovered when the card comes back
(Stage 10). Do not tune anything to make completeness look like 100% at this stage.

---

### Stage 8 — Pipeline and publish ⚠️ UNVERIFIED with real data (✅ verified with simulated)

```bash
cd analytics
python3 run_telemetry.py --source ../shore/data-live --mmm <site MMM> --out data/processed --web ../site
```

> 🔴 **`--source ../shore/data-live`, never `../shore/data`.** `shore/data/` is gitignored scratch
> that CI regenerates from the simulator on every Pages build — point real analysis at it and you
> are reading simulated numbers, and anything written there is destroyed within the hour.
> `data-live/` is the tracked directory received telemetry lands in
> ([README](../../shore/data-live/README.md)).

`--mmm` is the site's NOAA CRW Maximum Monthly Mean. Without it, DHW is skipped — it is undefined
without a climatology.

**PASS:** `telemetry_daily.csv` + `telemetry_summary.json` written; site builds; QC completeness
matches the transmissions actually sent.

**Publishing is automatic and picks its own source.** `.github/workflows/pages.yml` deploys on push
to `main` and on an hourly cron; [`publish.py`](../../shore/scout_shore/publish.py) decides what it
builds from — real CSVs in `shore/data-live/` if any exist, the simulator otherwise. Real data is
never labelled as a sample.

**PASS (publish):** with real CSVs committed, the deployed dashboard carries **no** sample-data
banner and the home page reads "Latest publish." rather than "Sample data, simulated until the
buoy is deployed."

---

### Stage 9 — Enclosure integration ⚠️ UNVERIFIED

**Preconditions:** Stages 2–8 PASS on the bench. **Never seal an unverified board.**

Electronics into the housing · cable glands sealed ([SCO-53](https://linear.app/scout1/issue/SCO-53))
· antenna clear of the water line · **[SCO-49](https://linear.app/scout1/issue/SCO-49): the battery
and solar panel, not the PCB, set the lower bound on housing volume.**

⚠️ **Waterproofing is not yet proven.** The 2026-08-24 submersion test **failed** for the
electronics housing (no bolt-joint washers on the article tested); the PLA sensor housing with a
TPU O-ring passed ~30 h. A retest with washers fitted is outstanding
([facts.md](../hub/facts.md) open facts).

**PASS:** submersion test passes at deployment depth (**2–8 m**) with the internal humidity sensor
reading flat.

---

### Stage 10 — Field deployment ⚠️ UNVERIFIED · Phase 6, Hawaii

**Do not deploy unless every stage above is PASS.** Retrieval is expensive; a buoy that fails in
the water fails for weeks.

Pre-deployment: full duty cycle for ≥ 72 h on battery+solar · shore link at true range
([SCO-14](https://linear.app/scout1/issue/SCO-14) — real over-saltwater range is **unmeasured**;
~2 km is a datasheet line-of-sight figure) · mooring per
[ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md) · antifouling coating applied ·
`record_seq` and RTC verified · SD card empty and seated.

**PASS:** the buoy transmits on schedule from the water and the dashboard updates unattended.

### On every retrieval — merge the SD card back in

The card is the **complete** record and the radio's is not. Every reading shore missed exists only
here, and even the readings that did arrive came through a 30-byte packet that could not carry
`turbidity_v`, `turbidity_ntu`, or the audio filename.

```bash
cd shore
python3 scripts/import_sd_card.py --card /Volumes/<card> --into data-live --dry-run   # inspect
python3 scripts/import_sd_card.py --card /Volumes/<card> --into data-live             # merge
```

Keyed on `(buoy_id, record_seq)`, so running it twice is a no-op and a partial card never deletes
history. **PASS:** the dry run reports the readings it would recover; after the merge, QC
completeness rises and gaps fall. Rows it could not read are printed on stderr with a non-zero
exit — investigate those rather than ignoring them, since they are card data being left behind.

**Also copy `/AUDIO/` off the card before reusing it.** Raw audio is never transmitted and exists
nowhere else ([EDD §10](engineering-design-document.md)); the acoustic pipeline runs on it later,
on a 64-bit host (§3).

---

## 7. Failure playbook

| Symptom | First suspicion | Why |
|---|---|---|
| Temperature never reads | **§2 pin conflict** | Firmware polls D12; schematic wires D5 |
| Buoy sleeps and never wakes | **§2 missing INT1 jumper** | No wake source exists on Rev A |
| SD and radio work alone, not together | Shared SPI CS | Only one of CS 10 / CS 8 may be active |
| Turbidity rises in dirty water | Polarity inverted | Higher ADC = clearer; check the divider is non-inverting (SCO-47) |
| Link weak, antenna fine | SX1276 500 kHz erratum | `Rfm9xLink` writes `0x36`/`0x3A`, but that path has never run — confirm it actually executed |
| Three CSV rows per transmission | Shore dedupe broken | Blind repetition sends 3 copies |
| Battery voltage implausible | Known — SCO-83 | A7 reads the unused Feather `BAT` pin |
| Reboot mid-transmit | Airtime over budget | Compare against `SCOUT_LINK_AIRTIME_MS` (560 ms) |
| Completeness 100% but data missing | Duplicates inflating the count | `n_records/expected` caps at 100% |
| Completeness 0%, expected records absurd | A clock-failed row | An `RTC_LOST`/1970 row is excluded from timing and reported as `clock_invalid` — if you see this, the guard is not in the build |
| Dashboard shows sample data after the buoy is live | Publishing from the wrong directory | Real CSVs must be in `shore/data-live/`; `shore/data/` is gitignored scratch CI regenerates hourly |
| Dashboard says "simulated" over real readings | A banner was passed alongside real data | `is_sample=bool(banner)` drives every page; `publish.py` passes none for real data |
| Shore stops receiving after a reboot | Service not enabled | `systemctl enable --now scout-shore`; check `journalctl -u scout-shore` |
| Shore station pinning the CPU | Radio throwing every poll | Expected under a fault — the loop backs off to 60 s; read `link_errors` in the stats line |
| `pip install` on the Pi compiling for hours | 32-bit OS | armv7l has no wheels for nine packages (§3) — reimage with the 64-bit OS |

## 8. What Claude cannot do

Solder, assemble, plug in, or power anything · measure current or continuity · put a sensor in
water · type a password ([CLAUDE.md](../../CLAUDE.md)) · reach Linear from a session whose
connector resolves elsewhere · flash a Raspberry Pi SD card · mount a retrieved card · confirm any
⚠️ claim without hardware.

**Claude can:** run every Stage 0 command · build and flash a board a human has connected · read
serial output · drive the analytics chain · diagnose from real output · and update this runbook as
stages are proven.

## 9. Keeping this document true

When a stage executes, change its mark ⚠️ → ✅ and paste the real output. When a measurement lands
(sleep current, real range, airtime), it goes in [`facts.md`](../hub/facts.md) **first**, then here.
When the §2 gate is resolved, delete the gate and record the decision in
[`decision-log.md`](../hub/decision-log.md).

**A runbook that is not updated as reality arrives is worse than none** — it looks authoritative
while being wrong, which is exactly the drift the August 2026 audit found across this project.
