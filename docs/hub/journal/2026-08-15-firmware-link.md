# State Snapshot — 2026-08-15 (firmware link reliability)

> **Summary** — Dated snapshot of where S.C.O.U.T. stood on this day. Snapshots are append-only
> history; the always-current view is [`status.md`](../status.md). Second entry for 2026-08-15;
> the first covers the telemetry drift work.
>
> Part of the [Knowledge Hub](README.md).

---

**Phase:** 0 — Kickoff (2026-08-14 – 2026-09-04)

## Where the project stands

Phase 0's three blockers are unchanged and all remain hardware calls. Today's work continued
down the software-only CSEN track:
[SCO-21](https://linear.app/scout1/issue/SCO-21), daily-packet delivery reliability.

## Changed today

- **CR 4/8 + blind repetition implemented.** The daily packet now goes out three times in
  NORMAL (once in CONSERVE, never in CRITICAL), spaced with widening gaps so the copies do not
  share a single fade, with no acknowledgement and no retransmit. Policy lives in the new
  hardware-free `firmware/lib/scout_link` and is unit-tested off-target, including a guard that
  the repeat schedule cannot outrun the 16 s watchdog.
- **The shore station now deduplicates** on `(buoy_id, record_seq)`. This was not in the
  ticket, but blind repetition without it would have written three identical CSV rows per day
  and pushed `qc.py`'s completeness figure to 100% while real gaps went unnoticed.
- **Spreading factor deliberately left at SF7.** RadioHead's only stock CR 4/8 presets force
  SF12, whose ~2.2 s airtime for a 30-byte frame would overrun the transmit budget *and* the
  400 ms per-channel dwell limit in FCC 15.247. Whether that rule binds S.C.O.U.T. is
  [SCO-19](https://linear.app/scout1/issue/SCO-19), still open, so the SF choice was left to it.

## Raised today

- **The firmware had never compiled for its own target.** Three independent breakages had
  accumulated on `main`: a `platformio.ini` dependency ID that does not resolve, a `class Rtc`
  colliding with the SAMD21 CMSIS `Rtc` peripheral union, and `PM->RCAUSE.bit.WDT` expanding
  the CMSIS `WDT` macro. All three are fixed; the build is clean at RAM 18.8%, Flash 22.6%.
- **Root cause was a CI gap, not carelessness.** CI ran only `pio test -e native`, which
  excludes `src/` and never includes CMSIS — it structurally cannot catch a target compile
  break. `pio run -e feather_m0` is now a CI step, so this cannot recur.
- Consequence worth noting: every firmware claim made before today rested on unit tests of the
  hardware-free libraries only. Those tests were and remain valid; the target build was not
  being checked at all.

## Still blocking

Unchanged — all three are ECE/hardware decisions:

1. LiFePO₄ charging path ([SCO-10](https://linear.app/scout1/issue/SCO-10))
2. Hydrophone part number ([SCO-8](https://linear.app/scout1/issue/SCO-8))
3. Dissolved-oxygen inclusion ([SCO-11](https://linear.app/scout1/issue/SCO-11))
