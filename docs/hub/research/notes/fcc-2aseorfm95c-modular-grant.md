# FCC ID 2ASEORFM95C — the modular grant our radio actually operates under

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`fcc-2aseorfm95c`](../sources.md#lora-phy--radio-engineering) · [grant](https://fccid.io/2ASEORFM95C) · [test report](https://fccid.io/2ASEORFM95C/Test-Report/Test-Report-4184769) · 🔓 public filing

**What it says.** The shielded RFM95C module on the Adafruit Feather M0 (PID 3178, revised
August 2019) holds a **Single Modular Approval** from Shenzhen HOPE Microelectronics under
FCC Part 15C. The grant's material terms:

| Term | Value |
|---|---|
| Equipment class | **DTS — Digital Transmission System** |
| Frequency | 915.0 MHz |
| Certified conducted power | **0.0145 W = 11.6 dBm** |
| Tested antenna | Reverse-SMA whip, **2.15 dBi** |
| Antenna condition | *"Only those antennas tested with the device or similar antennas with equal or lesser gain may be used"* |
| RF exposure | *"minimum separation distance of at least 20 cm from all persons"* |
| Co-location | *"must not be co-located or operating in conjunction with any other antenna or transmitter"* |
| Labelling | End product must carry **"Contains FCC ID: 2ASEORFM95C"** |

**Why it matters to S.C.O.U.T.** A modular grant is inherited, not free: FCC guidance
([`fcc-kdb-996369`](../sources.md#lora-phy--radio-engineering)) puts the burden on the
integrator to keep output power and transmission parameters inside the certified envelope, and
failing that invalidates the approval — pushing the end product into full intentional-radiator
certification.

The single most consequential line is **equipment class DTS**. DTS is the
[§15.247(a)(2)](cfr-15-247-ism-band-rules.md) digital-modulation route, which mandates a 6 dB
bandwidth of at least 500 kHz. Three things follow:

1. **BW500 is the mode the module is certified in.** The 2026-09-01 modem change was not merely
   the better engineering option — it moved the radio *into* its certified configuration.
2. **The old BW125 single-channel config was outside the grant**, independently of whether it
   satisfied §15.247 on its own terms.
3. **Frequency hopping would have voided the grant.** The module is not certified FHSS. Option A
   in the [compliance analysis](../../research/fcc-915-mhz-compliance.md) was the more expensive
   regulatory choice as well as the worse engineering one — which was invisible until the grant
   was located.

Power was a second, separate miss: the firmware set **+14 dBm** against a certified **11.6 dBm**.
Reduced to +11 dBm, costing 3 dB against the 6.5 dB the bandwidth change gained — net ~3.5 dB
better than before, and now inside the grant on both counts.

**Caveat / how to use it.** Three live constraints, in the order they are likely to bite:

- **The antenna cap (2.15 dBi) is the trap.** If [SCO-14](https://linear.app/scout1/issue/SCO-14)'s
  over-water range test disappoints, the instinctive fix is a higher-gain antenna — and that
  voids the grant. The compliant levers are spreading factor (already at SF12), antenna *height*,
  and the buoy-relay topology. The same cap applies to the shore station if it uses this module,
  which is awkward: the shore end is exactly where gain would be easiest to add.
- **Co-location constrains future hardware.** Adding a second transmitter — cellular backhaul, a
  satellite fallback — needs FCC multi-transmitter procedures. GPS
  ([SCO-62](https://linear.app/scout1/issue/SCO-62)) is receive-only and does not trigger this.
- **The label is a physical-design item with a deadline.** "Contains FCC ID: 2ASEORFM95C" must
  appear on the enclosure; the housing is being engraved and printed now
  ([SCO-103](https://linear.app/scout1/issue/SCO-103)). Cheap today, a reprint later.

Note the grant covers the **module**, not our end product. It survives integration only while the
conditions hold — and it does not answer whether the *system* needs its own authorization, which
is [`cfr-15-23`](cfr-15-23-home-built-exemption.md)'s question.
