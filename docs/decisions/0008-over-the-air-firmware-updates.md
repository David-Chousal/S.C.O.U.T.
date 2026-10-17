# ADR-0008 — Over-the-Air Firmware Updates (Two-Way LoRa Link)

- **Status:** 🟢 Accepted — 2026-10-16 (go decision; protocol design still to be done)
- **Date raised:** 2026-10-16 (proposed by Navid Shaghaghi at the lab session)
- **Owners:** CS lead (David Chousal Cantu); ECE lead consulted on power and antennas
- **Blocks:** [SCO-198](https://linear.app/scout1/issue/SCO-198) (configurable transmit count),
  the shore-station transmit path in [SCO-24](https://linear.app/scout1/issue/SCO-24)

---

## Context

The buoy has been **transmit-only** since the first firmware: it sends a 30-byte packet in three
fixed slots a day ([SCO-165](https://linear.app/scout1/issue/SCO-165)) and the radio sleeps the
rest of the time. Every firmware change would therefore need someone to reach the buoy by boat,
open the sealed housing and reflash it over USB. Navid proposed that the shore station push new
firmware over LoRa instead: the buoy stores the image on the Adalogger's SD card and a bootloader
loads it on reboot. The same downlink also lets the dashboard change settings, starting with the
daily transmit count ([SCO-198](https://linear.app/scout1/issue/SCO-198)).

## Options

### Option A — stay transmit-only

**Pros**
- No receive time in the power budget; simplest firmware.
- The shore station never transmits, so the FCC antenna cap never applies to it.

**Cons**
- Every fix or setting change needs a boat trip and an opened housing, which also risks the seal.

### Option B — two-way link with OTA updates (chosen)

**Pros**
- Fixes and settings reach a deployed buoy without retrieval.
- Enables runtime configuration from the dashboard.

**Cons**
- **Power:** the buoy must listen. RX draws roughly 10–12 mA, and the 13.3 mAh/day budget has no
  receive time; listen windows must be sized against the ADR-0007 D-cell lifetime.
- **FCC:** the shore station becomes a transmitter. The 2.15 dBi antenna cap and certified power
  limit then apply to it while it transmits, and its LoRa FeatherWing (RFM95W) needs its own
  authorization checked ([FCC Review Brief](../research/fcc-review-brief.md), Q7).
- **Security:** anyone in range with a LoRa radio could otherwise reflash the buoy, so images must
  be authenticated, not just checksummed.
- **Airtime:** today's ~66.6 KB image is ~270 full frames (251 B) at ~2.9 s each, ~13 min on air
  before acknowledgements, so an update spans several sessions.

## Decision

**Option B — go (David, 2026-10-16).** Build OTA updates and a settings downlink. The design
must cover, at minimum:

1. **Listen windows** tied to the transmit slots (e.g. a short receive window after each send),
   with the power cost agreed with Isabella before the window length is fixed.
2. **Image transfer** in chunks with per-chunk acknowledgement and resume across sessions,
   staged on the SD card.
3. **Integrity and authentication** of the full image before it is applied.
4. **Rollback:** if the new image fails to check in (e.g. trips the watchdog), boot the previous one.
5. **Shore transmit compliance:** shore transmit power and antenna within the limits that apply
   to it (see Consequences).

## Consequences

- `LoraLink` gains a receive path; SCO-165's "radio sleeps after every send" becomes "radio
  listens briefly, then sleeps".
- The FCC brief's Q7 answer (a receive-only shore may use a high-gain antenna) **only holds while
  the shore is not transmitting.** A shore antenna used for both directions must meet the transmit
  limits; a separate high-gain receive antenna is still possible.
- The power budget and the ADR-0007 lifetime case must be re-run with receive time included.
- MVP risk: this is new protocol work against a 2026-12-04 MVP target. Sensing and the uplink take
  priority if time runs short.

## References

- [SCO-197](https://linear.app/scout1/issue/SCO-197), [SCO-198](https://linear.app/scout1/issue/SCO-198)
- [Meeting notes, 2026-10-16](../planning/meeting-notes.md)
- [FCC Review Brief](../research/fcc-review-brief.md)
- [ADR-0007 — power source](0007-primary-cell-power-source.md)
