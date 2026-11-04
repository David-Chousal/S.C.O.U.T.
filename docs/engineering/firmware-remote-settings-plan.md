# Firmware Remote Settings Plan

> **Summary** — A plan for every buoy firmware setting the console lists: which ones become
> changeable by radio from the console, which stay firmware-only and why, and the firmware,
> shore, packet and console work to get there. Drafted 2026-11-04 (Phase 2).
>
> **Planning assumption** — written as if every pending sign-off had landed: the transmit-count
> range and the listen window ([SCO-198](https://linear.app/scout1/issue/SCO-198)), the FCC check
> on the shore's transmitter ([OTA design §8](ota-firmware-update-design.md)), the final battery
> pack ([ADR-0007](../decisions/0007-primary-cell-power-source.md)) and the humidity
> calibration ([SCO-204](https://linear.app/scout1/issue/SCO-204)). **None of those is recorded as
> done today.** Nothing here changes a value in [`facts.md`](../hub/facts.md); each step below
> that depends on a sign-off must wait for it to be written down first.

---

## Where things stand

The console's Settings → Buoys lists nine firmware settings, read from
[`config.h`](../../firmware/src/config.h). One of them, the daily transmit count, can already be
changed by radio, but only in a `SCOUT_DOWNLINK` build, which no shipped environment uses:

- The shore station sends one 28-byte `CMD` frame (type `0xC1`, one `setting` byte, one `value`
  byte, HMAC-SHA256 tag) in the 1 s window after the buoy's own packet
  ([OTA design §3](ota-firmware-update-design.md#3-downlink-frames)).
- The buoy confirms by reporting the count in use in its next packet (packet v4, `flags` bits
  8–9) and sets `CMD_REJECTED` (bit 10) when a command fails its checks.
- The count lives in retained RAM, so a power loss puts the buoy back on the default of 3.

That design carries exactly one setting with one 8-bit value and one confirmation field. The
plan below generalises it instead of adding a bespoke path per setting.

## The settings, one by one

| Setting | Today | Plan | Remote range (buoy enforces) | Why |
|---|---|---|---|---|
| Transmits a day | 1–3, default 3; radio in `SCOUT_DOWNLINK` builds only | **Radio** (already built; switch it on) | 1, 2, 3 | Biggest power lever; built and unit-tested |
| Transmit slot phase | 00:10 · 08:10 · 16:10 UTC | **Radio** | Phase 0–15: slots at `phase × 30 min + 10 min`, then +8 h, +16 h | Lets a buoy dodge a local interference window or a second buoy's slots without a reflash. The shore replies right after each packet, so it does not need to know the slot times to deliver a command |
| Sensor reading interval | 30 min | **Radio** | 15, 30, 60 min | Every option keeps a sample at :00, so each slot still sits 10 min after a sample |
| Hydrophone clip length | 60 s at 00:00, 08:00, 16:00 | **Radio** | 0 (off), 15, 30, 60 s | Audio is the costliest sensing step; turning it down or off is the first thing to try on a weak battery |
| Hydrophone sample rate | 22,050 Hz | **Firmware only** | — | The acoustic-summary filter coefficients are generated for this rate ([ADR-0011](../decisions/0011-audio-capture-parameters.md)); a new rate needs new coefficients |
| Conserve threshold | below 3.20 V | **Radio** | 3.00–3.60 V, 10 mV steps | Lets the team tune the tiers to the signed-off pack's real discharge curve |
| Critical threshold | below 3.10 V | **Radio** | 2.90–3.50 V, and at least 50 mV under conserve | Same; the buoy refuses a pair that would invert the tiers |
| Conserve transmit spacing | every 3rd slot | **Radio** | 1–3 | Already a tier rule; exposing it is free once the registry exists |
| Housing humidity alert | 70 %RH | **Radio** | 40–95 %RH | The SCO-204 calibration sets the default; the field may show it needs moving |
| Radio (915 MHz · +11 dBm · BW 500 kHz · SF12 · CR 4/8) | fixed | **Firmware only, never by radio** | — | Set by the FCC modular grant and §15.247. The shore must match the modem bytes exactly, so a remote change that half-applies orphans the buoy |
| Downlink listen window | 1 s after each send | **Firmware only**; on in shipped builds | — | Shortening it by radio could leave no window to undo the change |
| Firmware version / packet version | v0.1.0 · packet v4 | **Read only**; changes by firmware update (OTA is a later, separate design) | — | — |

**Rule for anything added later:** a setting may be changed by radio only if a wrong value
cannot stop the buoy from hearing the next command. Radio parameters, the listen window and the
downlink key never qualify.

## What has to be built

### 1. A settings registry, one source for all three ends

Add a table to `config.h` (or a generated header beside it) listing each remote setting: ID,
name, default, minimum, maximum, step, unit. Extend
[`scripts/export_buoy_config.py`](../../scripts/export_buoy_config.py) to write it into
`console/worker/buoy-config.json` and a matching Python module for the shore, with the existing
drift test failing if any copy disagrees. Setting IDs are append-only; `1` stays the transmit
count. ID `0xFF` means "restore every setting to its default", the escape hatch for a buoy
configured into a corner.

### 2. Settings that survive a power loss

Move the settings from retained RAM into a small block in the SAMD21's flash (the
`FlashStorage` emulation), with a version byte and a CRC. Write it only when a command changes a
value, so wear is a non-issue at a few writes a month. A block that fails its CRC, or a firmware
whose registry version differs, falls back to defaults and says so in the next packet.

### 3. `CMD` version 2: several settings per frame

One frame per listen window and one window per transmit slot means a five-setting change would
take two days at three slots a day. Version 2 of the frame carries up to four
`(setting u8, value u16)` pairs under the same tag, counter and CRC: 37 bytes instead of 28, still
inside `DOWNLINK_FRAME_MAX_MS`. The buoy validates **every** pair against the registry before
applying **any**, so a frame is all or nothing; a failure sets `CMD_REJECTED` as today. Version 1
frames stay accepted.

### 4. Packet v5: confirm any setting, not just the count

Add a 2-byte **settings digest** (CRC-16 of the active settings block) to the uplink, taking the
packet from 44 to 46 bytes. The console computes the same digest from the requested values: a
match means every requested setting is in use. Bits 8–9 keep reporting the transmit count so v4
readers still work. Update `scout_packet.h`, `shore/scout_shore/packet.py`,
[`data-schema.md`](data-schema.md) and `check_packet_contract.py` together.

### 5. Shore station

`downlink.py` builds version-2 frames from the console's list, holds one pending frame per buoy,
and keeps re-sending it after each of that buoy's packets until the digest matches or the
console withdraws the request. Keys stay in `SCOUT_CMD_KEY_<id>`, never in the console.

### 6. Console

- Generalise `buoys.tx_count_requested` into a `buoy_settings` table
  (`buoy_id`, `setting_id`, `requested_value`, `requested_by`, `requested_at`), with a migration
  that carries the existing transmit-count requests over.
- `GET /api/device/settings` returns every requested setting per buoy; the worker validates
  writes against the registry ranges, so it refuses what the buoy would refuse.
- Settings → Buoys turns each remote row into a control for members: requested vs in use,
  **pending** until the digest matches, **rejected** when `CMD_REJECTED` comes back, a battery-life
  estimate beside anything that changes power draw, and a hold-to-confirm **Restore defaults**.
  Firmware-only rows stay read-only and say why. Every change lands in the audit log as today.
- `write:settings` API tokens gain the same settings, with the same validation.

## Order of work

| Step | Work | Depends on | Owner |
|---|---|---|---|
| 1 | Turn `SCOUT_DOWNLINK` on in the shipped environment; bench-test the transmit count end to end | SCO-198 power sign-off and the FCC check, written down | David, Isabella (bench) |
| 2 | Flash-backed settings block, with defaults on a bad CRC | Step 1 | David |
| 3 | Registry, export script, drift tests | — | David |
| 4 | `CMD` v2 and packet v5, both ends, golden vectors | Steps 2, 3 | David |
| 5 | Console table, API, Settings → Buoys controls | Step 3 | David |
| 6 | Add the settings in the table above, cheapest-to-verify first: humidity alert, audio clip, reading interval, power thresholds, slot phase | Steps 4, 5; ADR-0007 and SCO-204 for their defaults | David |
| 7 | Bench verification per setting, then one field check in Phase 4 | Each setting | Isabella (bench), John Ryan (field) |

Each verification in step 7 is written up with the
[test record template](test-record-template.md), with the pass mark set before the run, and added
to the [Requirements Test Matrix](requirements-test-matrix.md).

## Risks

- **Locking a buoy out.** Handled by the rule above (nothing that affects hearing a command is
  remote), the all-or-nothing frame, and the `0xFF` restore. A buoy that still misbehaves needs a
  USB reflash, which is the same as today.
- **Power.** Every remote setting can raise draw. The console shows the battery-life estimate
  before the change is sent, and the buoy's power tiers still override anything requested.
- **Two shore stations disagreeing.** Already handled: one station is chosen per buoy to send
  its commands (Stations page).
- **Flash wear.** Writes happen only on a real change; no realistic use comes near the
  endurance limit.

## Open questions

- Should a setting change expire if it is never confirmed (for example after 7 days), or stay
  pending until someone withdraws it?
- Is the slot phase worth the extra testing in this version, or should it wait for a second
  buoy that actually needs different slots?
