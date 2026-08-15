# State Snapshot — 2026-08-15 (turbidity polarity)

> **Summary** — Dated snapshot of where S.C.O.U.T. stood on this day. Snapshots are append-only
> history; the always-current view is [`status.md`](../status.md). Third entry for 2026-08-15,
> after the telemetry drift work and the firmware link work.
>
> Part of the [Knowledge Hub](README.md).

---

**Phase:** 0 — Kickoff (2026-08-14 – 2026-09-04)

## Where the project stands

Phase 0's three hardware blockers are unchanged. This entry closes the loop on the polarity
question raised earlier today, which turned out to be larger than it looked.

## Resolved today

**A higher `turbidity_adc` count means CLEARER water.** The DFRobot datasheet settles it
outright — *"Analog Signal Output, the output value will decrease when in liquids with a high
turbidity"* — with clear water (< 0.5 NTU) at ≈ 4.1 V. The SEN0189 measures transmittance, so
particles blocking light lower its output, and the firmware logs raw `analogRead` with no
inversion. No bench session was needed to settle the direction; the datasheet is explicit.

**Three modules had it backwards**, not one:

1. `turbidity.py` flagged **positive** excursions as "dirtier water" — it was reporting each
   day's *clearest* readings as sediment plumes, on a public dashboard.
2. `drift.py` took the **10th percentile** as the day's "clean-water floor". With the real
   polarity that is the *dirtiest* reading of the day — precisely the runoff events the method
   exists to exclude. Now the 90th percentile, renamed to "clean-water reading".
3. The shore simulator generated turbidity events as an ADC **rise** (500 → 900), so the sample
   data feeding the public dashboard was physically inverted too. Now 3300 → 2000.

Worth recording honestly: yesterday's note claimed the drift screen was "sign-agnostic and
therefore safe either way." That was right about the *detection* — a monotonic march is caught
in both directions — but wrong overall, because the **percentile** that feeds it was directional
and sat on the wrong tail. Sign-agnostic detection over the wrong input is still wrong.

## Raised today

**A constraint the ECE track needs.** The SEN0189 swings to 4.5 V and the SAMD21 ADC tops out
at 3.3 V, so a level-shifting front end sits between them — still undesigned under
[ADR-0002](../../decisions/0002-lifepo4-charging-path.md). It **must be non-inverting** (a
divider or buffer, not an inverting amplifier), or this convention and every analytic built on
it silently flip. Recorded in [`facts.md`](../facts.md) and
[Data Schema](../../engineering/data-schema.md).

## Still blocking

Unchanged — all three are ECE/hardware decisions:

1. LiFePO₄ charging path ([SCO-10](https://linear.app/scout1/issue/SCO-10))
2. Hydrophone part number ([SCO-8](https://linear.app/scout1/issue/SCO-8))
3. Dissolved-oxygen inclusion ([SCO-11](https://linear.app/scout1/issue/SCO-11))
