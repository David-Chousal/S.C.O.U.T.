# SX1276 errata §2.1 — the 500 kHz receiver sensitivity fix

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`sx1276-errata`](../sources.md#lora-phy--radio-engineering) · corroborated in [Adafruit_CircuitPython_RFM9x #51](https://github.com/adafruit/Adafruit_CircuitPython_RFM9x/issues/51) and Semtech's own [SX1276Lib driver](https://os.mbed.com/teams/Semtech/code/SX1276Lib/file/7f3aab69cca9/sx1276/sx1276.cpp/) · ❓ access unverified

**What it says.** Errata note §2.1, *Sensitivity Optimization with 500 kHz Bandwidth*: when the LoRa
bandwidth is **≥ 500 kHz**, two undocumented registers must be written to reach the datasheet
sensitivity —

| Register | Value at BW ≥ 500 kHz | Value otherwise |
|---|---|---|
| `0x36` (RegHighBwOptimize1) | `0x02` | `0x03` |
| `0x3A` (RegHighBwOptimize2) | `0x64` | chip-selected automatically |

Semtech's reference driver applies exactly this branch, which is the strongest corroboration
available given the errata PDF itself was not retrievable.

**Why it matters to S.C.O.U.T.** The [modem change to BW500](../../research/fcc-915-mhz-compliance.md)
puts the link squarely in the band this erratum applies to. **It is a receive-side optimization**, and
that asymmetry is the whole point of this note:

- The **buoy is transmit-only** (`LoraLink` has no receive path), so it does not need these writes —
  and does not make them.
- The **shore station is the receiver**, so it does need them. Skipping them there costs sensitivity
  silently, on the exact side of the link that has none to spare: the buoy's antenna sits centimetres
  above conductive seawater and the shore station is the only end that can be given a good antenna and
  height.

Recorded in `shore/scout_shore/receiver.py`'s docstring so it lands with
[SCO-24](https://linear.app/scout1/issue/SCO-24) when the real receiver replaces the mock, rather than
being rediscovered after a disappointing range test.

**Caveat / how to use it.** Unverified on hardware, like the rest of the BW500 change
([SCO-98](https://linear.app/scout1/issue/SCO-98)). Two specific risks:

- These are **undocumented registers**. RadioHead's `RH_RF95` does not expose `spiWrite` publicly, so
  applying them from a sketch needs either a subclass or a different driver — worth knowing before
  the shore receiver is designed around RadioHead.
- If a BW500 range test disappoints, **check this before blaming the modem choice.** A receiver
  missing the erratum will underperform its datasheet sensitivity, which would look exactly like the
  BW500 decision having been wrong when it was not.
