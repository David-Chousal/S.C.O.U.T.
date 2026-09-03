# Semtech AN1200.13 — LoRa airtime, and why we compute it rather than quote it

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`semtech-an1200-13`](../sources.md#lora-phy--radio-engineering) · [pdf](https://www.mouser.com/pdfdocs/semtech-lora-modem-design.pdf) · 🔓 vendor documentation

**What it says.** The modem designer's guide gives the closed-form time-on-air for a LoRa frame.
Symbol time is `T_sym = 2^SF / BW`; the preamble occupies `(n_preamble + 4.25)` symbols; the payload
occupies

```
8 + max(ceil((8·PL − 4·SF + 28 + 16·CRC − 20·IH) / (4·(SF − 2·DE))) · (CR + 4), 0)
```

symbols, where `DE` is LowDataRateOptimize (required when `T_sym` exceeds 16 ms) and `IH` is implicit
header mode. Airtime is the sum, and it is **highly non-linear in SF** — each step roughly doubles it.

**Why it matters to S.C.O.U.T.** Almost every question the project has asked about the radio turns out
to be an airtime question in disguise, and airtime is cheap to compute and expensive to guess:

- **Is the packet size a real constraint?** No. At the shipped config a 30-byte frame is ~559 ms once
  per day — 0.0019% duty cycle, ~20 mAh per *year*. The 82 B "ceiling" was never where a limit sat
  ([SCO-40](https://linear.app/scout1/issue/SCO-40), [SCO-97](https://linear.app/scout1/issue/SCO-97)).
- **Can we raise SF for range?** Only off the hopping route. Under §15.247's 400 ms dwell the formula
  says SF10 puts a 30-byte frame past one dwell — which is what made BW500 the better fix
  ([`cfr-15-247`](cfr-15-247-ism-band-rules.md)).
- **Will a config change hang the watchdog?** `SCOUT_LINK_AIRTIME_MS` is derived from this formula and
  asserted against the transmit budget in `firmware/test/test_link`, so the answer is checked in CI
  rather than discovered in the water.

Implemented in [`scripts/lora_airtime.py`](../../../scripts/lora_airtime.py) — run it rather than
quoting numbers from this note.

**Caveat / how to use it.** Two easy mistakes, both of which cost real accuracy:

1. **Include the RadioHead header.** `RH_RF95` prepends 4 bytes (to/from/id/flags), so a 30-byte
   S.C.O.U.T. packet is a 34-byte frame on air. Omitting it under-reports airtime by ~10%.
2. **Do not forget `DE`.** LowDataRateOptimize is mandatory when symbol time exceeds 16 ms — true at
   BW125/SF11–12, false at BW500/SF12 (8.192 ms). Getting it wrong changes the payload-symbol count.

The formula gives airtime exactly; the **sensitivity** figures paired with it in the compliance
analysis are a separate, cruder thermal-noise model (`−174 + 10·log₁₀(BW) + NF + SNR_limit`). Trust
the airtime; treat the dBm as relative comparison only until measured on hardware
([SCO-98](https://linear.app/scout1/issue/SCO-98)).
