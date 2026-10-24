# Over-the-Air Firmware Update Design (Draft)

> **Summary** — How the shore station sends new firmware and settings to a deployed buoy over
> LoRa, as [ADR-0008](../decisions/0008-over-the-air-firmware-updates.md) requires. After each
> send, the buoy listens for **1 s**. If the shore has something for it, the shore sends a short
> signed offer in that time. Firmware then arrives in **128-byte chunks**, 16 per burst, with
> one acknowledgement per burst that marks which chunks arrived. Partial images are saved on the
> SD card and resume in the next slot. An image is applied only after its **Ed25519 signature**
> and **SHA-256 hash** check out. A rebuilt SD-update boot stub keeps the last good image on the
> SD card and **restores it** if the new one fails to check in within 3 boots. **Power:** the
> listen windows cost ≈ 0.019 mAh/day (0.14% of the 13.3 mAh/day budget), and one full update
> costs ≈ 8.6 mAh. **Draft, not agreed:** the window length goes into Isabella's power budget and
> needs her sign-off, and every current figure is a datasheet estimate until it is measured on
> the bench.
>
> Owner: David Chousal Cantu (CSEN). Power sign-off: Isabella Rodriguez (ECEN). Linear:
> [SCO-197](https://linear.app/scout1/issue/SCO-197). Unblocks
> [SCO-198](https://linear.app/scout1/issue/SCO-198) (configurable transmit count).

---

## Status

| Part | State |
|---|---|
| Listen window after each send | **Proposed: 1 s.** Needs Isabella's agreement (§2) |
| Chunked transfer and resume | Proposed (§4) |
| Authentication | Proposed (§5) |
| Boot stub and rollback | Proposed (§6). Arduino's SDU stub needs rebuilding for the Feather M0 RFM95 |
| Power budget and ADR-0007 lifetime re-run | Figures in §7. Isabella's budget document not updated yet |
| Shore transmit compliance | **Open.** The RFM95W FeatherWing's FCC authorization has not been checked (§8) |
| Firmware | Not started. Build follows agreement on this design |

## 1. Constraints this design has to fit

| Constraint | Value | Source |
|---|---|---|
| Modem | 915 MHz · BW 500 kHz · SF12 · CR 4/8 · +11 dBm, on both buoy and shore | [facts.md](../hub/facts.md), `firmware/src/config.h` |
| Frame ceiling | **140 B payload** (+4 B RadioHead header = 1,739 ms), from the 2 s send timeout | [SCO-97](https://linear.app/scout1/issue/SCO-97) |
| Uplink | 30-byte packet in 3 fixed slots a day (00:10, 08:10, 16:10 UTC), never acknowledged | [SCO-165](https://linear.app/scout1/issue/SCO-165), [SCO-21](https://linear.app/scout1/issue/SCO-21) |
| Next wake after a slot | Sensor wake at :30, 20 min after the slot | `config.h` |
| Watchdog | 16.4 s (`WDT_TIMEOUT_MS`) | `config.h` |
| Flash | SAMD21G18: 256 KB. Arduino bootloader uses the first 8 KB | ADR-0001 |
| Image today | ≈ 66.6 KB | SCO-197 |
| SD card | Adalogger FeatherWing, CS = pin 10 | `config.h` `PIN_SD_CS` |
| Power tiers | NORMAL / CONSERVE / CRITICAL by battery voltage | `config.h` |

**Every OTA frame stays within the 140-byte ceiling**, so both radios keep one timeout and one
contract check. A 128-byte chunk in a 136-byte frame takes 1,739 ms on air. A full 251-byte
frame would carry 87% more data but take 2.9 s, beyond the 2 s timeout. With the smaller frame
the image takes 15.4 min of airtime instead of 14.0 min, which is worth it to keep one limit
(§4).

## 2. Listen windows — for Isabella

**Proposal: after every uplink in NORMAL and CONSERVE, the radio switches to receive for a
fixed 1.0 s window, then sleeps.** CRITICAL sends nothing and therefore listens to nothing.

- **The shore only transmits when it has something to send** (a settings command, a firmware
  offer, or a trial confirmation, see §6). It heard the buoy's uplink a moment earlier, so it
  knows the buoy is awake and listening. Most windows stay empty.
- **The window only has to catch the start of a frame.** The shore needs to finish receiving,
  turn around, and send a 100 ms preamble. The ESP32-S3 should turn around in tens of
  milliseconds; 1 s leaves room for FreeRTOS and WiFi scheduling delays. If the buoy detects a
  valid header inside the window, it keeps the radio on until that frame finishes.
- **The window is a `config.h` constant**, so the bench measurement can shorten it. The shore
  turnaround time is still unmeasured.

**Cost per window**, assuming RX ≈ 12 mA (SX1276 datasheet, BW 500 kHz, *to measure*) plus the
SAMD21 awake at 11 mA, for 23 mA in total:

| Window | mA·s/day (3 slots) | mAh/day | Share of 13.3 mAh/day | Two-D-cell life, sensors only |
|---|---|---|---|---|
| 0.5 s | 34 | 0.010 | 0.07% | 1,785 → 1,784 d |
| **1.0 s (proposed)** | **69** | **0.019** | **0.14%** | **1,785 → 1,783 d** |
| 2.0 s | 138 | 0.038 | 0.29% | 1,785 → 1,780 d |
| 5.0 s | 345 | 0.096 | 0.72% | 1,785 → 1,772 d |

With the hydrophone's best-estimate 30.3 mAh/day, two cells last 785 days either way: a 1 s
window does not move the result. **The windows are not the problem. The risk is a radio left in
receive by a firmware bug:** 12 mA continuously is 288 mAh/day, about 20 times the whole budget.
The design guards against it in three ways. A hard time limit ends every window and every
session (§4). The radio goes back to sleep on every exit path. The watchdog reset path puts the
radio to sleep before anything else.

**What Isabella needs to confirm or measure:**

1. RX current at BW 500 kHz on the bench (the same setup as the transmit measurement in the build
   plan), and whether the SAMD21 can sleep while the radio listens (§7).
2. That 1 s × 3 a day may go into the budget as its own line item.
3. That a 6-minute OTA session at ≈ 23 mA average (≈ 111 mA peaks for 0.36 s during
   acknowledgements) is acceptable on the Li-SOCl₂ cells, given the voltage-sag and passivation
   risks already listed in the [Power Budget Update](power-budget-update-2026-10-05.md).

**Receiving at BW 500 kHz needs the SX1276 errata fix on the buoy too.** The shore already
writes `0x36 ← 0x02` and `0x3A ← 0x64`
([note](../hub/research/notes/sx1276-errata-500khz.md)); without it, the receiver silently loses
sensitivity. `LoraLink::begin()` gains the same two writes.

## 3. Downlink frames

All downlink frames start with a 1-byte type and the 2-byte buoy ID (0 = all buoys).

| Type | Direction | Payload | Size | Authenticated by |
|---|---|---|---|---|
| `CMD` | shore → buoy | 32-bit counter, setting ID, value, 16-byte HMAC tag | ≤ 40 B | HMAC-SHA256 (§5) |
| `OTA_OFFER` | shore → buoy | Signed manifest (below) | 124 B | Ed25519 (§5) |
| `OTA_CHUNK` | shore → buoy | Session ID (2), chunk index (2), length (1), CRC-16 (2), data (≤ 128) | ≤ 136 B | Image hash at the end |
| `OTA_ACK` | buoy → shore | Session ID, first chunk index of the burst, 16-bit received bitmap, battery tier | 12 B | None needed (§5) |
| `CONFIRM` | shore → buoy | Version being confirmed + HMAC tag | ≤ 40 B | HMAC-SHA256 |

**Manifest** (52 bytes + 64-byte signature): magic, target buoy ID, firmware version (u32,
must be higher than the running version), image length, SHA-256 of the image, chunk size,
build timestamp.

## 4. Transfer: bursts, acknowledgements, resume

1. **The offer arrives in a listen window.** The buoy accepts it only in NORMAL. It checks the
   signature, buoy ID and version, then sends an `OTA_ACK` with an all-zero bitmap to mean
   "ready".
2. **The shore sends a burst of 16 chunks**, about 30 s including turnarounds. The buoy writes
   each chunk to `FW/RX.BIN` on the SD card at offset `index × 128` and sets a bit in
   `FW/RX.MAP`, a 67-byte bitmap for 533 chunks. It feeds the watchdog after every chunk.
3. **After each burst the buoy sends one `OTA_ACK`** with a bitmap of the 16 chunks it received.
   The shore resends what is missing in the next burst. This acknowledges each chunk while
   costing one uplink per 16 chunks instead of 16.
4. **A session ends** after 6 minutes, when every chunk has arrived, when the battery drops out
   of NORMAL, or when two bursts in a row are missed entirely. It ends well before the
   :30 sensor wake. **A session is about 12 bursts, ≈ 192 chunks, ≈ 24 KB.**
5. **Resume:** `RX.BIN` and `RX.MAP` survive reboots and sleep. At the next slot the shore
   offers the same manifest again, and the buoy reports which chunks it already has. A new
   manifest (another version) discards the partial image.

**Total time:** 533 chunks, 15.4 min of airtime, ≈ 17 min including turnarounds, so **three
sessions, or one day of slots**, plus retries. In CONSERVE the buoy listens only in the single
slot it still uses, and accepts settings commands but not firmware.

## 5. Proving the image is genuine

There are two kinds of key, so that a compromised shore station cannot install firmware:

| What | Mechanism | Key lives | If it leaks |
|---|---|---|---|
| **Firmware** | **Ed25519** signature over the manifest; the manifest commits to the SHA-256 of the image | Private key **offline**, on the release machine. The buoy holds only the public key in flash | Re-key over USB. The shore never holds the key, so taking over the shore cannot install firmware |
| **Settings commands** | **HMAC-SHA256**, 16-byte truncated tag, plus a 32-bit counter the buoy requires to increase | Per-buoy 32-byte secret on the buoy and the shore | The attacker can change settings only within limits the buoy enforces (e.g. transmit count 1–6), not firmware |

- **Library:** Monocypher (portable C, CC0/BSD, no allocations) for Ed25519. Its flash and CPU
  cost on a 48 MHz Cortex-M0+ is *to benchmark*; §7 allows up to 5 s of CPU per check.
  SHA-256 and HMAC use a small separate implementation.
- **Order of checks:** check the manifest signature before accepting any chunk, so a forged offer
  costs one frame. The CRC on each chunk catches radio errors early. The **SHA-256 over all of
  `RX.BIN`** must match the signed hash before the file is renamed for the boot stub.
- **Replay and downgrade:** the manifest version must be higher than the running version, and
  each command counter must be higher than the last. To go back to old code, rebuild it with a
  new version number and sign it again.
- **Acknowledgements are not authenticated.** A forged ACK can only make the shore skip a chunk,
  and the hash check then fails, so the cost is wasted airtime, not a bad image.

## 6. Boot stub and rollback

Arduino's SD-update stub (`SDUBoot`, LGPL-2.1, in `ArduinoCore-samd/libraries/SDU`) is a 16 KB
stub at `0x2000` that runs before the sketch at `0x6000`. At boot it flashes `UPDATE.BIN` if
the file exists, deletes it, and jumps to the sketch. **It cannot be used unchanged:**

- Its default SD chip-select is **pin 4, the RFM95 reset line** on this Feather; the Adalogger
  uses pin 10.
- It **flashes without checking** anything, and it **has no rollback.**

**Plan: a modified stub (`scout_boot`), built once and flashed over USB**, never over the air,
with this layout:

```
0x00000  Arduino bootloader (8 KB)       untouched
0x02000  scout_boot stub (16 KB)         USB only
0x06000  application (≤ 232 KB)          replaced by OTA
SD: FW/GOOD.BIN   last confirmed image   FW/UPDATE.BIN   verified, waiting to flash
    FW/STATE.BIN  boot state, written as two copies with a sequence number (survives a write cut by power loss)
```

| State | What the stub does at boot |
|---|---|
| `IDLE` | Jump to the application |
| `PENDING` (set by the application after the §5 checks) | Check `UPDATE.BIN`'s CRC-32 against the one in `STATE.BIN`, flash it, set `TRIAL`, attempts = 0. If power is lost while flashing, the state is still `PENDING` and it simply flashes again |
| `TRIAL` | Increment attempts. If attempts > 3: flash `GOOD.BIN`, set `IDLE` + "rolled back" flag. Otherwise jump to the application |

**The new image confirms itself only when it has proved it can still be updated.** It must
complete a full wake (sense, log, sleep), send in a slot, and **hear the shore's authenticated
`CONFIRM` in a listen window.** Only then does it copy `UPDATE.BIN` to `GOOD.BIN` and set `IDLE`.
An image that hangs or crashes uses up its 3 attempts through the watchdog. An image that runs
but cannot hear the shore is detected by the application itself: after 3 slots in `TRIAL` with no
`CONFIRM`, it marks the state for rollback and resets.

- **First boot after USB flashing:** the application copies its own flash area into `GOOD.BIN`,
  so a known-good image always exists without sending one over the air.
- **The next uplink reports the outcome** (applied / rolled back + version). That needs a flag
  bit in the 30-byte packet; allocating one is a packet-contract change made with the build.
- **Remaining risk, accepted:** an image that runs, never resets, and has broken trial logic
  would stay. The trial logic lives in a shared library that changes rarely and is tested on the
  bench before every release.

## 7. Power cost

Same assumptions as §2: RX 12 mA + MCU 11 mA = 23 mA, TX ≤ 100 mA + MCU 11 mA = 111 mA, SD
write 50 mA for 30 ms per chunk.

| Item | Per event | How often | Per year |
|---|---|---|---|
| Listen windows (1 s × 3) | 0.019 mAh/day | Every day | ≈ 7 mAh |
| Full 66.6 KB update, ideal | 6.9 mAh (533 chunks, 34 ACKs) | Per release | — |
| **Full update, +25% retries** | **≈ 8.6 mAh** | 4–12 releases/yr | **35–104 mAh** = 0.15–0.44% of two cells (23,800 mAh usable) |
| Signature + hash check | ≤ 55 mA·s (≤ 5 s CPU, *to benchmark*) | Per release | negligible |

**One update costs about two-thirds of a day's sensors-only budget.** The ADR-0007 lifetime
result does not change: two cells still last ≈ 1,780 days without the hydrophone, ≈ 785 days
with it (best estimate). A possible saving, to try on the bench: put the SAMD21 to sleep while
the radio listens and wake it on the radio's DIO0 interrupt. That would cut the 23 mA to about
12 mA.

## 8. Shore transmit compliance

The shore now transmits: offers, chunks, commands, about 15 min of airtime per release plus
seconds a day. Under ADR-0008 and the FCC review:

- Transmit power **≤ +11 dBm** (the shore uses the same modem settings as the buoy), through an
  antenna of **≤ 2.15 dBi**. A high-gain antenna stays possible for receive only.
- The 500 kHz digital-modulation route has no dwell limit, so a 15-minute transfer is allowed.
- **Still open:** the RFM95W FeatherWing's own FCC authorization. This design does not settle
  it, and the shore must not transmit off the bench until it is checked
  ([SCO-104](https://linear.app/scout1/issue/SCO-104), FCC Review Brief Q7).

## 9. What changes elsewhere when this is built

- `LoraLink`: receive path, errata registers, `listen(ms)`, sleep on every exit.
- SCO-165 schedule: "radio sleeps after every send" becomes "radio listens 1 s, then sleeps".
- Packet contract: one status bit for update outcome (`scout_packet.h`, `shore/scout_shore/packet.py`,
  `check_packet_contract.py`).
- Shore: transmit path, offer/burst scheduler, signed-bundle intake (the shore relays bundles that
  were signed on the release machine and never signs firmware itself).
- Release tooling: a script that builds, hashes, signs and writes the manifest.

## Sources

- Semtech SX1276/77/78/79 datasheet rev 4 — time-on-air formula (p. 31), RX/TX currents.
- Semtech SX1276 errata 2.1, 500 kHz sensitivity — [reading note](../hub/research/notes/sx1276-errata-500khz.md).
- Arduino `SDUBoot.ino`, ArduinoCore-samd —
  <https://github.com/arduino/ArduinoCore-samd/tree/master/libraries/SDU> (layout, default CS pin,
  no verification or rollback, read 2026-10-23).
- Monocypher — <https://monocypher.org/> (Ed25519 via its optional `monocypher-ed25519`).
- RFC 8032 (Ed25519) — <https://www.rfc-editor.org/rfc/rfc8032>; RFC 2104 (HMAC) —
  <https://www.rfc-editor.org/rfc/rfc2104>.
- [Power Budget Update 2026-10-05](power-budget-update-2026-10-05.md) — base budget, cell
  capacity, 70% derating.
