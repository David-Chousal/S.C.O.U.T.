# Firmware Remote Settings Plan

> **Summary** — Which buoy firmware settings the console can change by radio, which stay
> firmware-only and why, and how the firmware, shore station, packet and console carry them.
> Drafted 2026-11-04 as a plan; **built the same day** (firmware, shore, console), so the sections
> below describe what exists. Nothing has run on hardware yet.
>
> **Assumption** — built on David's instruction to treat every pending sign-off as landed: the
> transmit-count range and the listen window ([SCO-198](https://linear.app/scout1/issue/SCO-198)),
> the FCC check on the shore's transmitter ([OTA design §8](ota-firmware-update-design.md)), the
> final battery pack ([ADR-0007](../decisions/0007-primary-cell-power-source.md)) and the humidity
> calibration ([SCO-204](https://linear.app/scout1/issue/SCO-204)). **None of those is recorded as
> done**; [`facts.md`](../hub/facts.md) keeps that open. The defaults below are today's firmware
> values and change when those land.

---

## The settings, one by one

| Setting | Default | By radio? | Range the buoy enforces | Why |
|---|---|---|---|---|
| Transmits a day (`tx_count`) | 3 | **Yes** | 1, 2, 3 | Biggest power lever |
| Slot phase (`slot_phase_h`) | 0 | **Yes** | 0–7 h | Moves every slot (00:10 · 08:10 · 16:10 at phase 0) and every audio hour that many hours later, so a buoy can dodge a local interference window or a second buoy's slots. Whole hours keep each slot 10 min after a sample at every reading interval, and 0–7 keeps every slot inside the same UTC day |
| Reading interval (`sample_interval_min`) | 30 min | **Yes** | 15, 30, 60 min | Every option samples on the hour, so each slot still follows a sample by 10 min |
| Hydrophone clip (`audio_clip_s`) | 60 s | **Yes** | 0 (off), 15, 30, 60 s | Audio is the costliest sensing step; turning it down or off is the first thing to try on a weak battery |
| Hydrophone sample rate | 22,050 Hz | No, firmware only | — | The acoustic-summary filter coefficients are generated for this rate ([ADR-0011](../decisions/0011-audio-capture-parameters.md)) |
| Conserve below (`conserve_mv`) | 3,200 mV | **Yes** | 3,000–3,600 mV, 10 mV steps | Tunes the tiers to the pack's real discharge curve |
| Critical below (`critical_mv`) | 3,100 mV | **Yes** | 2,900–3,500 mV, 10 mV steps, at least 50 mV under conserve | The buoy refuses a pair that would invert the tiers |
| Conserve: send every (`conserve_every`) | 3 | **Yes** | 1–3 | In conserve, transmit in every Nth used slot |
| Housing humidity alert (`humidity_alert_pct`) | 70 %RH | **Yes** | 40–95 %RH | SCO-204 sets the real default; the field may show it needs moving |
| Radio (915 MHz · +11 dBm · BW 500 kHz · SF12 · CR 4/8) | fixed | **Never** | — | Set by the FCC modular grant and §15.247; the shore must match the modem bytes exactly, so a change that half-applies orphans the buoy |
| Downlink listen window | 1 s after each send | **Never** | — | Shortening it by radio could leave no window to undo the change |
| Firmware and packet version | v0.1.0 · packet v5 | Read only | — | Changes by firmware update; OTA is a later, separate design |

**Rule for anything added later:** a setting may be changed by radio only if a wrong value
cannot stop the buoy hearing the next command. Radio parameters, the listen window and the
downlink key never qualify.

## How it works

```
console  ── member sets values ──►  D1 (buoys.tx_count_requested + buoy_settings)
   │                                   │  wanted snapshot = defaults overlaid with requests
   │  GET /api/device/settings ◄───────┘  {"buoy_id":1,"tx_count_requested":2,
   ▼                                        "settings":"2,0,30,60,3200,3100,3,70","settings_digest":"…"}
shore S3 (WiFi, every 10 min) or USB:  S<buoy>:<eight values>  /  N<buoy>:<count>
   │
   │  after each buoy packet: v5 buoy and digest ≠ wanted  → CMD v2 (43 B, every setting)
   │                          v4 buoy and count ≠ wanted   → CMD v1 (28 B, count only)
   ▼
buoy  ── checks tag, counter, every value and the tier gap; applies all or none; saves to flash
   │
   └── next packet (v5, 46 B) carries the CRC-16 digest of what it runs → console: Confirmed
```

### One registry, three copies held together

[`firmware/lib/scout_settings`](../../firmware/lib/scout_settings/scout_settings.h) is the one
source: IDs (append-only, `1` is the transmit count), keys, defaults and ranges, the tier-gap
rule, and the digest (CRC-16/CCITT-FALSE over the values as little-endian u16 in ID order; the
defaults give `e674`). [`scripts/export_buoy_config.py`](../../scripts/export_buoy_config.py)
writes it into `console/worker/buoy-config.json` (`remote`), and
[`shore/scout_shore/settings.py`](../../shore/scout_shore/settings.py) mirrors it.
`shore/tests/test_settings_registry.py` and `test_console_buoy_config.py` fail if either copy
drifts; the C, Python and JavaScript tests all pin the same digests.

### Settings that survive a power loss

The buoy keeps its settings in retained RAM and in a 28-byte block in flash
([`settings_store.h`](../../firmware/src/drivers/settings_store.h), the `FlashStorage`
emulation): magic, layout version, count, the values, the last command counter, CRC. It writes
only when a command changes the block. A block that is erased, corrupt, from another registry
layout or holding a value the table refuses falls back to the defaults; the next packet reports
the defaults' digest, the shore sees the mismatch and sends the snapshot again. Flashing new
firmware erases the block, so a reflashed buoy starts on its defaults the same way.

### `CMD` version 2: the whole snapshot

One 43-byte frame carries every remote setting (type `0xC1`, version `2`, buoy ID, counter,
count, eight u16 values, a 16-byte HMAC tag over the first 25 bytes, CRC). Sending the whole
snapshot rather than a few changed pairs means one frame always moves a buoy to exactly what the
console wants, whatever state it was in, and needs no separate "restore defaults" command: restore
is just the default snapshot. The buoy runs the same envelope checks as v1 (length, CRC, type,
version, buoy ID, tag, replay, age), then requires the count to equal its own registry size and
the result to pass `scout_settings_valid`; any failure leaves everything unchanged and sets
`CMD_REJECTED`. v1 frames still work and change only the count. A registry change bumps
`SCOUT_SETTINGS_LAYOUT`, so a buoy and shore on different tables refuse each other's frames
instead of misreading them.

### Packet v5 and the console

Packet v5 appends the 2-byte settings digest (46 bytes, ~756 ms on air); the CSV gains a
`settings_digest` column ([data schema](data-schema.md)). The console stores what was asked
(`buoys.tx_count_requested` for the count, so Fleet keeps working; `buoy_settings` rows for the
rest; D1 migration `0010-remote-settings.sql`) and the newest digest each buoy reports. A buoy's
state is **Default** (nothing asked), **Pending**, **Confirmed** (digests match), **Rejected**
(`CMD_REJECTED`) or, before any v5 packet, **Pending** with "no v5 packet yet". Settings → Buoys
has a control per remote setting, sends only what changed, refuses a set the buoy would refuse
before it reaches the radio, and has a hold-to-restore-defaults key. Every change is audited.
`write:settings` API tokens can do the same through `POST /api/v1/buoys/{id}/settings`.

## What was built, and what was not

| Part | State |
|---|---|
| Registry, digest, flash block (`lib/scout_settings`) | Built; 12 native tests |
| `CMD` v2 and the S-line parser (`lib/scout_downlink`) | Built; golden vector shared with `downlink.py`, CI-checked |
| Packet v5, CSV column, S3 row builder | Built; golden vectors and row vectors regenerated |
| Buoy `main.cpp` reads every setting at run time; `SCOUT_DOWNLINK` on in `feather_m0` | Built; compiles (RAM 71%, flash 29%); **never run on hardware** |
| S3 shore sends v2/v1 per buoy; `S` lines over USB; `SCOUT_DOWNLINK` on in `feather_esp32s3_shore` | Built; compiles; **never run on hardware** |
| Python shore client and `sync_console.py` (`S` lines) | Built; tested |
| Console: migration 0010, device API, settings API, REST, Settings → Buoys controls, OpenAPI | Built; tested |
| Battery-life estimate beside each power-affecting control | **Not built**: the battery model (`analytics/telemetry/battery_life.py`) covers the transmit count only |
| Freshness on the old public site and the Python receiver's slot tag | Still assume slot phase 0; the S3 tags against the confirmed phase |
| Bench and field verification of each setting | **Not done**; see below |

## Before a buoy goes in the water

1. Copy `firmware/src/downlink_key_example.h` to `downlink_key.h` with a real 32-byte key per
   buoy, and give the shore the same keys (`SCOUT_CMD_KEY_<id>` for the Python service). The
   shipped builds will not compile without them.
2. Apply D1 migration 0010 to the live console and deploy.
3. On the bench, with a test record per setting ([template](test-record-template.md), pass mark
   written first, row in the [Requirements Test Matrix](requirements-test-matrix.md)): request
   each setting from the console, watch the S3 log `CMD … settings`, the buoy log
   `downlink: applied digest=…`, and the console turn **Confirmed**; then cut the buoy's power
   and confirm it boots with `settings=flash`.
4. Record the SCO-198 power sign-off and the FeatherWing FCC check, which this build assumes.

## Risks

- **Locking a buoy out.** Nothing that affects hearing a command is remote, the frame is all or
  nothing, and the default snapshot is always one console action away. A buoy that still
  misbehaves needs a USB reflash, the same as before.
- **Power.** Every remote setting can raise draw (a 15-minute interval roughly doubles sensing).
  The power tiers still override anything requested.
- **Two shore stations disagreeing.** Already handled: one station is chosen per buoy to send its
  commands (Stations page).
- **Flash wear.** Writes happen only on a real change.
- **Digest collision.** A 16-bit digest could in principle match a different snapshot (1 in
  65,536); the buoy still only ever runs a snapshot it verified, so a false "Confirmed" is the
  worst case.

## Open questions

- Should a request that is never confirmed expire (for example after 7 days), or stay pending
  until someone withdraws it?
- Is the slot phase worth its testing now, or should it wait for a second buoy that needs
  different slots?
